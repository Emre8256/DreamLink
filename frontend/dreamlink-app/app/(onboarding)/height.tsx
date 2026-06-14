import React, { useEffect } from 'react';
import { View } from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';

import { useOnboarding } from './OnboardingContext';
import { OnboardingSection } from './components/OnboardingSection';
import { styles } from './styles';

const HEIGHTS = Array.from({ length: 91 }, (_, index) => {
  const value = 140 + index;
  let label = `${value} cm`;
  if (value === 140) {
    label = 'Under 140 cm';
  } else if (value === 230) {
    label = '230+ cm';
  }
  return { value, label };
});

export default function HeightScreen() {
  const { height, setHeight, setCanContinue } = useOnboarding();

  useEffect(() => {
    setCanContinue(true);
  }, [setCanContinue]);

  return (
    <OnboardingSection
      title="How tall are you? 📏"
      copy="Input your height for a perfect match within the collective."
    >
      <View style={styles.heightPickerWrapper}>
        <WheelPicker
          data={HEIGHTS}
          value={height}
          onValueChanged={({ item: { value } }) => setHeight(value)}
          visibleItemCount={7}
          itemHeight={64}
          enableScrollByTapOnItem
          style={styles.wheelPicker}
          itemTextStyle={styles.wheelItemText}
          overlayItemStyle={styles.wheelOverlayItem}
          renderOverlay={() => (
            <View pointerEvents="none" style={styles.wheelSelectorContainer}>
              <View style={styles.wheelSelector} />
            </View>
          )}
        />
      </View>
    </OnboardingSection>
  );
}
