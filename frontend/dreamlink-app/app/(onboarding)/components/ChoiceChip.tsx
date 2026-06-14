import React, { useRef } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { AnimatedPressable } from '../../../components/AnimatedPressable';
import { styles, C } from '../styles';

interface ChoiceProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Choice({ label, selected, onPress }: ChoiceProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    if (!selected) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[styles.choice, selected && styles.choiceSelected]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
        {selected ? <Check color={C.ink} size={21} /> : null}
      </Pressable>
    </Animated.View>
  );
}

interface ChipProps {
  label: string;
  emoji?: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function Chip({ label, emoji, selected, disabled, onPress }: ChipProps) {
  return (
    <AnimatedPressable
      disabled={disabled}
      style={[styles.chip, selected && styles.chipSelected, disabled && styles.chipDisabled]}
      onPress={onPress}
    >
      {emoji ? <Text style={styles.chipEmoji}>{emoji}</Text> : null}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </AnimatedPressable>
  );
}
