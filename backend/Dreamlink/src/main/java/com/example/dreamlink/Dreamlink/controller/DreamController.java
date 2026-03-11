package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.dto.CreateDreamRequest;
import com.example.dreamlink.Dreamlink.dto.DreamResponse;
import com.example.dreamlink.Dreamlink.service.DreamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/dreams")
@RequiredArgsConstructor
public class DreamController {

    private final DreamService dreamService;

    @GetMapping
    public ResponseEntity<Page<DreamResponse>> getFeed(Pageable pageable) {
        return ResponseEntity.ok(dreamService.getHomeFeed(pageable));
    }

    @GetMapping("/public")
    public ResponseEntity<Page<DreamResponse>> getPublicFeed(Pageable pageable) {
        return ResponseEntity.ok(dreamService.getPublicFeed(pageable));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<DreamResponse>> getUserDreams(@PathVariable UUID userId, Pageable pageable) {
        return ResponseEntity.ok(dreamService.getUserDreams(userId, pageable));
    }

    @PostMapping
    public ResponseEntity<DreamResponse> createDream(@RequestBody @Valid CreateDreamRequest request) {
        return ResponseEntity.ok(dreamService.createDream(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DreamResponse> getDreamById(@PathVariable UUID id) {
        return ResponseEntity.ok(dreamService.getDreamById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDream(@PathVariable UUID id) {
        dreamService.deleteDream(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/visibility")
    public ResponseEntity<DreamResponse> updateVisibility(
            @PathVariable UUID id,
            @RequestParam String visibility) {
        return ResponseEntity.ok(dreamService.updateVisibility(id, visibility));
    }
}