package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.entity.Subscription;
import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.enums.PlanTier;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStatus;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;
import com.example.dreamlink.Dreamlink.repository.SubscriptionRepository;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/premium/smoke")
@ConditionalOnProperty(name = "premium.smoke.enabled", havingValue = "true")
public class LocalPremiumSmokeController {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public LocalPremiumSmokeController(SubscriptionRepository subscriptionRepository, UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/grant")
    public ResponseEntity<Void> grantPremium(
            @RequestParam(name = "plan", defaultValue = "GOLD") PlanTier planTier,
            @RequestParam(name = "days", defaultValue = "30") int days
    ) {
        User user = getCurrentUser();
        Subscription subscription = subscriptionRepository.findByUserId(user.getId())
                .orElseGet(() -> Subscription.builder().user(user).build());
        subscription.setPlanTier(planTier);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStore(SubscriptionStore.MANUAL);
        subscription.setExpiresAt(LocalDateTime.now().plusDays(Math.max(1, days)));
        subscription.setCurrentPeriodEnd(subscription.getExpiresAt());
        subscriptionRepository.save(subscription);
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }
}
