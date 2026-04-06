package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PurchaseVerifyRequest(
                @NotNull SubscriptionStore store,
                @NotBlank @Size(max = 120) String productId,
                @Size(max = 180) String transactionId,
                @Size(max = 500) String purchaseToken,
                @Size(max = 6000) String receiptData,
                @Size(max = 180) String storeSubscriptionId,
                @Size(max = 255) String packageName
        ) {

        @AssertTrue(message = "PLAY_STORE icin purchaseToken, APP_STORE icin receiptData zorunludur")
        public boolean hasStoreSpecificPayload() {
                if (store == null) {
                        return false;
                }
                if (store == SubscriptionStore.PLAY_STORE) {
                        return purchaseToken != null && !purchaseToken.isBlank();
                }
                if (store == SubscriptionStore.APP_STORE) {
                        return receiptData != null && !receiptData.isBlank();
                }
                return true;
        }

}
