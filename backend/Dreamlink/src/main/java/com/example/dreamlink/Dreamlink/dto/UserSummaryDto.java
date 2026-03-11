package com.example.dreamlink.Dreamlink.dto;

import java.util.UUID;

public record UserSummaryDto(
        UUID id,
        String nickname,
        String avatarUrl
) {}