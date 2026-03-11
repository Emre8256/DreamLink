import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
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
  Animated
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
      { text: 'İptal', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

// --- CONSTANTS ---
const DREAM_TAGS: { id: DreamTheme; label: string; emoji: string }[] = [
  { id: 'HAPPY', label: 'Mutlu', emoji: '😊' },
  { id: 'SAD', label: 'Üzgün', emoji: '😢' },
  { id: 'NIGHTMARE', label: 'Kabus', emoji: '👻' },
  { id: 'LOVE', label: 'Aşk', emoji: '❤️' },
  { id: 'LUCID', label: 'Lüsid', emoji: '✨' },
  { id: 'ANGRY', label: 'Kızgın', emoji: '😠' },
  { id: 'EXCITED', label: 'Heyecanlı', emoji: '🎉' },
  { id: 'CURIOUS', label: 'Meraklı', emoji: '🤔' },
];

const VISIBILITY_OPTIONS = [
  { id: 'PUBLIC', label: 'Herkese Açık', icon: 'globe-outline' },
  { id: 'FOLLOWERS_ONLY', label: 'Sadece Takipçiler', icon: 'people-outline' },
  { id: 'PRIVATE', label: 'Sadece Ben', icon: 'lock-closed-outline' },
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
          {dream.avatarUrl ? (
            <Image source={{ uri: dream.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{dream.nickname.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.userDetails}>
            <Text style={styles.username}>{dream.nickname}</Text>
            <View style={styles.metaContainer}>
              <Text style={styles.timestamp}>{formatRelativeTime(dream.createdAt)}</Text>
              <View style={styles.dotSeparator} />
              <View style={styles.visibilityBadge}>
                <Ionicons
                  name={dream.visibility === 'PUBLIC' ? 'globe-outline' : dream.visibility === 'PRIVATE' ? 'lock-closed-outline' : 'people-outline'}
                  size={10}
                  color="#8A8CA8"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.themeBadge}>
          <Ionicons name={THEME_TO_ICON[dream.theme] as any} size={14} color="#7E6BFF" />
          <Text style={styles.themeText}>{THEME_TO_TURKISH[dream.theme]}</Text>
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
            size={22}
            color={isLiked ? "#FF6B6B" : "#8A8CA8"}
          />
          <Text style={[
            styles.interactionCount,
            isLiked && styles.interactionCountActive
          ]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.interactionButton} activeOpacity={0.7} onPress={handlePress}>
          <Ionicons name="chatbubble-outline" size={20} color="#8A8CA8" />
          <Text style={styles.interactionCount}>{dream.commentCount}</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
});

// --- TODAY DREAM CARD COMPONENT ---
const VISIBILITY_CYCLE: Array<'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE'> = ['PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE'];
const VISIBILITY_LABEL: Record<string, string> = {
  PUBLIC: '🌍 Herkese Açık',
  FOLLOWERS_ONLY: '👥 Takipçilerim',
  PRIVATE: '🔒 Gizli',
};
const VISIBILITY_NEXT_LABEL: Record<string, string> = {
  PUBLIC: 'Takipçilerim yap',
  FOLLOWERS_ONLY: 'Gizli yap',
  PRIVATE: 'Herkese Açık yap',
};

const TodayDreamCard = React.memo(({ dream, onDelete, onVisibilityChange }: {
  dream: DreamResponse;
  onDelete: (id: string) => void;
  onVisibilityChange: (updated: DreamResponse) => void;
}) => {
  const router = useRouter();
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  const handlePress = () => {
    router.push(`/dream/${dream.id}`);
  };

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDelete = () => {
    setMenuVisible(false);
    showConfirm('Rüyayı Sil', 'Bu rüyayı silmek istediğine emin misin?', async () => {
      try {
        setActionLoading(true);
        await deleteDream(dream.id);
        onDelete(dream.id);
      } catch (e) {
        showAlert('Hata', 'Rüya silinemedi.');
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleVisibilityChange = async (newVisibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE') => {
    if (newVisibility === dream.visibility) return; // already selected
    try {
      setActionLoading(true);
      const updated = await updateDreamVisibility(dream.id, newVisibility);
      onVisibilityChange(updated);
    } catch (e) {
      showAlert('Hata', 'Görünürlük güncellenemedi.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.todayCardContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      {/* Action Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuSheet}>
                <View style={styles.menuHandle} />
                <Text style={styles.menuTitle}>Rüya Seçenekleri</Text>

                {/* Visibility section */}
                <Text style={styles.menuSectionLabel}>Görünürlük</Text>
                {([
                  { value: 'PUBLIC', icon: 'globe-outline', label: 'Herkese Açık', sub: 'Herkes görebilir' },
                  { value: 'FOLLOWERS_ONLY', icon: 'people-outline', label: 'Takipçilerim', sub: 'Sadece takipçilerin görebilir' },
                  { value: 'PRIVATE', icon: 'lock-closed-outline', label: 'Gizli', sub: 'Sadece sen görebilirsin' },
                ] as const).map((opt) => {
                  const isSelected = dream.visibility === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={styles.menuItem}
                      onPress={() => handleVisibilityChange(opt.value)}
                    >
                      <View style={[styles.menuItemIcon, isSelected && styles.menuItemIconActive]}>
                        <Ionicons name={opt.icon as any} size={20} color={isSelected ? '#fff' : '#7E6BFF'} />
                      </View>
                      <View style={styles.menuItemText}>
                        <Text style={[styles.menuItemTitle, isSelected && styles.menuItemTitleActive]}>{opt.label}</Text>
                        <Text style={styles.menuItemSub}>{opt.sub}</Text>
                      </View>
                      {/* Radio indicator */}
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <View style={styles.menuDivider} />

                <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleDelete}>
                  <View style={[styles.menuItemIcon, styles.menuItemIconDanger]}>
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={[styles.menuItemTitle, styles.menuItemTitleDanger]}>Rüyayı Sil</Text>
                    <Text style={styles.menuItemSub}>Bu işlem geri alınamaz</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Pressable onPress={handlePress}>
        <LinearGradient
          colors={['#E0C3FC', '#8EC5FC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.todayCardGradient}
        >
          <View style={styles.todayCardContent}>
            <View style={styles.todayHeader}>
              <View style={styles.todayBadgeContainer}>
                <Text style={styles.todayBadgeText}>SENİN RÜYAN</Text>
              </View>
              <View style={styles.todayMeta}>
                <Text style={styles.todayTimestamp}>{formatRelativeTime(dream.createdAt)}</Text>
                <Ionicons
                  name={dream.visibility === 'PUBLIC' ? 'globe-outline' : dream.visibility === 'PRIVATE' ? 'lock-closed-outline' : 'people-outline'}
                  size={12}
                  color="#fff"
                  style={{ marginLeft: 4 }}
                />
                {/* 3-dot menu button */}
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); setMenuVisible(true); }}
                  style={styles.todayMenuButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {actionLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
                  }
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.todayTitle}>{dream.title}</Text>
            <Text style={styles.todayDescription} numberOfLines={3}>{dream.description}</Text>

            <View style={styles.todayFooter}>
              <View style={styles.todayThemeBadge}>
                <Ionicons name={THEME_TO_ICON[dream.theme] as any} size={14} color="#fff" />
                <Text style={styles.todayThemeText}>{THEME_TO_TURKISH[dream.theme]}</Text>
              </View>
              <View style={styles.todayStats}>
                <View style={styles.todayStatItem}>
                  <Ionicons name="heart" size={16} color="#fff" />
                  <Text style={styles.todayStatText}>{dream.likeCount}</Text>
                </View>
                <View style={styles.todayStatItem}>
                  <Ionicons name="chatbubble" size={16} color="#fff" />
                  <Text style={styles.todayStatText}>{dream.commentCount}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
});

// --- DREAM SHARE FORM COMPONENT ---
// This is moved OUTSIDE of HomeScreen to prevent re-renders causing keyboard dismissal
const DreamShareForm = ({ onDreamShared, styles }: { onDreamShared: (dream: DreamResponse) => void, styles: any }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<DreamTheme | null>(null);
  const [selectedVisibility, setSelectedVisibility] = useState<'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE'>('PUBLIC');
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Close dropdowns helper
  const closeDropdowns = () => {
    setIsThemeDropdownOpen(false);
    setIsVisibilityDropdownOpen(false);
    Keyboard.dismiss();
  };

  const handleShareDream = async () => {
    if (!title || !description || !selectedTheme) {
      showAlert('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setSharing(true);
    try {
      const request: CreateDreamRequest = {
        title,
        description,
        theme: selectedTheme,
        visibility: selectedVisibility,
        tagNames: []
      };

      const newDream = await createDream(request);

      // Clean form
      setTitle('');
      setDescription('');
      setSelectedTheme(null);
      setSelectedVisibility('PUBLIC');
      closeDropdowns();

      onDreamShared(newDream);
      showAlert('Başarılı', 'Rüyan paylaşıldı!');

    } catch (error) {
      console.error('Share error:', error);
      showAlert('Hata', 'Rüya paylaşılırken bir sorun oluştu.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={[styles.shareCard, { zIndex: 100, elevation: 20 }]}>
      {/* OVERLAY FOR CLOSING DROPDOWNS */}
      {(isThemeDropdownOpen || isVisibilityDropdownOpen) && (
        <TouchableWithoutFeedback onPress={closeDropdowns}>
          <View style={styles.fullScreenOverlay} />
        </TouchableWithoutFeedback>
      )}

      <Text style={styles.shareCardTitle}>Rüyanı Paylaş</Text>

      <TextInput
        style={styles.input}
        placeholder="Rüya Başlığı"
        placeholderTextColor="#C1C8FF"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Rüyanı detaylıca anlat..."
        placeholderTextColor="#C1C8FF"
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />

      <View style={[styles.dropdownRow, { zIndex: 200, elevation: 30 }]}>
        {/* Theme Dropdown */}
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              if (isThemeDropdownOpen) {
                setIsThemeDropdownOpen(false);
              } else {
                setIsThemeDropdownOpen(true);
                setIsVisibilityDropdownOpen(false);
                Keyboard.dismiss();
              }
            }}
          >
            <Text style={selectedTheme ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
              {selectedTheme ? DREAM_TAGS.find(t => t.id === selectedTheme)?.label : 'Tema Seç'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#7E6BFF" />
          </TouchableOpacity>

          {/* Theme Dropdown Content */}
          {isThemeDropdownOpen && (
            <View style={[styles.dropdownContent, { zIndex: 300, elevation: 40 }]}>
              {DREAM_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedTheme(tag.id);
                    setIsThemeDropdownOpen(false);
                  }}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>{tag.emoji}</Text>
                  <Text style={styles.dropdownItemText}>{tag.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Visibility Dropdown */}
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              if (isVisibilityDropdownOpen) {
                setIsVisibilityDropdownOpen(false);
              } else {
                setIsVisibilityDropdownOpen(true);
                setIsThemeDropdownOpen(false);
                Keyboard.dismiss();
              }
            }}
          >
            <Ionicons name={VISIBILITY_OPTIONS.find(v => v.id === selectedVisibility)?.icon as any} size={16} color="#7E6BFF" style={{ marginRight: 6 }} />
            <Text style={styles.dropdownTextSelected}>
              {VISIBILITY_OPTIONS.find(v => v.id === selectedVisibility)?.label}
            </Text>
          </TouchableOpacity>

          {/* Visibility Dropdown Content */}
          {isVisibilityDropdownOpen && (
            <View style={[styles.dropdownContent, { zIndex: 300, elevation: 40 }]}>
              {VISIBILITY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedVisibility(opt.id as any);
                    setIsVisibilityDropdownOpen(false);
                  }}
                >
                  <Ionicons name={opt.icon as any} size={18} color="#7E6BFF" style={{ marginRight: 8 }} />
                  <Text style={styles.dropdownItemText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
        onPress={handleShareDream}
        disabled={sharing}
      >
        {sharing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.shareButtonText}>Paylaş</Text>
            <Ionicons name="send" size={16} color="#fff" />
          </>
        )}
      </TouchableOpacity>
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

  useFocusEffect(
    useCallback(() => {
      checkMyLatestDream();
    }, [])
  );

  useEffect(() => {
    loadDreams();
  }, []);

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
      setDreams(prev => [newDream, ...prev]);
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
          <View style={styles.appTitleContainer}>
            <View style={styles.logoIconContainer}>
              <MaterialCommunityIcons name="moon-waning-crescent" size={24} color="#7E6BFF" />
            </View>
            <Text style={styles.appTitleDark}>Dream</Text>
            <Text style={styles.appTitleBrand}>Link</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#7E6BFF" />
          </TouchableOpacity>
        </View>

        {/* SHARE FORM */}
        <DreamShareForm onDreamShared={handleDreamShared} styles={styles} />

        {/* MY LATEST DREAM */}
        {myLatestDream && (
          <View style={styles.sectionContainer}>
            <Text style={styles.todaySectionTitle}>🌙 Bugünkü Rüyam</Text>
            <TodayDreamCard
              dream={myLatestDream}
              onDelete={handleMyDreamDeleted}
              onVisibilityChange={handleMyDreamVisibilityChanged}
            />
            <View style={styles.sectionDivider} />
          </View>
        )}

        {/* COMMUNITY FEED TITLE */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🌍 Topluluk Rüyaları</Text>
        </View>
      </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7E6BFF" />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#7E6BFF']} />}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { zIndex: -1, elevation: -1 }]}>
              <Ionicons name="moon-outline" size={48} color="#C1C8FF" />
              <Text style={styles.emptyText}>Henüz paylaşılan rüya yok.</Text>
            </View>
          }
        />
      )}
    </View>
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
    paddingBottom: 40
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  appTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconContainer: {
    marginRight: 8,
  },
  appTitleDark: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D2D3A',
  },
  appTitleBrand: {
    fontSize: 24,
    fontWeight: '800',
    color: '#7E6BFF',
  },
  notificationButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Share Card
  shareCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 24,
    zIndex: 10,
    position: 'relative' // Needed for absolute overlay and zIndex
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
    marginBottom: 16,
    zIndex: 1
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D3A'
  },
  todaySectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D3A',
    marginBottom: 12
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
    opacity: 0.5
  },

  // Today Dream Card
  todayCardContainer: {
    marginHorizontal: 0,
    marginBottom: 8,
    borderRadius: 24,
    shadowColor: '#8EC5FC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  todayCardGradient: {
    borderRadius: 24,
    padding: 2.5, // Border width effect
  },
  todayCardContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glassy feel
    borderRadius: 22,
    padding: 20,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  todayBadgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)'
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },
  todayMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  todayTimestamp: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  todayTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  todayDescription: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 16,
    opacity: 0.95
  },
  todayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  todayThemeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6
  },
  todayThemeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  todayStats: {
    flexDirection: 'row',
    gap: 16
  },
  todayStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  todayStatText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  },

  // Today Card Menu
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

  // Dream Card
  dreamCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F9FAFF',
    zIndex: 1
  },
  dreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F3FF'
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7E6BFF'
  },
  userDetails: {
    marginLeft: 12
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D3A'
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  timestamp: {
    fontSize: 12,
    color: '#8A8CA8'
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 6
  },
  visibilityBadge: {

  },
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(126, 107, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  themeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7E6BFF'
  },
  dreamTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D3A',
    marginBottom: 8
  },
  dreamDescription: {
    fontSize: 15,
    color: '#5E5E72',
    lineHeight: 22,
    marginBottom: 16
  },
  interactionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F9FAFF',
    paddingTop: 12
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    gap: 6
  },
  interactionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A8CA8'
  },
  interactionCountActive: {
    color: '#FF6B6B'
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    opacity: 0.5
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#8A8CA8'
  }
});