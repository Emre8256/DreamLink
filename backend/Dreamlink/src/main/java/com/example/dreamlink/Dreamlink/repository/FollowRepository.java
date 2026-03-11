package com.example.dreamlink.Dreamlink.repository;

import com.example.dreamlink.Dreamlink.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FollowRepository extends JpaRepository<Follow, UUID> {

    // A kişisi B kişisini takip ediyor mu?
    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    // Takip kaydını bul
    Optional<Follow> findByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    // Benim takip ettiklerim kimler?
    List<Follow> findByFollowerId(UUID followerId);

    // Beni takip edenler kimler?
    List<Follow> findByFollowingId(UUID followingId);

    // Takipçi sayılarını hızlıca almak için yazdım
    long countByFollowerId(UUID userId); // Takip ettikleri
    long countByFollowingId(UUID userId); // Takipçileri
}