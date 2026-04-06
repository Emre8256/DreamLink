package com.example.dreamlink.Dreamlink.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DiscoverCardRecord(
        UUID matchId,
        UUID matchedUserId,
        String matchedUserNickname,
        String matchedUserAvatarUrl,
        UUID matchedDreamId,
        String matchedDreamTitle,
        String matchedDreamDescription,
        int similarityPercent,
        boolean isHot,
        int matchCount,
        LocalDateTime matchedAt
) {
}
