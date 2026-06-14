import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

interface OnboardingSectionProps {
  title: string;
  copy?: string;
  note?: string;
  children: React.ReactNode;
}

export function OnboardingSection({ title, copy, note, children }: OnboardingSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {copy ? <Text style={styles.copy}>{copy}</Text> : null}
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <View style={styles.stack}>{children}</View>
    </View>
  );
}
