import React, { useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useOnboarding } from './OnboardingContext';
import { OnboardingSection } from './components/OnboardingSection';
import { PhotoGrid } from './components/PhotoGrid';

export default function PhotosScreen() {
  const { photos, setPhotos, setCanContinue } = useOnboarding();

  const photoCount = useMemo(() => {
    return photos.filter(Boolean).length;
  }, [photos]);

  useEffect(() => {
    setCanContinue(photoCount >= 2);
  }, [photoCount, setCanContinue]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Needed',
        'We need access to your photo library to help you upload profile pictures. 📸'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });
    if (!result.canceled) {
      setPhotos((current) => {
        const next = [...current];
        const firstEmpty = next.findIndex((p) => !p);
        if (firstEmpty !== -1) {
          next[firstEmpty] = result.assets[0].uri;
        }
        return next;
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      const next = current.map((p, i) => (i === index ? null : p)) as (string | null)[];
      // Shift photos to the left to fill blanks
      const filled = next.filter(Boolean) as string[];
      const blanks = Array(next.length - filled.length).fill(null);
      return [...filled, ...blanks];
    });
  };

  return (
    <OnboardingSection
      title="Build your profile gallery 📸"
      copy={`Please add at least 2 photos (${photoCount}/4). Clear, warm photos of you make it much easier for compatible matches to say hello!`}
    >
      <PhotoGrid photos={photos} pickPhoto={pickPhoto} removePhoto={removePhoto} />
    </OnboardingSection>
  );
}
