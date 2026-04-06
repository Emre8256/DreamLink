package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.CreateDreamRequest;
import com.example.dreamlink.Dreamlink.dto.DreamContextItemRecord;
import com.example.dreamlink.Dreamlink.dto.DreamInterpretRequest;
import com.example.dreamlink.Dreamlink.dto.DreamInterpretContextRequest;
import com.example.dreamlink.Dreamlink.dto.DreamInterpretationResponse;
import com.example.dreamlink.Dreamlink.dto.DreamResponse;
import com.example.dreamlink.Dreamlink.entity.Dream;
import com.example.dreamlink.Dreamlink.entity.DreamInterpretation;
import com.example.dreamlink.Dreamlink.entity.Tag;
import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.repository.DreamInterpretationRepository;
import com.example.dreamlink.Dreamlink.repository.DreamRepository;
import com.example.dreamlink.Dreamlink.repository.TagRepository;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class DreamService {

    private final DreamRepository dreamRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final DreamInterpretationRepository dreamInterpretationRepository;
    private final MatchService matchService;
    private final AiMatcherClientService aiMatcherClientService;
    private final com.example.dreamlink.Dreamlink.repository.DreamMatchRepository matchRepository;
    private final SimpMessagingTemplate messagingTemplate;

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
        //if (!todayDreams.isEmpty()) {
        //    throw new RuntimeException("Bugün zaten bir rüya paylaştın. Yarın tekrar deneyebilirsin.");
        //}

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

        // Match hesaplaması arka planda
        try {
            matchService.findMatchesForDream(savedDream);
        } catch (Exception e) {
            System.err.println("[MatchService] Eşleşme hesaplaması başarısız: " + e.getMessage());
        }

        DreamResponse response = mapToResponse(savedDream);

        // Gerçek zamanlı feed: tüm bağlı kullanıcılara yayınla
        try {
            messagingTemplate.convertAndSend("/topic/dream-feed", response);
            System.out.println("[WS] Yeni rüya broadcast: /topic/dream-feed");
        } catch (Exception ex) {
            System.err.println("[WS] Dream broadcast hatası: " + ex.getMessage());
        }

        return response;
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

    @Transactional
    public DreamInterpretationResponse interpretDream(UUID dreamId, DreamInterpretRequest request) {
        try {
            Dream dream = dreamRepository.findById(dreamId)
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Rüya bulunamadı"));

            User currentUser = getCurrentUser();
            if (!dream.getUser().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(FORBIDDEN, "Sadece kendi rüyan için analiz alabilirsin");
            }

            String persona = normalizePersona(request.persona());
            String zodiacSign = resolveAndPersistZodiacSign(currentUser, request.zodiacSign());

            DreamInterpretation existing = dreamInterpretationRepository
                    .findByDreamIdAndPersona(dreamId, persona)
                    .orElse(null);
            if (existing != null) {
                return mapInterpretation(existing);
            }

                DreamInterpretContextRequest contextRequest = buildInterpretContext(currentUser.getId(), dream.getId());

            String content = aiMatcherClientService.requestDreamInterpretation(
                    dream.getTitle(),
                    dream.getDescription(),
                    persona,
                    zodiacSign,
                    contextRequest);

            DreamInterpretation saved = dreamInterpretationRepository.save(
                    DreamInterpretation.builder()
                            .dream(dream)
                            .persona(persona)
                            .content(content)
                            .zodiacSign(zodiacSign)
                            .createdAt(LocalDateTime.now())
                            .build());

            return mapInterpretation(saved);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("ASIL HATA BURADA: " + e.getMessage());
            if (e instanceof ResponseStatusException responseStatusException) {
                throw responseStatusException;
            }
            throw new RuntimeException("AI HATASI: " + e.getMessage(), e);
        }
    }

    private String resolveAndPersistZodiacSign(User currentUser, String zodiacSignFromRequest) {
        String incoming = zodiacSignFromRequest == null ? "" : zodiacSignFromRequest.trim();
        if (!incoming.isBlank()) {
            currentUser.setZodiacSign(incoming);
            userRepository.save(currentUser);
            return incoming;
        }

        String persisted = currentUser.getZodiacSign() == null ? "" : currentUser.getZodiacSign().trim();
        if (persisted.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Burc bilgisi gerekli");
        }
        return persisted;
    }

    private DreamInterpretationResponse mapInterpretation(DreamInterpretation interpretation) {
        return new DreamInterpretationResponse(
                interpretation.getId(),
                interpretation.getDream().getId(),
                interpretation.getPersona(),
                interpretation.getContent(),
                interpretation.getZodiacSign(),
                interpretation.getCreatedAt());
    }

            private DreamInterpretContextRequest buildInterpretContext(UUID userId, UUID currentDreamId) {
            List<DreamContextItemRecord> contextDreams = dreamRepository
                .findRecentDreamsForContext(userId, currentDreamId, PageRequest.of(0, 3))
                .stream()
                .map(d -> new DreamContextItemRecord(
                    d.getId(),
                    d.getTitle(),
                    d.getDescription(),
                    d.getCreatedAt()))
                .toList();

            return new DreamInterpretContextRequest(currentDreamId, contextDreams);
            }

    private String normalizePersona(String rawPersona) {
        String normalized = rawPersona == null ? "" : rawPersona.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "SIGMUND FREUD", "FREUD" -> "FREUD";
            case "CARL JUNG", "JUNG" -> "JUNG";
            case "ASTROLOG", "ASTROLOGER", "ASTROLOJI", "ASTROLOGIST" -> "ASTROLOG";
            default -> throw new ResponseStatusException(BAD_REQUEST, "Desteklenmeyen persona");
        };
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
                dream.getUser().getId(),
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