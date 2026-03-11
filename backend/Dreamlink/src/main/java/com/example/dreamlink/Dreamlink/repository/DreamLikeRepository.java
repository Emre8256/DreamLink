package com.example.dreamlink.Dreamlink.repository;

import com.example.dreamlink.Dreamlink.entity.Dream;
import com.example.dreamlink.Dreamlink.entity.DreamLike;
import com.example.dreamlink.Dreamlink.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

@Repository
public interface DreamLikeRepository extends JpaRepository<DreamLike, UUID> {

    Optional<DreamLike> findByFromUserAndDream(User fromUser, Dream dream);

    boolean existsByFromUserIdAndDreamId(UUID fromUserId, UUID dreamId);

    Optional<DreamLike> findByFromUserAndDreamAndSource(User fromUser, Dream dream, DreamLike.LikeSource source);

    /**
     * Dreams I liked (my outgoing likes). Excludes self-likes if any exist.
     * Only includes DISCOVER likes.
     */
    @Query("SELECT dl FROM DreamLike dl WHERE dl.fromUser.id = :fromUserId AND dl.toUser.id != :fromUserId AND dl.source = 'DISCOVER' ORDER BY dl.createdAt DESC")
    List<DreamLike> findByFromUserId(@Param("fromUserId") UUID fromUserId);

    /**
     * Likes directed at me. Excludes self-likes if any exist. Only includes
     * DISCOVER likes.
     */
    @Query("SELECT dl FROM DreamLike dl WHERE dl.toUser.id = :toUserId AND dl.fromUser.id != :toUserId AND dl.source = 'DISCOVER' ORDER BY dl.createdAt DESC")
    List<DreamLike> findByToUserId(@Param("toUserId") UUID toUserId);

    /**
     * Check if userA has liked any dream owned by userB. Used for mutual match
     * detection.
     */
    boolean existsByFromUserIdAndToUserId(UUID fromUserId, UUID toUserId);

    long countByDreamId(UUID dreamId);

    long countByFromUserIdAndSourceAndCreatedAtBetween(UUID fromUserId, DreamLike.LikeSource source,
            LocalDateTime start, LocalDateTime end);

    /**
     * All likes on a specific dream (for isLiked check).
     */
    List<DreamLike> findByDreamId(UUID dreamId);
}
