package com.example.dreamlink.Dreamlink.enums;

public enum MatchStatus {
    PENDING,   // Sistem eşleşmeyi buldu ama kullanıcı henüz görmedi/işlem yapmadı
    ACCEPTED,  // Kullanıcı "Bu kişiyle konuş" dedi (Chat başlatılır)
    REJECTED,  // Kullanıcı "İlgilenmiyorum" dedi (Bir daha gösterilmez)
    EXPIRED    // Belki 24 saat geçti ve eşleşme zaman aşımına uğradı
}
