package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.UserProfileResponse;
import com.example.dreamlink.Dreamlink.entity.Follow;
import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.enums.NotificationType;
import com.example.dreamlink.Dreamlink.repository.FollowRepository;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final NotificationService notificationService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
    }

    public com.example.dreamlink.Dreamlink.dto.UserProfileResponse updateProfile(
            com.example.dreamlink.Dreamlink.dto.UpdateProfileRequest request) {
        User user = getCurrentUser();

        if (request.nickname() != null && !request.nickname().equals(user.getNickname())) {
            if (userRepository.existsByNickname(request.nickname())) {
                throw new RuntimeException("Bu kullanıcı adı zaten alınmış!");
            }
            user.setNickname(request.nickname());
        }

        if (request.bio() != null) {
            user.setBio(request.bio());
        }

        if (request.age() != null) {
            user.setAge(request.age());
        }

        if (request.location() != null) {
            user.setLocation(request.location());
        }

        userRepository.save(user);

        return mapToProfile(user, user);
    }

    public UserProfileResponse getMyProfile() {
        User user = getCurrentUser();
        return mapToProfile(user, user);
    }

    public UserProfileResponse getUserProfile(UUID userId) {
        User currentUser = getCurrentUser();
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        return mapToProfile(currentUser, targetUser);
    }

    @Transactional
    public void toggleFollow(UUID targetUserId) {
        User currentUser = getCurrentUser();

        if (currentUser.getId().equals(targetUserId)) {
            throw new RuntimeException("Kendini takip edemezsin!");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        var existingFollow = followRepository.findByFollowerIdAndFollowingId(currentUser.getId(), targetUser.getId());

        if (existingFollow.isPresent()) {
            followRepository.delete(existingFollow.get());
        } else {
            Follow follow = Follow.builder()
                    .follower(currentUser)
                    .following(targetUser)
                    .build();
            followRepository.save(follow);

            notificationService.send(
                    targetUser,
                    currentUser.getNickname() + " seni takip etmeye başladı.",
                    NotificationType.FOLLOW,
                    "/users/" + currentUser.getId());
        }
    }

    @Transactional
    public String uploadProfileImage(MultipartFile file) {
        User user = getCurrentUser();

        if (file.isEmpty()) {
            throw new RuntimeException("Dosya seçilmedi!");
        }

        try {
            String uploadDir = "uploads/avatars/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = user.getNickname() + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/images/avatars/" + fileName;
            user.setAvatarUrl(fileUrl);
            userRepository.save(user);

            return fileUrl;

        } catch (Exception e) {
            throw new RuntimeException("Dosya yüklenemedi: " + e.getMessage());
        }
    }

    private UserProfileResponse mapToProfile(User currentUser, User targetUser) {
        long followers = followRepository.countByFollowingId(targetUser.getId());
        long following = followRepository.countByFollowerId(targetUser.getId());
        boolean isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(),
                targetUser.getId());

        return new UserProfileResponse(
                targetUser.getId(),
                targetUser.getNickname(),
                targetUser.getBio(),
                targetUser.getAvatarUrl(),

                targetUser.getAge(),
                targetUser.getLocation(),

                targetUser.getDreams().size(),
                followers,
                following,
                isFollowing);
    }
}