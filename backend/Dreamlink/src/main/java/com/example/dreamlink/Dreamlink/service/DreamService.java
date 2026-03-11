package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.CreateDreamRequest;
import com.example.dreamlink.Dreamlink.dto.DreamResponse;
import com.example.dreamlink.Dreamlink.entity.Dream;
import com.example.dreamlink.Dreamlink.entity.Tag;
import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.repository.DreamRepository;
import com.example.dreamlink.Dreamlink.repository.TagRepository;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DreamService {

    private final DreamRepository dreamRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;

    private final MatchService matchService;
    private final AiMatcherClientService aiMatcherClientService;
    private final com.example.dreamlink.Dreamlink.repository.DreamMatchRepository matchRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Oturum açmış kullanıcı bulunamadı"));
    }

    @Transactional
    public DreamResponse createDream(CreateDreamRequest request) {
        User currentUser = getCurrentUser();

        // ── Günlük limit kontrolü ──────────────────────────────────────────
        LocalDateTime startOfDay = LocalDateTime.of(
                java.time.LocalDate.now(), java.time.LocalTime.MIDNIGHT);
        List<com.example.dreamlink.Dreamlink.entity.Dream> todayDreams = dreamRepository
                .findTodayDreamsByUser(currentUser.getId(), startOfDay);
        if (!todayDreams.isEmpty()) {
            throw new RuntimeException("Bugün zaten bir rüya paylaştın. Yarın tekrar deneyebilirsin.");
        }

        List<Tag> tags = new ArrayList<>();
        if (request.tagNames() != null) {
            for (String tagName : request.tagNames()) {
                String normalizedName = tagName.trim().toLowerCase();
                Tag tag = tagRepository.findByName(normalizedName)
                        .orElseGet(() -> tagRepository.save(
                                Tag.builder().name(normalizedName).build()));
                tags.add(tag);
            }
        }

        Dream dream = Dream.builder()
                .title(request.title())
                .description(request.description())
                .theme(request.theme())
                .visibility(request.visibility())
                .user(currentUser)
                .tags(tags)
                .build();

        Dream savedDream = dreamRepository.save(dream);

        dreamRepository.flush();

        // Python matcher'a embedding isleme talebini asenkron gonder.
        aiMatcherClientService.triggerProcessDreamAsync(savedDream.getId());

        // Match hesaplaması arka planda — hata olursa rüya kaydını etkilemesin
        try {
            matchService.findMatchesForDream(savedDream);
        } catch (Exception e) {
            System.err.println("[MatchService] Eşleşme hesaplaması başarısız (rüya kaydedildi): " + e.getMessage());
        }

        return mapToResponse(savedDream);
    }

    @Transactional(readOnly = true)
    public Page<DreamResponse> getHomeFeed(Pageable pageable) {
        User currentUser = null;
        try {
            currentUser = getCurrentUser();
        } catch (Exception e) {
            // Anonim feed
        }

        List<UUID> followingIds = new ArrayList<>();
        if (currentUser != null) {
            followingIds = currentUser.getFollowing().stream()
                    .map(f -> f.getFollowing().getId())
                    .collect(Collectors.toList());
        }

        Page<Dream> dreams = dreamRepository.findFeedDreams(followingIds, pageable);
        return dreams.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<DreamResponse> getPublicFeed(Pageable pageable) {
        return dreamRepository.findByVisibilityOrderByCreatedAtDesc(
                com.example.dreamlink.Dreamlink.enums.VisibilityType.PUBLIC,
                pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<DreamResponse> getUserDreams(UUID userId, Pageable pageable) {
        return dreamRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    public DreamResponse getDreamById(UUID id) {
        Dream dream = dreamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rüya bulunamadı"));

        // Visibility access control
        User currentUser = null;
        try {
            currentUser = getCurrentUser();
        } catch (Exception e) {
            // Anonymous user
        }

        switch (dream.getVisibility()) {
            case PRIVATE:
                // Only the owner can view private dreams
                if (currentUser == null || !dream.getUser().getId().equals(currentUser.getId())) {
                    throw new RuntimeException("Bu rüyayı görüntüleme yetkiniz yok");
                }
                break;
            case FOLLOWERS_ONLY:
                // Owner can always view; followers can view; others cannot
                if (currentUser == null) {
                    throw new RuntimeException("Bu rüyayı görüntüleme yetkiniz yok");
                }
                boolean isOwner = dream.getUser().getId().equals(currentUser.getId());
                boolean isFollowing = currentUser.getFollowing().stream()
                        .anyMatch(f -> f.getFollowing().getId().equals(dream.getUser().getId()));
                if (!isOwner && !isFollowing) {
                    throw new RuntimeException("Bu rüyayı görüntüleme yetkiniz yok");
                }
                break;
            case PUBLIC:
            default:
                // Everyone can view public dreams
                break;
        }

        return mapToResponse(dream);
    }

    @Transactional
    public void deleteDream(UUID id) {
        Dream dream = dreamRepository.findById(id).orElseThrow();
        User currentUser = getCurrentUser();

        if (!dream.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Bu rüyayı silme yetkiniz yok");
        }

        // Clean up matches where this dream is myDream OR matchedDream
        matchRepository.deleteByMyDreamId(id);
        matchRepository.deleteByMatchedDreamId(id);

        dreamRepository.deleteById(id);
    }

    @Transactional
    public DreamResponse updateVisibility(UUID id, String visibilityStr) {
        Dream dream = dreamRepository.findById(id).orElseThrow();
        User currentUser = getCurrentUser();

        if (!dream.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Bu rüyayı düzenleme yetkiniz yok");
        }

        com.example.dreamlink.Dreamlink.enums.VisibilityType newVisibility = com.example.dreamlink.Dreamlink.enums.VisibilityType
                .valueOf(visibilityStr);
        dream.setVisibility(newVisibility);
        Dream saved = dreamRepository.save(dream);
        return mapToResponse(saved);
    }

    private DreamResponse mapToResponse(Dream dream) {
        User currentUser = null;
        try {
            currentUser = getCurrentUser();
        } catch (Exception e) {
            // ignore
        }

        boolean isLiked = false;
        if (currentUser != null) {
            UUID currentUserId = currentUser.getId();
            isLiked = dream.getLikes().stream()
                    .anyMatch(like -> like.getFromUser().getId().equals(currentUserId));
        }

        List<String> tagNames = dream.getTags().stream()
                .map(Tag::getName)
                .collect(Collectors.toList());

        return new DreamResponse(
                dream.getId(),
                dream.getTitle(),
                dream.getDescription(),
                dream.getTheme(),
                dream.getUser().getNickname(),
                dream.getUser().getAvatarUrl(),
                dream.getLikes().size(),
                dream.getComments().size(),
                tagNames,
                dream.getCreatedAt(),
                isLiked,
                dream.getVisibility());
    }
}