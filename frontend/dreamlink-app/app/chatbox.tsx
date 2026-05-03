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
import { EdgeToEdgeLayout } from '../components/EdgeToEdgeLayout';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import {
  getMessages,
  sendMessage,
  getMyProfile,
  MessageResponse,
  UserProfileResponse,
} from '../services/api';
import wsService from '../services/websocket';

/* ─────────────────────────── Tokens & Theme ─────────────────────────── */
const QS_BOLD = 'Quicksand_700Bold';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const C = {
  primary: '#A63F4F',      // Koyu Rose (Ana Renk)
  roseLt: '#F7E6E8',       // Açık Rose 
  roseMd: '#D697A2',       // Orta Rose
  roseDk: '#7D2D3A',       // Derin Rose
  bg: '#FFFFFF',
  sand: '#F8FAFC',         // Karşı tarafın mesaj balonu için açık, tok gri
  textMain: '#1C1714',
  textMuted: '#475569',
  textLight: '#94a3b8',
  borderLight: 'rgba(0,0,0,0.04)',
};

/* ─────────────────────────── Types ─────────────────────────── */
interface ChatMessage {
  id: string;
  text: string;
  senderId: string | number;
  createdAt: Date;
  pending?: boolean;
}

/* ─────────────────────── Helper ─────────────────────────────── */
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
          <Ionicons name="chevron-back" size={28} color={C.textMain} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.headerMenuBtn}
        onPress={() => router.push('/settings' as any)}
        activeOpacity={0.65}
      >
        <Ionicons name="ellipsis-vertical" size={22} color={C.textMain} />
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
      showAlert('Error', 'Chat information not found.');
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
        showAlert('Error', 'Chat could not be loaded.');
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
      showAlert('Error', 'Message could not be sent.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(text);
    }
  }, [inputText, conversationId, currentUser]);

  /* ─────────────────── Render ─────────────────────────────── */
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <EdgeToEdgeLayout backgroundColor={C.bg} statusBarStyle="dark-content" statusBarBg={C.bg}>
      <View style={styles.container}>
        <CustomHeader title={name || 'Chat'} avatarUrl={avatar} />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.matchBannerContainer}>
            <View style={styles.matchBanner}>
              <Text style={styles.matchBannerTitle}>DREAM CONNECTION ESTABLISHED</Text>
              <Text style={styles.matchBannerSub}>
                You matched on this dream: <Text style={styles.matchBannerDream}>"Lost City Atlas"</Text>
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
            onPress={() => showAlert('Attachment', 'Menu will open')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={26} color={C.textLight} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={C.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.85}>
            <Ionicons name="send" size={16} color="#fff" style={{ transform: [{ rotate: '-45deg' }, { translateX: 2 }] }} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      </View>
    </EdgeToEdgeLayout>
  );
}

/* ─────────────────────── Styles ─────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  center: { justifyContent: 'center', alignItems: 'center' },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.bg,
    zIndex: 10,
  },
  headerBtn: { padding: 4 },
  headerMenuBtn: { padding: 8 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: {
    backgroundColor: C.roseMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: '#4ade80',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerName: { fontFamily: QS_BOLD, fontSize: 18, fontWeight: '700', color: C.textMain, letterSpacing: -0.2 },
  headerStatus: { fontSize: 11, color: C.textLight, fontWeight: '600', marginTop: 1 },

  /* Match Banner */
  matchBannerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 12,
  },
  matchBanner: {
    backgroundColor: C.bg,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    maxWidth: '90%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(166,63,79,0.15)',
    shadowColor: C.primary,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  matchBannerTitle: {
    fontFamily: QS_BOLD,
    fontSize: 10,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  matchBannerSub: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  matchBannerDream: {
    fontFamily: SERIF,
    fontWeight: '700',
    fontStyle: 'italic',
    color: C.textMain,
  },

  /* List */
  listContent: { paddingHorizontal: 16, paddingVertical: 16 },

  /* Bubbles */
  bubbleRow: { flexDirection: 'column', marginVertical: 6 },
  bubbleRowRight: { alignItems: 'flex-end' },
  bubbleRowLeft: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  bubbleMe: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 6,
    shadowColor: C.primary,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  bubbleThem: {
    backgroundColor: C.sand,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: C.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleTextMe: { fontFamily: QS_BOLD, color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 21 },
  bubbleTextThem: { fontFamily: QS_BOLD, color: C.textMain, fontSize: 14, fontWeight: '600', lineHeight: 21 },
  time: { fontSize: 10, fontWeight: '700', marginTop: 6, color: C.textLight },
  timeMe: { marginRight: 6, textAlign: 'right' },
  timeThem: { marginLeft: 6, textAlign: 'left' },

  /* Footer & Toolbar */
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Çok satırlı olunca aşağı hizalaması için
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.borderLight,
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  toolbarAddBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    marginBottom: 2, // Hizalama
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    fontFamily: QS_BOLD,
    fontWeight: '500',
    fontSize: 14,
    color: C.textMain,
    maxHeight: 120,
    minHeight: 38,
    textAlignVertical: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: 20,
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});