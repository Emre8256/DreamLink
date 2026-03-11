package com.example.dreamlink.Dreamlink.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/** Represents a mutual match (both users liked each other). */
public record MutualMatchResponse(
        UUID userId,
        String nickname,
        String avatarUrl,
        UUID conversationId,
        LocalDateTime matchedAt) {
}
