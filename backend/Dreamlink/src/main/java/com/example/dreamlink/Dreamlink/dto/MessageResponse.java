package com.example.dreamlink.Dreamlink.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID senderId,
        String content,
        LocalDateTime sentAt,
        boolean isRead
) {}