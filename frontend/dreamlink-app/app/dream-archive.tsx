import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import {
  deleteDream,
  formatRelativeTime,
  getMyProfile,
  getUserDreams,
  toggleLike,
  updateDreamVisibility,
  type DreamResponse,
  type DreamTheme,
} from '../services/api';

const QS_BOLD = 'Quicksand_700Bold';
const QS_MEDIUM = 'Quicksand_500Medium';
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const C = {
  primary: '#A63F4F',
  roseLt: '#F8EDEF',
  roseMd: '#D697A2',
  roseDk: '#7D2D3A',
  bg: '#FFFFFF',
  surface: '#FAFAFA',
  textMain: '#1C1714',
  textMuted: '#475569',
  textLight: '#94A3B8',
  border: '#F1F5F9',
};

type QuickFilter = 'all' | 'newest' | 'oldest' | 'starred';

const QUICK_FILTERS: { key: QuickFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'albums-outline' },
  { key: 'newest', label: 'Newest', icon: 'time-outline' },
  { key: 'oldest', label: 'Oldest', icon: 'calendar-outline' },
  { key: 'starred', label: 'Starred', icon: 'star-outline' },
];

const THEMES: DreamTheme[] = ['HAPPY', 'SAD', 'NIGHTMARE', 'LOVE', 'LUCID', 'ANGRY', 'EXCITED', 'CURIOUS'];

const THEME_STYLES: Record<DreamTheme, { bg: string; text: string; icon: string; label: string }> = {
  HAPPY: { bg: '#FFF7DD', text: '#B45309', icon: 'sunny-outline', label: 'Happy' },
  SAD: { bg: '#EAF4FF', text: '#2563EB', icon: 'rainy-outline', label: 'Sad' },
  NIGHTMARE: { bg: '#F3F4F6', text: '#1C1714', icon: 'moon-outline', label: 'Nightmare' },
  LOVE: { bg: '#FFE7EC', text: '#E11D48', icon: 'heart-outline', label: 'Love' },
  LUCID: { bg: '#F8EDEF', text: '#A63F4F', icon: 'sparkles-outline', label: 'Lucid' },
  ANGRY: { bg: '#FEE2E2', text: '#991B1B', icon: 'flame-outline', label: 'Angry' },
  EXCITED: { bg: '#F3E8FF', text: '#7C3AED', icon: 'flash-outline', label: 'Excited' },
  CURIOUS: { bg: '#E8F8F3', text: '#0F766E', icon: 'planet-outline', label: 'Curious' },
};

const formatArchiveDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { day: '--', month: '---', year: '' };
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    year: String(d.getFullYear()),
  };
};

const getReadingMinutes = (text?: string) => Math.max(1, Math.ceil((text || '').length / 280));

const getDreamFeelings = (dreamTheme: DreamTheme, title: string, desc: string): string[] => {
  const primaryFeeling = THEME_STYLES[dreamTheme]?.label || 'Curious';
  const feelings = [primaryFeeling];

  const relationMap: Record<DreamTheme, string[]> = {
    HAPPY: ['Joyful', 'Peaceful'],
    SAD: ['Melancholy', 'Gloom'],
    NIGHTMARE: ['Fearful', 'Anxious'],
    LOVE: ['Affectionate', 'Warm'],
    LUCID: ['Vivid', 'Insightful'],
    ANGRY: ['Frustrated', 'Tense'],
    EXCITED: ['Thrilled', 'Energetic'],
    CURIOUS: ['Mysterious', 'Wondering'],
  };

  const related = relationMap[dreamTheme] || [];
  // Use a deterministic seed based on title + description length to select 0 to 2 related feelings
  const seed = ((title + desc).length) % 3; // returns 0, 1, or 2

  for (let i = 0; i < seed && i < related.length; i++) {
    feelings.push(related[i]);
  }

  return feelings.slice(0, 3);
};

const ArchiveCard = React.memo(({
  dream,
  onMenuPress,
}: {
  dream: DreamResponse;
  onMenuPress: (dream: DreamResponse) => void;
}) => {
  const date = formatArchiveDate(dream.createdAt);
  const theme = THEME_STYLES[dream.theme] ?? THEME_STYLES.CURIOUS;
  const feelings = getDreamFeelings(dream.theme, dream.title || '', dream.description || '');

  return (
    <Pressable
      onPress={() => router.push(`/dream/${dream.id}`)}
      style={({ pressed }) => [cardStyles.card, pressed && cardStyles.cardPressed]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyles.cardGradient}
      >
        <View style={cardStyles.headerRow}>
          <View style={cardStyles.dateBlock}>
            <Text style={cardStyles.dateMonth}>{date.month}</Text>
            <Text style={cardStyles.dateDay}>{date.day}</Text>
            <Text style={cardStyles.dateYear}>{date.year}</Text>
          </View>

          <View style={cardStyles.titleWrap}>
            <Text style={cardStyles.title} numberOfLines={2}>{dream.title || 'Untitled dream'}</Text>
          </View>

          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => onMenuPress(dream)}
            activeOpacity={0.7}
            style={cardStyles.menuBtn}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={C.textMain} />
          </TouchableOpacity>
        </View>

        <Text style={cardStyles.desc} numberOfLines={3}>
          {dream.description || 'No description added yet.'}
        </Text>

        {dream.tags?.length > 0 && (
          <View style={cardStyles.tagRow}>
            {dream.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={cardStyles.tag}>
                <Text style={cardStyles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={cardStyles.footer}>
          <View style={cardStyles.feelingRow}>
            {feelings.map((feeling) => (
              <View key={feeling} style={cardStyles.feelingPill}>
                <Text style={cardStyles.feelingText}>{feeling}</Text>
              </View>
            ))}
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={cardStyles.footerArrow} />
        </View>
      </LinearGradient>
    </Pressable>
  );
});
ArchiveCard.displayName = 'ArchiveCard';

const EmptyState = ({ filtered }: { filtered: boolean }) => (
  <View style={emptyStyles.wrap}>
    <View style={emptyStyles.iconWrap}>
      <Ionicons name={filtered ? 'search-outline' : 'moon-outline'} size={25} color={C.primary} />
    </View>
    <Text style={emptyStyles.title}>{filtered ? 'No dreams found' : 'Your archive is waiting'}</Text>
    <Text style={emptyStyles.text}>
      {filtered ? 'Try another search term or clear your filters.' : 'Save dreams to build a private, searchable record of your inner world.'}
    </Text>
  </View>
);


const ArchiveActionSheet = ({
  dream,
  visible,
  onClose,
  onDelete,
  onToggleStar,
  onUpdateVisibility,
}: {
  dream: DreamResponse | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onToggleStar: (id: string) => Promise<void>;
  onUpdateVisibility: (id: string, visibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE') => Promise<void>;
}) => {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const visibleRef = useRef(false);

  const [localDream, setLocalDream] = useState<DreamResponse | null>(null);
  const [currentView, setCurrentView] = useState<'MAIN' | 'VISIBILITY' | 'DELETE' | 'MESSAGE'>('MAIN');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (dream) {
      setLocalDream(dream);
      setCurrentView('MAIN');
      setMessage('');
      setIsSubmitting(false);
    }
  }, [dream]);

  useEffect(() => {
    visibleRef.current = visible;
    if (visible) {
      const timer = setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 80);
      return () => clearTimeout(timer);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  useEffect(() => {
    const onBackPress = () => {
      if (visible) {
        if (currentView !== 'MAIN') {
          setCurrentView('MAIN');
        } else {
          onClose();
        }
        return true;
      }
      return false;
    };

    let backHandler: any;
    if (visible) {
      backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    }

    return () => {
      if (backHandler) {
        backHandler.remove();
      }
    };
  }, [visible, currentView, onClose]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1 && visibleRef.current) {
      onClose();
    }
  }, [onClose]);

  const handleStarAction = async () => {
    if (!localDream || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onToggleStar(localDream.id);
      setLocalDream(prev => prev ? { ...prev, isLiked: !prev.isLiked } : null);
      setMessage(!localDream.isLiked ? 'Added to starred dreams' : 'Removed from starred dreams');
      setCurrentView('MESSAGE');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setMessage('Failed to update star status');
      setCurrentView('MESSAGE');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVisibilityAction = async (vis: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE') => {
    if (!localDream || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onUpdateVisibility(localDream.id, vis);
      setLocalDream(prev => prev ? { ...prev, visibility: vis } : null);
      setMessage(`Visibility updated to ${vis.replace('_', ' ').toLowerCase()}`);
      setCurrentView('MESSAGE');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setMessage('Failed to update visibility');
      setCurrentView('MESSAGE');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAction = async () => {
    if (!localDream || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onDelete(localDream.id);
      setMessage('Dream deleted successfully');
      setCurrentView('MESSAGE');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setMessage('Failed to delete dream');
      setCurrentView('MESSAGE');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const activeDream = dream || localDream;

  const getVisibilityConfig = (vis?: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE') => {
    switch (vis) {
      case 'PUBLIC': return { label: 'Public', icon: 'earth-outline' };
      case 'FOLLOWERS_ONLY': return { label: 'Followers Only', icon: 'people-outline' };
      case 'PRIVATE': return { label: 'Private', icon: 'lock-closed-outline' };
      default: return { label: 'Public', icon: 'earth-outline' };
    }
  };

  const visConfig = getVisibilityConfig(activeDream?.visibility);



  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents={visible ? 'box-none' : 'none'} collapsable={false}>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        enableDynamicSizing={true}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#FFFFFF', borderRadius: 28 }}
        handleIndicatorStyle={{ backgroundColor: '#E2E8F0', width: 40 }}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16, paddingHorizontal: 24, paddingTop: 12 }}>
          {!activeDream ? (
            <View style={confirmStyles.center}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : isSubmitting ? (
            <View style={confirmStyles.center}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : currentView === 'MESSAGE' ? (
            <View style={confirmStyles.center}>
              <Ionicons name="checkmark-circle-outline" size={36} color={C.primary} />
              <Text style={confirmStyles.msgText}>{message}</Text>
            </View>
          ) : currentView === 'DELETE' ? (
            <View>
              <View style={confirmStyles.header}>
                <TouchableOpacity onPress={() => setCurrentView('MAIN')}>
                  <Ionicons name="chevron-back" size={20} color={C.textMain} />
                </TouchableOpacity>
                <Text style={sheetStyles.sheetTitle}>Delete Dream</Text>
                <View style={{ width: 20 }} />
              </View>
              <Text style={confirmStyles.warningText}>Are you sure you want to delete this dream? This action is permanent.</Text>
              <View style={confirmStyles.btnRow}>
                <TouchableOpacity style={confirmStyles.cancelBtn} onPress={() => setCurrentView('MAIN')}>
                  <Text style={confirmStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={confirmStyles.deleteBtn} onPress={handleDeleteAction}>
                  <Text style={confirmStyles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : currentView === 'VISIBILITY' ? (
            <View>
              <View style={confirmStyles.header}>
                <TouchableOpacity style={confirmStyles.backBtn} onPress={() => setCurrentView('MAIN')}>
                  <Ionicons name="chevron-back" size={20} color={C.textMain} />
                </TouchableOpacity>
                <Text style={sheetStyles.sheetTitle}>Change Visibility</Text>
              </View>

              <TouchableOpacity style={sheetStyles.actionRow} onPress={() => handleVisibilityAction('PUBLIC')}>
                <View style={sheetStyles.actionIcon}>
                  <Ionicons name="earth-outline" size={18} color={C.textMain} />
                </View>
                <Text style={sheetStyles.actionText}>Public (Anyone can see)</Text>
                {activeDream.visibility === 'PUBLIC' && <Ionicons name="checkmark" size={16} color={C.primary} />}
              </TouchableOpacity>

              <TouchableOpacity style={[sheetStyles.actionRow, { borderBottomWidth: 0 }]} onPress={() => handleVisibilityAction('PRIVATE')}>
                <View style={sheetStyles.actionIcon}>
                  <Ionicons name="lock-closed-outline" size={18} color={C.textMain} />
                </View>
                <Text style={sheetStyles.actionText}>Private (Only you)</Text>
                {activeDream.visibility === 'PRIVATE' && <Ionicons name="checkmark" size={16} color={C.primary} />}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={sheetStyles.sheetTitle} numberOfLines={1}>{activeDream.title || 'Dream options'}</Text>

              <TouchableOpacity
                style={sheetStyles.actionRow}
                activeOpacity={0.76}
                onPress={() => {
                  onClose();
                  router.push(`/dream/${activeDream.id}`);
                }}
              >
                <View style={sheetStyles.actionIcon}>
                  <Ionicons name="open-outline" size={18} color={C.primary} />
                </View>
                <Text style={sheetStyles.actionText}>Open dream</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={sheetStyles.actionRow}
                activeOpacity={0.76}
                onPress={handleStarAction}
              >
                <View style={sheetStyles.actionIcon}>
                  <Ionicons name={activeDream.isLiked ? 'star' : 'star-outline'} size={18} color="#E07A5F" />
                </View>
                <Text style={sheetStyles.actionText}>{activeDream.isLiked ? 'Starred (Remove star)' : 'Add to Starred'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={sheetStyles.actionRow}
                activeOpacity={0.76}
                onPress={() => setCurrentView('VISIBILITY')}
              >
                <View style={sheetStyles.actionIcon}>
                  <Ionicons name={visConfig.icon as any} size={18} color={C.textMain} />
                </View>
                <Text style={sheetStyles.actionText}>Change Visibility</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[sheetStyles.actionRow, sheetStyles.dangerRow]}
                activeOpacity={0.76}
                onPress={() => setCurrentView('DELETE')}
              >
                <View style={[sheetStyles.actionIcon, sheetStyles.dangerIcon]}>
                  <Ionicons name="trash-outline" size={18} color="#D14343" />
                </View>
                <Text style={[sheetStyles.actionText, sheetStyles.dangerText]}>Delete dream</Text>
              </TouchableOpacity>
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};



export default function DreamArchiveScreen() {
  const insets = useSafeAreaInsets();
  const [dreams, setDreams] = useState<DreamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('all');
  const [menuDream, setMenuDream] = useState<DreamResponse | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const profile = await getMyProfile();
      const page = await getUserDreams(profile.id, 0, 80);
      setDreams(page.content ?? []);
    } catch {
      Alert.alert('Archive error', 'Dream archive could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredDreams = useMemo(() => {
    let list = [...dreams];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((dream) =>
        dream.title?.toLowerCase().includes(q) ||
        dream.description?.toLowerCase().includes(q) ||
        dream.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (activeFilter === 'starred') {
      list = list.filter((dream) => dream.isLiked);
    }

    if (activeFilter === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [dreams, query, activeFilter]);

  const archiveStats = useMemo(() => {
    const themeCount = new Set(dreams.map((dream) => dream.theme).filter(Boolean)).size;
    const lucidCount = dreams.filter((dream) => dream.theme === 'LUCID').length;
    return { total: dreams.length, themeCount, lucidCount };
  }, [dreams]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteDream(id);
    setDreams((prev) => prev.filter((dream) => dream.id !== id));
  }, []);

  const handleToggleStar = useCallback(async (id: string) => {
    await toggleLike(id);
    setDreams((prev) =>
      prev.map((dream) =>
        dream.id === id ? { ...dream, isLiked: !dream.isLiked } : dream
      )
    );
  }, []);

  const handleUpdateVisibility = useCallback(async (id: string, visibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE') => {
    await updateDreamVisibility(id, visibility);
    setDreams((prev) =>
      prev.map((dream) =>
        dream.id === id ? { ...dream, visibility } : dream
      )
    );
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  const hasFilters = query.trim().length > 0 || activeFilter !== 'all';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={filteredDreams}
        keyExtractor={(dream) => dream.id}
        renderItem={({ item }) => (
          <ArchiveCard dream={item} onMenuPress={setMenuDream} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 },
          filteredDreams.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.primary} />}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.75} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={23} color={C.textMain} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Dream Archive</Text>
                <Text style={styles.headerSub}>{archiveStats.total} dream{archiveStats.total !== 1 ? 's' : ''} in your archive</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>


            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={17} color={C.textLight} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search title or text"
                placeholderTextColor={C.textLight}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.75}>
                  <Ionicons name="close-circle" size={17} color={C.textLight} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {QUICK_FILTERS.map((filter) => {
                const active = activeFilter === filter.key;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    activeOpacity={0.78}
                    onPress={() => setActiveFilter(filter.key)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Ionicons name={filter.icon as any} size={13} color={active ? '#FFFFFF' : C.textMuted} />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{filter.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

          </View>
        }
        ListEmptyComponent={<EmptyState filtered={hasFilters} />}
      />

      <ArchiveActionSheet
        visible={!!menuDream}
        dream={menuDream}
        onClose={() => setMenuDream(null)}
        onDelete={handleDelete}
        onToggleStar={handleToggleStar}
        onUpdateVisibility={handleUpdateVisibility}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: QS_MEDIUM, fontSize: 13, color: C.textMuted },
  listContent: { paddingHorizontal: 16 },
  emptyListContent: { flexGrow: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontFamily: QS_BOLD, fontSize: 19, fontWeight: '800', color: C.textMain, letterSpacing: 0 },
  headerSub: { fontFamily: QS_MEDIUM, fontSize: 11, color: C.textLight, marginTop: 2 },
  filterBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: QS_MEDIUM, fontSize: 13, color: C.textMain, paddingVertical: 0 },
  chipRow: { gap: 8, paddingBottom: 18 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontFamily: QS_BOLD, fontSize: 11, fontWeight: '800', color: C.textMuted },
  chipTextActive: { color: '#FFFFFF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 2 },
  sectionLabel: { fontFamily: QS_BOLD, fontSize: 9, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  sectionTitle: { fontFamily: QS_BOLD, fontSize: 16, fontWeight: '800', color: C.textMain, marginTop: 4 },
});

const cardStyles = StyleSheet.create({
  card: { marginBottom: 14, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardPressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  cardGradient: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBlock: { width: 58, height: 70, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)' },
  dateMonth: { fontFamily: QS_BOLD, fontSize: 9, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  dateDay: { fontFamily: SERIF, fontSize: 25, fontWeight: '800', color: C.textMain, lineHeight: 29 },
  dateYear: { fontFamily: QS_MEDIUM, fontSize: 9, color: C.textLight, letterSpacing: 0.6 },
  titleWrap: { flex: 1, minWidth: 0 },
  themePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, marginBottom: 8 },
  themeText: { fontFamily: QS_BOLD, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontFamily: SERIF, fontSize: 16.5, color: C.textMain, lineHeight: 24, fontStyle: 'italic' },
  menuBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  desc: { fontFamily: SERIF, fontSize: 13, color: C.textMuted, lineHeight: 22, marginTop: 14 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 },
  tag: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: C.roseLt },
  tagText: { fontFamily: QS_BOLD, fontSize: 10, fontWeight: '800', color: C.primary },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 16, paddingTop: 13, borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.12)' },
  feelingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  feelingPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#FDF4F5', borderWidth: 1, borderColor: 'rgba(166, 63, 79, 0.10)' },
  feelingText: { fontFamily: QS_BOLD, fontSize: 10, fontWeight: '800', color: C.primary, letterSpacing: 0.3 },
  footerArrow: { marginLeft: 'auto' },
});

const emptyStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingTop: 40 },
  iconWrap: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: C.roseLt, marginBottom: 16 },
  title: { fontFamily: QS_BOLD, fontSize: 17, fontWeight: '800', color: C.textMain, marginBottom: 7, textAlign: 'center' },
  text: { fontFamily: QS_MEDIUM, fontSize: 12, color: C.textMuted, lineHeight: 18, textAlign: 'center' },
});

const sheetStyles = StyleSheet.create({
  sheetTitle: { fontFamily: SERIF, fontSize: 16, fontStyle: 'italic', color: C.textMain, textAlign: 'center', marginBottom: 14 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  actionIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, fontFamily: QS_BOLD, fontSize: 14, fontWeight: '800', color: C.textMain },
  dangerRow: { borderBottomWidth: 0 },
  dangerIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  dangerText: { color: '#D14343' },
});

const confirmStyles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 12 },
  msgText: { fontFamily: QS_BOLD, fontSize: 14, color: C.textMain, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 14 },
  backBtn: { position: 'absolute', left: 0, padding: 4 },
  warningText: { fontFamily: QS_MEDIUM, fontSize: 13, color: C.textMuted, textAlign: 'center', marginVertical: 18, lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginTop: 12 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: QS_BOLD, fontSize: 14, color: C.textMain },
  deleteBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#D14343', alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontFamily: QS_BOLD, fontSize: 14, color: '#FFFFFF' },
});
