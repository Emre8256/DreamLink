package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.AuthRequest;
import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.enums.Role;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public String register(AuthRequest request) {

        try {
            if (userRepository.findByEmail(request.email()).isPresent()) {
                throw new RuntimeException("Bu email zaten kayıtlı!");
            }

            if (request.nickname() != null && userRepository.existsByNickname(request.nickname())) {
                throw new RuntimeException("Bu kullanıcı adı (nickname) alınmış!");
            }

            User user = User.builder()
                    .email(request.email())
                    .age(request.age())
                    .location(request.location())
                    .nickname(request.nickname())
                    .bio(request.bio())
                    .password(passwordEncoder.encode(request.password()))

                    .role(Role.USER) // Varsayılan rol
                    .build();

            userRepository.save(user);

            // Kullanıcıya hemen token ver
            return jwtService.generateToken(user);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    public String login(AuthRequest request) {
        // Kimlik Doğrulama
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()));

        // Kullanıcıyı Bul
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        // Token Üret ve Dön
        return jwtService.generateToken(user);
    }
}