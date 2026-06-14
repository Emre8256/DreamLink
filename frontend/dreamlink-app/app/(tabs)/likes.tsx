import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Heart, MessageCircle } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../components/AnimatedPressable';

import {
  LikeResponse,
} from '../../services/api';

// ─── Constants & Tokens ────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QS_REGULAR = 'Quicksand_400Regular';
const QS_MEDIUM = 'Quicksand_500Medium';
const QS_SEMIBOLD = 'Quicksand_600SemiBold';
const QS_BOLD = 'Quicksand_700Bold';
const SERIF = 'Quicksand_700Bold';

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

// ─── Mock Veriler ─────────────────────────────────────────────────────────────

const MOCK_LIKED_ME: (LikeResponse & { age?: number; matchPercent?: number; isSuperLike?: boolean; distance?: number; hasWhisper?: boolean; whisperType?: string; whisperTargetContent?: string; whisperContent?: string; })[] = [
  { likeId: '8', dreamId: 'd8', relatedUserAvatarUrl: 'https://i.pinimg.com/236x/2f/47/5d/2f475d794db006ffb24488e1fd1f81cf.jpg', relatedUserNickname: 'Deniz', dreamTitle: 'Gece Yolculuğu', likedAt: new Date(Date.now() - 1200000).toISOString(), age: 28, matchPercent: 92, distance: 5.4, hasWhisper: true, whisperType: 'prompt', whisperTargetContent: '"Right before I fall asleep, I think about..."', whisperContent: "I always think about the exact same thing! Have you ever found an answer?" },
  { likeId: '9', dreamId: 'd9', relatedUserAvatarUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWiQ6cJ01RGFBkBisD0WhFFcrvI6Fib-kBzg&s', relatedUserNickname: 'Can', dreamTitle: 'Orman Ruhu', likedAt: new Date(Date.now() - 5000000).toISOString(), age: 25, matchPercent: 81, distance: 8.1, hasWhisper: true, whisperType: 'photo', whisperTargetContent: 'Your 2nd photo', whisperContent: "This photo looks like it was taken in Karaköy. Am I right? Love the vibe!", whisperTargetImageUrl: 'https://i.pinimg.com/236x/f1/bb/ac/f1bbac07a5e6959d7717fdc2b8fa4f92.jpg' },
  { likeId: '4', dreamId: 'd4', relatedUserAvatarUrl: 'https://i.pinimg.com/736x/22/4d/09/224d09bc4a0fe348a3706842e9c4fa87.jpg', relatedUserNickname: 'Ayşe', dreamTitle: 'Sonsuz Kütüphane', likedAt: new Date(Date.now() - 1800000).toISOString(), age: 23, matchPercent: 95, isSuperLike: true, distance: 3.2 },
  { likeId: '5', dreamId: 'd5', relatedUserAvatarUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9sqW6QYzti3-oYkpunBqeQ779ee9_7Evybg&s', relatedUserNickname: 'İrem', dreamTitle: 'Zaman Yolculuğu', likedAt: new Date(Date.now() - 7200000).toISOString(), age: 27, matchPercent: 88, distance: 18.5 },
  { likeId: '6', dreamId: 'd6', relatedUserAvatarUrl: 'https://i.pinimg.com/1200x/9c/0e/94/9c0e94cae90d58a5487ab428dd8331ed.jpg', relatedUserNickname: 'Zeynep', dreamTitle: 'Okyanusun Dibindeki Işık', likedAt: new Date(Date.now() - 259200000).toISOString(), age: 26, matchPercent: 84, isSuperLike: true, distance: 4.8 },
  { likeId: '7', dreamId: 'd7', relatedUserAvatarUrl: 'https://i.pinimg.com/736x/22/4d/09/224d09bc4a0fe348a3706842e9c4fa87.jpg', relatedUserNickname: 'Buse', dreamTitle: 'Kristal Orman', likedAt: new Date(Date.now() - 3600000).toISOString(), age: 24, matchPercent: 76, distance: 11.2 },
];

// ─── Whisper Card (Bumble Note Tarzı) ──────────────────────────────────────────
const WhisperCard = ({ item, index }: { item: any, index: number }) => {
  const age = item.age ?? 25;

  const handlePress = () => {
    router.push({
      pathname: '/user-card',
      params: {
        dreamId: item.dreamId,
        nickname: item.relatedUserNickname,
        avatarUrl: item.relatedUserAvatarUrl || '',
        dreamTitle: item.dreamTitle,
        whisperContent: item.whisperContent || '',
        whisperType: item.whisperType || '',
        whisperTargetContent: item.whisperTargetContent || '',
        whisperTargetImageUrl: item.whisperTargetImageUrl || '',
      },
    });
  };

  const getTargetIcon = () => {
    switch (item.whisperType) {
      case 'photo': return <Ionicons name="camera-outline" size={12} color={COLORS.textMuted} />;
      case 'prompt': return <Ionicons name="chatbubble-ellipses-outline" size={12} color={COLORS.textMuted} />;
      case 'bio': return <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />;
      default: return <Ionicons name="document-text-outline" size={12} color={COLORS.textMuted} />;
    }
  };

  const getTargetLabel = () => {
    switch (item.whisperType) {
      case 'photo': return 'Replied to your photo';
      case 'prompt': return 'Replied to your prompt';
      case 'bio': return 'Replied to your bio';
      default: return 'Replied to your profile';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).springify()}
      style={styles.whisperCardWrap}
      needsOffscreenAlphaCompositing={true}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
        <View style={styles.whisperCardInner}>
          {/* Sol: Avatar (ASLA GİZLENMEZ) */}
          <View style={styles.whisperImageWrap}>
            <Image
              source={{ uri: item.relatedUserAvatarUrl || 'https://via.placeholder.com/150' }}
              style={styles.whisperImage}
            />
          </View>

          {/* Sağ: İçerik */}
          <View style={styles.whisperContent}>
            <View style={styles.whisperTopRow}>
              <Text style={styles.whisperNickname} numberOfLines={1}>
                {item.relatedUserNickname}, {age}
              </Text>
              <View style={styles.whisperBadge}>
                <MessageCircle size={10} color="#1C1714" strokeWidth={2.5} />
                <Text style={styles.whisperBadgeText}>WHISPER</Text>
              </View>
            </View>

            {/* Mesaj (Whisper) */}
            <View style={styles.whisperTextBubble}>
              <Text style={styles.whisperText} numberOfLines={2}>
                "{item.whisperContent}"
              </Text>
            </View>

            {/* Hedef Bağlam (Target Context) */}
            <View style={styles.whisperTargetContext}>
              <View style={styles.whisperTargetIconWrap}>
                {getTargetIcon()}
              </View>
              <View style={styles.whisperTargetTexts}>
                <Text style={styles.whisperTargetLabel}>{getTargetLabel()}</Text>
                <Text style={styles.whisperTargetContentText} numberOfLines={1}>
                  {item.whisperTargetContent}
                </Text>
              </View>
              {item.whisperType === 'photo' && item.whisperTargetImageUrl && (
                <View style={styles.whisperTargetImageWrap}>
                  <Image
                    source={{ uri: item.whisperTargetImageUrl }}
                    style={styles.whisperTargetImage}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Super Like Card (Premium Altın / Yıldız Tasarımı) ────────────────────────
const SuperLikeCard = ({ item, isLocked, index }: { item: LikeResponse & { age?: number; matchPercent?: number }, isLocked: boolean, index: number }) => {
  const age = (item as any).age ?? 25;
  const isHidden = isLocked;

  const handlePress = () => {
    if (isHidden) {
      router.push({ pathname: '/premium-upsell', params: { reason: 'superLike' } });
    } else {
      router.push({
        pathname: '/user-card',
        params: {
          dreamId: item.dreamId,
          nickname: item.relatedUserNickname,
          avatarUrl: item.relatedUserAvatarUrl || '',
          dreamTitle: item.dreamTitle,
        },
      });
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={styles.superLikeCard}
      needsOffscreenAlphaCompositing={true}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
      >
        <View style={styles.superLikeInner}>
          {/* Sol: Avatar */}
          <View style={styles.superLikeImageWrap}>
            <Image
              source={{ uri: item.relatedUserAvatarUrl || 'https://via.placeholder.com/150' }}
              style={styles.superLikeImage}
              blurRadius={isHidden ? 40 : 0}
            />
          </View>

          {/* Sağ: İçerik */}
          <View style={styles.superLikeContent}>
            <View style={styles.superLikeTopRow}>
              <Text style={styles.superLikeNickname} numberOfLines={1}>
                {isHidden ? 'Hidden User' : `${item.relatedUserNickname}, ${age}`}
              </Text>
              <View style={styles.superLikeBadge}>
                <Ionicons name="star" size={8} color="#FFFFFF" />
                <Text style={styles.superLikeBadgeText}>SUPER LIKE</Text>
              </View>
            </View>

            <Text style={styles.superLikeDreamTitle} numberOfLines={1}>
              "{item.dreamTitle}"
            </Text>

            <Text style={styles.superLikeDesc} numberOfLines={2}>
              {isHidden
                ? 'Upgrade to Dreamium to reveal this super like'
                : 'This person really loved your dream — tap to see!'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Like Card (Normal Like) ───────────────────────────────────────────────────
const LikeCard = ({ item, isLocked, index }: { item: LikeResponse & { age?: number; matchPercent?: number }, isLocked: boolean, index: number }) => {
  const age = (item as any).age ?? 25;
  const isHidden = isLocked;

  const handlePress = () => {
    if (isHidden) {
      router.push({ pathname: '/premium-upsell', params: { reason: 'likesYou' } });
    } else {
      router.push({
        pathname: '/user-card',
        params: {
          dreamId: item.dreamId,
          nickname: item.relatedUserNickname,
          avatarUrl: item.relatedUserAvatarUrl || '',
          dreamTitle: item.dreamTitle,
        },
      });
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      needsOffscreenAlphaCompositing={true}
    >
      <TouchableOpacity
        style={styles.newLikeCard}
        activeOpacity={0.85}
        onPress={handlePress}
      >
        <View style={styles.newCardInner}>
          <View style={styles.newCardImageWrap}>
            <Image
              source={{ uri: item.relatedUserAvatarUrl || 'https://via.placeholder.com/150' }}
              style={styles.newCardImage}
              blurRadius={isHidden ? 40 : 0}
            />
          </View>

          <View style={styles.newCardTextContainer}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.newCardUserNickname} numberOfLines={1}>
                {isHidden ? 'Hidden User' : `${item.relatedUserNickname}, ${age}`}
              </Text>
              <View style={styles.interactionBadge}>
                <Heart size={8} color={COLORS.primary} fill={COLORS.primary} />
                <Text style={styles.interactionText}>LIKED YOU</Text>
              </View>
            </View>

            <View style={styles.dreamInfoSection}>
              <Text style={styles.newCardDreamTitle} numberOfLines={1}>
                "{item.dreamTitle}"
              </Text>
            </View>
            <Text style={styles.newCardDreamDescription} numberOfLines={2}>
              {isHidden
                ? 'Upgrade to Dreamium to see who liked this dream.'
                : 'Tap to view profile details...'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="heart-outline" size={38} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No likes yet</Text>
      <Text style={styles.emptySub}>People will appear here when they like your dreams.</Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LikesScreen() {
  const insets = useSafeAreaInsets();
  const [likesFilter, setLikesFilter] = useState<'all' | 'nearby' | 'new' | 'super'>('all');
  const [likedMe, setLikedMe] = useState<LikeResponse[]>([]);
  const [likedMeLocked, setLikedMeLocked] = useState(true);    // dreamium test
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLikedMe(MOCK_LIKED_ME);
      setLikedMeLocked(false);   //dreamium test
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

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderContent = () => {
    const refreshCtrl = <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={COLORS.primary} />;

    // ── likedMe tab: superlikes önce ──
    const filteredLikedMe = (likedMe as any[]).filter(item => {
      if (likesFilter === 'super') {
        return item.isSuperLike;
      }
      if (likesFilter === 'nearby') {
        // Show likes within 12km
        return item.distance !== undefined && item.distance <= 12;
      }
      if (likesFilter === 'new') {
        // Show likes from the last 24 hours
        const timeDiff = Date.now() - new Date(item.likedAt).getTime();
        return timeDiff < 86400000;
      }
      return true; // 'all'
    });

    const whispers = filteredLikedMe.filter(i => i.hasWhisper);
    const superLikes = filteredLikedMe.filter(i => i.isSuperLike && !i.hasWhisper);
    const normalLikes = filteredLikedMe.filter(i => !i.isSuperLike && !i.hasWhisper);
    const sortedLikedMe = [...whispers, ...superLikes, ...normalLikes];

    const getChipCount = (id: 'all' | 'nearby' | 'new' | 'super') => {
      if (id === 'all') return likedMe.length;
      if (id === 'nearby') {
        return (likedMe as any[]).filter(item => item.distance !== undefined && item.distance <= 12).length;
      }
      if (id === 'new') {
        return (likedMe as any[]).filter(item => {
          const timeDiff = Date.now() - new Date(item.likedAt).getTime();
          return timeDiff < 86400000;
        }).length;
      }
      if (id === 'super') {
        return (likedMe as any[]).filter(item => item.isSuperLike).length;
      }
      return 0;
    };

    const filterChips: { id: 'all' | 'nearby' | 'new' | 'super'; label: string; iconOutline: any; iconSolid: any }[] = [
      { id: 'all', label: 'All', iconOutline: 'grid-outline', iconSolid: 'grid' },
      { id: 'nearby', label: 'Nearby', iconOutline: 'location-outline', iconSolid: 'location' },
      { id: 'new', label: 'New', iconOutline: 'flash-outline', iconSolid: 'flash' },
      { id: 'super', label: 'Super', iconOutline: 'star-outline', iconSolid: 'star' },
    ];

    const listHeader = (
      <View>
        {whispers.length > 0 && (
          <View>
            {whispers.map((item: any, idx: number) => (
              <WhisperCard key={item.likeId} item={item} index={idx} />
            ))}
          </View>
        )}
        {superLikes.length > 0 && (
          <View>
            {superLikes.map((item: any, idx: number) => (
              <SuperLikeCard key={item.likeId} item={item} isLocked={likedMeLocked} index={whispers.length + idx} />
            ))}
          </View>
        )}
      </View>
    );

    return (
      <View style={{ flex: 1 }}>
        {/* ── Filter Bar ── */}
        {likedMe.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
            style={{ flexGrow: 0 }}
          >
            {filterChips.map(chip => {
              const isSelected = likesFilter === chip.id;
              const count = getChipCount(chip.id);
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.filterBtn, isSelected && styles.filterBtnActive]}
                  onPress={() => setLikesFilter(chip.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={isSelected ? chip.iconSolid : chip.iconOutline}
                    size={13}
                    color={isSelected ? COLORS.textMuted : COLORS.textLight}
                  />
                  <Text style={[styles.filterLabel, isSelected && styles.filterLabelActive]}>
                    {chip.label}
                  </Text>
                  <View style={[styles.filterSeparator, isSelected && styles.filterSeparatorActive]} />
                  <Text style={[styles.filterLabel, isSelected && styles.filterLabelActive]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <FlatList
          key="likedme-flatlist"
          data={normalLikes}
          keyExtractor={i => i.likeId || i.userId}
          renderItem={({ item, index }) => (
            <LikeCard item={item} isLocked={likedMeLocked} index={index} />
          )}
          ListHeaderComponent={sortedLikedMe.length > 0 ? listHeader : null}
          ListEmptyComponent={sortedLikedMe.length === 0 ? <EmptyState /> : null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshCtrl}
        />
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={{ backgroundColor: COLORS.bg }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={styles.headerTitle}>Liked You</Text>
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
  headerTitle: { fontFamily: QS_BOLD, fontSize: 24, color: COLORS.textMain, letterSpacing: -0.4 },

  listContent: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 4 },

  // ─── Section Headers ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionHeaderText: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  sectionHeaderTextGold: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    color: '#C47A15',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  sectionHeaderBadge: {
    backgroundColor: 'rgba(196,122,21,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sectionHeaderBadgeText: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    color: '#C47A15',
  },

  // ─── Shared DropShadow wrapper style ──────────────────────────────────────────
  cardShadow: {},

  // ─── Whisper Card Styles ──────────────────────────────────────────────────
  whisperCardWrap: {
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  whisperCardInner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    height: 155, // Biraz daha uzun bubble sığsın diye
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  whisperImageWrap: {
    width: 92,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.sand,
  },
  whisperImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  whisperContent: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  whisperTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 4,
  },
  whisperNickname: {
    fontFamily: QS_BOLD,
    fontSize: 12,
    color: COLORS.textMain,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  whisperBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1C1714',
  },
  whisperBadgeText: {
    fontFamily: QS_BOLD,
    fontSize: 8,
    color: '#1C1714',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  whisperTextBubble: {
    backgroundColor: COLORS.sand,
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
    borderTopLeftRadius: 4,
  },
  whisperText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.textMain,
    lineHeight: 18,
  },
  whisperTargetContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 'auto',
    backgroundColor: '#F3F4F6', // daha sade, beyaza yakın
    padding: 6,
    borderRadius: 8,
  },
  whisperTargetIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  whisperTargetTexts: {
    flex: 1,
  },
  whisperTargetLabel: {
    fontFamily: QS_SEMIBOLD,
    fontSize: 8,
    color: COLORS.textMuted, // daha sade renk
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  whisperTargetContentText: {
    fontFamily: QS_MEDIUM,
    fontSize: 10,
    color: COLORS.textMain,
  },
  whisperTargetImageWrap: {
    width: 30,
    height: 30,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  whisperTargetImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // ─── Super Like Card Styles ──────────────────────────────────────────────────
  superLikeCard: {
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  superLikeInner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    height: 138,
    borderWidth: 1.5,
    borderColor: 'rgba(166, 63, 79, 0.25)',
  },
  superLikeImageWrap: {
    width: 92,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  superLikeImage: {
    width: 92,
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
  },
  superLikeContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  superLikeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  superLikeNickname: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    color: COLORS.roseDk,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  superLikeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  superLikeBadgeText: {
    fontFamily: QS_BOLD,
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  superLikeDreamTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '700',
    color: COLORS.textMain,
    lineHeight: 22,
    marginTop: 4,
  },
  superLikeDesc: {
    fontFamily: QS_MEDIUM,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },

  sectionTitle: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    color: COLORS.textLight,
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 16,
    textTransform: 'uppercase'
  },

  // ─── Like Card Styles ─────────────────────────────────────────────────────
  newLikeCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  newCardInner: {
    flexDirection: 'row',
    padding: 7,
    height: 130,
  },
  newCardImageWrap: {
    width: 88,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.sand,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  newCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  newCardTextContainer: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newCardUserNickname: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  premiumBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontFamily: QS_BOLD,
    color: '#fff',
    fontSize: 7,
    letterSpacing: 0.4,
  },
  interactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.roseLt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
  },

  interactionText: {
    fontFamily: QS_BOLD, // Quicksand Bold veya benzeri
    fontSize: 9,
    color: COLORS.primary,
    marginLeft: 4,
    textTransform: 'uppercase', // Büyük harf ciddiyet katar
    letterSpacing: 0.5,
  },
  dreamInfoSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  dreamLabel: {
    fontFamily: QS_BOLD,
    fontSize: 8,
    color: COLORS.textLight,
    letterSpacing: 1,
    marginBottom: 2,
  },
  newCardDreamTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 14,
    fontStyle: 'italic', // Eğik yapıyoruz
    fontWeight: '700',   // Ama etli bırakıyoruz ki sönük durmasın
    color: '#1A1A1A',
    lineHeight: 24,
  },
  newCardDreamDescription: {
    fontFamily: QS_MEDIUM,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
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
  emptyTitle: { fontFamily: QS_BOLD, fontSize: 18, color: COLORS.textMain, marginBottom: 8 },
  emptySub: { fontFamily: QS_MEDIUM, fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },

  // ─── Filter Bar ──────────────────────────────────────────────────────────────
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 38,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  filterBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.textMuted,
  },
  filterLabel: {
    fontFamily: QS_SEMIBOLD,
    fontSize: 12,
    color: COLORS.textLight,
    textAlignVertical: 'center',
  },
  filterLabelActive: {
    fontFamily: QS_BOLD,
    color: COLORS.textMuted,
  },
  filterSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textLight,
    marginHorizontal: 2,
  },
  filterSeparatorActive: {
    backgroundColor: COLORS.textMuted,
  },
});