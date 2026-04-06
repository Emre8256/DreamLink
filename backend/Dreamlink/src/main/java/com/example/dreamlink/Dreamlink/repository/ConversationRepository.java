package com.example.dreamlink.Dreamlink.repository;

import com.example.dreamlink.Dreamlink.dto.ConversationCardRecord;
import com.example.dreamlink.Dreamlink.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c WHERE c.user1.id = :userId OR c.user2.id = :userId ORDER BY c.lastMessageAt DESC")
    List<Conversation> findMyConversations(@Param("userId") UUID userId);

        @Query("""
                        SELECT new com.example.dreamlink.Dreamlink.dto.ConversationCardRecord(
                            c.id,
                            CASE WHEN c.user1.id = :userId THEN c.user2.id ELSE c.user1.id END,
                            CASE WHEN c.user1.id = :userId THEN c.user2.nickname ELSE c.user1.nickname END,
                            CASE WHEN c.user1.id = :userId THEN c.user2.avatarUrl ELSE c.user1.avatarUrl END,
                            COALESCE((
                                SELECT m.content
                                FROM Message m
                                WHERE m.conversation.id = c.id
                                    AND m.sentAt = (SELECT MAX(m2.sentAt) FROM Message m2 WHERE m2.conversation.id = c.id)
                            ), ''),
                            c.lastMessageAt
                        )
                        FROM Conversation c
                        WHERE c.user1.id = :userId OR c.user2.id = :userId
                        ORDER BY c.lastMessageAt DESC
                        """)
        List<ConversationCardRecord> findConversationCards(@Param("userId") UUID userId);

    @Query("SELECT c FROM Conversation c WHERE " +
            "(c.user1.id = :userA AND c.user2.id = :userB) OR " +
            "(c.user1.id = :userB AND c.user2.id = :userA)")
    Optional<Conversation> findExistingConversation(@Param("userA") UUID userA, @Param("userB") UUID userB);
}