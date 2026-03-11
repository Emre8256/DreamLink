package com.example.dreamlink.Dreamlink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
@EnableAsync
public class DreamlinkApplication {

	public static void main(String[] args) {
		SpringApplication.run(DreamlinkApplication.class, args);
	}

	// Türkiye saati şimdilik
	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Europe/Istanbul"));
	}

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}

}
