package com.example.dreamlink.Dreamlink.service;

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

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public List<ConversationResponse> getMyConversations() {
        User user = getCurrentUser();
        List<Conversation> conversations = conversationRepository.findMyConversations(user.getId());

        return conversations.stream().map(c -> {

            User otherUser = c.getUser1().getId().equals(user.getId()) ? c.getUser2() : c.getUser1();

            // Son mesaj
            String lastMsgContent = "";
            if (!c.getMessages().isEmpty()) {
                // Listeyi son mesaj en sonda olacak şekilde yazsın
                lastMsgContent = c.getMessages().get(c.getMessages().size() - 1).getContent();
            }

            return new ConversationResponse(
                    c.getId(),
                    new UserSummaryDto(otherUser.getId(), otherUser.getNickname(), otherUser.getAvatarUrl()),
                    lastMsgContent,
                    c.getLastMessageAt());
        }).toList();
    }

    public List<MessageResponse> getMessages(UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Sohbet bulunamadı"));
        User currentUser = getCurrentUser();
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
        User sender = getCurrentUser();
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

        return new MessageResponse(
                savedMessage.getId(),
                savedMessage.getSender().getId(),
                savedMessage.getContent(),
                savedMessage.getSentAt(),
                savedMessage.isRead());
    }

    @Transactional
    public void deleteConversation(UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Sohbet bulunamadı"));
        User currentUser = getCurrentUser();

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
