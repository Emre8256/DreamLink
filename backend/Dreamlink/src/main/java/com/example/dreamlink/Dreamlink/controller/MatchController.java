package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.dto.DiscoverCardResponse;
import com.example.dreamlink.Dreamlink.dto.DailyPicksResponse;
import com.example.dreamlink.Dreamlink.dto.LikeResponse;
import com.example.dreamlink.Dreamlink.dto.MutualMatchResponse;
import com.example.dreamlink.Dreamlink.service.LikeService;
import com.example.dreamlink.Dreamlink.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final LikeService likeService;

    /**
     * Discover feed: top 30 matched users for the current user.
     */
    @GetMapping("/discover")
    public ResponseEntity<List<DiscoverCardResponse>> getDiscoverFeed() {
        return ResponseEntity.ok(matchService.getDiscoverFeed());
    }

    /**
     * Daily picks: limited discover cards for the day.
     */
    @GetMapping("/daily-picks")
    public ResponseEntity<DailyPicksResponse> getDailyPicks() {
        return ResponseEntity.ok(matchService.getDailyPicks());
    }

    /**
     * Rewind the last skip (gated by entitlement).
     */
    @PostMapping("/rewind")
    public ResponseEntity<Void> rewind() {
        matchService.assertRewindAllowed();
        matchService.recordRewindUsed();
        return ResponseEntity.noContent().build();
    }

    /**
     * Users who liked my dreams.
     */
    @GetMapping("/liked-me")
    public ResponseEntity<List<LikeResponse>> getLikedMe() {
        return ResponseEntity.ok(likeService.getLikedMe());
    }

    /**
     * Dreams I liked.
     */
    @GetMapping("/my-likes")
    public ResponseEntity<List<LikeResponse>> getMyLikes() {
        return ResponseEntity.ok(likeService.getMyLikes());
    }

    /**
     * Mutual matches (both sides liked each other).
     */
    @GetMapping("/mutual")
    public ResponseEntity<List<MutualMatchResponse>> getMutualMatches() {
        return ResponseEntity.ok(likeService.getMutualMatches());
    }
}
