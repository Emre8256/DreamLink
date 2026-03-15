package com.example.dreamlink.Dreamlink.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "dream_interpretations",
        uniqueConstraints = @UniqueConstraint(name = "uk_dream_interpretations_dream_persona", columnNames = {
                "dream_id", "persona" }))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DreamInterpretation {

    @Id
    @GeneratedValue
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dream_id", nullable = false)
    @ToString.Exclude
    private Dream dream;

    @Column(nullable = false, length = 50)
    private String persona;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "zodiac_sign", nullable = false, length = 30)
    private String zodiacSign;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
