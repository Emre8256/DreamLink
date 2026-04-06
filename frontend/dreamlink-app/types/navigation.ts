import type { Href } from 'expo-router';

export type FeatureStatus = 'available' | 'coming_soon' | 'disabled';

export interface FeatureAvailabilityMap {
  editProfile: FeatureStatus;
  recentDreams: FeatureStatus;
  matches: FeatureStatus;
  messages: FeatureStatus;
  themes: FeatureStatus;
  notifications: FeatureStatus;
  privacy: FeatureStatus;
  appSettings: FeatureStatus;
  premium: FeatureStatus;
}

export const DEFAULT_FEATURES: FeatureAvailabilityMap = {
  editProfile: 'available',
  recentDreams: 'disabled',
  matches: 'disabled',
  messages: 'available',
  themes: 'disabled',
  notifications: 'available',
  privacy: 'disabled',
  appSettings: 'disabled',
  premium: 'coming_soon',
};

export type SettingItemConfig = {
  id: keyof FeatureAvailabilityMap;
  title: string;
  subtitle: string;
  icon: string;
  iconType?: 'ionicons' | 'material';
  route?: Href;
};
