import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, MessageCircle, Undo2, Lock, Compass, TrendingUp, Sparkles, Moon, Activity, PieChart, Heart, ChevronRight, Flame } from 'lucide-react-native';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Svg, { Circle, Path, G, Rect, Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText, RadialGradient } from 'react-native-svg';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/useAppStore';
import {
  getMyProfile,
  getUserDreams,
  UserProfileResponse,
  DreamResponse,
} from '../../services/api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const QS_BOLD = 'Quicksand_700Bold';
const QS_MEDIUM = 'Quicksand_500Medium';
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

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

const SAMPLE_PHOTO = 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80';

type TabKey = 'plans' | 'journal' | 'insights';

// ─── Mock Dream Data ──────────────────────────────────────────────────────────
const MOCK_DREAMS = [
  { id: '1', createdAt: new Date().toISOString(), title: 'The Floating Island', description: 'A vast island suspended above silver clouds, drifting toward a silent horizon.', theme: 'LUCID' },
  { id: '2', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), title: 'Midnight Forest', description: 'Enormous stone blocks gliding between dark ancient trees under a moonless sky.', theme: 'CURIOUS' },
  { id: '3', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), title: 'Glass Ocean', description: 'Walking on perfectly still water that mirrored another world beneath the surface.', theme: 'CALM' },
  { id: '4', createdAt: new Date(Date.now() - 86400000 * 9).toISOString(), title: 'The Red Library', description: 'Infinite shelves of books written in languages I somehow understood but forgot upon waking.', theme: 'MYSTERIOUS' },
  { id: '5', createdAt: new Date(Date.now() - 86400000 * 14).toISOString(), title: 'Shadow Messenger', description: 'A figure made of smoke carrying a letter sealed with an unfamiliar sigil.', theme: 'SYMBOLIC' },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── JournalCardItem ──────────────────────────────────────────────────────────
const JournalCardItem = ({ dream }: { dream: any }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const d = new Date(dream.createdAt);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push(`/dream/${dream.id}`)}
        style={jS.journalCard}
      >
        <LinearGradient
          colors={['#FFFFFF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={jS.cardGradient}
        >
          <View style={jS.cardTopRow}>
            <View style={jS.dateBadge}>
              <Text style={jS.dateMonth}>{mon.toUpperCase()}</Text>
              <Text style={jS.dateDay}>{day}</Text>
              <Text style={jS.dateYear}>{year}</Text>
            </View>
            <View style={jS.cardHeaderContent}>
              <Text style={jS.cardTitle} numberOfLines={2}>
                {dream.title || 'Untitled dream'}
              </Text>
            </View>
          </View>

          <Text style={jS.cardDesc} numberOfLines={3} ellipsizeMode="tail">
            {dream.description || 'No description added yet.'}
          </Text>

          <View style={jS.cardFooter}>
            <View style={jS.metaItem}>
              <Ionicons name="analytics-outline" size={13} color="#94A3B8" />
              <Text style={jS.metaText}>Analysis ready</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const BENEFIT_DETAILS = [
  "See who's liked your profile without matching. Make the first move yourself.",
  "Swipe as much as you want with no daily limits. Your perfect match is out there.",
  "Changed your mind? Rewind unlimited profiles and give them a second chance.",
  "Browse profiles anonymously. No one will know you've viewed them unless you choose to match.",
  "Filter your matches by gender to find the specific connection you are looking for.",
  "Unlock deep dream interpretations to reveal hidden symbols, emotional currents, and deep subconscious insights.",
];

const PREMIUM_BENEFITS_META = [
  { icon: 'eye-outline', label: 'Who Liked You', desc: 'Reveal hidden interest' },
  { icon: 'infinite-outline', label: 'Unlimited Likes', desc: 'Explore without limits' },
  { icon: 'return-up-back-outline', label: 'Unlimited Rewind', desc: 'Bring profiles back' },
  { icon: 'shield-checkmark-outline', label: 'Incognito Mode', desc: 'Browse with privacy' },
  { icon: 'male-female-outline', label: 'Gender Filter', desc: 'Filter matches by gender' },
  {
    icon: 'chatbubble-ellipses-outline',
    label: 'Dream Interpretation',
    desc: 'Get deep dream readings'
  }
] as const;

// ─── PlansTabContent ──────────────────────────────────────────────────────
const PlansTabContent = ({ shineAnim, setBenefitInfo }: { shineAnim: Animated.Value; setBenefitInfo: (info: { index: number; data: string }) => void }) => {
  const premiumBenefits = PREMIUM_BENEFITS_META;

  return (
    <View style={styles.tabContent}>
      <View style={styles.dreamiumTopCard}>
        <View style={styles.dreamiumTopOrb} />
        <View style={styles.dreamiumTopContent}>
          <View style={styles.dreamiumTitleWrapper}>
            <Text style={styles.dreamiumTopHeadline}>DREAMIUM</Text>
            <View style={styles.dreamiumHeadlineBar} />
          </View>
          <Text style={styles.dreamiumTopStatement}>Transform your dreams into a profound path to true connection.</Text>
        </View>

        <TouchableOpacity
          style={styles.dreamiumCtaBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/premium-upsell')}
        >
          <LinearGradient
            colors={['#A63F4F', '#4A1D24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dreamiumCtaGradientSlim}
          >
            <View style={styles.dreamiumCtaContent}>
              <Text style={styles.dreamiumCtaText}>Explore Dreamium</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  zIndex: 10,
                  elevation: 5,
                  overflow: 'hidden',
                  flexDirection: 'row',
                  transform: [{
                    translateX: shineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [SCREEN_W, -SCREEN_W]
                    })
                  }],
                }
              ]}
            >
              <View style={{ width: 70, height: '250%', top: '-75%', transform: [{ rotate: '25deg' }] }}>
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.32)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ flex: 1 }}
                />
              </View>
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.dreamiumSectionHeader}>
        <Text style={styles.dreamiumSectionTitle}>Dreamium Benefits</Text>
      </View>

      <View style={styles.dreamiumBenefitsGrid}>
        {premiumBenefits.map((item, index) => {
          return (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.78}
              onPress={() => setBenefitInfo({ index, data: BENEFIT_DETAILS[index] })}
              style={styles.dreamiumBenefitTile}
            >
              <View style={styles.dreamiumBenefitTileTop}>
                <View style={[styles.dreamiumBenefitIconWrap, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name={item.icon as any} size={16} color="#000" />
                </View>
                <Ionicons name="help-circle-outline" size={16} color="#CBD5E1" />
              </View>
              <Text style={styles.dreamiumBenefitLabel}>{item.label}</Text>
              <Text style={styles.dreamiumBenefitDesc}>{item.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.dreamiumWeekly}>
        <View style={styles.dreamiumWeeklyHeader}>
          <View>
            <Text style={styles.dreamiumSectionLabel}>WEEKLY REWARDS</Text>
            <Text style={styles.dreamiumWeeklyTitle}>Fresh power every week</Text>
          </View>

        </View>
        <View style={styles.dreamiumWeeklyRow}>
          <View style={styles.dreamiumWeeklyItem}>
            <View style={[styles.dreamiumWeeklyIcon, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9' }]}>
              <MessageCircle size={15} color={C.primary} />
            </View>
            <Text style={styles.dreamiumWeeklyText}>3 Whisper</Text>
            <Text style={styles.dreamiumWeeklyMeta}>Start softer</Text>
          </View>
          <View style={styles.dreamiumWeeklyItem}>
            <View style={[styles.dreamiumWeeklyIcon, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9' }]}>
              <Star size={15} color={C.primary} />
            </View>
            <Text style={styles.dreamiumWeeklyText}>5 Superlike</Text>
            <Text style={styles.dreamiumWeeklyMeta}>Stand out</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── JournalTabContent ────────────────────────────────────────────────────
const JournalTabContent = ({ dreams }: { dreams: any[] }) => {
  const sorted = [...dreams].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <View style={styles.tabContent}>

      <View style={jS.sectionHeader}>
        <Text style={jS.sectionLabel}>LATEST ENTRIES</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/dream-archive')}
          style={jS.archiveLink}
        >
          <Text style={jS.archiveLinkText}>Archive</Text>
          <Ionicons name="arrow-forward" size={12} color={C.primary} />
        </TouchableOpacity>
      </View>

      <View style={jS.listContainer}>
        {sorted.length > 0 ? (
          sorted.map((dream) => (
            <JournalCardItem key={dream.id} dream={dream} />
          ))
        ) : (
          <View style={jS.emptyState}>
            <View style={jS.emptyIcon}>
              <Ionicons name="moon-outline" size={24} color={C.primary} />
            </View>
            <Text style={jS.emptyTitle}>No dreams saved yet</Text>
            <Text style={jS.emptyText}>Your journal will become more powerful as you record more dreams.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── InsightsTabContent ───────────────────────────────────────────────────
interface InsightsTabContentProps {
  dreams: any[];
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
};

const matchThemeKeywords = (title: string, desc: string): string[] => {
  const t = (title + ' ' + desc).toLowerCase();
  const matched: string[] = [];
  if (t.includes('kaç') || t.includes('kovala') || t.includes('kurtul') || t.includes('saklan') || t.includes('peş')) matched.push('Escape');
  if (t.includes('uç') || t.includes('gök') || t.includes('havada') || t.includes('kanat') || t.includes('bulut')) matched.push('Flying');
  if (t.includes('düş') || t.includes('boşluk') || t.includes('yükseklik') || t.includes('uçurum')) matched.push('Falling');
  if (t.includes('deniz') || t.includes('su') || t.includes('göl') || t.includes('okyanus') || t.includes('nehir') || t.includes('yüz') || t.includes('havuz')) matched.push('Water & Ocean');
  if (t.includes('sınav') || t.includes('okul') || t.includes('ders') || t.includes('test') || t.includes('hoca') || t.includes('öğretmen') || t.includes('sınıf') || t.includes('yetiş')) matched.push('Exam/School');
  if (t.includes('kaybol') || t.includes('yol') || t.includes('bulama') || t.includes('labirent')) matched.push('Getting Lost');
  if (t.includes('para') || t.includes('zengin') || t.includes('altın') || t.includes('hazine')) matched.push('Prosperity');
  if (t.includes('öl') || t.includes('mezar') || t.includes('cenaze') || t.includes('vefat')) matched.push('Transformation');
  if (t.includes('uçak') || t.includes('araba') || t.includes('tren') || t.includes('yolculuk') || t.includes('seyahat')) matched.push('Journey');
  return matched;
};

const InsightsTabContent = ({ dreams }: InsightsTabContentProps) => {
  const isLocked = dreams.length < 3;
  const formatDreamType = (theme: string) => {
    switch (theme) {
      case 'HAPPY': return 'Happy';
      case 'SAD': return 'Sad';
      case 'NIGHTMARE': return 'Nightmare';
      case 'LOVE': return 'Love';
      case 'LUCID': return 'Lucid';
      case 'ANGRY': return 'Angry';
      case 'EXCITED': return 'Excited';
      case 'CURIOUS': return 'Curious';
      default: return theme.charAt(0).toUpperCase() + theme.slice(1).toLowerCase();
    }
  };

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'HAPPY': return '#FBBF24'; // Amber gold
      case 'SAD': return '#60A5FA'; // Soft blue
      case 'NIGHTMARE': return '#1F2937'; // Dark charcoal
      case 'LOVE': return '#F43F5E'; // Rose pink
      case 'LUCID': return '#8B5CF6'; // Vibrant violet
      case 'ANGRY': return '#EF4444'; // Coral red
      case 'EXCITED': return '#EC4899'; // Hot pink
      case 'CURIOUS': return '#14B8A6'; // Teal
      default: return '#6B7280'; // Slate grey
    }
  };

  if (isLocked) {
    const progressPct = dreams.length / 3;
    const progressText = `${dreams.length}/3`;
    
    return (
      <View style={a2S.lockedContainer}>
        <View style={a2S.lockedHeader}>
          <View style={a2S.lockedBadge}>
            <Sparkles size={11} color={C.primary} />
            <Text style={a2S.lockedBadgeText}>LOCKED ANALYSIS</Text>
          </View>
          <Text style={a2S.lockedTitle}>Subconscious Insights</Text>
          <Text style={a2S.lockedSubtitle}>
            Record at least 3 dreams to discover your subconscious emotional map and hidden themes.
          </Text>
        </View>

        {/* Progress Ring Section */}
        <View style={a2S.progressCenter}>
          <View style={{ position: 'relative', width: 130, height: 130, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={130} height={130}>
              <Circle
                cx="65"
                cy="65"
                r="54"
                stroke="#F1F5F9"
                strokeWidth="6.5"
                fill="none"
              />
              <Circle
                cx="65"
                cy="65"
                r="54"
                stroke={C.primary}
                strokeWidth="6.5"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPct)}`}
                strokeLinecap="round"
                transform="rotate(-90, 65, 65)"
              />
            </Svg>
            <View style={a2S.progressTextWrapper}>
              <Lock size={16} color={C.textMuted} style={{ marginBottom: 3 }} />
              <Text style={a2S.progressValue}>{progressText}</Text>
              <Text style={a2S.progressLabel}>Dreams</Text>
            </View>
          </View>
        </View>

        <Text style={a2S.lockedSectionHeader}>Features to Unlock</Text>

        <View style={a2S.lockedCardsList}>
          {/* Card 1: Emotions Preview */}
          <View style={a2S.lockedCard}>
            <View style={[a2S.lockedCardContent, { gap: 10 }]}>
              {/* Row 1 preview */}
              <View style={{ gap: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' }} />
                    <View style={{ width: 50, height: 8, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
                  </View>
                  <View style={{ width: 20, height: 8, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
                </View>
                <View style={{ height: 4, backgroundColor: '#E2E8F0', borderRadius: 2 }} />
              </View>
              {/* Row 2 preview */}
              <View style={{ gap: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' }} />
                    <View style={{ width: 60, height: 8, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
                  </View>
                  <View style={{ width: 20, height: 8, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
                </View>
                <View style={{ height: 4, backgroundColor: '#E2E8F0', borderRadius: 2 }} />
              </View>
            </View>
            <View style={a2S.lockedCardOverlay}>
              <View style={a2S.lockedCardBadge}>
                <Lock size={10} color="#FFF" />
                <Text style={a2S.lockedCardBadgeText}>Emotional Spectrum</Text>
              </View>
            </View>
          </View>

          {/* Card 2: Themes Preview */}
          <View style={a2S.lockedCard}>
            <View style={a2S.lockedCardContent}>
              <Text style={{ fontFamily: QS_BOLD, fontSize: 10, color: '#94A3B8', letterSpacing: 0.5 }}>DREAM THEMES</Text>
              <Text style={{ fontFamily: SERIF, fontSize: 18, color: '#1C1714', fontWeight: 'bold', marginTop: 4 }}>Escape, Flying, Falling</Text>
              <Text style={{ fontFamily: QS_MEDIUM, fontSize: 11, color: '#64748B', marginTop: 4 }}>Your most frequent dream actions and symbols are analyzed.</Text>
            </View>
            <View style={a2S.lockedCardOverlay}>
              <View style={a2S.lockedCardBadge}>
                <Lock size={10} color="#FFF" />
                <Text style={a2S.lockedCardBadgeText}>Subconscious Themes</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <TouchableOpacity
            style={a2S.actionButton}
            activeOpacity={0.85}
            onPress={() => router.push('/today')}
          >
            <Sparkles size={16} color="#FFF" />
            <Text style={a2S.actionButtonText}>Record Your First Dream</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalDreams = dreams.length;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dreamsThisWeek = dreams.filter(d => new Date(d.createdAt) >= sevenDaysAgo).length;

  const themeCounts: Record<string, number> = {};
  dreams.forEach(d => {
    const theme = d.theme;
    if (theme) {
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    }
  });

  const rankedThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([theme, count]) => ({
      theme,
      count,
      label: formatDreamType(theme),
      pct: totalDreams > 0 ? (count / totalDreams) * 100 : 0,
      color: getThemeColor(theme),
    }));

  const dominantThemeObj = rankedThemes[0] || { theme: 'SYMBOLIC', label: 'Symbolic' };

  // Sort dreams descending by createdAt (newest first)
  const sortedDreams = [...dreams].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const recentThemesList: string[] = [];
  
  sortedDreams.forEach(d => {
    const currentDreamThemes: string[] = [];
    
    // 1. Gather existing tags
    if (d.tags && Array.isArray(d.tags)) {
      d.tags.forEach((t: string) => {
        const clean = t.trim().charAt(0).toUpperCase() + t.trim().slice(1).toLowerCase();
        if (clean && !currentDreamThemes.includes(clean)) {
          currentDreamThemes.push(clean);
        }
      });
    }
    
    // 2. Extrapolate keywords
    const derived = matchThemeKeywords(d.title || '', d.description || '');
    derived.forEach((t: string) => {
      if (t && !currentDreamThemes.includes(t)) {
        currentDreamThemes.push(t);
      }
    });
    
    // Add unique themes to the recent list (up to 5)
    currentDreamThemes.forEach(theme => {
      if (recentThemesList.length < 5 && !recentThemesList.includes(theme)) {
        recentThemesList.push(theme);
      }
    });
  });

  // Ensure fallback categories if empty
  if (recentThemesList.length === 0) {
    recentThemesList.push('Escape', 'Flying', 'Falling');
  }

  const lastThemes = recentThemesList.map(tag => ({
    label: tag,
  }));

  const emotions = rankedThemes.slice(0, 5);

  const maxStreak = useMemo(() => {
    const dates = dreams.map(d => {
      const dateObj = new Date(d.createdAt);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
    const uniqueDates = Array.from(new Set(dates)).sort();
    
    let max = 0;
    if (uniqueDates.length > 0) {
      max = 1;
      let currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
          if (currentStreak > max) {
            max = currentStreak;
          }
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
    }
    return max;
  }, [dreams]);

  return (
    <View style={a2S.tabContent}>
      {/* 1. Combined Cosmic Stats Card */}
      <View style={a2S.cosmicCard}>
        <LinearGradient
          colors={['#5C1E2A', '#A63F4F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={a2S.cosmicGradient}
        >
          {/* Celestial SVG Overlay */}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <RadialGradient id="celestialGlow" cx="80%" cy="20%" r="50%">
                <Stop offset="0%" stopColor="#FFC2CC" stopOpacity="0.18" />
                <Stop offset="100%" stopColor="#5C1E2A" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#celestialGlow)" />
            <Circle cx="85%" cy="25%" r="40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" />
            <Circle cx="85%" cy="25%" r="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none" strokeDasharray="3,3" />
            <Path d="M10,60 Q 110,20 220,90 T 360,50" stroke="rgba(255,255,255,0.03)" strokeWidth="1.2" fill="none" />
          </Svg>

          <View style={a2S.cosmicHeader}>
            <Sparkles size={11} color="#FFE4E8" style={{ marginRight: 2 }} />
            <Text style={a2S.cosmicCategory}>OVERVIEW</Text>
          </View>

          <View style={a2S.cosmicStatsRow}>
            {/* Stat 1 */}
            <View style={a2S.cosmicStatItem}>
              <View style={a2S.cosmicStatIconWrap}>
                <Moon size={14} color="#FFF" />
              </View>
              <Text style={a2S.cosmicStatNumber}>{totalDreams}</Text>
              <Text style={a2S.cosmicStatLabel}>Total Dreams</Text>
            </View>

            <View style={a2S.cosmicDivider} />

            {/* Stat 2 */}
            <View style={a2S.cosmicStatItem}>
              <View style={a2S.cosmicStatIconWrap}>
                <Activity size={14} color="#FFF" />
              </View>
              <Text style={a2S.cosmicStatNumber}>{dreamsThisWeek}</Text>
              <Text style={a2S.cosmicStatLabel}>This Week</Text>
            </View>

            <View style={a2S.cosmicDivider} />

            {/* Stat 3 */}
            <View style={a2S.cosmicStatItem}>
              <View style={a2S.cosmicStatIconWrap}>
                <Flame size={14} color="#FFF" />
              </View>
              <Text style={a2S.cosmicStatNumber}>{maxStreak}</Text>
              <Text style={a2S.cosmicStatLabel}>Best Streak</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 2. Emotional Spectrum Chart */}
      <View style={a2S.card}>
        <View style={a2S.cardHeader}>
          <Text style={a2S.cardCategory}>EMOTION SPECTRUM</Text>
          <Text style={a2S.cardTitleText}>Subconscious Color Spectrum</Text>
        </View>

        <View style={a2S.emotionsContainer}>
          {emotions.map((item, idx) => (
            <View key={idx} style={a2S.legendRow}>
              <View style={a2S.legendInfo}>
                <View style={a2S.legendNameWrap}>
                  <View style={[a2S.legendDot, { backgroundColor: item.color }]} />
                  <Text style={a2S.legendLabel}>{item.label}</Text>
                </View>
                <Text style={a2S.legendPct}>{Math.round(item.pct)}%</Text>
              </View>
              <View style={a2S.legendBarBg}>
                <View style={[a2S.legendBarFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 3. Subconscious Themes Panel */}
      <View style={a2S.card}>
        <View style={a2S.cardHeader}>
          <Text style={a2S.cardCategory}>RECENT THEMES</Text>
          <Text style={a2S.cardTitleText}>Latest Subconscious Traces</Text>
        </View>

        <View style={a2S.motifGrid}>
          {lastThemes.length > 0 ? (
            lastThemes.map((item, idx) => (
              <View key={idx} style={a2S.motifPill}>
                <Sparkles size={11} color={C.primary} style={{ marginRight: 4 }} />
                <Text style={a2S.motifText}>{item.label}</Text>
              </View>
            ))
          ) : (
            <Text style={a2S.noDataText}>No dream themes detected yet.</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const shineAnim = useRef(new Animated.Value(0)).current;

  const [superlikesCount, setSuperlikesCount] = useState(12);
  const [whispersCount, setWhispersCount] = useState(2);
  const [rewindsCount, setRewindsCount] = useState(5);

  const openGlobalPurchaseDrawer = useAppStore(state => state.openPurchaseDrawer);

  const handleOpenPurchase = (type: 'super' | 'whisper' | 'rewind', title: string) => {
    openGlobalPurchaseDrawer(type, title, (pType, count) => {
      if (pType === 'super') {
        setSuperlikesCount(prev => prev + count);
        Alert.alert('Success', `Purchase Successful! Added ${count} Superlikes to your account.`);
      } else if (pType === 'whisper') {
        setWhispersCount(prev => prev + count);
        Alert.alert('Success', `Purchase Successful! Added ${count} Whispers to your account.`);
      } else if (pType === 'rewind') {
        setRewindsCount(prev => prev + count);
        Alert.alert('Congratulations!', 'You watched 2 ads and earned 1 Rewind token.');
      }
    });
  };

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [journal, setJournal] = useState<DreamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('plans');

  useFocusEffect(
    useCallback(() => {
      let shimmer: Animated.CompositeAnimation | null = null;
      if (activeTab === 'plans') {
        shimmer = Animated.loop(
          Animated.timing(shineAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );
        shimmer.start();
      }
      return () => {
        if (shimmer) {
          shimmer.stop();
          shineAnim.setValue(0);
        }
      };
    }, [activeTab, shineAnim])
  );
  const [benefitInfo, setBenefitInfo] = useState<{ index: number; data: string } | null>(null);
  const lastBenefitRef = useRef<{ index: number; data: string } | null>(null);
  if (benefitInfo) lastBenefitRef.current = benefitInfo;
  const activeBenefit = benefitInfo || lastBenefitRef.current;

  useFocusEffect(useCallback(() => {
    let mounted = true;
    const run = async () => {
      try {
        const data = await getMyProfile();
        if (mounted) setProfile(data);
        try {
          const dreams = await getUserDreams(data.id, 0, 100);
          if (mounted) setJournal(dreams.content ?? []);
        } catch { if (mounted) setJournal([]); }
      } catch (e) { console.error(e); }
      finally { if (mounted) setLoading(false); }
    };
    run();
    return () => { mounted = false; };
  }, []));

  if (loading) {
    return <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  const dreamsToRender = journal.length > 0
    ? journal.slice(0, 5).map(d => ({ ...d, id: String(d.id) }))
    : MOCK_DREAMS;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={benefitInfo ? "light-content" : "dark-content"} backgroundColor={benefitInfo ? 'rgba(0,0,0,0.7)' : C.bg} />

      {/* ─── Header ─── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsIcon} onPress={() => router.push('/settings')} activeOpacity={0.6}>
          <Ionicons name="settings-outline" size={24} color={C.textMain} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 20
        }}
        showsVerticalScrollIndicator={false}
      >

        {/* ─── 1. Avatar + Identity ─── */}
        <View style={styles.identitySection}>
          <View style={styles.identityRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/profile-preview')}
              style={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <Svg width={94} height={94} style={{ transform: [{ rotate: '90deg' }] }}>
                <Circle
                  cx="47"
                  cy="47"
                  r="43"
                  stroke="#F4F4F5"
                  strokeWidth="4"
                  fill="none"
                />
                <Circle
                  cx="47"
                  cy="47"
                  r="43"
                  stroke="#09090B"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 43}`}
                  strokeDashoffset={`${(2 * Math.PI * 43) * (1 - 0.85)}`}
                  strokeLinecap="round"
                />
              </Svg>

              <View style={{ position: 'absolute', width: 78, height: 78, borderRadius: 39, overflow: 'hidden' }}>
                <Image
                  source={{ uri: profile?.avatarUrl || SAMPLE_PHOTO }}
                  style={{ width: '100%', height: '100%' }}
                />
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
              { label: 'SUPER', value: superlikesCount, Icon: Star, color: '#A63F4F', bg: 'rgba(166,63,79,0.1)', type: 'super' as const, title: 'Get Superlikes' },
              { label: 'WHISPER', value: whispersCount, Icon: MessageCircle, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', type: 'whisper' as const, title: 'Get Whispers' },
              { label: 'REWIND', value: rewindsCount, Icon: Undo2, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', type: 'rewind' as const, title: 'Watch Ads for Rewind' },
            ] as const).map(({ label, value, Icon, color, bg, type, title }, index) => (
              <React.Fragment key={label}>
                <TouchableOpacity
                  style={styles.tokenBox}
                  onPress={() => handleOpenPurchase(type, title)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tokenIconWrap, { backgroundColor: bg }]}>
                    <Icon size={16} color={color} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.tokenValue}>{value}</Text>
                  <Text style={styles.tokenLabel}>{label}</Text>
                </TouchableOpacity>
                {index < 2 && <View style={styles.tokenDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ─── 3. Pill Tab Menu ─── */}
        <View style={styles.pillTabBar}>
          {([
            { key: 'plans', label: 'Plans' },
            { key: 'journal', label: 'Journal' },
            { key: 'insights', label: 'Insights' },
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
          {activeTab === 'plans' && <PlansTabContent shineAnim={shineAnim} setBenefitInfo={setBenefitInfo} />}
          {activeTab === 'journal' && <JournalTabContent dreams={dreamsToRender} />}
          {activeTab === 'insights' && <InsightsTabContent dreams={journal} />}
        </View>

      </ScrollView>

      {/* Benefit Info Modal */}
      <Modal
        visible={!!benefitInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBenefitInfo(null)}
      >
        <TouchableOpacity
          style={styles.benefitInfoOverlay}
          activeOpacity={1}
          onPress={() => setBenefitInfo(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.benefitInfoCard}
          >
            <View style={styles.benefitInfoHeader}>
              <View style={[styles.benefitInfoIconWrap, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons
                  name={(PREMIUM_BENEFITS_META[activeBenefit?.index ?? 0]?.icon || 'information-circle-outline') as any}
                  size={24}
                  color="#000"
                />
              </View>
              <TouchableOpacity
                style={styles.benefitInfoClose}
                onPress={() => setBenefitInfo(null)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.benefitInfoTitle}>{[
              ...PREMIUM_BENEFITS_META.map((item) => item.label),
            ][activeBenefit?.index ?? 0]}</Text>
            <Text style={styles.benefitInfoText}>{activeBenefit?.data}</Text>
            <TouchableOpacity
              style={styles.benefitInfoBtn}
              onPress={() => setBenefitInfo(null)}
            >
              <Text style={styles.benefitInfoBtnText}>Got it</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
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
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3.5,
    borderColor: '#09090B',
    borderLeftColor: '#E4E4E7',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center'
  },
  ringInner: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: C.bg, transform: [{ rotate: '-45deg' }], overflow: 'hidden' },
  avatarBubbleImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  percentagePillBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#09090B',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 2.5,
    borderColor: '#FFFFFF'
  },
  percentagePillBadgeText: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  identityInfo: { flex: 1, justifyContent: 'center', gap: 12 },
  nameAgeText: { fontFamily: QS_BOLD, fontSize: 20, color: C.textMain, letterSpacing: -0.3 },
  completeBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#09090B',
  },
  completeBtnText: {
    fontFamily: QS_BOLD,
    fontSize: 12,
    color: '#09090B',
    fontWeight: '800',
    letterSpacing: 0.5
  },
  // Token counters
  tokenSectionWrapper: { paddingHorizontal: 24, marginBottom: 24 },
  tokenSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  tokenBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  tokenIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tokenValue: {
    fontFamily: QS_BOLD,
    fontSize: 15,
    color: '#1C1714',
    fontWeight: '800',
    lineHeight: 18,
  },
  tokenLabel: {
    fontFamily: QS_BOLD,
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Classic Tab Bar
  pillTabBar: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 28,
    backgroundColor: '#F4F4F5',
    borderRadius: 14,
    padding: 4,
  },

  pillTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  pillTabText: {
    fontFamily: QS_BOLD,
    fontSize: 12,
    fontWeight: '700',
    color: '#999999',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  pillTabTextActive: {
    fontFamily: QS_BOLD,
    fontSize: 12,
    color: '#000000',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // Section wrapper
  section: { paddingHorizontal: 16, marginBottom: 8 },

  // Tab: Plans
  tabContent: { paddingHorizontal: 4 },

  dreamiumTopCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    padding: 22,
    paddingBottom: 18,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(166,63,79,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    minHeight: 210,
  },
  dreamiumTopOrb: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(166,63,79,0.05)',
  },
  dreamiumTopContent: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 2,
    gap: 6,
    marginBottom: 20,
  },
  dreamiumTopHeadline: {
    fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    fontSize: 22,
    fontWeight: '600',
    fontStyle: 'italic',
    color: C.primary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  dreamiumTitleWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  dreamiumHeadlineBar: {
    height: 2,
    width: 24,
    backgroundColor: C.primary,
    marginTop: 4,
    borderRadius: 2,
  },
  dreamiumTopStatement: {
    fontFamily: QS_MEDIUM,
    fontSize: 14,
    color: C.textMuted,
    lineHeight: 22,
    maxWidth: '85%',
  },
  dreamiumCtaGradientSlim: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  dreamiumSectionHeader: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
    marginTop: 10
  },
  dreamiumSectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 15,
    fontWeight: '300',
    color: '#4B5563',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'left',
    lineHeight: 24,
  },
  dreamiumBenefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  dreamiumBenefitTile: {
    width: '48.2%',
    minHeight: 142,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dreamiumBenefitTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dreamiumBenefitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8EDEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dreamiumBenefitLabel: {
    fontFamily: QS_BOLD,
    fontSize: 13,
    color: '#1C1714',
    lineHeight: 17,
  },
  dreamiumBenefitDesc: {
    fontFamily: QS_MEDIUM,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 7,
    lineHeight: 16,
  },

  // Benefit Info Modal
  benefitInfoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  benefitInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  benefitInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitInfoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(166,63,79,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitInfoClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitInfoTitle: {
    fontFamily: QS_BOLD,
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1714',
    marginBottom: 12,
  },
  benefitInfoText: {
    fontFamily: QS_MEDIUM,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 24,
  },
  benefitInfoBtn: {
    backgroundColor: '#1C1714',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  benefitInfoBtnText: {
    fontFamily: QS_BOLD,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  dreamiumWeekly: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dreamiumWeeklyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dreamiumSectionLabel: {
    fontFamily: QS_BOLD,
    fontSize: 9,
    color: C.primary,
    letterSpacing: 1,
  },
  dreamiumWeeklyTitle: {
    fontFamily: QS_BOLD,
    fontSize: 16,
    fontWeight: '800',
    color: C.textMain,
    marginTop: 4,
    lineHeight: 20,
  },
  dreamiumWeeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dreamiumWeeklyItem: {
    alignItems: 'center',
    flex: 1,
    minHeight: 112,
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    padding: 10,
  },
  dreamiumWeeklyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dreamiumWeeklyText: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    fontWeight: '800',
    color: '#1C1714',
    textAlign: 'center',
  },
  dreamiumWeeklyMeta: {
    fontFamily: QS_MEDIUM,
    fontSize: 10,
    color: C.textLight,
    textAlign: 'center',
    marginTop: 3,
  },
  dreamiumCtaBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  dreamiumCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  dreamiumCtaText: {
    fontFamily: QS_BOLD,
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
});

// ─── Insights Styles ────────────────────────────────────────────────
const a2S = StyleSheet.create({
  tabContent: { paddingHorizontal: 4, paddingBottom: 24 },
  
  // Locked state styles
  lockedContainer: { paddingHorizontal: 4, paddingBottom: 24 },
  lockedHeader: { alignItems: 'center', marginBottom: 28, paddingHorizontal: 16 },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(166,63,79,0.07)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 12,
  },
  lockedBadgeText: { fontFamily: QS_BOLD, fontSize: 10, color: C.primary, letterSpacing: 1.2 },
  lockedTitle: { fontFamily: SERIF, fontSize: 24, color: C.textMain, textAlign: 'center', lineHeight: 30, marginBottom: 8 },
  lockedSubtitle: { fontFamily: QS_MEDIUM, fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 19, maxWidth: 290 },
  
  progressCenter: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  progressTextWrapper: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  progressValue: { fontFamily: QS_BOLD, fontSize: 18, color: C.textMain, fontWeight: '800' },
  progressLabel: { fontFamily: QS_MEDIUM, fontSize: 9, color: C.textLight, textTransform: 'uppercase', marginTop: 1 },
  
  lockedSectionHeader: { fontFamily: QS_BOLD, fontSize: 11, color: C.textLight, letterSpacing: 1, marginBottom: 14, paddingHorizontal: 16, textTransform: 'uppercase' },
  lockedCardsList: { gap: 14, paddingHorizontal: 8 },
  
  lockedCard: { borderRadius: 20, padding: 18, backgroundColor: '#FCFCFC', borderWidth: 1, borderColor: '#F1F5F9', position: 'relative', overflow: 'hidden', minHeight: 100 },
  lockedCardContent: { opacity: 0.28 },
  lockedCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(28,23,20,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  lockedCardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 },
  lockedCardBadgeText: { fontFamily: QS_BOLD, fontSize: 10, color: '#FFF', letterSpacing: 0.5 },

  // Unlocked state styles
  archetypeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(28,23,20,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  archetypeGradient: { padding: 20, minHeight: 210, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  archetypeLeft: { flex: 1, paddingRight: 16 },
  archetypeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: 10,
  },
  archetypeBadgeText: { fontFamily: QS_BOLD, fontSize: 9, color: '#FFE4E8', letterSpacing: 1.4, textTransform: 'uppercase' },
  archetypeName: { fontFamily: SERIF, fontSize: 24, color: '#FFFFFF', lineHeight: 30 },
  archetypeDesc: { fontFamily: QS_MEDIUM, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18, marginTop: 8 },
  archetypeGraphic: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  
  archetypeStats: { flexDirection: 'row', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  archetypeStatItem: { flex: 1 },
  archetypeStatVal: { fontFamily: QS_BOLD, fontSize: 13, color: '#FFF', fontWeight: '800' },
  archetypeStatLbl: { fontFamily: QS_MEDIUM, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  cosmicCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cosmicGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    position: 'relative',
  },
  cosmicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
    zIndex: 2,
  },
  cosmicCategory: {
    fontFamily: QS_BOLD,
    fontSize: FONT_SIZES.small_label - 1,
    color: '#FFE4E8',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  cosmicStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    zIndex: 2,
  },
  cosmicStatItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cosmicStatIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cosmicStatNumber: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cosmicStatLabel: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  cosmicStatSub: {
    fontFamily: QS_MEDIUM,
    fontSize: 8.5,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2.5,
  },
  cosmicDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: { marginBottom: 16 },
  cardCategory: { fontFamily: QS_BOLD, fontSize: 9, color: C.primary, letterSpacing: 1.2, textTransform: 'uppercase' },
  cardTitleText: { fontFamily: QS_BOLD, fontSize: 16, color: C.textMain, marginTop: 4 },
  
  chartContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  chartLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: 10 },
  chartLabelCol: { alignItems: 'center', width: 48 },
  chartLabelText: { fontFamily: QS_BOLD, fontSize: 9, color: C.textMuted, textAlign: 'center' },

  emotionsContainer: { gap: 14, marginTop: 4 },
  legendRow: { gap: 5 },
  legendInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legendNameWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontFamily: QS_BOLD, fontSize: 12, color: C.textMain },
  legendPct: { fontFamily: QS_BOLD, fontSize: 11, color: C.textMuted },
  legendBarBg: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
  legendBarFill: { height: '100%', borderRadius: 2 },

  motifGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  motifPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(166,63,79,0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(166,63,79,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  motifText: { fontFamily: QS_BOLD, fontSize: 12.5, color: C.textMain, letterSpacing: -0.1 },
  
  noDataText: { fontFamily: QS_MEDIUM, fontSize: 12, color: C.textMuted, fontStyle: 'italic', paddingVertical: 8 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1C1714',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  actionButtonText: { fontFamily: QS_BOLD, fontSize: 13, color: '#FFFFFF', letterSpacing: 0.5 },
});

// ─── Journal Styles ────────────────────────────────────────────────
const jS = StyleSheet.create({
  journalCounterCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(166,63,79,0.10)',
    shadowColor: '#A63F4F',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  journalCounterGradient: {
    padding: 16,
  },
  journalCounterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  journalCounterIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(166,63,79,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journalCounterMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  journalCounterValue: {
    fontFamily: QS_BOLD,
    fontSize: 34,
    fontWeight: '800',
    color: C.textMain,
    lineHeight: 38,
  },
  journalCounterLabel: {
    fontFamily: QS_MEDIUM,
    fontSize: 12,
    color: C.textMuted,
  },
  journalMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(166,63,79,0.10)',
  },
  journalMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  journalMetricValue: {
    fontFamily: QS_BOLD,
    fontSize: 13,
    fontWeight: '800',
    color: C.textMain,
    textAlign: 'center',
  },
  journalMetricLabel: {
    fontFamily: QS_MEDIUM,
    fontSize: 10,
    color: C.textLight,
    marginTop: 3,
    textAlign: 'center',
  },
  journalMetricDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(166,63,79,0.12)',
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#1C1714',
  },
  archiveBtnText: { fontFamily: QS_BOLD, fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  premiumPrompt: {
    marginBottom: 20,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(166,63,79,0.08)',
    shadowColor: C.primary,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  premiumPromptGradient: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    position: 'relative',
  },
  premiumPromptOrb: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(166,63,79,0.05)',
  },
  premiumPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 2,
  },
  premiumPromptIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(166,63,79,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumPromptTitle: {
    fontFamily: QS_BOLD,
    fontSize: 15,
    color: C.textMain,
    letterSpacing: -0.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  dreamiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(166,63,79,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 3,
  },
  dreamiumBadgeText: {
    fontFamily: QS_BOLD,
    fontSize: 8,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: 1.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  premiumPromptText: {
    fontFamily: QS_MEDIUM,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  sectionLabel: { fontFamily: QS_BOLD, fontSize: 9, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  sectionTitle: { fontFamily: QS_BOLD, fontSize: 16, fontWeight: '800', color: C.textMain, marginTop: 4, lineHeight: 20 },
  entryCount: { fontFamily: QS_BOLD, fontSize: 11, fontWeight: '800', color: C.textLight, marginTop: 2 },
  archiveLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  archiveLinkText: { fontFamily: QS_BOLD, fontSize: 12, fontWeight: '700', color: C.primary },
  listContainer: { paddingHorizontal: 0 },
  journalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardGradient: { padding: 16 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBadge: {
    width: 52,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: { fontFamily: QS_BOLD, fontSize: 8, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  dateDay: { fontFamily: SERIF, fontSize: 20, color: C.textMain, lineHeight: 22 },
  dateYear: { fontFamily: QS_MEDIUM, fontSize: 8, color: C.textLight, letterSpacing: 0.6 },
  cardHeaderContent: { flex: 1, minWidth: 0 },
  themePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
  },
  themeText: { fontFamily: QS_BOLD, fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  cardTitle: { fontFamily: SERIF, fontSize: 16.5, color: C.textMain, lineHeight: 24, fontStyle: 'italic' },
  cardDesc: { fontFamily: SERIF, fontSize: 13, color: C.textMuted, lineHeight: 22, marginTop: 14 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.12)',
    gap: 10,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: QS_MEDIUM, fontSize: 10, color: C.textLight, textAlign: 'right' },
  readMoreText: { marginLeft: 'auto', fontFamily: QS_BOLD, fontSize: 11, fontWeight: '800', color: C.primary, letterSpacing: 0.4 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8EDEF',
    marginBottom: 14,
  },
  emptyTitle: { fontFamily: QS_BOLD, fontSize: 16, fontWeight: '800', color: C.textMain, marginBottom: 6 },
  emptyText: { fontFamily: QS_MEDIUM, fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18 },
});
