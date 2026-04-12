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

type Tab = 'likedMe' | 'myLikes' | 'mutual';

const PRIMARY_COLOR = '#B3717A';

const isForbiddenError = (error: unknown) => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number }).status;
    return status === 403;
  }
  return error instanceof Error && error.message.includes('403');
};

// ─── Avatar Helper ────────────────────────────────────────────────────────────
const Avatar = ({ url, name, size = 46, style }: { url: string | null; name: string; size?: number; style?: any }) => {
  if (url) {
    return <Image source={{ uri: url }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} />;
  }
  return (
    <LinearGradient
      colors={['#f1f5f9', '#e2e8f0']}
      style={[{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }, style]}
    >
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: '#94a3b8' }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
};

// ─── Like Card ────────────────────────────────────────────────────────────────
const LikeCard = ({ item, tab }: { item: LikeResponse; tab: Tab }) => {
  const subtitlePrefix = tab === 'likedMe' ? 'Liked your dream:' : 'You liked:';

  return (
    <TouchableOpacity
      style={styles.glassCard}
      activeOpacity={0.85}
      onPress={() => router.push(`/dream/${item.dreamId}`)}
    >
      <View style={styles.cardRow}>
        <View style={styles.avatarWrapper}>
           <Avatar url={item.relatedUserAvatarUrl} name={item.relatedUserNickname} size={56} style={styles.avatarWhiteBorder} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.cardNameLarge} numberOfLines={1}>{item.relatedUserNickname}</Text>
          <Text style={styles.cardSubLight} numberOfLines={1}>
             {subtitlePrefix} <Text style={{fontWeight: '700', color: '#334155'}}>{item.dreamTitle}</Text>
          </Text>
          <Text style={styles.cardTimeCaps}>{formatRelativeTime(item.likedAt)}</Text>
        </View>

        <View style={styles.cardActionContainer}>
          {tab === 'myLikes' ? (
             <Ionicons name="heart" size={24} color={PRIMARY_COLOR} />
          ) : (
             <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Mutual Card ──────────────────────────────────────────────────────────────
const MutualCard = ({ item }: { item: MutualMatchResponse }) => (
  <View style={styles.matchCard}>
    <View style={styles.cardRow}>
      <View style={styles.avatarWrapper}>
        <Avatar url={item.avatarUrl} name={item.nickname} size={64} style={styles.avatarRing} />
      </View>
      <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
        <Text style={styles.cardNameLarge}>{item.nickname}</Text>
        <Text style={styles.cardTimeCaps}>MATCHED {formatRelativeTime(item.matchedAt).toUpperCase()}</Text>
      </View>
    </View>

    <View style={{ marginTop: 16, marginBottom: 16 }}>
      <Text style={styles.cardSubLight}>
        Sen ve <Text style={{fontWeight: '700', color: PRIMARY_COLOR}}>{item.nickname}</Text> karşılıklı olarak eşleştiniz!
      </Text>
    </View>

    <TouchableOpacity
      style={styles.startChatButton}
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
          Alert.alert('Info', 'Chat has not been created yet.');
        }
      }}
    >
      <Ionicons name="chatbubble" size={18} color="#fff" style={{marginRight: 8}} />
      <Text style={styles.startChatButtonText}>Start Chat</Text>
    </TouchableOpacity>
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ tab }: { tab: Tab }) => {
    const configs: Record<Tab, { icon: string; title: string; sub: string }> = {
    likedMe: { icon: 'heart-outline', title: 'No likes yet', sub: 'When people like your dreams, they’ll show up here.' },
    myLikes: { icon: 'thumbs-up-outline', title: "You haven't liked anything yet", sub: 'Explore Discover and like dreams you enjoy.' },
    mutual: { icon: 'sparkles-outline', title: 'No matches yet', sub: 'Mutual likes will appear here.' },
  };
  const c = configs[tab];
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={c.icon as any} size={38} color="#94a3b8" />
      </View>
      <Text style={styles.emptyTitle}>{c.title}</Text>
      <Text style={styles.emptySub}>{c.sub}</Text>
    </View>
  );
};

const LockedState = ({ onUpgrade, ctaLabel }: { onUpgrade: () => void; ctaLabel: string }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Ionicons name="lock-closed" size={34} color={PRIMARY_COLOR} />
    </View>
    <Text style={styles.emptyTitle}>Premium required</Text>
    <Text style={styles.emptySub}>
      Likes You is a Premium feature. Upgrade to see who liked your dreams.
    </Text>
    <TouchableOpacity style={styles.startChatButton} onPress={onUpgrade} activeOpacity={0.85}>
      <Text style={styles.startChatButtonText}>{ctaLabel}</Text>
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
      if (results[0].status === 'fulfilled') setMyLikes(results[0].value);
      if (results[1].status === 'fulfilled') setMutual(results[1].value);

      try {
        const lm = await getLikedMe();
        setLikedMe(lm);
        setLikedMeLocked(false);
      } catch (e) {
        if (isForbiddenError(e)) {
          setLikedMe([]);
          setLikedMeLocked(true);
        }
      }
    } catch (e) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const setUnreadMatches = useAppStore(state => state.setUnreadMatches);

  useEffect(() => { loadAll(); }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      setUnreadMatches(false);
    }, [loadAll, setUnreadMatches])
  );

  useEffect(() => {
    wsService.connect();
    const handler = (match: any) => {
      useAppStore.getState().addMatch(match);
      loadAll();
      setUnreadMatches(true);
    };
    wsService.subscribe('/user/queue/matches', handler);
    return () => wsService.unsubscribe('/user/queue/matches');
  }, [loadAll, setUnreadMatches]);

  const tabs: { id: Tab; label: string; locked?: boolean }[] = [
    { id: 'likedMe', label: 'Likes You', locked: likedMeLocked },
    { id: 'myLikes', label: 'Your Likes' },
    { id: 'mutual', label: 'Matches' },
  ];

  if (loading) {
    return (
      <LinearGradient colors={['#e0f2fe', '#f1f5f9', '#fdf2f2']} style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </LinearGradient>
    );
  }

  const renderContent = () => {
    const refreshCtrl = <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={PRIMARY_COLOR} />;
    const premiumCta = getPremiumCtaCopy('likesYou');

    let dataToRender: any[] = [];
    let emptyComponent;
    let listHeader = null;

    if (activeTab === 'likedMe') {
      dataToRender = likedMe;
      emptyComponent = likedMeLocked ? <LockedState onUpgrade={() => router.push({ pathname: '/premium-upsell', params: { reason: 'likesYou' } })} ctaLabel={premiumCta.ctaLabel} /> : <EmptyState tab="likedMe" />;
      if (dataToRender.length > 0) {
         listHeader = <Text style={styles.sectionTitle}>PEOPLE WHO LIKED YOUR DREAMS</Text>;
      }
    } else if (activeTab === 'myLikes') {
      dataToRender = myLikes;
      emptyComponent = <EmptyState tab="myLikes" />;
      if (dataToRender.length > 0) {
         listHeader = <Text style={styles.sectionTitle}>DREAMS YOU LIKED</Text>;
      }
    } else {
      dataToRender = mutual;
      emptyComponent = <EmptyState tab="mutual" />;
      if (dataToRender.length > 0) {
         listHeader = (
            <View style={styles.celebrationBanner}>
              <Text style={styles.celebrationText}>✨ IT'S A MATCH!</Text>
            </View>
         );
      }
    }

    return (
      <FlatList
        data={dataToRender}
        keyExtractor={i => i.likeId || i.userId}
        renderItem={({ item }) => {
           if (activeTab === 'mutual') return <MutualCard item={item} />;
           return <LikeCard item={item} tab={activeTab} />;
        }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshCtrl}
      />
    );
  };

  return (
    <LinearGradient colors={['#e0f2fe', '#f1f5f9', '#fdf2f2']} style={styles.root}>
      <View style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Connections</Text>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedControlContainer}>
          <View style={styles.segmentedControl}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.segmentTab, isActive && styles.segmentTabActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
                    {tab.label}
                  </Text>
                  {tab.locked && !isActive && (
                    <Ionicons name="lock-closed" size={10} color="#94a3b8" style={{marginLeft: 4}} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {renderContent()}
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#334155', letterSpacing: -0.5 },

  segmentedControlContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(226, 232, 240, 0.5)',
    borderRadius: 16,
    padding: 4,
    height: 48,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  segmentTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#B3717A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  segmentLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  segmentLabelActive: { color: '#B3717A' },

  listContent: { paddingHorizontal: 24, paddingBottom: 120 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 16,
    textTransform: 'uppercase'
  },

  celebrationBanner: {
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: 'transparent',
    alignSelf: 'center'
  },
  celebrationText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#B3717A',
    textTransform: 'uppercase'
  },

  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 122, 0.15)',
  },
  matchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 32,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(179, 113, 122, 0.3)',
    shadowColor: '#B3717A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: {},
  avatarWhiteBorder: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  cardNameLarge: { fontSize: 16, fontWeight: '700', color: '#334155' },
  cardSubLight: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 4 },
  cardTimeCaps: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginTop: 6, letterSpacing: -0.2, textTransform: 'uppercase' },
  
  cardActionContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },

  startChatButton: {
    backgroundColor: '#B3717A',
    borderRadius: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B3717A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  startChatButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21 },
});