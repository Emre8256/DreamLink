package com.example.dreamlink.Dreamlink.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/** Represents an outgoing or incoming dream like. */
public record LikeResponse(
                UUID likeId,
                UUID dreamId,
                String dreamTitle,
                UUID relatedUserId,
                String relatedUserNickname,
                String relatedUserAvatarUrl,
                LocalDateTime likedAt) {
}
