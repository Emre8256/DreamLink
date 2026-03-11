package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.dto.PremiumProductResponse;
import com.example.dreamlink.Dreamlink.dto.PremiumStatusResponse;
import com.example.dreamlink.Dreamlink.dto.PremiumWebhookRequest;
import com.example.dreamlink.Dreamlink.dto.PurchaseVerifyRequest;
import com.example.dreamlink.Dreamlink.dto.PurchaseVerifyResponse;
import com.example.dreamlink.Dreamlink.dto.RestorePurchaseRequest;
import com.example.dreamlink.Dreamlink.entity.Subscription;
import com.example.dreamlink.Dreamlink.entity.User;
import com.example.dreamlink.Dreamlink.enums.PlanTier;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStatus;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;
import com.example.dreamlink.Dreamlink.repository.SubscriptionRepository;
import com.example.dreamlink.Dreamlink.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PremiumBillingService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PremiumGateService premiumGateService;
    private final ObjectMapper objectMapper;

    @Value("${appstore.shared-secret:}")
    private String appStoreSharedSecret;

    @Value("${appstore.verify-url:https://buy.itunes.apple.com/verifyReceipt}")
    private String appStoreVerifyUrl;

    @Value("${appstore.sandbox-verify-url:https://sandbox.itunes.apple.com/verifyReceipt}")
    private String appStoreSandboxVerifyUrl;

    @Value("${appstore.bundle-id:}")
    private String appStoreBundleId;

    @Value("${google.play.service-account-json:}")
    private String googleServiceAccountJson;

    @Value("${google.play.service-account-path:}")
    private String googleServiceAccountPath;

    @Value("${google.play.package-name:}")
    private String googlePackageName;

    public List<PremiumProductResponse> getProducts() {
        return List.of(
                new PremiumProductResponse(
                        "dreamlink_plus_monthly",
                        PlanTier.PLUS,
                        SubscriptionStore.APP_STORE,
                        "Dreamlink Plus",
                        "4.99",
                        "P1M"
                ),
                new PremiumProductResponse(
                        "dreamlink_gold_monthly",
                        PlanTier.GOLD,
                        SubscriptionStore.APP_STORE,
                        "Dreamlink Gold",
                        "9.99",
                        "P1M"
                ),
                new PremiumProductResponse(
                        "dreamlink_platinum_monthly",
                        PlanTier.PLATINUM,
                        SubscriptionStore.APP_STORE,
                        "Dreamlink Platinum",
                        "14.99",
                        "P1M"
                ),
                new PremiumProductResponse(
                        "dreamlink_plus_monthly",
                        PlanTier.PLUS,
                        SubscriptionStore.PLAY_STORE,
                        "Dreamlink Plus",
                        "4.99",
                        "P1M"
                ),
                new PremiumProductResponse(
                        "dreamlink_gold_monthly",
                        PlanTier.GOLD,
                        SubscriptionStore.PLAY_STORE,
                        "Dreamlink Gold",
                        "9.99",
                        "P1M"
                ),
                new PremiumProductResponse(
                        "dreamlink_platinum_monthly",
                        PlanTier.PLATINUM,
                        SubscriptionStore.PLAY_STORE,
                        "Dreamlink Platinum",
                        "14.99",
                        "P1M"
                )
        );
    }

    public PurchaseVerifyResponse verifyPurchase(UUID userId, PurchaseVerifyRequest request) {
        ProductMatch product = resolveProduct(request.store(), request.productId());
        ensureTokenPresent(request.store(), request.purchaseToken(), request.receiptData());

        VerifiedSubscription verified = verifyWithStore(request, product.planTier);
        Subscription subscription = upsertSubscription(userId, verified);

        return new PurchaseVerifyResponse(
                true,
                subscription.getPlanTier(),
                subscription.getStatus(),
                subscription.getStore(),
                subscription.getExpiresAt(),
                subscription.getCurrentPeriodEnd()
        );
    }

    public PurchaseVerifyResponse restorePurchase(UUID userId, RestorePurchaseRequest request) {
        ProductMatch product = resolveProduct(request.store(), request.productId());
        ensureTokenPresent(request.store(), request.purchaseToken(), request.receiptData());

        VerifiedSubscription verified = verifyWithStore(request, product.planTier);
        Subscription subscription = upsertSubscription(userId, verified);

        return new PurchaseVerifyResponse(
                true,
                subscription.getPlanTier(),
                subscription.getStatus(),
                subscription.getStore(),
                subscription.getExpiresAt(),
                subscription.getCurrentPeriodEnd()
        );
    }

    public PremiumStatusResponse getStatus(UUID userId) {
        Optional<Subscription> subscription = subscriptionRepository.findByUserId(userId);
        PlanTier planTier = premiumGateService.getEffectivePlan(userId);
        Set<com.example.dreamlink.Dreamlink.enums.Entitlement> entitlements = premiumGateService.getEntitlements(userId);

        if (subscription.isPresent()) {
            Subscription sub = subscription.get();
            return new PremiumStatusResponse(
                    planTier,
                    sub.getStatus(),
                    sub.getStore(),
                    sub.getExpiresAt(),
                    sub.getCurrentPeriodEnd(),
                    entitlements
            );
        }

        return new PremiumStatusResponse(
                planTier,
                null,
                null,
                null,
                null,
                entitlements
        );
    }

    public void handleWebhook(PremiumWebhookRequest request) {
        if (request.storeSubscriptionId() == null || request.storeSubscriptionId().isBlank()) {
            return;
        }
        subscriptionRepository.findByStoreSubscriptionId(request.storeSubscriptionId())
                .ifPresent(subscription -> {
                    if (request.planTier() != null) {
                        subscription.setPlanTier(request.planTier());
                    }
                    if (request.status() != null) {
                        subscription.setStatus(request.status());
                    }
                    if (request.expiresAt() != null) {
                        subscription.setExpiresAt(request.expiresAt());
                    }
                    if (request.currentPeriodEnd() != null) {
                        subscription.setCurrentPeriodEnd(request.currentPeriodEnd());
                    }
                    if (request.productId() != null) {
                        subscription.setProductId(request.productId());
                    }
                    if (request.transactionId() != null) {
                        subscription.setStoreTransactionId(request.transactionId());
                    }
                    subscriptionRepository.save(subscription);
                });
    }

    private VerifiedSubscription verifyWithStore(PurchaseVerifyRequest request, PlanTier planTier) {
        return verifyWithStore(
                request.store(),
                planTier,
                request.productId(),
                request.purchaseToken(),
                request.receiptData(),
                request.storeSubscriptionId(),
                request.transactionId(),
                request.packageName()
        );
    }

    private VerifiedSubscription verifyWithStore(RestorePurchaseRequest request, PlanTier planTier) {
        return verifyWithStore(
                request.store(),
                planTier,
                request.productId(),
                request.purchaseToken(),
                request.receiptData(),
                request.storeSubscriptionId(),
                null,
                request.packageName()
        );
    }

    private VerifiedSubscription verifyWithStore(
            SubscriptionStore store,
            PlanTier planTier,
            String productId,
            String purchaseToken,
            String receiptData,
            String storeSubscriptionId,
            String transactionId,
            String packageName
    ) {
        if (store == SubscriptionStore.APP_STORE) {
            return verifyAppleReceipt(planTier, productId, receiptData, storeSubscriptionId, transactionId);
        }
        if (store == SubscriptionStore.PLAY_STORE) {
            return verifyGoogleSubscription(planTier, productId, purchaseToken, storeSubscriptionId, transactionId, packageName);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Desteklenmeyen store");
    }

    private VerifiedSubscription verifyAppleReceipt(
            PlanTier planTier,
            String productId,
            String receiptData,
            String storeSubscriptionId,
            String transactionId
    ) {
        if (appStoreSharedSecret == null || appStoreSharedSecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "App Store secret eksik");
        }

        JsonNode root = postJson(appStoreVerifyUrl, Map.of(
                "receipt-data", receiptData,
                "password", appStoreSharedSecret,
                "exclude-old-transactions", true
        ));

        int receiptStatus = root.path("status").asInt(-1);
        if (receiptStatus == 21007) {
            root = postJson(appStoreSandboxVerifyUrl, Map.of(
                    "receipt-data", receiptData,
                    "password", appStoreSharedSecret,
                    "exclude-old-transactions", true
            ));
            receiptStatus = root.path("status").asInt(-1);
        }

        if (receiptStatus != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "App Store receipt dogrulanamadi");
        }

        String bundleId = root.path("receipt").path("bundle_id").asText(null);
        if (appStoreBundleId != null && !appStoreBundleId.isBlank() && bundleId != null
                && !appStoreBundleId.equals(bundleId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "App Store bundle uyusmazligi");
        }

        JsonNode receipts = root.path("latest_receipt_info");
        if (!receipts.isArray() || receipts.isEmpty()) {
            receipts = root.path("receipt").path("in_app");
        }
        if (!receipts.isArray() || receipts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "App Store receipt bos");
        }

        long latestExpiryMs = -1;
        String latestTransactionId = transactionId;
        String originalTransactionId = storeSubscriptionId;

        for (JsonNode item : receipts) {
            if (!productId.equals(item.path("product_id").asText())) {
                continue;
            }
            long expiresMs = item.path("expires_date_ms").asLong(-1);
            if (expiresMs > latestExpiryMs) {
                latestExpiryMs = expiresMs;
                latestTransactionId = item.path("transaction_id").asText(latestTransactionId);
                originalTransactionId = item.path("original_transaction_id").asText(originalTransactionId);
            }
        }

        if (latestExpiryMs <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "App Store abonelik bulunamadi");
        }

        LocalDateTime expiresAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(latestExpiryMs), ZoneOffset.UTC);
        SubscriptionStatus status = expiresAt.isAfter(LocalDateTime.now())
                ? SubscriptionStatus.ACTIVE
                : SubscriptionStatus.EXPIRED;

        return new VerifiedSubscription(
                planTier,
                SubscriptionStore.APP_STORE,
                productId,
                normalizeStoreId(originalTransactionId),
                normalizeStoreId(latestTransactionId),
                status,
                expiresAt,
                expiresAt
        );
    }

    private VerifiedSubscription verifyGoogleSubscription(
            PlanTier planTier,
            String productId,
            String purchaseToken,
            String storeSubscriptionId,
            String transactionId,
            String packageName
    ) {
        String resolvedPackage = resolvePackageName(packageName);
        if (resolvedPackage == null || resolvedPackage.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Package name gerekli");
        }

        String accessToken = getGoogleAccessToken();
        String url = String.format(
                "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/%s/purchases/subscriptions/%s/tokens/%s",
                resolvedPackage,
                productId,
                purchaseToken
        );

        JsonNode root = getJson(url, accessToken);
        long expiryMs = root.path("expiryTimeMillis").asLong(-1);
        if (expiryMs <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google Play abonelik bulunamadi");
        }

        LocalDateTime expiresAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(expiryMs), ZoneOffset.UTC);
        Integer cancelReason = root.has("cancelReason") ? root.path("cancelReason").asInt() : null;
        SubscriptionStatus status = expiresAt.isAfter(LocalDateTime.now())
                ? (cancelReason != null ? SubscriptionStatus.CANCELED : SubscriptionStatus.ACTIVE)
                : SubscriptionStatus.EXPIRED;

        String orderId = root.path("orderId").asText(transactionId);
        String linkedToken = root.path("linkedPurchaseToken").asText(storeSubscriptionId);

        return new VerifiedSubscription(
                planTier,
                SubscriptionStore.PLAY_STORE,
                productId,
                normalizeStoreId(linkedToken != null && !linkedToken.isBlank() ? linkedToken : purchaseToken),
                normalizeStoreId(orderId),
                status,
                expiresAt,
                expiresAt
        );
    }

    private Subscription upsertSubscription(UUID userId, VerifiedSubscription verified) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanici bulunamadi"));
        Subscription subscription = resolveSubscription(userId, verified.storeSubscriptionId);

        if (subscription.getUser() != null && !subscription.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Abonelik baska bir kullaniciya ait");
        }

        subscription.setUser(user);
        subscription.setPlanTier(verified.planTier);
        subscription.setStatus(verified.status);
        subscription.setStore(verified.store);
        subscription.setProductId(verified.productId);
        subscription.setStoreSubscriptionId(verified.storeSubscriptionId);
        subscription.setStoreTransactionId(verified.transactionId);
        subscription.setExpiresAt(verified.expiresAt);
        subscription.setCurrentPeriodEnd(verified.currentPeriodEnd);

        return subscriptionRepository.save(subscription);
    }

    private Subscription resolveSubscription(UUID userId, String storeSubscriptionId) {
        if (storeSubscriptionId != null && !storeSubscriptionId.isBlank()) {
            Optional<Subscription> byStore = subscriptionRepository.findByStoreSubscriptionId(storeSubscriptionId);
            if (byStore.isPresent()) {
                return byStore.get();
            }
        }
        return subscriptionRepository.findByUserId(userId)
                .orElseGet(() -> Subscription.builder().build());
    }

    private ProductMatch resolveProduct(SubscriptionStore store, String productId) {
        if (store == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Store gerekli");
        }
        if (productId == null || productId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Urun kimligi gerekli");
        }
        return getProducts().stream()
                .filter(p -> p.store() == store && p.productId().equals(productId))
                .findFirst()
                .map(p -> new ProductMatch(p.planTier()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Urun bulunamadi"));
    }

    private void ensureTokenPresent(SubscriptionStore store, String purchaseToken, String receiptData) {
        if (store == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Store gerekli");
        }
        if (store == SubscriptionStore.PLAY_STORE && (purchaseToken == null || purchaseToken.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Purchase token gerekli");
        }
        if (store == SubscriptionStore.APP_STORE && (receiptData == null || receiptData.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receipt gerekli");
        }
    }

    private JsonNode postJson(String url, Map<String, Object> payload) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            String body = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Store dogrulama hatasi");
            }
            return objectMapper.readTree(response.body());
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Store dogrulama hatasi");
        }
    }

    private JsonNode getJson(String url, String accessToken) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + accessToken)
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Store dogrulama hatasi");
            }
            return objectMapper.readTree(response.body());
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Store dogrulama hatasi");
        }
    }

    private String getGoogleAccessToken() {
        try {
            String serviceAccountJson = loadServiceAccountJson();
            JsonNode json = objectMapper.readTree(serviceAccountJson);
            String clientEmail = json.path("client_email").asText(null);
            String privateKeyPem = json.path("private_key").asText(null);
            if (clientEmail == null || privateKeyPem == null) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google service account eksik");
            }

            long now = Instant.now().getEpochSecond();
            long exp = now + 3600;
            String header = base64Url(objectMapper.writeValueAsString(Map.of("alg", "RS256", "typ", "JWT")));
            String payload = base64Url(objectMapper.writeValueAsString(Map.of(
                    "iss", clientEmail,
                    "scope", "https://www.googleapis.com/auth/androidpublisher",
                    "aud", "https://oauth2.googleapis.com/token",
                    "iat", now,
                    "exp", exp
            )));
            String unsignedToken = header + "." + payload;
            String signature = signJwt(unsignedToken, privateKeyPem);
            String assertion = unsignedToken + "." + signature;

            HttpClient client = HttpClient.newHttpClient();
            String body = "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion="
                    + URLEncoder.encode(assertion, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google token alinamadi");
            }
            JsonNode tokenJson = objectMapper.readTree(response.body());
            String accessToken = tokenJson.path("access_token").asText(null);
            if (accessToken == null || accessToken.isBlank()) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google token alinamadi");
            }
            return accessToken;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google token alinamadi");
        }
    }

    private String loadServiceAccountJson() {
        try {
            if (googleServiceAccountJson != null && !googleServiceAccountJson.isBlank()) {
                return googleServiceAccountJson;
            }
            if (googleServiceAccountPath != null && !googleServiceAccountPath.isBlank()) {
                return java.nio.file.Files.readString(java.nio.file.Path.of(googleServiceAccountPath));
            }
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google service account okunamadi");
        }
        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google service account eksik");
    }

    private String resolvePackageName(String packageName) {
        if (packageName != null && !packageName.isBlank()) {
            return packageName;
        }
        return googlePackageName;
    }

    private String signJwt(String data, String privateKeyPem) throws Exception {
        String cleaned = privateKeyPem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(cleaned);
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decoded);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PrivateKey privateKey = keyFactory.generatePrivate(keySpec);
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(data.getBytes(StandardCharsets.UTF_8));
        return base64Url(signature.sign());
    }

    private String base64Url(String input) {
        return base64Url(input.getBytes(StandardCharsets.UTF_8));
    }

    private String base64Url(byte[] input) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(input);
    }

    private String normalizeStoreId(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private record ProductMatch(PlanTier planTier) {

    }

    private record VerifiedSubscription(
            PlanTier planTier,
            SubscriptionStore store,
            String productId,
            String storeSubscriptionId,
            String transactionId,
            SubscriptionStatus status,
            LocalDateTime expiresAt,
            LocalDateTime currentPeriodEnd
            ) {

    }
}
