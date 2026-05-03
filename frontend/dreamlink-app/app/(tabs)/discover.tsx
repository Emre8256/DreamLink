import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Undo2, SlidersHorizontal, MessageCircle, X, Send, MapPin, Ruler, Home, Briefcase, Moon, Cigarette, Wine, Lock } from 'lucide-react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  PanResponder,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EdgeToEdgeLayout } from '../../components/EdgeToEdgeLayout';
import { lightHaptic, mediumHaptic, heavyHaptic } from '../../components/useHaptics';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  getDiscoverFeed,
  getDailyPicks,
  likeDream,
  requestRewind,
  DiscoverCardResponse,
  getPremiumCtaCopy,
} from '../../services/api';
import { router } from 'expo-router';

// ─── Constants & Tokens ───────────────────────────────────────────────────────
const QS_REGULAR = 'Quicksand_400Regular';
const QS_MEDIUM = 'Quicksand_500Medium';
const QS_SEMIBOLD = 'Quicksand_600SemiBold';
const QS_BOLD = 'Quicksand_700Bold';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const COLORS = {
  primary: '#A63F4F',
  roseLt: '#F7E6E8',
  roseMd: '#D697A2',
  roseDk: '#7D2D3A',
  bg: '#FFFFFF',
  sand: '#F8FAFC',
  textMain: '#1C1714',
  textMuted: '#475569',
  textLight: '#94a3b8',
  borderLight: 'rgba(0,0,0,0.04)',
};

const GENDERS = [
  { label: 'Women', value: 'female', icon: 'female-outline' },
  { label: 'Men', value: 'male', icon: 'male-outline' },
  { label: 'Everyone', value: 'all', icon: 'people-outline' },
];

const LOCATION_OPTIONS = [
  { label: 'Nearby', value: 'nearby' },
  { label: 'Citywide', value: 'city' },
  { label: 'Global', value: 'global' },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;
const CARD_WIDTH = SCREEN_WIDTH * 0.94;
const HERO_IMAGE_HEIGHT = (CARD_WIDTH * 4) / 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isLikeLimitError = (error: unknown) => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number }).status;
    return status === 429 || status === 403;
  }
  return error instanceof Error && (error.message.includes('429') || error.message.includes('403'));
};

const isRewindEntitlementError = (error: unknown) => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number }).status;
    return status === 403;
  }
  return error instanceof Error && error.message.includes('403');
};

// ─── Mock Data Extension (English) ───
const MOCK_EXTRA_DATA = {
  hometown: 'Izmir',
  height: '182 cm',
  education: 'Bachelor\'s',
  chronotype: 'Night Owl 🦉',
  smoking: 'Sometimes',
  alcohol: 'Social Drinker',
  languages: ['Turkish', 'English'],
  prompts: [
    { question: "Right before I fall asleep, I think about...", answer: "Where the boundaries of the universe end and what I'm doing here." },
    { question: "The mysterious place I see most in my dreams...", answer: "An old, wooden library where the stairs constantly change." }
  ]
};

// ─── Card Body ───────────────────────────────────────────────────────────────
type DeckCardBodyProps = {
  item: DiscoverCardResponse;
  onLike?: () => void;
  onNope?: () => void;
  onSuperLike?: () => void;
  cardHeight?: number;
  openWhisper: (type: 'bio' | 'prompt' | 'photo', content: string, title?: string) => void;
};

const DeckCardBody = ({ item, onLike, onNope, onSuperLike, cardHeight, openWhisper }: DeckCardBodyProps) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [fabActive, setFabActive] = useState(false);

  const fabOpacity = scrollY.interpolate({
    inputRange: [250, 350],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const fabScale = scrollY.interpolate({
    inputRange: [250, 350],
    outputRange: [0.8, 1],
    extrapolate: 'clamp',
  });

  const photos = (item as any).photos?.length > 0
    ? (item as any).photos.slice(0, 4)
    : [
        'https://i.pinimg.com/236x/2f/47/5d/2f475d794db006ffb24488e1fd1f81cf.jpg',
        'https://i.pinimg.com/236x/f1/bb/ac/f1bbac07a5e6959d7717fdc2b8fa4f92.jpg',
        'https://i.pinimg.com/236x/54/e0/95/54e095f8b951eca7270bc941788712cf.jpg',
        'https://i.pinimg.com/236x/dc/2a/85/dc2a85b0fc5373e45e8a16dc3e9572d2.jpg',
      ].slice(0, 4);

  const name = item.matchedUserNickname || 'Elara';
  const age = (item as any).age ?? 26;
  const location = (item as any).location ?? 'Istanbul';
  const bio = (item as any).bio ?? 'Exploring the boundary between reality and imagination. I cannot go a day without architecture, film, and espresso.';
  const dreamTitle = item.matchedDreamTitle || 'The Floating City';
  const dreamDesc = item.matchedDreamDescription || 'We both navigated a labyrinthine city suspended above a sea of clouds. The architecture kept shifting with every turn...';
  const interests = (item as any).interests ?? ['Lucid Dreaming', 'Architecture', 'Film Photography', 'Surrealism', 'Espresso'];
  const matchPercent = (item as any).matchPercent ?? 87;
  const isOnline = (item as any).isOnline ?? true;

  // ── Modern Whisper Button Component ──
  const WhisperButton = ({ onPress, overlay }: { onPress: () => void, overlay?: boolean }) => {
    if (overlay) {
      // Photo overlay button (White & Sleek)
      return (
        <TouchableOpacity style={styles.whisperBtnOverlay} onPress={onPress} activeOpacity={0.9}>
          <MessageCircle size={15} color="#1C1714" strokeWidth={2.5} />
        </TouchableOpacity>
      );
    }
    // Flat text button for Bio & Prompts (Black & Borderless)
    return (
      <TouchableOpacity style={styles.whisperBtnFlat} onPress={onPress} activeOpacity={0.6}>
        <MessageCircle size={15} color="#1C1714" strokeWidth={2.5} />
        <Text style={styles.whisperBtnTextFlat}>Whisper</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.cardContent}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true, listener: (event: any) => setFabActive(event.nativeEvent.contentOffset.y >= 250) }
        )}
      >
        {/* ── 1. HERO FOTOĞRAF (Index 0) ── */}
        <View style={[styles.heroWrap, cardHeight ? { height: cardHeight } : undefined]}>
          <Image source={{ uri: photos[0] }} style={styles.heroImage} />
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.82)']} locations={[0.35, 0.6, 1]} style={styles.heroGradient} />

          <TouchableOpacity style={styles.superLikeBtn} onPress={onSuperLike} activeOpacity={0.85}>
            <Star size={20} color={COLORS.primary} fill={COLORS.primary} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.heroBottom}>
            <View style={styles.heroIdentity}>
              <Text style={styles.heroName} numberOfLines={1}>{name}, {age}</Text>
              <View style={styles.heroMeta}>
                <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.72)" />
                <Text style={styles.heroLocation}>{location}</Text>
                {isOnline && <><View style={styles.onlineDot} /><Text style={styles.onlineText}>Online</Text></>}
              </View>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroNopeBtn} onPress={onNope} activeOpacity={0.8}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroLikeBtn} onPress={onLike} activeOpacity={0.8}>
                <Ionicons name="heart" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.innerContentPad}>

          {/* ── BASICS KARTI ── */}
          <View style={styles.bumbleCard}>
            <Text style={styles.bumbleCardTitle}>Basics</Text>
            <View style={styles.basicPillsWrap}>
              <View style={styles.basicPill}><Ruler size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.height}</Text></View>
              <View style={styles.basicPill}><Home size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.hometown}</Text></View>
              <View style={styles.basicPill}><Briefcase size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.education}</Text></View>
            </View>
          </View>

          {/* ── ŞIK VE UYUMLU PREMIUM ORTAK RÜYA KARTI ── */}
          <View style={styles.dreamCardPremium}>
            
            <View style={styles.dreamHeaderRow}>
              <View style={styles.dreamHeaderLeft}>
                <Moon size={16} color="#1C1714" strokeWidth={2.5} />
                <Text style={styles.dreamTagPremium}>SHARED DREAM</Text>
              </View>
              <View style={styles.dreamMatchBadgePremium}>
                <Text style={styles.dreamMatchBadgeTextPremium}>{matchPercent}% MATCH</Text>
              </View>
            </View>

            <Text style={styles.dreamTitlePremium}>{dreamTitle}</Text>
            <Text style={styles.dreamDescPremium} numberOfLines={2}>{dreamDesc}</Text>

            <View style={styles.dreamDividerPremium} />
            
            {/* ── Premium Analiz Butonu (Match Oranı Kutusu ile Aynı Renk) ── */}
            <TouchableOpacity 
              style={styles.premiumAnalysisBtn} 
              activeOpacity={0.7}
              onPress={() => router.push('/premium-upsell')}
            >
              <View style={styles.premiumBtnLeft}>
                <Lock size={15} color="#1C1714" strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={styles.premiumBtnText}>Why did we match?</Text>
              </View>
              <Text style={styles.premiumBtnAction}>View Analysis</Text>
            </TouchableOpacity>

          </View>

          {/* ── BIO (ABOUT ME) ── */}
          <View style={styles.bumbleCard}>
            <Text style={styles.bumbleCardTitle}>About me</Text>
            <Text style={styles.bioText}>{bio}</Text>
            <View style={styles.whisperAlignRight}>
              <WhisperButton onPress={() => openWhisper('bio', bio)} />
            </View>
          </View>

          {/* ── EKSTRA FOTOĞRAF 1 (Index 1) ── */}
          {photos[1] && (
            <View style={styles.extraPhotoContainer}>
              <Image source={{ uri: photos[1] }} style={styles.extraPhoto} />
              <WhisperButton overlay onPress={() => openWhisper('photo', photos[1])} />
            </View>
          )}

          {/* ── PROMPT 1 ── */}
          <View style={styles.promptCard}>
            <Text style={styles.promptQuestion}>{MOCK_EXTRA_DATA.prompts[0].question}</Text>
            <View style={styles.promptDivider} />
            <Text style={styles.promptAnswer}>{MOCK_EXTRA_DATA.prompts[0].answer}</Text>
            <View style={styles.whisperAlignRight}>
              <WhisperButton onPress={() => openWhisper('prompt', MOCK_EXTRA_DATA.prompts[0].answer, MOCK_EXTRA_DATA.prompts[0].question)} />
            </View>
          </View>

          {/* ── EKSTRA FOTOĞRAF 2 (Index 2) ── */}
          {photos[2] && (
            <View style={styles.extraPhotoContainer}>
              <Image source={{ uri: photos[2] }} style={styles.extraPhoto} />
              <WhisperButton overlay onPress={() => openWhisper('photo', photos[2])} />
            </View>
          )}

          {/* ── LIFESTYLE ── */}
          <View style={styles.bumbleCard}>
            <Text style={styles.bumbleCardTitle}>Lifestyle</Text>
            <View style={styles.basicPillsWrap}>
              <View style={styles.basicPill}><Moon size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.chronotype}</Text></View>
              <View style={styles.basicPill}><Cigarette size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.smoking}</Text></View>
              <View style={styles.basicPill}><Wine size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.alcohol}</Text></View>
            </View>
          </View>

          {/* ── PROMPT 2 ── */}
          <View style={styles.promptCard}>
            <Text style={styles.promptQuestion}>{MOCK_EXTRA_DATA.prompts[1].question}</Text>
            <View style={styles.promptDivider} />
            <Text style={styles.promptAnswer}>{MOCK_EXTRA_DATA.prompts[1].answer}</Text>
            <View style={styles.whisperAlignRight}>
              <WhisperButton onPress={() => openWhisper('prompt', MOCK_EXTRA_DATA.prompts[1].answer, MOCK_EXTRA_DATA.prompts[1].question)} />
            </View>
          </View>

          {/* ── EKSTRA FOTOĞRAF 3 (Index 3) ── */}
          {photos[3] && (
            <View style={styles.extraPhotoContainer}>
              <Image source={{ uri: photos[3] }} style={styles.extraPhoto} />
              <WhisperButton overlay onPress={() => openWhisper('photo', photos[3])} />
            </View>
          )}

          {/* ── LANGUAGES & INTERESTS ── */}
          <View style={styles.bumbleCard}>
            <Text style={styles.bumbleCardTitle}>Languages</Text>
            <View style={styles.tagsWrap}>
              {MOCK_EXTRA_DATA.languages.map(l => <View key={l} style={styles.tagPill}><Text style={styles.tagPillTxt}>{l}</Text></View>)}
            </View>
          </View>

          <View style={styles.bumbleCard}>
            <Text style={styles.bumbleCardTitle}>Interests</Text>
            <View style={styles.tagsWrap}>
              {interests.map((i: string) => <View key={i} style={styles.tagPill}><Text style={styles.tagPillTxt}>{i}</Text></View>)}
            </View>
          </View>

          {/* ── BLOCK & REPORT ── */}
          <View style={styles.blockReportRow}>
            <TouchableOpacity style={styles.blockReportBtn} activeOpacity={0.7}>
              <Ionicons name="ban-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.blockReportText}>Block</Text>
            </TouchableOpacity>
            <View style={styles.blockReportDivider} />
            <TouchableOpacity style={[styles.blockReportBtn, styles.blockReportBtnRed]} activeOpacity={0.7}>
              <Ionicons name="flag-outline" size={14} color="#ef4444" />
              <Text style={[styles.blockReportText, styles.blockReportTextRed]}>Report</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </Animated.ScrollView>

      {/* ── Floating Super Like FAB ── */}
      <Animated.View
        style={[styles.fab, { opacity: fabOpacity, transform: [{ scale: fabScale }] }]}
        pointerEvents={fabActive ? 'box-none' : 'none'}
      >
        <TouchableOpacity style={styles.fabBtn} onPress={onSuperLike} activeOpacity={0.85}>
          <Star size={22} color={COLORS.primary} fill={COLORS.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
const HERO_HEIGHT = (CARD_WIDTH * 4) / 3;

const DiscoverCardSkeleton = () => (
  <View style={[styles.cardWrapper, { backgroundColor: '#EDE5E7' }]}>
    <SkeletonBlock width={CARD_WIDTH} height={HERO_HEIGHT} borderRadius={0} />
    <View style={{ padding: 20, gap: 12 }}>
      <SkeletonBlock width={CARD_WIDTH * 0.55} height={22} borderRadius={6} />
      <SkeletonBlock width={CARD_WIDTH * 0.38} height={16} borderRadius={6} />
      <SkeletonBlock width={CARD_WIDTH * 0.88} height={14} borderRadius={6} />
      <SkeletonBlock width={CARD_WIDTH * 0.68} height={14} borderRadius={6} />
    </View>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Whisper Drawer States
  const [whisperOpen, setWhisperOpen] = useState(false);
  const [whisperText, setWhisperText] = useState('');
  const [whisperTarget, setWhisperTarget] = useState<{ type: 'bio' | 'prompt' | 'photo', title?: string, content: string } | null>(null);
  const whisperCount = 5; 

  const whisperSheetAnim = useRef(new Animated.Value(0)).current;

  const openWhisper = (type: 'bio' | 'prompt' | 'photo', content: string, title?: string) => {
    setWhisperTarget({ type, content, title });
    setWhisperOpen(true);
    Animated.timing(whisperSheetAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const closeWhisper = () => {
    Animated.timing(whisperSheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setWhisperOpen(false);
      setWhisperText('');
      setWhisperTarget(null);
    });
  };

  const sendWhisper = () => {
    if (!whisperText.trim()) return;
    console.log(`Whisper Sent: ${whisperText}`);
    closeWhisper();
  };

  const [filterVisible, setFilterVisible] = useState(false);
  const filterSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const openFilter = () => {
    setFilterVisible(true);
    Animated.spring(filterSlideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 12 }).start();
  };

  const closeFilter = () => {
    Animated.timing(filterSlideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => {
      setFilterVisible(false);
    });
  };

  const [location, setLocation] = useState('nearby');
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 35]);
  const [gender, setGender] = useState('all');
  const [deck, setDeck] = useState<DiscoverCardResponse[]>([]);
  const isPremium = user?.token?.includes('premium') || false;
  const deckRef = useRef<DiscoverCardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyLocked, setDailyLocked] = useState(false);
  const [dailyHasMorePremium, setDailyHasMorePremium] = useState(false);
  const [rewindStack, setRewindStack] = useState<DiscoverCardResponse[]>([]);
  const [deckHeight, setDeckHeight] = useState(0);

  const contentOpacity = useSharedValue(0);
  const skeletonOpacity = useSharedValue(1);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const position = useRef(new Animated.ValueXY()).current;
  const isAnimating = useRef(false);
  const hasTriggeredHapticRef = useRef(false);

  useEffect(() => { deckRef.current = deck; }, [deck]);

  const load = useCallback(async () => {
    try {
      const results = await Promise.allSettled([getDailyPicks(), getDiscoverFeed()]);
      let newDeck: DiscoverCardResponse[] = [];
      let dailyIds = new Set<string>();

      if (results[0].status === 'fulfilled') {
        const daily = results[0].value;
        newDeck = [...daily.picks];
        dailyIds = new Set(daily.picks.map((p: any) => p.matchedDreamId));
        setDailyLocked(daily.locked);
        setDailyHasMorePremium(daily.hasMorePremium);
      }
      if (results[1].status === 'fulfilled') {
        const general = results[1].value.filter((c: any) => !dailyIds.has(c.matchedDreamId));
        newDeck = [...newDeck, ...general];
      }
      setDeck(newDeck);
    } catch (e) {
      console.error('Discover load error:', e);
    } finally {
      setLoading(false);
      contentOpacity.value = withTiming(1, { duration: 350 });
      skeletonOpacity.value = withTiming(0, { duration: 350 }, (finished) => {
        if (finished) runOnJS(setShowSkeleton)(false);
      });
    }
  }, []);

  useEffect(() => { load(); }, [location, ageRange, gender]);

  const handleApplyFilters = () => {
    if (!isPremium) {
      closeFilter();
      router.push({ pathname: '/premium-upsell', params: { reason: 'likeLimit' } });
      return;
    }
    closeFilter();
    load();
  };

  const executeLike = (dreamId: string) =>
    likeDream(dreamId).catch((e) => {
      if (isLikeLimitError(e)) router.push({ pathname: '/premium-upsell', params: { reason: 'likeLimit' } });
    });

  const executeSkip = (item: DiscoverCardResponse) => setRewindStack(prev => [item, ...prev].slice(0, 10));

  const onSwipeComplete = useCallback((direction: 'right' | 'left') => {
    const item = deckRef.current[0];
    if (!item) return;
    direction === 'right' ? executeLike(item.matchedDreamId) : executeSkip(item);
    setDeck(prev => prev.slice(1));
    position.setValue({ x: 0, y: 0 });
    isAnimating.current = false;
  }, []);

  const triggerSwipe = useCallback((direction: 'right' | 'left', duration = SWIPE_OUT_DURATION) => {
    if (isAnimating.current || deckRef.current.length === 0) return;
    isAnimating.current = true;
    if (direction === 'right') {
      heavyHaptic();
    } else {
      lightHaptic();
    }
    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(position, { toValue: { x, y: 0 }, duration, useNativeDriver: false }).start(() => onSwipeComplete(direction));
  }, [onSwipeComplete]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) * 2.5 && Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => {
        if (!isAnimating.current) {
          position.setValue({ x: g.dx, y: 0 });
          const absX = Math.abs(g.dx);
          if (absX >= SWIPE_THRESHOLD * 0.8 && !hasTriggeredHapticRef.current) {
            hasTriggeredHapticRef.current = true;
            mediumHaptic();
          } else if (absX < SWIPE_THRESHOLD * 0.6) {
            hasTriggeredHapticRef.current = false;
          }
        }
      },
      onPanResponderRelease: (_, g) => {
        hasTriggeredHapticRef.current = false;
        if (isAnimating.current) return;
        if (g.dx > SWIPE_THRESHOLD) triggerSwipe('right');
        else if (g.dx < -SWIPE_THRESHOLD) triggerSwipe('left');
        else Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
      },
    })
  ).current;

  const handleRewind = async () => {
    if (rewindStack.length === 0 || isAnimating.current) return;
    try {
      await requestRewind();
      const [last, ...rest] = rewindStack;
      setRewindStack(rest);
      setDeck(prev => [last, ...prev]);
    } catch (e) {
      if (isRewindEntitlementError(e)) {
        router.push({ pathname: '/premium-upsell', params: { reason: 'rewind' } });
        return;
      }
      Alert.alert('Error', 'Rewind is not available.');
    }
  };

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const backCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  const topCardStyle = {
    transform: [
      ...position.getTranslateTransform(),
      { rotate },
      { perspective: 1000 },
      {
        scale: position.x.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [0.97, 1, 0.97],
          extrapolate: 'clamp',
        }),
      },
    ],
    zIndex: 20,
  };

  const renderEmptyState = () => {
    if (dailyHasMorePremium && dailyLocked && deck.length === 0) {
      return (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="lock-closed" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>More Matches</Text>
          <Text style={styles.emptySub}>Unlock additional profiles with Premium.</Text>
          <TouchableOpacity style={styles.premiumCta} onPress={() => router.push({ pathname: '/premium-upsell', params: { reason: 'dailyPicks' } })}>
            <Text style={styles.premiumCtaText}>{getPremiumCtaCopy('dailyPicks').ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="telescope-outline" size={36} color={COLORS.textLight} />
        </View>
        <Text style={styles.emptyTitle}>That's all for now</Text>
        <Text style={styles.emptySub}>Share new dreams, discover new connections.</Text>
      </View>
    );
  };

  const renderCards = () => {
    if (deck.length === 0) return renderEmptyState();
    return deck.map((item, index) => {
      if (index > 1) return null;
      const isTop = index === 0;
      const cardBody = (
        <DeckCardBody
          item={item}
          onLike={() => triggerSwipe('right')}
          onNope={() => triggerSwipe('left')}
          onSuperLike={() => { /* superlike logic */ }}
          cardHeight={deckHeight > 0 ? deckHeight * 0.98 : SCREEN_HEIGHT * 0.72} 
          openWhisper={openWhisper}
        />
      );

      if (isTop) {
        return (
          <Animated.View
            key={`deck-${item.matchedDreamId}`}
            style={[styles.cardWrapper, topCardStyle]}
            {...panResponder.panHandlers}
          >
            {cardBody}
            <Animated.View style={[styles.swipeBadge, styles.nopeWrapper, { opacity: nopeOpacity }]}>
              <Text style={styles.nopeBadgeText}>NOPE</Text>
            </Animated.View>
            <Animated.View style={[styles.swipeBadge, styles.likeWrapper, { opacity: likeOpacity }]}>
              <Text style={styles.likeBadgeText}>LIKE</Text>
            </Animated.View>
          </Animated.View>
        );
      }

      return (
        <Animated.View
          key={`deck-${item.matchedDreamId}`}
          style={[styles.cardWrapper, { zIndex: 10, transform: [{ scale: backCardScale }] }]}
        >
          {cardBody}
        </Animated.View>
      );
    }).reverse();
  };

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const skeletonAnimStyle = useAnimatedStyle(() => ({
    opacity: skeletonOpacity.value,
  }));

  return (
    <EdgeToEdgeLayout backgroundColor={COLORS.bg} statusBarStyle="dark-content" statusBarBg={COLORS.bg}>
      <View style={styles.root}>
        <View style={{ backgroundColor: COLORS.bg }}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Discover</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleRewind} disabled={rewindStack.length === 0} style={[styles.headerIconBtn, { opacity: rewindStack.length === 0 ? 0.3 : 1 }]}>
                <Undo2 size={24} color={COLORS.textMuted} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity onPress={openFilter} style={styles.headerIconBtn} activeOpacity={0.8}>
                <SlidersHorizontal size={24} color={COLORS.textMuted} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.deckArea} onLayout={(e) => setDeckHeight(e.nativeEvent.layout.height)}>
          <ReanimatedAnimated.View style={[{ flex: 1, width: '100%' }, contentAnimStyle]}>
            {renderCards()}
          </ReanimatedAnimated.View>
          {showSkeleton && (
            <ReanimatedAnimated.View style={[StyleSheet.absoluteFill, { alignItems: 'center' }, skeletonAnimStyle]}>
              <DiscoverCardSkeleton />
            </ReanimatedAnimated.View>
          )}
        </View>

        {/* ── Filter Modal ── */}
        <Modal visible={filterVisible} animationType="none" transparent onRequestClose={closeFilter}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(26,22,20,0.4)', opacity: filterSlideAnim.interpolate({ inputRange: [0, SCREEN_HEIGHT], outputRange: [1, 0], extrapolate: 'clamp' }) }]}>
            <Pressable style={{ flex: 1 }} onPress={closeFilter} />
          </Animated.View>

          <Animated.View style={[styles.filterSheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: filterSlideAnim }] }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.filterTitle}>Filter</Text>

            <Text style={styles.filterLabel}>Location</Text>
            <View style={styles.pillRow}>
              {LOCATION_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.value} style={[styles.pill, location === opt.value && styles.pillActive]} onPress={() => setLocation(opt.value)} activeOpacity={0.8}>
                  <Text style={[styles.pillText, location === opt.value && styles.pillTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Age Range</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderValue}>{ageRange[0]}</Text>
              <Slider style={{ flex: 1, marginHorizontal: 10 }} minimumValue={18} maximumValue={65} step={1} value={ageRange[0]} minimumTrackTintColor={COLORS.primary} maximumTrackTintColor="#e5e7eb" thumbTintColor={COLORS.primary} onValueChange={(v: number) => setAgeRange([v, Math.max(v, ageRange[1])])} />
              <Text style={styles.sliderValue}>{ageRange[1]}</Text>
              <Slider style={{ flex: 1, marginHorizontal: 10 }} minimumValue={18} maximumValue={65} step={1} value={ageRange[1]} minimumTrackTintColor={COLORS.primary} maximumTrackTintColor="#e5e7eb" thumbTintColor={COLORS.primary} onValueChange={(v: number) => setAgeRange([Math.min(v, ageRange[0]), v])} />
            </View>

            <Text style={styles.filterLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(opt => (
                <TouchableOpacity key={opt.value} style={[styles.genderBox, gender === opt.value && styles.genderBoxActive]} onPress={() => setGender(opt.value)} activeOpacity={0.8}>
                  <Ionicons name={opt.icon as any} size={20} color={gender === opt.value ? '#fff' : COLORS.primary} />
                  <Text style={[styles.genderText, gender === opt.value && { color: '#fff' }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilters} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </Animated.View>
        </Modal>

        {/* ── WHISPER DRAWER MODALI (Black & White Theme) ── */}
        <Modal visible={whisperOpen} transparent animationType="none" onRequestClose={closeWhisper}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot}>
            <Pressable style={{ flex: 1 }} onPress={closeWhisper} />

            <Animated.View style={[ styles.whisperSheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: whisperSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] } ]}>
              <View style={styles.sheetHeader}>
                <View style={styles.whisperCountBadge}>
                   <MessageCircle size={14} color="#1C1714" strokeWidth={3} />
                   <Text style={styles.whisperCountTxt}>{whisperCount} Left</Text>
                </View>
                <TouchableOpacity onPress={closeWhisper} style={styles.closeBtn}><X size={20} color={COLORS.textMain} /></TouchableOpacity>
              </View>

              <View style={styles.pinnedContent}>
                {whisperTarget?.type === 'photo' ? (
                   <Image source={{ uri: whisperTarget.content }} style={styles.pinnedImg} />
                ) : (
                   <View style={styles.pinnedTextWrap}>
                      {whisperTarget?.title && <Text style={styles.pinnedTitle}>{whisperTarget.title}</Text>}
                      <Text style={styles.pinnedText} numberOfLines={3}>"{whisperTarget?.content}"</Text>
                   </View>
                )}
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.whisperInput}
                  autoFocus
                  multiline
                  maxLength={120}
                  placeholder="Whisper about this..."
                  placeholderTextColor={COLORS.textLight}
                  value={whisperText}
                  onChangeText={setWhisperText}
                />
                <View style={styles.inputFooter}>
                  <Text style={[styles.charCount, whisperText.length === 120 && { color: '#ef4444' }]}>
                    {whisperText.length}/120
                  </Text>
                  <TouchableOpacity
                    style={[styles.sendBtn, !whisperText.trim() && styles.sendBtnDisabled]}
                    onPress={sendWhisper}
                    disabled={!whisperText.trim()}
                  >
                    <Text style={styles.sendBtnTxt}>Send</Text>
                    <Send size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>

      </View>
    </EdgeToEdgeLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // ── Header ──
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 14, backgroundColor: COLORS.bg },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: QS_BOLD, fontSize: 23, fontWeight: '700', color: COLORS.textMain, letterSpacing: -0.3 },

  // ── Deck ──
  deckArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrapper: { position: 'absolute', width: CARD_WIDTH, height: '98%', borderRadius: 24, shadowColor: '#1e293b', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, alignSelf: 'center' },

  cardContent: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 24, overflow: 'hidden' },
  scrollContent: { paddingBottom: 8 },

  // ── Floating Super Like FAB ──
  fab: { position: 'absolute', bottom: 20, right: 20, zIndex: 100 },
  fabBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 12, borderWidth: 1.5, borderColor: 'rgba(166,63,79,0.20)' },

  // ── Hero (Ana Resim) ──
  heroWrap: { 
  width: '100%', 
  height: HERO_IMAGE_HEIGHT, // Artık hem dikey hem 3/4 oranında sabit
  position: 'relative', 
  overflow: 'hidden',
  borderTopLeftRadius: 24, // Kartın üst köşelerine uyum sağlaması için
  borderTopRightRadius: 24,
},
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  superLikeBtn: { position: 'absolute', top: 16, right: 16, width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: 'rgba(166,63,79,0.15)' },
  heroBottom: { position: 'absolute', bottom: 18, left: 0, right: 0, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  heroIdentity: { flex: 1, marginRight: 10 },
  heroName: { fontFamily: SERIF, fontSize: 24, fontWeight: '700', fontStyle: 'italic', color: '#fff', letterSpacing: -0.2, marginBottom: 4 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocation: { fontFamily: QS_MEDIUM, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginLeft: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginLeft: 6 },
  onlineText: { fontFamily: QS_MEDIUM, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroActions: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  heroNopeBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  heroLikeBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },

  innerContentPad: { paddingHorizontal: 14, paddingTop: 18 },

  // ── İçerik Kartları & Kategorizasyon ──
  basicPillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  basicPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 },
  basicPillTxt: { fontFamily: QS_MEDIUM, fontSize: 13, color: '#000000' },

  bumbleCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  bumbleCardTitle: { fontFamily: QS_BOLD, fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 10 },
  bioText: { fontFamily: QS_REGULAR, fontSize: 15, color: '#111111', lineHeight: 24 },

  // ── Prompt Kartı ──
  promptCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  promptQuestion: { fontFamily: QS_SEMIBOLD, fontSize: 15, fontWeight: '600', color: COLORS.textMain, marginBottom: 10, lineHeight: 22 },
  promptDivider: { height: 1.6, backgroundColor: COLORS.borderLight, marginHorizontal: 4, marginBottom: 10 },
  promptAnswer: { fontFamily: QS_MEDIUM, fontSize: 15, color: COLORS.textMain, lineHeight: 22, marginBottom: 4 },

  // ── Ekstra Fotoğraf Konteyneri ──
  extraPhotoContainer: { 
    width: '100%', 
    borderRadius: 20, 
    overflow: 'hidden', 
    backgroundColor: COLORS.bg, 
    borderWidth: 0.5,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
    position: 'relative',
    // Match uygulaması standardı için aspectRatio ekliyoruz
    aspectRatio: 3 / 4, // Daha uzun istersen 9 / 16 yapabilirsin
  },
  
  extraPhoto: { 
    width: '100%', 
    height: '100%', // Konteynerin dikey uzunluğuna tam oturması için
    resizeMode: 'cover' 
  },
  

  // ── Etiketler ──
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagPillTxt: { fontFamily: QS_MEDIUM, fontSize: 13, color: '#000000' },

  // ── Whisper Button Styles (Black & White) ──
  whisperAlignRight: { alignSelf: 'flex-end', marginTop: 4 },
  whisperBtnFlat: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  whisperBtnTextFlat: { fontFamily: QS_BOLD, fontSize: 13, fontWeight: '800', color: '#1C1714' },
  
  whisperBtnOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },

  // ── Ortak Rüya Kartı ──
 // ── Aydınlık & Uyumlu Premium Ortak Rüya Kartı ──
 dreamCardPremium: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  dreamHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dreamHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  dreamTagPremium: { fontFamily: QS_BOLD, fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 1.5, marginLeft: 8 },
  // Oran Rozeti
  dreamMatchBadgePremium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  dreamMatchBadgeTextPremium: { fontFamily: QS_BOLD, fontSize: 11, fontWeight: '800', color: '#1C1714', letterSpacing: 0.5 },
  
  // Yazılar
  dreamTitlePremium: { fontFamily: QS_MEDIUM, fontSize: 22, color: '#1C1714', letterSpacing: -0.2, marginBottom: 8 },
  dreamDescPremium: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#475569', lineHeight: 22 },
  dreamDividerPremium: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  
  // Premium Analiz Butonu (Match Oranı ile Aynı Arkaplan)
  premiumAnalysisBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  premiumBtnLeft: { flexDirection: 'row', alignItems: 'center' },
  premiumBtnText: { fontFamily: QS_BOLD, fontSize: 13, fontWeight: '800', color: '#1C1714' },
  premiumBtnAction: { fontFamily: QS_BOLD, fontSize: 11, fontWeight: '800', color: '#111111', textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Block / Report ──
  blockReportRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, marginBottom: 4 },
  blockReportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  blockReportBtnRed: { backgroundColor: '#fff5f5', borderColor: 'rgba(239,68,68,0.1)' },
  blockReportDivider: { width: 10 },
  blockReportText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  blockReportTextRed: { color: '#ef4444' },

  // ── Whisper Modal (Drawer - Black & White Theme) ──
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  whisperSheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  whisperCountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  whisperCountTxt: { fontFamily: QS_BOLD, fontSize: 13, fontWeight: '800', color: '#1C1714' },
  closeBtn: { padding: 6, backgroundColor: COLORS.sand, borderRadius: 20 },

  pinnedContent: { flexDirection: 'row', backgroundColor: COLORS.sand, padding: 12, borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.borderLight, marginBottom: 16 },
  pinnedImg: { width: 50, height: 50, borderRadius: 8, resizeMode: 'cover' },
  pinnedTextWrap: { flex: 1, borderLeftWidth: 3, borderLeftColor: '#1C1714', paddingLeft: 12 },
  pinnedTitle: { fontFamily: QS_BOLD, fontSize: 10, color: '#1C1714', textTransform: 'uppercase', marginBottom: 4 },
  pinnedText: { fontFamily: QS_MEDIUM, fontSize: 14, color: COLORS.textMuted },

  inputWrapper: { backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: '#e2e8f0', borderRadius: 20, padding: 14 },
  whisperInput: { fontFamily: QS_MEDIUM, fontSize: 16, color: COLORS.textMain, minHeight: 60, textAlignVertical: 'top' },
  inputFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 },
  charCount: { fontFamily: QS_BOLD, fontSize: 11, color: COLORS.textLight },
  sendBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1714', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, gap: 6 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnTxt: { fontFamily: QS_BOLD, fontSize: 14, fontWeight: '800', color: '#FFF' },

  // ── Swipe Badges ──
  swipeBadge: { position: 'absolute', top: 36, borderWidth: 3, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, zIndex: 10 },
  nopeWrapper: { right: 24, borderColor: '#94a3b8', transform: [{ rotate: '12deg' }] },
  likeWrapper: { left: 24, borderColor: '#4ade80', transform: [{ rotate: '-12deg' }] },
  nopeBadgeText: { fontSize: 22, fontWeight: '900', letterSpacing: 1, color: '#94a3b8' },
  likeBadgeText: { fontSize: 22, fontWeight: '900', letterSpacing: 1, color: '#4ade80' },

  // ── Empty State ──
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.roseLt, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: COLORS.textMain, marginBottom: 6 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 21 },
  premiumCta: { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  premiumCtaText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // ── Filter Modal ──
  filterSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, zIndex: 2, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 10 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginBottom: 16 },
  filterTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textMain, marginBottom: 16, textAlign: 'center' },
  filterLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 14, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  pillActive: { backgroundColor: COLORS.primary },
  pillText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  pillTextActive: { color: '#fff' },
  sliderRow: { flexDirection: 'row', alignItems: 'center' },
  sliderValue: { width: 30, textAlign: 'center', color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  genderRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  genderBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f1f5f9' },
  genderBoxActive: { backgroundColor: COLORS.primary },
  genderText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  applyBtn: { marginTop: 20, backgroundColor: COLORS.primary, borderRadius: 20, paddingVertical: 15, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
});