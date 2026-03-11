package com.example.dreamlink.Dreamlink.dto;

import java.util.Map;

public record AnalyticsEventRecord(
        String name,
        String source,
        String reason,
        String user,
        Map<String, Object> properties,
        String timestamp
        ) {

}
