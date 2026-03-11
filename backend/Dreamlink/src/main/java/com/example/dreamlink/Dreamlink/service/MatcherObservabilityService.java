package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.MatcherScoreSample;
import com.example.dreamlink.Dreamlink.dto.MatcherSummaryResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.LongAdder;


@Service
public class MatcherObservabilityService {

    @Value("${matcher.observability.enabled:false}")
    private boolean enabled;

    @Value("${matcher.observability.max-samples:50}")
    private int maxSamples;

    private final LongAdder total = new LongAdder();
    private final LongAdder success = new LongAdder();
    private final LongAdder timeout = new LongAdder();
    private final LongAdder invalidScore = new LongAdder();
    private final LongAdder failure = new LongAdder();
    private final LongAdder interrupted = new LongAdder();
    private final LongAdder fallbackUsed = new LongAdder();

    private final ConcurrentLinkedDeque<MatcherScoreSample> samples = new ConcurrentLinkedDeque<>();

    public void recordSuccess(double score, UUID leftDreamId, UUID rightDreamId) {
        if (!enabled) {
            return;
        }
        total.increment();
        success.increment();
        addSample("success", score, leftDreamId, rightDreamId);
    }

    public void recordTimeout(UUID leftDreamId, UUID rightDreamId) {
        if (!enabled) {
            return;
        }
        total.increment();
        timeout.increment();
        fallbackUsed.increment();
        addSample("timeout", null, leftDreamId, rightDreamId);
    }

    public void recordInvalidScore(double score, UUID leftDreamId, UUID rightDreamId) {
        if (!enabled) {
            return;
        }
        total.increment();
        invalidScore.increment();
        fallbackUsed.increment();
        addSample("invalid_score", score, leftDreamId, rightDreamId);
    }

    public void recordFailure(UUID leftDreamId, UUID rightDreamId) {
        if (!enabled) {
            return;
        }
        total.increment();
        failure.increment();
        fallbackUsed.increment();
        addSample("failure", null, leftDreamId, rightDreamId);
    }

    public void recordInterrupted(UUID leftDreamId, UUID rightDreamId) {
        if (!enabled) {
            return;
        }
        total.increment();
        interrupted.increment();
        fallbackUsed.increment();
        addSample("interrupted", null, leftDreamId, rightDreamId);
    }

    public MatcherSummaryResponse getSummary() {
        if (!enabled) {
            return new MatcherSummaryResponse(false, Map.of(), List.of());
        }
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("total", total.sum());
        counts.put("success", success.sum());
        counts.put("timeout", timeout.sum());
        counts.put("invalid_score", invalidScore.sum());
        counts.put("failure", failure.sum());
        counts.put("interrupted", interrupted.sum());
        counts.put("fallback_used", fallbackUsed.sum());

        int limit = Math.max(1, maxSamples);
        List<MatcherScoreSample> recent = new ArrayList<>(limit);
        int added = 0;
        for (MatcherScoreSample sample : samples) {
            recent.add(sample);
            added++;
            if (added >= limit) {
                break;
            }
        }

        return new MatcherSummaryResponse(true, counts, recent);
    }

    private void addSample(String outcome, Double score, UUID leftDreamId, UUID rightDreamId) {
        int limit = Math.max(1, maxSamples);
        samples.addFirst(new MatcherScoreSample(
                Instant.now().toString(),
                outcome,
                score,
                leftDreamId,
                rightDreamId
        ));
        while (samples.size() > limit) {
            samples.pollLast();
        }
    }
}
