package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;

public record RestorePurchaseRequest(
        SubscriptionStore store,
        String productId,
        String purchaseToken,
        String receiptData,
        String storeSubscriptionId,
        String packageName
        ) {

}
