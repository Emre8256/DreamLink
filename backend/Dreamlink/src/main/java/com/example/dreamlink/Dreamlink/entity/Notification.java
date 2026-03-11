package com.example.dreamlink.Dreamlink.entity;

import com.example.dreamlink.Dreamlink.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    @ToString.Exclude
    private User recipient;

    @Column(nullable = false)
    private String message;

    @Column(name = "related_link")
    private String relatedLink;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Column(name = "is_read")
    private boolean isRead = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}