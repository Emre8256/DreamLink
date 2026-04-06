package com.example.dreamlink.Dreamlink.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DreamContextItemRecord(
        UUID dreamId,
        String title,
        String description,
        LocalDateTime createdAt
) {
}
