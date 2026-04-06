package com.example.dreamlink.Dreamlink.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ConversationCardRecord(
        UUID conversationId,
        UUID otherUserId,
        String otherUserNickname,
        String otherUserAvatarUrl,
        String lastMessage,
        LocalDateTime lastMessageAt
) {
}
