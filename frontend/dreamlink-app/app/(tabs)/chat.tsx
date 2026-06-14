import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import React, { useState, useEffect, useCallback } from 'react';
import wsService from '../../services/websocket';
import { useAppStore } from '../../store/useAppStore';
import {
  ActivityIndicator,
  Platform,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  View,
  Alert,
  StatusBar,
} from 'react-native';
import { getMyConversations, deleteConversation, ConversationResponse, formatRelativeTime } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Constants & Tokens ────────────────────────────────────────────────────────
const SERIF = 'Quicksand_700Bold';
const QS_BOLD = 'Quicksand_700Bold';
const QS_MEDIUM = 'Quicksand_500Medium';

const COLORS = {
  primary: '#A63F4F',      // Koyu Rose (Ana Renk)
  roseLt: '#F7E6E8',       // Açık Rose (Seçili kartlar, boş durum arka planı vs.)
  roseMd: '#D697A2',       // Orta Rose (Pasif ikonlar vs.)
  bg: '#FFFFFF',
  textMain: '#1C1714',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  borderLight: 'rgba(0,0,0,0.04)',
};

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};

const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
    else onCancel?.();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Yes', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

// ─── Avatar Helper ────────────────────────────────────────────────────────────
const Avatar = ({ url, name, size = 56 }: { url: string | null; name: string; size?: number }) => {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2, resizeMode: 'cover' }}
      />
    );
  }
  return (
    <LinearGradient
      colors={['#F1F5F9', '#E2E8F0']}
      style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text style={{ fontSize: size * 0.38, color: COLORS.textMuted }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
};

// ─── Mock Avatars ─────────────────────────────────────────────────────────────
const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
];

interface ExtendedConversationResponse extends ConversationResponse {
  unreadCount?: number;
  themeMatch?: string;
  isNewConnection?: boolean;
  disconnected?: boolean;
}

const MOCK_CONVERSATIONS: ExtendedConversationResponse[] = [
  {
    id: 'conv-1',
    otherUser: {
      id: 'user-1',
      nickname: 'Deren',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    lastMessage: '',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    unreadCount: 0,
    themeMatch: 'Lucid Ocean',
    isNewConnection: true,
  },
  {
    id: 'conv-2',
    otherUser: {
      id: 'user-2',
      nickname: 'Emre',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    },
    lastMessage: 'I think our dreams are overlapping. What time did you wake up?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    unreadCount: 3,
  },
  {
    id: 'conv-3',
    otherUser: {
      id: 'user-3',
      nickname: 'Melis',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    },
    lastMessage: 'I wrote down the details. Talk to you tomorrow!',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    unreadCount: 0,
  },
  {
    id: 'conv-4',
    otherUser: {
      id: 'user-4',
      nickname: 'Zeynep',
      avatarUrl: 'https://i.pinimg.com/1200x/9c/0e/94/9c0e94cae90d58a5487ab428dd8331ed.jpg',
    },
    lastMessage: '',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    unreadCount: 0,
    themeMatch: 'Forest of Doors',
    isNewConnection: true,
  },
  {
    id: 'conv-5',
    otherUser: {
      id: 'user-5',
      nickname: 'Can',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    lastMessage: 'Exactly, the physics of it is mind-bending.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 32).toISOString(),
    unreadCount: 0,
    disconnected: true,
  }
];

// ─── Chat Card ────────────────────────────────────────────────────────────────
const ChatCard = ({
  item,
  index,
  onPress,
}: {
  item: ExtendedConversationResponse;
  index: number;
  onPress: () => void;
}) => {
  const avatarUrl = item.otherUser.avatarUrl || MOCK_AVATARS[index % MOCK_AVATARS.length];
  const unreadCount = item.unreadCount ?? 0;
  const isUnread = unreadCount > 0;
  const isNew = item.isNewConnection;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        item.disconnected && styles.cardDisconnected
      ]}
      activeOpacity={item.disconnected ? 0.85 : 0.75}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={[styles.avatarWrap, item.disconnected && { opacity: 0.55 }]}>
        <Avatar url={avatarUrl} name={item.otherUser.nickname} size={54} />
      </View>

      {/* Text */}
      <View style={styles.cardText}>
        <View style={styles.nameRow}>
          <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 }}>
            <Text style={[
              styles.cardName,
              isUnread && styles.cardNameUnread,
              isNew && styles.cardNameNew,
              item.disconnected && styles.cardNameDisconnected
            ]} numberOfLines={1}>
              {item.otherUser.nickname}
            </Text>
            {isNew && (
              <View style={styles.newMatchBadge}>
                <Text style={styles.newMatchBadgeText}>NEW MATCH</Text>
              </View>
            )}
            {item.disconnected && (
              <View style={styles.endedBadge}>
                <Text style={styles.endedBadgeText}>CONNECTION ENDED</Text>
              </View>
            )}
          </View>
          {!isNew && (
            <Text style={[
              styles.cardTime,
              isUnread && styles.cardTimeUnread,
              item.disconnected && styles.cardTimeDisconnected
            ]}>
              {item.lastMessageAt ? formatRelativeTime(item.lastMessageAt) : 'Just now'}
            </Text>
          )}
        </View>

        <View style={styles.subRow}>
          {isNew ? (
            <Text style={styles.cardSubNew} numberOfLines={1}>
              ✨ Matched on: <Text style={styles.cardThemeMatch}>{item.themeMatch}</Text>
            </Text>
          ) : (
            <Text style={[styles.cardSub, isUnread && styles.cardSubUnread, item.disconnected && styles.cardSubDisconnected]} numberOfLines={1}>
              {item.disconnected ? 'Connection ended' : (item.lastMessage ?? '✨ Chat started')}
            </Text>
          )}

          {isUnread && (
            <View style={styles.unreadBubble}>
              <Text style={styles.unreadBubbleText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Lunar Empty State ────────────────────────────────────────────────────────
const LunarEmptyState = () => (
  <View style={styles.lunarEmpty}>
    <View style={styles.moonGlowContainer}>
      <Svg width={200} height={200} viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="moonGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#A63F4F" stopOpacity={0.28} />
            <Stop offset="50%" stopColor="#A63F4F" stopOpacity={0.08} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Outer ambient glow */}
        <Circle cx="100" cy="100" r="80" fill="url(#moonGlow)" />

        {/* Ambient starry sky points */}
        <Circle cx="50" cy="60" r="1.5" fill="#A63F4F" opacity={0.6} />
        <Circle cx="155" cy="70" r="1" fill="#A63F4F" opacity={0.4} />
        <Circle cx="70" cy="140" r="2" fill="#A63F4F" opacity={0.5} />
        <Circle cx="135" cy="150" r="1.5" fill="#A63F4F" opacity={0.7} />
        <Circle cx="110" cy="40" r="1.2" fill="#A63F4F" opacity={0.5} />
        <Circle cx="45" cy="110" r="1" fill="#A63F4F" opacity={0.4} />

        {/* Crescent Moon centered at (100, 100) */}
        <Path
          d="M100 60 A 40 40 0 1 0 140 100 A 32 32 0 1 1 100 60 Z"
          fill="#A63F4F"
        />
      </Svg>
    </View>

    <Text style={styles.lunarTitle}>Silence Under the Moonlight</Text>
    <Text style={styles.lunarSubtitle}>
      The night is still. Once your dream cycles align with another traveler, your connection will illuminate this sky.
    </Text>

    <TouchableOpacity
      style={styles.exploreBtn}
      activeOpacity={0.85}
      onPress={() => router.push('/matches')}
    >
      <LinearGradient
        colors={['#A63F4F', '#7D2D3A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.exploreBtnGradient}
      >
        <Text style={styles.exploreBtnText}>Seek Connections</Text>
        <Ionicons name="compass-outline" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  // Display the rich set of mocked conversations to show the diverse, premium designs
  const displayedConversations: ExtendedConversationResponse[] = MOCK_CONVERSATIONS;

  const load = useCallback(async () => {
    try {
      const data = await getMyConversations();
      setConversations(data);
    } catch (e) {
      console.error('Chat list error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const setUnreadMessages = useAppStore(state => state.setUnreadMessages);

  // WebSocket ile yeni mesaj geldiğinde listeyi yenile
  useEffect(() => {
    wsService.connect();
    const handler = (msg: any) => {
      if (msg && msg.chatId) {
        useAppStore.getState().addMessage(msg.chatId, msg);
        load();
        setUnreadMessages(true);
      }
    };
    wsService.subscribe('/user/queue/messages', handler);
    return () => wsService.unsubscribe('/user/queue/messages');
  }, [load, setUnreadMessages]);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
      setUnreadMessages(false);
    }, [load, setUnreadMessages])
  );

  const handlePressCard = (item: ExtendedConversationResponse) => {
    router.push({
      pathname: '/chatbox',
      params: {
        conversationId: item.id,
        name: item.otherUser.nickname,
        avatar: item.otherUser.avatarUrl || '',
        themeMatch: item.themeMatch || '',
        disconnected: item.disconnected ? 'true' : 'false'
      }
    });
  };

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      {/* Editoryal Search Bar */}
      {displayedConversations.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchGlass}>
            <Ionicons name="search" size={18} color={COLORS.textLight} style={{ marginLeft: 16 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search connections..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      <FlatList
        data={displayedConversations}
        keyExtractor={i => i.id}
        renderItem={({ item, index }) => (
          <ChatCard
            item={item}
            index={index}
            onPress={() => handlePressCard(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<LunarEmptyState />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.primary}
          />
        }
      />
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
  headerTitle: {
    fontFamily: QS_BOLD,
    fontSize: 24,
    color: COLORS.textMain,
    letterSpacing: -0.4
  },

  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  searchGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.textMain,
    fontFamily: QS_BOLD,
  },

  connectionsContainer: {
    marginTop: 4,
    marginBottom: 28,
  },
  connectionsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 1.8,
    paddingHorizontal: 24,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  connectionsScroll: {
    paddingHorizontal: 24,
    gap: 16,
  },
  connectionItem: {
    alignItems: 'center',
    gap: 8,
  },
  connectionAvatarBorder: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  connectionAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  connectionName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMain,
  },

  listContent: { paddingTop: 4, paddingBottom: 120 },

  separator: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.13)',
    marginLeft: 88,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },


  avatarWrap: {
    marginRight: 16,
  },

  cardText: {
    flex: 1,
    flexShrink: 1,
    width: 0,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
    width: '100%',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cardName: {
    fontFamily: QS_BOLD,
    fontSize: 15,
    color: COLORS.textMain,
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  cardNameUnread: {
    fontWeight: '800',
    color: COLORS.textMain,
  },
  cardTime: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
    flexShrink: 0,
  },
  cardTimeUnread: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    flex: 1,
    marginRight: 8,
  },
  cardSubUnread: {
    fontWeight: '700',
    color: '#1e293b',
  },
  unreadBubble: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  unreadBubbleText: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },


  newMatchBadge: {
    backgroundColor: '#F8EDEF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  newMatchBadgeText: {
    fontFamily: QS_BOLD,
    fontSize: 8,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  cardNameNew: {
    color: COLORS.textMain,
    fontWeight: '700',
  },
  cardSubNew: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    flex: 1,
    marginRight: 8,
  },
  cardThemeMatch: {
    fontFamily: QS_BOLD,
    color: COLORS.primary,
  },
  cardDisconnected: {
    backgroundColor: '#FAFAFA',
    opacity: 0.8,
  },
  cardNameDisconnected: {
    color: '#94A3B8',
  },
  cardTimeDisconnected: {
    color: '#CBD5E1',
  },
  cardSubDisconnected: {
    color: '#94A3B8',
  },
  endedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  endedBadgeText: {
    fontFamily: QS_BOLD,
    fontSize: 8,
    color: '#64748B',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  lunarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 36,
  },
  moonGlowContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lunarTitle: {
    fontFamily: SERIF,
    fontSize: 20,
    color: COLORS.textMain,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  lunarSubtitle: {
    fontFamily: QS_MEDIUM,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  exploreBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#A63F4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  exploreBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 24,
  },
  exploreBtnText: {
    fontFamily: QS_BOLD,
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});