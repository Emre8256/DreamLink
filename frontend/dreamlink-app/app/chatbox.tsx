import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import {
  AvatarProps,
  Bubble,
  BubbleProps,
  Day,
  DayProps,
  GiftedChat,
  IMessage,
  MessageTextProps,
  Time,
  TimeProps
} from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getMessages,
  sendMessage,
  getMyProfile,
  MessageResponse,
  UserProfileResponse
} from '../services/api';
import wsService from '../services/websocket';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};

// Özel Başlık
const CustomHeader = ({ title, avatarUrl }: { title: string; avatarUrl?: string | null }) => {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
        <Ionicons name="arrow-back" size={26} color="#000" />
      </TouchableOpacity>

      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
      ) : (
        <View style={[styles.headerAvatar, { backgroundColor: '#7E6BFF', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>{title.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.headerUser}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.headerName}>{title}</Text>
          <Ionicons name="checkmark-circle" size={16} color="#0095F6" style={{ marginLeft: 4 }} />
        </View>
      </View>

      <TouchableOpacity style={styles.headerButton}>
        <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

// Prop tipleri
type CustomInputToolbarProps = {
  onSend: () => void;
  text: string;
  onTextChanged: (text: string) => void;
  onCameraPress: () => void;
  onImagePress: () => void;
  onMicPress: () => void;
  isKeyboardOpen: boolean;
};

// Özel Mesaj Giriş Çubuğu
const CustomInputToolbar = ({
  onSend,
  text,
  onTextChanged,
  onCameraPress,
  onImagePress,
  onMicPress,
  isKeyboardOpen
}: CustomInputToolbarProps) => {

  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = isKeyboardOpen ? 12 : (insets.bottom || 0) + 12;

  return (
    <View style={[
      styles.toolbarContainer,
      { paddingBottom: dynamicPaddingBottom }
    ]}>

      <TouchableOpacity style={styles.toolbarButton} onPress={onCameraPress}>
        <Ionicons name="camera-outline" size={26} color="#6e44ff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.toolbarButton} onPress={onImagePress}>
        <Ionicons name="image-outline" size={26} color="#6e44ff" />
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.toolbarInput}
          placeholder="Send a message"
          placeholderTextColor="#8A8A8E"
          value={text}
          onChangeText={onTextChanged}
          multiline
          maxLength={500}
        />
      </View>

      {text.length > 0 ? (
        <TouchableOpacity style={styles.sendButton} onPress={onSend}>
          <Ionicons name="arrow-up-circle" size={30} color="#6e44ff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.toolbarButton} onPress={onMicPress}>
          <Ionicons name="mic-outline" size={26} color="#6e44ff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// 3. Ana Sohbet Ekranı
export default function ChatboxScreen() {
  const insets = useSafeAreaInsets();
  const { conversationId, name, avatar } = useLocalSearchParams<{ conversationId: string; name: string; avatar: string }>();

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfileResponse | null>(null);

  // Load user and messages
  useEffect(() => {
    if (!conversationId) {
      showAlert('Hata', 'Sohbet bilgisi bulunamadı.');
      setLoading(false);
      return;
    }
    async function init() {
      try {
        const [me, msgs] = await Promise.all([
          getMyProfile(),
          getMessages(conversationId)
        ]);
        setCurrentUser(me);

        // Map backend messages to GiftedChat IMessage
        const giftMessages = msgs.map((m: MessageResponse) => ({
          _id: m.id,
          text: m.content,
          createdAt: new Date(m.sentAt),
          user: {
            _id: m.senderId,
            name: 'User', // We might want to fetch sender details if needed, but for now ID is enough to distinguish
          }
        }));

        // GiftedChat expects newest messages first
        setMessages(giftMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

      } catch (error) {
        console.error("Failed to load chat", error);
        showAlert("Hata", "Sohbet yüklenemedi");
      } finally {
        setLoading(false);
      }
    }

    if (conversationId) {
      init();
    }
  }, [conversationId]);

  // WebSocket: gerçek zamanlı mesaj alma
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const destination = `/topic/chat/${conversationId}`;

    wsService.subscribe(destination, (payload: MessageResponse) => {
      // Kendi gönderdiğimiz mesajı duplicate gösterme
      // (optimistic UI zaten ekledi, sadece karşı tarafın mesajını göster)
      if (payload.senderId === currentUser.id) return;

      const incoming: IMessage = {
        _id: payload.id,
        text: payload.content,
        createdAt: new Date(payload.sentAt),
        user: { _id: payload.senderId },
      };
      setMessages(prev => GiftedChat.append(prev, [incoming]));
    });

    return () => {
      wsService.unsubscribe(destination);
    };
  }, [conversationId, currentUser]);

  // Klavye aç/kapat takibi
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const onSend = useCallback(async () => {
    if (!inputText.trim() || !conversationId) return;

    const textToSend = inputText.trim();
    setInputText(''); // Clear input immediately for better UX

    // Create optimistic message
    const tempId = Math.random().toString();
    const optimisticMessage: IMessage = {
      _id: tempId,
      text: textToSend,
      createdAt: new Date(),
      user: { _id: currentUser?.id || 'me' },
    };

    setMessages(previousMessages => GiftedChat.append(previousMessages, [optimisticMessage]));

    try {
      const savedMessage = await sendMessage(conversationId, textToSend);
      // Replace optimistic message with real one (optional, or just rely on state update/refresh)
      // Ideally we update the ID from tempId to savedMessage.id
    } catch (error) {
      console.error("Failed to send", error);
      showAlert("Hata", "Mesaj gönderilemedi");
      // Remove optimistic message on failure (basic implementation)
      setMessages(previousMessages => previousMessages.filter(m => m._id !== tempId));
      setInputText(textToSend); // Restore text
    }
  }, [inputText, conversationId, currentUser]);

  const handleCameraPress = () => showAlert('Camera', 'Kamera açılacak');
  const handleImagePress = () => showAlert('Gallery', 'Galeri açılacak');
  const handleMicPress = () => showAlert('Mic', 'Ses kaydı başlayacak');

  // Mesaj Balonları
  const renderBubble = (props: BubbleProps<IMessage>) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: '#262626',
          borderRadius: 20,
          marginBottom: 8,
        },
        left: {
          backgroundColor: '#EFEFEF',
          borderRadius: 20,
          marginBottom: 8,
        },
      }}
      renderTicks={() => null}
    />
  );

  // Tarih Etiketi
  const renderDay = (props: DayProps) => (
    <Day
      {...props}
      containerStyle={styles.dayContainer}
      textStyle={styles.dayText}
    />
  );

  // Saati gizle (çünkü renderMessageText içinde hallediyoruz)
  const renderTime = (props: TimeProps<IMessage>) => (
    null
  );

  // Saati ve Metni Birlikte Render Eden Fonksiyon
  const renderMessageText = (props: MessageTextProps<IMessage>) => {
    const { currentMessage, position } = props;
    const isMe = position === 'right';

    return (
      <View style={[styles.messageTextContainer, isMe && { justifyContent: 'flex-end' }]}>
        <Text style={isMe ? styles.messageTextRight : styles.messageTextLeft}>
          {currentMessage.text}
        </Text>
        <Time
          {...props}
          // containerStyle, 'LeftRightStyle' bekler
          containerStyle={{
            left: styles.timeContainer,
            right: styles.timeContainer,
          }}
          // timeTextStyle, 'LeftRightStyle' bekler
          timeTextStyle={{
            left: styles.timeTextLeft,
            right: styles.timeTextRight,
          }}
        />
      </View>
    );
  };

  // Avatar
  const renderAvatar = (props: AvatarProps<IMessage>) => {
    const { currentMessage } = props;
    if (!currentMessage?.user || currentMessage.user._id === currentUser?.id || !currentMessage.user.avatar) {
      return null;
    }
    return (
      <Image
        source={{ uri: currentMessage.user.avatar as string }}
        style={styles.avatar}
      />
    );
  };


  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6e44ff" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomHeader title={name || 'Sohbet'} avatarUrl={avatar} />
      {/* Note: We ideally want to pass the other user's name/avatar via params or fetch it from conversation details */}

      <GiftedChat
        messages={messages}
        user={{ _id: currentUser?.id || 'me' }} // Current user ID

        renderBubble={renderBubble}
        renderDay={renderDay}
        renderTime={renderTime} // null
        renderAvatar={renderAvatar}
        renderMessageText={renderMessageText}

        renderInputToolbar={() => (
          <CustomInputToolbar
            text={inputText}
            onTextChanged={setInputText}
            onSend={onSend}
            onCameraPress={handleCameraPress}
            onImagePress={handleImagePress}
            onMicPress={handleMicPress}
            isKeyboardOpen={isKeyboardOpen}
          />
        )}

        messagesContainerStyle={{
          paddingBottom: 20,
          backgroundColor: '#FFFFFF',
        }}

        minInputToolbarHeight={76}
      />
    </View>
  );
}

// 4. Stiller (Değişiklik yok)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerButton: {
    padding: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
  },
  headerUser: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  dayContainer: {
    alignSelf: 'center',
    marginVertical: 16,
  },
  dayText: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '600',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageTextContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    flexWrap: 'nowrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageTextRight: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1,
  },
  messageTextLeft: {
    color: '#000000',
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1,
  },
  timeContainer: {
    marginLeft: 8,
    marginRight: 0,
    marginBottom: 0,
  },
  timeTextRight: {
    fontSize: 10,
    color: '#FFFFFF99', // Yarı şeffaf beyaz
  },
  timeTextLeft: {
    fontSize: 10,
    color: '#00000099', // Yarı şeffaf siyah (gri)
  },
  toolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    minHeight: 76,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  toolbarInput: {
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#000000',
    maxHeight: 100,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
