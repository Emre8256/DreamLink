package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.dto.ConversationResponse;
import com.example.dreamlink.Dreamlink.dto.MessageResponse;
import com.example.dreamlink.Dreamlink.dto.SendMessageRequest;
import com.example.dreamlink.Dreamlink.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getMyConversations() {
        return ResponseEntity.ok(chatService.getMyConversations());
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable UUID conversationId) {
        return ResponseEntity.ok(chatService.getMessages(conversationId));
    }

    @PostMapping("/{conversationId}/send")
    public ResponseEntity<MessageResponse> sendMessage(@PathVariable UUID conversationId,
            @RequestBody @Valid SendMessageRequest request) {
        return ResponseEntity.ok(chatService.sendMessage(conversationId, request.content()));
    }

    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> deleteConversation(@PathVariable UUID conversationId) {
        chatService.deleteConversation(conversationId);
        return ResponseEntity.noContent().build();
    }
}
