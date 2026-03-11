package com.example.dreamlink.Dreamlink.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRequest(

                @NotBlank(message = "Email boş olamaz") @Email(message = "Geçerli bir email giriniz") String email,

                @NotBlank(message = "Şifre boş olamaz") @Size(min = 6, message = "Şifre en az 6 karakter olmalı") String password,

                String nickname,

                @Size(max = 500, message = "Bio en fazla 500 karakter olabilir") String bio,

                @Min(value = 13, message = "Yaşınız 13'ten küçük olamaz") Integer age,

                String location) {
}
