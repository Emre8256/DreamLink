import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import wsService from '../../services/websocket';
import { useAppStore } from '../../store/useAppStore';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getMyLikes,
  getLikedMe,
  getMutualMatches,
  LikeResponse,
  MutualMatchResponse,
  formatRelativeTime,
  getPremiumCtaCopy,
} from '../../services/api';
// router import moved to top

type Tab = 'likedMe' | 'myLikes' | 'mutual';

const isForbiddenError = (error: unknown) => {
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

// ─── Like Card ────────────────────────────────────────────────────────────────
const LikeCard = ({ item }: { item: LikeResponse }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.85}
    onPress={() => router.push(`/dream/${item.dreamId}`)}
  >
    <View style={styles.cardRow}>
      <Avatar url={item.relatedUserAvatarUrl} name={item.relatedUserNickname} size={48} />
      <View style={{ flex: 1, marginLeft: 13 }}>
        <Text style={styles.cardName}>{item.relatedUserNickname}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>"{item.dreamTitle}"</Text>
        <Text style={styles.cardTime}>{formatRelativeTime(item.likedAt)}</Text>
      </View>
      <View style={styles.heartBadge}>
        <Ionicons name="heart" size={16} color="#FF6B6B" />
      </View>
    </View>
  </TouchableOpacity>
);

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};

// ─── Mutual Card ──────────────────────────────────────────────────────────────
const MutualCard = ({ item }: { item: MutualMatchResponse }) => (
  <TouchableOpacity
    style={[styles.card, styles.mutualCard]}
    activeOpacity={0.85}
    onPress={() => {
      if (item.conversationId) {
        router.push({
          pathname: '/chatbox',
          params: {
            conversationId: item.conversationId,
            name: item.nickname,
            avatar: item.avatarUrl || ''
          }
        });
      } else {
        showAlert('Bilgi', 'Sohbet henüz oluşturulmamış.');
      }
    }}
  >
    <View style={styles.cardRow}>
      <View style={{ position: 'relative' }}>
        <Avatar url={item.avatarUrl} name={item.nickname} size={50} />
        <View style={styles.mutualDot} />
      </View>
      <View style={{ flex: 1, marginLeft: 13 }}>
        <Text style={styles.cardName}>{item.nickname}</Text>
        <Text style={styles.mutualSub}>Karşılıklı eşleşme ✨</Text>
        <Text style={styles.cardTime}>{formatRelativeTime(item.matchedAt)}</Text>
      </View>
      <View style={styles.chatBtn}>
        <Ionicons name="chatbubble" size={16} color="#fff" />
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ tab }: { tab: Tab }) => {
  const configs: Record<Tab, { icon: string; title: string; sub: string }> = {
    likedMe: { icon: 'heart-outline', title: 'Henüz beğeni yok', sub: 'Rüyaların başkalarının ilgisini çektiğinde burada görünür.' },
    myLikes: { icon: 'thumbs-up-outline', title: 'Henüz beğenmedin', sub: "Discover'a çık ve ilginç rüyaları beğen!" },
    mutual: { icon: 'sparkles-outline', title: 'Henüz eşleşme yok', sub: 'Karşılıklı beğeni olduğunda burada görünür.' },
  };
  const c = configs[tab];
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={c.icon as any} size={38} color="#C1C8FF" />
      </View>
      <Text style={styles.emptyTitle}>{c.title}</Text>
      <Text style={styles.emptySub}>{c.sub}</Text>
    </View>
  );
};

const LockedState = ({ onUpgrade, ctaLabel }: { onUpgrade: () => void; ctaLabel: string }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Ionicons name="lock-closed" size={34} color="#7E6BFF" />
    </View>
    <Text style={styles.emptyTitle}>Premium gerekli</Text>
    <Text style={styles.emptySub}>
      Beni Beğenenler sadece Premium için. Premium ile kimlerin seni beğendiğini gör.
    </Text>
    <TouchableOpacity style={styles.paywallButton} onPress={onUpgrade} activeOpacity={0.85}>
      <Text style={styles.paywallButtonText}>{ctaLabel}</Text>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('likedMe');
  const [myLikes, setMyLikes] = useState<LikeResponse[]>([]);
  const [likedMe, setLikedMe] = useState<LikeResponse[]>([]);
  const [likedMeLocked, setLikedMeLocked] = useState(false);
  const [mutual, setMutual] = useState<MutualMatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const results = await Promise.allSettled([getMyLikes(), getMutualMatches()]);
      if (results[0].status === 'fulfilled') {
        setMyLikes(results[0].value);
      } else {
        console.error('Failed to load my likes:', results[0].reason);
      }
      if (results[1].status === 'fulfilled') {
        setMutual(results[1].value);
      } else {
        console.error('Failed to load mutual matches:', results[1].reason);
      }

      try {
        const lm = await getLikedMe();
        setLikedMe(lm);
        setLikedMeLocked(false);
      } catch (e) {
        if (isForbiddenError(e)) {
          setLikedMe([]);
          setLikedMeLocked(true);
        } else {
          console.error('Failed to load liked me:', e);
        }
      }
    } catch (e) {
      console.error('Failed to load matches:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const setUnreadMatches = useAppStore(state => state.setUnreadMatches);

  useEffect(() => { loadAll(); }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      // Sayfaya odaklanıldığında bildirimi temizle
      setUnreadMatches(false);
    }, [loadAll, setUnreadMatches])
  );

  // WebSocket: gerçek zamanlı match bildirimi
  useEffect(() => {
    wsService.connect();
    const handler = (match: any) => {
      useAppStore.getState().addMatch(match);
      loadAll(); // listeyi de tazele
      // Bildirim noktasını göster
      setUnreadMatches(true);
    };
    wsService.subscribe('/user/queue/matches', handler);
    return () => wsService.unsubscribe('/user/queue/matches');
  }, [loadAll, setUnreadMatches]);

  const tabs: { id: Tab; label: string; icon: string; count?: number; locked?: boolean }[] = [
    { id: 'likedMe', label: 'Beni Beğenenler', icon: 'heart', count: likedMeLocked ? undefined : likedMe.length, locked: likedMeLocked },
    { id: 'myLikes', label: 'Beğendiklerim', icon: 'thumbs-up' },
    { id: 'mutual', label: 'Eşleşmeler', icon: 'sparkles', count: mutual.length },
  ];

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7E6BFF" />
      </View>
    );
  }

  const renderContent = () => {
    const refreshCtrl = (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); loadAll(); }}
        tintColor="#7E6BFF"
      />
    );

    const premiumCta = getPremiumCtaCopy('likesYou');
    const openPremiumCta = () => {
      router.push({ pathname: '/premium-upsell', params: { reason: 'likesYou' } });
    };

    if (activeTab === 'likedMe') {
      return (
        <FlatList
          data={likedMe}
          keyExtractor={i => i.likeId}
          renderItem={({ item }) => <LikeCard item={item} />}
          ListEmptyComponent={
            likedMeLocked
                ? <LockedState onUpgrade={openPremiumCta} ctaLabel={premiumCta.ctaLabel} />
              : <EmptyState tab="likedMe" />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshCtrl}
        />
      );
    }
    if (activeTab === 'myLikes') {
      return (
        <FlatList
          data={myLikes}
          keyExtractor={i => i.likeId}
          renderItem={({ item }) => <LikeCard item={item} />}
          ListEmptyComponent={<EmptyState tab="myLikes" />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshCtrl}
        />
      );
    }
    return (
      <FlatList
        data={mutual}
        keyExtractor={i => i.userId}
        renderItem={({ item }) => <MutualCard item={item} />}
        ListEmptyComponent={<EmptyState tab="mutual" />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshCtrl}
      />
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Eşleşmeler</Text>
          <Text style={styles.headerSub}>Rüya bağlantıların</Text>
        </View>
        {mutual.length > 0 && (
          <View style={styles.mutualBadge}>
            <Ionicons name="sparkles" size={13} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.mutualBadgeText}>{mutual.length} eşleşme</Text>
          </View>
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={(isActive ? tab.icon : `${tab.icon}-outline`) as any}
                size={15}
                color={isActive ? '#fff' : '#8A8CA8'}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.locked ? (
                <View style={[styles.badge, styles.badgeInactive]}>
                  <Ionicons name="lock-closed" size={10} color="#7E6BFF" />
                </View>
              ) : tab.count != null && tab.count > 0 && (
                <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {renderContent()}
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
  mutualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7E6BFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mutualBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ECEEFF',
    borderRadius: 16,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#7E6BFF',
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: { fontSize: 11, fontWeight: '600', color: '#8A8CA8' },
  tabLabelActive: { color: '#fff' },
  badge: { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, minWidth: 16, alignItems: 'center' },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeInactive: { backgroundColor: '#fff' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#7E6BFF' },
  badgeTextActive: { color: '#fff' },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  mutualCard: {
    borderWidth: 1.5,
    borderColor: 'rgba(126,107,255,0.2)',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  cardSub: { fontSize: 13, color: '#7E6BFF', fontWeight: '500', marginTop: 2 },
  cardTime: { fontSize: 12, color: '#B0B3C8', marginTop: 3 },

  heartBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,107,107,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  mutualDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  mutualSub: { fontSize: 13, color: '#7E6BFF', fontWeight: '600', marginTop: 2 },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7E6BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(193,200,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(126,107,255,0.1)',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#2D2D3A', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#8A8CA8', textAlign: 'center', lineHeight: 21 },
  paywallButton: {
    marginTop: 14,
    backgroundColor: '#7E6BFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
  },
  paywallButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});