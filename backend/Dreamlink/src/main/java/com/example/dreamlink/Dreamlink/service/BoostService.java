package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.BoostStatusResponse;
import com.example.dreamlink.Dreamlink.enums.Entitlement;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class BoostService {

    private static final Logger logger = LoggerFactory.getLogger(BoostService.class);

    private final PremiumGateService premiumGateService;
    private final RetentionEventPublisher retentionEventPublisher;
    private final AnalyticsEventService analyticsEventService;
    private final ConcurrentHashMap<UUID, Instant> lastBoosts = new ConcurrentHashMap<>();

    @Value("${boost.cooldown-hours:168}")
    private long cooldownHours;

    @Value("${boost.state.max-age-hours:336}")
    private long stateMaxAgeHours;

    @Value("${boost.state.smoke-backdate-hours:0}")
    private long smokeBackdateHours;

    public BoostStatusResponse getStatus(UUID userId) {
        assertBoostAllowed(userId);
        Instant now = Instant.now();
        cleanupState(now);
        return buildStatus(userId, now);
    }

    public BoostStatusResponse activate(UUID userId) {
        assertBoostAllowed(userId);
        Instant now = Instant.now();
        cleanupState(now);
        BoostStatusResponse status = buildStatus(userId, now);
        if (!status.available()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Boost cooldown");
        }
        lastBoosts.put(userId, now);
        long backdateHours = Math.max(0L, smokeBackdateHours);
        if (backdateHours > 0) {
            lastBoosts.put(userId, now.minus(Duration.ofHours(backdateHours)));
        }
        logger.info("boost_activated userId={} cooldownHours={}", userId, cooldownHours);
        retentionEventPublisher.onBoostActivated(userId);
        analyticsEventService.trackServerEvent(
                "boost_activated",
                "boost",
                "boost",
                userId.toString(),
                Map.of("cooldownHours", cooldownHours)
        );
        return buildStatus(userId, now);
    }

    private void assertBoostAllowed(UUID userId) {
        if (!premiumGateService.hasEntitlement(userId, Entitlement.BOOST_WEEKLY)) {
            analyticsEventService.trackServerEvent(
                    "entitlement_denied",
                    "boost",
                    "boost",
                    userId.toString(),
                    Map.of("entitlement", Entitlement.BOOST_WEEKLY.name())
            );
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Boost premium gerekli");
        }
    }

    private BoostStatusResponse buildStatus(UUID userId, Instant now) {
        Instant last = lastBoosts.get(userId);
        long effectiveCooldown = Math.max(0L, cooldownHours);
        if (last == null) {
            return new BoostStatusResponse(true, null, null, effectiveCooldown);
        }
        Instant next = last.plus(Duration.ofHours(effectiveCooldown));
        boolean available = now.isAfter(next) || now.equals(next);
        LocalDateTime lastAt = LocalDateTime.ofInstant(last, ZoneOffset.UTC);
        LocalDateTime nextAt = LocalDateTime.ofInstant(next, ZoneOffset.UTC);
        return new BoostStatusResponse(available, lastAt, nextAt, effectiveCooldown);
    }

    private void cleanupState(Instant now) {
        long maxAge = Math.max(0L, stateMaxAgeHours);
        if (maxAge == 0L) {
            return;
        }
        Instant cutoff = now.minus(Duration.ofHours(maxAge));
        int before = lastBoosts.size();
        lastBoosts.entrySet().removeIf(entry -> entry.getValue().isBefore(cutoff));
        int after = lastBoosts.size();
        int removed = before - after;
        if (removed > 0) {
            logger.info("boost_state_cleanup removed={} remaining={} maxAgeHours={}", removed, after, maxAge);
        }
    }
}
