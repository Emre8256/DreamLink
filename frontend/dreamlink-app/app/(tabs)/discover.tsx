import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getDiscoverFeed,
  getDailyPicks,
  likeDream,
  requestRewind,
  DiscoverCardResponse,
  getPremiumCtaCopy,
} from '../../services/api';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;
const PRIMARY_COLOR = '#B3717A';

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

// ─── Swipe Deck Components ──────────────────────────────────────────────────
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  
  // App State
  const [deck, setDeck] = useState<DiscoverCardResponse[]>([]);
  const deckRef = useRef<DiscoverCardResponse[]>([]); // To bypass closures
  const [loading, setLoading] = useState(true);
  
  const [dailyLocked, setDailyLocked] = useState(false);
  const [dailyHasMorePremium, setDailyHasMorePremium] = useState(false);
  const [rewindStack, setRewindStack] = useState<DiscoverCardResponse[]>([]);
  
  // Gesture State
  const position = useRef(new Animated.ValueXY()).current;
  const isAnimating = useRef(false);

  // Sync deck ref for safe closure-free access in swipe events
  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  const load = useCallback(async () => {
    try {
      const results = await Promise.allSettled([getDailyPicks(), getDiscoverFeed()]);
      
      let newDeck: DiscoverCardResponse[] = [];
      let dailyIds = new Set<string>();

      if (results[0].status === 'fulfilled') {
        const daily = results[0].value;
        newDeck = [...daily.picks]; // Add picks to front of queue
        dailyIds = new Set(daily.picks.map((p: any) => p.matchedDreamId));
        
        setDailyLocked(daily.locked);
        setDailyHasMorePremium(daily.hasMorePremium);
      }

      if (results[1].status === 'fulfilled') {
        const generalFeed = results[1].value.filter((c: any) => !dailyIds.has(c.matchedDreamId));
        newDeck = [...newDeck, ...generalFeed]; // Rest of the queue
      }
      
      setDeck(newDeck);
    } catch (e) {
      console.error('Discover load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Handle Logic
  const executeLike = (dreamId: string) => {
    likeDream(dreamId).catch((e) => {
      if (isLikeLimitError(e)) {
        router.push({ pathname: '/premium-upsell', params: { reason: 'likeLimit' } });
      }
    });
  };

  const executeSkip = (item: DiscoverCardResponse) => {
    setRewindStack(prev => [item, ...prev].slice(0, 10));
  };

  // Controller
  const onSwipeComplete = useCallback((direction: 'right' | 'left') => {
    const item = deckRef.current[0];
    if (!item) return;

    if (direction === 'right') {
      executeLike(item.matchedDreamId);
    } else {
      executeSkip(item);
    }

    // Pop the physical deck array
    setDeck(prev => prev.slice(1));
    position.setValue({ x: 0, y: 0 }); // reset pan explicitly without animating
    isAnimating.current = false;
  }, []);

  const triggerSwipe = useCallback((direction: 'right' | 'left', duration = SWIPE_OUT_DURATION) => {
    if (isAnimating.current || deckRef.current.length === 0) return;
    isAnimating.current = true;

    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration,
      useNativeDriver: false, // Layout animations on x,y are currently better suited without native driver for transform consistency in complex gesture mixes
    }).start(() => onSwipeComplete(direction));
  }, [onSwipeComplete]);

  // Pan Responder Configuration
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (ev, gestureState) => {
        if (isAnimating.current) return;
        position.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (ev, gestureState) => {
        if (isAnimating.current) return;
        if (gestureState.dx > SWIPE_THRESHOLD) {
          triggerSwipe('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          triggerSwipe('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Rewind Logic
  const handleRewind = async () => {
    if (rewindStack.length === 0 || isAnimating.current) return;
    try {
      await requestRewind();
      const [last, ...rest] = rewindStack;
      setRewindStack(rest);
      setDeck(prev => [last, ...prev]);
    } catch (e) {
      if (isRewindEntitlementError(e)) {
        router.push({ pathname: '/premium-upsell', params: { reason: 'rewind' } });
        return;
      }
      Alert.alert('Error', 'Rewind is not available.');
    }
  };

  // Interpolations for Animations
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const topCardStyle = {
    transform: [
      ...position.getTranslateTransform(),
      { rotate },
      { perspective: 800 },
      {
        scale: position.x.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [0.96, 1, 0.96],
          extrapolate: 'clamp',
        }),
      },
    ],
    zIndex: 20,
  };

  // ─── Rendering Engine ───────────────────────────────────────────────────────
  
  const renderEmptyState = () => {
    if (dailyHasMorePremium && dailyLocked && deck.length === 0) {
      return (
        <View style={styles.empty}>
           <View style={styles.emptyIcon}>
              <Ionicons name="lock-closed" size={40} color={PRIMARY_COLOR} />
           </View>
           <Text style={styles.emptyTitle}>More Daily Picks</Text>
           <Text style={styles.emptySub}>Unlock extra profile cards instantly with Premium.</Text>
           <TouchableOpacity
              style={styles.premiumCta}
              onPress={() => router.push({ pathname: '/premium-upsell', params: { reason: 'dailyPicks' } })}
           >
              <Text style={styles.premiumCtaText}>{getPremiumCtaCopy('dailyPicks').ctaLabel}</Text>
           </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="telescope-outline" size={40} color="#94a3b8" />
        </View>
        <Text style={styles.emptyTitle}>No more matches</Text>
        <Text style={styles.emptySub}>Share a dream to discover new connections again.</Text>
      </View>
    );
  };

  const renderCards = () => {
    if (deck.length === 0) {
      return renderEmptyState();
    }

    return deck.map((item, index) => {
      // We only render top 2 cards for performance
      if (index > 1) return null;

      const isTop = index === 0;

      // Mock AI generated image proxy
      const mockImage = "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600&auto=format&fit=crop";

      const cardBody = (
          <View style={styles.cardContent}>
            {/* Image Frame */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: mockImage }} style={styles.image} />
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>{item.similarityPercent}% Match</Text>
              </View>
              <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']} style={styles.imageFade} />
            </View>
            {/* Info Frame */}
            <View style={styles.infoContainer}>
              <View style={styles.infoTopRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.userNameText}>{item.matchedUserNickname}</Text>
              </View>
              <View style={styles.dreamPanel}>
                <Text style={styles.dreamPanelLabel}>SIMILAR DREAM</Text>
                <Text style={styles.dreamPanelTitle}>"{item.matchedDreamTitle}"</Text>
                <Text style={styles.dreamPanelDesc} numberOfLines={2}>{item.matchedDreamDescription}</Text>
              </View>
            </View>
          </View>
      );

      if (isTop) {
        return (
          <Animated.View
            key={`deck-${item.matchedDreamId}`}
            style={[styles.cardAbsoluteWrapper, topCardStyle]}
            {...panResponder.panHandlers}
          >
            {cardBody}
            {/* LIKE / NOPE Indicators Overlay */}
            <Animated.View style={[styles.badgeOverlay, styles.nopeWrapper, { opacity: nopeOpacity }]}>
              <Text style={styles.nopeBadgeText}>NOPE</Text>
            </Animated.View>
            <Animated.View style={[styles.badgeOverlay, styles.likeWrapper, { opacity: likeOpacity }]}>
              <Text style={styles.likeBadgeText}>LIKE</Text>
            </Animated.View>
          </Animated.View>
        );
      }

      // Next card resting behind the top card
      return (
        <Animated.View
          key={`deck-${item.matchedDreamId}`}
          style={[styles.cardAbsoluteWrapper, { transform: [{ scale: 0.94 }, { translateY: 20 }] }]}
        >
          {cardBody}
        </Animated.View>
      );
    }).reverse(); // Reverse makes sure index 0 (top record) is mounted last in the DOM tree, thus z-index is highest visually
  };

  if (loading) {
    return (
      <LinearGradient colors={['#f8f6f6', '#e0f2fe', '#fdf2f2']} style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f8f6f6', '#e0f2fe', '#fdf2f2']} style={styles.root}>
      <View style={{ paddingTop: insets.top }}>
        <View style={styles.header}>
          <View style={{ width: 40, alignItems: 'center' }}>
            <TouchableOpacity onPress={handleRewind} disabled={rewindStack.length === 0} style={{ opacity: rewindStack.length === 0 ? 0.3 : 1 }}>
              <Ionicons name="arrow-undo-outline" size={26} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Similar Dreams</Text>
          <View style={{ width: 40 }}></View>
        </View>
      </View>

      <View style={styles.deckPlayArea}>
         {renderCards()}
      </View>

      {deck.length > 0 && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
             style={styles.actionBtnWhite} 
             onPress={() => triggerSwipe('left', 200)} 
             activeOpacity={0.8}
          >
             <Ionicons name="close" size={32} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity 
             style={styles.actionBtnPrimary} 
             onPress={() => triggerSwipe('right', 200)} 
             activeOpacity={0.8}
          >
             <Ionicons name="heart" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#334155', letterSpacing: -0.5 },

  deckPlayArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '100%',
    paddingBottom: 40,
  },
  
  cardAbsoluteWrapper: {
    position: 'absolute',
    width: Math.min(SCREEN_WIDTH * 0.74, 320),
    maxWidth: '88%',
    aspectRatio: 3 / 4.4,
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
    alignSelf: 'center',
    borderRadius: 24,
  },
  cardContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  imageContainer: {
    flex: 1.5,
    backgroundColor: '#cbd5e1',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFade: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 80,
  },
  matchBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#334155',
  },

  infoContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 10,
    justifyContent: 'flex-start',
  },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 8,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
  },
  dreamPanel: {
    marginTop: 'auto',
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  dreamPanelLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  dreamPanelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  dreamPanelDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748b',
  },

  badgeOverlay: {
    position: 'absolute',
    top: 40,
    borderWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 10,
  },
  nopeWrapper: {
    right: 32,
    borderColor: '#94a3b8',
    transform: [{ rotate: '15deg' }]
  },
  likeWrapper: {
    left: 32,
    borderColor: '#4ade80',
    transform: [{ rotate: '-15deg' }]
  },
  nopeBadgeText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#94a3b8',
  },
  likeBadgeText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#4ade80',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    paddingBottom: 140,
  },
  actionBtnWhite: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  actionBtnPrimary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 6,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#334155', marginBottom: 8 },
  emptySub: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  
  premiumCta: {
    marginTop: 20,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  premiumCtaText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});