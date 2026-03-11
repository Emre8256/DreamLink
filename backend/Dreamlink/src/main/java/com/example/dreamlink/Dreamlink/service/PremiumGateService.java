package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.entity.Subscription;
import com.example.dreamlink.Dreamlink.enums.Entitlement;
import com.example.dreamlink.Dreamlink.enums.PlanTier;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStatus;
import com.example.dreamlink.Dreamlink.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PremiumGateService {

    private static final Map<PlanTier, EnumSet<Entitlement>> PLAN_ENTITLEMENTS = Map.of(
            PlanTier.FREE, EnumSet.noneOf(Entitlement.class),
            PlanTier.PLUS, EnumSet.of(
                    Entitlement.REWIND,
                    Entitlement.ADVANCED_FILTERS,
                    Entitlement.INCOGNITO_MODE,
                    Entitlement.EXTRA_DAILY_PICKS,
                    Entitlement.LIKE_LIMIT_BOOST),
            PlanTier.GOLD, EnumSet.of(
                    Entitlement.LIKES_YOU,
                    Entitlement.REWIND,
                    Entitlement.ADVANCED_FILTERS,
                    Entitlement.INCOGNITO_MODE,
                    Entitlement.EXTRA_DAILY_PICKS,
                    Entitlement.LIKE_LIMIT_BOOST,
                    Entitlement.BOOST_WEEKLY,
                    Entitlement.DISCOVER_PRIORITY),
            PlanTier.PLATINUM, EnumSet.of(
                    Entitlement.LIKES_YOU,
                    Entitlement.REWIND,
                    Entitlement.ADVANCED_FILTERS,
                    Entitlement.INCOGNITO_MODE,
                    Entitlement.EXTRA_DAILY_PICKS,
                    Entitlement.LIKE_LIMIT_BOOST,
                    Entitlement.BOOST_WEEKLY,
                    Entitlement.DISCOVER_PRIORITY,
                    Entitlement.EXTRA_OPENERS)
    );

    private final SubscriptionRepository subscriptionRepository;

    public PlanTier getEffectivePlan(UUID userId) {
        return subscriptionRepository.findByUserId(userId)
                .filter(this::isActive)
                .map(Subscription::getPlanTier)
                .orElse(PlanTier.FREE);
    }

    public Set<Entitlement> getEntitlements(UUID userId) {
        PlanTier plan = getEffectivePlan(userId);
        return EnumSet.copyOf(PLAN_ENTITLEMENTS.getOrDefault(plan, EnumSet.noneOf(Entitlement.class)));
    }

    public boolean hasEntitlement(UUID userId, Entitlement entitlement) {
        return getEntitlements(userId).contains(entitlement);
    }

    private boolean isActive(Subscription subscription) {
        SubscriptionStatus status = subscription.getStatus();
        if (status != SubscriptionStatus.ACTIVE && status != SubscriptionStatus.TRIAL) {
            return false;
        }
        LocalDateTime expiresAt = subscription.getExpiresAt();
        return expiresAt == null || !expiresAt.isBefore(LocalDateTime.now());
    }
}
