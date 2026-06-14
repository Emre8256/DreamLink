import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
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
  StatusBar,
  Modal,
  Pressable,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
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
const SERIF = 'Quicksand_700Bold';

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
  onPressProfile,
  onPressMenu,
}: {
  title: string;
  avatarUrl?: string | null;
  onPressProfile?: () => void;
  onPressMenu?: () => void;
}) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color={C.textMain} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressProfile}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <View>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {title.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.headerName} numberOfLines={1}>
            {title}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.headerMenuBtn}
        onPress={onPressMenu}
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

export default function ChatboxScreen() {
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  const router = useRouter();

  const handlePressProfile = () => {
    const getDreamId = (id: string, nickname?: string) => {
      if (id === 'conv-1' || nickname === 'Deren') return 'd1';
      if (id === 'conv-2' || nickname === 'Emre') return 'd2';
      if (id === 'conv-3' || nickname === 'Melis') return 'd3';
      if (id === 'conv-4' || nickname === 'Zeynep') return 'd6';
      if (id === 'conv-5' || nickname === 'Can') return 'd5';
      return id;
    };

    router.push({
      pathname: '/user-card',
      params: {
        dreamId: getDreamId(conversationId, name),
        nickname: name || '',
        avatarUrl: avatar || '',
        hideButtons: 'true'
      }
    });
  };

  const { conversationId, name, avatar, themeMatch, disconnected } = useLocalSearchParams<{
    conversationId: string;
    name: string;
    avatar: string;
    themeMatch?: string;
    disconnected?: string;
  }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfileResponse | null>(null);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    []
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetView, setSheetView] = useState<'main' | 'block' | 'report' | 'remove'>('main');

  useEffect(() => {
    const onBackPress = () => {
      if (isSheetOpen) {
        if (sheetView !== 'main') {
          setSheetView('main');
        } else {
          bottomSheetRef.current?.close();
        }
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [isSheetOpen, sheetView]);


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
        const me = await getMyProfile();
        setCurrentUser(me);

        let formatted: ChatMessage[] = [];
        if (conversationId.startsWith('conv-')) {
          const now = Date.now();
          if (conversationId === 'conv-2') {
            formatted = [
              {
                id: 'm1',
                text: 'Hey! I saw the match profile. Really interesting similarity index.',
                senderId: 'user-2',
                createdAt: new Date(now - 1000 * 60 * 60 * 2),
              },
              {
                id: 'm2',
                text: 'Yeah! The symbol of the floating keys was exactly the same.',
                senderId: me.id,
                createdAt: new Date(now - 1000 * 60 * 60 * 1.5),
              },
              {
                id: 'm3',
                text: 'I think our dreams are overlapping. What time did you wake up?',
                senderId: 'user-2',
                createdAt: new Date(now - 1000 * 60 * 45),
              }
            ];
          } else if (conversationId === 'conv-3') {
            formatted = [
              {
                id: 'm1',
                text: 'Did you also see the forest path in your dream?',
                senderId: 'user-3',
                createdAt: new Date(now - 1000 * 60 * 60 * 5),
              },
              {
                id: 'm2',
                text: 'Yes! It had numbered doors.',
                senderId: me.id,
                createdAt: new Date(now - 1000 * 60 * 60 * 4),
              },
              {
                id: 'm3',
                text: 'I wrote down the details. Talk to you tomorrow!',
                senderId: 'user-3',
                createdAt: new Date(now - 1000 * 60 * 60 * 3),
              }
            ];
          } else if (conversationId === 'conv-5') {
            formatted = [
              {
                id: 'm1',
                text: 'The gravity in the city was reversed, right?',
                senderId: 'user-5',
                createdAt: new Date(now - 1000 * 60 * 60 * 35),
              },
              {
                id: 'm2',
                text: 'Absolutely. We were walking on the sides of skyscrapers.',
                senderId: me.id,
                createdAt: new Date(now - 1000 * 60 * 60 * 34),
              },
              {
                id: 'm3',
                text: 'Exactly, the physics of it is mind-bending.',
                senderId: 'user-5',
                createdAt: new Date(now - 1000 * 60 * 60 * 32),
              }
            ];
          }
        } else {
          const msgs = await getMessages(conversationId);
          formatted = msgs
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
        }
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
    if (!conversationId || !currentUser || conversationId.startsWith('conv-')) return;

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
      if (conversationId.startsWith('conv-')) {
        setMessages(prev =>
          prev.map(m =>
            m.id === tempId
              ? { ...m, id: `mock-${Date.now()}`, pending: false }
              : m
          )
        );
      } else {
        const saved = await sendMessage(conversationId, text);
        setMessages(prev =>
          prev.map(m =>
            m.id === tempId
              ? { ...m, id: saved.id, pending: false }
              : m
          )
        );
      }
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={{ paddingTop: insets.top, backgroundColor: C.bg, zIndex: 10 }}>
        <CustomHeader
          title={name || 'Chat'}
          avatarUrl={avatar}
          onPressProfile={handlePressProfile}
          onPressMenu={() => bottomSheetRef.current?.expand()}
        />
      </View>

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
                You matched on this dream: <Text style={styles.matchBannerDream}>"{themeMatch || 'Shared Dream'}"</Text>
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

      {/* Input Toolbar or Disconnected Footer */}
      {disconnected === 'true' ? (
        <View
          style={[
            styles.disconnectedFooter,
            { paddingBottom: Math.max(insets.bottom + 16, 20) },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={20} color={C.textMuted} style={{ marginRight: 8 }} />
          <Text style={styles.disconnectedFooterText}>
            This connection has been removed. You can no longer send messages.
          </Text>
        </View>
      ) : (
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
      )}

      {/* ── Bottom Sheet Options Menu ── */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="box-none">
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          enableDynamicSizing={true}
          enablePanDownToClose={true}
          enableContentPanningGesture={false}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: '#FFFFFF', borderRadius: 28 }}
          handleIndicatorStyle={{ backgroundColor: '#E2E8F0', width: 40 }}
          onChange={(index) => {
            setIsSheetOpen(index >= 0);
            if (index === -1) {
              setSheetView('main');
            }
          }}
        >
          <BottomSheetView style={{ paddingBottom: insets.bottom + 16, paddingHorizontal: 24, paddingTop: 12 }}>
            {sheetView === 'main' && (
              <>
                <Text style={styles.menuTitle}>Chat Options</Text>
                
                <View style={styles.menuOptionsList}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setSheetView('block')}
                  >
                    <Ionicons name="ban-outline" size={20} color={C.primary} style={{ marginRight: 12 }} />
                    <Text style={[styles.menuItemText, { color: C.textMain }]}>Block User</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setSheetView('report')}
                  >
                    <Ionicons name="alert-circle-outline" size={20} color={C.primary} style={{ marginRight: 12 }} />
                    <Text style={[styles.menuItemText, { color: C.textMain }]}>Report User</Text>
                  </TouchableOpacity>

                  {disconnected === 'true' ? (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        bottomSheetRef.current?.close();
                        setTimeout(() => {
                          Alert.alert('Deleted', 'Chat has been deleted.');
                          router.back();
                        }, 300);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color={C.primary} style={{ marginRight: 12 }} />
                      <Text style={[styles.menuItemText, { color: C.textMain }]}>Delete Chat</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => setSheetView('remove')}
                    >
                      <Ionicons name="close-circle-outline" size={20} color={C.primary} style={{ marginRight: 12 }} />
                      <Text style={[styles.menuItemText, { color: C.textMain }]}>Remove Connection</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {sheetView === 'block' && (
              <View style={styles.confirmContainer}>
                <Text style={styles.confirmTitle}>Block User?</Text>
                <Text style={styles.confirmDesc}>
                  Are you sure you want to block {name || 'this user'}? You will no longer see each other's profiles or messages.
                </Text>
                
                <TouchableOpacity
                  style={styles.confirmBtnPrimary}
                  onPress={() => {
                    bottomSheetRef.current?.close();
                    setTimeout(() => {
                      Alert.alert('Blocked', 'User has been blocked.');
                      router.back();
                    }, 300);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#A63F4F', '#7D2D3A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmBtnPrimaryGradient}
                  >
                    <Text style={styles.confirmBtnPrimaryText}>Block User</Text>
                    <Ionicons name="ban" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtnSecondary}
                  onPress={() => setSheetView('main')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {sheetView === 'report' && (
              <View style={styles.confirmContainer}>
                <Text style={styles.confirmTitle}>Report User?</Text>
                <Text style={styles.confirmDesc}>
                  Are you sure you want to report {name || 'this user'} for inappropriate behavior? We will review this profile within 24 hours.
                </Text>
                
                <TouchableOpacity
                  style={styles.confirmBtnPrimary}
                  onPress={() => {
                    bottomSheetRef.current?.close();
                    setTimeout(() => {
                      Alert.alert('Reported', 'Thank you. We will review this profile.');
                      router.back();
                    }, 300);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#A63F4F', '#7D2D3A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmBtnPrimaryGradient}
                  >
                    <Text style={styles.confirmBtnPrimaryText}>Report User</Text>
                    <Ionicons name="alert-circle" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtnSecondary}
                  onPress={() => setSheetView('main')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {sheetView === 'remove' && (
              <View style={styles.confirmContainer}>
                <Text style={styles.confirmTitle}>Remove Connection?</Text>
                <Text style={styles.confirmDesc}>
                  Are you sure you want to remove your connection with {name || 'this user'}? This action cannot be undone.
                </Text>
                
                <TouchableOpacity
                  style={styles.confirmBtnPrimary}
                  onPress={() => {
                    bottomSheetRef.current?.close();
                    setTimeout(() => {
                      Alert.alert('Removed', 'Connection has been removed.');
                      router.back();
                    }, 300);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#A63F4F', '#7D2D3A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmBtnPrimaryGradient}
                  >
                    <Text style={styles.confirmBtnPrimaryText}>Remove Connection</Text>
                    <Ionicons name="close-circle" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtnSecondary}
                  onPress={() => setSheetView('main')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </BottomSheetView>
        </BottomSheet>
      </View>
    </View>
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
  headerName: { fontFamily: QS_BOLD, fontSize: 18, color: C.textMain, letterSpacing: -0.2 },

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
  bubbleTextMe: { fontFamily: QS_BOLD, color: '#fff', fontSize: 14, lineHeight: 21 },
  bubbleTextThem: { fontFamily: QS_BOLD, color: C.textMain, fontSize: 14, lineHeight: 21 },
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
  /* Options Menu BottomSheet */
  menuTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textMain,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: QS_BOLD,
  },
  menuOptionsList: {
    marginTop: 8,
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  menuItemText: {
    fontFamily: QS_BOLD,
    fontSize: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  /* Confirmation Drawer */
  confirmContainer: {
    paddingTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  confirmTitle: {
    fontFamily: QS_BOLD,
    fontSize: 18,
    color: C.textMain,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmDesc: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  confirmBtnPrimary: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnPrimaryGradient: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: QS_BOLD,
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  confirmBtnSecondary: {
    width: '100%',
    height: 50,
    borderRadius: 100,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnSecondaryText: {
    color: C.textMuted,
    fontSize: 15,
    fontFamily: QS_BOLD,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  disconnectedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  disconnectedFooterText: {
    fontFamily: QS_BOLD,
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});