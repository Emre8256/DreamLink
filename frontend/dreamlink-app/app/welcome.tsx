import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, Linking, StyleSheet, Text, View, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mail, X } from 'lucide-react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';
const { height: SCREEN_H } = Dimensions.get('window');

const C = {
  ink: '#0E0B0D',
  rose: '#C4506A',
  roseDeep: '#8B2E48',
  pearl: '#FFFDF9',
  warmGold: '#E8C88A',
  softPink: 'rgba(196,80,106,0.35)',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.12)',
  glassBorder: 'rgba(255,255,255,0.22)',
};

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  /* ── TEST ONLY: DEV LOGIN STATE ── */
  const { login: contextLogin } = useAuth();
  const [isTestModalVisible, setIsTestModalVisible] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');

  const handleTestLogin = async () => {
    if (!testEmail || !testPassword) return;
    setTestLoading(true);
    setTestError('');
    try {
      const token = await apiLogin({
        email: testEmail.trim(),
        password: testPassword,
      });
      await contextLogin(token);
      setIsTestModalVisible(false);
    } catch (err: any) {
      console.error('Test login failed:', err);
      setTestError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setTestLoading(false);
    }
  };
  /* ────────────────────────────────── */

  /* ── Animations ── */
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    /* Content entrance */
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1200,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 1200,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, slideUp]);

  /* ── Interpolations ── */

  const contentAnim = {
    opacity: fadeIn,
    transform: [{ translateY: slideUp }],
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {/* ── Dreamscape background ── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Deep night sky background image */}
        <Image
          source={require('../assets/images/dream_bg.png')}
          resizeMode="cover"
          style={styles.sky}
        />

        {/* Bottom cinematic fade */}
        <LinearGradient
          colors={['rgba(14,11,13,0)', 'rgba(14,11,13,0.55)', 'rgba(14,11,13,0.88)']}
          locations={[0, 0.5, 1]}
          style={styles.bottomFade}
        />
      </View>

      {/* ── Foreground content ── */}
      <View
        style={[
          styles.foreground,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Brand */}
        <Animated.View style={[styles.brandArea, contentAnim]}>
          <Text style={styles.brandName}>Dream{'\n'}Link</Text>
        </Animated.View>

        {/* Hero + Actions pinned to bottom */}
        <Animated.View
          style={[styles.bottomArea, contentAnim]}
          needsOffscreenAlphaCompositing={true}
        >
          <View style={styles.heroCopy}>
            <Text style={styles.headline}>Where dreams{'\n'}become connections</Text>
          </View>

          <View style={styles.actions}>
            <AnimatedPressable
              style={styles.googleButton}
              onPress={() =>
                router.push({
                  pathname: '/(onboarding)/identity',
                  params: { provider: 'google' },
                })
              }
            >
              <Image
                source={require('../assets/images/google_logo.png')}
                style={styles.googleLogo}
              />
              <Text style={styles.googleText}>Continue with Google</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.emailButton}
              onPress={() => router.push('/login')}
            >
              <Mail color={C.white} size={19} strokeWidth={2} />
              <Text style={styles.emailText}>Continue with Email</Text>
            </AnimatedPressable>

            {/* ── TEST ONLY: REMOVE BEFORE PRODUCTION ── */}
            <AnimatedPressable
              style={styles.testButton}
              onPress={() => setIsTestModalVisible(true)}
            >
              <Text style={styles.testButtonText}>Developer / Test Login</Text>
            </AnimatedPressable>
            {/* ───────────────────────────────────────── */}

            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('https://example.com/terms')}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL('https://example.com/privacy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* ── TEST ONLY: DEV LOGIN MODAL ── */}
      <Modal
        visible={isTestModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoiding}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Test Login</Text>
                <AnimatedPressable
                  style={styles.closeButton}
                  onPress={() => {
                    setIsTestModalVisible(false);
                    setTestError('');
                  }}
                >
                  <X color={C.white} size={20} />
                </AnimatedPressable>
              </View>

              <Text style={styles.modalSubtitle}>
                Log in directly with a test email and password.
              </Text>

              {testError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{testError}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL</Text>
                <TextInput
                  value={testEmail}
                  onChangeText={setTestEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="test@example.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.modalInput}
                  selectionColor={C.rose}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TextInput
                  value={testPassword}
                  onChangeText={setTestPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.modalInput}
                  selectionColor={C.rose}
                />
              </View>

              <AnimatedPressable
                disabled={testLoading || !testEmail || !testPassword}
                style={[
                  styles.modalSubmitButton,
                  (testLoading || !testEmail || !testPassword) && styles.modalSubmitButtonDisabled
                ]}
                onPress={handleTestLogin}
              >
                {testLoading ? (
                  <ActivityIndicator color={C.ink} size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Login & Redirect</Text>
                )}
              </AnimatedPressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      {/* ───────────────────────────────── */}
    </View>
  );
}

/* ────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.ink,
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  /* Bottom cinematic fade */
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
  },

  /* ── Foreground layout ── */
  foreground: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },

  /* Brand */
  brandArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SCREEN_H * 0.12,
    width: '100%',
  },
  brandName: {
    color: C.pearl,
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },

  /* Hero */
  bottomArea: {
    gap: 32,
  },
  heroCopy: {
    gap: 14,
  },
  headline: {
    color: C.white,
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -0.4,
  },

  /* Action buttons */
  actions: {
    gap: 12,
  },
  googleButton: {
    height: 58,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 10,
  },
  googleLogo: {
    width: 21,
    height: 21,
  },
  googleText: {
    color: C.ink,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 16,
  },
  emailButton: {
    height: 58,
    borderRadius: 20,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  emailText: {
    color: C.white,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 16,
  },
  terms: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Quicksand_500Medium',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 2,
  },
  link: {
    color: 'rgba(255,255,255,0.85)',
    textDecorationLine: 'underline',
    fontFamily: 'Quicksand_700Bold',
  },
  /* ── TEST ONLY: STYLES ── */
  testButton: {
    height: 58,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232, 200, 138, 0.4)',
    backgroundColor: 'rgba(232, 200, 138, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  testButtonText: {
    color: C.warmGold,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 11, 13, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalKeyboardAvoiding: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1E171B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: C.white,
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 24,
    letterSpacing: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Quicksand_500Medium',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(196, 80, 106, 0.15)',
    borderColor: 'rgba(196, 80, 106, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#FF6B8B',
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 13,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: C.warmGold,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  modalInput: {
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    color: C.white,
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 15,
  },
  modalSubmitButton: {
    height: 54,
    backgroundColor: C.white,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: C.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  modalSubmitText: {
    color: C.ink,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 16,
  },
  /* ─────────────────────── */
});
