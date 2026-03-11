package com.example.dreamlink.Dreamlink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
public class DreamlinkApplication {

	public static void main(String[] args) {
		SpringApplication.run(DreamlinkApplication.class, args);
	}

	// Türkiye saati şimdilik
	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Europe/Istanbul"));
	}

}
