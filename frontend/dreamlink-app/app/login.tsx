import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { EdgeToEdgeLayout } from '../components/EdgeToEdgeLayout';
import { AnimatedPressable } from '../components/AnimatedPressable';

const { width, height } = Dimensions.get('window');

const resolveLoginError = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object') {
        const status = 'status' in err ? (err as { status?: number }).status : undefined;
        const message = 'message' in err ? String((err as { message?: string }).message || '') : '';

        if (status === 401) return 'Incorrect email or password.';
        if (message.includes('Bad credentials')) return 'Incorrect email or password.';
        if (message.includes('Kullanıcı bulunamadı')) return 'Incorrect email or password.';
        if (message && !message.includes('Failed to login') && !message.includes('<') && !message.includes('{')) {
            return message;
        }
    }
    return fallback;
};

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setError(null);
        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }
        setLoading(true);
        try {
            const token = await apiLogin({ email, password });
            await login(token);
        } catch (err: any) {
            console.error('Login Error:', err);
            setError(resolveLoginError(err, 'Login failed. Please check your credentials.'));
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/welcome');
        }
    };

    return (
        <EdgeToEdgeLayout backgroundColor="#0a0705" statusBarStyle="light-content" statusBarBg="#0a0705">
            <View style={styles.container}>
                {/* Background Layer */}
                <View style={StyleSheet.absoluteFill}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop' }}
                        style={styles.backgroundImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['rgba(10, 7, 5, 0.7)', 'rgba(10, 7, 5, 0.98)']}
                        style={StyleSheet.absoluteFill}
                    />
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

                <ScrollView
                   contentContainerStyle={{ flexGrow: 1, paddingBottom: Platform.OS === 'ios' ? insets.bottom : 24 }}
                   keyboardShouldPersistTaps="handled"
                >
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Header Content */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Welcome back.</Text>
                    <Text style={styles.subtitle}>Sign in to continue your journey.</Text>
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                    
                    {/* Email Field */}
                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={[styles.inputContainer, error && !email ? styles.inputError : null]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#64748b"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    {/* Password Field */}
                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Password</Text>
                        <View style={[styles.inputContainer, error && !password ? styles.inputError : null]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor="#64748b"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.forgotPasswordContainer}>
                            <TouchableOpacity activeOpacity={0.7}>
                                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    {/* Login Button */}
                    <AnimatedPressable
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        hapticType="light"
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.loginButtonText}>Log In</Text>
                        )}
                    </AnimatedPressable>
                </View>

                {/* Spacer to push footer to bottom */}
                <View style={{ flex: 1 }} />

                {/* Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>
                        Don't have an account?{' '}
                    </Text>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/register')}>
                        <Text style={styles.footerTextBold}>Sign up</Text>
                    </TouchableOpacity>
                </View>
                </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </EdgeToEdgeLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0705',
    },
    backgroundImage: {
        width: width,
        height: height,
        position: 'absolute',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    headerContainer: {
        paddingHorizontal: 32,
        paddingTop: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: '#cbd5e1',
    },
    formContainer: {
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#e2e8f0',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        paddingHorizontal: 20,
        height: 60,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputError: {
        borderColor: '#FF6B6B',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '400',
    },
    eyeIcon: {
        padding: 4,
    },
    errorText: {
        fontSize: 13,
        color: '#FF6B6B',
        marginTop: 4,
        marginBottom: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    forgotPasswordContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    forgotPasswordText: {
        color: '#B3717A',
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#B3717A',
        borderRadius: 30,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#B3717A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    loginButtonDisabled: {
        backgroundColor: 'rgba(179, 113, 122, 0.5)',
        shadowOpacity: 0.1,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 24,
    },
    footerText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    footerTextBold: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
