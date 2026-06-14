import React from 'react';
import { View, Image } from 'react-native';
import { Camera, X } from 'lucide-react-native';
import { AnimatedPressable } from '../../../components/AnimatedPressable';
import { styles, C } from '../styles';

interface PhotoGridProps {
  photos: (string | null)[];
  pickPhoto: () => void;
  removePhoto: (index: number) => void;
}

export function PhotoGrid({ photos, pickPhoto, removePhoto }: PhotoGridProps) {
  return (
    <View style={styles.photoGrid}>
      {photos.map((photo, index) => (
        <View key={index} style={styles.photoSlot}>
          {photo ? (
            <>
              <Image source={{ uri: photo }} style={styles.photo} />
              <AnimatedPressable
                style={styles.removePhoto}
                onPress={() => removePhoto(index)}
              >
                <X color={C.white} size={16} />
              </AnimatedPressable>
            </>
          ) : (
            (() => {
              const firstEmpty = photos.findIndex((p) => !p);
              const isNextEmpty = firstEmpty === index;
              return (
                <AnimatedPressable
                  style={styles.addPhoto}
                  onPress={isNextEmpty ? pickPhoto : undefined}
                  disabled={!isNextEmpty}
                >
                  <View style={[styles.cameraIconBg, !isNextEmpty && { opacity: 0.3 }]}>
                    <Camera color={C.white} size={24} />
                  </View>
                </AnimatedPressable>
              );
            })()
          )}
        </View>
      ))}
    </View>
  );
}
