package com.example.dreamlink.Dreamlink.dto;

import jakarta.validation.constraints.NotBlank;

public record SendMessageRequest(
        @NotBlank(message = "Mesaj içeriği boş olamaz")
        String content
) {}