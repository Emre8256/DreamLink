package com.example.dreamlink.Dreamlink.dto;

import java.util.Map;

public record AnalyticsEventRequest(
        String name,
        String source,
        String reason,
        Map<String, Object> properties,
        String timestamp
        ) {

}
