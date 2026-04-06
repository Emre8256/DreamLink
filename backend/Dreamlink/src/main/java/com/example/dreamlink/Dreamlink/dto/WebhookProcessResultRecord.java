package com.example.dreamlink.Dreamlink.dto;

public record WebhookProcessResultRecord(
        boolean processed,
        boolean duplicate,
        String eventId,
        String message
) {
}
