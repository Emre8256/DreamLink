package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.NotificationResponse;
import com.example.dreamlink.Dreamlink.entity.Notification;
import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.enums.NotificationType;
import com.example.dreamlink.Dreamlink.repository.NotificationRepository;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public List<NotificationResponse> getMyNotifications() {
        User user = getCurrentUser();

        Page<Notification> page = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                user.getId(),
                PageRequest.of(0, 20)
        );

        return page.getContent().stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getMessage(),
                        n.getRelatedLink(),
                        n.getType(),
                        n.isRead(),
                        n.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public void markAllAsRead() {
        User user = getCurrentUser();
        notificationRepository.markAllAsRead(user.getId());
    }

    @Transactional
    public void send(User recipient, String message, NotificationType type, String link) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .message(message)
                .type(type)
                .relatedLink(link)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }
}