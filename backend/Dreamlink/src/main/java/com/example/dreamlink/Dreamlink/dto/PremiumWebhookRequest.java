package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.PlanTier;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStatus;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;

import java.time.LocalDateTime;

public record PremiumWebhookRequest(
        SubscriptionStore store,
        String eventType,
        String storeSubscriptionId,
        String transactionId,
        String productId,
        PlanTier planTier,
        SubscriptionStatus status,
        LocalDateTime expiresAt,
        LocalDateTime currentPeriodEnd
        ) {

}
