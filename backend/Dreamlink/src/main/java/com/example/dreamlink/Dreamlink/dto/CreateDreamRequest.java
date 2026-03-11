package com.example.dreamlink.Dreamlink.dto;

import com.example.dreamlink.Dreamlink.enums.DreamThemes;
import com.example.dreamlink.Dreamlink.enums.VisibilityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateDreamRequest(
        @NotBlank(message = "Başlık boş olamaz")
        @Size(max = 100, message = "Başlık en fazla 100 karakter olabilir")
        String title,

        @NotBlank(message = "Rüya içeriği boş olamaz")
        String description,

        @NotNull(message = "Bir tema seçmelisiniz")
        DreamThemes theme,

        @NotNull(message = "Görünürlük ayarı seçmelisiniz")
        VisibilityType visibility,

        List<String> tagNames // Opsiyonel
) {}