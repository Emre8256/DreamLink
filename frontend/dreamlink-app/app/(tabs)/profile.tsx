import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Star, MessageCircle, Undo2, Moon } from 'lucide-react-native';
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
import { EdgeToEdgeLayout } from '../../components/EdgeToEdgeLayout';
import { PageContent } from '../../components/PageContent';
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
const STAT_CARD_WIDTH = (SCREEN_W - 48 - 24) / 4; 

const SAMPLE_PHOTO = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80';

type TabKey = 'plans' | 'journal' | 'aura';

const SETTINGS_CATEGORIES = [
  { key: 'account', label: 'Account', icon: 'person-outline' },
  { key: 'subscriptions', label: 'Subscriptions', icon: 'star-outline' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
  { key: 'privacy', label: 'Privacy', icon: 'lock-closed-outline' },
  { key: 'data', label: 'Data & Legal', icon: 'document-text-outline' },
  { key: 'support', label: 'Support & About', icon: 'help-circle-outline' },
] as const;
type SettingsCategoryKey = (typeof SETTINGS_CATEGORIES)[number]['key'] | null;

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

const SectionCard = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <View style={{ backgroundColor: '#FFF', borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3, overflow: 'hidden' }}>
    {title && <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', paddingTop: 14, paddingBottom: 3, paddingHorizontal: 16, letterSpacing: 1.3, textTransform: 'uppercase' }}>{title}</Text>}
    {children}
  </View>
);

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

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentSubPage, setCurrentSubPage] = useState<SettingsCategoryKey>(null);

  const [notifMatch, setNotifMatch] = useState(true);
  const [notifLike, setNotifLike] = useState(true);
  const [notifPostLike, setNotifPostLike] = useState(true);
  const [notifDreamLike, setNotifDreamLike] = useState(true);
  const [notifMessage, setNotifMessage] = useState(true);
  const [notifComment, setNotifComment] = useState(true);
  const [notifStreak, setNotifStreak] = useState(true);

  const [privRegion, setPrivRegion] = useState(true);
  const [privAge, setPrivAge] = useState(true);
  const [privOnline, setPrivOnline] = useState(true);
  const [privLikeCount, setPrivLikeCount] = useState(true);
  const [privFollowers, setPrivFollowers] = useState(true);
  const [privStreak, setPrivStreak] = useState(true);
  const [privAds, setPrivAds] = useState(true);

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
const PremiumFeatureCard = ({ icon, title, description, isPremium = false }: { icon: string; title: string; description: string; isPremium?: boolean }) => (
  <View style={[styles.featureCard, isPremium && styles.featureCardPremium]}>
    <View style={[styles.featureIconWrap, isPremium && styles.featureIconWrapPremium]}>
      <Text style={styles.featureIcon}>{icon}</Text>
    </View>
    <View style={styles.featureContent}>
      <Text style={[styles.featureTitle, isPremium && styles.featureTitlePremium]}>{title}</Text>
      <Text style={styles.featureDesc}>{description}</Text>
    </View>
    {isPremium && (
      <View style={styles.featureBadge}>
        <Text style={styles.featureBadgeText}>PRO</Text>
      </View>
    )}
  </View>
);

const renderPlans = () => (
  <View style={styles.tabContent}>
    <View style={styles.plansHeader}>
      <Text style={styles.plansHeaderTitle}>Dream-Link Premium</Text>
      <Text style={styles.plansHeaderSub}>Unlock your full potential</Text>
    </View>
    
    <View style={styles.featuresList}>
      <PremiumFeatureCard 
        icon="∞" 
        title="Unlimited Likes" 
        description="Connect with as many dreamers as you want without restrictions"
      />
      <PremiumFeatureCard 
        icon="👁️" 
        title="See Who Likes You" 
        description="Discover your mutual connections instantly"
      />
      <PremiumFeatureCard 
        icon="🔍" 
        title="Advanced Filters" 
        description="Filter by dream themes, chronotype, and personality traits"
        isPremium
      />
      <PremiumFeatureCard 
        icon="🧠" 
        title="Deep Dream Analysis" 
        description="AI-powered psychological insights into your subconscious patterns"
        isPremium
      />
      <PremiumFeatureCard 
        icon="↩️" 
        title="Unlimited Rewinds" 
        description="Go back and revisit anyone you passed on"
        isPremium
      />
      <PremiumFeatureCard 
        icon="☁️" 
        title="Subconscious Word Cloud" 
        description="Visual map of recurring symbols and themes in your dreams"
        isPremium
      />
      <PremiumFeatureCard 
        icon="⚡" 
        title="Priority Matching" 
        description="Your profile appears first to highly compatible dreamers"
        isPremium
      />
    </View>
    
    <View style={styles.premiumCTA}>
      <Animated.View style={[styles.upgradeBtnPulse, { transform: [{ scale: upgradePulseAnim }] }]}>
        <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.88}>
          <LinearGradient colors={['#1a1a1a', '#333333']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeGradient}>
            <Text style={styles.upgradeBtnText}>UPGRADE TO PREMIUM</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.ctaSubtext}>Cancel anytime • 7-day free trial</Text>
    </View>
  </View>
);

// ─── Journal: Dream Entry Card ───────────────────────────────────────
const DreamEntry = ({ dream }: { dream: any }) => {
  const dateObj = new Date(dream.createdAt);
  const dateStr = `${MONTH_NAMES[dateObj.getMonth()].slice(0, 3)} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/dream/${dream.id}`)}
      style={styles.journalEntryCard}
    >
      <View style={styles.entryHeader}>
        <View style={styles.entryDateBlock}>
          <Text style={styles.entryDay}>{dateObj.getDate()}</Text>
          <Text style={styles.entryMonth}>{MONTH_NAMES[dateObj.getMonth()].slice(0, 3)}</Text>
        </View>
        <View style={styles.entryMeta}>
          <Text style={styles.entryTitle} numberOfLines={1}>{dream.title}</Text>
          <Text style={styles.entryTime}>{timeStr}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
      </View>
      
      <Text style={styles.entryDesc} numberOfLines={2}>{dream.description}</Text>
      
      <View style={styles.entryFooter}>
        <View style={styles.entryTag}>
          <Text style={styles.entryTagText}>{dream.theme || 'DREAM'}</Text>
        </View>
        <Text style={styles.entryTapHint}>Tap to read</Text>
      </View>
    </TouchableOpacity>
  );
};

const renderJournal = () => (
  <View style={styles.tabContent}>
    <View style={styles.journalHeader}>
      <Text style={styles.journalHeaderTitle}>Dream Journal</Text>
      <Text style={styles.journalHeaderSub}>{dreamsToRender.length} {dreamsToRender.length === 1 ? 'entry' : 'entries'}</Text>
    </View>

    {dreamsToRender.length > 0 ? (
      <View style={styles.journalEntries}>
        {dreamsToRender.map((d: any) => (
          <DreamEntry key={d.id} dream={d} />
        ))}
      </View>
    ) : (
      <View style={styles.emptyJournal}>
        <View style={styles.emptyJournalIconWrap}>
          <Ionicons name="moon-outline" size={48} color="#CCCCCC" />
        </View>
        <Text style={styles.emptyJournalTitle}>No dreams yet</Text>
        <Text style={styles.emptyJournalSub}>Start recording your dreams to build your journal</Text>
      </View>
    )}

    <TouchableOpacity 
      style={styles.archiveBtn} 
      activeOpacity={0.7} 
      onPress={() => router.push('/dream-archive')}
    >
      <Text style={styles.archiveBtnText}>View All Entries</Text>
      <Ionicons name="arrow-forward" size={14} color="#000000" />
    </TouchableOpacity>
  </View>
);

// ─── Tab: Analysis ───────────────────────────────────────────────────────
const AnalysisStat = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <View style={styles.analysisStatCard}>
    <Text style={styles.analysisStatIcon}>{icon}</Text>
    <Text style={styles.analysisStatValue}>{value}</Text>
    <Text style={styles.analysisStatLabel}>{label}</Text>
  </View>
);

const ThemeBar = ({ label, pct }: { label: string; pct: number }) => (
  <View style={styles.analysisThemeRow}>
    <Text style={styles.analysisThemeLabel}>{label}</Text>
    <View style={styles.analysisThemeBarBg}>
      <View style={[styles.analysisThemeBarFill, { width: `${Math.round(pct * 100)}%` }]} />
    </View>
    <Text style={styles.analysisThemePct}>{Math.round(pct * 100)}%</Text>
  </View>
);

const PremiumLockOverlay = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={styles.premiumLockOverlay}>
    <View style={styles.blurPlaceholder}>
      <Text style={styles.blurText}>? ? ?</Text>
    </View>
    <View style={styles.premiumLockCard}>
      <View style={styles.premiumLockIcon}>
        <Ionicons name="diamond-outline" size={24} color="#000000" />
      </View>
      <Text style={styles.premiumLockTitle}>{title}</Text>
      <Text style={styles.premiumLockSub}>{subtitle}</Text>
      <TouchableOpacity 
        style={styles.premiumUnlockBtn} 
        activeOpacity={0.8}
        onPress={() => router.push('/premium-upsell')}
      >
        <Text style={styles.premiumUnlockBtnText}>Unlock Premium</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const renderAura = () => (
  <View style={styles.tabContent}>
    <View style={styles.analysisHeader}>
      <Text style={styles.analysisHeaderTitle}>Dream Analysis</Text>
      <Text style={styles.analysisHeaderSub}>Your subconscious patterns</Text>
    </View>

    {/* Archetype Section - Free */}
    <View style={styles.analysisArchetypeCard}>
      <View style={styles.analysisArchetypeContent}>
        <Text style={styles.analysisArchetypeLabel}>YOUR ARCHETYPE</Text>
        <Text style={styles.analysisArchetypeTitle}>The Lucid Wanderer</Text>
        <Text style={styles.analysisArchetypeDesc}>You navigate dreamscapes with rare intentionality and self-awareness</Text>
      </View>
      <View style={styles.analysisArchetypeIcon}>
        <Text style={{ fontSize: 36 }}>✦</Text>
      </View>
    </View>

    {/* Stats Row - Free */}
    <View style={styles.analysisStatsGrid}>
      <AnalysisStat icon="🌙" label="DREAMS/MO" value="7" />
      <AnalysisStat icon="⚡" label="LUCIDITY" value="High" />
      <AnalysisStat icon="🎭" label="MOOD" value="Calm" />
    </View>

    {/* Dominant Themes - Free */}
    <View style={styles.analysisThemesSection}>
      <Text style={styles.analysisSectionTitle}>Dominant Themes</Text>
      <ThemeBar label="Exploration" pct={0.78} />
      <ThemeBar label="Transformation" pct={0.61} />
      <ThemeBar label="Connection" pct={0.44} />
      <ThemeBar label="Conflict" pct={0.29} />
    </View>

    {/* Premium Sections - Locked */}
    <View style={styles.premiumSection}>
      <Text style={styles.analysisSectionTitle}>Subconscious Symbols</Text>
      <PremiumLockOverlay 
        title="Symbol Analysis Locked" 
        subtitle="Discover recurring symbols in your dreams"
      />
    </View>

    <View style={styles.premiumSection}>
      <Text style={styles.analysisSectionTitle}>Emotional Rhythm</Text>
      <PremiumLockOverlay 
        title="Emotional Patterns Locked" 
        subtitle="Track your dream emotional patterns over time"
      />
    </View>

    <View style={styles.premiumSection}>
      <Text style={styles.analysisSectionTitle}>Archetype Deep Dive</Text>
      <PremiumLockOverlay 
        title="Full Breakdown Locked" 
        subtitle="Complete psychological profile based on your dreams"
      />
    </View>
  </View>
);

  return (
    <EdgeToEdgeLayout backgroundColor={C.bg} statusBarStyle="dark-content" statusBarBg={C.bg}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsIcon} onPress={() => { setCurrentSubPage(null); setShowSettingsModal(true); }} activeOpacity={0.6}>
            <Ionicons name="settings-outline" size={24} color={C.textMain} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 8 }} showsVerticalScrollIndicator={false}>

        {/* Avatar + Identity */}
        <View style={styles.identitySection}>
          <View style={styles.identityRow}>
            <TouchableOpacity style={styles.avatarProgressWrapper} activeOpacity={0.85} onPress={() => router.push('/profile-preview')}>
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

        {/* Token Counters */}
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

{/* Classic Segmented Tab Menu */}
  <View style={styles.segmentedTabBar}>
    {([
      { key: 'plans', label: 'Plans' },
      { key: 'journal', label: 'Journal' },
      { key: 'aura', label: 'Analysis' },
    ] as { key: TabKey; label: string }[]).map(tab => {
      const active = activeTab === tab.key;
      return (
        <TouchableOpacity
          key={tab.key}
          activeOpacity={0.7}
          onPress={() => setActiveTab(tab.key)}
          style={[styles.segmentedTab, active && styles.segmentedTabActive]}
        >
          <Text style={[styles.segmentedTabText, active && styles.segmentedTabTextActive]}>{tab.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>

        {/* Tab Content */}
        <View style={styles.section}>
          {activeTab === 'plans' && renderPlans()}
          {activeTab === 'journal' && renderJournal()}
          {activeTab === 'aura' && renderAura()}
        </View>

        </ScrollView>

        {/* Settings Modal */}
        <Modal visible={showSettingsModal} animationType="slide" transparent={false} presentationStyle="fullScreen" onRequestClose={handleSettingsBack}>
          <EdgeToEdgeLayout backgroundColor="#FFF" statusBarStyle="dark-content" statusBarBg="#FFF">
            <View style={{ flex: 1, backgroundColor: '#FFF' }}>
              <View style={{ paddingHorizontal: 22, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 0.5, borderBottomColor: C.borderLight, backgroundColor: '#FFF' }}>
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
          </EdgeToEdgeLayout>
        </Modal>

        {/* Delete Modals */}
        <Modal transparent visible={showDeleteModal} animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
          <View style={MD.backdrop}>
            <View style={MD.card}>
              <Text style={MD.title}>Delete account?</Text>
              <Text style={MD.txt}>This action cannot be undone. All your profile data, dreams and related info will be permanently deleted.</Text>
              <View style={MD.actions}>
                <TouchableOpacity style={MD.cancel} onPress={() => setShowDeleteModal(false)}><Text style={MD.cancelTxt}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={MD.danger} onPress={() => { setShowDeleteModal(false); setShowFinalDeleteModal(true); }}><Text style={MD.dangerTxt}>Continue</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal transparent visible={showFinalDeleteModal} animationType="fade" onRequestClose={() => setShowFinalDeleteModal(false)}>
          <View style={MD.backdrop}>
            <View style={MD.card}>
              <Text style={MD.title}>Final Confirmation</Text>
              <Text style={MD.txt}>Type DELETE below to confirm.</Text>
              <TextInput style={MD.input} autoCapitalize="characters" value={confirmText} onChangeText={setConfirmText} editable={!deleting} placeholder="DELETE" placeholderTextColor="#A3A8C2" />
              <View style={MD.actions}>
                <TouchableOpacity style={MD.cancel} onPress={() => { setShowFinalDeleteModal(false); setConfirmText(''); }} disabled={deleting}><Text style={MD.cancelTxt}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={MD.danger} onPress={handleDeleteAccount} disabled={deleting}>
                  {deleting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={MD.dangerTxt}>Delete Permanently</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </EdgeToEdgeLayout>
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
    paddingVertical: 14,
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

  tokenSectionWrapper: { paddingHorizontal: 24, marginBottom: 24 },
  tokenSection: { flexDirection: 'row', gap: 8 },
  tokenBox: { backgroundColor: C.bg, borderRadius: 16, paddingVertical: 14, paddingTop: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.borderLight, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tokenIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tokenLabel: { fontFamily: QS_BOLD, fontSize: 9, color: C.textLight, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 },
  tokenValue: { fontFamily: QS_BOLD, fontSize: 18, color: C.textMain, fontWeight: '800' },

  // ─── Classic Segmented Tab Bar ───
  segmentedTabBar: { 
    flexDirection: 'row', 
    marginHorizontal: 22, 
    marginBottom: 24, 
    backgroundColor: '#F5F5F5', 
    borderRadius: 10, 
    padding: 4,
  },
  segmentedTab: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 8,
  },
  segmentedTabActive: { 
    backgroundColor: '#FFFFFF', 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentedTabText: { fontFamily: QS_BOLD, fontSize: 14, fontWeight: '700', color: '#999999', letterSpacing: 0.3 },
  segmentedTabTextActive: { color: '#000000', fontWeight: '800' },

  section: { paddingHorizontal: 22, marginBottom: 10 },
  tabContent: {},

  // ─── Plans Tab ───
  plansHeader: { marginBottom: 20, paddingHorizontal: 4 },
  plansHeaderTitle: { fontFamily: QS_BOLD, fontSize: 24, fontWeight: '800', color: '#000000', letterSpacing: -0.5 },
  plansHeaderSub: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#999999', marginTop: 4 },
  
  featuresList: { gap: 12 },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  featureCardPremium: {
    borderColor: '#000000',
    backgroundColor: '#FAFAFA',
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureIconWrapPremium: {
    backgroundColor: '#000000',
  },
  featureIcon: { fontSize: 20, color: '#000000' },
  featureContent: { flex: 1 },
  featureTitle: { fontFamily: QS_BOLD, fontSize: 15, fontWeight: '700', color: '#333333', marginBottom: 3 },
  featureTitlePremium: { color: '#000000' },
  featureDesc: { fontFamily: QS_MEDIUM, fontSize: 13, color: '#888888', lineHeight: 18 },
  featureBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  featureBadgeText: { fontFamily: QS_BOLD, fontSize: 9, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  
  premiumCTA: { marginTop: 28, alignItems: 'center', paddingBottom: 20 },
  upgradeBtnPulse: { alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4, borderRadius: 12, backgroundColor: '#FFFFFF' },
  upgradeBtn: { borderRadius: 12, overflow: 'hidden' },
  upgradeGradient: { paddingVertical: 16, paddingHorizontal: 48, alignItems: 'center', justifyContent: 'center' },
  upgradeBtnText: { fontFamily: QS_BOLD, fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5 },
  ctaSubtext: { fontFamily: QS_MEDIUM, fontSize: 12, color: '#999999', marginTop: 12 },

// ─── Journal Tab ───
  journalHeader: { marginBottom: 20, paddingHorizontal: 4 },
  journalHeaderTitle: { fontFamily: QS_BOLD, fontSize: 24, fontWeight: '800', color: '#000000', letterSpacing: -0.5 },
  journalHeaderSub: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#999999', marginTop: 4 },
  
  journalEntries: { gap: 12 },
  journalEntryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  entryDateBlock: {
    width: 44,
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  entryDay: { fontFamily: QS_BOLD, fontSize: 20, fontWeight: '800', color: '#000000', lineHeight: 24 },
  entryMonth: { fontFamily: QS_BOLD, fontSize: 10, fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: 0.5 },
  entryMeta: { flex: 1 },
  entryTitle: { fontFamily: QS_BOLD, fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 2 },
  entryTime: { fontFamily: QS_MEDIUM, fontSize: 12, color: '#999999' },
  entryDesc: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#666666', lineHeight: 20, marginBottom: 12 },
  entryFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  entryTagText: { fontFamily: QS_BOLD, fontSize: 10, fontWeight: '700', color: '#666666', letterSpacing: 0.5, textTransform: 'uppercase' },
  entryTapHint: { fontFamily: QS_MEDIUM, fontSize: 12, color: '#CCCCCC' },

  emptyJournal: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  emptyJournalIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyJournalTitle: { fontFamily: QS_BOLD, fontSize: 18, fontWeight: '700', color: '#000000', marginBottom: 6 },
  emptyJournalSub: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#999999', textAlign: 'center', lineHeight: 20 },

  archiveBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    alignSelf: 'center', 
    marginTop: 24, 
    paddingVertical: 14, 
    paddingHorizontal: 28, 
    borderRadius: 10, 
    backgroundColor: '#000000', 
    gap: 8,
  },
  archiveBtnText: { fontFamily: QS_BOLD, fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // ─── Analysis Tab ───
  analysisHeader: { marginBottom: 20, paddingHorizontal: 4 },
  analysisHeaderTitle: { fontFamily: QS_BOLD, fontSize: 24, fontWeight: '800', color: '#000000', letterSpacing: -0.5 },
  analysisHeaderSub: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#999999', marginTop: 4 },
  
  analysisArchetypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 16,
  },
  analysisArchetypeContent: { flex: 1 },
  analysisArchetypeLabel: { fontFamily: QS_BOLD, fontSize: 10, fontWeight: '800', color: '#666666', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  analysisArchetypeTitle: { fontFamily: QS_BOLD, fontSize: 20, fontWeight: '800', color: '#000000', marginBottom: 4 },
  analysisArchetypeDesc: { fontFamily: QS_MEDIUM, fontSize: 13, color: '#666666', lineHeight: 18 },
  analysisArchetypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  
  analysisStatsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  analysisStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  analysisStatIcon: { fontSize: 20, marginBottom: 6 },
  analysisStatValue: { fontFamily: QS_BOLD, fontSize: 18, fontWeight: '800', color: '#000000', marginBottom: 2 },
  analysisStatLabel: { fontFamily: QS_BOLD, fontSize: 9, fontWeight: '700', color: '#999999', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  
  analysisThemesSection: { marginBottom: 24 },
  analysisSectionTitle: { fontFamily: QS_BOLD, fontSize: 14, fontWeight: '800', color: '#000000', marginBottom: 14, letterSpacing: 0.5 },
  analysisThemeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  analysisThemeLabel: { fontFamily: QS_BOLD, fontSize: 13, fontWeight: '600', color: '#333333', width: 90 },
  analysisThemeBarBg: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  analysisThemeBarFill: { height: '100%', backgroundColor: '#000000', borderRadius: 3 },
  analysisThemePct: { fontFamily: QS_BOLD, fontSize: 12, fontWeight: '700', color: '#999999', width: 36, textAlign: 'right' },
  
  premiumSection: { marginBottom: 20 },
  premiumLockOverlay: { marginTop: 8 },
  blurPlaceholder: {
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -40,
    zIndex: 1,
  },
  blurText: { fontFamily: QS_BOLD, fontSize: 24, color: '#DDDDDD', letterSpacing: 4 },
  premiumLockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    position: 'relative',
    zIndex: 2,
  },
  premiumLockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  premiumLockTitle: { fontFamily: QS_BOLD, fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 4 },
  premiumLockSub: { fontFamily: QS_MEDIUM, fontSize: 13, color: '#999999', textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  premiumUnlockBtn: {
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  premiumUnlockBtnText: { fontFamily: QS_BOLD, fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },

  // Delete Modal Styles
  MD_backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  MD_card: { width: '100%', backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  MD_title: { fontSize: 16, fontWeight: '700', color: '#2D2D3A', marginBottom: 8 },
  MD_txt: { fontSize: 13, color: '#5E5E72', lineHeight: 19, marginBottom: 12 },
  MD_input: { borderWidth: 1, borderColor: '#D9DDF0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: '#2D2D3A', fontSize: 13, marginBottom: 12 },
  MD_actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  MD_cancel: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 9, backgroundColor: '#EEF1FF' },
  MD_cancelTxt: { color: '#3B4570', fontWeight: '600', fontSize: 13 },
  MD_danger: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 9, backgroundColor: '#D14343', minWidth: 110, alignItems: 'center', justifyContent: 'center' },
  MD_dangerTxt: { color: '#FFF', fontWeight: '600', fontSize: 13 },
});

const MD = {
  backdrop: styles.MD_backdrop,
  card: styles.MD_card,
  title: styles.MD_title,
  txt: styles.MD_txt,
  input: styles.MD_input,
  actions: styles.MD_actions,
  cancel: styles.MD_cancel,
  cancelTxt: styles.MD_cancelTxt,
  danger: styles.MD_danger,
  dangerTxt: styles.MD_dangerTxt,
};