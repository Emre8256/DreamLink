package com.example.dreamlink.Dreamlink.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "retention.notifications.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpRetentionEventPublisher implements RetentionEventPublisher {

    @Override
    public void onDailyReset(LocalDate resetDate) {
        // Intentionally no-op until real notification wiring is enabled.
    }

    @Override
    public void onDailyPicksViewed(UUID userId, int total, int limit, boolean locked) {
        // Intentionally no-op until real notification wiring is enabled.
    }

    @Override
    public void onBoostActivated(UUID userId) {
        // Intentionally no-op until real notification wiring is enabled.
    }

    @Override
    public void onRewindUsed(UUID userId) {
        // Intentionally no-op until real notification wiring is enabled.
    }
}
