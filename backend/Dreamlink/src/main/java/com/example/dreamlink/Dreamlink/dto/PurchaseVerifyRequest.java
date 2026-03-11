package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;

public record PurchaseVerifyRequest(
        SubscriptionStore store,
        String productId,
        String transactionId,
        String purchaseToken,
        String receiptData,
        String storeSubscriptionId,
        String packageName
        ) {

}
