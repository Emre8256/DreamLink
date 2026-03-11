
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';
import { router } from 'expo-router';

const resolveLoginError = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object') {
        const status = 'status' in err ? (err as { status?: number }).status : undefined;
        const message = 'message' in err ? String((err as { message?: string }).message || '') : '';

        if (status === 401) return 'E-posta veya şifre hatalı.';
        if (message.includes('Bad credentials')) return 'E-posta veya şifre hatalı.';
        if (message.includes('Kullanıcı bulunamadı')) return 'E-posta veya şifre hatalı.';
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
        // Reset error
        setError(null);

        // Basic Validation
        if (!email || !password) {
            setError('Lütfen e-posta ve şifrenizi giriniz.');
            return;
        }

        setLoading(true);

        try {
            // 1. API Call
            const token = await apiLogin({ email, password });

            // 2. Auth Context Call (Save Token)
            await login(token);

            // 3. Redirect is handled in _layout.tsx via AuthContext listener
            // but strictly speaking we can also push here for immediate feedback if layout is slow
            // router.replace('/(tabs)'); 

        } catch (err: any) {
            console.error('Login Error:', err);
            // Backend error message or generic fallback
            setError(resolveLoginError(err, 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.contentContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIconContainer}>
                            <Ionicons name="moon" size={48} color="#7E6BFF" />
                        </View>
                        <Text style={styles.appName}>DreamLink</Text>
                        <Text style={styles.tagline}>Rüyalarınızı bağlayın</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>

                        {/* Email Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>E-posta</Text>
                            <View style={[styles.inputContainer, error && !email ? styles.inputError : null]}>
                                <Ionicons name="mail-outline" size={20} color="#8A8CA8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="ornek@email.com"
                                    placeholderTextColor="#C1C8FF"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Şifre</Text>
                            <View style={[styles.inputContainer, error && !password ? styles.inputError : null]}>
                                <Ionicons name="lock-closed-outline" size={20} color="#8A8CA8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="******"
                                    placeholderTextColor="#C1C8FF"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8A8CA8" />
                                </TouchableOpacity>
                            </View>
                            {error && <Text style={styles.errorText}>{error}</Text>}
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.loginButtonText}>Giriş Yap</Text>
                            )}
                        </TouchableOpacity>

                        {/* Register Link */}
                        <TouchableOpacity style={styles.registerLink} activeOpacity={0.7} onPress={() => router.push('/register')}>
                            <Text style={styles.registerText}>
                                Hesabın yok mu? <Text style={styles.registerTextBold}>Kayıt Ol</Text>
                            </Text>
                        </TouchableOpacity>

                    </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(126, 107, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#2D2D3A',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 16,
        color: '#8A8CA8',
        fontWeight: '500',
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2D2D3A',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#F1F3FF',
    },
    inputError: {
        borderColor: '#FF6B6B',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2D2D3A',
    },
    errorText: {
        fontSize: 12,
        color: '#FF6B6B',
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#7E6BFF',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#7E6BFF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    loginButtonDisabled: {
        backgroundColor: '#C1C8FF',
        shadowOpacity: 0.1,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    registerLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    registerText: {
        fontSize: 14,
        color: '#8A8CA8',
    },
    registerTextBold: {
        color: '#7E6BFF',
        fontWeight: '700',
    },
});
