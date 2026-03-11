package com.example.dreamlink.Dreamlink.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Records that fromUser liked a specific dream (owned by toUser).
 * toUser is denormalized for fast "who liked me" queries.
 */
@Entity
@Table(name = "dream_likes", indexes = {
                @Index(name = "idx_dream_likes_from_user", columnList = "from_user_id"),
                @Index(name = "idx_dream_likes_to_user", columnList = "to_user_id"),
                @Index(name = "idx_dream_likes_dream", columnList = "dream_id"),
}, uniqueConstraints = {
                @UniqueConstraint(columnNames = { "from_user_id", "dream_id", "source" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DreamLike {

        public enum LikeSource {
                FEED,
                DISCOVER
        }

        @Id
        @GeneratedValue
        private UUID id;

        /** The user who pressed like. */
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "from_user_id", nullable = false)
        @ToString.Exclude
        private User fromUser;

        /** The owner of the liked dream (denormalized). */
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "to_user_id", nullable = false)
        @ToString.Exclude
        private User toUser;

        /** The dream that was liked. */
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "dream_id", nullable = false)
        @ToString.Exclude
        private Dream dream;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        @Builder.Default
        private LikeSource source = LikeSource.FEED;

        @CreationTimestamp
        private LocalDateTime createdAt;
}