package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.CommentResponse;
import com.example.dreamlink.Dreamlink.entity.Comment;
import com.example.dreamlink.Dreamlink.entity.Dream;
import com.example.dreamlink.Dreamlink.entity.DreamLike;
import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.enums.NotificationType;
import com.example.dreamlink.Dreamlink.repository.CommentRepository;
import com.example.dreamlink.Dreamlink.repository.DreamLikeRepository;
import com.example.dreamlink.Dreamlink.repository.DreamRepository;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InteractionService {

    private final DreamLikeRepository likeRepository;
    private final DreamRepository dreamRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    /**
     * Toggles a "content like" on a dream (heart button on the dream detail page).
     * This is separate from the "profile like" in LikeService which drives
     * matching.
     */
    @Transactional
    public void toggleLike(UUID dreamId) {
        User user = getCurrentUser();
        Dream dream = dreamRepository.findById(dreamId).orElseThrow();

        Optional<DreamLike> existingLike = likeRepository.findByFromUserAndDreamAndSource(user, dream,
                DreamLike.LikeSource.FEED);

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            dream.setLikeCount(dream.getLikeCount() - 1);
        } else {
            DreamLike newLike = DreamLike.builder()
                    .fromUser(user)
                    .toUser(dream.getUser())
                    .dream(dream)
                    .source(DreamLike.LikeSource.FEED)
                    .build();
            likeRepository.save(newLike);

            dream.setLikeCount(dream.getLikeCount() + 1);

            if (!dream.getUser().getId().equals(user.getId())) {
                notificationService.send(
                        dream.getUser(),
                        user.getNickname() + " rüyanı beğendi.",
                        NotificationType.LIKE,
                        "/dreams/" + dream.getId());
            }
        }
        dreamRepository.save(dream);
    }

    @Transactional
    public void addComment(UUID dreamId, String content) {
        User user = getCurrentUser();
        Dream dream = dreamRepository.findById(dreamId).orElseThrow();

        Comment comment = Comment.builder()
                .user(user)
                .dream(dream)
                .content(content)
                .build();

        commentRepository.save(comment);

        dream.setCommentCount(dream.getCommentCount() + 1);
        dreamRepository.save(dream);

        if (!dream.getUser().getId().equals(user.getId())) {
            notificationService.send(
                    dream.getUser(),
                    user.getNickname() + " rüyana yorum yaptı.",
                    NotificationType.COMMENT,
                    "/dreams/" + dream.getId());
        }
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(UUID dreamId) {
        Dream dream = dreamRepository.findById(dreamId).orElseThrow();
        return dream.getComments().stream()
                .sorted(Comparator.comparing(Comment::getCreatedAt).reversed())
                .map(comment -> new CommentResponse(
                        comment.getId(),
                        comment.getContent(),
                        comment.getUser().getNickname(),
                        comment.getUser().getAvatarUrl(),
                        comment.getCreatedAt()))
                .collect(Collectors.toList());
    }
}