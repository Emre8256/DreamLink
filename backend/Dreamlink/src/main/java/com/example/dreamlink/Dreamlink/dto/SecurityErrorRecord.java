package com.example.dreamlink.Dreamlink.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Instant;

public record SecurityErrorRecord(
        int status,
        String error,
        String message,
        String path,
        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant timestamp
) {
    public static SecurityErrorRecord of(int status, String error, String message, String path) {
        return new SecurityErrorRecord(status, error, message, path, Instant.now());
    }
}
