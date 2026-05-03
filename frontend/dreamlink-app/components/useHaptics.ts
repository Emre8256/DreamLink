import * as Haptics from 'expo-haptics';

export type HapticType = 'light' | 'medium' | 'heavy';

export const lightHaptic = (): void => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const mediumHaptic = (): void => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
};

export const heavyHaptic = (): void => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
};

export const triggerHaptic = (type: HapticType): void => {
  switch (type) {
    case 'light':
      return lightHaptic();
    case 'medium':
      return mediumHaptic();
    case 'heavy':
      return heavyHaptic();
  }
};
