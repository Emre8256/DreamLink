import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getDiscoverFeed,
  getDailyPicks,
  likeDream,
  requestRewind,
  requestBoost,
  DiscoverCardResponse,
  formatRelativeTime,
  getPremiumCtaCopy,
  logAnalyticsEvent,
} from '../../services/api';
import { router } from 'expo-router';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};

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

const isBoostEntitlementError = (error: unknown) => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number }).status;
    return status === 403;
  }
  return error instanceof Error && error.message.includes('403');
};

// ─── Avatar Helper ────────────────────────────────────────────────────────────
const Avatar = ({ url, name, size = 46 }: { url: string | null; name: string; size?: number }) => {
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <LinearGradient
      colors={['#A78BFA', '#7E6BFF']}
      style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: '#fff' }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
};

// ─── Discover Card ────────────────────────────────────────────────────────────
const DiscoverCard = ({
  item,
  onLike,
  onSkip,
}: {
  item: DiscoverCardResponse;
  onLike: (dreamId: string) => void;
  onSkip: (item: DiscoverCardResponse) => void;
}) => (
  <View style={[styles.card, item.isHot && styles.cardHotGlow]}>
    {/* User Row */}
    <View style={styles.cardUserRow}>
      <Avatar url={item.matchedUserAvatarUrl} name={item.matchedUserNickname} size={46} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.cardName}>{item.matchedUserNickname}</Text>
        <Text style={styles.cardTime}>{formatRelativeTime(item.matchedAt)}</Text>
      </View>
      <View style={styles.scoreBadge}>
        <Text style={styles.scoreText}>%{item.similarityPercent}</Text>
      </View>
      {item.isHot && (
        <View style={styles.hotBadge}>
          <Text style={styles.hotText}>🔥 HOT</Text>
        </View>
      )}
    </View>

    {/* Dream Content */}
    <Text style={styles.cardTitle}>{item.matchedDreamTitle}</Text>
    {item.isHot && (
      <View style={styles.legendaryBadge}>
        <Ionicons name="sparkles" size={12} color="#8E5B00" />
        <Text style={styles.legendaryText}>Efsanevi Uyum</Text>
      </View>
    )}
    <Text style={styles.cardDesc} numberOfLines={3}>{item.matchedDreamDescription}</Text>

    {item.matchCount > 1 && (
      <View style={styles.matchCountRow}>
        <Ionicons name="sparkles" size={12} color="#7E6BFF" />
        <Text style={styles.matchCountText}>{item.matchCount} rüyan eşleşti</Text>
      </View>
    )}

    {/* Actions */}
    <View style={styles.cardActions}>
      <TouchableOpacity style={styles.skipBtn} onPress={() => onSkip(item)} activeOpacity={0.8}>
        <Ionicons name="close" size={26} color="#8A8CA8" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.likeBtn} onPress={() => onLike(item.matchedDreamId)} activeOpacity={0.8}>
        <Ionicons name="heart" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Ionicons name="telescope-outline" size={40} color="#C1C8FF" />
    </View>
    <Text style={styles.emptyTitle}>Henüz eşleşme yok</Text>
    <Text style={styles.emptySub}>Rüya paylaş ve benzer rüyalar burada çıksın.</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<DiscoverCardResponse[]>([]);
  const [dailyPicks, setDailyPicks] = useState<DiscoverCardResponse[]>([]);
  const [dailyVisibleCount, setDailyVisibleCount] = useState(0);
  const [dailyLocked, setDailyLocked] = useState(false);
  const [dailyHasMorePremium, setDailyHasMorePremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rewindStack, setRewindStack] = useState<DiscoverCardResponse[]>([]);
  const [boostLoading, setBoostLoading] = useState(false);

  const removeCardFromLists = (dreamId: string) => {
    setCards(prev => prev.filter(c => c.matchedDreamId !== dreamId));
    setDailyPicks(prev => prev.filter(c => c.matchedDreamId !== dreamId));
  };

  const load = useCallback(async () => {
    try {
      const results = await Promise.allSettled([getDailyPicks(), getDiscoverFeed()]);
      if (results[0].status === 'fulfilled') {
        const daily = results[0].value;
        setDailyPicks(daily.picks);
        setDailyVisibleCount(daily.visibleCount);
        setDailyLocked(daily.locked);
        setDailyHasMorePremium(daily.hasMorePremium);
        void logAnalyticsEvent({
          name: 'daily_picks_view',
          source: 'dailyPicks',
          properties: {
            visibleCount: daily.visibleCount,
            locked: daily.locked,
            hasMorePremium: daily.hasMorePremium,
            picksCount: daily.picks.length,
          },
        });
      } else {
        console.error('Daily picks error:', results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        const dailyIds = new Set(
          (results[0].status === 'fulfilled' ? results[0].value.picks : []).map(p => p.matchedDreamId)
        );
        const filtered = results[1].value.filter(c => !dailyIds.has(c.matchedDreamId));
        setCards(filtered);
      } else {
        console.error('Discover feed error:', results[1].reason);
      }
    } catch (e) {
      console.error('Discover load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLike = async (dreamId: string) => {
    try {
      await likeDream(dreamId);
      removeCardFromLists(dreamId);
    } catch (e) {
      if (isLikeLimitError(e)) {
        router.push({ pathname: '/premium-upsell', params: { reason: 'likeLimit' } });
        return;
      }
      showAlert('Hata', 'Begeni gonderilemedi.');
    }
  };

  const handleSkip = (item: DiscoverCardResponse) => {
    const existsInLists = cards.some(c => c.matchedDreamId === item.matchedDreamId)
      || dailyPicks.some(c => c.matchedDreamId === item.matchedDreamId);
    if (!existsInLists) {
      return;
    }
    removeCardFromLists(item.matchedDreamId);
    setRewindStack(prev => [item, ...prev].slice(0, 10));
  };

  const handleRewind = async () => {
    if (rewindStack.length === 0) {
      showAlert('Rewind', 'Geri alinacak bir kart yok.');
      return;
    }
    try {
      await requestRewind();
      const [last, ...rest] = rewindStack;
      setRewindStack(rest);
      setCards(prev => [last, ...prev]);
    } catch (e) {
      if (isRewindEntitlementError(e)) {
        router.push({ pathname: '/premium-upsell', params: { reason: 'rewind' } });
        return;
      }
      showAlert('Hata', 'Rewind kullanilamadi.');
    }
  };

  const handleBoost = async () => {
    if (boostLoading) {
      return;
    }
    try {
      setBoostLoading(true);
      await requestBoost();
      showAlert('Boost', 'Boost istegi kaydedildi.');
    } catch (e) {
      if (isBoostEntitlementError(e)) {
        router.push({ pathname: '/premium-upsell', params: { reason: 'boost' } });
        return;
      }
      showAlert('Hata', 'Boost kullanilamadi.');
    } finally {
      setBoostLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7E6BFF" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Benzer Rüyalar</Text>
          <Text style={styles.headerSub}>Rüya bağlantılarını keşfet</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.rewindBtn, boostLoading && styles.boostBtnDisabled]}
            onPress={handleBoost}
            activeOpacity={0.85}
            disabled={boostLoading}
          >
            <Ionicons name="flash" size={18} color={boostLoading ? '#B9B9C9' : '#7E6BFF'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rewindBtn, rewindStack.length === 0 && styles.rewindBtnDisabled]}
            onPress={handleRewind}
            activeOpacity={0.85}
            disabled={rewindStack.length === 0}
          >
            <Ionicons
              name="arrow-undo"
              size={18}
              color={rewindStack.length === 0 ? '#B9B9C9' : '#7E6BFF'}
            />
          </TouchableOpacity>
          {cards.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{cards.length}</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={cards}
        keyExtractor={i => i.matchId}
        renderItem={({ item }) => (
          <DiscoverCard item={item} onLike={handleLike} onSkip={handleSkip} />
        )}
        ListHeaderComponent={
          <View style={styles.dailySection}>
            <View style={styles.dailyHeader}>
              <Text style={styles.dailyTitle}>Günün Seçimleri</Text>
              {dailyVisibleCount > 0 && (
                <Text style={styles.dailyCount}>{dailyVisibleCount} kart</Text>
              )}
            </View>
            {dailyPicks.length > 0 && (
              <View>
                {dailyPicks.map(item => (
                  <DiscoverCard
                    key={`daily-${item.matchId}`}
                    item={item}
                    onLike={handleLike}
                    onSkip={handleSkip}
                  />
                ))}
              </View>
            )}
            {dailyLocked && dailyHasMorePremium && (
              <View style={styles.dailyLockedCard}>
                <View style={styles.dailyLockedIcon}>
                  <Ionicons name="lock-closed" size={18} color="#7E6BFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dailyLockedTitle}>Daha fazla gunluk secim</Text>
                  <Text style={styles.dailyLockedSub}>Premium ile ekstra kartlari ac.</Text>
                </View>
                <TouchableOpacity
                  style={styles.dailyCta}
                  onPress={() => {
                    router.push({ pathname: '/premium-upsell', params: { reason: 'dailyPicks' } });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dailyCtaText}>{getPremiumCtaCopy('dailyPicks').ctaLabel}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor="#7E6BFF"
          />
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F6FF' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 30, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#7E6BFF', fontWeight: '600', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rewindBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6E6FA',
  },
  rewindBtnDisabled: { opacity: 0.6 },
  boostBtnDisabled: { opacity: 0.7 },
  countBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7E6BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  dailySection: { marginBottom: 6 },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  dailyTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  dailyCount: { fontSize: 12, fontWeight: '700', color: '#7E6BFF' },
  dailyLockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  dailyLockedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(126,107,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dailyLockedTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A2E' },
  dailyLockedSub: { fontSize: 12, color: '#8A8CA8', marginTop: 2 },
  dailyCta: {
    marginLeft: 10,
    backgroundColor: '#7E6BFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  dailyCtaText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHotGlow: {
    borderWidth: 1.5,
    borderColor: '#F6C453',
    shadowColor: '#F6C453',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  cardUserRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  cardTime: { fontSize: 12, color: '#B0B3C8', marginTop: 2 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 6, lineHeight: 23 },
  legendaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#FFE9B6',
    borderWidth: 1,
    borderColor: '#F6C453',
  },
  legendaryText: { fontSize: 12, fontWeight: '800', color: '#8E5B00' },
  cardDesc: { fontSize: 14, color: '#5E5E72', lineHeight: 21 },

  scoreBadge: {
    backgroundColor: 'rgba(126,107,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  scoreText: { fontSize: 12, fontWeight: '800', color: '#7E6BFF' },
  hotBadge: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hotText: { fontSize: 11, fontWeight: '700', color: '#FF6B6B' },

  matchCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    backgroundColor: 'rgba(126,107,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  matchCountText: { fontSize: 12, fontWeight: '600', color: '#7E6BFF' },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  skipBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F5F6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7F0',
  },
  likeBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },

  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(193,200,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(126,107,255,0.1)',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#2D2D3A', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#8A8CA8', textAlign: 'center', lineHeight: 21 },
});