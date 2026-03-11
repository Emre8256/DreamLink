package com.example.dreamlink.Dreamlink.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
        @NotBlank(message = "Yorum boş olamaz")
        String content
) {}