package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.DiscoverCardResponse;
import com.example.dreamlink.Dreamlink.dto.DailyPicksResponse;
import com.example.dreamlink.Dreamlink.entity.*;
import com.example.dreamlink.Dreamlink.enums.Entitlement;
import com.example.dreamlink.Dreamlink.enums.MatchPeriod;
import com.example.dreamlink.Dreamlink.repository.DreamMatchRepository;
import com.example.dreamlink.Dreamlink.repository.DreamRepository;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import com.example.dreamlink.Dreamlink.service.PremiumGateService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Instant;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchService {

    private static final Logger logger = LoggerFactory.getLogger(MatchService.class);

    private final DreamMatchRepository matchRepository;
    private final DreamRepository dreamRepository;
    private final UserRepository userRepository;
    private final PremiumGateService premiumGateService;
    private final MatcherAdapter matcherAdapter;
    private final DailyPicksResetService dailyPicksResetService;
    private final RetentionEventPublisher retentionEventPublisher;
    private final AnalyticsEventService analyticsEventService;
    private final MatcherObservabilityService matcherObservabilityService;

    @Value("${matcher.timeout-ms:200}")
    private long matcherTimeoutMs;

    @Value("${rewind.cooldown-seconds:0}")
    private long rewindCooldownSeconds;

    private final ConcurrentHashMap<UUID, Instant> lastRewindAt = new ConcurrentHashMap<>();

    private static final int FREE_DAILY_PICKS_LIMIT = 5;
    private static final int PREMIUM_DAILY_PICKS_LIMIT = 15;

    // ── Public API ──────────────────────────────────────────────────────────
    /**
     * Called after a dream is saved. Finds and stores matches for the new
     * dream. Accepts the Dream object directly to avoid re-fetching in a
     * separate transaction.
     */
    @Transactional
    public void findMatchesForDream(Dream newDream) {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);

        // Fetch up to 2000 active dreams from other users
        List<Dream> candidates = dreamRepository.findActiveDreams(
                newDream.getUser().getId(),
                sevenDaysAgo,
                PageRequest.of(0, 2000));

        // Score and filter
        List<ScoredDream> scored = new ArrayList<>();
        for (Dream candidate : candidates) {
            // Guard: Asla kendi rüyasıyla eşleşmemeli
            if (candidate.getUser().getId().equals(newDream.getUser().getId())) {
                continue;
            }

            double score = scoreWithFallback(newDream, candidate);
            System.out.printf("[MatchService] '%s' <-> '%s' score=%.4f%n",
                    newDream.getTitle(), candidate.getTitle(), score);

            if (score >= 0.05) {
                scored.add(new ScoredDream(candidate, score));
            }
        }

        // Top 30 by score
        scored.sort(Comparator.comparingDouble(ScoredDream::score).reversed());
        List<ScoredDream> top30 = scored.stream().limit(30).toList();

        // Save symmetric matches
        for (ScoredDream sd : top30) {
            MatchPeriod period = sd.dream().getCreatedAt().isAfter(todayStart)
                    ? MatchPeriod.HOT
                    : MatchPeriod.WEEK;

            // A → B
            saveMatchIfAbsent(newDream, sd.dream(), sd.score(), period);
            // B → A (symmetric)
            saveMatchIfAbsent(sd.dream(), newDream, sd.score(), period);
        }
    }

    /**
     * Discover feed: top 30 matches for the current user, grouped by matched
     * user. Excludes users the current user has already liked.
     */
    @Transactional(readOnly = true)
    public List<DiscoverCardResponse> getDiscoverFeed() {
        User user = getCurrentUser();
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        List<DreamMatch> rawMatches = matchRepository.findDiscoverMatches(user.getId(), sevenDaysAgo);

        // Group by matched user — keep highest score per user
        Map<UUID, DreamMatch> bestByUser = new LinkedHashMap<>();
        Map<UUID, Integer> countByUser = new HashMap<>();

        for (DreamMatch dm : rawMatches) {
            UUID matchedUserId = dm.getMatchedDream().getUser().getId();
            countByUser.merge(matchedUserId, 1, Integer::sum);
            if (!bestByUser.containsKey(matchedUserId)
                    || dm.getScore() > bestByUser.get(matchedUserId).getScore()) {
                bestByUser.put(matchedUserId, dm);
            }
        }

        return bestByUser.values().stream()
                .limit(30)
                .map(dm -> {
                    User matchedUser = dm.getMatchedDream().getUser();
                    int count = countByUser.getOrDefault(matchedUser.getId(), 1);
                    return new DiscoverCardResponse(
                            dm.getId(),
                            matchedUser.getId(),
                            matchedUser.getNickname(),
                            matchedUser.getAvatarUrl(),
                            dm.getMatchedDream().getId(),
                            dm.getMatchedDream().getTitle(),
                            dm.getMatchedDream().getDescription(),
                            (int) Math.round(dm.getScore() * 100),
                            dm.getPeriod() == MatchPeriod.HOT,
                            count,
                            dm.getMatchedAt());
                })
                .collect(Collectors.toList());
    }

    /**
     * Daily Picks: derived from discover feed with a visible limit.
     */
    @Transactional(readOnly = true)
    public DailyPicksResponse getDailyPicks() {
        dailyPicksResetService.checkForReset();
        User user = getCurrentUser();
        boolean hasExtraDailyPicks = premiumGateService.hasEntitlement(user.getId(), Entitlement.EXTRA_DAILY_PICKS);
        int limit = hasExtraDailyPicks ? PREMIUM_DAILY_PICKS_LIMIT : FREE_DAILY_PICKS_LIMIT;

        List<DiscoverCardResponse> all = getDiscoverFeed();
        int total = all.size();
        List<DiscoverCardResponse> picks = all.stream().limit(limit).toList();

        boolean locked = !hasExtraDailyPicks && total > limit;
        boolean hasMorePremium = locked;

        dailyPicksResetService.onDailyPicksViewed(user.getId(), total, limit, locked);

        return new DailyPicksResponse(picks, picks.size(), locked, hasMorePremium);
    }

    public void assertRewindAllowed() {
        User user = getCurrentUser();
        if (!premiumGateService.hasEntitlement(user.getId(), Entitlement.REWIND)) {
            analyticsEventService.trackServerEvent(
                    "entitlement_denied",
                    "rewind",
                    "rewind",
                    user.getId().toString(),
                    Map.of("entitlement", Entitlement.REWIND.name())
            );
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Rewind premium gerekli");
        }
        long cooldown = Math.max(0L, rewindCooldownSeconds);
        if (cooldown > 0) {
            Instant last = lastRewindAt.get(user.getId());
            if (last != null) {
                Instant next = last.plus(Duration.ofSeconds(cooldown));
                Instant now = Instant.now();
                if (now.isBefore(next)) {
                    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rewind cooldown");
                }
            }
        }
    }

    public void recordRewindUsed() {
        User user = getCurrentUser();
        lastRewindAt.put(user.getId(), Instant.now());
        retentionEventPublisher.onRewindUsed(user.getId());
        analyticsEventService.trackServerEvent(
                "rewind_used",
                "rewind",
                "rewind",
                user.getId().toString(),
                Map.of()
        );
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    private void saveMatchIfAbsent(Dream myDream, Dream matchedDream, double score, MatchPeriod period) {
        if (matchRepository.existsByMyDreamIdAndMatchedDreamId(myDream.getId(), matchedDream.getId())) {
            return;
        }
        DreamMatch match = DreamMatch.builder()
                .myDream(myDream)
                .matchedDream(matchedDream)
                .myUserId(myDream.getUser().getId())
                .score(score)
                .period(period)
                .build();
        matchRepository.save(match);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    double scoreWithFallback(Dream left, Dream right) {
        long timeoutMs = matcherTimeoutMs > 0 ? matcherTimeoutMs : 200L;
        try {
            double score = CompletableFuture.supplyAsync(() -> matcherAdapter.score(left, right))
                    .get(timeoutMs, TimeUnit.MILLISECONDS);
            if (Double.isNaN(score) || Double.isInfinite(score)) {
                logger.warn("Matcher invalid score leftDream={} rightDream={} value={}",
                        left.getId(), right.getId(), score);
                matcherObservabilityService.recordInvalidScore(score, left.getId(), right.getId());
                return 0.0;
            }
            if (score <= 0.0 && logger.isDebugEnabled()) {
                logger.debug("Matcher zero score leftDream={} rightDream={}", left.getId(), right.getId());
            }
            matcherObservabilityService.recordSuccess(score, left.getId(), right.getId());
            return score;
        } catch (TimeoutException ex) {
            logger.warn("Matcher timeout leftDream={} rightDream={} timeoutMs={}",
                    left.getId(), right.getId(), timeoutMs);
            matcherObservabilityService.recordTimeout(left.getId(), right.getId());
            return 0.0;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            logger.warn("Matcher interrupted leftDream={} rightDream={}", left.getId(), right.getId());
            matcherObservabilityService.recordInterrupted(left.getId(), right.getId());
            return 0.0;
        } catch (ExecutionException ex) {
            logger.warn("Matcher failed leftDream={} rightDream={} error={}",
                    left.getId(), right.getId(), ex.getCause() != null ? ex.getCause().getClass().getSimpleName() : ex.getClass().getSimpleName());
            matcherObservabilityService.recordFailure(left.getId(), right.getId());
            return 0.0;
        } catch (Exception ex) {
            logger.warn("Matcher failed leftDream={} rightDream={} error={}",
                    left.getId(), right.getId(), ex.getClass().getSimpleName());
            matcherObservabilityService.recordFailure(left.getId(), right.getId());
            return 0.0;
        }
    }

    // ── Inner records ────────────────────────────────────────────────────────
    private record ScoredDream(Dream dream, double score) {

    }
}
