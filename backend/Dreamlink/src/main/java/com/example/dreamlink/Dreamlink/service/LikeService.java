package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.LikeResponse;
import com.example.dreamlink.Dreamlink.dto.MutualMatchResponse;
import com.example.dreamlink.Dreamlink.entity.*;
import com.example.dreamlink.Dreamlink.enums.Entitlement;
import com.example.dreamlink.Dreamlink.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LikeService {

    private static final Logger log = LoggerFactory.getLogger(LikeService.class);

    private static final int FREE_DAILY_LIKE_LIMIT = 20;
    private static final int PREMIUM_DAILY_LIKE_LIMIT = 200;

    private final DreamLikeRepository dreamLikeRepository;
    private final DreamRepository dreamRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final PremiumGateService premiumGateService;
    private final AnalyticsEventService analyticsEventService;

    // ── Like a dream ─────────────────────────────────────────────────────────
    @Transactional
    public void likeDream(UUID dreamId, DreamLike.LikeSource source) {
        User fromUser = getCurrentUser();
        Dream dream = dreamRepository.findById(dreamId)
                .orElseThrow(() -> new RuntimeException("Rüya bulunamadı"));
        User toUser = dream.getUser();

        // Self-like: Only increment count, do NOT create DreamLike record
        if (fromUser.getId().equals(toUser.getId())) {
            dream.setLikeCount(dream.getLikeCount() + 1);
            dreamRepository.save(dream);
            return;
        }

        // Idempotent: already liked with THIS source → do nothing
        // We allow liking in both FEED and DISCOVER separately if needed, OR we can
        // check global existence.
        // But user wants separation. So we check existence by source?
        // Actually, if I already liked in Feed, I should be able to like in Discover to
        // trigger match.
        // So we check existence by source.
        // Note: We need a repository method for this check too, or use the one we
        // added.
        // Let's use dreamLikeRepository.existsByFromUserIdAndDreamIdAndSource(...)
        // But first let's add it to repo. For now we can use the optional.
        if (dreamLikeRepository.findByFromUserAndDreamAndSource(fromUser, dream, source).isPresent()) {
            return;
        }

        enforceDailyLikeLimit(fromUser, source);

        DreamLike like = DreamLike.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .dream(dream)
                .source(source)
                .build();
        dreamLikeRepository.save(like);

        // Update dream like count
        dream.setLikeCount(dream.getLikeCount() + 1);
        dreamRepository.save(dream);

        // Check mutual: has toUser liked any of fromUser's dreams?
        boolean isMutual = dreamLikeRepository.existsByFromUserIdAndToUserId(
                toUser.getId(), fromUser.getId());

        if (isMutual) {
            createConversationIfAbsent(fromUser, toUser);
        }
    }

    // ── Unlike a dream ───────────────────────────────────────────────────────
    @Transactional
    public void unlikeDream(UUID dreamId) {
        User fromUser = getCurrentUser();
        Dream dream = dreamRepository.findById(dreamId)
                .orElseThrow(() -> new RuntimeException("Rüya bulunamadı"));

        // Self-unlike: Only decrement count
        if (fromUser.getId().equals(dream.getUser().getId())) {
            if (dream.getLikeCount() > 0) {
                dream.setLikeCount(dream.getLikeCount() - 1);
                dreamRepository.save(dream);
            }
            return;
        }

        dreamLikeRepository.findByFromUserAndDream(fromUser, dream)
                .ifPresent(like -> {
                    dreamLikeRepository.delete(like);
                    if (dream.getLikeCount() > 0) {
                        dream.setLikeCount(dream.getLikeCount() - 1);
                        dreamRepository.save(dream);
                    }
                });
    }

    // ── My outgoing likes ────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<LikeResponse> getMyLikes() {
        User user = getCurrentUser();
        return dreamLikeRepository.findByFromUserId(user.getId()).stream()
                .map(dl -> new LikeResponse(
                dl.getId(),
                dl.getDream().getId(),
                dl.getDream().getTitle(),
                dl.getToUser().getId(), // Beğendiğim kişi (Related User)
                dl.getToUser().getNickname(),
                dl.getToUser().getAvatarUrl(),
                dl.getCreatedAt()))
                .collect(Collectors.toList());
    }

    // ── Who liked me ─────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<LikeResponse> getLikedMe() {
        User user = getCurrentUser();
        if (!premiumGateService.hasEntitlement(user.getId(), Entitlement.LIKES_YOU)) {
            analyticsEventService.trackServerEvent(
                    "entitlement_denied",
                    "likesYou",
                    "likesYou",
                    user.getId().toString(),
                    Map.of("entitlement", Entitlement.LIKES_YOU.name())
            );
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Premium gerekli");
        }
        return dreamLikeRepository.findByToUserId(user.getId()).stream()
                .map(dl -> new LikeResponse(
                dl.getId(),
                dl.getDream().getId(),
                dl.getDream().getTitle(),
                dl.getFromUser().getId(), // Beni beğenen kişi (Related User)
                dl.getFromUser().getNickname(),
                dl.getFromUser().getAvatarUrl(),
                dl.getCreatedAt()))
                .collect(Collectors.toList());
    }

    // ── Mutual matches ───────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MutualMatchResponse> getMutualMatches() {
        User user = getCurrentUser();

        // Users I liked
        Set<UUID> iLiked = dreamLikeRepository.findByFromUserId(user.getId()).stream()
                .map(dl -> dl.getToUser().getId())
                .collect(Collectors.toSet());

        // Users who liked me
        Set<UUID> likedMe = dreamLikeRepository.findByToUserId(user.getId()).stream()
                .map(dl -> dl.getFromUser().getId())
                .collect(Collectors.toSet());

        // Intersection = mutual
        iLiked.retainAll(likedMe);

        return iLiked.stream().map(mutualUserId -> {
            User mutualUser = userRepository.findById(mutualUserId)
                    .orElseThrow();

            // Find conversation between the two users
            UUID u1Id = user.getId().compareTo(mutualUserId) < 0 ? user.getId() : mutualUserId;
            UUID u2Id = user.getId().compareTo(mutualUserId) < 0 ? mutualUserId : user.getId();

            UUID conversationId = conversationRepository
                    .findExistingConversation(u1Id, u2Id)
                    .map(Conversation::getId)
                    .orElse(null);

            // Use the most recent like as matchedAt
            Optional<DreamLike> latestLike = dreamLikeRepository.findByFromUserId(user.getId())
                    .stream()
                    .filter(dl -> dl.getToUser().getId().equals(mutualUserId))
                    .max(Comparator.comparing(DreamLike::getCreatedAt));

            return new MutualMatchResponse(
                    mutualUser.getId(),
                    mutualUser.getNickname(),
                    mutualUser.getAvatarUrl(),
                    conversationId,
                    latestLike.map(DreamLike::getCreatedAt).orElse(null));
        }).collect(Collectors.toList());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private void createConversationIfAbsent(User a, User b) {
        User user1 = a.getId().compareTo(b.getId()) < 0 ? a : b;
        User user2 = a.getId().compareTo(b.getId()) < 0 ? b : a;

        if (conversationRepository.findExistingConversation(user1.getId(), user2.getId()).isPresent()) {
            return;
        }

        Conversation conversation = Conversation.builder()
                .user1(user1)
                .user2(user2)
                .build();
        conversationRepository.save(conversation);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    private void enforceDailyLikeLimit(User user, DreamLike.LikeSource source) {
        if (source != DreamLike.LikeSource.DISCOVER) {
            return;
        }
        int limit = premiumGateService.hasEntitlement(user.getId(), Entitlement.LIKE_LIMIT_BOOST)
                ? PREMIUM_DAILY_LIKE_LIMIT
                : FREE_DAILY_LIKE_LIMIT;
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        long used = dreamLikeRepository.countByFromUserIdAndSourceAndCreatedAtBetween(
                user.getId(), source, start, end);
        if (used >= limit) {
            analyticsEventService.trackServerEvent(
                    "like_limit_hit",
                    "likeLimit",
                    "likeLimit",
                    user.getId().toString(),
                    Map.of("used", used, "limit", limit)
            );
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Gunluk begeni limitine ulastin");
        }
    }
}
