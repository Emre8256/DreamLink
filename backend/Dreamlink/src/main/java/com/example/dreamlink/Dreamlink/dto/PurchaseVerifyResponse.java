package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.PlanTier;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStatus;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;

import java.time.LocalDateTime;

public record PurchaseVerifyResponse(
        boolean verified,
        PlanTier planTier,
        SubscriptionStatus status,
        SubscriptionStore store,
        LocalDateTime expiresAt,
        LocalDateTime currentPeriodEnd
        ) {

}
