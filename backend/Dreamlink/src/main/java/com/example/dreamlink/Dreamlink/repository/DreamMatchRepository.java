package com.example.dreamlink.Dreamlink.repository;

import com.example.dreamlink.Dreamlink.entity.DreamMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DreamMatchRepository extends JpaRepository<DreamMatch, UUID> {

  /** Duplicate check before saving a match. */
  boolean existsByMyDreamIdAndMatchedDreamId(UUID myDreamId, UUID matchedDreamId);

  /**
   * Discover feed: matches for all of the user's active dreams,
   * sorted by score descending, limited to top 30.
   * Excludes matches where the matched user has already been liked by this user.
   */
  @Query("""
      SELECT dm FROM DreamMatch dm
      WHERE dm.myUserId = :userId
        AND dm.matchedAt >= :since
        AND dm.matchedDream.user.id != :userId
        AND dm.matchedDream.user.id NOT IN (
            SELECT dl.toUser.id FROM DreamLike dl WHERE dl.fromUser.id = :userId AND dl.source = 'DISCOVER'
        )
      ORDER BY dm.score DESC
      """)
  List<DreamMatch> findDiscoverMatches(@Param("userId") UUID userId,
      @Param("since") LocalDateTime since);

  /** All matches for a user (for internal use). */
  List<DreamMatch> findByMyUserId(UUID myUserId);

  void deleteByMyDreamId(UUID myDreamId);

  void deleteByMatchedDreamId(UUID matchedDreamId);
}