import React from 'react';
import { View, Text } from 'react-native';
import { Chip } from './ChoiceChip';
import { styles } from '../styles';
import { LifestyleValue } from '../OnboardingContext';

interface LifestyleSelectorProps {
  title: string;
  icon?: React.ReactNode;
  value: LifestyleValue;
  onChange: (v: LifestyleValue) => void;
}

export function LifestyleSelector({ title, icon, value, onChange }: LifestyleSelectorProps) {
  const options: LifestyleValue[] = ['Never', 'Sometimes', 'Socially', 'Often'];
  const labelMap: Record<string, string> = {
    Never: 'Never',
    Sometimes: 'Sometimes',
    Socially: 'Socially',
    Often: 'Often',
  };

  return (
    <View style={styles.lifestyle}>
      <View style={styles.lifestyleTitleRow}>
        <Text style={styles.lifestyleTitle}>{title}</Text>
        {icon}
      </View>
      <View style={styles.chipGrid}>
        {options.map((option) => (
          <Chip
            key={option}
            label={labelMap[option] || option}
            selected={value === option}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </View>
  );
}
