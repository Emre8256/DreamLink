import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
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
} from 'react-native';
import { EdgeToEdgeLayout } from '../../components/EdgeToEdgeLayout';
import { getMyConversations, deleteConversation, ConversationResponse, formatRelativeTime } from '../../services/api';

// ─── Constants & Tokens ────────────────────────────────────────────────────────
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const QS_BOLD = 'Quicksand_700Bold';

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
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: COLORS.textMuted }}>
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

// ─── Chat Card ────────────────────────────────────────────────────────────────
const ChatCard = ({
  item,
  index,
  isSelected,
  onSelect,
  onPress,
  unreadCount = 0,
}: {
  item: ConversationResponse;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPress: () => void;
  unreadCount?: number;
}) => {
  const avatarUrl = item.otherUser.avatarUrl || MOCK_AVATARS[index % MOCK_AVATARS.length];
  const isUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      activeOpacity={0.75}
      onLongPress={() => onSelect(item.id)}
      onPress={() => {
        if (isSelected) onSelect(item.id);
        else onPress();
      }}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Avatar url={avatarUrl} name={item.otherUser.nickname} size={52} />
      </View>

      {/* Text */}
      <View style={styles.cardText}>
        <View style={styles.nameRow}>
          <Text style={[styles.cardName, isUnread && styles.cardNameUnread]} numberOfLines={1}>
            {item.otherUser.nickname}
          </Text>
          <Text style={[styles.cardTime, isUnread && styles.cardTimeUnread]}>
            {item.lastMessageAt ? formatRelativeTime(item.lastMessageAt) : 'New'}
          </Text>
        </View>
        <View style={styles.subRow}>
          <Text style={[styles.cardSub, isUnread && styles.cardSubUnread]} numberOfLines={1}>
            {item.lastMessage ?? '✨ Chat started'}
          </Text>
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

// ─── New Connections (Mocked) ──────────────────────────────────────────────────
const MockConnections = [
  { name: 'Elena', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80' },
  { name: 'Marcus', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
  { name: 'Sienna', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
  { name: 'Julian', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
];

const NewConnections = () => (
  <View style={styles.connectionsContainer}>
    <Text style={styles.connectionsTitle}>NEW CONNECTIONS</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.connectionsScroll}>
      {MockConnections.map((user, idx) => (
        <View key={idx} style={styles.connectionItem}>
          <View style={styles.connectionAvatarBorder}>
            <Image source={{ uri: user.img }} style={styles.connectionAvatar} />
          </View>
          <Text style={styles.connectionName}>{user.name}</Text>
        </View>
      ))}
    </ScrollView>
  </View>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <View style={styles.empty}>
    <LinearGradient
      colors={[COLORS.roseLt, '#FFFFFF']}
      style={styles.emptyIcon}
    >
      <Ionicons name="chatbubbles-outline" size={36} color={COLORS.primary} />
    </LinearGradient>
    <Text style={styles.emptyTitle}>No messages yet</Text>
    <Text style={styles.emptySub}>
      Like new dreams in Discover, your chats will appear here when you match.
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const handleDelete = () => {
    if (!selectedId) return;
    showConfirm(
      'Delete Chat',
      'Are you sure you want to permanently delete this chat and all its messages?',
      async () => {
        try {
          setLoading(true);
          await deleteConversation(selectedId);
          setConversations(prev => prev.filter(c => c.id !== selectedId));
          setSelectedId(null);
        } catch (error) {
          showAlert('Error', 'Chat could not be deleted.');
        } finally {
          setLoading(false);
        }
      },
      () => setSelectedId(null)
    );
  };

  const handleSelect = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null); // Deselect
    } else {
      setSelectedId(id);   // Select new
    }
  };

  const handlePressCard = (item: ConversationResponse) => {
    if (selectedId) {
      handleSelect(item.id);
    } else {
      router.push({
        pathname: '/chatbox',
        params: {
          conversationId: item.id,
          name: item.otherUser.nickname,
          avatar: item.otherUser.avatarUrl || ''
        }
      });
    }
  };

  if (loading) {
    return (
      <EdgeToEdgeLayout backgroundColor={COLORS.bg} statusBarStyle="dark-content" statusBarBg={COLORS.bg}>
        <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </EdgeToEdgeLayout>
    );
  }

  return (
    <EdgeToEdgeLayout backgroundColor={COLORS.bg} statusBarStyle="dark-content" statusBarBg={COLORS.bg}>
      <View style={[styles.root]}>

        {/* Header */}
        <View style={[styles.header]}>
          <Text style={styles.headerTitle}>Chats</Text>
          {selectedId ? (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          ) : <View />}
        </View>

        {/* Editoryal Search Bar */}
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

        <FlatList
          data={conversations}
          keyExtractor={i => i.id}
          renderItem={({ item, index }) => (
            <ChatCard
              item={item}
              index={index}
              isSelected={selectedId === item.id}
              onSelect={handleSelect}
              onPress={() => handlePressCard(item)}
              unreadCount={index === 0 ? 3 : index === 1 ? 1 : 0}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={<NewConnections />}
          ListEmptyComponent={<EmptyState />}
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
    </EdgeToEdgeLayout>
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
    fontWeight: '700', 
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
    fontWeight: '500',
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
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
  },
  cardSelected: {
    backgroundColor: COLORS.roseLt,
  },

  avatarWrap: {
    marginRight: 16,
  },

  cardText: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    fontFamily: QS_BOLD,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMain,
    letterSpacing: -0.1,
    flex: 1,
    marginRight: 8,
  },
  cardNameUnread: {
    fontWeight: '800',
    color: COLORS.textMain,
  },
  cardTime: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
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
    fontWeight: '600',
    color: '#334155',
  },
  unreadBubble: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBubbleText: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { 
    fontFamily: QS_BOLD,
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.textMain, 
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  emptySub: { 
    fontSize: 13, 
    color: COLORS.textMuted, 
    textAlign: 'center', 
    lineHeight: 20 
  },
});