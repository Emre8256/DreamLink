import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    Keyboard,
    Alert,
    Platform,
    Modal,
    Pressable,
} from 'react-native';
import Animated, {
    useAnimatedKeyboard,
    useAnimatedStyle,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
    getDreamById,
    getComments,
    addComment,
    toggleLike,
    interpretDream,
    submitReport,
    DreamInterpretationResponse,
    DreamInterpretPersona,
    DreamResponse,
    CommentResponse,
    formatRelativeTime,
    THEME_TO_ICON,
    THEME_TO_TURKISH,
} from '../../services/api';

const PRIMARY = '#B3717A';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};

const VISIBILITY_ICON: Record<string, string> = {
    PUBLIC: 'globe-outline',
    FOLLOWERS_ONLY: 'people-outline',
    PRIVATE: 'lock-closed-outline',
};

const ZODIAC_SIGNS = [
    'Koc',
    'Boga',
    'Ikizler',
    'Yengec',
    'Aslan',
    'Basak',
    'Terazi',
    'Akrep',
    'Yay',
    'Oglak',
    'Kova',
    'Balik',
];

const PERSONAS: { key: DreamInterpretPersona; label: string; subtitle: string }[] = [
    { key: 'FREUD', label: 'Sigmund Freud', subtitle: 'Psikanalitik, id-ego catismasi' },
    { key: 'JUNG', label: 'Carl Jung', subtitle: 'Arketipler, golge, kolektif bilincalti' },
    { key: 'ASTROLOG', label: 'Astrolog', subtitle: 'Burc + transit + kozmik semboller' },
];

const PERSONA_THEME: Record<DreamInterpretPersona, { card: string; text: string; accent: string }> = {
    FREUD: { card: '#F8EFE7', text: '#4A2E1E', accent: '#A15A2A' },
    JUNG: { card: '#EDF5EE', text: '#1F3A2D', accent: '#2F7D59' },
    ASTROLOG: { card: '#EFF4FF', text: '#1D2E5B', accent: '#3F63D8' },
};

export default function DreamDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const keyboard = useAnimatedKeyboard();

    const [dream, setDream] = useState<DreamResponse | null>(null);
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [sending, setSending] = useState(false);
    const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [selectedZodiac, setSelectedZodiac] = useState<string | null>(null);
    const [selectedPersona, setSelectedPersona] = useState<DreamInterpretPersona | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [interpretation, setInterpretation] = useState<DreamInterpretationResponse | null>(null);

    const flatListRef = useRef<FlatList>(null);

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        paddingBottom: Math.max(0, keyboard.height.value - insets.bottom + 8),
    }));

    const inputDockAnimatedStyle = useAnimatedStyle(() => {
      const lift = Math.max(0, keyboard.height.value - insets.bottom);
      return {
        transform: [{ translateY: -lift }],
      };
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            if (!id) return;
            const [dreamData, commentsData] = await Promise.all([
                getDreamById(id as string),
                getComments(id as string),
            ]);
            setDream(dreamData);
            setComments(commentsData);
        } catch (error) {
            console.error('Failed to load dream details:', error);
            showAlert('Error', 'Failed to load dream details.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        setSending(true);
        try {
            await addComment(id as string, commentText);
            setCommentText('');
            Keyboard.dismiss();
            const newComments = await getComments(id as string);
            setComments(newComments);
            setDream(prev => prev ? { ...prev, commentCount: newComments.length } : prev);
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            showAlert('Error', 'Failed to post comment.');
        } finally {
            setSending(false);
        }
    };

    const handleLike = async () => {
        if (!dream) return;
        const newLikedState = !dream.isLiked;
        const newLikeCount = newLikedState ? dream.likeCount + 1 : dream.likeCount - 1;
        setDream({ ...dream, isLiked: newLikedState, likeCount: newLikeCount });
        try {
            await toggleLike(dream.id);
        } catch {
            setDream({ ...dream, isLiked: !newLikedState, likeCount: dream.likeCount });
        }
    };

    const closeAnalysisModal = () => {
        if (analysisLoading) return;
        setAnalysisModalVisible(false);
        setSelectedZodiac(null);
        setSelectedPersona(null);
    };

    const closeMenu = () => setMenuVisible(false);

    const handleToggleSave = () => {
      setIsSaved(prev => !prev);
      closeMenu();
      showAlert('Saved', !isSaved ? 'Dream saved.' : 'Removed from saved.');
    };

    const handleReport = async () => {
      if (!dream) return;
      closeMenu();
      setReporting(true);
      try {
        await submitReport({
          type: 'DREAM',
          dreamId: dream.id,
          reason: 'Inappropriate content',
        });
        showAlert('Reported', 'Thanks. We will review this dream.');
      } catch (error) {
        console.error('Failed to submit report:', error);
        showAlert('Error', 'Report could not be submitted. Please try again.');
      } finally {
        setReporting(false);
      }
    };

    const handleAnalyzeDream = async () => {
        if (!id || !selectedZodiac || !selectedPersona) {
            return;
        }
        setAnalysisLoading(true);
        try {
            const result = await interpretDream(id as string, {
                zodiacSign: selectedZodiac,
                persona: selectedPersona,
            });
            setInterpretation(result);
            closeAnalysisModal();
        } catch (error) {
            showAlert('Error', 'Could not fetch interpretation.');
        } finally {
            setAnalysisLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7E6BFF" />
            </View>
        );
    }

    if (!dream) return null;

    const renderHeader = () => (
        <View style={styles.article}>
          <View style={styles.metaRowTop}>
            <TouchableOpacity style={styles.metaLeft} activeOpacity={0.8} onPress={() => router.push('/user-profile')}>
              {dream.avatarUrl ? (
                <Image source={{ uri: dream.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{dream.nickname.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>{dream.nickname}</Text>
                <Text style={styles.postedAt}>Posted {formatRelativeTime(dream.createdAt).toLowerCase()}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.themePill}>
              <Ionicons name={THEME_TO_ICON[dream.theme] as any} size={14} color="#2563eb" />
              <Text style={styles.themePillText}>{THEME_TO_TURKISH[dream.theme]}</Text>
            </View>
          </View>

          <Text style={styles.titleSerif}>{dream.title}</Text>
          <Text style={styles.bodyText}>{dream.description}</Text>

          {!!dream.tags?.length && (
            <View style={styles.tagsWrap}>
              {dream.tags.slice(0, 6).map((t) => (
                <View key={t} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.85}>
              <View style={[styles.actionIconCircle, styles.actionIconCircleLike, dream.isLiked && styles.actionIconCircleLikeActive]}>
                <Ionicons name={dream.isLiked ? 'heart' : 'heart-outline'} size={18} color={dream.isLiked ? '#B3717A' : '#B3717A'} />
              </View>
              <Text style={styles.actionCount}>{dream.likeCount}</Text>
            </TouchableOpacity>

            <View style={styles.actionBtn}>
              <View style={[styles.actionIconCircle, styles.actionIconCircleComment]}>
                <Ionicons name="chatbubble-outline" size={18} color="#3b82f6" />
              </View>
              <Text style={styles.actionCount}>{dream.commentCount}</Text>
            </View>

            <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={VISIBILITY_ICON[dream.visibility] as any} size={14} color="rgba(51,65,85,0.45)" />
              <Text style={styles.visibilityText}>{dream.visibility.replace('_', ' ')}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.interpretBtn} activeOpacity={0.88} onPress={() => setAnalysisModalVisible(true)}>
            <View style={styles.interpretIcon}>
              <Ionicons name="sparkles-outline" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.interpretTitle}>Get Interpretation</Text>
              <Text style={styles.interpretSub}>Choose persona & zodiac</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(51,65,85,0.35)" />
          </TouchableOpacity>

          {interpretation && (
            <View
              style={[
                styles.interpretationCard,
                {
                  backgroundColor: PERSONA_THEME[interpretation.persona].card,
                  borderLeftColor: PERSONA_THEME[interpretation.persona].accent,
                },
              ]}
            >
              <Text style={[styles.interpretationTitle, { color: PERSONA_THEME[interpretation.persona].accent }]}>
                {PERSONAS.find(p => p.key === interpretation.persona)?.label} Analizi
              </Text>
              <Text style={[styles.interpretationMeta, { color: PERSONA_THEME[interpretation.persona].text }]}>
                Burc: {interpretation.zodiacSign}
              </Text>
              <Text style={[styles.interpretationContent, { color: PERSONA_THEME[interpretation.persona].text }]}>
                {interpretation.content}
              </Text>
            </View>
          )}

          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
          </View>
        </View>
    );

    const renderComment = ({ item }: { item: CommentResponse }) => (
      <View style={styles.commentRow}>
        <View style={styles.commentAvatarCol}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.commentAvatar} />
          ) : (
            <View style={styles.commentAvatarFallback}>
              <Text style={styles.commentAvatarInitial}>{item.nickname.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.commentBody}>
          <View style={styles.commentHeadRow}>
            <Text style={styles.commentUser} numberOfLines={1}>
              {item.nickname}
            </Text>
            <Text style={styles.commentTime}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>
      </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyComments}>
            <Ionicons name="chatbubbles-outline" size={36} color="#D1D5DB" />
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubText}>Be the first to comment.</Text>
        </View>
    );

    return (
        <LinearGradient colors={['#F0F9FF', '#E0F2FE']} style={styles.root}>
            {/* Sticky Header */}
            <View style={[styles.navHeader, { paddingTop: insets.top + 6 }]}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.iconBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="chevron-back" size={22} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Dream Details</Text>
                <TouchableOpacity
                  onPress={() => setMenuVisible(true)}
                  style={styles.iconBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="ellipsis-vertical" size={18} color="#334155" />
                </TouchableOpacity>
            </View>

            {/* Top-right menu (Save / Report) */}
            <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={closeMenu}>
              <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
                <Pressable style={styles.menuSheet} onPress={() => {}}>
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.85} onPress={handleToggleSave}>
                    <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color="#334155" />
                    <Text style={styles.menuItemText}>{isSaved ? 'Unsave Dream' : 'Save Dream'}</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.85} onPress={handleReport} disabled={reporting}>
                    <Ionicons name="flag-outline" size={18} color="#D14343" />
                    <Text style={[styles.menuItemText, { color: '#D14343' }]}>{reporting ? 'Reporting...' : 'Report Dream'}</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.85} onPress={closeMenu}>
                    <Text style={[styles.menuItemText, { marginLeft: 0, fontWeight: '800' }]}>Cancel</Text>
                  </TouchableOpacity>
                </Pressable>
              </Pressable>
            </Modal>

            <Modal
                animationType="slide"
                transparent
                visible={analysisModalVisible}
                onRequestClose={closeAnalysisModal}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Choose Zodiac Sign</Text>
                        <View style={styles.optionGrid}>
                            {ZODIAC_SIGNS.map(sign => (
                                <TouchableOpacity
                                    key={sign}
                                    style={[
                                        styles.optionChip,
                                        selectedZodiac === sign && styles.optionChipSelected,
                                    ]}
                                    onPress={() => setSelectedZodiac(sign)}
                                >
                                    <Text
                                        style={[
                                            styles.optionChipText,
                                            selectedZodiac === sign && styles.optionChipTextSelected,
                                        ]}
                                    >
                                        {sign}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.modalTitle, { marginTop: 18 }]}>Choose Analyst</Text>
                        <View style={styles.personaList}>
                            {PERSONAS.map(persona => (
                                <TouchableOpacity
                                    key={persona.key}
                                    style={[
                                        styles.personaRow,
                                        selectedPersona === persona.key && styles.personaRowSelected,
                                    ]}
                                    onPress={() => setSelectedPersona(persona.key)}
                                >
                                    <Text style={styles.personaLabel}>{persona.label}</Text>
                                    <Text style={styles.personaSubtitle}>{persona.subtitle}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={closeAnalysisModal}
                                disabled={analysisLoading}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalConfirmBtn,
                                    (!selectedPersona || !selectedZodiac || analysisLoading) && styles.modalConfirmBtnDisabled,
                                ]}
                                onPress={handleAnalyzeDream}
                                disabled={!selectedPersona || !selectedZodiac || analysisLoading}
                            >
                                {analysisLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalConfirmText}>Get Interpretation</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Animated.View style={[styles.inner, containerAnimatedStyle]}>
                <FlatList
                    ref={flatListRef}
                    data={comments}
                    renderItem={renderComment}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                />

                {/* Comment Input */}
                <Animated.View
                  style={[
                    styles.inputDock,
                    inputDockAnimatedStyle,
                    { paddingBottom: Math.max(insets.bottom + 12, 20) },
                  ]}
                >
                  <View style={styles.inputGlass}>
                    <View style={styles.inputPill}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Add a comment..."
                        placeholderTextColor="rgba(51,65,85,0.45)"
                        value={commentText}
                        onChangeText={setCommentText}
                        maxLength={500}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
                      onPress={handleSendComment}
                      disabled={!commentText.trim() || sending}
                      activeOpacity={0.85}
                    >
                      {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
                    </TouchableOpacity>
                  </View>
                </Animated.View>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    inner: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
    },

    // NAV HEADER
    navHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 12,
        backgroundColor: '#F0F9FF',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(219,234,254,0.6)',
    },
    iconBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
        letterSpacing: -0.2,
    },

    menuBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.20)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: 70,
      paddingRight: 12,
    },
    menuSheet: {
      width: 220,
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(226,232,240,0.9)',
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    menuItemText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#334155',
    },
    menuDivider: {
      height: 1,
      backgroundColor: 'rgba(226,232,240,0.75)',
    },

    // LIST
    listContent: {
        paddingBottom: 200,
    },

    // ARTICLE
    article: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 12,
    },
    metaRowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    metaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      paddingRight: 10,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.7)',
      backgroundColor: '#e2e8f0',
    },
    avatarFallback: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.7)',
      backgroundColor: 'rgba(255,255,255,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitial: {
      fontSize: 16,
      fontWeight: '800',
      color: 'rgba(51,65,85,0.55)',
    },
    authorName: { fontSize: 13, fontWeight: '800', color: '#334155' },
    postedAt: { marginTop: 2, fontSize: 11, fontWeight: '600', color: 'rgba(100,116,139,0.8)' },
    themePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: 'rgba(239,246,255,0.55)',
      borderWidth: 1,
      borderColor: 'rgba(219,234,254,0.9)',
    },
    themePillText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
    titleSerif: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: '800',
      fontStyle: 'italic',
      color: '#0f172a',
      letterSpacing: -0.8,
      marginBottom: 14,
      fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif', default: undefined }),
    },
    bodyText: {
      fontSize: 16,
      lineHeight: 26,
      color: 'rgba(51,65,85,0.78)',
      fontWeight: '300',
    },
    tagsWrap: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tagPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.65)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.7)',
    },
    tagText: { fontSize: 13, color: 'rgba(51,65,85,0.7)', fontWeight: '600' },

    // STATS
    actionBar: {
      marginTop: 18,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: 'rgba(226,232,240,0.6)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 22,
    },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionIconCircleLike: { backgroundColor: 'rgba(253,242,248,0.8)' },
    actionIconCircleLikeActive: { backgroundColor: 'rgba(253,242,248,0.9)' },
    actionIconCircleComment: { backgroundColor: 'rgba(239,246,255,0.85)' },
    actionCount: { fontSize: 14, fontWeight: '800', color: '#334155' },
    visibilityText: { fontSize: 11, fontWeight: '800', color: 'rgba(100,116,139,0.7)', textTransform: 'uppercase' },

    interpretBtn: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.60)',
      borderWidth: 1,
      borderColor: 'rgba(226,232,240,0.70)',
    },
    interpretIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: PRIMARY,
      justifyContent: 'center',
      alignItems: 'center',
    },
    interpretTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: '#334155',
      letterSpacing: -0.2,
    },
    interpretSub: {
      marginTop: 2,
      fontSize: 12,
      fontWeight: '700',
      color: 'rgba(100,116,139,0.75)',
    },
    interpretationCard: {
        borderRadius: 14,
        borderLeftWidth: 4,
        padding: 14,
        marginBottom: 12,
        marginTop: 14,
    },
    interpretationTitle: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 6,
    },
    interpretationMeta: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    interpretationContent: {
        fontSize: 14,
        lineHeight: 21,
        fontWeight: '500',
    },
    statBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F5F6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statIconWrapActive: {
        backgroundColor: '#FF6B6B',
    },
    statCount: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8A8CA8',
    },
    statCountActive: {
        color: '#FF6B6B',
    },

    commentsHeader: { marginTop: 20, marginBottom: 8 },
    commentsTitle: { fontSize: 20, fontWeight: '900', color: '#334155', letterSpacing: -0.3 },

    // COMMENT ITEMS
    commentRow: {
      flexDirection: 'row',
      gap: 14,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(226,232,240,0.55)',
      alignItems: 'flex-start',
    },
    commentAvatarCol: {
      width: 36,
      alignItems: 'center',
      paddingTop: 2, // fine-tune vertical alignment with bubble
    },
    commentAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#e2e8f0',
    },
    commentAvatarFallback: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(226,232,240,0.8)',
    },
    commentAvatarInitial: {
      fontSize: 14,
      fontWeight: '800',
      color: 'rgba(51,65,85,0.6)',
    },
    commentBody: {
      flex: 1,
      minWidth: 0, // critical: prevent text overflow in flex rows
      backgroundColor: 'rgba(255,255,255,0.70)',
      borderWidth: 1,
      borderColor: 'rgba(226,232,240,0.65)',
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginRight: 6, // avoid sticking to screen edge
    },
    commentHeadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 6,
    },
    commentUser: {
      fontSize: 13,
      fontWeight: '900',
      color: '#334155',
      flexShrink: 1,
    },
    commentTime: {
      fontSize: 10,
      color: 'rgba(100,116,139,0.55)',
      fontWeight: '800',
      marginLeft: 8,
    },
    commentText: {
      fontSize: 13,
      color: 'rgba(100,116,139,0.85)',
      lineHeight: 19,
      flexShrink: 1,
      flexWrap: 'wrap',
    },

    // EMPTY STATE
    emptyComments: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
        gap: 6,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#B0B3C8',
        marginTop: 8,
    },
    emptySubText: {
        fontSize: 13,
        color: '#D1D5DB',
    },

    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1A1A2E',
        marginBottom: 10,
    },
    optionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionChip: {
        backgroundColor: '#F5F6FF',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E3E8FF',
    },
    optionChipSelected: {
        backgroundColor: '#E7EDFF',
        borderColor: '#5B7CFA',
    },
    optionChipText: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '600',
    },
    optionChipTextSelected: {
        color: '#3153CC',
    },
    personaList: {
        gap: 8,
    },
    personaRow: {
        borderWidth: 1,
        borderColor: '#E9EAF4',
        borderRadius: 12,
        padding: 10,
        backgroundColor: '#FAFAFF',
    },
    personaRowSelected: {
        borderColor: '#5B7CFA',
        backgroundColor: '#EEF2FF',
    },
    personaLabel: {
        color: '#2B3148',
        fontSize: 14,
        fontWeight: '700',
    },
    personaSubtitle: {
        color: '#78819A',
        fontSize: 12,
        marginTop: 2,
    },
    modalActions: {
        marginTop: 14,
        flexDirection: 'row',
        gap: 10,
    },
    modalCancelBtn: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D7DBEB',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    modalCancelText: {
        color: '#59607A',
        fontWeight: '700',
    },
    modalConfirmBtn: {
        flex: 1,
        borderRadius: 12,
        backgroundColor: '#5B7CFA',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    modalConfirmBtnDisabled: {
        backgroundColor: '#B3BACE',
    },
    modalConfirmText: {
        color: '#fff',
        fontWeight: '700',
    },

    inputDock: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    inputGlass: {
      backgroundColor: 'rgba(255,255,255,0.45)',
      borderRadius: 999,
      padding: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.65)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    inputPill: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.65)',
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    },
    textInput: {
        flex: 1,
        backgroundColor: 'transparent',
        maxHeight: 80,
        fontSize: 14,
        color: '#334155',
        padding: 0,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: 'rgba(179,113,122,0.35)',
    },
});
