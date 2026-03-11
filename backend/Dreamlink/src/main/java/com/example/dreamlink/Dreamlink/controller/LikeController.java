package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    /**
     * Like a dream (profile like for matching — not the same as the heart on dream
     * detail).
     * POST /api/likes/{dreamId}
     */
    @PostMapping("/{dreamId}")
    public ResponseEntity<String> likeDream(@PathVariable UUID dreamId) {
        likeService.likeDream(dreamId, com.example.dreamlink.Dreamlink.entity.DreamLike.LikeSource.DISCOVER);
        return ResponseEntity.ok("Beğenildi");
    }

    /**
     * Unlike a dream.
     * DELETE /api/likes/{dreamId}
     */
    @DeleteMapping("/{dreamId}")
    public ResponseEntity<Void> unlikeDream(@PathVariable UUID dreamId) {
        likeService.unlikeDream(dreamId);
        return ResponseEntity.noContent().build();
    }
}
