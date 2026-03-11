package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.AiMatcherMatchItem;
import com.example.dreamlink.Dreamlink.dto.AiMatcherMatchResponse;
import com.example.dreamlink.Dreamlink.dto.DiscoverCardResponse;
import com.example.dreamlink.Dreamlink.entity.Dream;
import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.repository.DreamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiMatcherDiscoverService {

    private final RestTemplate restTemplate;
    private final DreamRepository dreamRepository;

    @Value("${ai.matcher.base-url:http://localhost:8000}")
    private String matcherBaseUrl;

    public List<DiscoverCardResponse> fetchDiscoverFeed(UUID currentUserId, int limit) {
        String url = matcherBaseUrl + "/get-matches/" + currentUserId + "?limit=" + limit;
        try {
            AiMatcherMatchResponse response = restTemplate.getForObject(url, AiMatcherMatchResponse.class);
            if (response == null || response.matches() == null) {
                return Collections.emptyList();
            }
            return response.matches().stream().map(this::mapToDiscoverCard).toList();
        } catch (RestClientException ex) {
            log.warn("AI matcher get-matches failed for userId={}: {}", currentUserId, ex.getMessage());
            throw ex;
        }
    }

    private DiscoverCardResponse mapToDiscoverCard(AiMatcherMatchItem item) {
        Dream dream = dreamRepository.findById(item.dreamId()).orElse(null);
        User matchedUser = dream != null ? dream.getUser() : null;

        UUID matchId = UUID.nameUUIDFromBytes(
                (item.userId() + ":" + item.dreamId()).getBytes(StandardCharsets.UTF_8)
        );

        String nickname = matchedUser != null ? matchedUser.getNickname() : "Unknown";
        String avatarUrl = matchedUser != null ? matchedUser.getAvatarUrl() : null;
        LocalDateTime matchedAt = dream != null ? dream.getCreatedAt() : LocalDateTime.now();

        return new DiscoverCardResponse(
                matchId,
                item.userId(),
                nickname,
                avatarUrl,
                item.dreamId(),
                item.title(),
                item.description(),
                (int) Math.round(item.similarityPercent()),
                item.isHot(),
                1,
                matchedAt
        );
    }
}
