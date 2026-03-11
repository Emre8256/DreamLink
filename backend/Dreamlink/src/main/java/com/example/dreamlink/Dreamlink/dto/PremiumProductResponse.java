package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.PlanTier;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;

public record PremiumProductResponse(
        String productId,
        PlanTier planTier,
        SubscriptionStore store,
        String displayName,
        String priceLabel,
        String billingPeriod
        ) {

}
