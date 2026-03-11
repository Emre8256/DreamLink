package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.MatchStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record DreamMatchResponse(
        UUID id,

        UUID myDreamId,
        String myDreamTitle,

        UUID matchedDreamId,
        String matchedDreamTitle,
        String matchedDreamDescription,

        UserSummaryDto matchedUser,

        double score,            // Benzerlik oranı
        MatchStatus status,      // PENDING varsayılan
        LocalDateTime matchedAt
) {}