package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.AnalyticsEventRecord;
import com.example.dreamlink.Dreamlink.dto.AnalyticsEventRequest;
import com.example.dreamlink.Dreamlink.dto.AnalyticsSummaryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.LongAdder;

@Service
public class AnalyticsEventService {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsEventService.class);

    private static final Set<String> ALLOWED_EVENTS = Set.of(
            "paywall_view",
            "paywall_cta_click",
            "entitlement_denied",
            "like_limit_hit",
            "daily_picks_view",
            "boost_activated",
            "rewind_used"
    );

    private final ConcurrentHashMap<String, LongAdder> countsByName = new ConcurrentHashMap<>();
    private final ConcurrentLinkedDeque<AnalyticsEventRecord> recentEvents = new ConcurrentLinkedDeque<>();

    @Value("${analytics.summary.max-events:100}")
    private int maxEvents;

    public void trackClientEvent(AnalyticsEventRequest event, String user) {
        if (event == null) {
            return;
        }
        String normalized = normalizeName(event.name());
        if (normalized == null) {
            return;
        }
        trackEvent(new AnalyticsEventRecord(
                normalized,
                safe(event.source()),
                safe(event.reason()),
                user,
                safeProperties(event.properties()),
                safe(event.timestamp())
        ));
    }

    public void trackServerEvent(String name,
            String source,
            String reason,
            String user,
            Map<String, Object> properties) {
        String normalized = normalizeName(name);
        if (normalized == null) {
            return;
        }
        trackEvent(new AnalyticsEventRecord(
                normalized,
                safe(source),
                safe(reason),
                user,
                safeProperties(properties),
                Instant.now().toString()
        ));
    }

    public AnalyticsSummaryResponse getSummary(int limit) {
        int effectiveLimit = Math.max(1, limit);
        List<AnalyticsEventRecord> events = new ArrayList<>(effectiveLimit);
        int added = 0;
        for (AnalyticsEventRecord record : recentEvents) {
            events.add(record);
            added++;
            if (added >= effectiveLimit) {
                break;
            }
        }

        Map<String, Long> countsSnapshot = new LinkedHashMap<>();
        countsByName.forEach((key, value) -> countsSnapshot.put(key, value.sum()));

        return new AnalyticsSummaryResponse(countsSnapshot, events);
    }

    private void trackEvent(AnalyticsEventRecord record) {
        countsByName.computeIfAbsent(record.name(), ignored -> new LongAdder()).increment();
        recentEvents.addFirst(record);
        trimEvents();
        if (logger.isDebugEnabled()) {
            logger.debug("analytics_track name={} source={} reason={} user={} properties={} ts={}",
                    record.name(), record.source(), record.reason(), record.user(), record.properties(), record.timestamp());
        }
    }

    private void trimEvents() {
        int limit = Math.max(10, maxEvents);
        while (recentEvents.size() > limit) {
            recentEvents.pollLast();
        }
    }

    private String normalizeName(String name) {
        if (name == null) {
            return null;
        }
        String normalized = name.trim().toLowerCase();
        if (!ALLOWED_EVENTS.contains(normalized)) {
            logger.warn("analytics_event_unknown name={}", normalized);
            return null;
        }
        return normalized;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private Map<String, Object> safeProperties(Map<String, Object> properties) {
        if (properties == null || properties.isEmpty()) {
            return Collections.emptyMap();
        }
        return Map.copyOf(properties);
    }
}
