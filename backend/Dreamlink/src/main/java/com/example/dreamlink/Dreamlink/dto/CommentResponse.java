package com.example.dreamlink.Dreamlink.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        String content,
        String nickname,
        String avatarUrl,
        LocalDateTime createdAt) {
}
