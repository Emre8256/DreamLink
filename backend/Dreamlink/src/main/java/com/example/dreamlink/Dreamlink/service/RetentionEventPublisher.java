package com.example.dreamlink.Dreamlink.service;

import java.time.LocalDate;
import java.util.UUID;

public interface RetentionEventPublisher {

    void onDailyReset(LocalDate resetDate);

    void onDailyPicksViewed(UUID userId, int total, int limit, boolean locked);

    void onBoostActivated(UUID userId);

    void onRewindUsed(UUID userId);
}
