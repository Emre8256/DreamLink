import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useOnboarding } from './OnboardingContext';
import { OnboardingSection } from './components/OnboardingSection';
import { styles, C } from './styles';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAge(day: string, month: string, year: string): number {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() - (m - 1);
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() - d < 0)) age--;
  return age;
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────
type ConfirmModalProps = {
  visible: boolean;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmModal({
  visible,
  dobDay,
  dobMonth,
  dobYear,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 70,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
    }
  }, [visible]);

  const age = calcAge(dobDay, dobMonth, dobYear);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={modal.overlay} onPress={onCancel}>
        <Animated.View style={[modal.sheet, { opacity, transform: [{ scale }] }]}>
          <Pressable onPress={() => { }} style={{ width: '100%' }}>
            <LinearGradient
              colors={['#422029', '#2E1920', '#221118']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={modal.gradientContainer}
            >
              {/* Age display */}
              <View style={modal.body}>
                <Text style={modal.ageLabel}>VERIFY YOUR AGE</Text>

                <View style={modal.ageContainer}>
                  <Text style={modal.ageBig}>{age}</Text>
                </View>

                <Text style={modal.warning}>
                  Please confirm your age. This information cannot be changed later.
                </Text>
              </View>

              {/* Actions */}
              <View style={modal.actions}>
                <Pressable
                  style={({ pressed }) => [modal.cancelBtn, pressed && { opacity: 0.65 }]}
                  onPress={onCancel}
                >
                  <Text style={modal.cancelText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [modal.confirmBtn, pressed && { opacity: 0.86 }]}
                  onPress={onConfirm}
                >
                  <Text style={modal.confirmText}>Continue →</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function IdentityScreen() {
  const {
    name,
    setName,
    dobDay,
    setDobDay,
    dobMonth,
    setDobMonth,
    dobYear,
    setDobYear,
    setCanContinue,
    setOnContinuePress,
    goNext,
    scrollTo,
  } = useOnboarding();

  const dayRef = useRef<TextInput>(null);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const [modalVisible, setModalVisible] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────
  const dobError = useMemo(() => {
    if (!dobDay || !dobMonth || !dobYear) return null;
    if (dobDay.length < 2 || dobMonth.length < 2 || dobYear.length < 4) return null;
    const d = parseInt(dobDay, 10);
    const m = parseInt(dobMonth, 10);
    const y = parseInt(dobYear, 10);
    if (m < 1 || m > 12) return 'Could you enter a valid month between 01 and 12?';
    if (y < 1920 || y > new Date().getFullYear()) return 'Could you type in a valid birth year?';
    const daysInMonth = [
      31,
      y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28,
      31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ];
    if (d < 1 || d > daysInMonth[m - 1])
      return `Could you enter a day between 01 and ${daysInMonth[m - 1]}?`;
    let age = new Date().getFullYear() - y;
    if (
      new Date().getMonth() - (m - 1) < 0 ||
      (new Date().getMonth() - (m - 1) === 0 && new Date().getDate() - d < 0)
    ) age--;
    if (age < 18) return 'You need to be at least 18 to join the Dream Link world 🌙';
    if (age > 120) return "Could you double-check your birthdate? It doesn't look quite right.";
    return null;
  }, [dobDay, dobMonth, dobYear]);

  const isValid = useMemo(
    () =>
      name.trim().length > 1 &&
      dobDay.length === 2 &&
      dobMonth.length === 2 &&
      dobYear.length === 4 &&
      dobError === null,
    [name, dobDay, dobMonth, dobYear, dobError],
  );

  useEffect(() => { setCanContinue(isValid); }, [isValid, setCanContinue]);

  // ── Intercept continue button ────────────────────────────────────────────────
  const openModal = useCallback(() => setModalVisible(true), []);

  useEffect(() => {
    setOnContinuePress(openModal);
    return () => { setOnContinuePress(null); };
  }, [openModal, setOnContinuePress]);

  // ── DOB input handlers ───────────────────────────────────────────────────────
  const handleDobFocus = () => scrollTo(120);

  const handleDay = (text: string) => {
    const v = text.replace(/\D/g, '');
    setDobDay(v);
    if (v.length === 2) monthRef.current?.focus();
  };

  const handleMonth = (text: string) => {
    const v = text.replace(/\D/g, '');
    setDobMonth(v);
    if (v.length === 2) yearRef.current?.focus();
  };

  const handleMonthKey = ({ nativeEvent }: any) => {
    if (nativeEvent.key === 'Backspace' && !dobMonth) dayRef.current?.focus();
  };

  const handleYear = (text: string) => setDobYear(text.replace(/\D/g, ''));

  const handleYearKey = ({ nativeEvent }: any) => {
    if (nativeEvent.key === 'Backspace' && !dobYear) monthRef.current?.focus();
  };

  // ── Confirm action ───────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    setModalVisible(false);
    // Brief delay so modal closes smoothly before navigation
    setTimeout(() => { goNext?.(); }, 120);
  }, [goNext]);

  return (
    <OnboardingSection title="Let's get to know you a bit! 🌙">

      {/* Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>YOUR NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.cardInput}
          selectionColor={C.rose}
          returnKeyType="next"
          onSubmitEditing={() => dayRef.current?.focus()}
        />
        <View style={styles.warningContainer}>
          <AlertCircle color={C.muted} size={14} />
          <Text style={styles.inputWarning}>You won't be able to change your name later.</Text>
        </View>
      </View>

      {/* Date of birth */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>DATE OF BIRTH</Text>
        <View style={styles.dobContainer}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TextInput
              ref={dayRef}
              value={dobDay}
              onChangeText={handleDay}
              onFocus={handleDobFocus}
              keyboardType="number-pad"
              maxLength={2}
              style={styles.dobInput}
              selectionColor={C.rose}
            />
            {!dobDay && (
              <Text pointerEvents="none" style={modal.dobPlaceholder}>DD</Text>
            )}
          </View>
          <Text style={styles.dobDivider}>/</Text>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TextInput
              ref={monthRef}
              value={dobMonth}
              onChangeText={handleMonth}
              onKeyPress={handleMonthKey}
              onFocus={handleDobFocus}
              keyboardType="number-pad"
              maxLength={2}
              style={styles.dobInput}
              selectionColor={C.rose}
            />
            {!dobMonth && (
              <Text pointerEvents="none" style={modal.dobPlaceholder}>MM</Text>
            )}
          </View>
          <Text style={styles.dobDivider}>/</Text>
          <View style={{ flex: 1.5, justifyContent: 'center' }}>
            <TextInput
              ref={yearRef}
              value={dobYear}
              onChangeText={handleYear}
              onKeyPress={handleYearKey}
              onFocus={handleDobFocus}
              keyboardType="number-pad"
              maxLength={4}
              style={[styles.dobInput, styles.dobInputYear]}
              selectionColor={C.rose}
            />
            {!dobYear && (
              <Text pointerEvents="none" style={modal.dobPlaceholder}>YYYY</Text>
            )}
          </View>
        </View>
        {dobError ? <Text style={styles.dobErrorText}>{dobError}</Text> : null}
      </View>

      {/* Confirmation modal */}
      <ConfirmModal
        visible={modalVisible}
        dobDay={dobDay}
        dobMonth={dobMonth}
        dobYear={dobYear}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleConfirm}
      />

    </OnboardingSection>
  );
}

// ─── Modal styles ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 7, 8, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  sheet: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientContainer: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  body: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  ageContainer: {
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageLabel: {
    color: C.white,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  ageBig: {
    color: C.white,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 72,
    lineHeight: 80,
    includeFontPadding: false,
    textShadowColor: 'rgba(196, 80, 106, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  ageNote: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 16,
  },
  warning: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 15,
  },
  confirmBtn: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmText: {
    color: '#1C0E14',
    fontFamily: 'Quicksand_700Bold',
    fontSize: 16,
  },
  dobPlaceholder: {
    position: 'absolute',
    alignSelf: 'center',
    color: 'rgba(255, 255, 255, 0.25)',
    fontFamily: 'Quicksand_700Bold',
    fontSize: 20,
  },
});

