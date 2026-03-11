package com.example.dreamlink.Dreamlink.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiMatcherClientService {

    private final RestTemplate restTemplate;

    @Value("${ai.matcher.base-url:http://localhost:8000}")
    private String matcherBaseUrl;

    @Async
    public void triggerProcessDreamAsync(UUID dreamId) {
        String url = matcherBaseUrl + "/process-dream/" + dreamId;
        try {
            restTemplate.postForEntity(url, null, Void.class);
        } catch (RestClientException ex) {
            log.warn("AI matcher process-dream failed for dreamId={}: {}", dreamId, ex.getMessage());
        }
    }
}
