import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Ruler, Home, Briefcase, Moon, Cigarette, Wine, Link2, ChevronRight, ChevronLeft, Heart, X, Undo2, MessageCircle, Send, Languages } from 'lucide-react-native';
import DropShadow from 'react-native-drop-shadow';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/useAppStore';

// ─── Constants & Tokens ───────────────────────────────────────────────────────
const QS_REGULAR = 'Quicksand_400Regular';
const QS_MEDIUM = 'Quicksand_500Medium';
const QS_SEMIBOLD = 'Quicksand_600SemiBold';
const QS_BOLD = 'Quicksand_700Bold';
const SERIF = 'Quicksand_700Bold';

const COLORS = {
  primary: '#A63F4F',
  roseLt: '#F7E6E8',
  bg: '#FFFFFF',
  sand: '#F8FAFC',
  textMain: '#1C1714',
  textMuted: '#475569',
  textLight: '#94a3b8',
  borderLight: 'rgba(0,0,0,0.04)',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_IMAGE_WIDTH = SCREEN_WIDTH - 28;
const HERO_IMAGE_HEIGHT = (HERO_IMAGE_WIDTH * 4) / 3;

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

const MetricRow = ({ label, level, score }: { label: string, level: string, score: number }) => {
  const progressWidth = `${Math.max(0, Math.min(score, 100))}%` as `${number}%`;

  return (
    <View style={s.metricRow}>
      <View style={s.metricHeader}>
        <Text style={s.metricLabel}>{label}</Text>
        <Text style={s.metricLevel}>{level}</Text>
      </View>
      <View style={s.metricTrack}>
        <View style={[s.metricFill, { width: progressWidth }]} />
      </View>
    </View>
  );
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_USERS: Record<string, any> = {
  'd1': {
    nickname: 'Deren', age: 24, location: 'Izmir', isOnline: true,
    bio: 'Architecture student by day, stargazer by night. I believe our dreams hold the blueprints of who we truly are.',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=600&q=80',
    ],
    dreamTitle: 'Walking on the Sky', dreamDesc: 'I was walking across a translucent sky bridge made of clouds. Each step echoed like a bell, and birds flew below me...',
    interests: ['Lucid Dreaming', 'Architecture', 'Astronomy', 'Poetry'],
    matchPercent: 82,
  },
  'd2': {
    nickname: 'Emre', age: 28, location: 'Istanbul', isOnline: false,
    bio: 'Filmmaker chasing stories between the waking world and the sleeping one. If we matched, maybe our subconscious is trying to tell us something.',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    ],
    dreamTitle: 'Lost City Atlas', dreamDesc: 'An ancient city appeared from the mist, its streets paved with mirrors reflecting skies from other dimensions...',
    interests: ['Film', 'Surrealism', 'Mythology', 'Espresso'],
    matchPercent: 91,
  },
  'd3': {
    nickname: 'Melis', age: 25, location: 'Ankara', isOnline: true,
    bio: 'Biologist who believes nature speaks to us through dreams. Every animal, every plant — a symbol waiting to be decoded.',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80',
    ],
    dreamTitle: 'Forest of Talking Animals', dreamDesc: 'A dense forest where every creature spoke in riddles. A fox told me to follow the river, and I woke up before I reached it...',
    interests: ['Biology', 'Hiking', 'Dream Journaling', 'Tea Ceremonies'],
    matchPercent: 78,
  },
  'd4': {
    nickname: 'Ayşe', age: 23, location: 'Istanbul', isOnline: true,
    bio: 'Literature lover lost between the pages of Borges and Calvino. My dreams are the stories I have not yet written.',
    photos: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShXIHIKuTwvbYE0mPsBgkpvdjFn1OoT7vxDg&s',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    ],
    dreamTitle: 'The Infinite Library', dreamDesc: 'An endless library where every book contained a different version of my life. I opened one and lived an entire year in seconds...',
    interests: ['Literature', 'Philosophy', 'Calligraphy', 'Vintage Books'],
    matchPercent: 95,
  },
  'd5': {
    nickname: 'Can', age: 27, location: 'Izmir', isOnline: false,
    bio: 'Physicist who thinks time is just another dream we collectively share. Looking for someone to prove me wrong — or right.',
    photos: [
      'https://avatars.mds.yandex.net/i?id=014616abf66badc15340d086bfd49de23622ae23-4406484-images-thumbs&n=13',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    ],
    dreamTitle: 'Time Travel', dreamDesc: 'I traveled to the future and saw myself sitting in a garden, reading a letter I had written today...',
    interests: ['Physics', 'Sci-Fi', 'Chess', 'Jazz'],
    matchPercent: 88,
  },
  'd6': {
    nickname: 'Zeynep', age: 26, location: 'Antalya', isOnline: true,
    bio: 'Marine biologist and free diver. The ocean in my dreams is always deeper than the real one.',
    photos: [
      'https://i.pinimg.com/1200x/9c/0e/94/9c0e94cae90d58a5487ab428dd8331ed.jpg',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
    ],
    dreamTitle: 'Light at the Bottom of the Ocean', dreamDesc: 'A pulsing light at the ocean floor called to me. As I dove deeper, the water became warm like sunlight...',
    interests: ['Diving', 'Marine Life', 'Watercolor', 'Meditation'],
    matchPercent: 84,
  },
};

const MOCK_EXTRA = {
  height: '172 cm', hometown: 'Istanbul', education: "Bachelor's",
  chronotype: 'Night Owl 🦉', smoking: 'Never', alcohol: 'Social Drinker',
  languages: ['Turkish', 'English'],
  prompts: [
    { question: "Right before I fall asleep, I think about...", answer: "Where the boundaries of the universe end and what I'm doing here." },
    { question: "The mysterious place I see most in my dreams...", answer: "An old, wooden library where the stairs constantly change." },
  ],
  myDream: {
    id: 'my-dream-001',
    title: 'The Mirror Sea',
    desc: 'I was floating above a vast ocean that reflected a sky full of shifting constellations. The water felt like glass yet warm, and I knew I had been here before in another life...',
  },
};

const DEFAULT_USER = {
  nickname: 'Unknown', age: 25, location: 'Unknown', isOnline: false,
  bio: 'A dreamer exploring the subconscious.',
  photos: ['https://i.pinimg.com/236x/2f/47/5d/2f475d794db006ffb24488e1fd1f81cf.jpg'],
  dreamTitle: 'A Mysterious Dream', dreamDesc: 'Fragments of a dream that felt more real than waking life...',
  interests: ['Dreaming', 'Exploration'], matchPercent: 75,
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UserCardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    dreamId: string;
    nickname: string;
    avatarUrl: string;
    dreamTitle: string;
    hideButtons?: string;
    whisperContent?: string;
    whisperType?: string;
    whisperTargetContent?: string;
    whisperTargetImageUrl?: string;
  }>();

  const whisperContent = params.whisperContent;
  const whisperType = params.whisperType;
  const whisperTargetContent = params.whisperTargetContent;
  const whisperTargetImageUrl = params.whisperTargetImageUrl;

  const hideButtons = params.hideButtons === 'true';
  const dreamId = params.dreamId || '';
  const userData = MOCK_USERS[dreamId] || DEFAULT_USER;

  const name = userData.nickname;
  const age = userData.age;
  const location = userData.location;
  const bio = userData.bio;
  const isOnline = userData.isOnline;
  const photos = userData.photos;
  const dreamTitle = userData.dreamTitle;
  const dreamDesc = userData.dreamDesc;
  const interests = userData.interests;
  const matchPercent = userData.matchPercent;

  // ── Whisper State ──
  const [whisperOpen, setWhisperOpen] = useState(false);
  const [whisperText, setWhisperText] = useState('');
  const [whisperTarget, setWhisperTarget] = useState<{ type: 'bio' | 'prompt' | 'photo'; title?: string; content: string } | null>(null);
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

  // ── WhisperButton Component ──
  const WhisperButton = ({ onPress, overlay }: { onPress: () => void; overlay?: boolean }) => {
    if (overlay) {
      return (
        <TouchableOpacity style={s.whisperBtnOverlay} onPress={onPress} activeOpacity={0.9}>
          <MessageCircle size={15} color="#1C1714" strokeWidth={2.5} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={s.whisperBtnFlat} onPress={onPress} activeOpacity={0.6}>
        <MessageCircle size={15} color="#1C1714" strokeWidth={2.5} />
        <Text style={s.whisperBtnTextFlat}>Whisper</Text>
      </TouchableOpacity>
    );
  };

  const handleLeftAction = () => {
    Alert.alert('Passed', `You passed on ${name}.`);
    router.back();
  };

  const handleRightAction = () => {
    Alert.alert('Connected!', `You connected with ${name}! 🎉`);
    router.back();
  };

  const openReportModal = useAppStore(state => state.openReportModal);

  const handleBlockPress = () => {
    const userId = (params as any).userId || dreamId || 'unknown';
    openReportModal(
      { id: userId, name },
      'block',
      (_userId: string, _action: 'block' | 'report' | 'both') => {
        router.back();
      }
    );
  };

  const handleReportPress = () => {
    const userId = (params as any).userId || dreamId || 'unknown';
    openReportModal(
      { id: userId, name },
      'report',
      (_userId: string, _action: 'block' | 'report' | 'both') => {
        // stay on screen after report
      }
    );
  };
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── SOLID WHITE SAFE AREA SPACER ── */}
      <View style={{ height: insets.top, backgroundColor: '#FFFFFF' }} />

      {/* ── Exit Button (Back Button in blackish bubble) ── */}
      <TouchableOpacity
        style={[s.backBtn, { top: insets.top + 24, left: 28 }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <ChevronLeft size={22} color="#fff" />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hideButtons ? (insets.bottom + 60) : 130 }}
        bounces={false}
      >
        {/* ── HERO IMAGE ── */}
        <View style={[s.heroWrap, { marginTop: 16 }]}>
          <Image source={{ uri: photos[0] }} style={s.heroImage} />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.82)']}
            locations={[0.35, 0.6, 1]}
            style={s.heroGradient}
          />
          <View style={s.heroBottom}>
            <View style={s.heroIdentity}>
              <Text style={s.heroName} numberOfLines={1}>{name}, {age}</Text>
              <View style={s.heroMeta}>
                <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.72)" />
                <Text style={s.heroLocation}>{location}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.innerContentPad}>
          {/* ── RECEIVED WHISPER CARD ── */}
          {whisperContent ? (
            <DropShadow style={s.cardShadow}>
              <View style={s.receivedWhisperCard}>
                <View style={s.receivedWhisperHeader}>
                  <MessageCircle size={14} color="#1C1714" strokeWidth={2.5} />
                  <Text style={s.receivedWhisperTitle}>RECEIVED WHISPER</Text>
                </View>
                
                <View style={s.receivedWhisperBubble}>
                  <Text style={s.receivedWhisperText}>
                    "{whisperContent}"
                  </Text>
                </View>
                
                <View style={s.receivedWhisperTargetContext}>
                  <View style={s.receivedWhisperTargetTexts}>
                    <Text style={s.receivedWhisperTargetLabel}>
                      Replied to your {whisperType || 'profile'}
                    </Text>
                    <Text style={s.receivedWhisperTargetContent} numberOfLines={3}>
                      {whisperTargetContent}
                    </Text>
                  </View>
                  {whisperType === 'photo' && whisperTargetImageUrl ? (
                    <Image
                      source={{ uri: whisperTargetImageUrl }}
                      style={s.receivedWhisperTargetImage}
                    />
                  ) : null}
                </View>
              </View>
            </DropShadow>
          ) : null}

          {/* ── BASICS ── */}
          <DropShadow style={s.cardShadow}>
            <View style={s.bumbleCard}>
              <Text style={s.bumbleCardTitle}>Basics</Text>
              <View style={s.basicPillsWrap}>
                <View style={s.basicPill}><Ruler size={14} color="#111" /><Text style={s.basicPillTxt}>{MOCK_EXTRA.height}</Text></View>
                <View style={s.basicPill}><Home size={14} color="#111" /><Text style={s.basicPillTxt}>{MOCK_EXTRA.hometown}</Text></View>
                <View style={s.basicPill}><Briefcase size={14} color="#111" /><Text style={s.basicPillTxt}>{MOCK_EXTRA.education}</Text></View>
              </View>
            </View>
          </DropShadow>

          {/* ── SHARED DREAM CARD ── */}
          <DropShadow style={s.cardShadow}>
            <View style={s.dreamCardPremium}>

              {/* Header Row */}
              <View style={s.dreamHeaderRow}>
                <View style={s.dreamHeaderLeft}>
                  <Moon size={16} color="#1C1714" strokeWidth={2.5} />
                  <Text style={s.dreamTagPremium}>SHARED DREAM</Text>
                </View>
              </View>

              {/* Your Dream */}
              <TouchableOpacity
                style={[s.dreamSide, s.dreamSideSelf]}
                activeOpacity={0.7}
                onPress={() => {
                  if (MOCK_EXTRA.myDream.id) {
                    router.push(`/dream/${MOCK_EXTRA.myDream.id}`);
                  } else {
                    console.log("My dream ID not found");
                  }
                }}
              >
                <View style={s.dreamSideAccentSelf} />
                <View style={s.dreamSideInner}>
                  <Text style={s.dreamSideLabel}>Your Dream</Text>
                  <Text style={s.dreamSideTitle} numberOfLines={1}>{MOCK_EXTRA.myDream.title}</Text>
                  <Text style={s.dreamSideDesc} numberOfLines={3}>{MOCK_EXTRA.myDream.desc}</Text>
                </View>
                <View style={s.dreamChevronWrap}>
                  <ChevronRight size={16} color="#CBD5E1" />
                </View>
              </TouchableOpacity>

              {/* Connection Bridge Divider */}
              <View style={s.connectionBridge}>
                <View style={s.connectionLine} />
                <View style={s.connectionIconWrap}>
                  <Link2 size={14} color="#c5c5c5ff" strokeWidth={2.5} />
                </View>
                <View style={s.connectionLine} />
              </View>

              {/* [Name]'s Dream */}
              <TouchableOpacity
                style={[s.dreamSide, s.dreamSideOther]}
                activeOpacity={0.7}
                onPress={() => {
                  if (dreamId) {
                    router.push(`/dream/${dreamId}`);
                  }
                }}
              >
                <View style={s.dreamSideAccentOther} />
                <View style={s.dreamSideInner}>
                  <Text style={s.dreamSideLabelOther}>{name}'s Dream</Text>
                  <Text style={s.dreamSideTitle} numberOfLines={1}>{dreamTitle}</Text>
                  <Text style={s.dreamSideDesc} numberOfLines={3}>{dreamDesc}</Text>
                </View>
                <View style={s.dreamChevronWrap}>
                  <ChevronRight size={16} color="#CBD5E1" />
                </View>
              </TouchableOpacity>

              {/* Similarity Card */}
              <View style={s.similarityCard}>
                <View style={s.similarityHeader}>
                  <View style={s.similarityTitleGroup}>
                    <Text style={s.similarityCardTitle}>Similarity Profile</Text>
                    <Text style={s.similarityCardSub}>We compared your dreams and found that you share similar feelings, symbols, and story patterns.</Text>
                  </View>
                </View>
                <View style={s.metricsContainer}>
                  <MetricRow label="Emotional tone" level="High" score={92} />
                  <MetricRow label="Symbol themes" level="Medium" score={72} />
                  <MetricRow label="Narrative flow" level="High" score={86} />
                </View>
              </View>


            </View>
          </DropShadow>

          {/* ── BIO ── */}
          <DropShadow style={s.cardShadow}>
          <View style={s.bumbleCard}>
            <Text style={s.bumbleCardTitle}>About me</Text>
            <Text style={s.bioText}>{bio}</Text>
            <View style={s.whisperAlignRight}>
              <WhisperButton onPress={() => openWhisper('bio', bio)} />
            </View>
          </View>
          </DropShadow>

          {/* ── PHOTO 1 ── */}
          {photos[1] && (
            <View style={s.extraPhotoContainer}>
              <Image source={{ uri: photos[1] }} style={s.extraPhoto} />
              <WhisperButton overlay onPress={() => openWhisper('photo', photos[1])} />
            </View>
          )}

          {/* ── PROMPT 1 ── */}
          <DropShadow style={s.cardShadow}>
          <View style={s.promptCard}>
            <Text style={s.promptQuestion}>{MOCK_EXTRA.prompts[0].question}</Text>
            <View style={s.promptDivider} />
            <Text style={s.promptAnswer}>{MOCK_EXTRA.prompts[0].answer}</Text>
            <View style={s.whisperAlignRight}>
              <WhisperButton onPress={() => openWhisper('prompt', MOCK_EXTRA.prompts[0].answer, MOCK_EXTRA.prompts[0].question)} />
            </View>
          </View>
          </DropShadow>

          {/* ── PHOTO 2 ── */}
          {photos[2] && (
            <View style={s.extraPhotoContainer}>
              <Image source={{ uri: photos[2] }} style={s.extraPhoto} />
              <WhisperButton overlay onPress={() => openWhisper('photo', photos[2])} />
            </View>
          )}

          {/* ── LIFESTYLE ── */}
          <DropShadow style={s.cardShadow}>
          <View style={s.bumbleCard}>
            <Text style={s.bumbleCardTitle}>Lifestyle</Text>
            <View style={s.basicPillsWrap}>
              <View style={s.basicPill}><Moon size={14} color="#111" /><Text style={s.basicPillTxt}>{MOCK_EXTRA.chronotype}</Text></View>
              <View style={s.basicPill}><Cigarette size={14} color="#111" /><Text style={s.basicPillTxt}>{MOCK_EXTRA.smoking}</Text></View>
              <View style={s.basicPill}><Wine size={14} color="#111" /><Text style={s.basicPillTxt}>{MOCK_EXTRA.alcohol}</Text></View>
            </View>
          </View>
          </DropShadow>

          {/* ── PROMPT 2 ── */}
          <DropShadow style={s.cardShadow}>
          <View style={s.promptCard}>
            <Text style={s.promptQuestion}>{MOCK_EXTRA.prompts[1].question}</Text>
            <View style={s.promptDivider} />
            <Text style={s.promptAnswer}>{MOCK_EXTRA.prompts[1].answer}</Text>
            <View style={s.whisperAlignRight}>
              <WhisperButton onPress={() => openWhisper('prompt', MOCK_EXTRA.prompts[1].answer, MOCK_EXTRA.prompts[1].question)} />
            </View>
          </View>
          </DropShadow>

          {/* ── LANGUAGES & INTERESTS ── */}
          <DropShadow style={s.cardShadow}>
          <View style={s.bumbleCard}>
            <Text style={s.bumbleCardTitle}>Languages</Text>
            <View style={s.tagsWrap}>
              {MOCK_EXTRA.languages.map(l => (
                <View key={l} style={[s.tagPill, { flexDirection: 'row', alignItems: 'center' }]}>
                  <Languages size={14} color="#000000" style={{ marginRight: 6 }} />
                  <Text style={s.tagPillTxt}>{l}</Text>
                </View>
              ))}
            </View>
          </View>
          </DropShadow>

          <DropShadow style={s.cardShadow}>
          <View style={s.bumbleCard}>
            <Text style={s.bumbleCardTitle}>Interests</Text>
            <View style={s.tagsWrap}>
              {interests.map((i: string) => (
                <View key={i} style={s.tagPill}>
                  <Text style={s.tagPillTxt}>{getInterestEmoji(i)} {i}</Text>
                </View>
              ))}
            </View>
          </View>
          </DropShadow>

          {/* ── SAFETY FOOTER (BLOCK & REPORT) ── */}
          <View style={s.safetyFooter}>
            <TouchableOpacity style={s.safetyFooterBtn} activeOpacity={0.6} onPress={handleBlockPress}>
              <Text style={s.safetyFooterText}>BLOCK {name.toUpperCase()}</Text>
            </TouchableOpacity>
            <View style={s.safetyFooterDivider} />
            <TouchableOpacity style={s.safetyFooterBtn} activeOpacity={0.6} onPress={handleReportPress}>
              <Text style={[s.safetyFooterText, s.safetyFooterTextRed]}>REPORT PROFILE</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* ── FIXED BOTTOM ACTION BAR ── */}
      {hideButtons ? (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: insets.bottom, backgroundColor: '#FFFFFF' }} />
      ) : (
        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={s.bottomBtnLeft} onPress={handleLeftAction} activeOpacity={0.85}>
            <X size={20} color="#64748b" strokeWidth={2.5} />
            <Text style={s.bottomBtnLeftText}>Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.bottomBtnRight} onPress={handleRightAction} activeOpacity={0.85}>
            <Heart size={20} color="#fff" fill="#fff" strokeWidth={2.5} />
            <Text style={s.bottomBtnRightText}>Connect</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── WHISPER DRAWER MODAL ── */}
      <Modal visible={whisperOpen} transparent animationType="none" onRequestClose={closeWhisper}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalRoot}>
          <Pressable style={{ flex: 1 }} onPress={closeWhisper} />
          <Animated.View style={[s.whisperSheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: whisperSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] }]}>
            <View style={s.sheetHeader}>
              <View style={s.whisperCountBadge}>
                <MessageCircle size={14} color="#1C1714" strokeWidth={3} />
                <Text style={s.whisperCountTxt}>{whisperCount} Left</Text>
              </View>
              <TouchableOpacity onPress={closeWhisper} style={s.closeBtn}><X size={20} color={COLORS.textMain} /></TouchableOpacity>
            </View>
            <View style={s.pinnedContent}>
              {whisperTarget?.type === 'photo' ? (
                <Image source={{ uri: whisperTarget.content }} style={s.pinnedImg} />
              ) : (
                <View style={s.pinnedTextWrap}>
                  {whisperTarget?.title && <Text style={s.pinnedTitle}>{whisperTarget.title}</Text>}
                  <Text style={s.pinnedText} numberOfLines={3}>"{whisperTarget?.content}"</Text>
                </View>
              )}
            </View>
            <View style={s.inputWrapper}>
              <TextInput
                style={s.whisperInput}
                autoFocus
                multiline
                maxLength={120}
                placeholder="Whisper about this..."
                placeholderTextColor={COLORS.textLight}
                value={whisperText}
                onChangeText={setWhisperText}
              />
              <View style={s.inputFooter}>
                <Text style={[s.charCount, whisperText.length === 120 && { color: '#ef4444' }]}>
                  {whisperText.length}/120
                </Text>
                <TouchableOpacity
                  style={[s.sendBtn, !whisperText.trim() && s.sendBtnDisabled]}
                  onPress={sendWhisper}
                  disabled={!whisperText.trim()}
                >
                  <Text style={s.sendBtnTxt}>Send</Text>
                  <Send size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  backBtn: {
    position: 'absolute', zIndex: 50,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.79)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero
  heroWrap: {
    width: HERO_IMAGE_WIDTH,
    height: HERO_IMAGE_HEIGHT,
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  heroBottom: { position: 'absolute', bottom: 18, left: 0, right: 0, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  heroIdentity: { flex: 1 },
  heroName: { fontFamily: SERIF, fontSize: 26, fontStyle: 'italic', color: '#fff', letterSpacing: -0.2, marginBottom: 4 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocation: { fontFamily: QS_MEDIUM, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginLeft: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginLeft: 6 },
  onlineText: { fontFamily: QS_MEDIUM, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

  innerContentPad: { paddingHorizontal: 14, paddingTop: 18 },

  // Cards
  bumbleCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16 },

  // DropShadow wrapper — shared by all sub-cards
  cardShadow: {
    shadowColor: '#1C1714',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  bumbleCardTitle: { fontFamily: QS_BOLD, fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 10 },
  bioText: { fontFamily: QS_REGULAR, fontSize: 15, color: '#111', lineHeight: 24 },

  basicPillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  basicPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 },
  basicPillTxt: { fontFamily: QS_MEDIUM, fontSize: 13, color: '#000' },

  // Shared Dream Card
  dreamCardPremium: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
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

  // Prompt
  promptCard: { backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 16 },
  promptQuestion: { fontFamily: QS_SEMIBOLD, fontSize: 15, fontWeight: '600', color: COLORS.textMain, marginBottom: 10, lineHeight: 22 },
  promptDivider: { height: 1.6, backgroundColor: COLORS.borderLight, marginHorizontal: 4, marginBottom: 10 },
  promptAnswer: { fontFamily: QS_MEDIUM, fontSize: 15, color: COLORS.textMain, lineHeight: 22, marginBottom: 4 },

  // Photos
  extraPhotoContainer: { width: '100%', borderRadius: 20, overflow: 'hidden', backgroundColor: COLORS.bg, borderWidth: 0.5, borderColor: COLORS.borderLight, marginBottom: 16, aspectRatio: 3 / 4 },
  extraPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },

  // Tags
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagPillTxt: { fontFamily: QS_MEDIUM, fontSize: 13, color: '#000' },

  // Whisper Button Styles
  whisperAlignRight: { alignSelf: 'flex-end', marginTop: 4 },
  whisperBtnFlat: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  whisperBtnTextFlat: { fontFamily: QS_BOLD, fontSize: 13, color: '#1C1714' },
  whisperBtnOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },

  // Whisper Modal
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
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

  // Safety Footer (Block & Report)
  safetyFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, marginBottom: 15, paddingVertical: 8 },
  safetyFooterBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  safetyFooterText: { fontFamily: QS_BOLD, fontSize: 10.5, color: '#94A3B8', letterSpacing: 1.6 },
  safetyFooterTextRed: { color: '#E07A7A' },
  safetyFooterDivider: { width: 1, height: 12, backgroundColor: '#E2E8F0' },

  // Bottom Action Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: COLORS.bg, gap: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
  },
  bottomBtnLeft: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 18, gap: 8,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  bottomBtnLeftText: { fontFamily: QS_BOLD, fontSize: 15, color: '#64748b' },
  bottomBtnRight: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 18, gap: 8,
    backgroundColor: COLORS.primary,
  },
  bottomBtnRightText: { fontFamily: QS_BOLD, fontSize: 15, color: '#fff' },
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
  // Received Whisper Card Styles
  receivedWhisperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  receivedWhisperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  receivedWhisperTitle: {
    fontFamily: QS_BOLD,
    fontSize: 10,
    color: '#1C1714',
    letterSpacing: 1.5,
  },
  receivedWhisperBubble: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderTopLeftRadius: 4,
  },
  receivedWhisperText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 15,
    fontStyle: 'italic',
    color: '#1C1714',
    lineHeight: 22,
  },
  receivedWhisperTargetContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 10,
  },
  receivedWhisperTargetTexts: {
    flex: 1,
  },
  receivedWhisperTargetLabel: {
    fontFamily: QS_SEMIBOLD,
    fontSize: 9,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  receivedWhisperTargetContent: {
    fontFamily: QS_MEDIUM,
    fontSize: 11,
    color: '#1C1714',
  },
  receivedWhisperTargetImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
    resizeMode: 'cover',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});
