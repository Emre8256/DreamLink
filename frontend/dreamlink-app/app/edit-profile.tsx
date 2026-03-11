
import React, { useState, useEffect } from 'react';
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
import { useNavigation, router } from 'expo-router';
import { getMyProfile, updateProfile, UpdateProfileRequest } from '../services/api';

export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [nickname, setNickname] = useState('');
    const [bio, setBio] = useState('');
    const [age, setAge] = useState('');
    const [location, setLocation] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const profile = await getMyProfile();
            setNickname(profile.nickname);
            setBio(profile.bio || '');
            setAge(profile.age ? profile.age.toString() : '');
            setLocation(profile.location || '');
        } catch (err) {
            console.error('Failed to load profile:', err);
            setError('Profil bilgileri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setError(null);
        setSaving(true);

        try {
            const updateData: UpdateProfileRequest = {
                nickname,
                bio,
                age: age ? parseInt(age) : undefined,
                location
            };

            await updateProfile(updateData);
            router.back();
        } catch (err: any) {
            console.error('Update Error:', err);
            setError('Profil güncellenemedi. Lütfen tekrar deneyin.');
        } finally {
            setSaving(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#7E6BFF" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#2D2D3A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profili Düzenle</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 20 }
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                    <View style={styles.formContainer}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Rumuz (Nickname)</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#8A8CA8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={nickname}
                                    onChangeText={setNickname}
                                    placeholder="Rumuzunuz"
                                    placeholderTextColor="#C1C8FF"
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Hakkımda (Bio)</Text>
                            <View style={[styles.inputContainer, styles.bioInputContainer]}>
                                <TextInput
                                    style={[styles.input, styles.bioInput]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Kendinizden bahsedin..."
                                    placeholderTextColor="#C1C8FF"
                                    multiline
                                    maxLength={500}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputWrapper, { flex: 1, marginRight: 12 }]}>
                                <Text style={styles.label}>Yaş</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="calendar-outline" size={20} color="#8A8CA8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={age}
                                        onChangeText={setAge}
                                        placeholder="Yaş"
                                        placeholderTextColor="#C1C8FF"
                                        keyboardType="numeric"
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
                                        value={location}
                                        onChangeText={setLocation}
                                        placeholder="Konum"
                                        placeholderTextColor="#C1C8FF"
                                    />
                                </View>
                            </View>
                        </View>

                        {error && <Text style={styles.errorText}>{error}</Text>}

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Kaydet</Text>
                        )}
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
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF1FF',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D2D3A',
    },
    scrollContent: {
        padding: 24,
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
    bioInputContainer: {
        height: 120,
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2D2D3A',
    },
    bioInput: {
        textAlignVertical: 'top',
    },
    errorText: {
        fontSize: 13,
        color: '#FF6B6B',
        marginTop: 4,
        marginBottom: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    saveButton: {
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
    saveButtonDisabled: {
        backgroundColor: '#C1C8FF',
        shadowOpacity: 0.1,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
