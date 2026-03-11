package com.example.dreamlink.Dreamlink.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 3, max = 50, message = "Kullanıcı adı 3-50 karakter arasında olmalıdır") String nickname,

        @Size(max = 500, message = "Bio en fazla 500 karakter olabilir") String bio,

        @Min(value = 13, message = "Yaşınız 13'ten küçük olamaz") Integer age,

        @Size(max = 100, message = "Konum en fazla 100 karakter olabilir") String location) {
}
