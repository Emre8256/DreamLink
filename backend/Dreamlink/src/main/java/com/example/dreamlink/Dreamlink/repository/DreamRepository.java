package com.example.dreamlink.Dreamlink.repository;

import com.example.dreamlink.Dreamlink.entity.Dream;
import com.example.dreamlink.Dreamlink.enums.DreamThemes;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DreamRepository extends JpaRepository<Dream, UUID> {

        Page<Dream> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

        Page<Dream> findByTheme(DreamThemes theme, Pageable pageable);

        // Ana sayfa akış algoritması
        @Query("SELECT d FROM Dream d WHERE " +
                        "(d.visibility = 'PUBLIC') OR " +
                        "(d.user.id IN :followingIds AND d.visibility != 'PRIVATE') " +
                        "ORDER BY d.createdAt DESC")
        Page<Dream> findFeedDreams(@Param("followingIds") List<UUID> followingIds, Pageable pageable);

        Page<Dream> findByVisibilityOrderByCreatedAtDesc(
                        com.example.dreamlink.Dreamlink.enums.VisibilityType visibility,
                        Pageable pageable);

        /**
         * Günlük limit kontrolü: kullanıcının bugün paylaştığı rüyayı döner.
         */
        @Query("SELECT d FROM Dream d WHERE d.user.id = :userId AND d.createdAt >= :startOfDay ORDER BY d.createdAt DESC")
        List<Dream> findTodayDreamsByUser(@Param("userId") UUID userId,
                        @Param("startOfDay") LocalDateTime startOfDay);

        /**
         * Eşleşme için aday rüyalar: son 7 gün, başka kullanıcılar, limit 2000.
         */
        @Query("SELECT d FROM Dream d WHERE d.user.id != :excludeUserId AND d.createdAt >= :since ORDER BY d.createdAt DESC")
        List<Dream> findActiveDreams(@Param("excludeUserId") UUID excludeUserId,
                        @Param("since") LocalDateTime since,
                        Pageable pageable);

        /**
         * Kullanıcının son 7 gün içindeki aktif rüyaları (Discover sorgusu için).
         */
        @Query("SELECT d FROM Dream d WHERE d.user.id = :userId AND d.createdAt >= :since")
        List<Dream> findActiveByUserId(@Param("userId") UUID userId,
                        @Param("since") LocalDateTime since);

        @Query("SELECT d FROM Dream d WHERE d.user.id = :userId AND d.id <> :excludeDreamId ORDER BY d.createdAt DESC")
        List<Dream> findRecentDreamsForContext(@Param("userId") UUID userId,
                        @Param("excludeDreamId") UUID excludeDreamId,
                        Pageable pageable);
}