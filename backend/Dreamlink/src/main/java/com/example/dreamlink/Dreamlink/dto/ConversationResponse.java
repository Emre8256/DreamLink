package com.example.dreamlink.Dreamlink.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        UserSummaryDto otherUser,
        String lastMessage,
        LocalDateTime lastMessageAt
) {}