package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.dto.PremiumProductResponse;
import com.example.dreamlink.Dreamlink.dto.PremiumStatusResponse;
import com.example.dreamlink.Dreamlink.dto.PremiumWebhookRequest;
import com.example.dreamlink.Dreamlink.dto.PurchaseVerifyRequest;
import com.example.dreamlink.Dreamlink.dto.PurchaseVerifyResponse;
import com.example.dreamlink.Dreamlink.dto.RestorePurchaseRequest;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;
import com.example.dreamlink.Dreamlink.service.PremiumBillingService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/premium")
@RequiredArgsConstructor
public class PremiumController {

    private final PremiumBillingService premiumBillingService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${premium.webhook.apple-secret:}")
    private String appleWebhookSecret;

    @Value("${premium.webhook.google-secret:}")
    private String googleWebhookSecret;

    @GetMapping("/products")
    public ResponseEntity<List<PremiumProductResponse>> getProducts() {
        return ResponseEntity.ok(premiumBillingService.getProducts());
    }

    @PostMapping("/purchase/verify")
    public ResponseEntity<PurchaseVerifyResponse> verifyPurchase(@RequestBody PurchaseVerifyRequest request) {
        return ResponseEntity.ok(premiumBillingService.verifyPurchase(getCurrentUserId(), request));
    }

    @PostMapping("/restore")
    public ResponseEntity<PurchaseVerifyResponse> restorePurchase(@RequestBody RestorePurchaseRequest request) {
        return ResponseEntity.ok(premiumBillingService.restorePurchase(getCurrentUserId(), request));
    }

    @GetMapping("/status")
    public ResponseEntity<PremiumStatusResponse> getStatus() {
        return ResponseEntity.ok(premiumBillingService.getStatus(getCurrentUserId()));
    }

    @PostMapping("/webhook/apple")
    public ResponseEntity<Void> appleWebhook(
            @RequestHeader(value = "X-Premium-Webhook-Secret", required = false) String secret,
            @RequestHeader(value = "X-Premium-Webhook-Signature", required = false) String signature,
            @RequestBody String rawBody) {
        PremiumWebhookRequest request = parseAndValidateWebhook(
                rawBody,
                secret,
                signature,
                SubscriptionStore.APP_STORE,
                appleWebhookSecret
        );
        premiumBillingService.handleWebhook(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/webhook/google")
    public ResponseEntity<Void> googleWebhook(
            @RequestHeader(value = "X-Premium-Webhook-Secret", required = false) String secret,
            @RequestHeader(value = "X-Premium-Webhook-Signature", required = false) String signature,
            @RequestBody String rawBody) {
        PremiumWebhookRequest request = parseAndValidateWebhook(
                rawBody,
                secret,
                signature,
                SubscriptionStore.PLAY_STORE,
                googleWebhookSecret
        );
        premiumBillingService.handleWebhook(request);
        return ResponseEntity.accepted().build();
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<PremiumErrorResponse> handlePremiumError(ResponseStatusException ex) {
        int status = ex.getStatusCode().value();
        return ResponseEntity.status(status)
                .body(new PremiumErrorResponse(status, ex.getReason()));
    }

    private UUID getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .map(user -> user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanici bulunamadi"));
    }

    private PremiumWebhookRequest parseAndValidateWebhook(
            String rawBody,
            String secret,
            String signature,
            SubscriptionStore expectedStore,
            String configuredSecret
    ) {
        if (configuredSecret == null || configuredSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Webhook secret eksik");
        }
        if (secret == null || secret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Webhook secret eksik");
        }
        if (!configuredSecret.equals(secret)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Webhook secret gecersiz");
        }
        if (signature == null || signature.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Webhook signature eksik");
        }

        String expectedSignature = computeHmacSha256Hex(configuredSecret, rawBody);
        if (!secureEquals(expectedSignature, signature)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Webhook signature gecersiz");
        }

        PremiumWebhookRequest request = parseWebhook(rawBody);
        if (request.store() != expectedStore) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Webhook store gecersiz");
        }
        return request;
    }

    private PremiumWebhookRequest parseWebhook(String rawBody) {
        try {
            return objectMapper.readValue(rawBody, PremiumWebhookRequest.class);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Webhook payload gecersiz");
        }
    }

    private String computeHmacSha256Hex(String secret, String rawBody) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Webhook signature hatasi");
        }
    }

    private boolean secureEquals(String expectedHex, String providedHex) {
        String normalized = providedHex.trim().toLowerCase();
        byte[] expectedBytes = expectedHex.getBytes(StandardCharsets.UTF_8);
        byte[] providedBytes = normalized.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expectedBytes, providedBytes);
    }

    private String toHex(byte[] data) {
        StringBuilder sb = new StringBuilder(data.length * 2);
        for (byte b : data) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private record PremiumErrorResponse(int status, String error) {

    }
}
