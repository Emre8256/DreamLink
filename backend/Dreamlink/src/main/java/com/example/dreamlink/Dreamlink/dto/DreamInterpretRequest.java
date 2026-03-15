package com.example.dreamlink.Dreamlink.dto;

import jakarta.validation.constraints.NotBlank;

public record DreamInterpretRequest(
        @NotBlank(message = "Persona secimi zorunludur")
        String persona,

        String zodiacSign) {
}
