import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Star, MessageCircle, Undo2 } from 'lucide-react-native';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import {
  getMyProfile,
  getUserDreams,
  deleteMyAccount,
  UserProfileResponse,
  DreamResponse,
} from '../../services/api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const QS_BOLD = 'Quicksand_700Bold';
const QS_MEDIUM = 'Quicksand_500Medium'; 
const SERIF = Platform.OS === 'ios' ? 'Baskerville' : 'serif';

const C = {
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
  upgrade_vibrant: ['#FFC2CC', '#A63F4F'] as const,
};

const FONT_SIZES = {
  small_label: 11,
  body: 14,
  button_small: 13,
  sub_title: 18,
  hero_title: 22,
  table: 11,
};

const SCREEN_W = Dimensions.get('window').width;
const STAT_CARD_WIDTH = (SCREEN_W - 48 - 24) / 4; // 24px padding*2, 8px gap*3

const SAMPLE_PHOTO = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80';

type TabKey = 'plans' | 'journal' | 'aura';

// ─── Settings Config ──────────────────────────────────────────────────────────
const SETTINGS_CATEGORIES = [
  { key: 'account', label: 'Account', icon: 'person-outline' },
  { key: 'subscriptions', label: 'Subscriptions', icon: 'star-outline' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
  { key: 'privacy', label: 'Privacy', icon: 'lock-closed-outline' },
  { key: 'data', label: 'Data & Legal', icon: 'document-text-outline' },
  { key: 'support', label: 'Support & About', icon: 'help-circle-outline' },
] as const;
type SettingsCategoryKey = (typeof SETTINGS_CATEGORIES)[number]['key'] | null;

// ─── SettingsRow ──────────────────────────────────────────────────────────────
const SettingsRow = ({
  iconName, label, type, value, onPress, onToggle, iconColor, danger, divider,
}: {
  iconName: string; label: string; type: 'link' | 'toggle' | 'danger';
  value?: boolean; onPress?: () => void; onToggle?: (v: boolean) => void;
  iconColor?: string; danger?: boolean; divider?: boolean;
}) => (
  <>
    <TouchableOpacity
      activeOpacity={type !== 'toggle' ? 0.7 : 1}
      onPress={type !== 'toggle' ? onPress : undefined}
      style={[SR.row, danger && SR.dangerRow]}
      disabled={type === 'toggle'}
    >
      <Ionicons name={iconName as any} size={19} color={iconColor || (danger ? '#D14343' : '#64748b')} style={{ marginRight: 14 }} />
      <Text style={[SR.label, danger && SR.dangerLabel]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {type === 'link' && <Ionicons name="chevron-forward" size={17} color="#B0B3C6" />}
      {type === 'toggle' && (
        <Switch value={!!value} onValueChange={onToggle} trackColor={{ true: C.primary, false: '#d1d5db' }} thumbColor="#fff" />
      )}
    </TouchableOpacity>
    {divider && <View style={{ height: 0.5, backgroundColor: '#e2e8f0', marginLeft: 48 }} />}
  </>
);
const SR = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: 'rgba(148,163,184,0.13)' },
  label: { fontSize: 14, color: '#334155', fontWeight: '500' },
  dangerRow: { backgroundColor: 'rgba(255,0,0,0.03)' },
  dangerLabel: { color: '#D14343', fontWeight: '600' },
});

// ─── SectionCard ──────────────────────────────────────────────────────────────
const SectionCard = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <View style={{ backgroundColor: '#FFF', borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3, overflow: 'hidden' }}>
    {title && <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', paddingTop: 14, paddingBottom: 3, paddingHorizontal: 16, letterSpacing: 1.3, textTransform: 'uppercase' }}>{title}</Text>}
    {children}
  </View>
);

// ─── Mock Dream Data ──────────────────────────────────────────────────────────
const MOCK_DREAMS = [
  { id: '1', createdAt: new Date().toISOString(), title: 'The Floating Island', description: 'A vast island suspended above silver clouds, drifting toward a silent horizon.', theme: 'LUCID' },
  { id: '2', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), title: 'Midnight Forest', description: 'Enormous stone blocks gliding between dark ancient trees under a moonless sky.', theme: 'CURIOUS' },
  { id: '3', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), title: 'Glass Ocean', description: 'Walking on perfectly still water that mirrored another world beneath the surface.', theme: 'CALM' },
  { id: '4', createdAt: new Date(Date.now() - 86400000 * 9).toISOString(), title: 'The Red Library', description: 'Infinite shelves of books written in languages I somehow understood but forgot upon waking.', theme: 'MYSTERIOUS' },
  { id: '5', createdAt: new Date(Date.now() - 86400000 * 14).toISOString(), title: 'Shadow Messenger', description: 'A figure made of smoke carrying a letter sealed with an unfamiliar sigil.', theme: 'SYMBOLIC' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [journal, setJournal] = useState<DreamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('plans');

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentSubPage, setCurrentSubPage] = useState<SettingsCategoryKey>(null);

  // Notification toggles
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifLike, setNotifLike] = useState(true);
  const [notifPostLike, setNotifPostLike] = useState(true);
  const [notifDreamLike, setNotifDreamLike] = useState(true);
  const [notifMessage, setNotifMessage] = useState(true);
  const [notifComment, setNotifComment] = useState(true);
  const [notifStreak, setNotifStreak] = useState(true);

  // Privacy toggles
  const [privRegion, setPrivRegion] = useState(true);
  const [privAge, setPrivAge] = useState(true);
  const [privOnline, setPrivOnline] = useState(true);
  const [privLikeCount, setPrivLikeCount] = useState(true);
  const [privFollowers, setPrivFollowers] = useState(true);
  const [privStreak, setPrivStreak] = useState(true);
  const [privAds, setPrivAds] = useState(true);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFinalDeleteModal, setShowFinalDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const upgradePulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(upgradePulseAnim, { toValue: 1.05, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(upgradePulseAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    const run = async () => {
      try {
        const data = await getMyProfile();
        if (mounted) setProfile(data);
        try {
          const dreams = await getUserDreams(data.id, 0, 5);
          if (mounted) setJournal(dreams.content ?? []);
        } catch { if (mounted) setJournal([]); }
      } catch (e) { console.error(e); }
      finally { if (mounted) setLoading(false); }
    };
    run();
    return () => { mounted = false; };
  }, []));

  const handleLogout = async () => { await logout(); };

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirmation required', 'Type DELETE to continue.');
      return;
    }
    setDeleting(true);
    try {
      await deleteMyAccount();
      await logout();
      setShowFinalDeleteModal(false);
      setShowDeleteModal(false);
      setConfirmText('');
      router.replace('/login');
    } catch {
      Alert.alert('Error', 'Account could not be deleted.');
    } finally { setDeleting(false); }
  };

  const handleSettingsBack = () => {
    currentSubPage !== null ? setCurrentSubPage(null) : setShowSettingsModal(false);
  };

  const settingsHeaderTitle = useMemo(() =>
    currentSubPage === null
      ? 'Settings'
      : (SETTINGS_CATEGORIES.find(c => c.key === currentSubPage)?.label ?? 'Settings'),
    [currentSubPage]
  );

  const renderSettingsContent = () => {
    switch (currentSubPage) {
      case 'account': return (
        <>
          <SectionCard title="Account">
            <SettingsRow iconName="mail-outline" label="Email" type="link" onPress={() => {}} divider />
            <SettingsRow iconName="key-outline" label="Password" type="link" onPress={() => {}} />
          </SectionCard>
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <TouchableOpacity onPress={() => setShowDeleteModal(true)} activeOpacity={0.6} style={{ padding: 8 }}>
              <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 12, textDecorationLine: 'underline' }}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </>
      );
      case 'subscriptions': return (
        <SectionCard title="Subscriptions">
          <SettingsRow iconName="star" label="Manage Subscriptions" type="link" iconColor={C.primary} onPress={() => {}} />
        </SectionCard>
      );
      case 'notifications': return (
        <>
          <SectionCard title="Activity">
            <SettingsRow iconName="flame-outline" label="New match" type="toggle" value={notifMatch} onToggle={setNotifMatch} divider />
            <SettingsRow iconName="heart-outline" label="New profile like" type="toggle" value={notifLike} onToggle={setNotifLike} divider />
            <SettingsRow iconName="thumbs-up-outline" label="New post like" type="toggle" value={notifPostLike} onToggle={setNotifPostLike} divider />
            <SettingsRow iconName="moon-outline" label="New dream like" type="toggle" value={notifDreamLike} onToggle={setNotifDreamLike} divider />
            <SettingsRow iconName="chatbubble-outline" label="New message" type="toggle" value={notifMessage} onToggle={setNotifMessage} divider />
            <SettingsRow iconName="chatbox-ellipses-outline" label="New comment" type="toggle" value={notifComment} onToggle={setNotifComment} divider />
            <SettingsRow iconName="sparkles-outline" label="Streaks" type="toggle" value={notifStreak} onToggle={setNotifStreak} />
          </SectionCard>
          <SectionCard title="System">
            <SettingsRow iconName="volume-high-outline" label="Sound and vibration" type="link" onPress={() => {}} />
          </SectionCard>
        </>
      );
      case 'privacy': return (
        <>
          <SectionCard title="Profile Visibility">
            <SettingsRow iconName="location-outline" label="Show region" type="toggle" value={privRegion} onToggle={setPrivRegion} divider />
            <SettingsRow iconName="calendar-outline" label="Show age" type="toggle" value={privAge} onToggle={setPrivAge} divider />
            <SettingsRow iconName="radio-outline" label="Show online status" type="toggle" value={privOnline} onToggle={setPrivOnline} />
          </SectionCard>
          <SectionCard title="Social">
            <SettingsRow iconName="stats-chart-outline" label="Show like count" type="toggle" value={privLikeCount} onToggle={setPrivLikeCount} divider />
            <SettingsRow iconName="people-outline" label="Show following & followers" type="toggle" value={privFollowers} onToggle={setPrivFollowers} divider />
            <SettingsRow iconName="flame-outline" label="Show streak" type="toggle" value={privStreak} onToggle={setPrivStreak} />
          </SectionCard>
          <SectionCard title="Ads">
            <SettingsRow iconName="pricetag-outline" label="Personalized ads" type="toggle" value={privAds} onToggle={setPrivAds} />
          </SectionCard>
        </>
      );
      case 'data': return (
        <SectionCard title="Data & Legal">
          <SettingsRow iconName="document-text-outline" label="Personal data collection" type="link" onPress={() => {}} divider />
          <SettingsRow iconName="shield-checkmark-outline" label="Third-party data collection" type="link" onPress={() => {}} />
        </SectionCard>
      );
      case 'support': return (
        <SectionCard title="Support & About">
          <SettingsRow iconName="help-circle-outline" label="Help" type="link" onPress={() => {}} divider />
          <SettingsRow iconName="star-outline" label="Rate Dream-Link" type="link" iconColor={C.primary} onPress={() => {}} divider />
          <SettingsRow iconName="information-circle-outline" label="About" type="link" onPress={() => {}} />
        </SectionCard>
      );
      default: return (
        <>
          <View style={{ backgroundColor: '#fff', borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)', overflow: 'hidden' }}>
            {SETTINGS_CATEGORIES.map((cat, i) => (
              <React.Fragment key={cat.key}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCurrentSubPage(cat.key)}
                  style={[SR.row, { borderBottomWidth: i === SETTINGS_CATEGORIES.length - 1 ? 0 : 1 }]}
                >
                  <Ionicons name={cat.icon as any} size={19} color="#64748b" style={{ marginRight: 14 }} />
                  <Text style={SR.label}>{cat.label}</Text>
                  <View style={{ flex: 1 }} />
                  <Ionicons name="chevron-forward" size={17} color="#B0B3C6" />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
          <View style={{ alignItems: 'center', gap: 16, marginBottom: 50 }}>
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
              style={{ width: '88%', backgroundColor: '#fff5f5', paddingVertical: 14, borderRadius: 13, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}
            >
              <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 14, fontFamily: QS_BOLD }}>Sign Out</Text>
            </TouchableOpacity>
            <Text style={{ color: C.textLight, fontSize: 10, fontWeight: '500' }}>DreamLink v1.2.4</Text>
          </View>
        </>
      );
    }
  };

  if (loading) {
    return <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  const dreamsToRender = journal.length > 0
    ? journal.slice(0, 5).map(d => ({ ...d, id: String(d.id) }))
    : MOCK_DREAMS;

  // ─── Tab: Plans ───────────────────────────────────────────────────────────
  const renderPlans = () => (
    <View style={styles.tabContent}>
      <View style={styles.premiumTable}>
        <View style={styles.tableRowHeader}>
          <Text style={[styles.tableCellLeft, styles.tableHeaderText]}>FEATURE</Text>
          <Text style={[styles.tableCellCenter, styles.tableHeaderText]}>FREE</Text>
          <Text style={[styles.tableCellRight, styles.tableHeaderText, { color: C.primary }]}>PREMIUM</Text>
        </View>
        {[
          { label: 'UNLIMITED LIKES' },
          { label: 'SEE WHO LIKES YOU' },
          { label: 'ADVANCED FILTERS' },
          { label: 'ADVANCED DREAM ANALYSIS' },
          { label: 'UNLIMITED REWINDS' },
          { label: 'SUBCONSCIOUS WORD CLOUD' },
          { label: 'PRIORITY MATCHING' },
        ].map((row, i, arr) => (
          <View key={row.label} style={[styles.tableRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.tableCellLeft}>{row.label}</Text>
            <Text style={styles.tableCellCenter}>✕</Text>
            <Text style={[styles.tableCellRight, { color: C.primary, fontWeight: '800' }]}>✓</Text>
          </View>
        ))}
        <View style={styles.tableFooter}>
          <Animated.View style={[styles.upgradeBtnPulse, { transform: [{ scale: upgradePulseAnim }] }]}>
            <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.88}>
              <LinearGradient colors={C.upgrade_vibrant} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeGradient}>
                <Text style={styles.upgradeBtnText}>UPGRADE TO PREMIUM</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );

  // ─── Tab: Dream Journal ───────────────────────────────────────────────────
  const renderJournal = () => (
    <View style={styles.tabContent}>
      <View style={styles.timelineContainer}>
        {dreamsToRender.map((d: any, index: number) => {
          const dateObj = new Date(d.createdAt);
          const day = dateObj.getDate();
          const mon = MONTH_NAMES[dateObj.getMonth()];
          const yr = dateObj.getFullYear();
          const isLast = index === dreamsToRender.length - 1;
          return (
            <TouchableOpacity
              key={d.id}
              activeOpacity={0.75}
              onPress={() => router.push(`/dream/${d.id}`)}
              style={styles.timelineItem}
            >
              {/* Date column */}
              <View style={styles.tlDateCol}>
                <Text style={styles.tlDay}>{day}</Text>
                <Text style={styles.tlMon}>{mon}</Text>
                <Text style={styles.tlYr}>{yr}</Text>
              </View>

              {/* Spine */}
              <View style={styles.tlSpineCol}>
                <View style={styles.tlDot} />
                {!isLast && <View style={styles.tlLine} />}
              </View>

              {/* Card */}
              <View style={styles.tlCard}>
                <Text style={styles.tlTitle}>{d.title}</Text>
                <Text style={styles.tlDesc} numberOfLines={2}>{d.description}</Text>
                <View style={styles.tlFooter}>
                  <Text style={styles.tlTheme}>{d.theme || 'DREAM'}</Text>
                  <Ionicons name="chevron-forward" size={13} color={C.roseMd} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.archiveBtn}
        activeOpacity={0.7}
        onPress={() => router.push('/dream-archive')}
      >
        <Text style={styles.archiveBtnText}>View All Archive</Text>
        <Ionicons name="arrow-forward" size={14} color={C.primary} style={{ marginLeft: 6 }} />
      </TouchableOpacity>
    </View>
  );

  // ─── Tab: Aura Analysis ───────────────────────────────────────────────────
  const renderAura = () => (
    <View style={styles.tabContent}>
      {/* Archetype card */}
      <View style={styles.auraArchetypeCard}>
        <View style={styles.auraArchetypeAccent} />
        <View style={{ flex: 1, paddingLeft: 16 }}>
          <Text style={styles.auraSmallLabel}>DREAM ARCHETYPE</Text>
          <Text style={styles.auraArchetypeTitle}>Lucid Wanderer</Text>
          <Text style={styles.auraArchetypeSub}>You navigate dreamscapes with rare intentionality</Text>
        </View>
        <Text style={{ fontSize: 32, marginRight: 18 }}>🌙</Text>
      </View>

      {/* Stats row */}
      <View style={styles.auraStatsRow}>
        {[
          { icon: 'moon-outline', label: 'DREAMS/MO', value: '7' },
          { icon: 'flash-outline', label: 'LUCIDITY', value: 'High' },
          { icon: 'heart-outline', label: 'MOOD TONE', value: 'Calm' },
        ].map((s, i) => (
          <View key={i} style={styles.auraStatCard}>
            <Ionicons name={s.icon as any} size={16} color={C.primary} style={{ marginBottom: 6 }} />
            <Text style={styles.auraStatValue}>{s.value}</Text>
            <Text style={styles.auraStatLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Dominant themes */}
      <View style={styles.auraThemesCard}>
        <Text style={styles.auraSmallLabel}>DOMINANT THEMES</Text>
        {[
          { label: 'Exploration', pct: 0.78 },
          { label: 'Transformation', pct: 0.61 },
          { label: 'Connection', pct: 0.44 },
          { label: 'Conflict', pct: 0.29 },
        ].map(t => (
          <View key={t.label} style={styles.auraThemeRow}>
            <Text style={styles.auraThemeLabel}>{t.label}</Text>
            <View style={styles.auraThemeBarBg}>
              <View style={[styles.auraThemeBarFill, { width: `${Math.round(t.pct * 100)}%` as any }]} />
            </View>
            <Text style={styles.auraThemePct}>{Math.round(t.pct * 100)}%</Text>
          </View>
        ))}
      </View>

      {/* Locked section */}
      <View style={styles.auraLockedWrapper}>
        <View style={styles.auraGhostContent} pointerEvents="none">
          <Text style={[styles.auraSmallLabel, { marginBottom: 10 }]}>SUBCONSCIOUS SYMBOLS</Text>
          <View style={styles.auraWordCloud}>
            {['shadow', 'light', 'water', 'flight', 'mirror', 'void', 'forest', 'door', 'fire', 'labyrinth'].map(w => (
              <View key={w} style={styles.auraWordPill}>
                <Text style={styles.auraWordText}>{w}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.auraSmallLabel, { marginTop: 18, marginBottom: 10 }]}>EMOTIONAL RHYTHM</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 44 }}>
            {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.45].map((h, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: `${Math.round(h * 100)}%` as any,
                  backgroundColor: i % 2 === 0 ? C.roseLt : C.roseMd,
                  borderRadius: 4,
                  opacity: 0.75,
                }}
              />
            ))}
          </View>
        </View>

        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.88)', 'rgba(255,255,255,1)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.auraLockCard}>
          <Ionicons name="lock-closed-outline" size={22} color={C.primary} style={{ marginBottom: 10 }} />
          <Text style={styles.auraLockTitle}>Full Analysis is Premium</Text>
          <Text style={styles.auraLockSub}>Unlock word clouds, emotional rhythm{'\n'}& complete archetype breakdown</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/premium-upsell')}
            style={styles.auraLockBtn}
          >
            <LinearGradient
              colors={C.upgrade_vibrant}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.auraLockBtnGradient}
            >
              <Text style={styles.auraLockBtnText}>Unlock with Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ─── Header ─── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsIcon} onPress={() => { setCurrentSubPage(null); setShowSettingsModal(true); }} activeOpacity={0.6}>
          <Ionicons name="settings-outline" size={24} color={C.textMain} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 8 }} showsVerticalScrollIndicator={false}>

        {/* ─── 1. Avatar + Identity ─── */}
        <View style={styles.identitySection}>
          <View style={styles.identityRow}>
            <TouchableOpacity
              style={styles.avatarProgressWrapper}
              activeOpacity={0.85}
              onPress={() => router.push('/profile-preview')}
            >
              <View style={styles.ringOuter}>
                <View style={styles.ringInner}>
                  <Image source={{ uri: profile?.avatarUrl || SAMPLE_PHOTO }} style={styles.avatarBubbleImage} />
                </View>
              </View>
              <View style={styles.percentagePillBadge}>
                <Text style={styles.percentagePillBadgeText}>85%</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.identityInfo}>
              <Text style={styles.nameAgeText}>{profile?.nickname || 'User'}, {profile?.age || 26}</Text>
              <TouchableOpacity style={styles.completeBtn} onPress={() => router.push('/edit-profile')} activeOpacity={0.85}>
                <Text style={styles.completeBtnText}>Complete Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ─── 2. Token Counters ─── */}
        <View style={styles.tokenSectionWrapper}>
          <View style={styles.tokenSection}>
            {([
              { label: 'BOOST',     value: 3,  Icon: Zap,           color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'   },
              { label: 'SUPERLIKE', value: 12, Icon: Star,          color: '#A63F4F', bg: 'rgba(166,63,79,0.1)'    },
              { label: 'WHISPER',   value: 2,  Icon: MessageCircle, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)'   },
              { label: 'REWIND',    value: 5,  Icon: Undo2,     color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'   },
            ] as const).map(({ label, value, Icon, color, bg }) => (
              <TouchableOpacity
                key={label}
                style={[styles.tokenBox, { width: STAT_CARD_WIDTH }]}
                onPress={() => router.push('/premium-upsell')}
                activeOpacity={0.75}
              >
                <View style={[styles.tokenIconWrap, { backgroundColor: bg }]}>
                  <Icon size={20} color={color} strokeWidth={2.5} />
                </View>
                <Text style={styles.tokenValue}>{value}</Text>
                <Text style={styles.tokenLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── 3. Pill Tab Menu ─── */}
        <View style={styles.pillTabBar}>
          {([
            { key: 'plans', label: 'Plans' },
            { key: 'journal', label: 'Journal' },
            { key: 'aura', label: 'Analysis' },
          ] as { key: TabKey; label: string }[]).map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.78}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.pillTab, active && styles.pillTabActive]}
              >
                <Text style={[styles.pillTabText, active && styles.pillTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 4. Tab Content ─── */}
        <View style={styles.section}>
          {activeTab === 'plans' && renderPlans()}
          {activeTab === 'journal' && renderJournal()}
          {activeTab === 'aura' && renderAura()}
        </View>

      </ScrollView>

      {/* ─── Settings Modal ─── */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={false}
        presentationStyle="fullScreen"
        onRequestClose={handleSettingsBack}
        onShow={() => StatusBar.setBarStyle('dark-content', true)}
      >
        <View style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={{ paddingTop: insets.top, paddingHorizontal: 22, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 0.5, borderBottomColor: C.borderLight, backgroundColor: '#FFF' }}>
            <TouchableOpacity style={{ width: 36, alignItems: 'flex-start', justifyContent: 'center' }} onPress={handleSettingsBack} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={C.primary} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontFamily: QS_BOLD, fontWeight: '700', color: C.textMain, letterSpacing: -0.3 }}>{settingsHeaderTitle}</Text>
            <View style={{ width: 36 }} />
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
            {renderSettingsContent()}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Delete Step 1 ─── */}
      <Modal transparent visible={showDeleteModal} animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={MD.backdrop}>
          <View style={MD.card}>
            <Text style={MD.title}>Delete account?</Text>
            <Text style={MD.txt}>This action cannot be undone. All your profile data, dreams and related info will be permanently deleted.</Text>
            <View style={MD.actions}>
              <TouchableOpacity style={MD.cancel} onPress={() => setShowDeleteModal(false)}>
                <Text style={MD.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={MD.danger} onPress={() => { setShowDeleteModal(false); setShowFinalDeleteModal(true); }}>
                <Text style={MD.dangerTxt}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Delete Step 2 ─── */}
      <Modal transparent visible={showFinalDeleteModal} animationType="fade" onRequestClose={() => setShowFinalDeleteModal(false)}>
        <View style={MD.backdrop}>
          <View style={MD.card}>
            <Text style={MD.title}>Final Confirmation</Text>
            <Text style={MD.txt}>Type DELETE below to confirm.</Text>
            <TextInput
              style={MD.input}
              autoCapitalize="characters"
              value={confirmText}
              onChangeText={setConfirmText}
              editable={!deleting}
              placeholder="DELETE"
              placeholderTextColor="#A3A8C2"
            />
            <View style={MD.actions}>
              <TouchableOpacity style={MD.cancel} onPress={() => { setShowFinalDeleteModal(false); setConfirmText(''); }} disabled={deleting}>
                <Text style={MD.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={MD.danger} onPress={handleDeleteAccount} disabled={deleting}>
                {deleting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={MD.dangerTxt}>Delete Permanently</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 14,
    backgroundColor: C.bg,
  },
  headerTitle: {
    fontFamily: QS_BOLD,
    fontSize: FONT_SIZES.hero_title,
    fontWeight: '700',
    color: C.textMain,
    letterSpacing: -0.3,
  },
  settingsIcon: {
    width: 40, height: 40,
    alignItems: 'flex-end', justifyContent: 'center',
  },

  // Identity
  identitySection: { paddingHorizontal: 24, marginTop: 23, marginBottom: 20 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatarProgressWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  ringOuter: { width: 88, height: 88, borderRadius: 44, borderWidth: 3.5, borderColor: C.primary, borderLeftColor: C.roseLt, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: C.bg, transform: [{ rotate: '-45deg' }], overflow: 'hidden' },
  avatarBubbleImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  percentagePillBadge: { position: 'absolute', bottom: -10, backgroundColor: C.roseDk, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 2.5, borderColor: C.bg },
  percentagePillBadgeText: { fontFamily: QS_BOLD, fontSize: 11, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  identityInfo: { flex: 1, justifyContent: 'center', gap: 12 },
  nameAgeText: { fontFamily: QS_BOLD, fontSize: 20, fontWeight: '700', color: C.textMain, letterSpacing: -0.3 },
  completeBtn: { backgroundColor: C.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, alignSelf: 'flex-start', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  completeBtnText: { fontFamily: QS_BOLD, fontSize: 12, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.3 },

  // Token counters
  tokenSectionWrapper: { paddingHorizontal: 24, marginBottom: 24 },
  tokenSection: { flexDirection: 'row', gap: 8 },
  tokenBox: { backgroundColor: C.bg, borderRadius: 16, paddingVertical: 14, paddingTop: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.borderLight, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tokenIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tokenBoxPremium: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(166,63,79,0.15)', shadowColor: C.primary, shadowOpacity: 0.05, shadowRadius: 10 },
  tokenLabel: { fontFamily: QS_BOLD, fontSize: 9, color: C.textLight, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 },
  tokenValue: { fontFamily: QS_BOLD, fontSize: 18, color: C.textMain, fontWeight: '800' },

  // Pill Tab Bar
  pillTabBar: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginBottom: 28,
    backgroundColor: 'transparent',
    borderRadius: 50,
    padding: 0,
    borderWidth: 0,
  },
  pillTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  pillTabActive: {
    backgroundColor: 'transparent',
    borderBottomColor: C.primary,
    shadowColor: 'transparent',
  },
  pillTabText: {
    fontFamily: QS_BOLD,
    fontSize: 14,
    color: C.textMuted,
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  pillTabTextActive: {
    fontFamily: QS_BOLD,
    fontSize: 14,
    color: C.primary,
    letterSpacing: 0.3,
    lineHeight: 20,
  },

  // Section wrapper
  section: { paddingHorizontal: 22, marginBottom: 42 },
  tabContent: {},

  // ─── Plans Tab ───
  premiumTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 3,
  },
  tableRowHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.borderLight, paddingVertical: 14 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(228,228,231,0.5)', paddingVertical: 15 },
  tableHeaderText: { fontFamily: QS_BOLD, fontSize: FONT_SIZES.small_label - 1, fontWeight: '800', color: C.textLight, letterSpacing: 1.2 },
  tableCellLeft: { flex: 2.2, paddingLeft: 16, fontFamily: QS_BOLD, fontSize: FONT_SIZES.table, fontWeight: '700', color: C.textMain, letterSpacing: 0.6, lineHeight: 18 },
  tableCellCenter: { flex: 0.9, textAlign: 'center', fontFamily: QS_BOLD, fontSize: FONT_SIZES.table + 1, color: C.textLight, fontWeight: '700' },
  tableCellRight: { flex: 0.9, textAlign: 'center', fontFamily: QS_BOLD, fontSize: FONT_SIZES.table + 1, color: C.primary, fontWeight: '700' },
  tableFooter: { paddingTop: 14, paddingBottom: 24, alignItems: 'center' },
  upgradeBtnPulse: { alignSelf: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4, borderRadius: 14, backgroundColor: '#FFFFFF' },
  upgradeBtn: { borderRadius: 14, overflow: 'hidden' },
  upgradeGradient: { paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center' },
  upgradeBtnText: { fontFamily: QS_BOLD, fontSize: FONT_SIZES.button_small, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },

  // ─── Journal Tab (Premium & Soft UI) ───
  timelineContainer: { paddingLeft: 4, paddingTop: 8 },
  timelineItem: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 20 },
  
  // Sol Tarih Sütunu (Daha yumuşak ve zarif)
  tlDateCol: { width: 42, alignItems: 'center', paddingTop: 2 },
  tlDay: { fontFamily: QS_BOLD, fontSize: 18, fontWeight: '800', color: '#334155', lineHeight: 22 }, // Tam siyah yerine tok gri
  tlMon: { fontFamily: QS_BOLD, fontSize: 10, fontWeight: '700', color: C.primary, letterSpacing: 1, textTransform: 'uppercase', lineHeight: 14 },
  tlYr: { fontFamily: QS_BOLD, fontSize: 9, fontWeight: '600', color: C.textLight, letterSpacing: 0.5, lineHeight: 12 },
  
  // Orta Çizgi (Daha ince, Apple tarzı)
  tlSpineCol: { width: 20, alignItems: 'center', paddingTop: 8 },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 2.5, borderColor: C.roseMd, zIndex: 1 }, // İçi boş, zarif halka
  tlLine: { width: 1.5, flex: 1, backgroundColor: '#F1F5F9', marginTop: 4, marginBottom: -20 }, // Pembe yerine soft gri, kesintisiz his
  
  // Rüya Kartı (Çerçevesiz, Yumuşak Gölgeli)
  tlCard: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Daha yuvarlak köşeler
    padding: 18,
    // Çerçeve (border) tamamen kaldırıldı, yerine Soft Shadow eklendi
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tlTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', fontStyle: 'italic', color: '#000000', marginBottom: 6, lineHeight: 22 },
  tlDesc: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 12 },
  
  // Alt Kısım (Tema etiketi hap tasarıma çevrildi)
  tlFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tlTheme: { 
    fontFamily: QS_BOLD, 
    fontSize: 10, 
    fontWeight: '800', 
    color: C.primary, 
    backgroundColor: C.roseLt, // Arkaplan rengi eklendi (Hap görünümü)
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    letterSpacing: 0.8, 
    textTransform: 'uppercase',
    overflow: 'hidden'
  },
  
  // Arşiv Butonu
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    backgroundColor: '#F8FAFC', // İçinin beyaz kalması için soft arkaplan
  },
  archiveBtnText: { fontFamily: QS_BOLD, fontSize: 14, fontWeight: '700', color: '#111111' },

  // ─── Aura Tab ───
  auraSmallLabel: {
    fontFamily: QS_BOLD,
    fontSize: 10,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  auraArchetypeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  auraArchetypeAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: C.primary,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  auraArchetypeTitle: {
    fontFamily: SERIF,
    fontSize: 19,
    fontStyle: 'italic',
    color: C.textMain,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 24,
  },
  auraArchetypeSub: { fontFamily: QS_BOLD, fontSize: 12, color: C.textMuted, lineHeight: 17 },

  auraStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  auraStatCard: {
    flex: 1,
    backgroundColor: C.sand,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  auraStatValue: { fontFamily: QS_BOLD, fontSize: 16, fontWeight: '800', color: C.textMain, marginBottom: 2 },
  auraStatLabel: {
    fontFamily: QS_BOLD,
    fontSize: 9,
    fontWeight: '700',
    color: C.textLight,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  auraThemesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  auraThemeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  auraThemeLabel: { fontFamily: QS_BOLD, fontSize: 12, fontWeight: '600', color: C.textMuted, width: 100 },
  auraThemeBarBg: { flex: 1, height: 6, backgroundColor: C.roseLt, borderRadius: 3, overflow: 'hidden' },
  auraThemeBarFill: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  auraThemePct: { fontFamily: QS_BOLD, fontSize: 11, fontWeight: '700', color: C.textLight, width: 32, textAlign: 'right' },

  auraLockedWrapper: { position: 'relative', minHeight: 310 },
  auraGhostContent: { padding: 4 },
  auraWordCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 4 },
  auraWordPill: {
    backgroundColor: C.roseLt,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(166,63,79,0.1)',
  },
  auraWordText: { fontFamily: QS_BOLD, fontSize: 11, fontWeight: '700', color: C.primary },

  auraLockCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(166,63,79,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  auraLockTitle: { fontFamily: QS_BOLD, fontSize: 15, fontWeight: '700', color: C.textMain, marginBottom: 6, letterSpacing: -0.2 },
  auraLockSub: { fontFamily: QS_BOLD, fontSize: 12, color: C.textMuted, lineHeight: 18, textAlign: 'center', marginBottom: 16 },
  auraLockBtn: { borderRadius: 12, overflow: 'hidden', alignSelf: 'stretch' },
  auraLockBtnGradient: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  auraLockBtnText: { fontFamily: QS_BOLD, fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});

// ─── Delete Modal Styles ───────────────────────────────────────────────────────
const MD = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  card: { width: '100%', backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#2D2D3A', marginBottom: 8 },
  txt: { fontSize: 13, color: '#5E5E72', lineHeight: 19, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#D9DDF0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: '#2D2D3A', fontSize: 13, marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancel: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 9, backgroundColor: '#EEF1FF' },
  cancelTxt: { color: '#3B4570', fontWeight: '600', fontSize: 13 },
  danger: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 9, backgroundColor: '#D14343', minWidth: 110, alignItems: 'center', justifyContent: 'center' },
  dangerTxt: { color: '#FFF', fontWeight: '600', fontSize: 13 },
});
