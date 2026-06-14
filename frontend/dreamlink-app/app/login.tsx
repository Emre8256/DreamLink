import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const MOCK_AUTH_TOKEN =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJtb2NrLXVzZXIiLCJleHAiOjE5MjQ5OTIwMDB9.mock';

const C = {
  ink: '#0E0B0D',
  rose: '#C4506A',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.12)',
  glassBorder: 'rgba(255,255,255,0.22)',
  muted: 'rgba(255,255,255,0.5)',
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const emailReady = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email]);
  const codeReady = code.every(Boolean);

  const isRegisteredAccount = (value: string) => {
    const normalized = value.trim().toLowerCase();
    return normalized.includes('registered') || normalized.endsWith('@dream.link');
  };

  const submitEmail = () => {
    if (!emailReady) return;
    setStep('code');
    setTimeout(() => inputs.current[0]?.focus(), 120);
  };

  const submitCode = async () => {
    if (!codeReady) return;
    if (isRegisteredAccount(email)) {
      await login(MOCK_AUTH_TOKEN);
      router.replace('/(tabs)/today');
      return;
    }
    router.replace({ pathname: '/(onboarding)/identity', params: { email: email.trim() } });
  };

  const updateCode = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
  }, [step]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#8C3048', '#4C1523', '#1F0C10', '#0E0B0D']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: 0 }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>

          <View style={styles.header}>
            <AnimatedPressable style={styles.backButton} onPress={() => (step === 'email' ? router.back() : setStep('email'))}>
              <ChevronLeft color={C.white} size={32} strokeWidth={2.5} />
            </AnimatedPressable>
          </View>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>{step === 'email' ? "What's your email?" : "Enter your code"}</Text>
            <Text style={styles.subtitle}>
              {step === 'email'
                ? "We'll send you a secure verification code to sign in."
                : `We sent a 6-digit code to ${email}.`}
            </Text>

            {step === 'email' ? (
              <View style={styles.inputContainer}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="Email address"
                  placeholderTextColor={C.muted}
                  style={styles.emailInput}
                  autoFocus
                  selectionColor={C.rose}
                />
              </View>
            ) : (
              <View style={styles.codeContainer}>
                <View style={styles.codeRow}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { inputs.current[index] = ref; }}
                      value={digit}
                      onChangeText={(value) => updateCode(value, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      selectionColor={C.rose}
                      style={[styles.codeInput, digit ? styles.codeInputActive : null]}
                    />
                  ))}
                </View>
              </View>
            )}
          </Animated.View>

          <View style={[styles.footer, { paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 24) }]}>
            <AnimatedPressable
              disabled={step === 'email' ? !emailReady : !codeReady}
              style={[styles.primaryButton, (step === 'email' ? !emailReady : !codeReady) && styles.disabled]}
              onPress={step === 'email' ? submitEmail : submitCode}
            >
              <Text style={styles.primaryText}>Continue</Text>
            </AnimatedPressable>
          </View>

        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.ink,
  },

  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    marginTop: 8,
    marginLeft: -8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginTop: 40,
  },
  title: {
    color: C.white,
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    color: C.muted,
    fontFamily: 'Quicksand_500Medium',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
  },
  inputContainer: {
    borderBottomWidth: 2,
    borderBottomColor: C.white,
    paddingBottom: 12,
  },
  emailInput: {
    color: C.white,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 18,
    lineHeight: 24,
    padding: 0,
  },
  codeContainer: {
    gap: 24,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  codeInput: {
    flex: 1,
    aspectRatio: 0.8,
    borderRadius: 16,
    backgroundColor: C.glass,
    borderWidth: 1.5,
    borderColor: C.glassBorder,
    textAlign: 'center',
    color: C.white,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 28,
  },
  codeInputActive: {
    borderColor: C.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  footer: {
    paddingBottom: 24,
  },
  primaryButton: {
    height: 60,
    borderRadius: 30,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  disabled: {
    opacity: 0.3,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryText: {
    color: C.ink,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 18,
  },
});
