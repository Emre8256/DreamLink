package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.entity.Dream;
import com.example.dreamlink.Dreamlink.repository.DreamMatchRepository;
import com.example.dreamlink.Dreamlink.repository.DreamRepository;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;

class MatchServiceTest {

    private MatchService createService(MatcherAdapter matcherAdapter) {
        DreamMatchRepository matchRepository = Mockito.mock(DreamMatchRepository.class);
        DreamRepository dreamRepository = Mockito.mock(DreamRepository.class);
        UserRepository userRepository = Mockito.mock(UserRepository.class);
        PremiumGateService premiumGateService = Mockito.mock(PremiumGateService.class);
        DailyPicksResetService dailyPicksResetService = Mockito.mock(DailyPicksResetService.class);
        RetentionEventPublisher retentionEventPublisher = Mockito.mock(RetentionEventPublisher.class);
        AnalyticsEventService analyticsEventService = Mockito.mock(AnalyticsEventService.class);
        MatcherObservabilityService matcherObservabilityService = Mockito.mock(MatcherObservabilityService.class);

        return new MatchService(
                matchRepository,
                dreamRepository,
                userRepository,
                premiumGateService,
                matcherAdapter,
                dailyPicksResetService,
                retentionEventPublisher,
                analyticsEventService,
                matcherObservabilityService
        );
    }

    @Test
    void scoreWithFallback_returnsZeroOnException() {
        MatcherAdapter matcherAdapter = Mockito.mock(MatcherAdapter.class);

        Mockito.when(matcherAdapter.score(any(), any())).thenThrow(new RuntimeException("boom"));

        MatchService service = createService(matcherAdapter);

        Dream left = Dream.builder().title("a").description("b").build();
        Dream right = Dream.builder().title("c").description("d").build();

        double score = service.scoreWithFallback(left, right);
        assertEquals(0.0, score, 0.0001);
    }

    @Test
    void scoreWithFallback_returnsZeroOnTimeout() {
        MatcherAdapter matcherAdapter = Mockito.mock(MatcherAdapter.class);

        Mockito.when(matcherAdapter.score(any(), any())).thenAnswer(invocation -> {
            Thread.sleep(50);
            return 0.9;
        });

        MatchService service = createService(matcherAdapter);
        ReflectionTestUtils.setField(service, "matcherTimeoutMs", 5L);

        Dream left = Dream.builder().title("a").description("b").build();
        Dream right = Dream.builder().title("c").description("d").build();

        double score = service.scoreWithFallback(left, right);
        assertEquals(0.0, score, 0.0001);
    }

    @Test
    void scoreWithFallback_returnsZeroOnNaNScore() {
        MatcherAdapter matcherAdapter = Mockito.mock(MatcherAdapter.class);
        Mockito.when(matcherAdapter.score(any(), any())).thenReturn(Double.NaN);

        MatchService service = createService(matcherAdapter);

        Dream left = Dream.builder().title("a").description("b").build();
        Dream right = Dream.builder().title("c").description("d").build();

        double score = service.scoreWithFallback(left, right);
        assertEquals(0.0, score, 0.0001);
    }

    @Test
    void scoreWithFallback_returnsZeroOnInfiniteScore() {
        MatcherAdapter matcherAdapter = Mockito.mock(MatcherAdapter.class);
        Mockito.when(matcherAdapter.score(any(), any())).thenReturn(Double.POSITIVE_INFINITY);

        MatchService service = createService(matcherAdapter);

        Dream left = Dream.builder().title("a").description("b").build();
        Dream right = Dream.builder().title("c").description("d").build();

        double score = service.scoreWithFallback(left, right);
        assertEquals(0.0, score, 0.0001);
    }

    @Test
    void scoreWithFallback_returnsScoreOnSuccess() {
        MatcherAdapter matcherAdapter = Mockito.mock(MatcherAdapter.class);
        Mockito.when(matcherAdapter.score(any(), any())).thenReturn(0.42);

        MatchService service = createService(matcherAdapter);

        Dream left = Dream.builder().title("a").description("b").build();
        Dream right = Dream.builder().title("c").description("d").build();

        double score = service.scoreWithFallback(left, right);
        assertEquals(0.42, score, 0.0001);
    }
}
