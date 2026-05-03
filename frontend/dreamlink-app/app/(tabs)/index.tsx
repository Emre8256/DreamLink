import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  isSpeechRecognitionAvailable,
} from '../../services/speechRecognition';
import wsService from '../../services/websocket';
import { useAppStore } from '../../store/useAppStore';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
} from 'react-native';
import { EdgeToEdgeLayout } from '../../components/EdgeToEdgeLayout';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createDream,
  getPublicDreams,
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
  roseLt: '#F7E6E8',    // Açık Rose (Arka planlar, soft geçişler)
  roseMd: '#D697A2',    // Orta Rose (Çizgiler, pasif ikonlar)
  roseDk: '#7D2D3A',    // Derin Rose (Koyu vurgular)
  bg: '#FFFFFF',        // Saf Beyaz
  sand: '#F8FAFC',      // Çok uçuk gri (Filtre hapları, sekmeler)
  card: '#FFFFFF',
  t1: '#1C1714',        // Koyu Füme (Ana Başlıklar)
  t2: '#475569',        // Orta Gri (Metinler)
  tm: '#94a3b8',        // Açık Gri (Tarih, alt metin)
  white: '#FFFFFF',
} as const;

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
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

// ─ Creator Card ──────────────────────────────────────────────────
const CreatorCard = ({ onDreamShared }: { onDreamShared: (d: DreamResponse) => void }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [theme, setTheme] = useState<DreamTheme | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const micPulse = useRef(new Animated.Value(1)).current;

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    Animated.loop(Animated.sequence([
      Animated.timing(micPulse, { toValue: 1.25, duration: 600, useNativeDriver: true }),
      Animated.timing(micPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false); micPulse.stopAnimation(); micPulse.setValue(1);
  });

  useSpeechRecognitionEvent('result', (event: any) => {
    const t = event.results[0]?.transcript ?? '';
    if (!t) return;
    if (event.isFinal) {
      setDesc(prev => prev.trim() + (prev.trim() ? ' ' : '') + t);
    } else {
      setDesc(prev => {
        const base = prev.replace(/​[\s\S]*$/, '').trim();
        return base + (base.length > 0 ? ' ' : '') + '​' + t;
      });
    }
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false); micPulse.stopAnimation(); micPulse.setValue(1);
  });

  const handleMic = async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      setDesc(prev => prev.replace(/​/g, ''));
      return;
    }
    if (!isSpeechRecognitionAvailable || !ExpoSpeechRecognitionModule) {
      showAlert('Development build required', 'Voice input does not work in Expo Go.');
      return;
    }
    const r = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!r.granted) { showAlert('Permission denied', 'Microphone permission is required.'); return; }
    ExpoSpeechRecognitionModule.start({ lang: 'tr-TR', interimResults: true, continuous: true });
  };

  const handleShare = async () => {
    const cleanDesc = desc.replace(/​/g, '').trim();
    if (!title.trim() || !cleanDesc || !theme) {
      showAlert('Missing information', 'Title, content and theme selection are required.');
      return;
    }
    if (isListening) ExpoSpeechRecognitionModule.stop();
    setSharing(true);
    try {
      const req: CreateDreamRequest = {
        title: title.trim(), description: cleanDesc,
        theme, visibility: isPublic ? 'PUBLIC' : 'PRIVATE', tagNames: [],
      };
      const newDream = await createDream(req);
      setTitle(''); setDesc(''); setTheme(null); setIsPublic(true);
      onDreamShared(newDream);
    } catch {
      showAlert('Error', 'An error occurred while sharing the dream.');
    } finally { setSharing(false); }
  };

  const chosen = theme ? THEME_DISPLAY[theme] : null;

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FDF8F9', C.roseLt]} 
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.creatorCard}
    >
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {STARS.map((s, i) => <StarDot key={i} left={s.left} top={s.top} sz={s.sz} />)}
      </View>

      <View style={styles.crTopRow}>
        <Text style={styles.crEyebrow}>SHARE YOUR DREAM</Text>
        <TouchableOpacity
          style={[styles.privacyBtn, !isPublic && styles.privacyBtnPrivate]}
          onPress={() => setIsPublic(!isPublic)}
        >
          <Ionicons name={isPublic ? 'globe-outline' : 'lock-closed-outline'} size={11}
            color={isPublic ? C.tm : C.rose} />
          <Text style={[styles.privacyText, !isPublic && styles.privacyTextPrivate]}>
            {isPublic ? 'Public' : 'Only Me'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.crTitleRow}>
        <TextInput style={styles.crTitleInput}
          placeholder="Give your dream a title..." placeholderTextColor={C.tm}
          value={title} onChangeText={setTitle} />
        <Animated.View style={{ transform: [{ scale: micPulse }] }}>
          <TouchableOpacity style={[styles.micBtn, isListening && styles.micBtnActive]} onPress={handleMic}>
            <Ionicons name={isListening ? 'stop' : 'mic'} size={16}
              color={isListening ? 'white' : C.t2} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <TextInput style={styles.crDescInput}
        placeholder="Describe your dream... What you saw, felt, colors, sounds..."
        placeholderTextColor={C.tm}
        value={desc} onChangeText={setDesc} multiline numberOfLines={3} />

      <View style={styles.crBottomRow}>
        <TouchableOpacity
          style={[styles.themePickerBtn, !!chosen && styles.themePickerBtnChosen]}
          onPress={() => setThemeOpen(v => !v)}
        >
          <Text style={styles.themePickerIcon}>{chosen ? chosen.emoji : '🌙'}</Text>
          <Text style={[styles.themePickerText, !!chosen && styles.themePickerTextChosen]}>
            {chosen ? chosen.label : 'Select Theme'}
          </Text>
          <Ionicons name={themeOpen ? 'chevron-up' : 'chevron-down'} size={10} color={C.tm} />
        </TouchableOpacity>
        <AnimatedPressable style={styles.postBtn} onPress={handleShare} disabled={sharing} hapticType="medium">
          {sharing ? <ActivityIndicator size="small" color="white" /> : (
            <><Ionicons name="send" size={13} color="white" /><Text style={styles.postBtnText}>Share</Text></>
          )}
        </AnimatedPressable>
      </View>

      {themeOpen && (
        <View style={styles.themeGrid}>
          {ORDERED_THEMES.map(t => {
            const cfg = THEME_DISPLAY[t]; const sel = theme === t;
            return (
              <TouchableOpacity key={t}
                style={[styles.themeGridItem, sel && styles.themeGridItemSel]}
                onPress={() => { setTheme(t); setThemeOpen(false); }}>
                <Text style={styles.themeGridEmoji}>{cfg.emoji}</Text>
                <Text style={[styles.themeGridLabel, sel && styles.themeGridLabelSel]}>{cfg.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </LinearGradient>
  );
};

// ─ Today's Insight Card ──────────────────────────────────────────
const TodaysInsightCard = React.memo(({ dream }: { dream: DreamResponse }) => {
  const router = useRouter();
  const [liked, setLiked] = useState(dream.isLiked);
  const [likeCount, setLikeCount] = useState(dream.likeCount);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next); setLikeCount(p => next ? p + 1 : p - 1);
    try { await toggleLike(dream.id); }
    catch { setLiked(!next); setLikeCount(p => next ? p - 1 : p + 1); }
  };

  const handleAI = () => {
    if (aiDone) { router.push(`/dream/${dream.id}` as any); return; }
    setAiLoading(true);
    setTimeout(() => { setAiLoading(false); setAiDone(true); }, 1500);
  };

  const td = THEME_DISPLAY[dream.theme] ?? THEME_DISPLAY['CURIOUS'];
  const d = new Date(dream.createdAt);
  const dateStr = d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'long' })
    + ' · ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.insightCard}>
      <LinearGradient colors={[C.rose, C.roseMd, C.roseLt]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.insightAccent} />
      <View style={styles.insightInner}>
        <View style={styles.insightTopRow}>
          <View>
            <Text style={styles.insightEyebrow}>MY DREAM TODAY</Text>
            <Text style={styles.insightDatetime}>{dateStr}</Text>
          </View>
          <View style={[styles.insightBadge, { backgroundColor: td.badgeBg }]}>
            <Text style={{ fontSize: 11 }}>{td.emoji}</Text>
            <Text style={[styles.insightBadgeText, { color: td.badgeC }]}>{td.label}</Text>
          </View>
        </View>
        <Text style={styles.insightTitle}>"{dream.title}"</Text>
        <Text style={styles.insightBody} numberOfLines={3}>{dream.description}</Text>

        <TouchableOpacity style={styles.aiBtn} onPress={handleAI} activeOpacity={0.85}>
          <LinearGradient colors={['#1C1320', '#2B1A28', '#1E141C']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} />
          <View style={styles.aiBtnLeft}>
            <View style={styles.aiSparkleWrap}>
              {aiLoading ? <ActivityIndicator size="small" color={C.roseMd} />
                : aiDone ? <Ionicons name="checkmark" size={16} color={C.roseMd} />
                  : <Ionicons name="sparkles" size={18} color={C.roseMd} />}
            </View>
            <View>
              <Text style={styles.aiLabel}>
                {aiDone ? 'Analysis Ready' : aiLoading ? 'Analyzing...' : 'Analyze Dream'}
              </Text>
              <Text style={styles.aiSub}>
                {aiDone ? 'Tap to view interpretation' : 'AI interpretation · Free'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={15} color="rgba(253,248,246,0.5)" />
        </TouchableOpacity>
      </View>

      <View style={styles.insightFooter}>
        <View style={styles.insightStats}>
          <TouchableOpacity style={styles.insightStatBtn} onPress={handleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={13} color={liked ? C.rose : C.tm} />
            <Text style={[styles.insightStatText, liked && { color: C.rose }]}>{likeCount}</Text>
          </TouchableOpacity>
          <View style={styles.insightStatBtn}>
            <Ionicons name="chatbubble-outline" size={13} color={C.tm} />
            <Text style={styles.insightStatText}>{dream.commentCount}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.insightDetailBtn} onPress={() => router.push(`/dream/${dream.id}` as any)}>
          <Ionicons name="open-outline" size={13} color={C.tm} />
          <Text style={styles.insightDetailText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ─ Empty today state ─────────────────────────────────────────────
const EmptyTodayCard = () => (
  <View style={styles.emptyTodayCard}>
    <Text style={styles.emptyTodayMoon}>🌙</Text>
    <Text style={styles.emptyTodayTitle}>"You will find your dreams here..."</Text>
    <Text style={styles.emptyTodaySub}>You haven't recorded a dream today yet.</Text>
  </View>
);

// ─ Archive Bridge ─────────────────────────────────────────────────
const ArchiveBridge = () => {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.archiveBridge}
      onPress={() => router.push('/dream-archive' as any)} activeOpacity={0.8}>
      <View style={styles.archiveLeft}>
        <View style={styles.archiveIcon}>
          <Ionicons name="book-outline" size={18} color={C.rose} />
        </View>
        <View>
          <Text style={styles.archiveLabel}>My Dream Archive</Text>
          <Text style={styles.archiveSub}>See all your dreams</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={15} color={C.tm} />
    </TouchableOpacity>
  );
};

// ─ Community Dream Card (Yatay Düzen & Editoryal Tema) ────────────
const CommunityDreamCard = React.memo(({ dream }: { dream: DreamResponse }) => {
  const router = useRouter();
  const [liked, setLiked] = useState(dream.isLiked);
  const [likeCount, setLikeCount] = useState(dream.likeCount);
  const td = THEME_DISPLAY[dream.theme] ?? THEME_DISPLAY['CURIOUS'];

  // Mock Avatar selection (stable based on nickname)
  const mockAvatarUrl = useMemo(() => {
    if (dream.avatarUrl) return dream.avatarUrl;
    const charCode = dream.nickname.charCodeAt(0);
    return MOCK_AVATARS[charCode % MOCK_AVATARS.length];
  }, [dream.avatarUrl, dream.nickname]);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next); setLikeCount(p => next ? p + 1 : p - 1);
    try { await toggleLike(dream.id); }
    catch { setLiked(!next); setLikeCount(p => next ? p - 1 : p + 1); }
  };

  return (
    <Pressable style={styles.fCard} onPress={() => router.push(`/dream/${dream.id}` as any)}>
      
      {/* SOL: Büyük Profil Fotoğrafı Alanı */}
      <View style={styles.fCardImageContainer}>
        <Image source={{ uri: mockAvatarUrl }} style={styles.fCardImage} />
        <LinearGradient
          colors={['transparent', 'rgba(28,23,20,0.15)', 'rgba(28,23,20,0.6)']}
          style={styles.fCardImageGradient}
        />
      </View>

      {/* SAĞ: Bilgi ve İçerik Alanı */}
      <View style={styles.fCardContent}>
        
        {/* Üst Satır: İsim ve Paylaşım Zamanı */}
        <View style={styles.fCardHeader}>
          <Text style={styles.fCardName} numberOfLines={1}>{dream.nickname}</Text>
          <Text style={styles.fCardTime}>{formatRelativeTime(dream.createdAt)}</Text>
        </View>

        {/* İnce Yatay Çizgi */}
        <View style={styles.fCardDivider} />

        {/* Rüya İçeriği */}
        <Text style={styles.fCardTitle} numberOfLines={1}>"{dream.title}"</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.fCardBody} numberOfLines={3} ellipsizeMode="tail">{dream.description}</Text>
          {dream.description.length > 80 && (
            <Text style={styles.fCardReadMoreHint}>Read more →</Text>
          )}
        </View>

        {/* Alt Satır: Aksiyonlar ve Tema */}
        <View style={styles.fCardFooter}>
          <TouchableOpacity style={styles.fCardAct} onPress={handleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? C.rose : C.t2} />
            <Text style={[styles.fCardActTxt, liked && { color: C.rose }]}>{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fCardAct} onPress={() => router.push(`/dream/${dream.id}` as any)}>
            <Ionicons name="chatbubble-outline" size={15} color={C.t2} />
            <Text style={styles.fCardActTxt}>{dream.commentCount}</Text>
          </TouchableOpacity>
          
          {/* YENİ ŞIK TEMA TASARIMI */}
          <View style={[styles.fCardChicTheme, { borderColor: td.bar + '30' }]}>
            <LinearGradient
              colors={[td.badgeBg, C.white]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={{ fontSize: 11 }}>{td.emoji}</Text>
            <Text style={[styles.fCardChicThemeTxt, { color: td.badgeC }]}>
              {td.label.charAt(0).toUpperCase()}{td.label.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>
      </View>

    </Pressable>
  );
});

// ─ Skeleton Loader ───────────────────────────────────────────────
const JournalCardSkeleton = () => (
  <View style={{ height: 168, borderRadius: 24, flexDirection: 'row',
                 marginBottom: 16, backgroundColor: '#EDE5E7', overflow: 'hidden' }}>
    <SkeletonBlock width={105} height={168} borderRadius={0} />
    <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <SkeletonBlock width={100} height={12} borderRadius={4} />
        <SkeletonBlock width={60} height={12} borderRadius={4} />
      </View>
      <View style={{ height: 1, backgroundColor: '#EDE5E7' }} />
      <SkeletonBlock width={150} height={15} borderRadius={4} />
      <SkeletonBlock width={160} height={12} borderRadius={4} />
      <SkeletonBlock width={130} height={12} borderRadius={4} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SkeletonBlock width={48} height={20} borderRadius={6} />
        <SkeletonBlock width={48} height={20} borderRadius={6} />
        <SkeletonBlock width={48} height={20} borderRadius={6} />
      </View>
    </View>
  </View>
);

// ─ Main Screen ───────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<'today' | 'community'>('today');
  const [dreams, setDreams] = useState<DreamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myLatestDream, setMyLatestDream] = useState<DreamResponse | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [communityFilter, setCommunityFilter] = useState<'trending' | 'new' | 'match'>('trending');
  const setUnreadDreams = useAppStore(state => state.setUnreadDreams);

  const contentOpacity = useSharedValue(0);
  const skeletonOpacity = useSharedValue(1);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useFocusEffect(useCallback(() => {
    checkMyLatestDream();
    setUnreadDreams(false);
  }, [setUnreadDreams]));

  useEffect(() => {
    loadDreams();
    getMyProfile().then(p => setCurrentUserId(p.id)).catch(() => { });
  }, []);

  useEffect(() => {
    wsService.connect();
    const handler = (newDream: DreamResponse) => {
      setDreams(prev => {
        if (currentUserId && newDream.authorId === currentUserId) return prev;
        if (prev.some(d => d.id === newDream.id)) return prev;
        setUnreadDreams(true);
        return [newDream, ...prev];
      });
    };
    wsService.subscribe('/topic/dream-feed', handler);
    return () => wsService.unsubscribe('/topic/dream-feed');
  }, [currentUserId, setUnreadDreams]);

  const checkMyLatestDream = async () => {
    try {
      const profile = await getMyProfile();
      const res = await getUserDreams(profile.id, 0, 1);
      if (res.content.length > 0) {
        const latest = res.content[0];
        const d = new Date(latest.createdAt); const now = new Date();
        const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        setMyLatestDream(isToday ? latest : null);
      } else { setMyLatestDream(null); }
    } catch { }
  };

  const loadDreams = async () => {
    try { const res = await getPublicDreams(0, 20); setDreams(res.content); }
    catch { showAlert('Error', 'Dreams could not be loaded.'); }
    finally {
      setLoading(false);
      setRefreshing(false);
      contentOpacity.value = withTiming(1, { duration: 350 });
      skeletonOpacity.value = withTiming(0, { duration: 350 }, (finished) => {
        if (finished) runOnJS(setShowSkeleton)(false);
      });
    }
  };

  const handleRefresh = () => { setRefreshing(true); loadDreams(); checkMyLatestDream(); };

  const handleDreamShared = (newDream: DreamResponse) => {
    setMyLatestDream(newDream);
    if (newDream.visibility === 'PUBLIC') {
      setDreams(prev => prev.some(d => d.id === newDream.id) ? prev : [newDream, ...prev]);
    }
  };

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const skeletonAnimStyle = useAnimatedStyle(() => ({
    opacity: skeletonOpacity.value,
  }));

  return (
    <EdgeToEdgeLayout backgroundColor="#FFFFFF" statusBarStyle="dark-content" statusBarBg="#FFFFFF">
      <View style={styles.container}>
        <View style={styles.header}>
        <Text style={styles.logo}>Dream<Text style={styles.logoEm}>Link</Text></Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.hdrBtn}>
            <Ionicons name="search-outline" size={17} color={C.t2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.hdrBtn} onPress={() => router.push('/notifications' as any)}>
            <Ionicons name="notifications-outline" size={17} color={C.t2} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.segWrap}>
        <View style={styles.segTrack}>
          {(['today', 'community'] as const).map(t => (
            <TouchableOpacity key={t}
              style={[styles.segBtn, tab === t && styles.segBtnActive]}
              onPress={() => setTab(t)}>
              <Text style={[styles.segBtnTxt, tab === t && styles.segBtnTxtActive]}>
                {t === 'today' ? 'Today' : 'Community'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'today' ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.todayContent}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.rose} colors={[C.rose]} />}>
          <CreatorCard onDreamShared={handleDreamShared} />
          {myLatestDream ? <TodaysInsightCard dream={myLatestDream} /> : <EmptyTodayCard />}
          <ArchiveBridge />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, position: 'relative' }}>
          <ReanimatedAnimated.View style={[{ flex: 1 }, contentAnimStyle]}>
            <FlatList
              data={dreams}
              renderItem={({ item }) => <CommunityDreamCard dream={item} />}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.communityContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.rose} colors={[C.rose]} />}
              ListHeaderComponent={
                <View style={styles.feedHeader}>
                  <Text style={styles.feedTitle}>Most liked this week</Text>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="moon-outline" size={48} color={C.tm} />
                  <Text style={styles.emptyText}>No dreams shared yet.</Text>
                </View>
              }
            />
          </ReanimatedAnimated.View>
          {showSkeleton && (
            <ReanimatedAnimated.View style={[StyleSheet.absoluteFill, { padding: 20 }, skeletonAnimStyle]}>
              <JournalCardSkeleton />
              <JournalCardSkeleton />
              <JournalCardSkeleton />
              <JournalCardSkeleton />
            </ReanimatedAnimated.View>
          )}
        </View>
      )}
      </View>
    </EdgeToEdgeLayout>
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
  logo: { fontFamily: QS_BOLD, fontSize: 23, fontWeight: '700', color: C.t1, letterSpacing: -0.3 },
  logoEm: { color: C.rose, fontStyle: 'normal' },
  headerRight: { flexDirection: 'row', gap: 8 },
  hdrBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },

  segWrap: { paddingHorizontal: 22, paddingBottom: 14, backgroundColor: '#FFFFFF' },
  segTrack: { backgroundColor: C.sand, borderRadius: 14, flexDirection: 'row', padding: 3, gap: 2 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: 'center' },
  segBtnActive: {
    backgroundColor: C.card,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  segBtnTxt: { fontSize: 13, fontWeight: '600', color: C.tm },
  segBtnTxtActive: { color: C.t1, fontWeight: '700' },

  todayContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 16 },

  creatorCard: {
    borderRadius: 26, padding: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', 
    shadowColor: C.roseDk, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 3,
  },
  crTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  crEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, color: C.rose, textTransform: 'uppercase' },
  privacyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  privacyBtnPrivate: { backgroundColor: C.roseLt, borderColor: C.roseMd },
  privacyText: { fontSize: 11, color: C.t2, fontWeight: '600' },
  privacyTextPrivate: { color: C.roseDk },
  crTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  crTitleInput: {
    flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    borderRadius: 13, paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: SERIF, fontSize: 15, fontStyle: 'italic', color: C.t1,
  },
  micBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: C.rose, borderColor: C.rose },
  crDescInput: {
    width: '100%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    borderRadius: 13, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 13, fontWeight: '500', color: C.t2, minHeight: 72, marginBottom: 14, textAlignVertical: 'top',
  },
  crBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  themePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9,
  },
  themePickerBtnChosen: { backgroundColor: C.roseLt, borderColor: C.roseMd },
  themePickerIcon: { fontSize: 14 },
  themePickerText: { fontSize: 12, fontWeight: '600', color: C.t2 },
  themePickerTextChosen: { color: C.roseDk, fontWeight: '700' },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.rose, borderRadius: 22, paddingHorizontal: 20, paddingVertical: 10, shadowColor: C.rose, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4, },
  postBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  themeGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  themeGridItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)'
  },
  themeGridItemSel: { backgroundColor: C.roseLt, borderColor: C.roseMd },
  themeGridEmoji: { fontSize: 13 },
  themeGridLabel: { fontSize: 12, color: C.t2, fontWeight: '600' },
  themeGridLabelSel: { color: C.roseDk, fontWeight: '700' },

  // Insight Card
  insightCard: {
    backgroundColor: C.card, borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 3,
  },
  insightAccent: { height: 3 },
  insightInner: { padding: 20, paddingBottom: 0 },
  insightTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  insightEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: C.tm, marginBottom: 3 },
  insightDatetime: { fontSize: 11, fontWeight: '500', color: C.tm },
  insightBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 5 },
  insightBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  insightTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', fontStyle: 'italic', color: C.t1, lineHeight: 25, letterSpacing: -0.3, marginBottom: 9 },
  insightBody: { fontSize: 13, fontWeight: '400', color: C.t2, lineHeight: 22, marginBottom: 16 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 15, paddingHorizontal: 18, marginBottom: 20, overflow: 'hidden' },
  aiBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  aiSparkleWrap: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(166,63,79,0.18)', alignItems: 'center', justifyContent: 'center' },
  aiLabel: { fontSize: 13, fontWeight: '700', color: '#FDF8F6', letterSpacing: 0.1 },
  aiSub: { fontSize: 11, color: 'rgba(253,248,246,0.5)', marginTop: 1 },
  insightFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 20, paddingVertical: 13 },
  insightStats: { flexDirection: 'row', gap: 14 },
  insightStatBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  insightStatText: { fontSize: 12, fontWeight: '500', color: C.tm },
  insightDetailBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  insightDetailText: { fontSize: 11, fontWeight: '600', color: C.tm },

  emptyTodayCard: { backgroundColor: C.card, borderRadius: 22, borderWidth: 1.5, borderColor: C.roseMd, borderStyle: 'dashed', padding: 32, alignItems: 'center', gap: 10 },
  emptyTodayMoon: { fontSize: 36, opacity: 0.5 },
  emptyTodayTitle: { fontFamily: SERIF, fontSize: 17, fontStyle: 'italic', fontWeight: '700', color: C.t2, textAlign: 'center' },
  emptyTodaySub: { fontSize: 12, color: C.tm, textAlign: 'center', lineHeight: 18 },

  archiveBridge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 18, padding: 14, paddingHorizontal: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
  archiveLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  archiveIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.roseLt, alignItems: 'center', justifyContent: 'center' },
  archiveLabel: { fontSize: 13, fontWeight: '700', color: C.t1 },
  archiveSub: { fontSize: 11, fontWeight: '500', color: C.tm, marginTop: 1 },

  communityContent: { paddingHorizontal: 20, paddingBottom: 120 },
  feedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingVertical: 8 },
  feedTitle: { fontFamily: SERIF, fontSize: 19, fontWeight: '700', fontStyle: 'italic', color: C.t1 },
  
  emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.6 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: C.tm },

  // ── Çizime Uygun Community Dream Card (Yatay Düzen & Editoryal Tema) ───────────
  fCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: 16,
    height: 168,
  },
  fCardImageContainer: {
    width: 105,
    alignSelf: 'stretch',
    backgroundColor: '#F9F9F9',
  },
  fCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fCardImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  fCardContent: {
    flex: 1,
    padding: 12,
    flexDirection: 'column',
  },
  fCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fCardName: {
    fontSize: 12,
    fontWeight: '800',
    color: C.t1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
    marginRight: 10,
  },
  fCardTime: {
    fontSize: 10,
    fontWeight: '700',
    color: C.tm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  fCardDivider: {
    height: 1,
    backgroundColor: 'rgba(28,23,20,0.04)',
    marginBottom: 8,
  },
  fCardTitle: {
    fontFamily: SERIF,
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    color: C.t1,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  fCardBody: {
    fontSize: 12,
    fontWeight: '500',
    color: C.t2,
    lineHeight: 18,
  },
  fCardReadMoreHint: {
    fontSize: 10,
    color: C.rose,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  fCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fCardAct: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
  },
  fCardActTxt: {
    fontSize: 12,
    color: C.t2,
    fontWeight: '600',
  },
  fCardChicTheme: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  fCardChicThemeTxt: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: SERIF,
    fontStyle: 'italic',
  },
});