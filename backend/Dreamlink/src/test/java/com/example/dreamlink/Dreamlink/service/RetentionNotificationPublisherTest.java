package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.enums.NotificationType;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;


class RetentionNotificationPublisherTest {

    @Test
    void onBoostActivated_sendsNotification_whenEligible() {
        NotificationService notificationService = mock(NotificationService.class);
        UserRepository userRepository = mock(UserRepository.class);
        RetentionNotificationPublisher publisher = new RetentionNotificationPublisher(
                notificationService,
                userRepository
        );
        ReflectionTestUtils.setField(publisher, "boostMinHours", 0L);

        UUID userId = UUID.randomUUID();
        User user = buildUser(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        publisher.onBoostActivated(userId);

        verify(notificationService)
                .send(user, "Boost activated. Your profile is boosted for a while.", NotificationType.SYSTEM, "/discover");
    }

    @Test
    void onBoostActivated_rateLimited_preventsSecondSend() {
        NotificationService notificationService = mock(NotificationService.class);
        UserRepository userRepository = mock(UserRepository.class);
        RetentionNotificationPublisher publisher = new RetentionNotificationPublisher(
                notificationService,
                userRepository
        );
        ReflectionTestUtils.setField(publisher, "boostMinHours", 24L);

        UUID userId = UUID.randomUUID();
        User user = buildUser(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        publisher.onBoostActivated(userId);
        publisher.onBoostActivated(userId);

        verify(notificationService)
                .send(user, "Boost activated. Your profile is boosted for a while.", NotificationType.SYSTEM, "/discover");
    }

    @Test
    void dailyPicksAndRewind_doNotSendNotifications() {
        NotificationService notificationService = mock(NotificationService.class);
        UserRepository userRepository = mock(UserRepository.class);
        RetentionNotificationPublisher publisher = new RetentionNotificationPublisher(
                notificationService,
                userRepository
        );

        publisher.onDailyReset(java.time.LocalDate.now());
        publisher.onDailyPicksViewed(UUID.randomUUID(), 10, 5, true);
        publisher.onRewindUsed(UUID.randomUUID());

        verifyNoInteractions(notificationService);
    }

    @Test
    void notificationsDisabled_usesNoOpPublisher() {
        new ApplicationContextRunner()
                .withUserConfiguration(TestConfig.class)
                .withPropertyValues("retention.notifications.enabled=false")
                .run(context -> {
                    RetentionEventPublisher publisher = context.getBean(RetentionEventPublisher.class);
                    assertThat(publisher).isInstanceOf(NoOpRetentionEventPublisher.class);
                });
    }

    @Test
    void notificationsEnabled_usesNotificationPublisher() {
        new ApplicationContextRunner()
                .withUserConfiguration(TestConfig.class)
                .withPropertyValues("retention.notifications.enabled=true")
                .run(context -> {
                    RetentionEventPublisher publisher = context.getBean(RetentionEventPublisher.class);
                    assertThat(publisher).isInstanceOf(RetentionNotificationPublisher.class);
                });
    }

    private User buildUser(UUID userId) {
        return User.builder()
                .id(userId)
                .email("user@example.com")
                .nickname("user")
                .password("hashed")
                .build();
    }

    @Configuration
    @Import({RetentionNotificationPublisher.class, NoOpRetentionEventPublisher.class})
    static class TestConfig {

        @Bean
        NotificationService notificationService() {
            return Mockito.mock(NotificationService.class);
        }

        @Bean
        UserRepository userRepository() {
            return Mockito.mock(UserRepository.class);
        }
    }
}
