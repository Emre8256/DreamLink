import React, { useCallback, useEffect } from 'react';
import { Pressable, GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptic, HapticType } from './useHaptics';

const SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 1 };
const TIMING_CONFIG = { duration: 100 };

export interface AnimatedPressableProps {
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  hapticType?: HapticType;
  activeOpacity?: number;
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
  accessibilityLabel?: string;
  accessibilityRole?: string;
  testID?: string;
}

export const AnimatedPressable = ({
  onPress,
  onLongPress,
  onPressIn: propOnPressIn,
  onPressOut: propOnPressOut,
  disabled = false,
  style,
  children,
  hapticType,
  hitSlop,
  accessibilityLabel,
  accessibilityRole,
  testID,
}: AnimatedPressableProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(disabled ? 0.5 : 1);

  useEffect(() => {
    opacity.value = withTiming(disabled ? 0.5 : 1, { duration: 150 });
  }, [disabled, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (!disabled) {
        scale.value = withTiming(0.95, TIMING_CONFIG);
      }
      propOnPressIn?.(e);
    },
    [disabled, scale, propOnPressIn],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      if (!disabled) {
        scale.value = withSpring(1, SPRING_CONFIG);
      }
      propOnPressOut?.(e);
    },
    [disabled, scale, propOnPressOut],
  );

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (hapticType) triggerHaptic(hapticType);
      onPress?.(e);
    },
    [hapticType, onPress],
  );

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={onLongPress}
        disabled={disabled}
        hitSlop={hitSlop}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole as any}
        testID={testID}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export default AnimatedPressable;
