package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.NotificationType;
import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String message,
        String relatedLink,
        NotificationType type,
        boolean isRead,
        LocalDateTime createdAt
) {}