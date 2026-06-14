import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform,
    StatusBar,
    Modal,
    Pressable,
    Alert,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
    FadeInUp,
    FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line } from 'react-native-svg';
import DropShadow from 'react-native-drop-shadow';
import {
    getDreamById,
    submitReport,
    DreamResponse,
    DreamInterpretationResponse,
} from '../../services/api';

/* ────────────────────────────────────────────────────────────────────────── */
/* DESIGN TOKENS & FONTS                                                     */
/* ────────────────────────────────────────────────────────────────────────── */
const ROSE = '#8A3342';
const ROSE_DARK = '#4A1B24';
const ROSE_SOFT = 'rgba(138, 51, 66, 0.06)';
const WHITE = '#FFFFFF';
const PAPER_BG = '#FAF9F6';
const BG = '#FFFFFF';
const TEXT_MAIN = '#1C1714';
const TEXT_MUTED = '#333333';
const TEXT_LIGHT = '#9E9E9E';
const BORDER_FAINT = 'rgba(0,0,0,0.06)';
const CUSTOM_SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const QS_REGULAR = 'Quicksand_400Regular';
const QS_MEDIUM = 'Quicksand_500Medium';
const QS_SEMIBOLD = 'Quicksand_600SemiBold';
const QS_BOLD = 'Quicksand_700Bold';

/* ────────────────────────────────────────────────────────────────────────── */
/* UTILITIES                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */
const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${message}`);
    else Alert.alert(title, message);
};

const formatEditorialDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
};

const resolveIsOwnDream = (dream: any) => {
    if (typeof dream.isOwner === 'boolean') return dream.isOwner;
    if (typeof dream.isMine === 'boolean') return dream.isMine;
    const currentUserId = dream.currentUserId;
    const authorId = dream.userId ?? dream.authorId ?? dream.ownerId;
    if (currentUserId !== undefined && authorId !== undefined) {
        return String(currentUserId) === String(authorId);
    }
    return true; // Test için default true
};

/* ────────────────────────────────────────────────────────────────────────── */
/* CUSTOM STITCH COMPONENT (Fiziksel Kalın İplik)                            */
/* ────────────────────────────────────────────────────────────────────────── */
const StitchX = ({ style }: { style?: any }) => (
    <View style={[styles.stitchXContainer, style]}>
        <View style={[styles.stitchLine, { transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.stitchLine, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
);

/* ────────────────────────────────────────────────────────────────────────── */
/* MINIMALIST CORNER BRACKET (Editorial Framing Lines)                        */
/* ────────────────────────────────────────────────────────────────────────── */
const CornerBracket = ({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
    const isTop = position.startsWith('top');
    const isLeft = position.endsWith('left');

    return (
        <View
            style={[
                styles.cornerBracket,
                {
                    top: isTop ? 16 : undefined,
                    bottom: !isTop ? 16 : undefined,
                    left: isLeft ? 16 : undefined,
                    right: !isLeft ? 16 : undefined,
                    borderTopWidth: isTop ? 1.5 : 0,
                    borderBottomWidth: !isTop ? 1.5 : 0,
                    borderLeftWidth: isLeft ? 1.5 : 0,
                    borderRightWidth: !isLeft ? 1.5 : 0,
                }
            ]}
        />
    );
};


/* ────────────────────────────────────────────────────────────────────────── */
/* ANALYSIS COMPONENTS                                                       */
/* ────────────────────────────────────────────────────────────────────────── */
type EmotionEntry = { label: string; value: number };
type ThemeEntry = { label: string; value: number };

const AnalysisProgressBar: React.FC<{
    label: string;
    value: number;
    color: string;
    delay: number;
}> = ({ label, value, color, delay }) => {
    const width = useSharedValue(0);
    const normalizedValue = Math.max(12, Math.min(100, value));
    useEffect(() => {
        const timer = setTimeout(() => {
            width.value = withTiming(normalizedValue, { duration: 900, easing: Easing.out(Easing.cubic) });
        }, delay);
        return () => clearTimeout(timer);
    }, [delay, normalizedValue, width]);
    const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));

    return (
        <View style={styles.analysisBarContainer}>
            <View style={styles.analysisBarHeader}>
                <Text style={styles.analysisBarLabel}>{label}</Text>
            </View>
            <View style={styles.analysisBarTrack}>
                <Animated.View style={[styles.analysisBarFill, { backgroundColor: color }, barStyle]} />
            </View>
        </View>
    );
};

const AnalysisSection: React.FC<{
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    entries: (EmotionEntry | ThemeEntry)[];
    colors: string[];
    iconColor?: string;
    delayOffset?: number;
}> = ({ title, description, icon, entries, colors, iconColor, delayOffset = 0 }) => {
    const activeIconColor = iconColor ?? colors[0];
    return (
        <View style={styles.analysisSection}>
            <View style={styles.analysisSectionHeader}>
                <View style={[styles.analysisIconWrap, { backgroundColor: `${activeIconColor}15` }]}>
                    <Ionicons name={icon} size={18} color={activeIconColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.analysisSectionTitle}>{title}</Text>
                    <Text style={styles.analysisSectionDesc}>{description}</Text>
                </View>
            </View>
            <View style={styles.analysisList}>
                {entries.slice(0, 3).map((entry, i) => (
                    <AnalysisProgressBar
                        key={entry.label}
                        label={entry.label}
                        value={entry.value}
                        color={colors[i] ?? colors[0]}
                        delay={delayOffset + i * 150}
                    />
                ))}
            </View>
        </View>
    );
};

const EmotionsThemesPanel: React.FC<{
    emotions: EmotionEntry[];
    themes: ThemeEntry[];
}> = ({ emotions, themes }) => (
    <Animated.View
        entering={FadeInUp.duration(600)}
        style={styles.analysisPanel}
        needsOffscreenAlphaCompositing={true}
    >
        <AnalysisSection
            title="Emotional Profile"
            description="The psychological resonance and core feelings detected in your dream."
            icon="heart"
            entries={emotions}
            colors={['#8A3342', '#B34759', '#D97384']}
            iconColor="#D14343"
        />
        <View style={styles.analysisDivider} />
        <AnalysisSection
            title="Thematic Layers"
            description="Recurring concepts and symbols shaping the narrative structure."
            icon="layers"
            entries={themes}
            colors={['#4A6B8A', '#6A8FAD', '#8EB0CC']}
            delayOffset={100}
        />
    </Animated.View>
);

/* ────────────────────────────────────────────────────────────────────────── */
/* INTERPRETATION CARD                                                       */
/* ────────────────────────────────────────────────────────────────────────── */
const StarWithRays = ({ size = 42, color = '#E07A5F' }: { size?: number; color?: string }) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* 5-pointed star in the center */}
            <Path
                d="M12 5.5l1.8 3.65 4.03.58-2.92 2.84.69 4.01-3.6-1.89-3.6 1.89.69-4.01-2.92-2.84 4.03-.58L12 5.5z"
                fill={color}
                stroke={color}
                strokeWidth={1}
                strokeLinejoin="round"
            />
            {/* Radiating lines (rays) */}
            <Line x1="12" y1="2" x2="12" y2="4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1="6" y1="18" x2="7.5" y2="16.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1="18" y1="18" x2="16.5" y2="16.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1="5.5" y1="9" x2="7.2" y2="10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1="18.5" y1="9" x2="16.8" y2="10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1="3" y1="13.5" x2="5" y2="13.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1="21" y1="13.5" x2="19" y2="13.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    );
};

const MoonAndStarsGraphic = () => {
    const floatAnim = useSharedValue(0);
    const twinkleAnim1 = useSharedValue(0.4);
    const twinkleAnim2 = useSharedValue(0.3);

    useEffect(() => {
        // Floating animation for the moon
        floatAnim.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Twinkling animation for star 1
        twinkleAnim1.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Twinkling animation for star 2
        twinkleAnim2.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const moonStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: floatAnim.value * -3 },
                { rotate: `${floatAnim.value * 2}deg` }
            ]
        };
    });

    const starStyle1 = useAnimatedStyle(() => {
        return {
            opacity: twinkleAnim1.value,
            transform: [{ scale: 0.7 + twinkleAnim1.value * 0.3 }]
        };
    });

    const starStyle2 = useAnimatedStyle(() => {
        return {
            opacity: twinkleAnim2.value,
            transform: [{ scale: 0.6 + twinkleAnim2.value * 0.4 }]
        };
    });

    return (
        <View style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            {/* Animated Moon */}
            <Animated.View style={moonStyle}>
                <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                        fill="#F4D068"
                        stroke="#F4D068"
                        strokeWidth={0.5}
                        strokeLinejoin="round"
                    />
                </Svg>
            </Animated.View>

            {/* Twinkling Star 1 (Top Right) */}
            <Animated.View style={[{ position: 'absolute', top: 2, right: 2 }, starStyle1]}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M12 3 L14.5 9.5 L21 12 L14.5 14.5 L12 21 L9.5 14.5 L3 12 L9.5 9.5 Z"
                        fill="#F4D068"
                        stroke="#F4D068"
                        strokeWidth={0.5}
                    />
                </Svg>
            </Animated.View>

            {/* Twinkling Star 2 (Bottom Left) */}
            <Animated.View style={[{ position: 'absolute', bottom: 4, left: 0 }, starStyle2]}>
                <Svg width={9} height={9} viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M12 3 L14.5 9.5 L21 12 L14.5 14.5 L12 21 L9.5 14.5 L3 12 L9.5 9.5 Z"
                        fill="#F4D068"
                        stroke="#F4D068"
                        strokeWidth={0.5}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
};

const AnimatedMoonLoader = () => {
    const floatAnim = useSharedValue(0);

    useEffect(() => {
        floatAnim.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );
    }, []);

    const moonStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: floatAnim.value * -6 }],
    }));

    return (
        <View style={styles.moonLoaderWrapper}>
            <Animated.View style={moonStyle}>
                <Ionicons name="moon" size={28} color={ROSE} />
            </Animated.View>
        </View>
    );
};

const AnimatedProgressBar = ({ duration }: { duration: number }) => {
    const width = useSharedValue(0);
    useEffect(() => {
        width.value = withTiming(100, { duration, easing: Easing.linear });
    }, [duration]);
    const animatedStyle = useAnimatedStyle(() => ({
        width: `${width.value}%` as any,
    }));

    return (
        <Animated.View style={[styles.progressBarFill, animatedStyle]} />
    );
};

const IndeterminateProgressBar = () => {
    const left = useSharedValue(-40);
    useEffect(() => {
        left.value = withRepeat(
            withTiming(100, {
                duration: 1400,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
            }),
            -1,
            false
        );
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        left: `${left.value}%` as any,
    }));

    return (
        <Animated.View style={[styles.progressBarFillIndeterminate, animatedStyle]} />
    );
};

interface InterpretationCardProps {
    data: DreamInterpretationResponse;
    isPremiumUnlocked: boolean;
    onUnlock: () => void;
    hasDreamium: boolean;
}

const InterpretationCard: React.FC<InterpretationCardProps> = ({ data, isPremiumUnlocked, onUnlock, hasDreamium }) => {
    const router = useRouter();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingStep, setGeneratingStep] = useState(0);

    useEffect(() => {
        if (!isGenerating) return;
        setGeneratingStep(0);
        const interval = setInterval(() => {
            setGeneratingStep((prev) => (prev + 1) % 4);
        }, 1500);
        return () => clearInterval(interval);
    }, [isGenerating]);

    const handleGeneratePress = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            onUnlock();
        }, 6000);
    };

    const handleUnlockPress = () => {
        router.push('/premium-upsell');
    };

    return (
        <Animated.View
            entering={FadeInUp.duration(600)}
            style={styles.interpretationContainer}
            needsOffscreenAlphaCompositing={true}
        >
            <View style={styles.interpTitleRow}>
                <Feather name="feather" size={22} color={TEXT_MAIN} style={{ marginRight: 8 }} />
                <Text style={styles.interpSectionTitle}>Basic Interpretation</Text>
            </View>

            <Text style={styles.interpParagraph}>
                {data.content}
            </Text>

            {isPremiumUnlocked ? (
                <Animated.View
                    entering={FadeIn.duration(500)}
                    style={styles.advancedUnlockedCardContainer}
                >
                    <LinearGradient
                        colors={[WHITE, WHITE]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.advancedUnlockedCard}
                    >
                        <View style={styles.advancedUnlockedCardInner}>
                            <View style={styles.unlockedHeader}>
                                <View>
                                    <View style={styles.unlockedEyebrowRow}>
                                        <Ionicons name="sparkles" size={13} color={ROSE} />
                                        <Text style={styles.unlockedEyebrowText}>DREAMIUM REPORT</Text>
                                    </View>
                                    <Text style={styles.unlockedTitleText}>Advanced Insight</Text>
                                    <Text style={styles.unlockedSubtitleText}>
                                        Pattern synthesis across recent dream signals
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.unifiedProgressionCard}>
                                <Text style={styles.synthesisMetaText}>
                                    Connected progression based on your <Text style={styles.synthesisMetaStrong}>last 3 dreams</Text>
                                </Text>
                                <Text style={styles.synthesisMetaBody}>
                                    The latest symbols point to a movement from reflection into decisive transition.
                                </Text>
                                <View style={styles.miniDreamRow}>
                                    {[
                                        { id: '1', date: '24 May', title: 'Mirror Chamber' },
                                        { id: '2', date: '25 May', title: 'Golden Key' },
                                        { id: '3', date: '26 May', title: 'Cliff & Flight' },
                                    ].map((item) => (
                                        <DropShadow key={item.id} style={styles.miniDreamCardShadow}>
                                            <View style={styles.miniDreamCard}>
                                                <Text style={styles.miniDreamDate}>{item.date}</Text>
                                                <Text style={styles.miniDreamTitle} numberOfLines={2}>
                                                    {item.title}
                                                </Text>
                                            </View>
                                        </DropShadow>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.advancedCardDivider} />

                            <View style={styles.synthesisContent}>
                                <Text style={styles.advancedInterpretationTitle}>Deep Archetypal Analysis</Text>
                                <Text style={styles.advancedInterpretationText}>
                                    {data.advancedContent || data.content}
                                </Text>
                                <View style={styles.takeawayBlock}>
                                    <View style={styles.takeawayHeader}>
                                        <Ionicons name="leaf-outline" size={14} color={ROSE} />
                                        <Text style={styles.takeawayLabel}>Subconscious Guidance</Text>
                                    </View>
                                    <Text style={styles.takeawayText}>
                                        The recurring pattern of threshold-crossing suggests you are preparing for a significant transition. Focus on letting go of immediate control.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>
            ) : (
                <View style={styles.lockedSection}>
                    <LinearGradient
                        colors={hasDreamium ? [WHITE, WHITE] : ['#2A0E15', '#1A0B0F', '#0F0709']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            styles.premiumCard,
                            hasDreamium && { backgroundColor: WHITE }
                        ]}
                    >
                        <View style={[
                            styles.premiumCardInner,
                            { borderColor: hasDreamium ? 'rgba(138, 51, 66, 0.15)' : 'rgba(255, 255, 255, 0.12)' }
                        ]}>
                            {isGenerating ? (
                                <Animated.View entering={FadeIn.duration(400)} style={styles.generatingContainer}>
                                    <AnimatedMoonLoader />
                                    <Text style={[styles.generatingStepText, hasDreamium && { color: ROSE_DARK }]}>
                                        {generatingStep === 0 && "Reading past dream narratives..."}
                                        {generatingStep === 1 && "Connecting symbols & archetypes..."}
                                        {generatingStep === 2 && "Mapping psychological progression..."}
                                        {generatingStep === 3 && "Finalizing alignment map..."}
                                    </Text>
                                    <View style={[styles.generatingProgressTrack, hasDreamium && { backgroundColor: 'rgba(138, 51, 66, 0.08)' }]}>
                                        <IndeterminateProgressBar />
                                    </View>
                                </Animated.View>
                            ) : (
                                <>
                                    <View style={styles.premiumCardHeader}>
                                        <MoonAndStarsGraphic />
                                        <Text style={[styles.premiumCardTitle, hasDreamium && { color: TEXT_MAIN }]}>Advanced Interpretation</Text>
                                    </View>
                                    {!hasDreamium && <View style={styles.premiumCardDivider} />}
                                    {!hasDreamium && (
                                        <View style={styles.benefitList}>
                                            <View style={styles.benefitRow}>
                                                <Ionicons name="sparkles" size={15} color="#E5989B" style={styles.benefitIcon} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.benefitTitleDark}>Archetypal Symbols</Text>
                                                    <Text style={styles.benefitDescDark}>Reveal deep subconscious symbols & psychological meanings.</Text>
                                                </View>
                                            </View>
                                            <View style={styles.benefitRow}>
                                                <Ionicons name="link-outline" size={15} color="#E5989B" style={styles.benefitIcon} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.benefitTitleDark}>Dream Connections</Text>
                                                    <Text style={styles.benefitDescDark}>Link recurring themes across your last 3 dreams.</Text>
                                                </View>
                                            </View>
                                            <View style={styles.benefitRow}>
                                                <Ionicons name="person-outline" size={15} color="#E5989B" style={styles.benefitIcon} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.benefitTitleDark}>Personality Mapping</Text>
                                                    <Text style={styles.benefitDescDark}>Synthesize a comprehensive psychological profile tracking growth.</Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={styles.premiumUnlockButtonTouch}
                                        activeOpacity={0.85}
                                        onPress={hasDreamium ? handleGeneratePress : handleUnlockPress}
                                        disabled={isGenerating}
                                    >
                                        <LinearGradient
                                            colors={[ROSE, '#A63F4F']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.premiumUnlockButtonGradient}
                                        >
                                            {hasDreamium ? (
                                                <>
                                                    <Ionicons name="sparkles" size={14} color={WHITE} style={{ marginRight: 6 }} />
                                                    <Text style={styles.premiumUnlockButtonText}>Generate Analysis</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Ionicons name="lock-closed" size={14} color={WHITE} style={{ marginRight: 6 }} />
                                                    <Text style={styles.premiumUnlockButtonText}>Unlock with Dreamium</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </LinearGradient>
                </View>
            )}
        </Animated.View>
    );
};



/* MAIN SCREEN                                                               */
/* ────────────────────────────────────────────────────────────────────────── */
export default function DreamDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [dream, setDream] = useState<DreamResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Menu & Action States
    const [menuVisible, setMenuVisible] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [dreamVisibility, setDreamVisibility] = useState<'PRIVATE' | 'MATCHABLE'>('MATCHABLE');
    const [deleting, setDeleting] = useState(false);

    // Interpretation States
    const [isOwnDream, setIsOwnDream] = useState(false);
    const [hasUsedBasic, setHasUsedBasic] = useState(false);
    const [interpretation, setInterpretation] = useState<DreamInterpretationResponse | null>(null);
    const [showLockedMessage, setShowLockedMessage] = useState(false);
    const [activeTab, setActiveTab] = useState<'ANALYSIS' | 'INTERPRETATION'>('ANALYSIS');
    const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
    const [hasDreamium, setHasDreamium] = useState(false); //test

    useEffect(() => { loadData(); }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (!id) return;
            const dreamData = await getDreamById(id as string);
            setDream(dreamData);
            setIsOwnDream(resolveIsOwnDream(dreamData));
        } catch (error) {
            console.error('Failed to load dream details:', error);
            showAlert('Error', 'Failed to load dream details.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    /* ── MENU ACTIONS ── */
    const closeMenu = () => setMenuVisible(false);

    // ── Other's dream actions ──
    const handleToggleSave = () => {
        setIsSaved(prev => !prev);
        closeMenu();
        showAlert('Saved', !isSaved ? 'Dream saved to your collection.' : 'Dream removed from saved.');
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
            showAlert('Reported', 'Thank you. This dream will be reviewed.');
        } catch (error) {
            console.error('Failed to submit report:', error);
            showAlert('Error', 'Could not send report. Please try again.');
        } finally {
            setReporting(false);
        }
    };

    // ── Own dream actions ──
    const handleChangeVisibility = (newVisibility: 'PRIVATE' | 'MATCHABLE') => {
        setDreamVisibility(newVisibility);
        closeMenu();
        // TODO: API call to update dream visibility
        showAlert(
            'Visibility Updated',
            newVisibility === 'PRIVATE'
                ? 'Your dream is now private. Only you can see it.'
                : 'Your dream is now matchable. Others can discover it.'
        );
    };

    const handleDeleteDream = async () => {
        if (!dream) return;
        setDeleteConfirmVisible(false);
        setDeleting(true);
        try {
            // TODO: API call to delete dream
            showAlert('Deleted', 'Your dream has been deleted.');
            router.back();
        } catch (error) {
            console.error('Failed to delete dream:', error);
            showAlert('Error', 'Could not delete dream. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    /* ── INTERPRETATION ACTIONS ── */
    const handleBasicInterpretation = useCallback(() => {
        if (hasUsedBasic) {
            setShowLockedMessage(true);
            setTimeout(() => setShowLockedMessage(false), 3000);
            return;
        }
        setHasUsedBasic(true);
        setInterpretation({
            id: 'mock-interpretation-id',
            dreamId: id as string,
            persona: 'JUNG',
            content: 'The feeling of a cliff and falling in your dream symbolizes a great fear of losing control or being on the threshold in your life. However, this fall turning into flight heralds the freedom and inner peace your soul will find when you release your fears.',
            advancedContent: 'A deeper Jungian analysis reveals that the transition from a passive descent (falling) to active navigation (flight) signals the emergence of the self-regulating archetype of the Transcendent Function. The cliff itself acts as the boundary between your conscious ego and the vast unconscious realm. In your waking life, this indicates an imminent resolution of a tension between career constraints and creative desires. Moving forward, the symbols suggest focusing on mindfulness exercises during transition periods, particularly in the early morning.',
            createdAt: new Date().toISOString(),
            emotions: [
                { label: 'Anxiety', value: 72 },
                { label: 'Curiosity', value: 55 },
                { label: 'Freedom', value: 38 },
            ],
            themes: [
                { label: 'Control', value: 68 },
                { label: 'Transformation', value: 51 },
                { label: 'Subconscious', value: 44 },
            ],
        } as any);
    }, [hasUsedBasic, id]);

    useEffect(() => {
        if (dream && isOwnDream && !hasUsedBasic && !interpretation) {
            handleBasicInterpretation();
        }
    }, [dream, isOwnDream, hasUsedBasic, interpretation, handleBasicInterpretation]);

    if (loading) {
        return (
            <View style={[styles.root, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={ROSE} />
            </View>
        );
    }

    if (!dream) return null;

    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />

            <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>

                {/* ── HEADER (Geri & Menü) ── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.8}>
                        <Ionicons name="chevron-back" size={26} color={TEXT_MAIN} />
                    </TouchableOpacity>


                    <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconBtn} activeOpacity={0.8}>
                        <Ionicons name="ellipsis-horizontal" size={24} color={TEXT_MAIN} />
                    </TouchableOpacity>
                </View>

                {/* ── DROPDOWN MENU ── */}
                <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={closeMenu}>
                    <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
                        <Pressable style={styles.menuSheet} onPress={() => { }}>
                            {isOwnDream ? (
                                /* ── Own Dream Menu ── */
                                <>
                                    <View style={styles.menuHeaderSection}>
                                        <Text style={styles.menuHeaderTitle}>Visibility</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.menuItem, dreamVisibility === 'MATCHABLE' && styles.menuItemActive]}
                                        activeOpacity={0.85}
                                        onPress={() => handleChangeVisibility('MATCHABLE')}
                                    >
                                        <View style={[styles.menuIconWrap, dreamVisibility === 'MATCHABLE' && { backgroundColor: ROSE_SOFT }]}>
                                            <Ionicons name="people-outline" size={15} color={dreamVisibility === 'MATCHABLE' ? ROSE : TEXT_MUTED} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.menuItemText, dreamVisibility === 'MATCHABLE' && { fontWeight: '600', color: ROSE }]}>Matchable</Text>
                                            <Text style={styles.menuItemSubtext}>Visible to matches</Text>
                                        </View>
                                        {dreamVisibility === 'MATCHABLE' && <Ionicons name="checkmark" size={15} color={ROSE} />}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.menuItem, dreamVisibility === 'PRIVATE' && styles.menuItemActive]}
                                        activeOpacity={0.85}
                                        onPress={() => handleChangeVisibility('PRIVATE')}
                                    >
                                        <View style={[styles.menuIconWrap, dreamVisibility === 'PRIVATE' && { backgroundColor: ROSE_SOFT }]}>
                                            <Ionicons name="lock-closed-outline" size={15} color={dreamVisibility === 'PRIVATE' ? ROSE : TEXT_MUTED} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.menuItemText, dreamVisibility === 'PRIVATE' && { fontWeight: '600', color: ROSE }]}>Private</Text>
                                            <Text style={styles.menuItemSubtext}>Only visible to you</Text>
                                        </View>
                                        {dreamVisibility === 'PRIVATE' && <Ionicons name="checkmark" size={15} color={ROSE} />}
                                    </TouchableOpacity>
                                    <View style={styles.menuDivider} />
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        activeOpacity={0.85}
                                        onPress={() => { closeMenu(); setDeleteConfirmVisible(true); }}
                                        disabled={deleting}
                                    >
                                        <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(209,67,67,0.08)' }]}>
                                            <Ionicons name="trash-outline" size={15} color="#D14343" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.menuItemText, { color: '#D14343' }]}>
                                                {deleting ? 'Deleting...' : 'Delete Dream'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                /* ── Other's Dream Menu ── */
                                <>
                                    <View style={styles.menuHeaderSection}>
                                        <Text style={styles.menuHeaderTitle}>Actions</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        activeOpacity={0.85}
                                        onPress={handleToggleSave}
                                    >
                                        <View style={[styles.menuIconWrap, { backgroundColor: isSaved ? 'rgba(138,51,66,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                                            <Ionicons
                                                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                                                size={15}
                                                color={isSaved ? ROSE : TEXT_MUTED}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.menuItemText}>
                                                {isSaved ? 'Remove from Saved' : 'Save Dream'}
                                            </Text>
                                            <Text style={styles.menuItemSubtext}>
                                                {isSaved ? 'Remove from collection' : 'Add to collection'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={styles.menuDivider} />
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        activeOpacity={0.85}
                                        onPress={handleReport}
                                        disabled={reporting}
                                    >
                                        <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(209,67,67,0.08)' }]}>
                                            <Ionicons name="flag-outline" size={15} color="#D14343" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.menuItemText, { color: '#D14343' }]}>
                                                {reporting ? 'Reporting...' : 'Report Dream'}
                                            </Text>
                                            <Text style={styles.menuItemSubtext}>Flag inappropriate content</Text>
                                        </View>
                                    </TouchableOpacity>
                                </>
                            )}
                        </Pressable>
                    </Pressable>
                </Modal>

                {/* ── DELETE CONFIRM MODAL ── */}
                <Modal transparent visible={deleteConfirmVisible} animationType="fade" onRequestClose={() => setDeleteConfirmVisible(false)}>
                    <Pressable style={styles.modalOverlay} onPress={() => setDeleteConfirmVisible(false)}>
                        <Pressable style={styles.deleteSheet} onPress={() => { }}>
                            <View style={styles.deleteIconWrap}>
                                <Ionicons name="trash-outline" size={26} color="#D14343" />
                            </View>
                            <Text style={styles.deleteTitle}>Delete Dream?</Text>
                            <Text style={styles.deleteDesc}>
                                This action cannot be undone. Your dream and its interpretation will be permanently removed.
                            </Text>
                            <View style={styles.deleteActions}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    activeOpacity={0.8}
                                    onPress={() => setDeleteConfirmVisible(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.confirmDeleteBtn}
                                    activeOpacity={0.85}
                                    onPress={handleDeleteDream}
                                >
                                    <Text style={styles.confirmDeleteBtnText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* ── EDITORIAL YAZAR & TARİH ── */}
                    <View style={styles.editorialHeader}>
                        <Text style={styles.dateText}>{formatEditorialDate(dream.createdAt)}</Text>
                        <Text style={styles.narratedBy}>Narrated by {dream.nickname}</Text>
                    </View>

                    {/* ── STITCHED PAPER CARD (Kağıt Formu) ── */}
                    <View style={styles.cardWrapper}>
                        <Animated.View
                            entering={FadeInUp.delay(100)}
                            style={styles.mainCard}
                            needsOffscreenAlphaCompositing={true}
                        >
                            {/* 4 Köşe Köşebentleri (Minimalist Corner Brackets) */}
                            <CornerBracket position="top-left" />
                            <CornerBracket position="top-right" />

                            <Text style={styles.dreamTitle}>“{dream.title}”</Text>
                            <Text style={styles.dreamDescription}>{dream.description}</Text>

                            <CornerBracket position="bottom-left" />
                            <CornerBracket position="bottom-right" />
                        </Animated.View>
                    </View>

                    {/* ── RÜYA YORUMU ALANI ── */}
                    {isOwnDream && (
                        <View style={styles.interpretationSection}>
                            {/* Analiz & Sonuç State'leri */}
                            {interpretation && (
                                <>
                                    {/* Tabs Menu */}
                                    <View style={styles.tabsContainer}>
                                        <TouchableOpacity
                                            style={[styles.tabButton, activeTab === 'ANALYSIS' && styles.tabButtonActive]}
                                            onPress={() => setActiveTab('ANALYSIS')}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name="stats-chart-outline"
                                                size={15}
                                                color={activeTab === 'ANALYSIS' ? ROSE : TEXT_LIGHT}
                                            />
                                            <Text style={[styles.tabButtonText, activeTab === 'ANALYSIS' && styles.tabButtonTextActive]}>
                                                Analysis
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.tabButton, activeTab === 'INTERPRETATION' && styles.tabButtonActive]}
                                            onPress={() => setActiveTab('INTERPRETATION')}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name="sparkles-outline"
                                                size={15}
                                                color={activeTab === 'INTERPRETATION' ? ROSE : TEXT_LIGHT}
                                            />
                                            <Text style={[styles.tabButtonText, activeTab === 'INTERPRETATION' && styles.tabButtonTextActive]}>
                                                Interpretation
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {activeTab === 'INTERPRETATION' && (
                                        <InterpretationCard
                                            data={interpretation}
                                            isPremiumUnlocked={isPremiumUnlocked}
                                            onUnlock={() => setIsPremiumUnlocked(true)}
                                            hasDreamium={hasDreamium}
                                        />
                                    )}

                                    {activeTab === 'ANALYSIS' && (interpretation as any).emotions && (interpretation as any).themes && (
                                        <EmotionsThemesPanel
                                            emotions={(interpretation as any).emotions}
                                            themes={(interpretation as any).themes}
                                        />
                                    )}
                                </>
                            )}
                        </View>
                    )}

                    {/* Uyarı Mesajı */}
                    {isOwnDream && showLockedMessage && (
                        <Animated.View entering={FadeIn} style={[styles.lockedMessage, { marginHorizontal: 24 }]}>
                            <Ionicons name="information-circle" size={16} color={ROSE} />
                            <Text style={styles.lockedMessageText}>
                                You have used your basic interpretation limit. Upgrade to Premium for more.
                            </Text>
                        </Animated.View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </View>
    );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* STYLES                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    loadingContainer: { justifyContent: 'center', alignItems: 'center' },

    scrollContent: { paddingBottom: 30 },

    /* ── Header ── */
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
    },
    iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

    /* ── Dropdown Menu ── */
    menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'flex-end', paddingTop: 72, paddingRight: 16 },
    menuSheet: {
        width: 250,
        backgroundColor: WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        shadowColor: '#1C1714',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
    },
    menuHeaderSection: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 6,
        backgroundColor: '#FAF9F6',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    menuHeaderTitle: {
        fontFamily: CUSTOM_SERIF,
        fontSize: 10,
        fontWeight: '800',
        color: ROSE,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    menuItem: {
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuItemActive: {
        backgroundColor: 'rgba(138, 51, 66, 0.02)',
    },
    menuIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.04)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: { fontSize: 13.5, fontWeight: '500', color: TEXT_MAIN, flex: 1 },
    menuItemSubtext: { fontSize: 10.5, color: TEXT_LIGHT, marginTop: 2, lineHeight: 14 },
    menuDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.04)', marginHorizontal: 16 },

    /* ── Visibility Modal ── */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(28,23,20,0.45)', justifyContent: 'flex-end' },
    visibilitySheet: {
        backgroundColor: WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 16,
    },
    visibilityHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    visibilityTitle: { fontSize: 17, fontWeight: '700', color: TEXT_MAIN, letterSpacing: 0.2 },
    visibilitySubtitle: { fontSize: 13, color: TEXT_LIGHT, lineHeight: 18, marginBottom: 20 },
    visibilityDivider: { height: 1, backgroundColor: BORDER_FAINT, marginBottom: 16 },
    visibilityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    visibilityOptionActive: {
        backgroundColor: ROSE_SOFT,
        borderColor: 'rgba(138, 51, 66, 0.18)',
    },
    visibilityIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    visibilityOptionTitle: { fontSize: 14, fontWeight: '600', color: TEXT_MAIN, marginBottom: 2 },
    visibilityOptionDesc: { fontSize: 12, color: TEXT_LIGHT, lineHeight: 16 },

    /* ── Delete Confirm Modal ── */
    deleteSheet: {
        backgroundColor: WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 28,
        paddingTop: 32,
        paddingBottom: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 16,
    },
    deleteIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(209,67,67,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteTitle: { fontSize: 18, fontWeight: '700', color: TEXT_MAIN, marginBottom: 10, textAlign: 'center' },
    deleteDesc: { fontSize: 13.5, color: TEXT_MUTED, lineHeight: 20, textAlign: 'center', marginBottom: 28 },
    deleteActions: { flexDirection: 'row', gap: 12, width: '100%' },
    cancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: BORDER_FAINT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: { fontSize: 14, fontWeight: '600', color: TEXT_MUTED },
    confirmDeleteBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#D14343',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#D14343',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmDeleteBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },

    /* ── Typography ── */
    editorialHeader: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
    dateText: { fontFamily: CUSTOM_SERIF, fontSize: 14, color: TEXT_MAIN, letterSpacing: 2, textTransform: 'uppercase' },
    narratedBy: { fontFamily: CUSTOM_SERIF, fontSize: 14, color: ROSE, fontStyle: 'italic', marginTop: 8 },

    /* ── Kağıt Formu & İplikler ── */
    cardWrapper: { alignItems: 'center', marginHorizontal: 20, position: 'relative' },



    mainCard: {
        width: '100%', backgroundColor: PAPER_BG, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 45, zIndex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 15, elevation: 8,
    },

    /* Özel X Dikiş Stilleri */
    stitchXContainer: { position: 'absolute', width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
    stitchLine: { position: 'absolute', width: 14, height: 3, backgroundColor: ROSE, borderRadius: 2 },

    dreamTitle: { fontFamily: CUSTOM_SERIF, fontSize: 20, color: TEXT_MAIN, fontStyle: 'italic', textAlign: 'center', marginBottom: 18, lineHeight: 28 },
    dreamDescription: { fontFamily: CUSTOM_SERIF, fontSize: 14, lineHeight: 26, color: TEXT_MUTED, textAlign: 'center' },

    /* ── Interpretation Buttons ── */
    interpretationSection: { marginHorizontal: 24, marginTop: 35 },
    interpretationButtons: { gap: 14 },
    btnContentCentered: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

    basicBtn: {
        borderRadius: 12,
        backgroundColor: WHITE,
        borderWidth: 1.5,
        borderColor: 'rgba(138, 51, 66, 0.15)',
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    basicBtnDisabled: {
        opacity: 0.6,
        backgroundColor: '#F9F9F9',
        borderColor: 'rgba(0,0,0,0.05)',
    },
    basicBtnText: {
        fontFamily: CUSTOM_SERIF,
        fontSize: 14,
        fontWeight: '500',
        color: ROSE,
        letterSpacing: 0.5,
    },

    advancedBtn: {
        borderRadius: 14,
        backgroundColor: '#A63F4F', // Elegant primary Burgundy
        paddingVertical: 14,
        shadowColor: '#1C1714',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    premiumHookSection: {
        marginHorizontal: 24,
        marginTop: 24,
        marginBottom: 10,
    },
    cornerBracket: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderColor: '#A63F4F', // Core #A63F4F color token
    },
    advancedBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    advancedBtnTitle: {
        fontFamily: CUSTOM_SERIF,
        fontSize: 15,
        fontStyle: 'italic',
        color: WHITE,
        textAlign: 'center',
    },
    advancedBtnSubtitle: {
        fontSize: 10.5,
        color: 'rgba(255, 255, 255, 0.75)',
        marginTop: 3,
        textAlign: 'center',
    },

    /* ── Locked Message & Analyzing & Result ── */
    lockedMessage: {
        flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginTop: 16, backgroundColor: ROSE_SOFT, borderWidth: 1, borderColor: 'rgba(138, 51, 66, 0.08)',
    },
    lockedMessageText: { flex: 1, fontSize: 11, color: TEXT_MUTED, lineHeight: 16 },
    /* ── Interpretation Card & Redesigned Editorial styles ── */
    interpretationContainer: {
        marginTop: 10,
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 12,
    },
    interpTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    interpSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: TEXT_MAIN,
    },
    interpParagraph: {
        fontSize: 14.5,
        lineHeight: 22,
        color: TEXT_MUTED,
        marginBottom: 24,
    },
    advancedSection: {
        marginTop: 5,
    },
    lockedSection: {
        marginTop: 10,
    },
    premiumCard: {
        borderTopLeftRadius: 36,
        borderBottomRightRadius: 36,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
        marginTop: 8,
    },
    premiumCardInner: {
        flex: 1,
        borderTopLeftRadius: 26,
        borderBottomRightRadius: 26,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        padding: 16,
    },
    premiumCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    premiumCardDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginBottom: 16,
    },
    advancedCardDivider: {
        height: 1,
        backgroundColor: 'rgba(138, 51, 66, 0.10)',
        marginBottom: 16,
    },
    premiumCardTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: WHITE,
        flex: 1,
    },
    benefitList: {
        marginTop: 4,
        gap: 14,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    benefitIcon: {
        marginRight: 10,
        marginTop: 2,
    },
    benefitTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: TEXT_MAIN,
        marginBottom: 2,
    },
    benefitDesc: {
        fontSize: 12,
        color: TEXT_MUTED,
        lineHeight: 16,
    },
    benefitTitleDark: {
        fontSize: 14,
        fontWeight: '700',
        color: WHITE,
        marginBottom: 2,
    },
    benefitDescDark: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.52)',
        lineHeight: 16,
    },
    premiumUnlockButtonTouch: {
        marginTop: 16,
        width: '100%',
        borderRadius: 12,
        shadowColor: ROSE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    premiumUnlockButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: 12,
        width: '100%',
    },
    premiumUnlockButtonText: {
        color: WHITE,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    /* ── Emotions & Themes Stats Card ── */
    statsCard: {
        flexDirection: 'row',
        backgroundColor: WHITE,
        borderRadius: 20,
        marginTop: 16,
        paddingVertical: 24,
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: BORDER_FAINT,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        overflow: 'hidden',
    },
    statsHalf: {
        flex: 1,
        paddingHorizontal: 18,
    },
    statsVerticalSep: {
        width: 1,
        backgroundColor: BORDER_FAINT,
        marginVertical: 4,
    },
    statsHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 8,
    },
    statsTitle: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 2.5,
    },
    statsDivider: {
        height: 1,
        backgroundColor: BORDER_FAINT,
        marginBottom: 12,
    },
    statBarRow: {
        marginBottom: 10,
    },
    statBarLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 7,
    },
    statBarLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: TEXT_MAIN,
    },
    statBarTrack: {
        height: 7,
        borderRadius: 999,
        backgroundColor: 'rgba(28,23,20,0.07)',
        overflow: 'hidden',
    },
    statBarFill: {
        height: '100%',
        borderRadius: 999,
    },

    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        borderRadius: 999,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        marginBottom: 22,
    },
    tabButton: {
        flex: 1,
        minHeight: 38,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    tabButtonActive: {
        backgroundColor: WHITE,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    tabButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: TEXT_LIGHT,
    },
    tabButtonTextActive: {
        fontSize: 12,
        fontWeight: '800',
        color: ROSE,
    },

    /* ── Analysis Panel ── */
    analysisPanel: {
        marginTop: 10,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    analysisSection: {
        paddingVertical: 4,
    },
    analysisSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
    },
    analysisIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    analysisSectionTitle: {
        fontFamily: CUSTOM_SERIF,
        fontSize: 18,
        color: TEXT_MAIN,
        fontWeight: '600',
        marginBottom: 2,
    },
    analysisSectionDesc: {
        fontSize: 12,
        color: TEXT_LIGHT,
        lineHeight: 16,
    },
    analysisList: {
        gap: 16,
    },
    analysisBarContainer: {
        flex: 1,
    },
    analysisBarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    analysisBarLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: TEXT_MUTED,
    },
    analysisBarTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.04)',
        overflow: 'hidden',
    },
    analysisBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    analysisDivider: {
        height: 1,
        backgroundColor: BORDER_FAINT,
        marginVertical: 24,
    },
    advancedUnlockedCardContainer: {
        marginTop: 15,
        width: '100%',
    },
    advancedUnlockedCard: {
        borderTopLeftRadius: 36,
        borderBottomRightRadius: 36,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        padding: 10,
        backgroundColor: WHITE,
        shadowColor: '#1C1714',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
        elevation: 4,
    },
    advancedUnlockedCardInner: {
        flex: 1,
        borderTopLeftRadius: 26,
        borderBottomRightRadius: 26,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(138, 51, 66, 0.16)',
        padding: 18,
    },

    unlockedHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 14,
    },
    unlockedEyebrowRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    unlockedEyebrowText: {
        fontSize: 9.5,
        fontWeight: '800',
        color: ROSE,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    unlockedTitleText: {
        fontFamily: CUSTOM_SERIF,
        fontSize: 24,
        fontWeight: '700',
        color: TEXT_MAIN,
        lineHeight: 29,
    },
    unlockedSubtitleText: {
        marginTop: 4,
        fontSize: 12.5,
        lineHeight: 17,
        color: TEXT_MUTED,
    },

    unifiedProgressionCard: {
        borderRadius: 16,
        padding: 14,
        backgroundColor: 'rgba(138, 51, 66, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(138, 51, 66, 0.08)',
        marginBottom: 16,
    },
    synthesisMetaText: {
        fontSize: 12,
        color: TEXT_MAIN,
        lineHeight: 16,
        fontWeight: '700',
    },
    synthesisMetaStrong: {
        fontWeight: '800',
        color: ROSE,
    },
    synthesisMetaBody: {
        marginTop: 5,
        fontSize: 12,
        color: TEXT_MUTED,
        lineHeight: 17,
    },
    timelineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    timelineHeaderText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    miniDreamRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    miniDreamCardShadow: {
        flex: 1,
        shadowColor: '#1C1714',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
    },
    miniDreamCard: {
        flex: 1,
        backgroundColor: WHITE,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(138, 51, 66, 0.08)',
        padding: 8,
        minHeight: 64,
        justifyContent: 'center',
    },

    miniDreamDate: {
        fontSize: 9.5,
        fontWeight: '700',
        color: ROSE,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 3,
    },
    miniDreamTitle: {
        fontFamily: CUSTOM_SERIF,
        fontSize: 11,
        fontWeight: '600',
        color: TEXT_MAIN,
        lineHeight: 14,
    },
    synthesisContent: {
        gap: 13,
    },

    advancedInterpretationTitle: {
        fontFamily: CUSTOM_SERIF,
        fontSize: 17,
        fontWeight: '700',
        color: TEXT_MAIN,
        lineHeight: 21,
    },

    advancedInterpretationText: {
        fontFamily: CUSTOM_SERIF,
        fontSize: 14,
        lineHeight: 22,
        color: TEXT_MUTED,
    },
    takeawayBlock: {
        backgroundColor: 'rgba(138, 51, 66, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(138, 51, 66, 0.12)',
        padding: 13,
        borderRadius: 16,
        marginTop: 8,
    },
    takeawayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    takeawayLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: ROSE,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    takeawayText: {
        fontFamily: CUSTOM_SERIF,
        fontSize: 13,
        fontStyle: 'italic',
        lineHeight: 19,
        color: TEXT_MUTED,
    },


    generatingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 35,
    },
    moonLoaderWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: ROSE_SOFT,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(138, 51, 66, 0.15)',
    },
    generatingStepText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 25,
        height: 20,
    },
    generatingProgressTrack: {
        width: '80%',
        height: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: ROSE,
        borderRadius: 3,
    },
    progressBarFillIndeterminate: {
        position: 'absolute',
        height: '100%',
        width: '40%',
        backgroundColor: ROSE,
        borderRadius: 3,
    },
    timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(138, 51, 66, 0.15)', borderWidth: 1, borderColor: ROSE },
    timelineDotActive: { backgroundColor: ROSE, shadowColor: ROSE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 4 },
});
