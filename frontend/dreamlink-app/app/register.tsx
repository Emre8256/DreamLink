
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
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister, login as apiLogin, AuthRequest } from '../services/api';
import { router } from 'expo-router';

const resolveRegisterError = (err: unknown, fallback: string) => {
    if (err && typeof err === 'object') {
        const message = 'message' in err ? String((err as { message?: string }).message || '') : '';
        if (message && !message.includes('Failed to register') && !message.includes('<') && !message.includes('{')) {
            return message;
        }
    }
    return fallback;
};

export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [bio, setBio] = useState('');
    const [age, setAge] = useState('');
    const [location, setLocation] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async () => {
        setError(null);

        // Basic Validation
        if (!email || !password || !nickname || !age) {
            setError('Lütfen zorunlu alanları doldurunuz.');
            return;
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        const parsedAge = parseInt(age);
        if (isNaN(parsedAge) || parsedAge < 13) {
            setError('Yaşınız 13 veya üzeri olmalıdır.');
            return;
        }

        setLoading(true);

        try {
            // 1. Register API Call
            const registerData: AuthRequest = {
                email,
                password,
                nickname,
                bio,
                age: parsedAge,
                location: location || undefined
            };

            await apiRegister(registerData);

            // 2. Auto Login after Registration
            const token = await apiLogin({ email, password });

            // 3. Save Token & Redirect (handled by context)
            await login(token);

        } catch (err: any) {
            console.error('Register Error:', err);
            setError(resolveRegisterError(err, 'Kayıt işlemi başarısız. Bilgilerinizi kontrol edin veya daha sonra tekrar deneyin.'));
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/login');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Ionicons name="arrow-back" size={24} color="#2D2D3A" />
                    </TouchableOpacity>

                    {/* Header Section */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Hesap Oluştur</Text>
                        <Text style={styles.subtitle}>DreamLink topluluğuna katıl</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>

                        {/* Nickname Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Rumuz (Nickname)*</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#8A8CA8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="RüyaGezgini"
                                    placeholderTextColor="#C1C8FF"
                                    value={nickname}
                                    onChangeText={setNickname}
                                />
                            </View>
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>E-posta*</Text>
                            <View style={styles.inputContainer}>
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
                            <Text style={styles.label}>Şifre*</Text>
                            <View style={styles.inputContainer}>
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
                        </View>

                        {/* Bio Input (Optional) */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Hakkımda (Bio - Opsiyonel)</Text>
                            <View style={[styles.inputContainer, { height: 80, alignItems: 'flex-start', paddingVertical: 12 }]}>
                                <TextInput
                                    style={[styles.input, { textAlignVertical: 'top' }]}
                                    placeholder="Kendinden bahset..."
                                    placeholderTextColor="#C1C8FF"
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                    maxLength={500}
                                />
                            </View>
                        </View>

                        {/* Age & Location Row */}
                        <View style={styles.row}>
                            <View style={[styles.inputWrapper, { flex: 1, marginRight: 12 }]}>
                                <Text style={styles.label}>Yaş*</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="calendar-outline" size={20} color="#8A8CA8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="18"
                                        placeholderTextColor="#C1C8FF"
                                        keyboardType="numeric"
                                        value={age}
                                        onChangeText={setAge}
                                        maxLength={3}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputWrapper, { flex: 1 }]}>
                                <Text style={styles.label}>Konum</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="location-outline" size={20} color="#8A8CA8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="İstanbul"
                                        placeholderTextColor="#C1C8FF"
                                        value={location}
                                        onChangeText={setLocation}
                                    />
                                </View>
                            </View>
                        </View>

                        {error && <Text style={styles.errorText}>{error}</Text>}

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                            )}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <TouchableOpacity style={styles.loginLink} onPress={handleGoBack} activeOpacity={0.7}>
                            <Text style={styles.loginText}>
                                Zaten hesabın var mı? <Text style={styles.loginTextBold}>Giriş Yap</Text>
                            </Text>
                        </TouchableOpacity>

                    </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    backButton: {
        marginBottom: 24,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#2D2D3A',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2D2D3A',
    },
    errorText: {
        fontSize: 13,
        color: '#FF6B6B',
        marginTop: 4,
        marginBottom: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    registerButton: {
        backgroundColor: '#7E6BFF',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#7E6BFF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    registerButtonDisabled: {
        backgroundColor: '#C1C8FF',
        shadowOpacity: 0.1,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    loginLink: {
        marginTop: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    loginText: {
        fontSize: 14,
        color: '#8A8CA8',
    },
    loginTextBold: {
        color: '#7E6BFF',
        fontWeight: '700',
    },
});
