package com.example.dreamlink.Dreamlink.dto;

import java.util.List;
import java.util.UUID;

public record AiMatcherMatchResponse(
        UUID userId,
        int total,
        List<AiMatcherMatchItem> matches
) {
}
