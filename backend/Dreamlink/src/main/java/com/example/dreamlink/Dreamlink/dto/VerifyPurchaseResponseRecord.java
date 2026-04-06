package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.PlanTier;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStatus;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;

import java.time.LocalDateTime;

public record VerifyPurchaseResponseRecord(
        boolean verified,
        PlanTier planTier,
        SubscriptionStatus status,
        SubscriptionStore store,
        LocalDateTime expiresAt,
        LocalDateTime currentPeriodEnd
) {
    public static VerifyPurchaseResponseRecord from(PurchaseVerifyResponse response) {
        return new VerifyPurchaseResponseRecord(
                response.verified(),
                response.planTier(),
                response.status(),
                response.store(),
                response.expiresAt(),
                response.currentPeriodEnd());
    }
}
