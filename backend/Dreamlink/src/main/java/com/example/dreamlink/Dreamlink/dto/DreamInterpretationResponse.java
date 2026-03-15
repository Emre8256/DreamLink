package com.example.dreamlink.Dreamlink.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DreamInterpretationResponse(
        UUID id,
        UUID dreamId,
        String persona,
        String content,
        String zodiacSign,
        LocalDateTime createdAt) {
}
