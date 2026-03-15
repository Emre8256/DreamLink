package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.DreamThemes;
import com.example.dreamlink.Dreamlink.enums.VisibilityType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record DreamResponse(
                UUID id,
                String title,
                String description,
                DreamThemes theme,
                UUID authorId,
                String nickname,
                String avatarUrl,
                int likeCount,
                int commentCount,
                List<String> tags,
                LocalDateTime createdAt,
                boolean isLiked,
                VisibilityType visibility) {
}