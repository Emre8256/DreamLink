package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.dto.MatcherSummaryResponse;
import com.example.dreamlink.Dreamlink.service.MatcherObservabilityService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matcher")
@ConditionalOnProperty(name = "matcher.observability.enabled", havingValue = "true")
public class MatcherObservabilityController {

    private final MatcherObservabilityService matcherObservabilityService;

    public MatcherObservabilityController(MatcherObservabilityService matcherObservabilityService) {
        this.matcherObservabilityService = matcherObservabilityService;
    }

    @GetMapping("/summary")
    public ResponseEntity<MatcherSummaryResponse> getSummary() {
        return ResponseEntity.ok(matcherObservabilityService.getSummary());
    }
}
