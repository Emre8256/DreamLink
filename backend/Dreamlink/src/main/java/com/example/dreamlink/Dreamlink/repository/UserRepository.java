package com.example.dreamlink.Dreamlink.repository;

import com.example.dreamlink.Dreamlink.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    // Login
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    // URL'den profile giderken
    Optional<User> findByNickname(String nickname);
}