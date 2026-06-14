import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Slot, useRouter, usePathname } from 'expo-router';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

import { AnimatedPressable } from '../../components/AnimatedPressable';
import { useAuth } from '../../context/AuthContext';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import { styles, C } from './styles';

const MOCK_AUTH_TOKEN =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJtb2NrLXVzZXIiLCJleHAiOjE5MjQ5OTIwMDB9.mock';

const ONBOARDING_STEPS = [
  'identity',
  'gender',
  'height',
  'interests',
  'lifestyle',
  'prompts',
  'photos',
  'notifications',
  'location',
];

function OnboardingLayoutContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { login } = useAuth();

  const {
    canContinue,
    mainScrollRef,
    onContinuePress,
    setGoNext,
  } = useOnboarding();

  // Find step index from pathname
  const currentStepName = pathname.split('/').pop() || '';
  const stepIndex = Math.max(0, ONBOARDING_STEPS.indexOf(currentStepName));

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetMainScroll = useCallback(() => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    requestAnimationFrame(() => {
      mainScrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    resetTimeoutRef.current = setTimeout(() => {
      mainScrollRef.current?.scrollTo({ y: 0, animated: false });
    }, 320);
  }, [mainScrollRef]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardVisible(true);
      setKbHeight(e.endCoordinates.height);
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration ?? 250 : 0,
        useNativeDriver: false,
      }).start();
      setTimeout(() => {
        mainScrollRef.current?.scrollToEnd({ animated: true });
      }, Platform.OS === 'ios' ? 50 : 100);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, (e) => {
      setKeyboardVisible(false);
      setKbHeight(0);
      resetMainScroll();
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration ?? 250 : 0,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, [resetMainScroll, keyboardHeight, mainScrollRef]);

  // Reset scroll on step change
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [stepIndex, mainScrollRef]);

  const goNext = useCallback(() => {
    if (stepIndex < 8) {
      Keyboard.dismiss();
      resetMainScroll();
      const nextScreen = ONBOARDING_STEPS[stepIndex + 1];
      requestAnimationFrame(() => {
        router.push(`/(onboarding)/${nextScreen}` as any);
      });
    }
  }, [stepIndex, resetMainScroll, router]);

  // Register goNext in context so screens can call it directly
  useEffect(() => {
    setGoNext(goNext);
  }, [goNext, setGoNext]);

  const goBack = () => {
    Keyboard.dismiss();
    resetMainScroll();
    if (stepIndex === 0) {
      router.replace('/welcome');
    } else {
      const prevScreen = ONBOARDING_STEPS[stepIndex - 1];
      requestAnimationFrame(() => {
        router.push(`/(onboarding)/${prevScreen}` as any);
      });
    }
  };

  const skip = () => {
    Keyboard.dismiss();
    resetMainScroll();
    if ([2, 3, 4].includes(stepIndex)) {
      requestAnimationFrame(() => {
        router.push(`/(onboarding)/${ONBOARDING_STEPS[stepIndex + 1]}` as any);
      });
    }
  };

  const requestLocation = async () => {
    Keyboard.dismiss();
    resetMainScroll();
    await login(MOCK_AUTH_TOKEN);
    router.replace('/(tabs)/today');
  };

  const naturalBottom = Math.max(insets.bottom + 16, 24);
  const bottomOffset = [7, 8].includes(stepIndex) ? 36 : 0;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#8C3048', '#4C1523', '#1F0C10', '#0E0B0D']} style={StyleSheet.absoluteFill} />
      </View>

      <View style={styles.keyboard}>
        <View
          style={[
            styles.shell,
            {
              paddingTop: Math.max(insets.top + 8, 48),
              paddingBottom: naturalBottom + 60 + 16 + (stepIndex === 7 ? 40 : 0) + bottomOffset,
            },
          ]}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <AnimatedPressable style={styles.iconButton} onPress={goBack}>
              <ChevronLeft color={C.white} size={32} strokeWidth={2.5} />
            </AnimatedPressable>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((stepIndex + 1) / 9) * 100}%` }]} />
            </View>
            {[2, 3, 4].includes(stepIndex) ? (
              <AnimatedPressable style={styles.skipButton} onPress={skip}>
                <Text style={styles.skipText}>Skip</Text>
              </AnimatedPressable>
            ) : (
              <View style={styles.skipPlaceholder} />
            )}
          </View>

          {/* Main Content Area */}
          <View style={styles.body}>
            <ScrollView
              ref={mainScrollRef}
              style={styles.mainScroll}
              contentContainerStyle={[
                styles.content,
                {
                  paddingBottom: keyboardVisible ? kbHeight + 60 + 24 : 24,
                },
              ]}
              scrollEnabled={true}
              bounces={false}
              alwaysBounceVertical={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
            >
              <Slot />
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Persistent bottom continue button */}
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            bottom: keyboardHeight.interpolate({
              inputRange: [0, 1000],
              outputRange: [naturalBottom + bottomOffset, naturalBottom + bottomOffset + 1000],
              extrapolate: 'clamp',
            }),
            paddingHorizontal: 28,
          },
        ]}
      >
        {stepIndex === 8 && (
          <View style={layoutStyles.privacyRow}>
            <ShieldCheck color="rgba(255,255,255,0.4)" size={13} strokeWidth={2} />
            <Text style={layoutStyles.privacyText}>
              Your exact location is never shared with other users.
            </Text>
          </View>
        )}
        <View style={!canContinue ? { borderRadius: 30, backgroundColor: C.ink, overflow: 'hidden' } : null}>
          <AnimatedPressable
            disabled={!canContinue}
            style={[styles.primaryButton, !canContinue && styles.disabled]}
            onPress={stepIndex === 8 ? requestLocation : (onContinuePress ?? goNext)}
          >
            <Text style={styles.primaryText}>
              {stepIndex === 8
                ? "Share location & let's begin! 🌙"
                : stepIndex === 7
                  ? 'Allow notifications'
                  : 'Continue'}
            </Text>
          </AnimatedPressable>
        </View>
        {stepIndex === 7 && (
          <AnimatedPressable style={layoutStyles.notNowButton} onPress={goNext}>
            <Text style={layoutStyles.notNowText}>Not now</Text>
          </AnimatedPressable>
        )}
      </Animated.View>
    </View>
  );
}

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <OnboardingLayoutContent />
    </OnboardingProvider>
  );
}

const layoutStyles = StyleSheet.create({
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  privacyText: {
    flex: 1,
    color: 'rgba(255,255,255,0.38)',
    fontFamily: 'Quicksand_500Medium',
    fontSize: 12,
    lineHeight: 17,
  },
  notNowButton: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  notNowText: {
    color: 'rgba(255,255,255,0.65)',
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 16,
  },
});
