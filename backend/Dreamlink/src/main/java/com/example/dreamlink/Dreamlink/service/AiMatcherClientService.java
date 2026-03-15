package com.example.dreamlink.Dreamlink.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiMatcherClientService {

    private final RestTemplate restTemplate;

    @Value("${ai.matcher.base-url:http://127.0.0.1:8000}")
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

    public String requestDreamInterpretation(String title, String description, String persona, String zodiacSign) {
        String normalizedBaseUrl = matcherBaseUrl == null ? "http://127.0.0.1:8000" : matcherBaseUrl.trim();
        normalizedBaseUrl = normalizedBaseUrl.replace("localhost", "127.0.0.1");
        if (normalizedBaseUrl.endsWith("/")) {
            normalizedBaseUrl = normalizedBaseUrl.substring(0, normalizedBaseUrl.length() - 1);
        }
        String url = normalizedBaseUrl + "/interpret-dream";
        log.debug("Calling AI matcher interpret endpoint: {}", url);
        try {
            MatcherInterpretResponse response = restTemplate.postForObject(
                    url,
                    new MatcherInterpretRequest(
                            (title + "\n" + description).trim(),
                            persona,
                            zodiacSign),
                    MatcherInterpretResponse.class);

            if (response == null || response.content() == null || response.content().isBlank()) {
                throw new ResponseStatusException(SERVICE_UNAVAILABLE, "AI yorumu üretilemedi");
            }
            return response.content();
        } catch (RestClientException ex) {
            log.warn("AI matcher interpret-dream failed for persona={}: {}", persona, ex.getMessage());
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "AI yorum servisine ulasilamadi");
        }
    }

    private record MatcherInterpretRequest(String dreamText, String persona, String zodiacSign) {
    }

    private record MatcherInterpretResponse(String persona, String zodiacSign, String content) {
    }
}
