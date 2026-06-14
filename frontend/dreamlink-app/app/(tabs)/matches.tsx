import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Undo2, SlidersHorizontal, MessageCircle, X, Send, MapPin, Ruler, Home, Briefcase, Moon, Cigarette, Wine, Link2, ChevronRight, Heart, Languages } from 'lucide-react-native';
import DropShadow from 'react-native-drop-shadow';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
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
import {
  getDiscoverFeed,
  getDailyPicks,
  likeDream,
  requestRewind,
  DiscoverCardResponse,
  getPremiumCtaCopy,
} from '../../services/api';
import { router } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';

// Constants & Tokens
const QS_REGULAR = 'Quicksand_400Regular';
const QS_MEDIUM = 'Quicksand_500Medium';
const QS_SEMIBOLD = 'Quicksand_600SemiBold';
const QS_BOLD = 'Quicksand_700Bold';
const SERIF = 'Quicksand_700Bold';

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

// Helpers
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

// Mock Data Extension (English)
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

const getInterestEmoji = (interest: string): string => {
  const normalized = interest.toLowerCase();
  if (normalized.includes('dream') || normalized.includes('rüya')) return '✨';
  if (normalized.includes('architecture') || normalized.includes('mimari')) return '🏛️';
  if (normalized.includes('photography') || normalized.includes('photo') || normalized.includes('fotoğraf')) return '📷';
  if (normalized.includes('surrealism') || normalized.includes('sürrealizm')) return '🎨';
  if (normalized.includes('espresso') || normalized.includes('coffee') || normalized.includes('kahve')) return '☕';
  if (normalized.includes('music') || normalized.includes('müzik')) return '🎵';
  if (normalized.includes('travel') || normalized.includes('seyahat')) return '✈️';
  if (normalized.includes('book') || normalized.includes('reading') || normalized.includes('kitap')) return '📚';
  if (normalized.includes('movie') || normalized.includes('cinema') || normalized.includes('film') || normalized.includes('sinema')) return '🎬';
  if (normalized.includes('yoga') || normalized.includes('meditation') || normalized.includes('meditasyon')) return '🧘‍♀️';
  if (normalized.includes('nature') || normalized.includes('doğa')) return '🌲';
  if (normalized.includes('cooking') || normalized.includes('food') || normalized.includes('yemek')) return '🍳';
  return '🌟';
};

// Card Body
type DeckCardBodyProps = {
  item: DiscoverCardResponse;
  onLike?: () => void;
  onNope?: () => void;
  onSuperLike?: () => void;
  cardHeight?: number;
  openWhisper: (type: 'bio' | 'prompt' | 'photo', content: string, title?: string) => void;
  onBlockPress?: (item: DiscoverCardResponse) => void;
  onReportPress?: (item: DiscoverCardResponse) => void;
  isPremium: boolean;
};

const DeckCardBody = ({
  item,
  onLike,
  onNope,
  onSuperLike,
  cardHeight,
  openWhisper,
  onBlockPress,
  onReportPress,
  isPremium,
}: DeckCardBodyProps) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isNearBottom, setIsNearBottom] = useState(false);
  const fabOpacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fabOpacityAnim, {
      toValue: isNearBottom ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isNearBottom]);

  const photos = (item as any).photos?.length > 0
    ? (item as any).photos.slice(0, 4)
    : [
      'https://i.pinimg.com/236x/2f/47/5d/2f475d794db006ffb24488e1fd1f81cf.jpg',
      'https://i.pinimg.com/236x/f1/bb/ac/f1bbac07a5e6959d7717fdc2b8fa4f92.jpg',
      'https://i.pinimg.com/236x/54/e0/95/54e095f8b951eca7270bc941788712cf.jpg',
      'https://i.pinimg.com/236x/dc/2a/85/dc2a85b0fc5373e45e8a16dc3e9572d2.jpg',
    ].slice(0, 4);

  const rawName = item.matchedUserNickname || 'Elara';
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const age = (item as any).age ?? 26;
  const location = (item as any).location ?? 'Istanbul';
  const bio = (item as any).bio ?? 'Exploring the boundary between reality and imagination. I cannot go a day without architecture, film, and espresso.';
  const dreamTitle = item.matchedDreamTitle || 'The Floating City';
  const dreamDesc = item.matchedDreamDescription || 'We both navigated a labyrinthine city suspended above a sea of clouds. The architecture kept shifting with every turn...';
  const interests = (item as any).interests ?? ['Lucid Dreaming', 'Architecture', 'Film Photography', 'Surrealism', 'Espresso'];
  const isOnline = (item as any).isOnline ?? true;

  // Your Dream Data
  const myDreamId = (item as any).myDreamId;
  const myDreamTitle = (item as any).myDreamTitle || 'The Mirror Sea';
  const myDreamDesc = (item as any).myDreamDescription || 'I was floating above a vast ocean that reflected a sky full of shifting constellations. The water felt like glass yet warm, and I knew I had been here before in another life...';

  // Modern Whisper Button Component
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

  const MetricRow = ({ label, level, score }: { label: string, level: string, score: number }) => {
    const progressWidth = `${Math.max(0, Math.min(score, 100))}%` as `${number}%`;

    return (
      <View style={styles.metricRow}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={styles.metricLevel}>{level}</Text>
        </View>
        <View style={styles.metricTrack}>
          <View style={[styles.metricFill, { width: progressWidth }]} />
        </View>
      </View>
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
          {
            useNativeDriver: true,
            listener: (event: any) => {
              const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
              const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 310;
              setIsNearBottom(nearBottom);
            }
          }
        )}
      >
        {/* 1. HERO FOTOĞRAF (Index 0) */}
        <View style={[styles.heroWrap, cardHeight ? { height: cardHeight } : undefined]}>
          <Image source={{ uri: photos[0] }} style={styles.heroImage} />
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.82)']} locations={[0.35, 0.6, 1]} style={styles.heroGradient} />

          <View style={styles.heroBottom}>
            <View style={styles.heroIdentity}>
              <Text style={styles.heroName} numberOfLines={1}>{name}, {age}</Text>
              <View style={styles.heroMeta}>
                <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.72)" />
                <Text style={styles.heroLocation}>{location}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.innerContentPad}>

          {/* 1. SHARED DREAM CARD (Rüya Kartı) */}
          <DropShadow style={styles.cardShadow}>
            <View style={styles.dreamCardPremium}>

              {/* Header Row */}
              <View style={styles.dreamHeaderRow}>
                <View style={styles.dreamHeaderLeft}>
                  <Moon size={16} color="#1C1714" strokeWidth={2.5} />
                  <Text style={styles.dreamTagPremium}>SHARED DREAM</Text>
                </View>
              </View>

              {/* Your Dream */}
              <TouchableOpacity
                style={[styles.dreamSide, styles.dreamSideSelf]}
                activeOpacity={0.7}
                onPress={() => {
                  if (myDreamId) {
                    router.push(`/dream/${myDreamId}`);
                  } else {
                    console.log("My dream ID not found");
                  }
                }}
              >
                <View style={styles.dreamSideAccentSelf} />
                <View style={styles.dreamSideInner}>
                  <Text style={styles.dreamSideLabel}>Your Dream</Text>
                  <Text style={styles.dreamSideTitle} numberOfLines={1}>{myDreamTitle}</Text>
                  <Text style={styles.dreamSideDesc} numberOfLines={3}>{myDreamDesc}</Text>
                </View>
                <View style={styles.dreamChevronWrap}>
                  <ChevronRight size={16} color="#CBD5E1" />
                </View>
              </TouchableOpacity>

              {/* Connection Bridge Divider */}
              <View style={styles.connectionBridge}>
                <View style={styles.connectionLine} />
                <View style={styles.connectionIconWrap}>
                  <Link2 size={14} color="#c5c5c5ff" strokeWidth={2.5} />
                </View>
                <View style={styles.connectionLine} />
              </View>

              {/* [Name]'s Dream */}
              <TouchableOpacity
                style={[styles.dreamSide, styles.dreamSideOther]}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.matchedDreamId) {
                    router.push(`/dream/${item.matchedDreamId}`);
                  }
                }}
              >
                <View style={styles.dreamSideAccentOther} />
                <View style={styles.dreamSideInner}>
                  <Text style={styles.dreamSideLabelOther}>{name}'s Dream</Text>
                  <Text style={styles.dreamSideTitle} numberOfLines={1}>{dreamTitle}</Text>
                  <Text style={styles.dreamSideDesc} numberOfLines={3}>{dreamDesc}</Text>
                </View>
                <View style={styles.dreamChevronWrap}>
                  <ChevronRight size={16} color="#CBD5E1" />
                </View>
              </TouchableOpacity>

              {/* Similarity Card */}
              <View style={styles.similarityCard}>
                <View style={styles.similarityHeader}>
                  <View style={styles.similarityTitleGroup}>
                    <Text style={styles.similarityCardTitle}>Similarity Profile</Text>
                    <Text style={styles.similarityCardSub}>We compared your dreams and found that you share similar feelings, symbols, and story patterns.</Text>
                  </View>
                </View>
                <View style={styles.metricsContainer}>
                  <MetricRow label="Emotional tone" level="High" score={92} />
                  <MetricRow label="Symbol themes" level="Medium" score={72} />
                  <MetricRow label="Narrative flow" level="High" score={86} />
                </View>
              </View>


            </View>
          </DropShadow>

          {/* 2. BIO (ABOUT ME) */}
          <DropShadow style={styles.cardShadow}>
            <View style={styles.bumbleCard}>
              <Text style={styles.bumbleCardTitle}>About me</Text>
              <Text style={styles.bioText}>{bio}</Text>
              <View style={styles.whisperAlignRight}>
                <WhisperButton onPress={() => openWhisper('bio', bio)} />
              </View>
            </View>
          </DropShadow>

          {/* 3. BASICS KARTI */}
          <DropShadow style={styles.cardShadow}>
            <View style={styles.bumbleCard}>
              <Text style={styles.bumbleCardTitle}>Basics</Text>
              <View style={styles.basicPillsWrap}>
                <View style={styles.basicPill}><Ruler size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.height}</Text></View>
                <View style={styles.basicPill}><Home size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.hometown}</Text></View>
                <View style={styles.basicPill}><Briefcase size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.education}</Text></View>
              </View>
            </View>
          </DropShadow>

          {/* 4. EKSTRA FOTOĞRAF 1 (2. Resim) */}
          {photos[1] && (
            <View style={styles.extraPhotoContainer}>
              <Image source={{ uri: photos[1] }} style={styles.extraPhoto} />
              <WhisperButton overlay onPress={() => openWhisper('photo', photos[1])} />
            </View>
          )}

          {/* 5. INTERESTS KARTI (with Emojis) */}
          <DropShadow style={styles.cardShadow}>
            <View style={styles.bumbleCard}>
              <Text style={styles.bumbleCardTitle}>Interests</Text>
              <View style={styles.tagsWrap}>
                {interests.map((i: string) => (
                  <View key={i} style={styles.tagPill}>
                    <Text style={styles.tagPillTxt}>{getInterestEmoji(i)} {i}</Text>
                  </View>
                ))}
              </View>
            </View>
          </DropShadow>

          {/* 6. PROMPT 1 (Bir Soru) */}
          <DropShadow style={styles.cardShadow}>
            <View style={styles.promptCard}>
              <Text style={styles.promptQuestion}>{MOCK_EXTRA_DATA.prompts[0].question}</Text>
              <View style={styles.promptDivider} />
              <Text style={styles.promptAnswer}>{MOCK_EXTRA_DATA.prompts[0].answer}</Text>
              <View style={styles.whisperAlignRight}>
                <WhisperButton onPress={() => openWhisper('prompt', MOCK_EXTRA_DATA.prompts[0].answer, MOCK_EXTRA_DATA.prompts[0].question)} />
              </View>
            </View>
          </DropShadow>

          {/* 7. EKSTRA FOTOĞRAF 2 (3. Resim) */}
          {photos[2] && (
            <View style={styles.extraPhotoContainer}>
              <Image source={{ uri: photos[2] }} style={styles.extraPhoto} />
              <WhisperButton overlay onPress={() => openWhisper('photo', photos[2])} />
            </View>
          )}

          {/* 8. LIFESTYLE */}
          <DropShadow style={styles.cardShadow}>
            <View style={styles.bumbleCard}>
              <Text style={styles.bumbleCardTitle}>Lifestyle</Text>
              <View style={styles.basicPillsWrap}>
                <View style={styles.basicPill}><Moon size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.chronotype}</Text></View>
                <View style={styles.basicPill}><Cigarette size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.smoking}</Text></View>
                <View style={styles.basicPill}><Wine size={14} color="#111111" /><Text style={styles.basicPillTxt}>{MOCK_EXTRA_DATA.alcohol}</Text></View>
              </View>
            </View>
          </DropShadow>

          {/* 9. PROMPT 2 */}
          <DropShadow style={styles.cardShadow}>
            <View style={styles.promptCard}>
              <Text style={styles.promptQuestion}>{MOCK_EXTRA_DATA.prompts[1].question}</Text>
              <View style={styles.promptDivider} />
              <Text style={styles.promptAnswer}>{MOCK_EXTRA_DATA.prompts[1].answer}</Text>
              <View style={styles.whisperAlignRight}>
                <WhisperButton onPress={() => openWhisper('prompt', MOCK_EXTRA_DATA.prompts[1].answer, MOCK_EXTRA_DATA.prompts[1].question)} />
              </View>
            </View>
          </DropShadow>

          {/* 10. EKSTRA FOTOĞRAF 3 (4. Resim) */}
          {photos[3] && (
            <View style={styles.extraPhotoContainer}>
              <Image source={{ uri: photos[3] }} style={styles.extraPhoto} />
              <WhisperButton overlay onPress={() => openWhisper('photo', photos[3])} />
            </View>
          )}

          {/* 11. LANGUAGES */}
          <DropShadow style={styles.cardShadow}>
            <View style={styles.bumbleCard}>
              <Text style={styles.bumbleCardTitle}>Languages</Text>
              <View style={styles.tagsWrap}>
                {MOCK_EXTRA_DATA.languages.map(l => (
                  <View key={l} style={[styles.tagPill, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Languages size={14} color="#000000" style={{ marginRight: 6 }} />
                    <Text style={styles.tagPillTxt}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          </DropShadow>

          {/* SAFETY BOTTOM DECISION AREA */}
          <View style={styles.decisionAreaContainer}>
            <View style={styles.decisionLayoutRow}>
              {/* UNLIKE BUTTON */}
              <TouchableOpacity
                style={styles.decisionBtnNope}
                onPress={onNope}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={30} color="#64748b" />
              </TouchableOpacity>

              {/* CENTER SUPER LIKE */}
              <TouchableOpacity
                style={styles.decisionBtnSuper}
                onPress={onSuperLike}
                activeOpacity={0.85}
              >
                <Star size={32} color="#FFF" fill="#FFF" strokeWidth={2} />
              </TouchableOpacity>

              {/* LIKE BUTTON */}
              <TouchableOpacity
                style={styles.decisionBtnLike}
                onPress={onLike}
                activeOpacity={0.85}
              >
                <Ionicons name="heart-outline" size={30} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* SAFETY FOOTER (BLOCK & REPORT) */}
          <View style={styles.safetyFooter}>
            <TouchableOpacity
              style={styles.safetyFooterBtn}
              activeOpacity={0.6}
              onPress={() => onBlockPress?.(item)}
            >
              <Text style={styles.safetyFooterText}>BLOCK {name.toUpperCase()}</Text>
            </TouchableOpacity>
            <View style={styles.safetyFooterDivider} />
            <TouchableOpacity
              style={styles.safetyFooterBtn}
              activeOpacity={0.6}
              onPress={() => onReportPress?.(item)}
            >
              <Text style={[styles.safetyFooterText, styles.safetyFooterTextRed]}>REPORT PROFILE</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </Animated.ScrollView>

      {/* Floating Super Like FAB */}
      <Animated.View
        style={{ position: 'absolute', bottom: 18, right: 18, zIndex: 100, opacity: fabOpacityAnim }}
        pointerEvents={isNearBottom ? 'none' : 'box-none'}
      >
        <TouchableOpacity
          style={styles.heroSuperLikeBtn}
          onPress={onSuperLike}
          activeOpacity={0.85}
        >
          <Star size={22} color="#FFF" fill="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Main Screen
export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Whisper Drawer States
  const [whisperOpen, setWhisperOpen] = useState(false);
  const [whisperText, setWhisperText] = useState('');
  const [whisperTarget, setWhisperTarget] = useState<{ type: 'bio' | 'prompt' | 'photo', title?: string, content: string } | null>(null);
  const whisperCount = 5;

  const whisperSheetAnim = useRef(new Animated.Value(0)).current;

  // Advanced Block / Report Flow States
  const openReportModal = useAppStore(state => state.openReportModal);

  const handleBlockPress = (item: DiscoverCardResponse) => {
    openReportModal({ id: item.matchedUserId, name: item.matchedUserNickname || 'User' }, 'block', handleReportModalSuccess);
  };

  const handleReportPress = (item: DiscoverCardResponse) => {
    openReportModal({ id: item.matchedUserId, name: item.matchedUserNickname || 'User' }, 'report', handleReportModalSuccess);
  };

  const handleReportModalSuccess = (userId: string, action: 'block' | 'report' | 'both') => {
    // Remove the card from the deck immediately
    setDeck(prev => prev.filter(c => c.matchedUserId !== userId));
  };

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

  const openFilter = useAppStore(state => state.openFilterModal);
  const location = useAppStore(state => state.filterModal.location);
  const ageRange = useAppStore(state => state.filterModal.ageRange);
  const gender = useAppStore(state => state.filterModal.gender);

  const [deck, setDeck] = useState<DiscoverCardResponse[]>([]);
  const isPremium = true; //test user?.token?.includes('premium') || false;
  const deckRef = useRef<DiscoverCardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyLocked, setDailyLocked] = useState(false);
  const [dailyHasMorePremium, setDailyHasMorePremium] = useState(false);
  const [rewindStack, setRewindStack] = useState<DiscoverCardResponse[]>([]);
  const [deckHeight, setDeckHeight] = useState(0);

  const cardPositions = useRef<Record<string, Animated.ValueXY>>({}).current;
  const fallbackPosition = useRef(new Animated.ValueXY()).current;

  const getCardPosition = useCallback((id: string) => {
    if (!cardPositions[id]) {
      cardPositions[id] = new Animated.ValueXY();
    }
    return cardPositions[id];
  }, []);

  const isAnimating = useRef(false);

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
    }
  }, []);

  useEffect(() => { load(); }, [location, ageRange, gender]);

  // Filters handle apply through useAppStore and trigger load() automatically
  const executeLike = (dreamId: string) =>
    likeDream(dreamId).catch((e) => {
      if (isLikeLimitError(e)) router.push({ pathname: '/premium-upsell', params: { reason: 'likeLimit' } });
    });

  const executeSkip = (item: DiscoverCardResponse) => setRewindStack(prev => [item, ...prev].slice(0, 10));

  const onSwipeComplete = useCallback((direction: 'right' | 'left') => {
    const item = deckRef.current[0];
    if (!item) return;
    direction === 'right' ? executeLike(item.matchedDreamId) : executeSkip(item);

    // Slice deck
    setDeck(prev => prev.slice(1));

    // Clean up the position of the swiped card
    delete cardPositions[item.matchedDreamId];

    isAnimating.current = false;
  }, []);

  const triggerSwipe = useCallback((direction: 'right' | 'left', duration = SWIPE_OUT_DURATION) => {
    if (isAnimating.current || deckRef.current.length === 0) return;
    isAnimating.current = true;
    const item = deckRef.current[0];
    const cardPos = getCardPosition(item.matchedDreamId);
    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(cardPos, { toValue: { x, y: 0 }, duration, useNativeDriver: true }).start(() => onSwipeComplete(direction));
  }, [onSwipeComplete]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) * 2.5 && Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => {
        if (isAnimating.current) return;
        const item = deckRef.current[0];
        if (item) {
          getCardPosition(item.matchedDreamId).setValue({ x: g.dx, y: 0 });
        }
      },
      onPanResponderRelease: (_, g) => {
        if (isAnimating.current) return;
        const item = deckRef.current[0];
        if (!item) return;

        const cardPos = getCardPosition(item.matchedDreamId);
        if (g.dx > SWIPE_THRESHOLD) {
          triggerSwipe('right');
        } else if (g.dx < -SWIPE_THRESHOLD) {
          triggerSwipe('left');
        } else {
          Animated.spring(cardPos, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: true }).start();
        }
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

  const topCardId = deck[0]?.matchedDreamId;
  const activePosition = topCardId ? getCardPosition(topCardId) : fallbackPosition;

  const rotate = activePosition.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = activePosition.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = activePosition.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const backCardScale = activePosition.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  const topCardStyle = {
    transform: [
      ...activePosition.getTranslateTransform(),
      { rotate },
      { perspective: 1000 },
      {
        scale: activePosition.x.interpolate({
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
        <Text style={styles.emptySub}>Share new dreams, find new matches.</Text>
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
          onBlockPress={handleBlockPress}
          onReportPress={handleReportPress}
          isPremium={isPremium}
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

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={{ paddingTop: insets.top, backgroundColor: COLORS.bg }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matches</Text>
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
        {renderCards()}
      </View>

      {/* Filter Modal is now in app/_layout.tsx */}

      {/* WHISPER DRAWER MODALI (Black & White Theme) */}
      <Modal visible={whisperOpen} transparent animationType="none" onRequestClose={closeWhisper}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot}>
          <Pressable style={{ flex: 1 }} onPress={closeWhisper} />

          <Animated.View style={[styles.whisperSheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: whisperSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] }]}>
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

      {/* ADVANCED REPORT/BLOCK MODAL IS NOW IN APP/_LAYOUT.TSX */}

    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 14, backgroundColor: COLORS.bg },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: QS_BOLD, fontSize: 23, color: COLORS.textMain, letterSpacing: -0.3 },

  // Deck
  deckArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrapper: { position: 'absolute', width: CARD_WIDTH, height: '98%', borderRadius: 24, shadowColor: '#1c171486', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 1, alignSelf: 'center' },

  cardContent: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 24, overflow: 'hidden' },
  scrollContent: { paddingBottom: 8 },

  // Floating Super Like FAB
  fab: { position: 'absolute', bottom: 20, right: 20, zIndex: 100 },
  fabBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 12, borderWidth: 1.5, borderColor: 'rgba(166,63,79,0.20)' },

  // Hero (Ana Resim)
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
  heroSuperLikeBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.8,
    borderColor: 'rgba(166,63,79,0.25)'
  },
  heroBottom: { position: 'absolute', bottom: 18, left: 0, right: 0, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  heroIdentity: { flex: 1, marginRight: 10 },
  heroName: { fontFamily: SERIF, fontSize: 24, fontStyle: 'italic', color: '#fff', letterSpacing: -0.2, marginBottom: 4 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocation: { fontFamily: QS_MEDIUM, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginLeft: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginLeft: 6 },
  onlineText: { fontFamily: QS_MEDIUM, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroActions: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  heroNopeBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  heroLikeBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },

  innerContentPad: { paddingHorizontal: 14, paddingTop: 18 },

  // İçerik Kartları & Kategorizasyon
  basicPillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  basicPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 },
  basicPillTxt: { fontFamily: QS_MEDIUM, fontSize: 13, color: '#000000' },

  bumbleCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 24 },
  bumbleCardTitle: { fontFamily: QS_BOLD, fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 10 },
  bioText: { fontFamily: QS_REGULAR, fontSize: 15, color: '#111111', lineHeight: 24 },

  // Prompt Kartı
  promptCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 20, marginBottom: 24 },
  promptQuestion: { fontFamily: QS_SEMIBOLD, fontSize: 15, fontWeight: '600', color: COLORS.textMain, marginBottom: 10, lineHeight: 22 },
  promptDivider: { height: 1.6, backgroundColor: COLORS.borderLight, marginHorizontal: 4, marginBottom: 10 },
  promptAnswer: { fontFamily: QS_MEDIUM, fontSize: 15, color: COLORS.textMain, lineHeight: 22, marginBottom: 4 },

  // Ekstra Fotoğraf Konteyneri
  extraPhotoContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.bg,
    borderWidth: 0,
    marginBottom: 24,
    position: 'relative',
    // Match uygulaması standardı için aspectRatio ekliyoruz
    aspectRatio: 3 / 4, // Daha uzun istersen 9 / 16 yapabilirsin
  },

  extraPhoto: {
    width: '100%',
    height: '100%', // Konteynerin dikey uzunluğuna tam oturması için
    resizeMode: 'cover'
  },


  // Etiketler
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagPillTxt: { fontFamily: QS_MEDIUM, fontSize: 13, color: '#000000' },

  // Whisper Button Styles (Black & White)
  whisperAlignRight: { alignSelf: 'flex-end', marginTop: 4 },
  whisperBtnFlat: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  whisperBtnTextFlat: { fontFamily: QS_BOLD, fontSize: 13, color: '#1C1714' },

  whisperBtnOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },

  // Shared Dream Card
  dreamCardPremium: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },

  // DropShadow wrapper — shared by all sub-cards
  cardShadow: {
    shadowColor: '#1C1714',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  dreamHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dreamHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  dreamTagPremium: {
    fontFamily: QS_BOLD,
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  dreamMatchBadgePremium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  dreamMatchBadgeTextPremium: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    color: '#1C1714',
    letterSpacing: 0.5,
  },

  // Dream Sides
  dreamSide: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dreamSideSelf: {},
  dreamSideOther: {},
  dreamSideAccentSelf: {
    width: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  dreamSideAccentOther: {
    width: 3,
    backgroundColor: '#94A3B8',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  dreamSideInner: {
    flex: 1,
    padding: 14,
    paddingLeft: 14,
  },
  dreamSideLabel: {
    fontFamily: QS_BOLD,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dreamSideLabelOther: {
    fontFamily: QS_BOLD,
    fontSize: 10,
    color: '#475569',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dreamSideTitle: {
    fontFamily: QS_SEMIBOLD,
    fontSize: 15,
    color: '#1C1714',
    marginBottom: 5,
    letterSpacing: -0.1,
  },
  dreamSideDesc: {
    fontFamily: QS_REGULAR,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  dreamChevronWrap: {
    justifyContent: 'center',
    paddingRight: 12,
  },

  // Connection Bridge Divider
  connectionBridge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  connectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  connectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffffff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },



  // Similarity Card
  similarityCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  similarityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  similarityTitleGroup: {
    flex: 1,
  },
  similarityCardTitle: {
    fontFamily: QS_BOLD,
    fontSize: 10,
    color: '#1C1714',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  similarityCardSub: {
    fontFamily: QS_MEDIUM,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },


  // Match Metrics
  metricsContainer: {
    gap: 12,
  },
  metricRow: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricLabel: {
    fontFamily: QS_SEMIBOLD,
    fontSize: 12,
    color: '#1C1714',
    letterSpacing: 0.1,
    flex: 1,
  },
  metricLevel: {
    fontFamily: QS_BOLD,
    fontSize: 10,
    color: '#64748B',
    textAlign: 'right',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },

  // Block / Report (Safety Footer)
  safetyFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, marginBottom: 15, paddingVertical: 8 },
  safetyFooterBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  safetyFooterText: { fontFamily: QS_BOLD, fontSize: 10.5, color: '#94A3B8', letterSpacing: 1.6 },
  safetyFooterTextRed: { color: '#E07A7A' },
  safetyFooterDivider: { width: 1, height: 12, backgroundColor: '#E2E8F0' },

  // Decision Area at Bottom
  decisionAreaContainer: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  decisionLayoutRow: {
    width: 260,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  decisionBtnSuper: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2.5,
    borderColor: 'rgba(166,63,79,0.25)',
  },
  decisionBtnNope: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  decisionBtnLike: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  // Whisper Modal (Drawer - Black & White Theme)
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  analysisModalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whisperSheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  whisperCountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  whisperCountTxt: { fontFamily: QS_BOLD, fontSize: 13, color: '#1C1714' },
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
  sendBtnTxt: { fontFamily: QS_BOLD, fontSize: 14, color: '#FFF' },

  // Swipe Badges
  swipeBadge: { position: 'absolute', top: 36, borderWidth: 3, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, zIndex: 10 },
  nopeWrapper: { right: 24, borderColor: '#94a3b8', transform: [{ rotate: '12deg' }] },
  likeWrapper: { left: 24, borderColor: '#4ade80', transform: [{ rotate: '-12deg' }] },
  nopeBadgeText: { fontSize: 22, fontWeight: '900', letterSpacing: 1, color: '#94a3b8' },
  likeBadgeText: { fontSize: 22, fontWeight: '900', letterSpacing: 1, color: '#4ade80' },

  // Empty State
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.roseLt, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: QS_BOLD, fontSize: 19, color: COLORS.textMain, marginBottom: 6 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 21 },
  premiumCta: { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  premiumCtaText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Filter Modal
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

  // Analysis Modal Styles
  analysisModalContent: {
    width: SCREEN_WIDTH * 0.88,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1C1714',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  analysisModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  analysisModalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analysisModalTitle: {
    fontFamily: QS_BOLD,
    fontSize: 18,
    color: COLORS.textMain,
  },
  analysisModalCloseBtn: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  analysisModalBody: {
    gap: 16,
  },
  analysisConnectionText: {
    fontFamily: QS_MEDIUM,
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 20,
  },
  analysisDreamHighlight: {
    fontFamily: QS_SEMIBOLD,
    color: COLORS.textMain,
    fontStyle: 'italic',
  },
  analysisNameHighlight: {
    fontFamily: QS_BOLD,
    color: COLORS.primary,
  },
  analysisBox: {
    backgroundColor: '#FAF9F6',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(166, 63, 79, 0.08)',
  },
  analysisBoxTitle: {
    fontFamily: QS_BOLD,
    fontSize: 12,
    color: COLORS.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  analysisBoxBody: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 14,
    color: COLORS.textMain,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  analysisFooterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  analysisTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  analysisTagText: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    color: '#64748B',
  },
});
