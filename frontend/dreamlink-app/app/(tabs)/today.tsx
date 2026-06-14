import { Ionicons, Feather } from '@expo/vector-icons';
import { HelpCircle } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ExpoSpeechRecognitionModule } from '../../services/speechRecognition';
import { useDreamMic, INTERIM_MARKER } from '../../hooks/useDreamMic';
import wsService from '../../services/websocket';
import { useAppStore } from '../../store/useAppStore';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
  Platform,
  Animated,
  ScrollView,
  StatusBar,
  Easing,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createDream,
  DreamResponse,
  DreamTheme,
  CreateDreamRequest,
  formatRelativeTime,
  toggleLike,
  getUserDreams,
  getMyProfile,
} from '../../services/api';

// ─ Design tokens & Premium Palette ───────────────────────────────
const C = {
  rose: '#A63F4F',      // Koyu Rose (Ana Renk)
  roseLt: '#F7E6E8',    // Light Rose (Backgrounds, soft transitions)
  roseMd: '#D697A2',    // Medium Rose (Lines, passive icons)
  roseDk: '#7D2D3A',    // Deep Rose (Deep emphasis)
  bg: '#FFFFFF',        // Pure White
  sand: '#F8FAFC',      // Very light gray (Filter pills, tabs)
  card: '#FFFFFF',
  t1: '#1C1714',        // Dark Slate (Main Headings)
  t2: '#475569',        // Medium Gray (Body text)
  tm: '#94a3b8',        // Light Gray (Date, subtext)
  white: '#FFFFFF',
} as const;

const SERIF = 'Quicksand_700Bold';
const QS_BOLD = 'Quicksand_700Bold';

type ThemeDisplay = { label: string; emoji: string; bar: string; badgeBg: string; badgeC: string };

const THEME_DISPLAY: Record<DreamTheme, ThemeDisplay> = {
  LUCID: { label: 'Lucid', emoji: '✨', bar: '#7098D4', badgeBg: '#E8EDF6', badgeC: '#4A70B4' },
  NIGHTMARE: { label: 'Nightmare', emoji: '🌑', bar: '#A08090', badgeBg: '#F0EDEE', badgeC: '#806070' },
  HAPPY: { label: 'Happy', emoji: '😊', bar: '#80B090', badgeBg: '#EBF2EC', badgeC: '#4A8A60' },
  SAD: { label: 'Sad', emoji: '😢', bar: '#C4A060', badgeBg: '#F5EFE3', badgeC: '#9A7840' },
  ANGRY: { label: 'Angry', emoji: '😠', bar: '#8090A0', badgeBg: '#ECEEF0', badgeC: '#607080' },
  LOVE: { label: 'Love', emoji: '❤️', bar: C.rose, badgeBg: C.roseLt, badgeC: C.rose },
  EXCITED: { label: 'Excited', emoji: '🎉', bar: '#606070', badgeBg: '#EEEEEF', badgeC: '#505060' },
  CURIOUS: { label: 'Curious', emoji: '🔮', bar: '#A080B8', badgeBg: '#F0EBF5', badgeC: '#806098' },
};

const ORDERED_THEMES: DreamTheme[] = ['LUCID', 'NIGHTMARE', 'HAPPY', 'SAD', 'ANGRY', 'LOVE', 'EXCITED', 'CURIOUS'];

// Mock Profile Images Pool
const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=200&q=80',
];

const showAlert = (title: string, msg: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
  else Alert.alert(title, msg);
};

// ─ Animated ambient dot ────────────────────────────────────────────
const StarDot = React.memo(({ left, top, sz }: { left: string; top: string; sz: number }) => {
  const opac = useRef(new Animated.Value(0.1)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(opac, { toValue: 0.4, duration: 2000 + Math.random() * 1500, useNativeDriver: true }),
        Animated.timing(opac, { toValue: 0.1, duration: 1800 + Math.random() * 1200, useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute', left: left as any, top: top as any,
        width: sz * 2, height: sz * 2, borderRadius: sz,
        backgroundColor: C.roseMd,
        opacity: opac,
        transform: [{ scale: opac.interpolate({ inputRange: [0.1, 0.4], outputRange: [0.8, 1.2] }) }]
      }}
    />
  );
});

const STARS = [
  { left: '9%', top: '14%', sz: 2 }, { left: '26%', top: '32%', sz: 1.5 },
  { left: '50%', top: '10%', sz: 2.5 }, { left: '70%', top: '22%', sz: 1.5 },
  { left: '83%', top: '50%', sz: 2 }, { left: '40%', top: '62%', sz: 1.5 },
  { left: '16%', top: '72%', sz: 1 }, { left: '62%', top: '80%', sz: 2 },
  { left: '88%', top: '10%', sz: 1.5 }, { left: '32%', top: '84%', sz: 1 },
];

// ─ Greeting Card (Premium Welcome) ────────────────────────────────
const sunSvgXml = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#A63F4F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
</svg>
`;

const getGreetingConfig = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: 'GOOD MORNING, EMRE', emoji: '\uD83C\uDF05', useSvg: true };
  } else if (hour >= 12 && hour < 18) {
    return { text: 'GOOD AFTERNOON, EMRE', emoji: '\u2600\uFE0F', useSvg: false };
  } else if (hour >= 18 && hour < 23) {
    return { text: 'GOOD EVENING, EMRE', emoji: '\ud83c\udf12', useSvg: false };
  } else {
    return { text: 'GOOD NIGHT, EMRE', emoji: '\ud83c\udf11', useSvg: false };
  }
};

const GreetingCard = () => {
  const [greeting, setGreeting] = useState(getGreetingConfig);

  useEffect(() => {
    // Update greeting on mount and every minute
    setGreeting(getGreetingConfig());
    const interval = setInterval(() => {
      setGreeting(getGreetingConfig());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.greetingHeader}>
      <Text style={styles.greetingEyebrow}>{greeting.text}</Text>
      {greeting.useSvg ? (
        <View style={{ marginLeft: 8 }}>
          <SvgXml xml={sunSvgXml} width={18} height={18} />
        </View>
      ) : (
        <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
      )}
    </View>
  );
};

// ─ Creator Card (Premium Rose + White — Luxury Edition) ──────────
const DREAM_MIN_CHARS = 50;
const DREAM_MAX_CHARS = 500;
const EDITORIAL_SERIF = 'PlayfairDisplay-Italic';

// ─ Animated Background Elements for CreatorCard ──────────────────
const FloatingMoon = () => {
  const floatAnimY = useRef(new Animated.Value(0)).current;
  const floatAnimX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animY = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimY, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnimY, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const animX = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimX, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnimX, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    animY.start();
    animX.start();
    return () => {
      animY.stop();
      animX.stop();
    };
  }, [floatAnimY, floatAnimX]);

  const translateY = floatAnimY.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 5],
  });

  const translateX = floatAnimX.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 3],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 25,
        right: 25,
        opacity: 0.12,
        transform: [{ translateY }, { translateX }],
      }}
    >
      <Ionicons name="moon" size={32} color="#A63F4F" />
    </Animated.View>
  );
};

const TwinklingStar = ({
  top,
  bottom,
  left,
  right,
  size,
  delay,
}: {
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  size: number;
  delay: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 0.6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.15, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.2, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.5, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    };

    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, [delay, opacityAnim, scaleAnim]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: top as any,
        bottom: bottom as any,
        left: left as any,
        right: right as any,
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Ionicons name="star" size={size} color="#A63F4F" />
    </Animated.View>
  );
};

// ─ Mock AI Title Generator (Analyzes text and returns poetic titles) ─
const generateMockAiTitle = (desc: string): string => {
  const text = desc.toLowerCase();

  if (text.includes('deniz') || text.includes('su') || text.includes('okyanus') || text.includes('dalga') || text.includes('göl') || text.includes('yüzmek') ||
    text.includes('sea') || text.includes('water') || text.includes('ocean') || text.includes('wave') || text.includes('lake') || text.includes('swim')) {
    return 'Call of the Blue Depth';
  }
  if (text.includes('uçmak') || text.includes('gökyüzü') || text.includes('bulut') || text.includes('kuş') || text.includes('rüzgar') ||
    text.includes('fly') || text.includes('sky') || text.includes('cloud') || text.includes('bird') || text.includes('wind')) {
    return 'Wind of the Infinite Sky';
  }
  if (text.includes('korku') || text.includes('karanlık') || text.includes('canavar') || text.includes('kaçmak') || text.includes('kovalamak') ||
    text.includes('fear') || text.includes('dark') || text.includes('monster') || text.includes('escape') || text.includes('chase')) {
    return 'Labyrinth of Darkness';
  }
  if (text.includes('düşmek') || text.includes('boşluk') || text.includes('uçurum') ||
    text.includes('fall') || text.includes('void') || text.includes('cliff')) {
    return 'Gliding in Infinite Void';
  }
  if (text.includes('eski') || text.includes('tarih') || text.includes('antik') || text.includes('kütüphane') || text.includes('kitap') ||
    text.includes('old') || text.includes('history') || text.includes('antique') || text.includes('library') || text.includes('book')) {
    return 'Dusty Pages of Time';
  }
  if (text.includes('aşk') || text.includes('sevgi') || text.includes('sevgili') || text.includes('çiçek') || text.includes('öpüşmek') ||
    text.includes('love') || text.includes('affection') || text.includes('darling') || text.includes('flower') || text.includes('kiss')) {
    return 'Secret Garden of the Heart';
  }
  if (text.includes('ay') || text.includes('yıldız') || text.includes('gece') || text.includes('uzay') || text.includes('gezegen') ||
    text.includes('moon') || text.includes('star') || text.includes('night') || text.includes('space') || text.includes('planet')) {
    return 'Cosmic Night Tale';
  }
  if (text.includes('para') || text.includes('altın') || text.includes('zengin') || text.includes('hazine') ||
    text.includes('money') || text.includes('gold') || text.includes('rich') || text.includes('treasure')) {
    return 'Mysterious Treasure Chamber';
  }
  if (text.includes('okul') || text.includes('sınav') || text.includes('geç kalmak') || text.includes('ders') ||
    text.includes('school') || text.includes('exam') || text.includes('late') || text.includes('lesson')) {
    return 'Unfinished Exam';
  }

  // Poetic default fallbacks based on string hash to remain consistent for the same text
  const fallbacks = [
    'Whisper of the Subconscious',
    'Mirror of the Night',
    'Journey Beyond Time',
    'Dance of Shadow and Light',
    'Threshold of Awakening'
  ];
  const hash = desc.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return fallbacks[hash % fallbacks.length];
};

const CreatorCard = ({ onDreamShared }: { onDreamShared: (d: DreamResponse) => void }) => {
  const [desc, setDesc] = useState('');
  const [isMatchable, setIsMatchable] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // ── Isolated mic hook — no lang lock, device locale auto-detected ──
  const { isListening, micPulse, toggleMic, cleanTranscript } = useDreamMic({
    maxChars: DREAM_MAX_CHARS,
    onTranscript: setDesc,
  });

  const handleMic = toggleMic;

  const handleShare = async () => {
    const cleanDesc = cleanTranscript(desc);
    if (cleanDesc.length < DREAM_MIN_CHARS) {
      setShowHint(true);
      return;
    }
    // Stop mic gracefully before submitting
    if (isListening) {
      try { ExpoSpeechRecognitionModule?.stop(); } catch { /* already stopped */ }
    }
    setSharing(true);
    try {
      const req: CreateDreamRequest = {
        title: generateMockAiTitle(cleanDesc), description: cleanDesc,
        theme: 'CURIOUS', visibility: isMatchable ? 'PUBLIC' : 'PRIVATE', tagNames: [],
      };
      const newDream = await createDream(req);
      setDesc(''); setIsMatchable(true);
      onDreamShared(newDream);
    } catch {
      showAlert('Error', 'An error occurred while saving the dream.');
    } finally { setSharing(false); }
  };

  const cleanDesc = cleanTranscript(desc);
  const charCount = cleanDesc.length;
  const charsLeftToMin = Math.max(DREAM_MIN_CHARS - charCount, 0);
  const canSave = charCount >= DREAM_MIN_CHARS && charCount <= DREAM_MAX_CHARS;
  const counterColor = charCount >= DREAM_MAX_CHARS ? '#B42318' : '#666666';

  return (
    <View style={cStyles.outerWrap}>
      <View style={cStyles.card}>
        {/* Magical Animating Background - Placed strictly along the top borders */}
        <FloatingMoon />
        <TwinklingStar top={30} left={30} size={10} delay={400} />
        <TwinklingStar top={45} left={45} size={8} delay={800} />


        <View style={cStyles.greetingWrap}>
          <Text style={cStyles.greetingHook}>
            "What did the night whisper to you?"
          </Text>
          <View style={cStyles.greetingDivider} />
        </View>

        <View style={cStyles.inputWrap}>
          <TextInput
            style={cStyles.textInput}
            placeholder="I was standing by an old house near the sea..."
            placeholderTextColor="#94a3b8"
            value={desc}
            onChangeText={(text) => {
              setDesc(text.slice(0, DREAM_MAX_CHARS));
              if (showHint && text.trim().length >= DREAM_MIN_CHARS) setShowHint(false);
            }}
            multiline
            maxLength={DREAM_MAX_CHARS}
            textAlignVertical="top"
          />
          <View style={cStyles.inputDivider} />
          <View style={cStyles.inputFooter}>
            <Text style={[cStyles.minHint, { color: counterColor }]}>
              {canSave ? 'READY TO SAVE' : `${charsLeftToMin} MORE CHARACTERS`}
            </Text>
            <View style={cStyles.inputFooterRight}>
              <Text style={[cStyles.charCount, { color: counterColor }]}>{charCount}/{DREAM_MAX_CHARS}</Text>
              <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                <TouchableOpacity
                  style={[cStyles.micBtnMinimal, isListening && cStyles.micBtnMinimalActive]}
                  onPress={handleMic}
                  activeOpacity={0.76}
                >
                  <Ionicons
                    name={isListening ? 'stop' : 'mic-outline'}
                    size={19}
                    color={isListening ? C.rose : '#888888'}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>

        <View style={cStyles.guidelinesWrap}>
          <Ionicons name="information-circle-outline" size={14} color="#94a3b8" />
          <Text style={cStyles.guidelinesText}>
            Feel free to write in your native language. Please keep our community safe by avoiding slang and inappropriate content.
          </Text>
        </View>

        {showHint && (
          <Text style={cStyles.errorHint}>
            * This dream is a bit concise. Could you share a few more details to help reveal its essence?
          </Text>
        )}

        <View style={cStyles.toggleSection}>
          <View style={cStyles.segmentedTrack}>
            <TouchableOpacity
              style={[cStyles.segmentBtn, !isMatchable && cStyles.segmentBtnActive]}
              onPress={() => setIsMatchable(false)}
              activeOpacity={0.8}
            >
              {!isMatchable && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFFFFF' }]} />}
              <Ionicons name="lock-closed" size={15} color={!isMatchable ? C.rose : '#9E9E9E'} />
              <Text style={[cStyles.segmentText, !isMatchable && cStyles.segmentTextActive]}>
                Private
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[cStyles.segmentBtn, isMatchable && cStyles.segmentBtnActive]}
              onPress={() => setIsMatchable(true)}
              activeOpacity={0.8}
            >
              {isMatchable && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFFFFF' }]} />}
              <Ionicons name="heart-circle" size={16} color={isMatchable ? C.rose : '#9E9E9E'} />
              <Text style={[cStyles.segmentText, isMatchable && cStyles.segmentTextActive]}>
                Matchable
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={cStyles.submitBtn}
          onPress={handleShare}
          disabled={sharing}
          activeOpacity={0.86}
        >
          <LinearGradient
            colors={['#8A3342', '#1C1714']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {sharing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={cStyles.submitInner}>
              <Text style={cStyles.submitText}>SAVE</Text>
              <Ionicons name="moon-outline" size={15} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};


const cStyles = StyleSheet.create({
  outerWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },

  greetingWrap: {
    paddingVertical: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  greetingHook: {
    fontSize: 23,
    color: '#4C1F26', // Elegant, deep burgundy/burgundy tone (more editorial)
    fontFamily: EDITORIAL_SERIF,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.3, // Tightened letter-spacing for italic characters to flow together elegantly
    paddingHorizontal: 20,
  },
  greetingDivider: {
    width: 24,
    height: 1,
    backgroundColor: C.roseMd,
    marginTop: 12,
    opacity: 0.5,
  },
  micBtnMinimal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  micBtnMinimalActive: {
    backgroundColor: C.roseLt,
  },
  inputWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    padding: 20,
    paddingBottom: 12,
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#666666',
    fontFamily: QS_BOLD,
  },
  textInput: {
    fontSize: 16,
    color: '#1C1714',
    lineHeight: 26,
    minHeight: 120,
    padding: 0,
    fontFamily: 'PlayfairDisplay-Regular',
  },
  inputDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  inputFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minHint: {
    fontSize: 11,
    fontFamily: QS_BOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  charCount: {
    fontSize: 11,
    fontFamily: QS_BOLD,
  },
  toggleSection: {
    marginBottom: 24,
  },
  guidelinesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
    marginTop: -8,
    gap: 6,
  },
  guidelinesText: {
    fontSize: 11,
    color: '#666666',
    fontFamily: QS_BOLD,
    textAlign: 'left',
    lineHeight: 16,
    flex: 1,
  },
  errorHint: {
    fontSize: 13,
    color: '#8A3342',
    fontFamily: 'PlayfairDisplay-Regular',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  toggleIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: {
    fontSize: 13,
    color: '#1C1714',
    fontFamily: QS_BOLD,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 3,
    gap: 0,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  segmentText: {
    fontSize: 12,
    color: '#9E9E9E',
    letterSpacing: 0.5,
    fontFamily: QS_BOLD,
  },
  segmentTextActive: {
    color: C.rose,
  },
  submitBtn: {
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8A3342',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  submitBtnMuted: {
    shadowOpacity: 0.08,
  },
  submitInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitText: {
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: QS_BOLD,
    textTransform: 'uppercase',
  },
  submitIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─ Animated dots for similar dreams banner ────────────────────────
const AnimatedDots = () => {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        if (prev === '..') return '...';
        if (prev === '.') return '..';
        return '.';
      });
    }, 550);
    return () => clearInterval(interval);
  }, []);
  return <Text>{dots}</Text>;
};

// ─ Custom animated bar chart for AI analysis loading ───────────────
const AnimatedBarChart = () => {
  const bar1 = useRef(new Animated.Value(6)).current;
  const bar2 = useRef(new Animated.Value(12)).current;
  const bar3 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const createBounce = (animatedVal: Animated.Value, toVal: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedVal, {
            toValue: toVal,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animatedVal, {
            toValue: 4,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
    };

    const anim1 = createBounce(bar1, 16, 450);
    const anim2 = createBounce(bar2, 16, 320);
    const anim3 = createBounce(bar3, 16, 380);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', width: 22, height: 18, gap: 3 }}>
      <Animated.View style={{ width: 4, height: bar1, backgroundColor: '#8A3342', borderRadius: 2 }} />
      <Animated.View style={{ width: 4, height: bar2, backgroundColor: '#A63F4F', borderRadius: 2 }} />
      <Animated.View style={{ width: 4, height: bar3, backgroundColor: '#D697A2', borderRadius: 2 }} />
    </View>
  );
};

// ─ Temporary test flag for inappropriate dream design ────────────────
const IS_DREAM_INAPPROPRIATE = true; //test // Set to false to test normal flow

// ─ Today’s Dream Card (Premium Editorial) ──────────────────────
const TodaysInsightCard = React.memo(({ dream }: { dream: DreamResponse }) => {
  const router = useRouter();
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(16)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanX = useRef(new Animated.Value(0)).current;
  const scanY = useRef(new Animated.Value(0)).current;
  const [statsLoading, setStatsLoading] = useState(true);
  const statsFadeAnim = useRef(new Animated.Value(1)).current;

  // Feedback states for inappropriate dream warning
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(cardTranslate, { toValue: 0, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scanX, { toValue: 2.5, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scanX, { toValue: -2.5, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scanX, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scanY, { toValue: -2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scanY, { toValue: 2, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scanY, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    );
    scanLoop.start();
    return () => scanLoop.stop();
  }, [scanX, scanY]);

  const scanRot = scanX.interpolate({
    inputRange: [-2.5, 2.5],
    outputRange: ['-18deg', '18deg'],
  });

  useEffect(() => {
    // Transition after 3 seconds of scanning to show the loaded statistics
    const timer = setTimeout(() => {
      Animated.timing(statsFadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setStatsLoading(false);
        Animated.timing(statsFadeAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }).start();
      });
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const handleAI = () => {
    if (statsLoading || IS_DREAM_INAPPROPRIATE) return;
    router.push(`/dream/${dream.id}` as any);
  };

  const d = new Date(dream.createdAt);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Animated.View style={{ transform: [{ translateY: cardTranslate }] }}>
      <TouchableOpacity
        style={styles.dreamCardWrapper}
        onPress={() => {
          if (statsLoading || IS_DREAM_INAPPROPRIATE) return;
          router.push(`/dream/${dream.id}` as any);
        }}
        activeOpacity={statsLoading || IS_DREAM_INAPPROPRIATE ? 1 : 0.9}
      >
        <View style={styles.dreamCard}>
          <Animated.View style={[styles.dreamCardInner, { opacity: cardOpacity }]}>
            {/* Date */}
            <View style={styles.dreamCardDateRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="moon" size={13} color={C.roseMd} />
                <Text style={styles.dreamCardDate}>{dateStr}</Text>
              </View>
              {!IS_DREAM_INAPPROPRIATE && <Text style={styles.dreamCardSharedBadge}>✓ shared</Text>}
            </View>

            {/* Divider */}
            <View style={styles.dreamCardDivider} />

            {/* Dream Title */}
            {!IS_DREAM_INAPPROPRIATE && <Text style={styles.dreamCardTitle}>"{dream.title}"</Text>}

            {/* Dream Body */}
            <Text style={styles.dreamCardBody}>{dream.description}</Text>

            {/* Similar Dreams Match Banner / Inappropriate Warning Section */}
            {!statsLoading && (
              IS_DREAM_INAPPROPRIATE ? (
                <Animated.View style={[styles.warningBox, { opacity: statsFadeAnim }]}>
                  <View style={styles.warningHeaderRow}>
                    <Ionicons name="warning-outline" size={20} color="#D32F2F" />
                    <Text style={styles.warningTitleText}>
                      Analysis Failed
                    </Text>
                  </View>
                  <Text style={styles.warningInfoText}>
                    This dream has been flagged as it may violate our community guidelines or content policies. Automatic analysis has been disabled.
                  </Text>

                  <View style={styles.warningDivider} />

                  {!feedbackSent ? (
                    <View style={styles.feedbackContainer}>
                      {!showFeedbackInput ? (
                        <TouchableOpacity
                          style={styles.feedbackToggleBtn}
                          onPress={() => setShowFeedbackInput(true)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.feedbackToggleText}>Think this is a mistake? Let us know</Text>
                          <Ionicons name="chatbox-ellipses-outline" size={16} color="#8A3342" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.feedbackInputArea}>
                          <TextInput
                            style={styles.feedbackInput}
                            placeholder="Briefly explain why you think this is a mistake..."
                            placeholderTextColor="#94a3b8"
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                            multiline
                            maxLength={200}
                          />
                          <View style={styles.feedbackActionRow}>
                            <TouchableOpacity
                              style={styles.feedbackCancelBtn}
                              onPress={() => setShowFeedbackInput(false)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.feedbackCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.feedbackSendBtn, !feedbackText.trim() && styles.feedbackSendBtnDisabled]}
                              onPress={() => {
                                if (feedbackText.trim()) {
                                  setFeedbackSent(true);
                                }
                              }}
                              disabled={!feedbackText.trim()}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.feedbackSendText}>Send</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.feedbackSuccessRow}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#2E7D32" />
                      <Text style={styles.feedbackSuccessText}>Your feedback has been sent. Thank you!</Text>
                    </View>
                  )}
                </Animated.View>
              ) : (
                dream.visibility === 'PUBLIC' && (
                  <Animated.View style={[styles.similarDreamsBanner, { opacity: statsFadeAnim }]}>
                    <LinearGradient
                      colors={['#FDF5F6', '#FCFBFB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.similarDreamsInnerLoaded}>
                      <View style={styles.statRow}>
                        <Text style={styles.statEmoji}>🧠</Text>
                        <Text style={styles.statText}>
                          <Text style={styles.statLabel}>Themes: </Text>
                          unprepared exam • race against time • public failure
                        </Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statRow}>
                        <Text style={styles.statEmoji}>🎭</Text>
                        <Text style={styles.statText}>
                          <Text style={styles.statLabel}>Emotions: </Text>
                          Peaceful • Curious
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                )
              )
            )}

            {/* Divider */}
            <View style={styles.dreamCardDivider} />

            {/* AI Analyze Button */}
            <TouchableOpacity
              style={[
                styles.dreamCardAiBtn,
                !statsLoading && IS_DREAM_INAPPROPRIATE && styles.dreamCardAiBtnDisabled
              ]}
              onPress={handleAI}
              activeOpacity={0.85}
              disabled={statsLoading || IS_DREAM_INAPPROPRIATE}
            >
              <View style={styles.dreamCardAiLeft}>
                <View style={styles.dreamCardAiIcon}>
                  {statsLoading ? (
                    <AnimatedBarChart />
                  ) : (
                    <Feather name="bar-chart-2" size={18} color={IS_DREAM_INAPPROPRIATE ? "#9E9E9E" : "#3E3E3E"} />
                  )}
                </View>
                <View>
                  <Text style={[
                    styles.dreamCardAiLabel,
                    !statsLoading && IS_DREAM_INAPPROPRIATE && styles.dreamCardAiLabelDisabled
                  ]}>
                    {statsLoading ? (
                      <>Dream analyzing<AnimatedDots /></>
                    ) : IS_DREAM_INAPPROPRIATE ? (
                      'Analysis Unavailable'
                    ) : (
                      'Dream analyzed'
                    )}
                  </Text>
                  <Text style={styles.dreamCardAiSub}>
                    {statsLoading ? (
                      'Unveiling the mystery of your night...'
                    ) : IS_DREAM_INAPPROPRIATE ? (
                      'This dream violates community guidelines'
                    ) : (
                      'See the Basic interpretation · Free'
                    )}
                  </Text>
                </View>
              </View>
              {statsLoading ? (
                <ActivityIndicator size="small" color={C.rose} style={{ marginRight: 2 }} />
              ) : IS_DREAM_INAPPROPRIATE ? (
                null
              ) : (
                <Ionicons name="chevron-forward" size={15} color="#3E3E3E" />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─ Dream Saved Success Overlay ───────────────────────────────────
const DreamSavedOverlay = ({ visible, onFinish }: { visible: boolean; onFinish: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    checkScale.setValue(0);
    textOpacity.setValue(0);

    Animated.sequence([
      // Fade in overlay
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      // Scale up the circle
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      // Show checkmark
      Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
      // Show text
      Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // Hold
      Animated.delay(1200),
      // Fade out
      Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      onFinish();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.savedOverlay, { opacity: opacityAnim }]}>
      <Animated.View style={[styles.savedCircle, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['#8A3342', '#A63F4F', '#D697A2']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <Ionicons name="checkmark" size={44} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity, marginTop: 28 }}>
        <Text style={styles.savedTitle}>Dream Saved</Text>
        <Text style={styles.savedSubtitle}>Your dream has been sealed in your journal</Text>
      </Animated.View>
    </Animated.View>
  );
};

// ─ FAQ / Help section has been separated into its own page: app/help.tsx ──

// ─ Collective Resonance (Mistik Bağ Grafiği ─ Minimalist Resonance Alignment) ──
const COMMUNITY_STATS = {
  theme: {
    label: "Yesterday's most dominant theme",
    value: 'Getting Lost',
    note: 'Most dreams revolved around pathways searching for direction, overflowing waters, and a sense of transition.',
    icon: 'water-outline' as const,
  },
  symbol: {
    label: "Yesterday's common symbol",
    value: 'Mirror',
    note: 'Users shared images of looking at themselves, splitting in two, and seeing familiar faces as strangers.',
    icon: 'eye-outline' as const,
  },
  mood: {
    label: "Yesterday's most intense emotion",
    value: 'Restlessness',
    note: 'The dominant feeling throughout the night was an inner stirring anticipation, despite looking calm.',
    icon: 'pulse-outline' as const,
  },
};

const CollectiveResonance = React.memo(() => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, delay: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, delay: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, []);

  const data = COMMUNITY_STATS;

  return (
    <Animated.View
      style={[resonanceStyles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      needsOffscreenAlphaCompositing={true}
    >
      <View style={resonanceStyles.headerBlock}>
        <Text style={resonanceStyles.title}>What did people dream of last night?</Text>
        <Text style={resonanceStyles.subtitle}>
          Yesterday's dream records converge at three common points.
        </Text>
      </View>

      <View style={resonanceStyles.featureCardWrapper}>
        <View style={resonanceStyles.featureCard}>
          <LinearGradient
            colors={['#FFF7F4', '#FFFFFF', '#F4F8FB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={resonanceStyles.featureGlow} />
          <View style={resonanceStyles.featureTop}>
            <View style={resonanceStyles.featureIcon}>
              <Ionicons name={data.theme.icon} size={22} color={C.roseDk} />
            </View>
            <Text style={resonanceStyles.featureLabel}>{data.theme.label}</Text>
          </View>
          <Text style={resonanceStyles.featureValue} numberOfLines={1} adjustsFontSizeToFit>{data.theme.value}</Text>
          <Text style={resonanceStyles.featureNote}>{data.theme.note}</Text>
          <View style={resonanceStyles.featureFooter}>
            <View style={resonanceStyles.miniAvatarStack}>
              <View style={[resonanceStyles.miniAvatar, { backgroundColor: '#A63F4F' }]} />
              <View style={[resonanceStyles.miniAvatar, resonanceStyles.miniAvatarOverlap, { backgroundColor: '#D697A2' }]} />
              <View style={[resonanceStyles.miniAvatar, resonanceStyles.miniAvatarOverlap, { backgroundColor: '#8FA9B8' }]} />
            </View>
            <Text style={resonanceStyles.footerCopy}>Today's common dream alignment</Text>
          </View>
        </View>
      </View>

      <View style={resonanceStyles.statGrid}>
        {[data.symbol, data.mood].map((item) => (
          <View key={item.label} style={resonanceStyles.statCard}>
            <View style={resonanceStyles.statIconWrap}>
              <Ionicons name={item.icon} size={18} color={C.t2} />
            </View>
            <Text style={resonanceStyles.statLabel}>{item.label}</Text>
            <Text
              style={resonanceStyles.statValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {item.value}
            </Text>
            <Text style={resonanceStyles.statNote}>{item.note}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={resonanceStyles.archiveLinkWrap}
        onPress={() => router.push('/dream-archive' as any)}
        activeOpacity={0.7}
      >
        <Text style={resonanceStyles.archiveText}>
          Explore past dream archives{' '}
          <Text style={resonanceStyles.archiveArrow}>→</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const resonanceStyles = StyleSheet.create({
  container: {
    paddingTop: 34,
    paddingBottom: 10,
    paddingHorizontal: 2,
    backgroundColor: 'transparent',
  },
  headerBlock: {
    marginBottom: 18,
    paddingHorizontal: 2,
  },

  title: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: 'bold',
    fontSize: 30,
    lineHeight: 36,
    color: C.t1,
  },
  subtitle: {
    marginTop: 9,
    maxWidth: 320,
    fontFamily: 'Quicksand_500Medium',
    fontSize: 14,
    lineHeight: 21,
    color: C.t2,
  },
  featureCardWrapper: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  featureCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 22,
    padding: 26,
    minHeight: 214,
  },
  featureGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -54,
    top: -46,
    backgroundColor: 'rgba(166, 63, 79, 0.1)',
  },
  featureTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(166, 63, 79, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    flex: 1,
    fontFamily: QS_BOLD,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(28, 23, 20, 0.54)',
  },
  featureValue: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontSize: 30,
    lineHeight: 36,
    color: C.roseDk,
  },
  featureNote: {
    marginTop: 8,
    fontFamily: 'Quicksand_500Medium',
    fontSize: 14,
    lineHeight: 22,
    color: C.t2,
  },
  featureFooter: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  miniAvatarOverlap: {
    marginLeft: -8,
  },
  footerCopy: {
    fontFamily: QS_BOLD,
    fontSize: 12,
    color: 'rgba(28, 23, 20, 0.52)',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    minHeight: 188,
    padding: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(28, 23, 20, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statLabel: {
    minHeight: 34,
    fontFamily: QS_BOLD,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: 'rgba(28, 23, 20, 0.48)',
  },
  statValue: {
    marginTop: 8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: C.roseDk,
    fontSize: 21,
    lineHeight: 26,
  },
  statNote: {
    marginTop: 8,
    fontFamily: 'Quicksand_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: C.t2,
  },
  graphWrapper: {
    position: 'relative',
    paddingVertical: 8,
  },
  axisLine: {
    position: 'absolute',
    left: '50%',
    top: 22,
    bottom: 22,
    width: 1,
    backgroundColor: 'rgba(125, 45, 58, 0.2)',
    marginLeft: -0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  leftCol: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightCol: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerCol: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(125, 45, 58, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7D2D3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  leftAlignContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  rightAlignContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  guideLineLeft: {
    width: 16,
    height: 1,
    backgroundColor: 'rgba(125, 45, 58, 0.15)',
    marginLeft: 6,
  },
  guideLineRight: {
    width: 16,
    height: 1,
    backgroundColor: 'rgba(125, 45, 58, 0.15)',
    marginRight: 6,
  },
  textRightAligned: {
    textAlign: 'right',
  },
  textLeftAligned: {
    textAlign: 'left',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.5,
    fontFamily: 'Quicksand_500Medium',
    color: 'rgba(28, 23, 20, 0.45)',
  },
  dynamicWord: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: C.roseDk,
    fontSize: 13.5,
  },
  emoji: {
    fontSize: 12,
  },
  archiveLinkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 8,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  archiveText: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 13.5,
    letterSpacing: 0.5,
    color: '#6d6768ff', // Elegant, slightly pale gray-rose tone
  },
  archiveArrow: {
    fontSize: 14.5,
    color: '#7D2D3A', // Our deep Rose tone
    fontWeight: 'bold',
  },
});

// ─ Archive Link (Transparent Editorial) ───────────────────────────

const isSameCalendarDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const isWithinTodayRobust = (createdAt: string | Date) => {
  try {
    if (!createdAt) return false;
    let dateStr = typeof createdAt === 'string' ? createdAt : createdAt.toISOString();

    // If dateStr has no timezone offset, append 'Z' to parse as UTC
    if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
      dateStr = dateStr.replace(' ', 'T') + 'Z';
    }

    const d = new Date(dateStr);
    const now = new Date();

    // 1. Check if calendar days match locally
    if (isSameCalendarDay(d, now)) {
      return true;
    }

    // 2. Fallback: check if difference is less than 20 hours to handle timezone shifts
    const diffMs = Math.abs(now.getTime() - d.getTime());
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 20) {
      return true;
    }
  } catch (e) {
    console.warn('isWithinTodayRobust parsing error:', e);
  }
  return false;
};

// ─ Main Screen ───────────────────────────────────────────────────
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myLatestDream, setMyLatestDream] = useState<DreamResponse | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showSavedOverlay, setShowSavedOverlay] = useState(false);

  useFocusEffect(useCallback(() => {
    checkMyLatestDream();
  }, []));

  useEffect(() => {
    checkMyLatestDream().finally(() => setLoading(false));
    getMyProfile().then(p => setCurrentUserId(p.id)).catch(() => { });
  }, []);

  const checkMyLatestDream = async () => {
    try {
      const profile = await getMyProfile();
      const res = await getUserDreams(profile.id, 0, 1);
      if (res.content.length > 0) {
        const latest = res.content[0];
        const isToday = isWithinTodayRobust(latest.createdAt);
        setMyLatestDream(isToday ? latest : null);
      } else { setMyLatestDream(null); }
    } catch { }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    checkMyLatestDream().finally(() => {
      setRefreshing(false);
    });
  };

  const handleDreamShared = (newDream: DreamResponse) => {
    setShowSavedOverlay(true);
    setMyLatestDream(newDream);
  };

  const hasDreamToday = myLatestDream !== null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.logo}>Dream<Text style={styles.logoEm}>Link</Text></Text>
        <TouchableOpacity style={styles.faqButton} onPress={() => router.push('/help' as any)} activeOpacity={0.7}>
          <HelpCircle size={27} color={C.t1} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={C.rose} /></View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.todayContent}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.rose} colors={[C.rose]} />}>
          <GreetingCard />
          {hasDreamToday ? (
            <>
              <TodaysInsightCard dream={myLatestDream} />
              {/* Scenario A: Collective Resonance after shared dream card */}
              <CollectiveResonance />
            </>
          ) : (
            <View>
              <CreatorCard onDreamShared={handleDreamShared} />
              {/* Scenario B: Collective Resonance after creator card */}
              <CollectiveResonance />
            </View>
          )}
        </ScrollView>
      )}

      <DreamSavedOverlay visible={showSavedOverlay} onFinish={() => setShowSavedOverlay(false)} />
    </View>
  );
}

// ─ Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingVertical: 14, backgroundColor: '#FFFFFF',
  },
  logo: { fontFamily: QS_BOLD, fontSize: 23, color: C.t1, letterSpacing: -0.3 },
  logoEm: { color: C.rose, fontStyle: 'normal' },
  faqButton: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  hdrBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },



  todayContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, gap: 16 },




  // Today's Dream Card Wrapper (inner, no shadow)
  dreamCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  // Today's Dream Card Main View
  dreamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
  },
  dreamCardAccent: {
    height: 3,
  },
  dreamCardInner: {
    padding: 22,
  },
  dreamCardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dreamCardSharedBadge: {
    fontFamily: QS_BOLD,
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(138, 51, 66, 0.55)',
    textTransform: 'lowercase',
  },
  dreamCardDate: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 12,
    color: C.tm,
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  dreamCardDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginVertical: 16,
  },
  dreamCardTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontSize: 19,
    color: C.t1,
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  dreamCardBody: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 15,
    color: C.t2,
    lineHeight: 24,
  },
  dreamCardAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 15,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#eeececff',
    marginBottom: 0,
  },
  dreamCardAiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  dreamCardAiIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dreamCardAiLabel: {
    fontFamily: QS_BOLD,
    fontSize: 13,
    color: '#3E3E3E',
    letterSpacing: 0.1,
  },
  dreamCardAiSub: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Dream Saved Overlay
  savedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  savedCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8A3342',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  savedTitle: {
    fontFamily: QS_BOLD,
    fontSize: 22,
    color: C.t1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  savedSubtitle: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 13,
    color: C.tm,
    textAlign: 'center',
    marginTop: 6,
  },

  // Greeting Card Styles
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4, // 20 (todayContent) + 4 = 24 padding from screen edges
    marginTop: 4,
    marginBottom: 6,
  },
  greetingEyebrow: {
    fontSize: 11,
    letterSpacing: 4,
    color: '#1C1714',
    opacity: 0.8,
    fontFamily: QS_BOLD,
    textTransform: 'uppercase',
  },
  greetingEmoji: {
    fontSize: 16,
    marginLeft: 8,
  },

  // Similar Dreams Banner Styles
  similarDreamsBanner: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(166, 63, 79, 0.1)', // very soft C.rose outline
  },
  similarDreamsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  similarDreamsText: {
    fontFamily: QS_BOLD,
    fontSize: 12,
    color: '#8A3342', // C.roseDk / premium burgundy
    letterSpacing: 0.2,
    flex: 1,
  },
  similarDreamsInnerLoaded: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statEmoji: {
    fontSize: 16,
  },
  statText: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    flex: 1,
  },
  statLabel: {
    fontFamily: QS_BOLD,
    color: '#8A3342',
  },
  statHighlight: {
    fontFamily: QS_BOLD,
    color: C.rose,
  },
  statDivider: {
    height: 1,
    backgroundColor: 'rgba(166, 63, 79, 0.06)',
    marginHorizontal: 2,
  },
  warningBox: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5', // soft red border
    backgroundColor: '#FEF2F2', // soft red bg
    padding: 16,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitleText: {
    fontFamily: QS_BOLD,
    fontSize: 14,
    color: '#991B1B', // deep red
  },
  warningInfoText: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 12.5,
    color: '#7F1D1D', // medium deep red
    lineHeight: 18,
  },
  warningDivider: {
    height: 1,
    backgroundColor: '#FEE2E2',
    marginVertical: 12,
  },
  feedbackContainer: {
    marginTop: 2,
  },
  feedbackToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  feedbackToggleText: {
    fontFamily: QS_BOLD,
    fontSize: 12,
    color: '#8A3342', // C.roseDk
    flex: 1,
  },
  feedbackInputArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    gap: 10,
  },
  feedbackInput: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 13,
    color: '#1C1714',
    minHeight: 60,
    padding: 0,
    textAlignVertical: 'top',
  },
  feedbackActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  feedbackCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  feedbackCancelText: {
    fontFamily: QS_BOLD,
    fontSize: 12.5,
    color: '#64748B',
  },
  feedbackSendBtn: {
    backgroundColor: '#8A3342',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  feedbackSendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  feedbackSendText: {
    fontFamily: QS_BOLD,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  feedbackSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  feedbackSuccessText: {
    fontFamily: QS_BOLD,
    fontSize: 12.5,
    color: '#2E7D32',
  },
  dreamCardAiBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  dreamCardAiLabelDisabled: {
    color: '#9E9E9E',
  },
});
