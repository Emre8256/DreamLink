package com.example.dreamlink.Dreamlink.repository;

import com.example.dreamlink.Dreamlink.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {

    Optional<Tag> findByName(String name);

    // BONUS: En çok kullanılan ilk 10 etiketi getirir (Trending Topics)
    @Query("SELECT t FROM Tag t " +
            "JOIN t.dreams d " +
            "GROUP BY t " +
            "ORDER BY COUNT(d) DESC")
    List<Tag> findMostPopularTags();
}