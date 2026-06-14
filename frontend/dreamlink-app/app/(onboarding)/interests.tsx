import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { useOnboarding } from './OnboardingContext';
import { OnboardingSection } from './components/OnboardingSection';
import { Chip } from './components/ChoiceChip';
import { styles, C } from './styles';

const INTEREST_CATEGORIES = [
  {
    label: 'Art & Creativity',
    emoji: '🎨',
    items: [
      { label: 'Painting', emoji: '🖼️' },
      { label: 'Photography', emoji: '📷' },
      { label: 'Design', emoji: '✏️' },
      { label: 'Sculpting', emoji: '🗿' },
      { label: 'Ceramics', emoji: '🏺' },
      { label: 'Crafts', emoji: '🧵' },
      { label: 'Graffiti', emoji: '🎭' },
      { label: 'Animation', emoji: '🎬' },
    ],
  },
  {
    label: 'Music',
    emoji: '🎵',
    items: [
      { label: 'Guitar', emoji: '🎸' },
      { label: 'Piano', emoji: '🎹' },
      { label: 'DJing', emoji: '🎧' },
      { label: 'Live concerts', emoji: '🎤' },
      { label: 'Jazz', emoji: '🎷' },
      { label: 'Classical music', emoji: '🎻' },
      { label: 'Hip-hop', emoji: '🎙️' },
      { label: 'Indie music', emoji: '🎼' },
    ],
  },
  {
    label: 'Movies & Shows',
    emoji: '🎬',
    items: [
      { label: 'Indie movies', emoji: '🎞️' },
      { label: 'Documentaries', emoji: '📽️' },
      { label: 'Horror movies', emoji: '👻' },
      { label: 'Animation', emoji: '🌀' },
      { label: 'Binge watching', emoji: '📺' },
      { label: 'Film festivals', emoji: '🏆' },
      { label: 'Sci-Fi', emoji: '🚀' },
      { label: 'Film noir', emoji: '🕵️' },
    ],
  },
  {
    label: 'Nature & Outdoors',
    emoji: '🌿',
    items: [
      { label: 'Hiking', emoji: '🥾' },
      { label: 'Camping', emoji: '⛺' },
      { label: 'Climbing', emoji: '🧗' },
      { label: 'Cycling', emoji: '🚴' },
      { label: 'Surfing', emoji: '🏄' },
      { label: 'Diving', emoji: '🤿' },
      { label: 'Botanical gardens', emoji: '🌸' },
      { label: 'Stargazing', emoji: '🔭' },
    ],
  },
  {
    label: 'Sports & Fitness',
    emoji: '💪',
    items: [
      { label: 'Yoga', emoji: '🧘' },
      { label: 'Pilates', emoji: '🤸' },
      { label: 'Running', emoji: '🏃' },
      { label: 'Swimming', emoji: '🏊' },
      { label: 'Dancing', emoji: '💃' },
      { label: 'Soccer', emoji: '⚽' },
      { label: 'Tennis', emoji: '🎾' },
      { label: 'Martial arts', emoji: '🥋' },
    ],
  },
  {
    label: 'Food & Drink',
    emoji: '🍜',
    items: [
      { label: 'Cooking', emoji: '👨‍🍳' },
      { label: 'Coffee rituals', emoji: '☕' },
      { label: 'Wine tasting', emoji: '🍷' },
      { label: 'Street food', emoji: '🌮' },
      { label: 'Baking', emoji: '🍰' },
      { label: 'Fermentation', emoji: '🫙' },
      { label: 'Vegan kitchen', emoji: '🥗' },
      { label: 'Ramen', emoji: '🍜' },
    ],
  },
  {
    label: 'Mind & Soul',
    emoji: '🧠',
    items: [
      { label: 'Lucid dreaming', emoji: '🌙' },
      { label: 'Meditation', emoji: '🕊️' },
      { label: 'Psychology', emoji: '🪞' },
      { label: 'Philosophy', emoji: '📖' },
      { label: 'Astrology', emoji: '♾️' },
      { label: 'Tarot cards', emoji: '🃏' },
      { label: 'Minimalism', emoji: '🌑' },
      { label: 'Journaling', emoji: '📓' },
    ],
  },
  {
    label: 'Tech & Gaming',
    emoji: '🎮',
    items: [
      { label: 'Gaming', emoji: '🕹️' },
      { label: 'Artificial Intelligence', emoji: '🤖' },
      { label: 'Coding', emoji: '💻' },
      { label: 'VR / AR', emoji: '🥽' },
      { label: 'Retro gaming', emoji: '👾' },
      { label: 'Electronics', emoji: '🔌' },
      { label: 'Crypto', emoji: '💎' },
      { label: 'Game development', emoji: '🛠️' },
    ],
  },
  {
    label: 'Travel',
    emoji: '✈️',
    items: [
      { label: 'Traveling abroad', emoji: '🌍' },
      { label: 'Backpacking', emoji: '🎒' },
      { label: 'Road trips', emoji: '🚗' },
      { label: 'Cultural tours', emoji: '🏛️' },
      { label: 'Learning languages', emoji: '🗣️' },
      { label: 'Van life', emoji: '🚐' },
      { label: 'Island hopping', emoji: '🏝️' },
      { label: 'Mountain getaways', emoji: '🏔️' },
    ],
  },
  {
    label: 'Books & Writing',
    emoji: '📚',
    items: [
      { label: 'Novels', emoji: '📗' },
      { label: 'Poetry', emoji: '✍️' },
      { label: 'Sci-Fi books', emoji: '🛸' },
      { label: 'Philosophy books', emoji: '🧐' },
      { label: 'Mystery novels', emoji: '🔍' },
      { label: 'Blogging', emoji: '💬' },
      { label: 'Screenwriting', emoji: '🎭' },
      { label: 'Book clubs', emoji: '📖' },
    ],
  },
];

export default function InterestsScreen() {
  const { interests, setInterests, setCanContinue } = useOnboarding();
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    setCanContinue(interests.length > 0);
  }, [interests, setCanContinue]);

  const toggleInterest = (interest: string) => {
    setInterests((current) => {
      if (current.includes(interest)) {
        return current.filter((i) => i !== interest);
      }
      if (current.length >= 5) {
        return current;
      }
      return [...current, interest];
    });
  };

  return (
    <OnboardingSection
      title="What are you into? ✨"
      copy={`Choose up to 5 things that reflect who you are (${interests.length}/5).`}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabRow}
        keyboardShouldPersistTaps="always"
      >
        {INTEREST_CATEGORIES.map((cat, i) => (
          <Pressable
            key={i}
            style={[styles.categoryTab, activeCategory === i && styles.categoryTabActive]}
            onPress={() => setActiveCategory(i)}
          >
            <Text style={styles.categoryTabEmoji}>{cat.emoji}</Text>
            <Text style={[styles.categoryTabText, activeCategory === i && styles.categoryTabTextActive]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.chipGrid}>
        {INTEREST_CATEGORIES[activeCategory].items.map((item) => (
          <Chip
            key={item.label}
            label={item.label}
            emoji={item.emoji}
            selected={interests.includes(item.label)}
            disabled={!interests.includes(item.label) && interests.length >= 5}
            onPress={() => toggleInterest(item.label)}
          />
        ))}
      </View>

      {interests.length > 0 && (
        <View style={styles.selectedRow}>
          <Text style={styles.selectedLabel}>Your picks: </Text>
          <Text style={styles.selectedValues}>{interests.join(' · ')}</Text>
        </View>
      )}
    </OnboardingSection>
  );
}
