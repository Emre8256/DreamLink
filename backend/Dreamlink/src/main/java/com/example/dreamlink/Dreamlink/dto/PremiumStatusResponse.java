package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.Entitlement;
import com.example.dreamlink.Dreamlink.enums.PlanTier;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStatus;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;

import java.time.LocalDateTime;
import java.util.Set;

public record PremiumStatusResponse(
        PlanTier planTier,
        SubscriptionStatus status,
        SubscriptionStore store,
        LocalDateTime expiresAt,
        LocalDateTime currentPeriodEnd,
        Set<Entitlement> entitlements
        ) {

}
