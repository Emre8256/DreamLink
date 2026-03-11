package com.example.dreamlink.Dreamlink.dto;

import java.util.List;

public record DailyPicksResponse(
        List<DiscoverCardResponse> picks,
        int visibleCount,
        boolean locked,
        boolean hasMorePremium
        ) {

}
