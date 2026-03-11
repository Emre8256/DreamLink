package com.example.dreamlink.Dreamlink.dto;

import java.time.LocalDateTime;

public record BoostStatusResponse(
        boolean available,
        LocalDateTime lastActivatedAt,
        LocalDateTime nextAvailableAt,
        long cooldownHours
        ) {

}
