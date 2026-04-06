package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.ConversationCardRecord;
import com.example.dreamlink.Dreamlink.dto.ConversationResponse;
import com.example.dreamlink.Dreamlink.dto.MessageResponse;
import com.example.dreamlink.Dreamlink.dto.UserSummaryDto;
import com.example.dreamlink.Dreamlink.entity.Conversation;
import com.example.dreamlink.Dreamlink.entity.Message;
import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.repository.ConversationRepository;
import com.example.dreamlink.Dreamlink.repository.MessageRepository;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private java.util.Optional<User> getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return java.util.Optional.empty();
        return userRepository.findByEmail(auth.getName());
    }

    public List<ConversationResponse> getMyConversations() {
        User user = getCurrentUser().orElseThrow(() -> new RuntimeException("Yetkisiz erişim: Kullanıcı bulunamadı"));
        List<ConversationCardRecord> cards = conversationRepository.findConversationCards(user.getId());

        return cards.stream().map(card -> new ConversationResponse(
                card.conversationId(),
                new UserSummaryDto(card.otherUserId(), card.otherUserNickname(), card.otherUserAvatarUrl()),
                card.lastMessage(),
                card.lastMessageAt())).toList();
    }

    public List<MessageResponse> getMessages(UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Sohbet bulunamadı"));
        User currentUser = getCurrentUser().orElseThrow(() -> new RuntimeException("Yetkisiz erişim: Kullanıcı bulunamadı"));
        if (!conversation.getUser1().getId().equals(currentUser.getId())
                && !conversation.getUser2().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Bu sohbete erişim yetkiniz yok");
        }

        List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);

        return messages.stream().map(m -> new MessageResponse(
                m.getId(),
                m.getSender().getId(),
                m.getContent(),
                m.getSentAt(),
                m.isRead())).toList();
    }

    @Transactional
    public MessageResponse sendMessage(UUID conversationId, String content) {
        User sender = getCurrentUser().orElseThrow(() -> new RuntimeException("Yetkisiz erişim: Kullanıcı bulunamadı"));
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Sohbet bulunamadı"));

        if (!conversation.getUser1().getId().equals(sender.getId())
                && !conversation.getUser2().getId().equals(sender.getId())) {
            throw new RuntimeException("Bu sohbete mesaj gönderme yetkiniz yok");
        }

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(content)
                .isRead(false)
                .sentAt(LocalDateTime.now())
                .build();

        Message savedMessage = messageRepository.save(message);

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        MessageResponse response = new MessageResponse(
                savedMessage.getId(),
                savedMessage.getSender().getId(),
                savedMessage.getContent(),
                savedMessage.getSentAt(),
                savedMessage.isRead());

        // Gerçek zamanlı: Sohbete abone tüm kullanıcılara broadcast
        String topic = "/topic/chat/" + conversationId;
        messagingTemplate.convertAndSend(topic, response);
        System.out.println("[WS] Mesaj broadcast edildi: " + topic);

        // Kullanıcıların kişisel kuyruğuna da (mesajlar listesi için) gönder
        User otherUser = conversation.getUser1().getId().equals(sender.getId()) ? conversation.getUser2() : conversation.getUser1();
        messagingTemplate.convertAndSendToUser(otherUser.getEmail(), "/queue/messages", response);
        messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/messages", response);

        return response;
    }

    @Transactional
    public void deleteConversation(UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Sohbet bulunamadı"));
        User currentUser = getCurrentUser().orElseThrow(() -> new RuntimeException("Yetkisiz erişim: Kullanıcı bulunamadı"));

        // Check ownership
        if (!conversation.getUser1().getId().equals(currentUser.getId())
                && !conversation.getUser2().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Bu sohbeti silme yetkiniz yok");
        }

        // Delete messages first (manual cascade)
        messageRepository.deleteByConversationId(conversationId);

        conversationRepository.delete(conversation);
    }
}
