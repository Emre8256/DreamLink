package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.dto.AnalyticsEventRequest;
import com.example.dreamlink.Dreamlink.dto.AnalyticsSummaryResponse;
import com.example.dreamlink.Dreamlink.service.AnalyticsEventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);
    private final AnalyticsEventService analyticsEventService;

    public AnalyticsController(AnalyticsEventService analyticsEventService) {
        this.analyticsEventService = analyticsEventService;
    }

    @PostMapping("/events")
    public ResponseEntity<Void> logEvent(@RequestBody AnalyticsEventRequest event) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String user = auth != null ? auth.getName() : "anonymous";
        log.info(
                "analytics_event name={} source={} reason={} user={} properties={} ts={}",
                event.name(),
                event.source(),
                event.reason(),
                user,
                event.properties(),
                event.timestamp()
        );
        analyticsEventService.trackClientEvent(event, user);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryResponse> getSummary(
            @RequestParam(name = "limit", defaultValue = "50") int limit) {
        return ResponseEntity.ok(analyticsEventService.getSummary(limit));
    }
}
