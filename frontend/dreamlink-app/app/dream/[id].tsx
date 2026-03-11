import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import Animated, {
    useAnimatedKeyboard,
    useAnimatedStyle,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
    getDreamById,
    getComments,
    addComment,
    toggleLike,
    DreamResponse,
    CommentResponse,
    formatRelativeTime,
    THEME_TO_ICON,
    THEME_TO_TURKISH,
} from '../../services/api';

const VISIBILITY_ICON: Record<string, string> = {
    PUBLIC: 'globe-outline',
    FOLLOWERS_ONLY: 'people-outline',
    PRIVATE: 'lock-closed-outline',
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

    const flatListRef = useRef<FlatList>(null);

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        paddingBottom: Math.max(0, keyboard.height.value - insets.bottom + 8),
    }));

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
            showAlert('Hata', 'Rüya detayları yüklenemedi.');
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
            showAlert('Hata', 'Yorum gönderilemedi.');
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7E6BFF" />
            </View>
        );
    }

    if (!dream) return null;

    const renderHeader = () => (
        <View style={styles.dreamCard}>
            {/* User row */}
            <View style={styles.userRow}>
                {dream.avatarUrl ? (
                    <Image source={{ uri: dream.avatarUrl }} style={styles.avatar} />
                ) : (
                    <LinearGradient
                        colors={['#E0C3FC', '#8EC5FC']}
                        style={[styles.avatar, styles.avatarGradient]}
                    >
                        <Text style={styles.avatarInitial}>
                            {dream.nickname.charAt(0).toUpperCase()}
                        </Text>
                    </LinearGradient>
                )}
                <View style={styles.userDetails}>
                    <Text style={styles.username}>{dream.nickname}</Text>
                    <View style={styles.metaRow}>
                        <Ionicons
                            name={VISIBILITY_ICON[dream.visibility] as any}
                            size={11}
                            color="#B0B3C8"
                        />
                        <Text style={styles.metaText}>{formatRelativeTime(dream.createdAt)}</Text>
                    </View>
                </View>
                {/* Theme badge */}
                <View style={styles.themeBadge}>
                    <Ionicons name={THEME_TO_ICON[dream.theme] as any} size={13} color="#7E6BFF" />
                    <Text style={styles.themeText}>{THEME_TO_TURKISH[dream.theme]}</Text>
                </View>
            </View>

            {/* Title & Description */}
            <Text style={styles.dreamTitle}>{dream.title}</Text>
            <Text style={styles.dreamDescription}>{dream.description}</Text>

            {/* Like / Comment stats */}
            <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statBtn} onPress={handleLike} activeOpacity={0.7}>
                    <View style={[styles.statIconWrap, dream.isLiked && styles.statIconWrapActive]}>
                        <Ionicons
                            name={dream.isLiked ? 'heart' : 'heart-outline'}
                            size={18}
                            color={dream.isLiked ? '#fff' : '#8A8CA8'}
                        />
                    </View>
                    <Text style={[styles.statCount, dream.isLiked && styles.statCountActive]}>
                        {dream.likeCount}
                    </Text>
                </TouchableOpacity>

                <View style={styles.statBtn}>
                    <View style={styles.statIconWrap}>
                        <Ionicons name="chatbubble-outline" size={16} color="#8A8CA8" />
                    </View>
                    <Text style={styles.statCount}>{dream.commentCount}</Text>
                </View>
            </View>

            {/* Comments section label */}
            <View style={styles.commentsSectionHeader}>
                <Text style={styles.commentsSectionTitle}>Yorumlar</Text>
                <View style={styles.commentCountBadge}>
                    <Text style={styles.commentCountText}>{comments.length}</Text>
                </View>
            </View>
        </View>
    );

    const renderComment = ({ item, index }: { item: CommentResponse; index: number }) => (
        <View style={[styles.commentRow, index === 0 && { marginTop: 4 }]}>
            {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.commentAvatar} />
            ) : (
                <LinearGradient
                    colors={['#E0C3FC', '#8EC5FC']}
                    style={[styles.commentAvatar, styles.avatarGradient]}
                >
                    <Text style={styles.commentAvatarInitial}>
                        {item.nickname.charAt(0).toUpperCase()}
                    </Text>
                </LinearGradient>
            )}
            <View style={styles.commentBubble}>
                <View style={styles.commentBubbleHeader}>
                    <Text style={styles.commentUser}>{item.nickname}</Text>
                    <Text style={styles.commentTime}>{formatRelativeTime(item.createdAt)}</Text>
                </View>
                <Text style={styles.commentText}>{item.content}</Text>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyComments}>
            <Ionicons name="chatbubbles-outline" size={36} color="#D1D5DB" />
            <Text style={styles.emptyText}>Henüz yorum yok</Text>
            <Text style={styles.emptySubText}>İlk yorumu sen yap!</Text>
        </View>
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* Custom Header */}
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={22} color="#2D2D3A" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Rüya</Text>
                <View style={{ width: 40 }} />
            </View>

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
                <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Yorum yaz..."
                        placeholderTextColor="#B0B3C8"
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
                        onPress={handleSendComment}
                        disabled={!commentText.trim() || sending}
                        activeOpacity={0.8}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="send" size={18} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F5F6FF',
    },
    inner: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F6FF',
    },

    // NAV HEADER
    navHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F5F6FF',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7E6BFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    navTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2D2D3A',
        letterSpacing: 0.3,
    },

    // LIST
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },

    // DREAM CARD
    dreamCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#7E6BFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#F1F3FF',
    },
    avatarGradient: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    userDetails: {
        flex: 1,
        marginLeft: 12,
    },
    username: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2D2D3A',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 3,
    },
    metaText: {
        fontSize: 12,
        color: '#B0B3C8',
    },
    themeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(126, 107, 255, 0.08)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 5,
    },
    themeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7E6BFF',
    },
    dreamTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1A2E',
        lineHeight: 30,
        marginBottom: 10,
    },
    dreamDescription: {
        fontSize: 15,
        color: '#5E5E72',
        lineHeight: 24,
        marginBottom: 20,
    },

    // STATS
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F3FF',
        paddingTop: 16,
        marginBottom: 20,
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

    // COMMENTS SECTION HEADER
    commentsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    commentsSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D2D3A',
    },
    commentCountBadge: {
        backgroundColor: '#F1F3FF',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    commentCountText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#7E6BFF',
    },

    // COMMENT ITEMS
    commentRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    commentAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F1F3FF',
    },
    commentAvatarInitial: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    commentBubble: {
        flex: 1,
        marginLeft: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderTopLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    commentBubbleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    commentUser: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2D2D3A',
    },
    commentTime: {
        fontSize: 11,
        color: '#B0B3C8',
    },
    commentText: {
        fontSize: 14,
        color: '#5E5E72',
        lineHeight: 20,
    },

    // EMPTY STATE
    emptyComments: {
        alignItems: 'center',
        paddingVertical: 32,
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

    // INPUT BAR
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F1F3FF',
        gap: 10,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#F5F6FF',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        maxHeight: 100,
        fontSize: 15,
        color: '#2D2D3A',
        borderWidth: 1,
        borderColor: '#EBEBF5',
    },
    sendBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#7E6BFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7E6BFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 2,
    },
    sendBtnDisabled: {
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0,
        elevation: 0,
    },
});
