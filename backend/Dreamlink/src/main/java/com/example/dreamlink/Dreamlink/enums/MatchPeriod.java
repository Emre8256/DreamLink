package com.example.dreamlink.Dreamlink.enums;

public enum MatchPeriod {
    HOT, // Bugün paylaşılan rüyalar (created_at >= today)
    WEEK // Son 7 gün (created_at >= now - 7 days)
}
