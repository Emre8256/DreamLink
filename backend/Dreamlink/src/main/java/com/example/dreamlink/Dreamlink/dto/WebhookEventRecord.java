package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;

public record WebhookEventRecord(
        SubscriptionStore store,
        String eventId,
        String eventType,
        String payloadHash,
        String rawPayload
) {
}
