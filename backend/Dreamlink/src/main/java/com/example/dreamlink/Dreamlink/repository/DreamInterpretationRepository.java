package com.example.dreamlink.Dreamlink.repository;

import com.example.dreamlink.Dreamlink.entity.DreamInterpretation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DreamInterpretationRepository extends JpaRepository<DreamInterpretation, UUID> {
    Optional<DreamInterpretation> findByDreamIdAndPersona(UUID dreamId, String persona);
}
