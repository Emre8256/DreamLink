import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPremiumCtaCopy, PremiumCtaReason, logAnalyticsEvent } from '../services/api';

const allowedReasons: PremiumCtaReason[] = ['likesYou', 'dailyPicks', 'likeLimit', 'rewind', 'boost'];

const resolveReason = (reason?: string): PremiumCtaReason => {
  if (reason && allowedReasons.includes(reason as PremiumCtaReason)) {
    return reason as PremiumCtaReason;
  }
  return 'likeLimit';
};

export default function PremiumUpsellScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ reason?: string }>();
  const reason = resolveReason(params.reason);
  const copy = getPremiumCtaCopy(reason);
  const primaryLabel = 'Yakinda';

  useEffect(() => {
    void logAnalyticsEvent({
      name: 'paywall_view',
      source: 'premiumUpsell',
      reason,
    });
  }, [reason]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color="#5E5E72" />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <LinearGradient colors={['#A78BFA', '#7E6BFF']} style={styles.heroIcon}>
          <Ionicons name="star" size={28} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.message}>{copy.message}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Premium unlocks</Text>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={16} color="#7E6BFF" />
          <Text style={styles.rowText}>More Daily Picks</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={16} color="#7E6BFF" />
          <Text style={styles.rowText}>See who liked you</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={16} color="#7E6BFF" />
          <Text style={styles.rowText}>More daily likes</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => {
            void logAnalyticsEvent({
              name: 'paywall_cta_click',
              source: 'premiumUpsell',
              reason,
            });
            if (Platform.OS === 'web') window.alert('Yak\u0131nda\nPremium sat\u0131n alma ak\u0131\u015f\u0131 demo kapsam\u0131nda aktif de\u011fil.');
            else Alert.alert('Coming soon', 'Premium purchase flow is disabled in this demo.');
          }}
        >
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.secondaryText}>{copy.cancelLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FF', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'flex-end' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  hero: { alignItems: 'center', marginTop: 16, marginBottom: 18 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  message: { fontSize: 14, color: '#6A6E87', textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A2E', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  rowText: { fontSize: 13, color: '#3C3F55', fontWeight: '600' },
  actions: { marginTop: 18 },
  primaryBtn: {
    backgroundColor: '#7E6BFF',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  secondaryBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
  secondaryText: { color: '#7E6BFF', fontSize: 13, fontWeight: '700' },
});
