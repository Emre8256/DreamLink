package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.dto.CommentResponse;
import com.example.dreamlink.Dreamlink.dto.CommentRequest;
import com.example.dreamlink.Dreamlink.service.InteractionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/interactions")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;

    @PostMapping("/like/{dreamId}")
    public ResponseEntity<String> toggleLike(@PathVariable UUID dreamId) {
        interactionService.toggleLike(dreamId);
        return ResponseEntity.ok("İşlem başarılı");
    }

    @PostMapping("/comment/{dreamId}")
    public ResponseEntity<Void> addComment(@PathVariable UUID dreamId, @RequestBody @Valid CommentRequest request) { // @Valid
                                                                                                                     // EKLENDİ
        interactionService.addComment(dreamId, request.content());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/comments/{dreamId}")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable UUID dreamId) {
        return ResponseEntity.ok(interactionService.getComments(dreamId));
    }
}