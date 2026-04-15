import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent, isSpeechRecognitionAvailable } from '../../services/speechRecognition';
import wsService from '../../services/websocket';
import { useAppStore } from '../../store/useAppStore';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Platform,
  Animated,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createDream,
  getPublicDreams,
  DreamResponse,
  DreamTheme,
  CreateDreamRequest,
  THEME_TO_TURKISH,
  THEME_TO_ICON,
  formatRelativeTime,
  toggleLike,
  getUserDreams,
  getMyProfile,
  deleteDream,
  updateDreamVisibility
} from '../../services/api';
import { Modal } from 'react-native';

// --- Cross-platform Alert helpers (Alert.alert is no-op on web) ---
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};
const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

const getThemeColor = (themeId: string) => {
  const mapping: Record<string, { bg: string, text: string }> = {
    'HAPPY': { bg: '#fff7ed', text: '#ea580c' },
    'LOVE': { bg: '#fdf2f8', text: '#db2777' },
    'NIGHTMARE': { bg: '#fff1f2', text: '#e11d48' },
    'LUCID': { bg: '#f5f3ff', text: '#7c3aed' },
    'SAD': { bg: '#eff6ff', text: '#2563eb' },
    'ANGRY': { bg: '#fef2f2', text: '#dc2626' },
  };
  return mapping[themeId] || { bg: '#f1f5f9', text: '#64748b' };
};

// --- CONSTANTS ---
const DREAM_TAGS: { id: DreamTheme; label: string; emoji: string }[] = [
  { id: 'HAPPY', label: 'Happy', emoji: '😊' },
  { id: 'SAD', label: 'Sad', emoji: '😢' },
  { id: 'NIGHTMARE', label: 'Nightmare', emoji: '👻' },
  { id: 'LOVE', label: 'Love', emoji: '❤️' },
  { id: 'LUCID', label: 'Lucid', emoji: '✨' },
  { id: 'ANGRY', label: 'Angry', emoji: '😠' },
  { id: 'EXCITED', label: 'Excited', emoji: '🎉' },
  { id: 'CURIOUS', label: 'Curious', emoji: '🤔' },
];

const VISIBILITY_OPTIONS = [
  { id: 'PUBLIC', label: 'Public', icon: 'globe-outline' },
  { id: 'FOLLOWERS_ONLY', label: 'Followers only', icon: 'people-outline' },
  { id: 'PRIVATE', label: 'Private', icon: 'lock-closed-outline' },
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- COMPONENTS ---

const DreamCard = React.memo(({ dream }: { dream: DreamResponse }) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(dream.isLiked);
  const [likeCount, setLikeCount] = useState(dream.likeCount);

  const handlePress = () => {
    router.push(`/dream/${dream.id}`);
  };

  const handleLike = async () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

    try {
      await toggleLike(dream.id);
    } catch (error) {
      // Revert on error
      setIsLiked(!newLikedState);
      setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
      console.error("Like error:", error);
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.dreamCard}>
      <View style={styles.dreamHeader}>
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={() => router.push('/user-profile')} activeOpacity={0.8}>
            {dream.avatarUrl ? (
              <Image source={{ uri: dream.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{dream.nickname.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/user-profile')} activeOpacity={0.8} style={styles.userDetails}>
            <Text style={styles.username}>{dream.nickname}</Text>
            <Text style={styles.timestamp}>{formatRelativeTime(dream.createdAt)}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.themeBadge, { backgroundColor: getThemeColor(dream.theme).bg, borderColor: getThemeColor(dream.theme).bg, borderWidth: 1 }]}>
          <Ionicons name={THEME_TO_ICON[dream.theme] as any} size={12} color={getThemeColor(dream.theme).text} />
          <Text style={[styles.themeText, { color: getThemeColor(dream.theme).text, marginLeft: 4 }]}>
             {THEME_TO_TURKISH[dream.theme]}
          </Text>
        </View>
      </View>

      <Text style={styles.dreamTitle}>{dream.title}</Text>
      <Text style={styles.dreamDescription} numberOfLines={3}>{dream.description}</Text>

      <View style={styles.interactionBar}>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? "#B3717A" : "#94a3b8"}
          />
          <Text style={[
            styles.interactionCount,
            isLiked && styles.interactionCountActive
          ]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.interactionButton} activeOpacity={0.7} onPress={handlePress}>
          <Ionicons name="chatbubble-outline" size={20} color="#94a3b8" />
          <Text style={styles.interactionCount}>{dream.commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.matchButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="auto-fix" size={20} color="#B3717A" />
          <Text style={styles.matchButtonText}>Match</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
});

// --- TODAY DREAM CARD COMPONENT ---
const VISIBILITY_CYCLE: Array<'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE'> = ['PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE'];
const VISIBILITY_LABEL: Record<string, string> = {
  PUBLIC: '🌍 Public',
  FOLLOWERS_ONLY: '👥 Followers',
  PRIVATE: '🔒 Private',
};
const VISIBILITY_NEXT_LABEL: Record<string, string> = {
  PUBLIC: 'Make followers-only',
  FOLLOWERS_ONLY: 'Make private',
  PRIVATE: 'Make public',
};

const TodayDreamCard = React.memo(({ dream, onDelete, onVisibilityChange }: {
  dream: DreamResponse;
  onDelete: (id: string) => void;
  onVisibilityChange: (updated: DreamResponse) => void;
}) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/dream/${dream.id}`);
  };

  return (
    <Pressable onPress={handlePress} style={styles.dreamCard}>
      <View style={styles.dreamHeader}>
        <View style={styles.userInfo}>
          {dream.avatarUrl ? (
            <Image source={{ uri: dream.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{dream.nickname.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.userDetails}>
            <Text style={styles.username}>{dream.nickname}</Text>
            <Text style={styles.timestamp}>{formatRelativeTime(dream.createdAt)}</Text>
          </View>
        </View>

        <View style={[styles.themeBadge, { backgroundColor: getThemeColor(dream.theme).bg, borderColor: getThemeColor(dream.theme).bg, borderWidth: 1 }]}>
          <Ionicons name={THEME_TO_ICON[dream.theme] as any} size={12} color={getThemeColor(dream.theme).text} />
          <Text style={[styles.themeText, { color: getThemeColor(dream.theme).text, marginLeft: 4 }]}>
             {THEME_TO_TURKISH[dream.theme]}
          </Text>
        </View>
      </View>

      <Text style={styles.dreamTitle}>{dream.title}</Text>
      <Text style={styles.dreamDescription} numberOfLines={3}>{dream.description}</Text>

      <View style={styles.interactionBar}>
        <TouchableOpacity style={styles.interactionButton} activeOpacity={0.7} onPress={handlePress}>
          <Ionicons name="chatbubble-outline" size={20} color="#94a3b8" />
          <Text style={styles.interactionCount}>{dream.commentCount}</Text>
        </TouchableOpacity>
        
        <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#B3717A', letterSpacing: 0.5 }}>YOUR DREAM</Text>
        </View>
      </View>
    </Pressable>
  );
});

// --- DREAM SHARE FORM COMPONENT ---
// This is moved OUTSIDE of HomeScreen to prevent re-renders causing keyboard dismissal
const DreamShareForm = ({ onDreamShared, styles }: { onDreamShared: (dream: DreamResponse) => void, styles: any }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<DreamTheme | null>(null);
  const [selectedVisibility, setSelectedVisibility] = useState<'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE'>('PUBLIC');
  const [sharing, setSharing] = useState(false);

  // --- Speech Recognition State ---
  const [isListening, setIsListening] = useState(false);
  const micPulseAnim = useRef(new Animated.Value(1)).current;

  // Speech recognition event listeners
  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(micPulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(micPulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    micPulseAnim.stopAnimation();
    micPulseAnim.setValue(1);
  });

  useSpeechRecognitionEvent('result', (event: any) => {
    const transcript = event.results[0]?.transcript ?? '';
    if (transcript) {
      if (event.isFinal) {
        setDescription(prev => {
          const separator = prev.trim().length > 0 ? ' ' : '';
          return prev.trim() + separator + transcript;
        });
      } else {
        setDescription(prev => {
          const base = prev.replace(/\u200B[\s\S]*$/, '').trim();
          const separator = base.length > 0 ? ' ' : '';
          return base + separator + '\u200B' + transcript;
        });
      }
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    setIsListening(false);
    micPulseAnim.stopAnimation();
    micPulseAnim.setValue(1);
  });

  const handleToggleListening = async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      setDescription(prev => prev.replace(/\u200B/g, ''));
      return;
    }
    if (!isSpeechRecognitionAvailable || !ExpoSpeechRecognitionModule) {
      showAlert('Development build required', 'Voice input does not work in Expo Go.');
      return;
    }
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      showAlert('Permission denied', 'Microphone permission is required.');
      return;
    }
    ExpoSpeechRecognitionModule.start({ lang: 'tr-TR', interimResults: true, continuous: true });
  };

  const cycleVisibility = () => {
    const nextMap: Record<string, 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE'> = {
      'PUBLIC': 'FOLLOWERS_ONLY',
      'FOLLOWERS_ONLY': 'PRIVATE',
      'PRIVATE': 'PUBLIC'
    };
    setSelectedVisibility(nextMap[selectedVisibility]);
  };

  const handleShareDream = async () => {
    const cleanDescription = description.replace(/\u200B/g, '').trim();
    if (!title || !cleanDescription || !selectedTheme) {
      showAlert('Error', 'Please provide a title, story, and theme.');
      return;
    }
    if (isListening) ExpoSpeechRecognitionModule.stop();

    setSharing(true);
    try {
      const request: CreateDreamRequest = {
        title,
        description: cleanDescription,
        theme: selectedTheme,
        visibility: selectedVisibility,
        tagNames: []
      };
      const newDream = await createDream(request);
      setTitle('');
      setDescription('');
      setSelectedTheme(null);
      setSelectedVisibility('PUBLIC');
      onDreamShared(newDream);
    } catch (error) {
      showAlert('Error', 'Something went wrong while posting your dream.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.shareCard}>
      <View style={styles.shareInputRow}>
        <View style={styles.shareAvatarWrapper}>
           <View style={styles.shareAvatarFallback}>
             <Ionicons name="person" size={20} color="#B3717A" />
           </View>
        </View>
        
        <View style={styles.shareInputs}>
          <TextInput
            style={styles.shareTitleInput}
            placeholder="Dream Title..."
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TextInput
              style={styles.shareDescInput}
              placeholder={isListening ? "Tell your dream 🎤..." : "Write your dream here..."}
              placeholderTextColor={isListening ? "#B3717A" : "#94a3b8"}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Animated.View style={[styles.micButtonContainer, { transform: [{ scale: micPulseAnim }] }]}>
              <TouchableOpacity onPress={handleToggleListening} style={styles.micButton}>
                <Ionicons name={isListening ? 'stop' : 'mic'} size={18} color={isListening ? '#FF6B6B' : '#94a3b8'} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>

      <View style={styles.shareBottomRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsContainer}>
          {DREAM_TAGS.map(tag => {
            const isSelected = selectedTheme === tag.id;
            return (
              <TouchableOpacity
                key={tag.id}
                style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                onPress={() => setSelectedTheme(tag.id)}
              >
                <Ionicons name={THEME_TO_ICON[tag.id] as any} size={14} color={isSelected ? '#B3717A' : '#94a3b8'} />
                <Text style={[styles.tagPillText, isSelected && styles.tagPillTextSelected, { marginLeft: 6 }]}>
                  {THEME_TO_TURKISH[tag.id]}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <View style={styles.shareActionsRow}>
        <TouchableOpacity style={styles.visibilityToggle} onPress={cycleVisibility}>
           <Ionicons name={VISIBILITY_OPTIONS.find(v => v.id === selectedVisibility)?.icon as any} size={16} color="#94a3b8" />
           <Text style={styles.visibilityText}>{VISIBILITY_OPTIONS.find(v => v.id === selectedVisibility)?.label}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postButton} onPress={handleShareDream} disabled={sharing}>
          {sharing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- MAIN SCREEN ---

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [dreams, setDreams] = useState<DreamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myLatestDream, setMyLatestDream] = useState<DreamResponse | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const setUnreadDreams = useAppStore(state => state.setUnreadDreams);

  useFocusEffect(
    useCallback(() => {
      checkMyLatestDream();
      // Home ekranına odaklanıldığında rüya bildirimini temizle
      setUnreadDreams(false);
    }, [setUnreadDreams])
  );

  useEffect(() => {
    loadDreams();
    // Mevcut kullanıcıyı al (WS filtrelemesi için)
    getMyProfile().then(p => setCurrentUserId(p.id)).catch(() => {});
  }, []);

  // Gerçek zamanlı feed: /topic/dream-feed kanalına abone ol
  useEffect(() => {
    wsService.connect();
    const handler = (newDream: DreamResponse) => {
      setDreams(prev => {
        // Kendi rüyamız zaten handleDreamShared ile eklendi — tekrar ekleme
        // currentUserId null ise (henüz yüklenmedi) sadece ID duplicate kontrolü yap
        if (currentUserId && newDream.authorId === currentUserId) return prev;
        // Duplicate ID kontrolü
        if (prev.some(d => d.id === newDream.id)) return prev;
        
        // Başka birinden yeni rüya geldiğinde bidirim noktasını göster
        setUnreadDreams(true);
        
        return [newDream, ...prev]; // En üste ekle
      });
    };
    wsService.subscribe('/topic/dream-feed', handler);
    return () => wsService.unsubscribe('/topic/dream-feed');
  }, [currentUserId, setUnreadDreams]);

  const checkMyLatestDream = async () => {
    try {
      const profile = await getMyProfile();
      const myDreamsRes = await getUserDreams(profile.id, 0, 1);

      if (myDreamsRes.content.length > 0) {
        const latest = myDreamsRes.content[0];

        // Check if created TODAY
        const dDate = new Date(latest.createdAt);
        const now = new Date();
        const isToday = dDate.getDate() === now.getDate() &&
          dDate.getMonth() === now.getMonth() &&
          dDate.getFullYear() === now.getFullYear();

        if (isToday) {
          setMyLatestDream(latest);
        }
      }
    } catch (error) {
      console.log('Failed to fetch my latest dream:', error);
    }
  };

  const loadDreams = async () => {
    try {
      const response = await getPublicDreams(0, 20);
      setDreams(response.content);
    } catch (error) {
      console.error('Failed to load dreams:', error);
      showAlert('Hata', 'Rüyalar yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDreams();
    checkMyLatestDream();
  };

  const handleDreamShared = (newDream: DreamResponse) => {
    setMyLatestDream(newDream);
    if (newDream.visibility === 'PUBLIC') {
      // Duplicate guard: WebSocket'ten önce geldiyse zaten burada ekliyoruz
      setDreams(prev => {
        if (prev.some(d => d.id === newDream.id)) return prev;
        return [newDream, ...prev];
      });
    }
  };

  const handleMyDreamDeleted = (id: string) => {
    setMyLatestDream(null);
    setDreams(prev => prev.filter(d => d.id !== id));
  };

  const handleMyDreamVisibilityChanged = (updated: DreamResponse) => {
    setMyLatestDream(updated);
    // Update in public feed too if it exists there
    setDreams(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const ListHeader = () => (
      <View style={{ paddingBottom: 24, zIndex: 100, elevation: 100 }}>
        {/* HEADER */}
        <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
          {/* Spacer to center the title roughly since notification is on the right */}
          <View style={{ width: 32 }} />
          <Text style={styles.appTitleBrand}>DREAM-LINK</Text>
          <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* COMPOSER SECTION */}
        <View style={styles.composerSection}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingTitle}>Good morning{currentUserId ? '' : ''}.</Text>
            <Text style={styles.greetingSubtitle}>What did you dream last night?</Text>
          </View>
          <DreamShareForm onDreamShared={handleDreamShared} styles={styles} />
        </View>

        {/* PINNED TODAY */}
        {myLatestDream && (
          <View style={styles.pinnedSection}>
            <View style={styles.pinnedHeaderRow}>
              <View style={styles.pinnedBadge}>
                <Ionicons name="pin-outline" size={14} color="#B3717A" />
                <Text style={styles.pinnedBadgeText}>Pinned • Today</Text>
              </View>
            </View>
            <TodayDreamCard
              dream={myLatestDream}
              onDelete={handleMyDreamDeleted}
              onVisibilityChange={handleMyDreamVisibilityChanged}
            />
          </View>
        )}

        {/* COMMUNITY FEED TITLE */}
        <View style={styles.communityHeaderSection}>
          <View style={styles.sectionHeaderFlex}>
            <Text style={styles.sectionTitle}>COMMUNITY DREAMS</Text>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterText}>Filter</Text>
              <Ionicons name="options-outline" size={14} color="#B3717A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
  );

  return (
    <LinearGradient
      colors={['#e0f2fe', '#f1f5f9', '#fdf2f2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B3717A" />
        </View>
      ) : (
        <FlatList
          data={dreams}
          renderItem={({ item }) => <DreamCard dream={item} />}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          extraData={dreams}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#B3717A']} />}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { zIndex: -1, elevation: -1 }]}>
              <Ionicons name="moon-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>No dreams have been shared yet.</Text>
            </View>
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 120, // Increased to avoid floating bottom nav overlap
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  appTitleBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: '#B3717A',
    letterSpacing: 4,
    textAlign: 'center',
    flex: 1,
  },
  notificationButton: {
    // text-slate-400
  },
  greetingContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 8,
  },

  composerSection: {
    marginTop: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.20)',
  },

  pinnedSection: {
    marginTop: 18,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.22)',
  },
  pinnedHeaderRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(179, 113, 122, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 122, 0.14)',
  },
  pinnedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B3717A',
    letterSpacing: 0.3,
  },

  communityHeaderSection: {
    marginTop: 24,
  },

  // Share Card (was in DreamShareForm)
  shareCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 32,
  },
  shareInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  shareAvatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(179, 113, 122, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  shareAvatarFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareInputs: {
    flex: 1,
  },
  shareTitleInput: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  shareDescInput: {
    fontSize: 15,
    flex: 1,
    color: '#475569',
    minHeight: 40,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  shareBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.6)',
    marginTop: 16,
  },
  tagsContainer: {
    gap: 8,
    paddingRight: 20,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  tagPillSelected: {
    backgroundColor: '#fff',
    borderColor: '#B3717A',
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tagPillTextSelected: {
    color: '#B3717A',
    fontWeight: '800',
  },
  shareActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  visibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visibilityText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  postButton: {
    backgroundColor: '#B3717A',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#B3717A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  fullScreenOverlay: {
    position: 'absolute',
    // Make it huge to cover screen even with scrolling
    top: -SCREEN_HEIGHT,
    left: -50, // Extra margin
    right: -50,
    bottom: -SCREEN_HEIGHT,
    backgroundColor: 'transparent',
    zIndex: 50
  },
  shareCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D3A',
    marginBottom: 16
  },
  input: {
    backgroundColor: '#F9FAFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D2D3A',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F3FF'
  },
  textArea: {
    minHeight: 100
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    zIndex: 100, // VERY IMPORTANT for dropdown overlap
    elevation: 30
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F3FF',
    minWidth: 100
  },
  dropdownTextPlaceholder: {
    color: '#C1C8FF'
  },
  dropdownTextSelected: {
    color: '#7E6BFF',
    fontWeight: '600',
    flex: 1
  },
  dropdownContent: {
    position: 'absolute',
    top: 50, // Position relative to parent View
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F3FF',
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 50, // Ensure it's very high
    zIndex: 300
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFF'
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#2D2D3A'
  },
  shareButton: {
    backgroundColor: '#7E6BFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1 // Below dropdowns
  },
  shareButtonDisabled: {
    backgroundColor: '#C1C8FF',
    shadowOpacity: 0
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },

  // Section Headers
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
    zIndex: 1
  },
  sectionHeaderFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B3717A',
  },
  sectionDivider: {
    display: 'none',
  },

  // Dream Card
  dreamCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B3717A'
  },
  userDetails: {
    marginLeft: 12
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b'
  },
  timestamp: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dreamTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8
  },
  dreamDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 20
  },
  interactionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.5)',
    paddingTop: 16,
    alignItems: 'center',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    gap: 6
  },
  interactionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8'
  },
  interactionCountActive: {
    color: '#B3717A'
  },
  matchButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B3717A',
  },

  // Today Dream Card
  todayCardContainer: {
    marginHorizontal: 0,
    marginBottom: 24,
  },
  todayCardGradient: {
    borderRadius: 24,
    padding: 0,
    borderWidth: 1,
    borderColor: '#B3717A',
  },
  todayCardContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Glassy feel
    borderRadius: 24,
    padding: 24,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  todayBadgeContainer: {
    backgroundColor: 'rgba(179, 113, 122, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 122, 0.2)'
  },
  todayBadgeText: {
    color: '#B3717A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  todayMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  todayTimestamp: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  todayTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  todayDescription: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 20,
  },
  todayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.5)',
    paddingTop: 16,
  },
  todayThemeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },
  todayThemeText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  todayStats: {
    flexDirection: 'row',
    gap: 20
  },
  todayStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  todayStatText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 13
  },

  // Menu styles below remain untouched except for color updates if needed, left as is to avoid massive diff
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  menuHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D3A',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  menuItemDanger: {},
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(126, 107, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemIconDanger: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D3A',
  },
  menuItemTitleDanger: {
    color: '#FF6B6B',
  },
  menuItemSub: {
    fontSize: 12,
    color: '#8A8CA8',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F3FF',
    marginVertical: 4,
  },
  todayMenuButton: {
    marginLeft: 8,
    padding: 2,
  },
  menuSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A8CA8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 4,
  },
  menuItemIconActive: {
    backgroundColor: '#7E6BFF',
  },
  menuItemTitleActive: {
    color: '#7E6BFF',
    fontWeight: '700',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#7E6BFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7E6BFF',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.6
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8'
  },

  // Voice Input Styles
  micButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(179, 113, 122, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(179, 113, 122, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    gap: 10,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  listeningText: {
    flex: 1,
    fontSize: 13,
    color: '#B3717A',
    fontWeight: '600',
  },
});