import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EdgeToEdgeLayout } from '../components/EdgeToEdgeLayout';
import { AnimatedPressable } from '../components/AnimatedPressable';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const insets = useSafeAreaInsets();

    // Animations
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(20)).current;
    const glowAnim = useRef(new Animated.Value(0.2)).current;

    useEffect(() => {
        // Ken Burns effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.15,
                    duration: 20000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 20000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Fade Up effect
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                delay: 200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(translateYAnim, {
                toValue: 0,
                duration: 800,
                delay: 200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            })
        ]).start();

        // Glow effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.6,
                    duration: 3000,
                    useNativeDriver: false, // TextShadow can't use native driver
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.2,
                    duration: 3000,
                    useNativeDriver: false,
                })
            ])
        ).start();
    }, []);

    const glowStyle = {
        textShadowColor: glowAnim.interpolate({
            inputRange: [0.2, 0.6],
            outputRange: ['rgba(183, 110, 121, 0.2)', 'rgba(183, 110, 121, 0.6)']
        }),
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: glowAnim.interpolate({
            inputRange: [0.2, 0.6],
            outputRange: [5, 15]
        })
    };

    return (
        <EdgeToEdgeLayout backgroundColor="#121212" statusBarStyle="light-content" statusBarBg="#121212">
            <View style={styles.container}>
                {/* Background Layer */}
                <View style={StyleSheet.absoluteFill}>
                    <Animated.Image
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB77wcWuewCTlP_OPp9rBxds8qQ4wYBYtBT7NrqKbrBnbp5-Cm9WkiR_HmKu3FBiVt-XCW4IEEmlzR4NKTeeF2THz40-hlIX0ZGAz0UIBRbkapfToRlKiN3qjbuaZXjBflre6GWHSylAa3Hyxe3ywUx765BqkxZIbAc_YCHLliEiqOvTraH7AIPgvuC0x70cthUpa9GFVGLiPmVruKNoxX602-7CY__aWSCKlvnQ1DKcSzYxWgjZ018COL1uv87CZ5vc-hCJD7nY-w' }}
                        style={[styles.backgroundImage, { transform: [{ scale: scaleAnim }] }]}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
                        locations={[0, 0.6, 1]}
                        style={StyleSheet.absoluteFill}
                    />
                </View>

                {/* Main Content */}
                <View style={[styles.main, { paddingTop: 64, paddingBottom: Platform.OS === 'ios' ? insets.bottom + 48 : 48 }]}>
                {/* Top Branding */}
                <Animated.View style={[styles.brandingContainer, { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }]}>
                    <Animated.Text style={[styles.logo, glowStyle]}>DREAM-LINK</Animated.Text>
                </Animated.View>

                {/* Onboarding Card */}
                <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }]}>
                    <View style={styles.copySection}>
                        <Text style={styles.title}>Find your missing piece.</Text>
                        <Text style={styles.subtitle}>Join the most exclusive community.</Text>
                    </View>

                    <View style={styles.actionSection}>
                        <AnimatedPressable style={styles.primaryButton} hapticType="light" onPress={() => router.push('/register')}>
                            <Text style={styles.primaryButtonText}>CREATE AN ACCOUNT</Text>
                        </AnimatedPressable>

                        <AnimatedPressable style={styles.secondaryButton} hapticType="light" onPress={() => router.push('/login')}>
                            <Text style={styles.secondaryButtonText}>I have an account</Text>
                        </AnimatedPressable>
                    </View>

                    <View style={styles.legalSection}>
                        <View style={styles.legalLinks}>
                            <Text style={styles.legalText}>TERMS OF SERVICE</Text>
                            <Text style={styles.legalDot}>•</Text>
                            <Text style={styles.legalText}>PRIVACY POLICY</Text>
                        </View>
                    </View>
                </Animated.View>
                </View>
            </View>
        </EdgeToEdgeLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    backgroundImage: {
        width: width,
        height: height,
    },
    main: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    brandingContainer: {
        alignItems: 'center',
    },
    logo: {
        fontSize: 32,
        fontWeight: '800',
        color: '#B76E79',
        letterSpacing: 4.8, // roughly 0.15em tracking
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 40,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    copySection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 30,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
    },
    actionSection: {
        width: '100%',
        marginBottom: 24,
    },
    primaryButton: {
        backgroundColor: '#B76E79',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#B76E79',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    legalSection: {
        alignItems: 'center',
    },
    legalLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    legalText: {
        fontSize: 10,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: 2,
    },
    legalDot: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
    }
});
