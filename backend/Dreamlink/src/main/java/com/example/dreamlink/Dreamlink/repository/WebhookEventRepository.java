package com.example.dreamlink.Dreamlink.repository;

import com.example.dreamlink.Dreamlink.entity.WebhookEvent;
import com.example.dreamlink.Dreamlink.enums.SubscriptionStore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, UUID> {

    Optional<WebhookEvent> findByStoreAndEventId(SubscriptionStore store, String eventId);
}
