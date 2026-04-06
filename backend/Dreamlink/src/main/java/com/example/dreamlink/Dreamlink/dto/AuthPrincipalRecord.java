package com.example.dreamlink.Dreamlink.dto;

public record AuthPrincipalRecord(
        String email,
        String tokenFingerprint
) {
    public static AuthPrincipalRecord of(String email, String token) {
        String fingerprint = token.length() > 8 ? token.substring(token.length() - 8) : token;
        return new AuthPrincipalRecord(email, fingerprint);
    }
}
