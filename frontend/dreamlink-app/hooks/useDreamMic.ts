/**
 * useDreamMic — Isolated speech-to-text hook for dream entry.
 *
 * Fixes applied (v2):
 *  1. isListening is React state (useState) — component re-renders on change,
 *     so the mic button icon/color updates immediately on press.
 *  2. Final-result handler now strips the INTERIM_MARKER and everything that
 *     follows it (same regex as the interim handler) before appending the
 *     final segment — prevents duplicate text in the input.
 *  3. Device locale is detected at start-time and passed explicitly to
 *     ExpoSpeechRecognitionModule.start(). This makes Android respect the
 *     system language (e.g. Turkish) instead of defaulting to English.
 */

import { useState, useRef, useCallback } from 'react';
import { Alert, NativeModules, Platform, Animated } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  isSpeechRecognitionAvailable,
} from '../services/speechRecognition';

// Invisible Unicode zero-width space that marks the start of in-progress interim text.
// Everything from this marker to end-of-string is replaced on each interim update.
export const INTERIM_MARKER = '\u200B';

// ─ Device locale helper ────────────────────────────────────────────────────
/**
 * Returns the primary BCP-47 locale tag of the device (e.g. "tr-TR", "en-US").
 *
 * Detection order (most → least reliable on Hermes / Expo 54):
 *  1. JavaScript Intl API — reads the device OS locale, works on both platforms
 *     with Hermes engine (React Native ≥ 0.70). No native module needed.
 *  2. NativeModules (platform-specific) — fallback for very old RN setups.
 *  3. undefined — expo-speech-recognition falls back to the engine's own default.
 */
function getDeviceLocale(): string | undefined {
  // ── Tier 1: Intl (JS standard, most reliable on Hermes) ──────────────
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (locale && locale.length > 1) return locale; // e.g. 'tr-TR', 'en-US'
  } catch { /* Intl not available, fall through */ }

  // ── Tier 2: NativeModules (platform-specific fallback) ───────────────
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      const raw: string | undefined =
        settings?.AppleLocale ?? settings?.AppleLanguages?.[0];
      if (raw) return raw.replace('_', '-');
    }
    if (Platform.OS === 'android') {
      // localeIdentifier is 'tr_TR' style; convert to BCP-47 'tr-TR'
      const raw: string | undefined = NativeModules.I18nManager?.localeIdentifier;
      if (raw) return raw.replace('_', '-');
    }
  } catch { /* NativeModules unavailable */ }

  return undefined;
}

// ─ Types ──────────────────────────────────────────────────────────────────
interface UseDreamMicOptions {
  /** Max allowed characters — interim text is clamped to this value */
  maxChars: number;
  /**
   * Called with a React-state updater function whenever the transcript changes.
   * Typically pass the `setDesc` from the parent component's useState.
   */
  onTranscript: (updater: (prev: string) => string) => void;
  /** Optional: called once the recognition session has successfully started */
  onStart?: () => void;
  /** Optional: called once the recognition session ends (stop, timeout, error) */
  onEnd?: () => void;
}

interface UseDreamMicReturn {
  /** True while the mic is actively recording — drives button appearance */
  isListening: boolean;
  /** Animated.Value (scale) for the pulse animation on the mic button */
  micPulse: Animated.Value;
  /** Toggle mic on → off or off → on; handles permission checks internally */
  toggleMic: () => Promise<void>;
  /** Strips all INTERIM_MARKER characters, returning clean committed text */
  cleanTranscript: (raw: string) => string;
}

// ─ Hook ───────────────────────────────────────────────────────────────────
export function useDreamMic({
  maxChars,
  onTranscript,
  onStart,
  onEnd,
}: UseDreamMicOptions): UseDreamMicReturn {

  // ── State (drives UI re-renders) ──────────────────────────────────────
  // isListening as React state ensures the mic button re-renders immediately
  // when the session starts or stops.
  const [isListening, setIsListening] = useState(false);

  // Ref mirrors the state so event callbacks always read the latest value
  // without stale-closure issues (event handlers close over the ref, not state).
  const isListeningRef = useRef(false);

  // ── Animation ─────────────────────────────────────────────────────────
  const micPulse = useRef(new Animated.Value(1)).current;
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = useCallback(() => {
    pulseAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])
    );
    pulseAnimRef.current.start();
  }, [micPulse]);

  const stopPulse = useCallback(() => {
    pulseAnimRef.current?.stop();
    micPulse.stopAnimation();
    micPulse.setValue(1);
  }, [micPulse]);

  // ── Internal state setter (keeps ref and React state in sync) ─────────
  const setListening = useCallback((value: boolean) => {
    isListeningRef.current = value;
    setIsListening(value);       // triggers re-render → button updates instantly
  }, []);

  // ─ Regex helpers ────────────────────────────────────────────────────
  // Strip INTERIM_MARKER + everything that follows (in-progress interim text).
  // Used in BOTH the interim and final handlers to get the committed base.
  const stripInterim = useCallback(
    (text: string) =>
      text.replace(new RegExp(`${INTERIM_MARKER}[\\s\\S]*$`), '').trimEnd(),
    []
  );

  // Strip only the INTERIM_MARKER characters (used on session-end / error cleanup)
  const stripMarker = useCallback(
    (text: string) =>
      text.replace(new RegExp(INTERIM_MARKER, 'g'), '').trimEnd(),
    []
  );

  // ─ Speech Recognition Events ──────────────────────────────────────────

  // Engine confirmed the session started
  useSpeechRecognitionEvent('start', () => {
    setListening(true);
    startPulse();
    onStart?.();
  });

  // Session ended (via stop(), engine timeout, or error recovery)
  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    stopPulse();
    // Commit any dangling interim text so nothing is lost
    onTranscript((prev) => stripMarker(prev));
    onEnd?.();
  });

  // Transcript update: interim (issuedFinal=false) or final (isFinal=true)
  //
  // FIX — duplicate text root cause:
  //   Old final handler used `.replace(MARKER, '')` which only removed the
  //   marker character but kept the interim text, then appended the final
  //   segment again → same text appeared twice.
  //
  //   Correct approach: both interim AND final handlers strip the marker AND
  //   everything after it (stripInterim) to get the clean committed base,
  //   then append the new segment.
  useSpeechRecognitionEvent('result', (event: any) => {
    const segment: string = event?.results?.[0]?.transcript ?? '';
    if (!segment) return;

    if (event.isFinal) {
      // Commit: strip interim portion, append the confirmed final segment
      onTranscript((prev) => {
        const base = stripInterim(prev);                       // <── FIXED
        return (base + (base ? ' ' : '') + segment).slice(0, maxChars);
      });
    } else {
      // Interim: strip previous interim, append the latest partial text
      onTranscript((prev) => {
        const base = stripInterim(prev);
        return (base + (base ? ' ' : '') + INTERIM_MARKER + segment).slice(0, maxChars);
      });
    }
  });

  // Engine error
  useSpeechRecognitionEvent('error', (event: any) => {
    setListening(false);
    stopPulse();
    onTranscript((prev) => stripMarker(prev));

    const code: string = event?.error ?? '';
    // 'aborted' is triggered by our own stop() call — not an error for the user.
    // 'no-speech' means the user was just silent — also not worth an alert.
    if (code === 'aborted' || code === 'no-speech') return;

    Alert.alert(
      'Voice Input Error',
      'An issue occurred with the microphone. Please try again.',
      [{ text: 'OK', style: 'default' }]
    );
  });

  // ─ Public API ─────────────────────────────────────────────────────────

  const cleanTranscript = useCallback(
    (raw: string) => stripMarker(raw),
    [stripMarker]
  );

  const toggleMic = useCallback(async () => {

    // ── Stop if already listening ────────────────────────────────────────
    if (isListeningRef.current) {
      try {
        ExpoSpeechRecognitionModule?.stop();
      } catch {
        // Engine may have already stopped; safe to ignore
      }
      return;
    }

    // ── Guard: native module availability ────────────────────────────────
    if (!isSpeechRecognitionAvailable || !ExpoSpeechRecognitionModule) {
      Alert.alert(
        'Development Build Required',
        'Voice input is not available in Expo Go. Please use a development or production build.',
        [{ text: 'Understood', style: 'default' }]
      );
      return;
    }

    // ── Guard: microphone permission ─────────────────────────────────────
    let permResult: { granted: boolean };
    try {
      permResult = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    } catch {
      Alert.alert(
        'Permission Error',
        'Could not request microphone permission. Please check your device settings.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (!permResult.granted) {
      Alert.alert(
        'Microphone Access Denied',
        'DreamLink needs microphone access to transcribe your dream.\nPlease enable it in Settings → DreamLink → Microphone.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    // ── Start session ────────────────────────────────────────────────────
    // Locale is read at call-time so it always reflects the current OS setting.
    const deviceLocale = getDeviceLocale();

    // Surface the detected locale in dev builds so it's easy to verify.
    if (__DEV__) {
      console.log('[useDreamMic] Detected locale:', deviceLocale ?? '(none — engine default)');
    }

    try {
      ExpoSpeechRecognitionModule.start({
        interimResults: true,   // stream partial results into the input in real-time
        continuous: true,       // keep listening until the user taps stop
        // Explicitly pass the locale so Android SpeechRecognizer uses the correct
        // language instead of defaulting to English regardless of system settings.
        ...(deviceLocale ? { lang: deviceLocale } : {}),
      });
    } catch {
      Alert.alert(
        'Could Not Start Voice Input',
        'The speech recognition engine could not be started. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, []);

  return {
    isListening,   // React state — component re-renders when this changes
    micPulse,
    toggleMic,
    cleanTranscript,
  };
}
