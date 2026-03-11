package com.example.dreamlink.Dreamlink.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Discover feed card — one card per matched user (grouped by highest score).
 */
public record DiscoverCardResponse(
        UUID matchId,
        UUID matchedUserId,
        String matchedUserNickname,
        String matchedUserAvatarUrl,

        UUID matchedDreamId,
        String matchedDreamTitle,
        String matchedDreamDescription,

        int similarityPercent, // 0-100
        boolean isHot, // period == HOT
        int matchCount, // how many of my dreams matched this user
        LocalDateTime matchedAt) {
}
