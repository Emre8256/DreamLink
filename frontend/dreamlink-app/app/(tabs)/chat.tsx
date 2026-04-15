import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import wsService from '../../services/websocket';
import { useAppStore } from '../../store/useAppStore';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  View,
  Alert,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyConversations, deleteConversation, ConversationResponse, formatRelativeTime } from '../../services/api';

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
      { text: 'İptal', style: 'cancel', onPress: onCancel },
      { text: 'Evet', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

// ─── Avatar Helper ────────────────────────────────────────────────────────────
const Avatar = ({ url, name, size = 56 }: { url: string | null; name: string; size?: number }) => {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2, objectFit: 'cover' }}
      />
    );
  }
  return (
    <LinearGradient
      colors={['#e2e8f0', '#cbd5e1']}
      style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: '#64748b' }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
};

// ─── Chat Card ────────────────────────────────────────────────────────────────
const ChatCard = ({
  item,
  isSelected,
  onSelect,
  onPress,
  isUnread = false
}: {
  item: ConversationResponse;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPress: () => void;
  isUnread?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.card, isSelected && styles.cardSelected]}
    activeOpacity={0.82}
    onLongPress={() => onSelect(item.id)}
    onPress={() => {
      if (isSelected) {
        onSelect(item.id);
      } else {
        onPress();
      }
    }}
  >
    {/* Avatar */}
    <View style={styles.avatarWrap}>
      <TouchableOpacity onPress={() => router.push('/user-profile')} activeOpacity={0.8}>
        <Avatar url={item.otherUser.avatarUrl} name={item.otherUser.nickname} size={56} />
      </TouchableOpacity>
    </View>

    {/* Text */}
    <View style={styles.cardText}>
      <View style={styles.nameRow}>
        <Text style={[styles.cardName, isUnread && { fontWeight: '800' }]} numberOfLines={1}>{item.otherUser.nickname}</Text>
        <Text style={[styles.cardTime, isUnread && { color: '#B3717A', fontWeight: 'bold' }]}> 
          {item.lastMessageAt ? formatRelativeTime(item.lastMessageAt) : 'Yeni'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.cardSub, isUnread && { fontWeight: '700', color: '#1e293b' }]} numberOfLines={1}>
          {item.lastMessage ? item.lastMessage : '✨ Sohbet başlatıldı'}
        </Text>
        {isUnread && <View style={styles.unreadDot} />}
      </View>
    </View>
  </TouchableOpacity>
);

// ─── New Connections (Mocked) ──────────────────────────────────────────────────
const MockConnections = [
  { name: 'Elena', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0jG3h3Uxa6r85NP9v4xoktztxkUogstTz0lRCss2RGqb4ctNhghaWDrojBj-2KKC6lBta9HbRYc2GnOsQxgAQdd8rg0-zUaOVlW6Lx0n5rwlj5zvXLKmvzsyXsv5eNacu1nFByfk6aEsP21NOdAYXPXedHCpAuEJpWL4bSXNppW90rS_4mOvSEcXgsot5_4oaM3kgln0g9lkrpk1mLEqCDc3NUjfk5myW_Bos0PQszuEOX0viXMYkTWNaQKUO0KxEpmKz7k8-fu4' },
  { name: 'Marcus', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqVhgvqyvc0MZQf3D105UmM3iSnSwdcWJoieaM6zO1dBVS0wBYgDvfY9Uu510W8mAPYiJ-9vSyXFWBwx57OYnTbfSWyPmlqP4f9Pi0wdp6-jhm8CEnqCqzIHtAM3PJW8-X9ljIWft5U5ruiI4l3Kqsqia59XWJ_6PR7cWWs4qyknHhj5QDc78JAlp04E-xalvU1woWYKWPGbaPVYo20O6YkMPkhVj1c4zeXTftv0tmVJN6DQRHB5xXkr_cM7zQLhwJVAXMWhQujvg' },
  { name: 'Sienna', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkNat6SXWFcZUswYPKSLm2zbVCa9JJ-5pcmDqS1E1pl5vEEIyXlSA1NeDvEn8tan1w8GxFXebl5tGzwi3jUC06d_0Ohmq3Rg2W4nulWySHeeY1lE4nO6GPDknVgjTJffEZpt_t7DDJfx_4WEQOOxKra3m2rar0flzkrnurSCCnRTao5QTgnYEa3l1-buoVDyDiwHDYEY7zWv9r69cDSVvyEZmjsZ3SeITaPgGJ6xlxUa1u72tZlRvdr_PC3QJqXu6Vg-MUxx6JXU8' },
  { name: 'Julian', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtw7E5YoURAzQp__C3TO0EzBcvT2TDTonkF_XZL9-fVlOS8dY7lHZnlVwiEN2ZqghbmUgSRZIL5ekHTJs5m5bsSDeKM9ZO0JFr9Pi4i3KdLv5i87h5UAZktbsiMPV1RlzQB97jySIEBHAwUrfmy4SL4_G3-3w_G-Qg9K6jM24LHWXe5jInQZ9dmbRGVae3rsIKwj1UyrcIv9BPwunj69UkVjToo-Bj_3P4pXdwoMEB0Z-N0mjjj3tK99il9bk6nOSbhW6gOi7Asd4' },
];

const NewConnections = () => (
  <View style={styles.connectionsContainer}>
    <Text style={styles.connectionsTitle}>NEW CONNECTIONS</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.connectionsScroll}>
      {MockConnections.map((user, idx) => (
        <View key={idx} style={styles.connectionItem}>
          <TouchableOpacity onPress={() => router.push('/user-profile')}>
            <View style={styles.connectionAvatarBorder}>
              <Image source={{ uri: user.img }} style={styles.connectionAvatar} />
            </View>
          </TouchableOpacity>
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
      colors={['rgba(126,107,255,0.08)', 'rgba(126,107,255,0.02)']}
      style={styles.emptyIcon}
    >
      <Ionicons name="chatbubbles-outline" size={40} color="#C1C8FF" />
    </LinearGradient>
    <Text style={styles.emptyTitle}>No chats yet</Text>
    <Text style={styles.emptySub}>
      Like dreams in Discover—once it’s mutual, you can start chatting here.
    </Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
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
      // msg.chatId ve msg içeriği backend ile uyumlu olmalı
      if (msg && msg.chatId) {
        useAppStore.getState().addMessage(msg.chatId, msg);
        // Listeyi anlık yenile (son mesajın güncellenmesi için)
        load();
        // Bildirim noktasını göster
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
      // Mesajlar sayfasına girildiğinde bildirimi temizle
      setUnreadMessages(false);
    }, [load, setUnreadMessages])
  );

  const handleDelete = () => {
    if (!selectedId) return;

    showConfirm(
      'Delete chat',
      'Are you sure you want to delete this chat and all messages? This action cannot be undone.',
      async () => {
        try {
          setLoading(true);
          await deleteConversation(selectedId);
          setConversations(prev => prev.filter(c => c.id !== selectedId));
          setSelectedId(null);
        } catch (error) {
          showAlert('Error', 'Failed to delete chat.');
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
      setSelectedId(id); // Select new
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
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7E6BFF" />
      </View>
    );
  }

  return (
    <View style={[styles.root]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
        {selectedId ? (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#B3717A" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchGlass}>
          <Ionicons name="search" size={20} color="#94a3b8" style={{ marginLeft: 16 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#94a3b8"
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
            isSelected={selectedId === item.id}
            onSelect={handleSelect}
            onPress={() => handlePressCard(item)}
            isUnread={index < 2} // Mocking unread status for first 2 items to match design
          />
        )}
        ListHeaderComponent={<NewConnections />}
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
  root: {
    flex: 1,
    backgroundColor: '#f8f6f6', // Light background or gradient
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    position: 'relative',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#334155' },

  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#334155',
  },

  connectionsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  connectionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 1.5,
    paddingHorizontal: 24,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  connectionsScroll: {
    paddingHorizontal: 24,
    gap: 20,
  },
  connectionItem: {
    alignItems: 'center',
    gap: 8,
  },
  connectionAvatarBorder: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#B3717A',
    shadowColor: '#B3717A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  connectionAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  connectionName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#334155',
  },

  listContent: { paddingBottom: 120 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.4)', // slate-200/40
  },
  cardSelected: {
    backgroundColor: 'rgba(179,113,122,0.08)',
  },

  avatarWrap: { marginRight: 16 },

  cardText: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#334155' },
  cardTime: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  cardSub: { fontSize: 14, color: '#94a3b8', paddingRight: 16 },
  
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B3717A',
    marginLeft: 8,
  },

  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21 },
});
