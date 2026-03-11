package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.dto.DreamResponse;
import com.example.dreamlink.Dreamlink.dto.UserProfileResponse;
import com.example.dreamlink.Dreamlink.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile() {
        return ResponseEntity.ok(userService.getMyProfile());
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestBody @jakarta.validation.Valid com.example.dreamlink.Dreamlink.dto.UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }

    // Takip Et / Takipten Çık
    @PostMapping("/{userId}/follow")
    public ResponseEntity<String> followUser(@PathVariable UUID userId) {
        userService.toggleFollow(userId);
        return ResponseEntity.ok("İşlem başarılı");
    }
}