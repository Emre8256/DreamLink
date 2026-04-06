package com.example.dreamlink.Dreamlink.controller;

import com.example.dreamlink.Dreamlink.dto.PremiumProductResponse;
import com.example.dreamlink.Dreamlink.dto.PremiumStatusResponse;
import com.example.dreamlink.Dreamlink.dto.PurchaseVerifyRequest;
import com.example.dreamlink.Dreamlink.dto.RestorePurchaseRequest;
import com.example.dreamlink.Dreamlink.dto.VerifyPurchaseResponseRecord;
import com.example.dreamlink.Dreamlink.dto.WebhookProcessResultRecord;
import com.example.dreamlink.Dreamlink.service.PremiumBillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.validation.annotation.Validated;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/premium")
@RequiredArgsConstructor
@Validated
public class PremiumController {

    private final PremiumBillingService premiumBillingService;
    private final UserRepository userRepository;

    @GetMapping("/products")
    public ResponseEntity<List<PremiumProductResponse>> getProducts() {
        return ResponseEntity.ok(premiumBillingService.getProducts());
    }

    @PostMapping("/purchase/verify")
    public ResponseEntity<VerifyPurchaseResponseRecord> verifyPurchase(@Valid @RequestBody PurchaseVerifyRequest request) {
        return ResponseEntity.ok(VerifyPurchaseResponseRecord.from(
                premiumBillingService.verifyPurchase(getCurrentUserId(), request)));
    }

    @PostMapping("/restore")
    public ResponseEntity<VerifyPurchaseResponseRecord> restorePurchase(@Valid @RequestBody RestorePurchaseRequest request) {
        return ResponseEntity.ok(VerifyPurchaseResponseRecord.from(
                premiumBillingService.restorePurchase(getCurrentUserId(), request)));
    }

    @GetMapping("/status")
    public ResponseEntity<PremiumStatusResponse> getStatus() {
        return ResponseEntity.ok(premiumBillingService.getStatus(getCurrentUserId()));
    }

    @PostMapping("/webhook/apple")
    public ResponseEntity<WebhookProcessResultRecord> appleWebhook(
            @RequestBody String rawBody) {
        WebhookProcessResultRecord result = premiumBillingService.handleAppleWebhook(rawBody);
        return ResponseEntity.accepted().body(result);
    }

    @PostMapping("/webhook/google")
    public ResponseEntity<WebhookProcessResultRecord> googleWebhook(
            @RequestBody String rawBody) {
        WebhookProcessResultRecord result = premiumBillingService.handleGoogleRtdnWebhook(rawBody);
        return ResponseEntity.accepted().body(result);
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

    private record PremiumErrorResponse(int status, String error) {

    }
}
