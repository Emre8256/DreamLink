import React, { useCallback, useEffect, useRef } from 'react';
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

// Defined outside the component so it's never re-created on every render
const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

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

  // Timer ref: guarantees scale always springs back after 250 ms
  // in case onPressOut / onPress is never fired (JS thread busy)
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSafetyTimer = () => {
    if (safetyTimerRef.current !== null) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  const springBack = useCallback(() => {
    clearSafetyTimer();
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  useEffect(() => {
    opacity.value = withTiming(disabled ? 0.5 : 1, { duration: 150 });
    if (disabled) {
      // Always reset scale when the button becomes disabled mid-press
      springBack();
    }
  }, [disabled, opacity, springBack]);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (!disabled) {
        scale.value = withTiming(0.95, TIMING_CONFIG);

        // Safety net: if onPressOut never fires within 250 ms, snap back
        clearSafetyTimer();
        safetyTimerRef.current = setTimeout(springBack, 250);
      }
      propOnPressIn?.(e);
    },
    [disabled, scale, propOnPressIn, springBack],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      springBack();
      propOnPressOut?.(e);
    },
    [springBack, propOnPressOut],
  );

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      springBack();
      if (hapticType) triggerHaptic(hapticType);
      onPress?.(e);
    },
    [hapticType, onPress, springBack],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressableComponent
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole as any}
      testID={testID}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressableComponent>
  );
};

export default AnimatedPressable;
