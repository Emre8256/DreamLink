package com.example.dreamlink.Dreamlink.dto;

import java.util.List;
import java.util.UUID;

public record DreamInterpretContextRequest(
        UUID dreamId,
        List<DreamContextItemRecord> contextDreams
) {
}
