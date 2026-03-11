package com.example.dreamlink.Dreamlink.dto;

import java.util.List;
import java.util.Map;

public record AnalyticsSummaryResponse(
        Map<String, Long> countsByName,
        List<AnalyticsEventRecord> recentEvents
        ) {

}
