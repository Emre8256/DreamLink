package com.example.dreamlink.Dreamlink.dto;

import java.util.List;
import java.util.Map;

public record MatcherSummaryResponse(
        boolean enabled,
        Map<String, Long> counts,
        List<MatcherScoreSample> recentSamples
        ) {

}
