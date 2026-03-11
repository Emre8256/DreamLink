package com.example.dreamlink.Dreamlink.repository;

import com.example.dreamlink.Dreamlink.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    Page<Comment> findByDreamIdOrderByCreatedAtAsc(UUID dreamId, Pageable pageable);

    Page<Comment> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}