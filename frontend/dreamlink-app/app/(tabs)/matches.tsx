import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import wsService from '../../services/websocket';
import { useAppStore } from '../../store/useAppStore';
import {
  ActivityIndicator,
  StatusBar,
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
  LikeResponse,
  MutualMatchResponse,
  formatRelativeTime,
} from '../../services/api';

// ─── Constants & Tokens ────────────────────────────────────────────────────────
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const QS_BOLD = 'Quicksand_700Bold';

const COLORS = {
  primary: '#A63F4F',      // Koyu Rose (Ana Renk)
  roseLt: '#F7E6E8',       // Açık Rose (Kart arkaplanları, yumuşak dokunuşlar)
  roseMd: '#D697A2',       // Orta Rose
  roseDk: '#7D2D3A',       // Derin Rose (Vurgular)
  bg: '#FFFFFF',           // Saf Beyaz
  sand: '#F8FAFC',         // Çok Uçuk Gri (Sekmeler için)
  textMain: '#1C1714',     // Koyu Füme (Ana Başlıklar)
  textMuted: '#475569',    // Orta Gri (Açıklamalar)
  textLight: '#94a3b8',    // Açık Gri (Tarih, meta veriler)
  borderLight: 'rgba(0,0,0,0.04)',
};

type Tab = 'likedMe' | 'myLikes' | 'mutual';

// ─── Mock Veriler ─────────────────────────────────────────────────────────────
const MOCK_MY_LIKES: LikeResponse[] = [
  { likeId: '1', dreamId: 'd1', relatedUserAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', relatedUserNickname: 'Deren', dreamTitle: 'Gökyüzünde Yürümek', likedAt: new Date(Date.now() - 3600000).toISOString() },
  { likeId: '2', dreamId: 'd2', relatedUserAvatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80', relatedUserNickname: 'Emre', dreamTitle: 'Kayıp Şehir Atlas', likedAt: new Date(Date.now() - 86400000).toISOString() },
  { likeId: '3', dreamId: 'd3', relatedUserAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80', relatedUserNickname: 'Melis', dreamTitle: 'Konuşan Hayvanlar Ormanı', likedAt: new Date(Date.now() - 172800000).toISOString() },
];

const MOCK_LIKED_ME: LikeResponse[] = [
  { likeId: '4', dreamId: 'd4', relatedUserAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', relatedUserNickname: 'Ayşe', dreamTitle: 'Sonsuz Kütüphane', likedAt: new Date(Date.now() - 1800000).toISOString() },
  { likeId: '5', dreamId: 'd5', relatedUserAvatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=300&q=80', relatedUserNickname: 'Can', dreamTitle: 'Zaman Yolculuğu', likedAt: new Date(Date.now() - 7200000).toISOString() },
  { likeId: '6', dreamId: 'd6', relatedUserAvatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80', relatedUserNickname: 'Zeynep', dreamTitle: 'Okyanusun Dibindeki Işık', likedAt: new Date(Date.now() - 259200000).toISOString() },
];

const MOCK_MUTUAL: MutualMatchResponse[] = [
  { userId: 'u1', nickname: 'Melis', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80', matchedAt: new Date(Date.now() - 5000000).toISOString(), conversationId: 'c1' },
];

// ─── Like Card (Premium Teşvikli ve Bulanık Tasarım) ──────────────────────────
const LikeCard = ({ item, isLocked, tab }: { item: LikeResponse, isLocked: boolean, tab: Tab }) => {
  const handlePress = () => {
    if (tab === 'likedMe' && isLocked) {
      router.push({ pathname: '/premium-upsell', params: { reason: 'likesYou' } });
    } else {
      router.push(`/dream/${item.dreamId}`);
    }
  };

  return (
    <TouchableOpacity
      style={styles.newLikeCard}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <View style={styles.newCardContent}>
        <View style={styles.newCardImageContainer}>
          <Image
            source={{ uri: item.relatedUserAvatarUrl || 'https://via.placeholder.com/150' }}
            style={styles.newCardImage}
            blurRadius={tab === 'likedMe' && isLocked ? 25 : 0}
          />
          {tab === 'likedMe' && isLocked && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.95)" />
            </View>
          )}
        </View>

        <View style={styles.newCardTextContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.newCardUserNickname} numberOfLines={1}>
              {tab === 'likedMe' && isLocked ? 'Hidden User' : item.relatedUserNickname}
            </Text>
            {tab === 'likedMe' && isLocked && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
          </View>

          <Text style={styles.newCardDreamTitle} numberOfLines={1}>{item.dreamTitle}</Text>
          <Text style={styles.newCardDreamDescription} numberOfLines={2}>
            {tab === 'likedMe' && isLocked
              ? "Upgrade to Premium to see who liked this dream."
              : "Tap to see dream details..."}
          </Text>

          <Text style={styles.newCardTimeCaps}>{formatRelativeTime(item.likedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Mutual Card (Kutlama / Match Tasarımı) ───────────────────────────────────
const MutualCard = ({ item }: { item: MutualMatchResponse }) => (
  <View style={styles.celebrationMatchCard}>
    {/* Arka Plan Resmi Olarak Kullanıcı Fotoğrafı */}
    <Image
      source={{ uri: item.avatarUrl || 'https://via.placeholder.com/400' }}
      style={StyleSheet.absoluteFillObject}
    />

    {/* Üzerine Gelen Sinematik Karanlık Gradyan */}
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
      style={StyleSheet.absoluteFillObject}
    />

    <View style={styles.celebrationMatchContent}>
      {/* Üst Kısım: Kutlama Rozeti */}
      <View style={styles.matchBadge}>
        <Ionicons name="sparkles" size={14} color="#FFF" />
        <Text style={styles.matchBadgeText}>IT'S A MATCH!</Text>
      </View>

      {/* Alt Kısım: Kullanıcı Bilgileri ve Buton */}
      <View style={styles.matchBottomInfo}>
        <Text style={styles.matchUserName}>{item.nickname}</Text>
        <Text style={styles.matchDescription}>
          You and <Text style={{ color: COLORS.roseMd, fontWeight: '700' }}>{item.nickname}</Text> matched. Your dreams have merged!
        </Text>
        <Text style={styles.matchTime}>{formatRelativeTime(item.matchedAt)}</Text>

        <TouchableOpacity
          style={styles.matchChatButton}
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
          <Ionicons name="chatbubble" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.matchChatButtonText}>Start Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ tab }: { tab: Tab }) => {
  const configs: Record<Tab, { icon: string; title: string; sub: string }> = {
    likedMe: { icon: 'heart-outline', title: 'No likes yet', sub: 'People will appear here when they like your dreams.' },
    myLikes: { icon: 'thumbs-up-outline', title: "You haven't liked anything yet", sub: 'Go to Discover and like dreams that interest you.' },
    mutual: { icon: 'sparkles-outline', title: 'No matches yet', sub: 'Mutual likes will appear here as matches.' },
  };
  const c = configs[tab];
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={c.icon as any} size={38} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>{c.title}</Text>
      <Text style={styles.emptySub}>{c.sub}</Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('likedMe');
  const [myLikes, setMyLikes] = useState<LikeResponse[]>([]);
  const [likedMe, setLikedMe] = useState<LikeResponse[]>([]);
  const [likedMeLocked, setLikedMeLocked] = useState(true);
  const [mutual, setMutual] = useState<MutualMatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setMyLikes(MOCK_MY_LIKES);
      setLikedMe(MOCK_LIKED_ME);
      setMutual(MOCK_MUTUAL);
      setLikedMeLocked(true);
      setLoading(false);
      setRefreshing(false);
    }, 600);
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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'likedMe', label: 'Likes You' },
    { id: 'myLikes', label: 'Your Likes' },
    { id: 'mutual', label: 'Matches' },
  ];

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderContent = () => {
    const refreshCtrl = <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={COLORS.primary} />;

    let dataToRender: any[] = [];
    let listHeader = null;

    if (activeTab === 'likedMe') {
      dataToRender = likedMe;
      if (dataToRender.length > 0) {
        listHeader = <Text style={styles.sectionTitle}>WHO LIKED YOUR DREAMS</Text>;
      }
    } else if (activeTab === 'myLikes') {
      dataToRender = myLikes;
      if (dataToRender.length > 0) {
        listHeader = <Text style={styles.sectionTitle}>DREAMS YOU LIKED</Text>;
      }
    } else {
      dataToRender = mutual;
    }

    return (
      <FlatList
        data={dataToRender}
        keyExtractor={i => i.likeId || i.userId}
        renderItem={({ item }) => {
          if (activeTab === 'mutual') return <MutualCard item={item} />;
          return (
            <LikeCard
              item={item}
              tab={activeTab}
              isLocked={likedMeLocked}
            />
          );
        }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<EmptyState tab={activeTab} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshCtrl}
      />
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ paddingTop: insets.top, backgroundColor: COLORS.bg }}>
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
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {renderContent()}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: COLORS.bg,
  },
  headerTitle: { fontFamily: QS_BOLD, fontSize: 24, fontWeight: '700', color: COLORS.textMain, letterSpacing: -0.4 },

  segmentedControlContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.sand,
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
    backgroundColor: COLORS.bg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  segmentLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  segmentLabelActive: { color: COLORS.textMain, fontWeight: '700' },

  listContent: { paddingHorizontal: 24, paddingBottom: 120, paddingTop: 8 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 16,
    textTransform: 'uppercase'
  },

  // ─── Like Card Styles (Editoryal & Soft Shadow) ────────────────────────
  newLikeCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  newCardContent: {
    flexDirection: 'row',
    height: 120,
  },
  newCardImageContainer: {
    width: 95,
    backgroundColor: COLORS.sand,
    position: 'relative',
  },
  newCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(166, 63, 79, 0.55)', // Koyu Rose transparan kilidi
    justifyContent: 'center',
    alignItems: 'center',
  },
  newCardTextContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newCardUserNickname: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  premiumBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  newCardDreamTitle: {
    fontFamily: SERIF,
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
    color: COLORS.textMain,
    marginTop: 2,
  },
  newCardDreamDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  newCardTimeCaps: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
  },

  // ─── Match Card (Kutlama) Styles ──────────────────────────────────────────────
  celebrationMatchCard: {
    height: 280,
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  celebrationMatchContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  matchBadgeText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 11,
    marginLeft: 6,
    letterSpacing: 1.2,
  },
  matchBottomInfo: {
    justifyContent: 'flex-end',
  },
  matchUserName: {
    fontFamily: QS_BOLD,
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  matchDescription: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  matchTime: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchChatButton: {
    backgroundColor: 'rgba(255,255,255,0.15)', // Cam efekti (glassmorphism)
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 20,
  },
  matchChatButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ─── Empty State Styles ───────────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.roseLt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontFamily: QS_BOLD, fontSize: 18, fontWeight: '700', color: COLORS.textMain, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
});