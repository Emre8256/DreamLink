import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import {
  getMessages,
  sendMessage,
  getMyProfile,
  MessageResponse,
  UserProfileResponse,
} from '../services/api';
import wsService from '../services/websocket';

/* ─────────────────────────── types ─────────────────────────── */
interface ChatMessage {
  id: string;
  text: string;
  senderId: string | number;
  createdAt: Date;
  pending?: boolean;
}

/* ─────────────────────── helper ─────────────────────────────── */
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ─────────────────────── Header ─────────────────────────────── */
const CustomHeader = ({
  title,
  avatarUrl,
}: {
  title: string;
  avatarUrl?: string | null;
}) => {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color="#64748b" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ position: 'relative' }}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {title.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>
          
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.headerName} numberOfLines={1}>
              {title}
            </Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>Online</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.headerBtn}>
        <Ionicons name="call-outline" size={22} color="#64748b" />
      </TouchableOpacity>
    </View>
  );
};

/* ─────────────────── Message Bubble ─────────────────────────── */
const MessageBubble = ({
  msg,
  isMe,
}: {
  msg: ChatMessage;
  isMe: boolean;
}) => (
  <View style={[styles.bubbleRow, isMe ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
      <Text style={isMe ? styles.bubbleTextMe : styles.bubbleTextThem}>
        {msg.text}
      </Text>
    </View>
    <Text style={[styles.time, isMe ? styles.timeMe : styles.timeThem]}>
      {formatTime(msg.createdAt)}
    </Text>
  </View>
);

/* ─────────────────── Main Screen ─────────────────────────────── */
export default function ChatboxScreen() {
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  const { conversationId, name, avatar } = useLocalSearchParams<{
    conversationId: string;
    name: string;
    avatar: string;
  }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfileResponse | null>(null);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const inputDockAnimatedStyle = useAnimatedStyle(() => {
    const lift = Math.max(0, keyboard.height.value - insets.bottom);
    return { transform: [{ translateY: -lift }] };
  });

  /* ── Load user + history ── */
  useEffect(() => {
    if (!conversationId) {
      showAlert('Error', 'Chat information could not be found.');
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        const [me, msgs] = await Promise.all([
          getMyProfile(),
          getMessages(conversationId),
        ]);
        setCurrentUser(me);

        const formatted: ChatMessage[] = msgs
          .map((m: MessageResponse) => ({
            id: m.id,
            text: m.content,
            senderId: m.senderId,
            createdAt: new Date(m.sentAt),
          }))
          .sort(
            (a: ChatMessage, b: ChatMessage) =>
              a.createdAt.getTime() - b.createdAt.getTime()
          );
        setMessages(formatted);
      } catch (err) {
        console.error('Failed to load chat', err);
        showAlert('Error', 'Failed to load chat.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [conversationId]);

  /* ── WebSocket – incoming messages ── */
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const dest = `/topic/chat/${conversationId}`;
    wsService.subscribe(dest, (payload: MessageResponse) => {
      if (payload.senderId === currentUser.id) return;
      setMessages(prev => [
        ...prev,
        {
          id: payload.id,
          text: payload.content,
          senderId: payload.senderId,
          createdAt: new Date(payload.sentAt),
        },
      ]);
    });

    return () => wsService.unsubscribe(dest);
  }, [conversationId, currentUser]);

  /* ── Auto-scroll on new message ── */
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  }, [messages.length]);

  /* ── Send ── */
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !conversationId) return;
    setInputText('');

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      text,
      senderId: currentUser?.id || 'me',
      createdAt: new Date(),
      pending: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const saved = await sendMessage(conversationId, text);
      setMessages(prev =>
        prev.map(m =>
          m.id === tempId
            ? { ...m, id: saved.id, pending: false }
            : m
        )
      );
    } catch (err) {
      console.error('Send failed', err);
      showAlert('Hata', 'Mesaj gönderilemedi.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(text);
    }
  }, [inputText, conversationId, currentUser]);

  /* ─────────────────── Render ─────────────────────────────── */
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#7E6BFF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomHeader title={name || 'Sohbet'} avatarUrl={avatar} />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.matchBannerContainer}>
            <View style={styles.matchBanner}>
              <Text style={styles.matchBannerTitle}>DREAM LINK ESTABLISHED</Text>
              <Text style={styles.matchBannerSub}>
                You connected through <Text style={{fontWeight: 'bold', fontStyle: 'italic'}}>Neon City Flight</Text>
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <MessageBubble
            msg={item}
            isMe={item.senderId === currentUser?.id}
          />
        )}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* Input Toolbar */}
      <Animated.View
        style={[
          styles.footerContainer,
          inputDockAnimatedStyle,
          { paddingBottom: Math.max(insets.bottom + 8, 10) },
        ]}
      >
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolbarAddBtn}
            onPress={() => showAlert('Add', 'Menü açılacak')}
          >
            <Ionicons name="add" size={24} color="#64748b" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Whisper a message..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={18} color="#fff" style={{ transform: [{ rotate: '-45deg' }, { translateX: 2 }] }} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

/* ─────────────────────── Styles ─────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },
  center: { justifyContent: 'center', alignItems: 'center' },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  headerBtn: { padding: 4 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: {
    backgroundColor: '#B3717A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: '#4ade80',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerName: { fontSize: 16, fontWeight: '700', color: '#1e293b', lineHeight: 20 },

  /* Match Banner */
  matchBannerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  matchBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    maxWidth: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 122, 0.3)',
  },
  matchBannerTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 4,
  },
  matchBannerSub: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },

  /* List */
  listContent: { paddingHorizontal: 16, paddingVertical: 16 },

  /* Bubbles */
  bubbleRow: { flexDirection: 'column', marginVertical: 6 },
  bubbleRowRight: { alignItems: 'flex-end' },
  bubbleRowLeft: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleMe: {
    backgroundColor: '#B3717A',
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleThem: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  bubbleTextMe: { color: '#fff', fontSize: 15, lineHeight: 21 },
  bubbleTextThem: { color: '#334155', fontSize: 15, lineHeight: 21 },
  time: { fontSize: 10, marginTop: 4 },
  timeMe: { color: '#94a3b8', marginRight: 4, textAlign: 'right' },
  timeThem: { color: '#94a3b8', marginLeft: 4, textAlign: 'left' },

  /* Footer & Toolbar */
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  toolbarAddBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#334155',
    maxHeight: 100,
    minHeight: 36,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B3717A',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
