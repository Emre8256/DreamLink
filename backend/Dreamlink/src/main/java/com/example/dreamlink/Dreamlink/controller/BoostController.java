package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.dto.BoostStatusResponse;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import com.example.dreamlink.Dreamlink.service.BoostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/boosts")
@RequiredArgsConstructor
public class BoostController {

    private final BoostService boostService;
    private final UserRepository userRepository;

    @GetMapping("/status")
    public ResponseEntity<BoostStatusResponse> getStatus() {
        return ResponseEntity.ok(boostService.getStatus(getCurrentUserId()));
    }

    @PostMapping("/activate")
    public ResponseEntity<BoostStatusResponse> activate() {
        return ResponseEntity.ok(boostService.activate(getCurrentUserId()));
    }

    private UUID getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .map(user -> user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanici bulunamadi"));
    }
}
