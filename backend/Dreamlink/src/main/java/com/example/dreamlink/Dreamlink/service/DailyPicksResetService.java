package com.example.dreamlink.Dreamlink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class DailyPicksResetService {

    private static final Logger logger = LoggerFactory.getLogger(DailyPicksResetService.class);

    private final RetentionEventPublisher eventPublisher;
    private final AtomicReference<LocalDate> lastResetDate = new AtomicReference<>();
    private final AtomicReference<Instant> lastResetAt = new AtomicReference<>();
    private final AtomicReference<Instant> lastGuardLogAt = new AtomicReference<>();

    @Value("${retention.daily-picks.enabled:false}")
    private boolean retentionEnabled;

    @Value("${retention.daily-picks.reset-zone:UTC}")
    private String resetZone;

    @Value("${retention.daily-picks.reset-guard-hours:0}")
    private long resetGuardHours;

    public DailyPicksResetService(RetentionEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    public void checkForReset() {
        if (!retentionEnabled) {
            return;
        }
        long guardHours = Math.max(0L, resetGuardHours);
        Instant now = Instant.now();
        Instant lastAt = lastResetAt.get();
        if (guardHours > 0 && lastAt != null) {
            long hoursSince = Duration.between(lastAt, now).toHours();
            if (hoursSince < guardHours) {
                if (shouldLogGuard(now, guardHours)) {
                    logger.info("Daily picks reset guard skip hoursSince={} guardHours={}", hoursSince, guardHours);
                }
                return;
            }
        }
        LocalDate today = LocalDate.now(resolveZone());
        LocalDate last = lastResetDate.get();
        if (last == null || today.isAfter(last)) {
            lastResetDate.set(today);
            lastResetAt.set(now);
            logger.info("Daily picks reset window reached date={}", today);
            eventPublisher.onDailyReset(today);
        }
    }

    public void onDailyPicksViewed(UUID userId, int total, int limit, boolean locked) {
        if (!retentionEnabled) {
            return;
        }
        if (logger.isDebugEnabled()) {
            logger.debug("Daily picks viewed userId={} total={} limit={} locked={}",
                    userId, total, limit, locked);
        }
        eventPublisher.onDailyPicksViewed(userId, total, limit, locked);
    }

    @Scheduled(cron = "${retention.daily-picks.reset-cron:0 0 0 * * *}")
    void scheduledReset() {
        checkForReset();
    }

    private ZoneId resolveZone() {
        try {
            return ZoneId.of(resetZone);
        } catch (Exception ex) {
            return ZoneId.of("UTC");
        }
    }

    private boolean shouldLogGuard(Instant now, long guardHours) {
        Instant last = lastGuardLogAt.get();
        if (last == null) {
            lastGuardLogAt.set(now);
            return true;
        }
        long hoursSince = Duration.between(last, now).toHours();
        if (hoursSince >= Math.max(1L, guardHours)) {
            lastGuardLogAt.set(now);
            return true;
        }
        return false;
    }
}
