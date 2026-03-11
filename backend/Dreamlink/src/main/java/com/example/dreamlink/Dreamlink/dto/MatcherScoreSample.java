package com.example.dreamlink.Dreamlink.dto;

import java.util.UUID;

public record MatcherScoreSample(
        String timestamp,
        String outcome,
        Double score,
        UUID leftDreamId,
        UUID rightDreamId
        ) {

}
