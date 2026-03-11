package com.example.dreamlink.Dreamlink.dto;

import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String nickname,
        String bio,
        String avatarUrl,
        Integer age,
        String location,
        int dreamCount,
        long followerCount,
        long followingCount,
        boolean isFollowing
) {}