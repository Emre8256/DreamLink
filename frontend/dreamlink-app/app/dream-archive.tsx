// ─────────────────────────────────────────────────────────────────────────────
// dream-archive.tsx — Rüya Arşivi (Journaling Aesthetic)
// ─────────────────────────────────────────────────────────────────────────────
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EdgeToEdgeLayout } from '../components/EdgeToEdgeLayout';
import { useAuth } from '../context/AuthContext';
import {
  deleteDream,
  formatRelativeTime,
  getMyProfile,
  getUserDreams,
  THEME_TO_TURKISH,
  type DreamResponse,
  type DreamTheme,
} from '../services/api';

// ─── Constants ───────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRIMARY = '#B3717A';
const ACCENT = '#864b53';
const BG = '#f8fafd';

const HEADER_MAX = 130;
const HEADER_MIN = 60;

// ─── Filter Types ─────────────────────────────────────────────────────────────
type QuickFilter = 'all' | 'newest' | 'popular' | 'LUCID' | 'NIGHTMARE' | 'HAPPY' | 'LOVE';

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'newest', label: 'Newest' },
  { key: 'popular', label: '🔥 Popular' },
  { key: 'LUCID', label: '✨ Lucid' },
  { key: 'NIGHTMARE', label: '💀 Nightmare' },
  { key: 'HAPPY', label: '😊 Happy' },
  { key: 'LOVE', label: '❤️ Love' },
];

// ─── Theme Colour Map ─────────────────────────────────────────────────────────
const THEME_COLORS: Record<DreamTheme, { bg: string; text: string }> = {
  HAPPY: { bg: '#fef9c3', text: '#92400e' },
  SAD: { bg: '#e0f2fe', text: '#0369a1' },
  NIGHTMARE: { bg: '#fce7f3', text: '#9d174d' },
  LOVE: { bg: '#ffe4e6', text: '#9f1239' },
  LUCID: { bg: '#ede9fe', text: '#5b21b6' },
  ANGRY: { bg: '#fee2e2', text: '#991b1b' },
  EXCITED: { bg: '#fef3c7', text: '#92400e' },
  CURIOUS: { bg: '#ecfdf5', text: '#065f46' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatArchiveDate(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const date = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

// ─── Action Sheet ─────────────────────────────────────────────────────────────
const ActionSheet = ({
  visible,
  dream,
  onClose,
  onDelete,
}: {
  visible: boolean;
  dream: DreamResponse | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(300)).current;
  // Modal'ın ekranda kalma süresini kontrol eden yeni state
  const [renderModal, setRenderModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRenderModal(true); // Önce Modal'ı var et
      translateY.setValue(300); // Nereden başlayacağını garantiye al

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 300,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setRenderModal(false); // Animasyon BİTİNCE Modal'ı gizle
      });
    }
  }, [visible]);

  if (!dream && !renderModal) return null;

  const actions = [
    {
      icon: 'pencil-outline',
      label: 'Edit Dream',
      color: '#334155',
      onPress: () => {
        onClose();
        router.push(`/dream/${dream?.id}`);
      },
    },
    {
      icon: 'eye-off-outline',
      label: 'Stop Sharing',
      color: '#334155',
      onPress: () => { onClose(); },
    },
    {
      icon: 'stats-chart-outline',
      label: 'View Stats',
      color: '#334155',
      onPress: () => { onClose(); },
    },
    {
      icon: 'trash-outline',
      label: 'Delete Dream',
      color: '#ef4444',
      danger: true,
      onPress: () => {
        onClose();
        if (!dream) return;
        Alert.alert(
          'Delete Dream',
          'This dream will be permanently deleted. Do you want to continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => onDelete(dream.id),
            },
          ]
        );
      },
    },
  ];

  return (
    <Modal
      visible={renderModal} // Artık doğrudan visible'a değil, bizim state'e bağlı
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: 'rgba(26,22,20,0.4)',
          opacity: translateY.interpolate({
            inputRange: [0, 500],
            outputRange: [1, 0],
            extrapolate: 'clamp'
          })
        }
      ]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          actionStyles.sheet,
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: insets.bottom + 8,
            transform: [{ translateY }]
          }
        ]}
      >
        <View style={actionStyles.handle} />

        {dream && (
          <Text style={actionStyles.previewTitle} numberOfLines={1}>
            "{dream.title}"
          </Text>
        )}

        {actions.map((a, i) => (
          <TouchableOpacity
            key={a.label}
            style={[
              actionStyles.actionRow,
              i < actions.length - 1 && actionStyles.actionBorder,
              a.danger && actionStyles.dangerRow,
            ]}
            onPress={a.onPress}
            activeOpacity={0.7}
          >
            <View style={[actionStyles.actionIcon, a.danger && actionStyles.dangerIconWrap]}>
              <Ionicons name={a.icon as any} size={20} color={a.danger ? '#ef4444' : PRIMARY} />
            </View>
            <Text style={[actionStyles.actionLabel, a.danger && actionStyles.dangerLabel]}>
              {a.label}
            </Text>
            {!a.danger && (
              <Ionicons name="chevron-forward" size={16} color="#cbd5e1" style={{ marginLeft: 'auto' }} />
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Modal>
  );
};


const actionStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center', marginBottom: 18,
  },
  previewTitle: {
    fontSize: 13, fontWeight: '600', color: '#94a3b8',
    marginBottom: 14, textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 12,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: 4,
  },
  actionBorder: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(226,232,240,0.7)',
  },
  dangerRow: { marginTop: 8 },
  actionIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(179,113,122,0.09)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  dangerIconWrap: { backgroundColor: 'rgba(239,68,68,0.09)' },
  actionLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  dangerLabel: { color: '#ef4444' },
});

// ─── Advanced Filter Sheet ────────────────────────────────────────────────────
const THEMES: DreamTheme[] = ['HAPPY', 'SAD', 'NIGHTMARE', 'LOVE', 'LUCID', 'ANGRY', 'EXCITED', 'CURIOUS'];

const AdvancedFilterSheet = ({
  visible,
  selectedThemes,
  onToggleTheme,
  onClose,
  onApply,
}: {
  visible: boolean;
  selectedThemes: DreamTheme[];
  onToggleTheme: (t: DreamTheme) => void;
  onClose: () => void;
  onApply: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(800)).current;
  const [renderModal, setRenderModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRenderModal(true);
      translateY.setValue(800); // Başlangıç noktasını resetle

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 800,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setRenderModal(false); // Kapanma animasyonu bitince gizle
      });
    }
  }, [visible]);

  return (
    <Modal visible={renderModal} transparent animationType="none" onRequestClose={onClose}>

      <Animated.View style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: 'rgba(26,22,20,0.4)',
          opacity: translateY.interpolate({
            inputRange: [0, 800],
            outputRange: [1, 0],
            extrapolate: 'clamp'
          })
        }
      ]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          advStyles.sheet,
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY }]
          }
        ]}
      >
        <View style={actionStyles.handle} />
        <Text style={advStyles.title}>Advanced Filtering</Text>

        <Text style={advStyles.sectionLabel}>DREAM THEME</Text>
        <View style={advStyles.themeWrap}>
          {THEMES.map((t) => {
            const active = selectedThemes.includes(t);
            const c = THEME_COLORS[t];
            return (
              <TouchableOpacity
                key={t}
                style={[advStyles.chip, active && { backgroundColor: c.bg, borderColor: c.text }]}
                onPress={() => onToggleTheme(t)}
                activeOpacity={0.75}
              >
                <Text style={[advStyles.chipText, active && { color: c.text, fontWeight: '700' }]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={advStyles.applyBtn} onPress={onApply} activeOpacity={0.85}>
          <Text style={advStyles.applyText}>Apply Filter</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};


const advStyles = StyleSheet.create({
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 12,
    marginTop: 'auto',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 14,
  },
  title: {
    fontSize: 17, fontWeight: '800', color: '#1e293b',
    textAlign: 'center', marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#94a3b8',
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 12,
  },
  themeWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#f1f5f9',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  chipText: {
    fontSize: 13, fontWeight: '500', color: '#64748b',
  },
  applyBtn: {
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  applyText: {
    fontSize: 15, fontWeight: '700', color: '#fff',
  },
});

// ─── Archive Card ─────────────────────────────────────────────────────────────
const ArchiveCard = React.memo(({
  dream,
  onMenuPress,
}: {
  dream: DreamResponse;
  onMenuPress: (dream: DreamResponse) => void;
}) => {
  const { date, time } = formatArchiveDate(dream.createdAt);
  const themeColor = THEME_COLORS[dream.theme] ?? { bg: '#f1f5f9', text: '#475569' };

  return (
    <Pressable
      onPress={() => router.push(`/dream/${dream.id}`)}
      style={({ pressed }) => [cardStyles.card, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
    >
      {/* ── Top Row: Date + Menu ── */}
      <View style={cardStyles.topRow}>
        <View style={cardStyles.datePill}>
          <Ionicons name="calendar-outline" size={11} color="#94a3b8" style={{ marginRight: 4 }} />
          <Text style={cardStyles.dateText}>{date}</Text>
          <Text style={cardStyles.dot}> · </Text>
          <Ionicons name="time-outline" size={11} color="#94a3b8" style={{ marginRight: 2 }} />
          <Text style={cardStyles.dateText}>{time}</Text>
        </View>

        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => onMenuPress(dream)}
          activeOpacity={0.6}
          style={cardStyles.menuBtn}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* ── Theme Badge ── */}
      <View style={[cardStyles.themeBadge, { backgroundColor: themeColor.bg }]}>
        <Text style={[cardStyles.themeText, { color: themeColor.text }]}>
          {dream.theme}
        </Text>
      </View>

      {/* ── Title & Description ── */}
      <Text style={cardStyles.title}>{dream.title}</Text>
      <Text style={cardStyles.desc} numberOfLines={2}>{dream.description}</Text>

      {/* ── Tags ── */}
      {dream.tags?.length > 0 && (
        <View style={cardStyles.tagRow}>
          {dream.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={cardStyles.tag}>
              <Text style={cardStyles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Footer Divider + Stats ── */}
      <View style={cardStyles.divider} />
      <View style={cardStyles.footer}>
        <View style={cardStyles.stat}>
          <Ionicons name={dream.isLiked ? 'heart' : 'heart-outline'} size={14} color={dream.isLiked ? '#ef4444' : '#94a3b8'} />
          <Text style={[cardStyles.statText, dream.isLiked && { color: '#ef4444' }]}>{dream.likeCount}</Text>
        </View>
        <View style={cardStyles.stat}>
          <Ionicons name="chatbubble-outline" size={13} color="#94a3b8" />
          <Text style={cardStyles.statText}>{dream.commentCount}</Text>
        </View>

        {/* Visibility badge */}
        <View style={{ flex: 1 }} />
        <View style={[cardStyles.visBadge,
        dream.visibility === 'PUBLIC' ? cardStyles.visPub :
          dream.visibility === 'FOLLOWERS_ONLY' ? cardStyles.visFol :
            cardStyles.visPrv]}>
          <Ionicons
            name={
              dream.visibility === 'PUBLIC' ? 'globe-outline' :
                dream.visibility === 'FOLLOWERS_ONLY' ? 'people-outline' :
                  'lock-closed-outline'
            }
            size={10}
            color={
              dream.visibility === 'PUBLIC' ? '#059669' :
                dream.visibility === 'FOLLOWERS_ONLY' ? '#0284c7' :
                  '#9333ea'
            }
          />
          <Text style={[cardStyles.visText,
          dream.visibility === 'PUBLIC' ? { color: '#059669' } :
            dream.visibility === 'FOLLOWERS_ONLY' ? { color: '#0284c7' } :
              { color: '#9333ea' }]}>
            {dream.visibility === 'PUBLIC' ? 'Public' : dream.visibility === 'FOLLOWERS_ONLY' ? 'Followers' : 'Private'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});
ArchiveCard.displayName = 'ArchiveCard';

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.055,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  datePill: {
    flexDirection: 'row', alignItems: 'center',
  },
  dateText: {
    fontSize: 11, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.1,
  },
  dot: { color: '#cbd5e1', fontSize: 11 },
  menuBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.08)',
  },
  themeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, marginBottom: 10,
  },
  themeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: {
    fontSize: 17, fontWeight: '800', color: '#1e293b',
    letterSpacing: -0.3, marginBottom: 6, lineHeight: 23,
  },
  desc: {
    fontSize: 14, color: '#64748b', lineHeight: 21,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(179,113,122,0.08)',
    borderRadius: 6,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: PRIMARY },
  divider: {
    height: 1, backgroundColor: 'rgba(226,232,240,0.8)',
    marginBottom: 12,
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  visBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  visPub: { backgroundColor: '#ecfdf5' },
  visFol: { backgroundColor: '#e0f2fe' },
  visPrv: { backgroundColor: '#faf5ff' },
  visText: { fontSize: 9, fontWeight: '700', includeFontPadding: false, textAlignVertical: 'center' },
});

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ isSearch }: { isSearch: boolean }) => (
  <View style={emptyStyles.wrap}>
    <View style={emptyStyles.iconRing}>
      <Ionicons name="moon-outline" size={42} color={PRIMARY} />
    </View>
    <Text style={emptyStyles.title}>
      {isSearch ? 'No matches found' : 'No dreams recorded yet...'}
    </Text>
    <Text style={emptyStyles.sub}>
      {isSearch
        ? 'Try a different search term or filter.'
        : 'Record your first dream and start building your archive.'}
    </Text>
    {!isSearch && (
      <TouchableOpacity
        style={emptyStyles.btn}
        onPress={() => router.push('/(tabs)')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 6 }} />
        <Text style={emptyStyles.btnText}>Record My First Dream</Text>
      </TouchableOpacity>
    )}
  </View>
);

const emptyStyles = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingTop: 60,
  },
  iconRing: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(179,113,122,0.09)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 22,
    borderWidth: 1.5, borderColor: 'rgba(179,113,122,0.18)',
  },
  title: {
    fontSize: 18, fontWeight: '800', color: '#1e293b',
    textAlign: 'center', marginBottom: 10,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 14, color: '#94a3b8', textAlign: 'center',
    lineHeight: 21, marginBottom: 28,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingHorizontal: 22, paddingVertical: 13,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DreamArchiveScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth() as any;

  // Data
  const [dreams, setDreams] = useState<DreamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Search & Filter
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('all');
  const [advVisible, setAdvVisible] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<DreamTheme[]>([]);
  const [appliedThemes, setAppliedThemes] = useState<DreamTheme[]>([]);

  // Action Sheet
  const [menuDream, setMenuDream] = useState<DreamResponse | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Animated header
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_MAX - HEADER_MIN],
    outputRange: [HEADER_MAX, HEADER_MIN],
    extrapolate: 'clamp',
  });

  const searchOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const filterOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerShadow = scrollY.interpolate({
    inputRange: [20, 50],
    outputRange: [0, 0.08],
    extrapolate: 'clamp',
  });

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const profile = await getMyProfile();
      setUserId(profile.id);
      const page = await getUserDreams(profile.id, 0, 50);
      setDreams(page.content ?? []);
    } catch (e) {
      console.error('DreamArchive load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  // ── Filtered List ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...dreams];

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Quick filter
    if (activeFilter === 'newest') {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (activeFilter === 'popular') {
      list = [...list].sort((a, b) => b.likeCount - a.likeCount);
    } else if (['LUCID', 'NIGHTMARE', 'HAPPY', 'LOVE'].includes(activeFilter)) {
      list = list.filter((d) => d.theme === activeFilter);
    }

    // Advanced filter themes
    if (appliedThemes.length > 0) {
      list = list.filter((d) => appliedThemes.includes(d.theme));
    }

    return list;
  }, [dreams, query, activeFilter, appliedThemes]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDream(id);
      setDreams((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      Alert.alert('Error', 'Dream could not be deleted. Please try again.');
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="moon-outline" size={36} color="rgba(179,113,122,0.4)" />
        <Text style={styles.loadingText}>Loading archive...</Text>
      </View>
    );
  }

  return (
    <EdgeToEdgeLayout backgroundColor={BG} statusBarStyle="dark-content" statusBarBg={BG}>
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

      {/* ── Animated Sticky Header ── */}
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            shadowOpacity: headerShadow,
          },
        ]}
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={26} color="#1e293b" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>My Dream Archive</Text>
            <Animated.Text style={[styles.headerCount, { opacity: searchOpacity }]}>
              {filtered.length} dreams
            </Animated.Text>
          </View>

          <TouchableOpacity
            onPress={() => setAdvVisible(true)}
            style={[styles.filterIconBtn, appliedThemes.length > 0 && styles.filterIconActive]}
            activeOpacity={0.75}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={appliedThemes.length > 0 ? '#fff' : '#334155'}
            />
            {appliedThemes.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{appliedThemes.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <Animated.View style={[styles.searchBar, { opacity: searchOpacity }]}>
          <Ionicons name="search-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search your dreams..."
            placeholderTextColor="rgba(148,163,184,0.8)"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>

      {/* ── Quick Filter Chips (sticky below collapsed header) ── */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.chips, { opacity: filterOpacity }]}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, gap: 8, alignItems: 'center' }}
      >
        {QUICK_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, activeFilter === f.key && styles.chipActive]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, activeFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.ScrollView>

      {/* ── Dream List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <ArchiveCard
            dream={item}
            onMenuPress={(d) => { setMenuDream(d); setMenuVisible(true); }}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={<EmptyState isSearch={query.trim().length > 0 || activeFilter !== 'all'} />}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshing={refreshing}
        onRefresh={() => load(true)}
      />

      {/* ── Action Sheet ── */}
      <ActionSheet
        visible={menuVisible}
        dream={menuDream}
        onClose={() => setMenuVisible(false)}
        onDelete={handleDelete}
      />

      {/* ── Advanced Filter Sheet ── */}
      <AdvancedFilterSheet
        visible={advVisible}
        selectedThemes={selectedThemes}
        onToggleTheme={(t) =>
          setSelectedThemes((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
          )
        }
        onClose={() => setAdvVisible(false)}
        onApply={() => {
          setAppliedThemes(selectedThemes);
          setAdvVisible(false);
        }}
      />
      </View>
    </EdgeToEdgeLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },

  // Header
  header: {
    backgroundColor: BG,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 8, paddingBottom: 4,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.1)',
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 17, fontWeight: '800', color: '#1e293b',
    letterSpacing: -0.3,
  },
  headerCount: {
    fontSize: 11, fontWeight: '600', color: '#94a3b8',
    letterSpacing: 0.2, marginTop: 1,
  },
  filterIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(148,163,184,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  filterIconActive: { backgroundColor: PRIMARY },
  filterBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 8, fontWeight: '900', color: PRIMARY },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(226,232,240,0.9)',
    shadowColor: '#000', shadowOpacity: 0.03,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#1e293b',
    fontWeight: '500',
  },

  // Filter chips
  chips: {
    maxHeight: 48,
    backgroundColor: BG,
    zIndex: 9,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: 'rgba(226,232,240,0.9)',
    shadowColor: '#000', shadowOpacity: 0.03,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: PRIMARY, borderColor: ACCENT,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b', includeFontPadding: false },
  chipTextActive: { color: '#fff' },

  // List
  listContent: { paddingTop: 14, paddingBottom: 80 },
  listEmpty: { flex: 1 },
});
