package com.example.dreamlink.Dreamlink.entity;

import com.example.dreamlink.Dreamlink.enums.MatchPeriod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Directional match: myDream → matchedDream.
 * Both A→B and B→A rows are stored so each user can query their own matches.
 */
@Entity
@Table(name = "dream_matches", indexes = {
        @Index(name = "idx_dream_matches_my_dream", columnList = "my_dream_id"),
        @Index(name = "idx_dream_matches_matched_dream", columnList = "matched_dream_id"),
        @Index(name = "idx_dream_matches_my_user", columnList = "my_user_id"),
}, uniqueConstraints = {
        @UniqueConstraint(columnNames = { "my_dream_id", "matched_dream_id" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DreamMatch {

    @Id
    @GeneratedValue
    private UUID id;

    /** The dream belonging to the current user side of this row. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "my_dream_id", nullable = false)
    @ToString.Exclude
    private Dream myDream;

    /** The matched dream from another user. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matched_dream_id", nullable = false)
    @ToString.Exclude
    private Dream matchedDream;

    /**
     * Denormalized for fast Discover queries without joining dreams table.
     * Equals myDream.user.id
     */
    @Column(name = "my_user_id", nullable = false)
    private UUID myUserId;

    /** Normalized similarity score 0.0 – 1.0 */
    @Column(name = "similarity_score", nullable = false)
    private Double score;

    /** HOT = matched dream was posted today; WEEK = within last 7 days */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MatchPeriod period;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime matchedAt;
}