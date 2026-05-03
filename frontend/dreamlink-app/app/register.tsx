import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Linking, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister, login as apiLogin, AuthRequest } from '../services/api';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { EdgeToEdgeLayout } from '../components/EdgeToEdgeLayout';

const { width, height } = Dimensions.get('window');

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
    const [eulaAccepted, setEulaAccepted] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async () => {
        setError(null);

        if (!email || !password || !nickname || !age) {
            setError('Please fill in all required fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        const parsedAge = parseInt(age);
        if (isNaN(parsedAge) || parsedAge < 13) {
            setError('You must be 13 or older.');
            return;
        }

        if (!eulaAccepted) {
            setError('You must accept the Terms & Conditions to continue.');
            return;
        }

        setLoading(true);

        try {
            const registerData: AuthRequest = {
                email,
                password,
                nickname,
                bio,
                age: parsedAge,
                location: location || undefined,
                eulaAccepted: true,
                eulaAcceptedAt: new Date().toISOString(),
            };

            await apiRegister(registerData);
            const token = await apiLogin({ email, password });
            await login(token);
        } catch (err: any) {
            console.error('Register Error:', err);
            setError(resolveRegisterError(err, 'Registration failed. Please check your information or try again later.'));
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
                   showsVerticalScrollIndicator={false}
                >
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.topBarTitle}>DREAM-LINK</Text>
                    <View style={styles.backButtonPlaceholder} />
                </View>

                {/* Header Content */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Let's get started.</Text>
                    <Text style={styles.subtitle}>Enter your details to find your missing piece.</Text>
                </View>

                {/* Register Form */}
                <View style={styles.formContainer}>
                    
                    {/* Nickname Input */}
                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Nickname</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your nickname"
                                placeholderTextColor="#64748b"
                                value={nickname}
                                onChangeText={setNickname}
                            />
                        </View>
                    </View>

                    {/* Email Field */}
                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={[styles.inputContainer, error && (!email) ? styles.inputError : null]}>
                            <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="example@email.com"
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
                        <View style={[styles.inputContainer, error && (!password || password.length < 6) ? styles.inputError : null]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Create a password"
                                placeholderTextColor="#64748b"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Age & Location Row */}
                    <View style={styles.row}>
                        <View style={[styles.inputWrapper, { flex: 1, marginRight: 12 }]}>
                            <Text style={styles.label}>Age</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="calendar-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="21"
                                    placeholderTextColor="#64748b"
                                    keyboardType="numeric"
                                    value={age}
                                    onChangeText={setAge}
                                    maxLength={3}
                                />
                            </View>
                        </View>

                        <View style={[styles.inputWrapper, { flex: 1 }]}>
                            <Text style={styles.label}>Location</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="location-outline" size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="New York"
                                    placeholderTextColor="#64748b"
                                    value={location}
                                    onChangeText={setLocation}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Bio Input */}
                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Bio (Optional)</Text>
                        <View style={[styles.inputContainer, { height: 'auto', minHeight: 60, paddingVertical: 12 }]}>
                            <Ionicons name="information-circle-outline" size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { textAlignVertical: 'top' }]}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor="#64748b"
                                value={bio}
                                onChangeText={setBio}
                                multiline
                                maxLength={500}
                            />
                        </View>
                    </View>

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    {/* EULA Row */}
                    <TouchableOpacity
                        style={styles.eulaRow}
                        onPress={() => setEulaAccepted((prev) => !prev)}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={eulaAccepted ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={eulaAccepted ? '#B3717A' : '#64748b'}
                        />
                        <View style={styles.eulaTextContainer}>
                            <Text style={styles.eulaText}>
                                I accept the Terms & Conditions.
                            </Text>
                            <Text
                                style={styles.eulaLink}
                                onPress={() => Linking.openURL('https://dreamlink.app/eula').catch(() => undefined)}
                            >
                                Read
                            </Text>
                        </View>
                    </TouchableOpacity>

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
                            <Text style={styles.registerButtonText}>Continue</Text>
                        )}
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>
                            Already have an account?{' '}
                        </Text>
                        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/login')}>
                            <Text style={styles.footerTextBold}>Sign In</Text>
                        </TouchableOpacity>
                    </View>

                </View>
                
                {/* Spacer to push terms to bottom */}
                <View style={{ flex: 1 }} />

                {/* Terms Footer */}
                <View style={styles.bottomTerms}>
                    <Text style={styles.bottomTermsText}>
                        BY TAPPING CONTINUE, YOU AGREE TO OUR TERMS & PRIVACY POLICY
                    </Text>
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
    topBarTitle: {
        color: 'rgba(179, 113, 122, 0.8)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    backButtonPlaceholder: {
        width: 40,
    },
    headerContainer: {
        paddingHorizontal: 32,
        paddingTop: 16,
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    inputIcon: {
        marginRight: 12,
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
    eulaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: -4,
    },
    eulaTextContainer: {
        flexDirection: 'row',
        marginLeft: 12,
        flexWrap: 'wrap',
    },
    eulaText: {
        color: '#cbd5e1',
        fontSize: 13,
        marginRight: 4,
    },
    eulaLink: {
        color: '#B3717A',
        fontSize: 13,
        fontWeight: '700',
    },
    registerButton: {
        backgroundColor: '#B3717A',
        borderRadius: 30,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#B3717A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    registerButtonDisabled: {
        backgroundColor: 'rgba(179, 113, 122, 0.5)',
        shadowOpacity: 0.1,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 24,
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
    bottomTerms: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 16,
        opacity: 0.8,
    },
    bottomTermsText: {
        fontSize: 10,
        color: '#64748b',
        textAlign: 'center',
        letterSpacing: 1.5,
        lineHeight: 16,
    }
});
