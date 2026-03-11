package com.example.dreamlink.Dreamlink.service;

import com.example.dreamlink.Dreamlink.entity.Dream;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TemporaryMatcherAdapter implements MatcherAdapter {

    // Temporary in-process matcher until external matcher is ready.
    private static final Set<String> STOP_WORDS = Set.of(
            "ve", "ile", "bir", "bu", "da", "de", "ki", "mi", "mu",
            "ne", "o", "ya", "yok", "var", "ben", "sen", "biz", "siz",
            "icin", "ama", "fakat", "cok", "az", "daha", "en", "her",
            "hic", "bile", "gibi", "kadar", "sonra", "once", "uzere",
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
            "of", "is", "it", "was", "are", "be", "been", "has", "have",
            "had", "do", "did", "not", "with", "as", "by", "from", "that"
    );

    @Override
    public double score(Dream left, Dream right) {
        TokenSet ts1 = tokenize(left.getTitle(), left.getDescription());
        TokenSet ts2 = tokenize(right.getTitle(), right.getDescription());

        int totalWordsA = ts1.titleWords().size() + ts1.descWords().size();
        int totalWordsB = ts2.titleWords().size() + ts2.descWords().size();

        if (totalWordsA == 0 || totalWordsB == 0) {
            return 0.0;
        }

        double rawScore = 0.0;

        Set<String> titleIntersect = new HashSet<>(ts1.titleWords());
        titleIntersect.retainAll(ts2.titleWords());
        rawScore += titleIntersect.size() * 25.0;

        Set<String> descIntersect = new HashSet<>(ts1.descWords());
        descIntersect.retainAll(ts2.descWords());
        rawScore += descIntersect.size() * 10.0;

        Set<String> bothInBoth = new HashSet<>(titleIntersect);
        bothInBoth.retainAll(descIntersect);

        Set<String> crossAB = new HashSet<>(ts1.titleWords());
        crossAB.retainAll(ts2.descWords());
        Set<String> crossBA = new HashSet<>(ts1.descWords());
        crossBA.retainAll(ts2.titleWords());
        bothInBoth.addAll(crossAB);
        bothInBoth.addAll(crossBA);
        rawScore += bothInBoth.size() * 35.0;

        double normalized = rawScore / Math.sqrt((double) totalWordsA * totalWordsB);
        return Math.min(1.0, normalized);
    }

    private TokenSet tokenize(String title, String description) {
        return new TokenSet(
                tokenizeText(title),
                tokenizeText(description));
    }

    private Set<String> tokenizeText(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptySet();
        }
        String cleaned = text.toLowerCase()
                .replaceAll("[^\\p{L}\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return Arrays.stream(cleaned.split(" "))
                .filter(w -> w.length() > 2)
                .filter(w -> !STOP_WORDS.contains(w))
                .collect(Collectors.toSet());
    }

    private record TokenSet(Set<String> titleWords, Set<String> descWords) {

    }
}
