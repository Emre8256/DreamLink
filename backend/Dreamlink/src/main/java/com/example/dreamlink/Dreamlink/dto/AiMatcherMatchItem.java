package com.example.dreamlink.Dreamlink.dto;

import java.util.UUID;

public record AiMatcherMatchItem(
        UUID dreamId,
        UUID userId,
        String title,
        String description,
        double similarityPercent,
        boolean isHot
) {
}
