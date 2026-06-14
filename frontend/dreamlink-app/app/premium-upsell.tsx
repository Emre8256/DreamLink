import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPremiumCtaCopy, logAnalyticsEvent, PremiumCtaReason } from '../services/api';

const QS_BOLD = 'Quicksand_700Bold';
const QS_MEDIUM = 'Quicksand_500Medium';
const QS_SEMIBOLD = 'Quicksand_600SemiBold';

const C = {
  primary: '#A63F4F',
  primaryDark: '#7D2D3A',
  roseLt: '#F8EDEF',
  roseMd: '#D697A2',
  textMain: '#1C1714',
  textMuted: '#475569',
  textLight: '#94A3B8',
  gold: '#B8860B',
  goldLt: '#FDF6E3',
};

const allowedReasons: PremiumCtaReason[] = ['likesYou', 'dailyPicks', 'likeLimit', 'rewind', 'boost'];

const resolveReason = (reason?: string): PremiumCtaReason => {
  if (reason && allowedReasons.includes(reason as PremiumCtaReason)) {
    return reason as PremiumCtaReason;
  }
  return 'likeLimit';
};

type PlanKey = 'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'yearly';

type Plan = {
  key: PlanKey;
  title: string;
  period: string;
  price: string;
  pricePerWeek: string;
  originalPrice?: string;
  badge?: string;
  saveTag?: string;
  highlight: boolean;
  icon: string;
  detail: string;
};

const PLANS: Plan[] = [
  {
    key: 'weekly',
    title: '1 Week',
    period: 'per week',
    price: '$4.99',
    pricePerWeek: '$4.99 / week',
    badge: 'Try it',
    highlight: false,
    icon: 'calendar-outline',
    detail: 'Full access, no commitment.',
  },
  {
    key: 'monthly',
    title: '1 Month',
    period: 'per month',
    price: '$14.99',
    pricePerWeek: '$3.75 / week',
    originalPrice: '$19.96',
    badge: 'Popular',
    saveTag: 'Save 25%',
    highlight: false,
    icon: 'sparkles-outline',
    detail: 'Best for active dreamers.',
  },
  {
    key: 'quarterly',
    title: '3 Months',
    period: 'per 3 months',
    price: '$34.99',
    pricePerWeek: '$2.69 / week',
    originalPrice: '$59.88',
    badge: 'Great value',
    saveTag: 'Save 42%',
    highlight: true,
    icon: 'moon-outline',
    detail: 'Most popular among committed users.',
  },
  {
    key: 'biannual',
    title: '6 Months',
    period: 'per 6 months',
    price: '$59.99',
    pricePerWeek: '$2.31 / week',
    originalPrice: '$119.76',
    badge: 'Best deal',
    saveTag: 'Save 50%',
    highlight: false,
    icon: 'star-outline',
    detail: 'For serious dream seekers.',
  },
  {
    key: 'yearly',
    title: '1 Year',
    period: 'per year',
    price: '$89.99',
    pricePerWeek: '$1.73 / week',
    originalPrice: '$239.52',
    saveTag: 'Save 62%',
    highlight: false,
    icon: 'diamond-outline',
    detail: 'Maximum savings, full year of dreams.',
  },
];

const PREMIUM_FEATURES = [
  { icon: 'eye-outline', title: 'Who Liked You', text: 'See who liked your profile before matching.' },
  { icon: 'infinite-outline', title: 'Unlimited Likes', text: 'Swipe and match with zero daily limits.' },
  { icon: 'return-up-back-outline', title: 'Unlimited Rewind', text: 'Instantly bring back skipped profiles.' },
  { icon: 'shield-checkmark-outline', title: 'Incognito Mode', text: 'Browse and view profiles anonymously.' },
  { icon: 'male-female-outline', title: 'Gender Filter', text: 'Filter matches by gender to find the right connection.' },
  { icon: 'chatbubble-ellipses-outline', title: 'Dream Interpretation', text: 'Deep interpretation and insights into your subconscious.' },
];

export default function PremiumUpsellScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ reason?: string }>();
  const reason = resolveReason(params.reason);
  const copy = getPremiumCtaCopy(reason);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;

  const visibleFeatures = showAllFeatures ? PREMIUM_FEATURES : PREMIUM_FEATURES.slice(0, 4);

  useEffect(() => {
    void logAnalyticsEvent({ name: 'paywall_view', source: 'premiumUpsell', reason });
  }, [reason]);

  useEffect(() => {
    const motion = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    motion.start();
    return () => motion.stop();
  }, [floatAnim]);

  const activePlan = PLANS.find((p) => p.key === selectedPlan) ?? PLANS[2];

  const handleContinue = () => {
    void logAnalyticsEvent({ name: 'paywall_cta_click', source: 'premiumUpsell', reason });
    const message = `${activePlan.title} plan (${activePlan.price}) purchase flow is coming soon.`;
    if (Platform.OS === 'web') window.alert(`Coming soon\n${message}`);
    else Alert.alert('Coming soon', message);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1714" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── HERO ── */}
        <View style={styles.hero}>
          <Image source={require('../assets/images/premium.png')} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient colors={['rgba(28,23,20,0.05)', 'rgba(28,23,20,0.55)', '#1C1714']} style={StyleSheet.absoluteFill} />

          {/* Close */}
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.8}>
            <Ionicons name="close" size={21} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Hero copy — fixed slogan, no dynamic copy */}
          <View style={styles.heroCopy}>
            <Text style={styles.heroSlogan}>Dream deeper.{'\n'}Connect stronger.</Text>
          </View>
        </View>

        {/* ── PLAN SELECTOR ── */}
        <View style={styles.planSection}>
          <Text style={styles.sectionLabel}>SELECT YOUR PLAN</Text>
          <Text style={styles.sectionTitle}>Choose the rhythm that fits you</Text>
        </View>

        {/* Horizontal chip scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.planChipScroll}
          style={styles.planChipScrollWrap}
        >
          {PLANS.map((plan) => {
            const active = selectedPlan === plan.key;
            return (
              <TouchableOpacity
                key={plan.key}
                activeOpacity={0.82}
                onPress={() => setSelectedPlan(plan.key)}
                style={[styles.planChip, active && styles.planChipActive]}
              >
                {/* Left Side: Info */}
                <View style={styles.chipLeftSection}>
                  <Text style={[styles.chipDuration, active && styles.chipDurationActive]}>
                    {plan.title}
                  </Text>
                  <View style={styles.chipPriceGroup}>
                    <Text style={[styles.chipPrice, active && styles.chipPriceActive]}>
                      {plan.price}
                    </Text>
                    <Text style={[styles.chipPerWeek, active && styles.chipPerWeekActive]}>
                      {plan.pricePerWeek}
                    </Text>
                  </View>
                </View>

                {/* Right Side: Badges */}
                <View style={styles.chipRightSection}>
                  <View style={styles.chipBadgeTop}>
                    {plan.highlight && (
                      <Text style={[styles.chipPopularTag, active && styles.chipPopularTagActive]}>
                        POPULAR
                      </Text>
                    )}
                  </View>

                  <View style={styles.chipBadgeBottom}>
                    {plan.saveTag && (
                      <View style={[styles.chipSaveTag, active && styles.chipSaveTagActive]}>
                        <Text style={[styles.chipSaveTagText, active && styles.chipSaveTagTextActive]}>
                          {plan.saveTag}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── FEATURES ── */}
        <View style={styles.featurePanel}>
          <View style={styles.featureHeader}>
            <View>
              <Text style={styles.sectionLabel}>WHAT'S INCLUDED</Text>
              <Text style={styles.sectionTitle}>All Dreamium advantages</Text>
            </View>
          </View>

          <View style={styles.featureGrid}>
            {visibleFeatures.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={16} color={C.primary} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Show all / collapse */}
          <TouchableOpacity
            style={styles.showAllBtn}
            activeOpacity={0.7}
            onPress={() => setShowAllFeatures((v) => !v)}
          >
            <Text style={styles.showAllBtnText}>
              {showAllFeatures ? 'Show less' : `See all ${PREMIUM_FEATURES.length} benefits`}
            </Text>
            <Ionicons
              name={showAllFeatures ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={C.primary}
            />
          </TouchableOpacity>
        </View>

        {/* ── TRUST SIGNALS ── */}
        <View style={styles.trustRow}>
          {[
            { icon: 'shield-checkmark-outline', text: 'Cancel anytime' },
            { icon: 'lock-closed-outline', text: 'Secure payment' },
            { icon: 'refresh-outline', text: '7-day refund' },
          ].map((item) => (
            <View key={item.text} style={styles.trustItem}>
              <Ionicons name={item.icon as any} size={15} color={C.textMuted} />
              <Text style={styles.trustText}>{item.text}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── STICKY FOOTER ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.86} onPress={handleContinue}>
          <LinearGradient
            colors={['#A63F4F', '#4A1D24']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.primaryGradient}
          >
            <View>
              <Text style={styles.primaryText}>Continue with {activePlan.title}</Text>
              <Text style={styles.primarySub}>{activePlan.price} · {activePlan.period}</Text>
            </View>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.secondaryText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 148 },

  // Hero
  hero: { height: 320, backgroundColor: '#1C1714', overflow: 'hidden', justifyContent: 'flex-end' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  closeBtn: {
    position: 'absolute', right: 18, top: 14,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroCopy: { paddingHorizontal: 22, paddingBottom: 30 },
  heroSlogan: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontFamily: QS_MEDIUM,
    fontSize: 13,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 20,
    marginTop: 12,
    maxWidth: 310,
  },

  // Plan section
  planSection: { paddingHorizontal: 20, paddingTop: 26 },
  sectionLabel: { fontFamily: QS_BOLD, fontSize: 9, color: C.primary, letterSpacing: 1.4, textTransform: 'uppercase' },
  sectionTitle: { fontFamily: QS_BOLD, fontSize: 19, color: C.textMain, marginTop: 4, lineHeight: 24, letterSpacing: -0.5 },

  // Horizontal chip scroll
  planChipScrollWrap: { marginTop: 6 },
  planChipScroll: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10, gap: 12 },

  planChip: {
    width: 240,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  planChipActive: {
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: '#FFF4F5',
    shadowColor: C.primary,
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },

  chipLeftSection: { flex: 1, justifyContent: 'space-between' },
  chipRightSection: { alignItems: 'flex-end', justifyContent: 'space-between' },
  chipPriceGroup: { gap: 2 },

  chipPopularTag: {
    fontFamily: QS_BOLD,
    fontSize: 8,
    color: C.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chipPopularTagActive: { color: C.primaryDark },

  chipDuration: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif-medium',
    fontSize: 16,
    color: C.textMain,
    fontWeight: '700',
  },
  chipDurationActive: { color: C.primaryDark },

  chipPrice: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    fontSize: 22,
    color: C.textMain,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  chipPriceActive: { color: C.primary },

  chipPerWeek: {
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
    fontSize: 11,
    color: C.textLight,
  },
  chipPerWeekActive: { color: C.textMuted },

  chipBadgeTop: { height: 12 },
  chipBadgeBottom: {},

  chipSaveTag: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipSaveTagActive: { backgroundColor: '#15803D' },
  chipSaveTagText: { fontFamily: QS_BOLD, fontSize: 9, color: '#15803D', letterSpacing: 0.5 },
  chipSaveTagTextActive: { color: '#FFFFFF' },

  // Features
  featurePanel: {
    marginHorizontal: 20, marginTop: 14,
    padding: 18, borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1,
  },
  featureHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: {
    width: '48.2%', minHeight: 124, borderRadius: 16, padding: 12,
    backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)',
  },
  featureIcon: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.roseLt, marginBottom: 10,
  },
  featureCardActive: { borderColor: C.primary, backgroundColor: '#FFF8F9' },
  featureTitle: { fontFamily: QS_BOLD, fontSize: 12, color: C.textMain },
  featureText: { fontFamily: QS_MEDIUM, fontSize: 11, color: C.textMuted, lineHeight: 16, marginTop: 5 },

  showAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  showAllBtnText: { fontFamily: QS_BOLD, fontSize: 12, color: C.primary },

  // Trust signals
  trustRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 20, marginTop: 18, marginBottom: 6, paddingHorizontal: 20,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontFamily: QS_MEDIUM, fontSize: 10, color: C.textMuted },

  // Footer
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  primaryBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#A63F4F', shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  primaryGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20 },
  primaryText: { fontFamily: QS_BOLD, color: '#FFFFFF', fontSize: 15, letterSpacing: 0.2 },
  primarySub: { fontFamily: QS_MEDIUM, color: 'rgba(255,255,255,0.70)', fontSize: 11, marginTop: 2 },
  secondaryBtn: { alignItems: 'center', paddingVertical: 12 },
  secondaryText: { fontFamily: QS_SEMIBOLD, color: C.textMuted, fontSize: 12 },
});
