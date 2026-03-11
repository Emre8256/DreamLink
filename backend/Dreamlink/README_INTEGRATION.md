# Dream-Link AI Matcher Integration Guide

This document describes how Java backend should integrate with the Python AI Matcher service.

## Scope

- Trigger Python embedding pipeline after a new dream is saved.
- Fetch discover matches from Python service when Discover is requested.
- Keep Java write path fast and non-blocking.
- Use retry-safe process endpoint on Python side.

## Existing Integration Points

- Dream create flow: src/main/java/com/example/dreamlink/Dreamlink/service/DreamService.java
- Dream API: src/main/java/com/example/dreamlink/Dreamlink/controller/DreamController.java
- Discover DTO: src/main/java/com/example/dreamlink/Dreamlink/dto/DiscoverCardResponse.java
- Discover endpoint: src/main/java/com/example/dreamlink/Dreamlink/controller/MatchController.java

## 1. Async Trigger After Dream Save

Place async trigger in DreamService after save+flush, so ID is guaranteed.

### 1.1 Add async executor config

```java
package com.example.dreamlink.Dreamlink.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "matcherTaskExecutor")
    public Executor matcherTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(12);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("matcher-");
        executor.initialize();
        return executor;
    }
}
```

### 1.2 Add matcher HTTP client service (RestTemplate)

```java
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

    @Value("${ai.matcher.base-url:http://ai-matcher:8000}")
    private String matcherBaseUrl;

    @Async("matcherTaskExecutor")
    public void triggerProcessDreamAsync(UUID dreamId) {
        String url = matcherBaseUrl + "/process-dream/" + dreamId;
        try {
            restTemplate.postForEntity(url, null, Void.class);
        } catch (RestClientException ex) {
            log.warn("AI matcher process-dream failed for dreamId={}: {}", dreamId, ex.getMessage());
        }
    }
}
```

### 1.3 RestTemplate bean

```java
package com.example.dreamlink.Dreamlink.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class HttpClientConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

### 1.4 Call it from DreamService

Insert below call right after save+flush in DreamService.createDream:

```java
private final AiMatcherClientService aiMatcherClientService;

// after save + flush
Dream savedDream = dreamRepository.save(dream);
dreamRepository.flush();

aiMatcherClientService.triggerProcessDreamAsync(savedDream.getId());
```

This call is fire-and-forget and does not block API response.

## 2. Discover Integration via Python GET /get-matches/{userId}

Use this when Discover tab data should come from Python matcher output.

### 2.1 Python response DTOs

```java
package com.example.dreamlink.Dreamlink.dto;

import java.util.List;
import java.util.UUID;

public record AiMatchResponse(
        UUID userId,
        int total,
        List<AiMatchItem> matches
) {}

public record AiMatchItem(
        UUID dreamId,
        UUID userId,
        String title,
        String description,
        double similarityPercent,
        boolean isHot
) {}
```

### 2.2 Adapter service mapping to DiscoverCardResponse

```java
package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.AiMatchItem;
import com.example.dreamlink.Dreamlink.dto.AiMatchResponse;
import com.example.dreamlink.Dreamlink.dto.DiscoverCardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DiscoverMatcherBridgeService {

    private final RestTemplate restTemplate;

    @Value("${ai.matcher.base-url:http://ai-matcher:8000}")
    private String matcherBaseUrl;

    public List<DiscoverCardResponse> getDiscoverFromAi(UUID currentUserId, int limit) {
        String url = matcherBaseUrl + "/get-matches/" + currentUserId + "?limit=" + limit;
        AiMatchResponse response = restTemplate.getForObject(url, AiMatchResponse.class);
        if (response == null || response.matches() == null) {
            return Collections.emptyList();
        }

        return response.matches().stream()
                .map(item -> toDiscoverCard(item))
                .toList();
    }

    private DiscoverCardResponse toDiscoverCard(AiMatchItem item) {
        return new DiscoverCardResponse(
                UUID.randomUUID(),
                item.userId(),
                "AIUser-" + item.userId().toString().substring(0, 8),
                null,
                item.dreamId(),
                item.title(),
                item.description(),
                (int) Math.round(item.similarityPercent()),
                item.isHot(),
                1,
                LocalDateTime.now()
        );
    }
}
```

### 2.3 MatchService switch example

Inside MatchService.getDiscoverFeed:

```java
private final DiscoverMatcherBridgeService discoverMatcherBridgeService;

@Transactional(readOnly = true)
public List<DiscoverCardResponse> getDiscoverFeed() {
    User user = getCurrentUser();
    return discoverMatcherBridgeService.getDiscoverFromAi(user.getId(), 30);
}
```

## 3. Optional Feign Alternative (if team prefers OpenFeign)

If Feign is preferred, add spring-cloud-openfeign dependency and use:

```java
@FeignClient(name = "aiMatcherClient", url = "${ai.matcher.base-url:http://ai-matcher:8000}")
public interface AiMatcherFeignClient {
    @PostMapping("/process-dream/{dreamId}")
    void processDream(@PathVariable UUID dreamId);

    @GetMapping("/get-matches/{userId}")
    AiMatchResponse getMatches(@PathVariable UUID userId, @RequestParam int limit);
}
```

## 4. Python Retry Logic for process-dream

Python endpoint now retries dream lookup to handle transaction visibility delay from Java commit flow.

Behavior:
- Endpoint: POST /process-dream/{dream_id}
- Retries DB lookup before returning 404.
- Environment knobs:
  - PROCESS_DREAM_RETRY_COUNT (default: 6)
  - PROCESS_DREAM_RETRY_DELAY_SECONDS (default: 0.35)

So Java can trigger matcher immediately after flush/commit boundary without strict sleep in Java code.

## 5. Runtime Configuration

Add to Java application properties:

```properties
ai.matcher.base-url=http://ai-matcher:8000
```

In Docker network, internal DNS name should be service name:
- Java -> Python: http://ai-matcher:8000
- Python -> Java: http://dreamlink-backend:8080
- Both -> Postgres: postgres:5432

## 6. Error Strategy

- Java to Python calls are async and non-blocking for create dream path.
- Failures are logged and should not break core user flow.
- Discover bridge should fallback to empty list or existing local discover logic if Python is unavailable.

## 7. Rollout Checklist

- Add AsyncConfig and HttpClientConfig.
- Add AiMatcherClientService.
- Inject async trigger into DreamService.createDream.
- Add DiscoverMatcherBridgeService and DTOs.
- Switch MatchService.getDiscoverFeed source to bridge (feature-flag optional).
- Verify Docker/internal DNS ai-matcher resolution.
