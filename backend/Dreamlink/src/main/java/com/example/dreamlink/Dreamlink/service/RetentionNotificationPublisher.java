package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.enums.NotificationType;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@ConditionalOnProperty(name = "retention.notifications.enabled", havingValue = "true")
public class RetentionNotificationPublisher implements RetentionEventPublisher {

    private static final Logger logger = LoggerFactory.getLogger(RetentionNotificationPublisher.class);

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ConcurrentHashMap<UUID, Instant> lastBoostNotified = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, Instant> lastRewindNotified = new ConcurrentHashMap<>();

    @Value("${retention.notifications.boost-min-hours:24}")
    private long boostMinHours;

    @Value("${retention.notifications.rewind-min-hours:24}")
    private long rewindMinHours;

    @Value("${retention.notifications.send-boost:false}")
    private boolean sendBoostNotifications;

    @Value("${retention.notifications.send-rewind:false}")
    private boolean sendRewindNotifications;

    public RetentionNotificationPublisher(NotificationService notificationService, UserRepository userRepository) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @Override
    public void onDailyReset(LocalDate resetDate) {
        if (logger.isDebugEnabled()) {
            logger.debug("Daily picks reset event date={}", resetDate);
        }
    }

    @Override
    public void onDailyPicksViewed(UUID userId, int total, int limit, boolean locked) {
        if (logger.isDebugEnabled()) {
            logger.debug("Daily picks viewed event userId={} total={} limit={} locked={}",
                    userId, total, limit, locked);
        }
    }

    @Override
    public void onBoostActivated(UUID userId) {
        if (!sendBoostNotifications) {
            return;
        }
        if (!isEligible(lastBoostNotified, userId, boostMinHours)) {
            return;
        }
        sendNotification(userId,
                "Boost activated. Your profile is boosted for a while.",
                "/discover");
        lastBoostNotified.put(userId, Instant.now());
    }

    @Override
    public void onRewindUsed(UUID userId) {
        if (!sendRewindNotifications) {
            return;
        }
        if (!isEligible(lastRewindNotified, userId, rewindMinHours)) {
            return;
        }
        if (logger.isDebugEnabled()) {
            logger.debug("Rewind used event userId={}", userId);
        }
    }

    private boolean isEligible(ConcurrentHashMap<UUID, Instant> lastNotified,
            UUID userId,
            long minHours) {
        if (minHours <= 0) {
            return true;
        }
        Instant last = lastNotified.get(userId);
        if (last == null) {
            return true;
        }
        long hours = Duration.between(last, Instant.now()).toHours();
        return hours >= minHours;
    }

    private void sendNotification(UUID userId, String message, String link) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            if (logger.isDebugEnabled()) {
                logger.debug("Notification user not found userId={}", userId);
            }
            return;
        }
        notificationService.send(user, message, NotificationType.SYSTEM, link);
    }
}
