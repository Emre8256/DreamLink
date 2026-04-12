
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
    Image,
    Modal,
    Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, router } from 'expo-router';
import { getMyProfile, updateProfile, UpdateProfileRequest } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

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
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    const [avatarDraftUrl, setAvatarDraftUrl] = useState('');

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
            setAvatarUrl(profile.avatarUrl || '');
        } catch (err) {
            console.error('Failed to load profile:', err);
            setError('Failed to load profile.');
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
                location,
                avatarUrl: avatarUrl ? avatarUrl : null,
            };

            await updateProfile(updateData);
            router.back();
        } catch (err: any) {
            console.error('Update Error:', err);
            setError('Profile update failed. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    if (loading) {
        return (
            <LinearGradient
              colors={['#e0f2fe', '#f1f5f9', '#fdf2f2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.container, styles.center]}
            >
              <ActivityIndicator size="large" color="#B3717A" />
            </LinearGradient>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
              colors={['#e0f2fe', '#f1f5f9', '#fdf2f2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.container}
            >
              <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                  <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                      <Ionicons name="chevron-back" size={28} color="#64748b" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Edit Profile</Text>
                  <View style={{ width: 40 }} />
              </View>

              <ScrollView
                  contentContainerStyle={[
                      styles.scrollContent,
                      { paddingBottom: insets.bottom + 28 }
                  ]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
              >
                  <View style={styles.formContainer}>
                      {/* Avatar */}
                      <View style={styles.avatarCard}>
                        <View style={styles.avatarRow}>
                          <View style={styles.avatarWrap}>
                            {avatarUrl ? (
                              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                            ) : (
                              <View style={styles.avatarFallback}>
                                <Ionicons name="person" size={26} color="#B3717A" />
                              </View>
                            )}
                            <Pressable
                              onPress={() => {
                                setAvatarDraftUrl(avatarUrl);
                                setAvatarModalVisible(true);
                              }}
                              style={styles.avatarEditBtn}
                              android_ripple={{ color: 'rgba(179,113,122,0.12)' }}
                            >
                              <Ionicons name="camera-outline" size={16} color="#fff" />
                            </Pressable>
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.avatarTitle}>Profile photo</Text>
                            <Text style={styles.avatarSub} numberOfLines={2}>
                              Add a photo so people can recognize you.
                            </Text>
                          </View>
                        </View>

                        <Pressable
                          onPress={() => {
                            setAvatarDraftUrl(avatarUrl);
                            setAvatarModalVisible(true);
                          }}
                          style={({ pressed }) => [styles.avatarChangeBtn, pressed && { opacity: 0.92 }]}
                        >
                          <Text style={styles.avatarChangeBtnText}>
                            {avatarUrl ? 'Change photo' : 'Add photo'}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color="rgba(51,65,85,0.50)" />
                        </Pressable>
                      </View>

                      {/* Inputs */}
                      <View style={styles.glassCard}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Nickname</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="rgba(100,116,139,0.75)" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={nickname}
                                    onChangeText={setNickname}
                                    placeholder="Your nickname"
                                    placeholderTextColor="rgba(100,116,139,0.45)"
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>About</Text>
                            <View style={[styles.inputContainer, styles.bioInputContainer]}>
                                <TextInput
                                    style={[styles.input, styles.bioInput]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Tell us about yourself..."
                                    placeholderTextColor="rgba(100,116,139,0.45)"
                                    multiline
                                    maxLength={500}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputWrapper, { flex: 1, marginRight: 12 }]}>
                                <Text style={styles.label}>Age</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="calendar-outline" size={20} color="rgba(100,116,139,0.75)" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={age}
                                        onChangeText={setAge}
                                        placeholder="Age"
                                        placeholderTextColor="rgba(100,116,139,0.45)"
                                        keyboardType="numeric"
                                        maxLength={3}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputWrapper, { flex: 1 }]}>
                                <Text style={styles.label}>Location</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="location-outline" size={20} color="rgba(100,116,139,0.75)" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={location}
                                        onChangeText={setLocation}
                                        placeholder="City, Country"
                                        placeholderTextColor="rgba(100,116,139,0.45)"
                                    />
                                </View>
                            </View>
                        </View>
                      </View>

                      {error && <Text style={styles.errorText}>{error}</Text>}

                      <TouchableOpacity
                          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                          onPress={handleSave}
                          disabled={saving}
                          activeOpacity={0.9}
                      >
                          {saving ? (
                              <ActivityIndicator color="#FFFFFF" />
                          ) : (
                              <Text style={styles.saveButtonText}>Save changes</Text>
                          )}
                      </TouchableOpacity>
                  </View>
              </ScrollView>

              <Modal
                transparent
                animationType="fade"
                visible={avatarModalVisible}
                onRequestClose={() => setAvatarModalVisible(false)}
              >
                <Pressable style={styles.modalBackdrop} onPress={() => setAvatarModalVisible(false)}>
                  <Pressable style={styles.modalCard} onPress={() => {}}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Profile photo URL</Text>
                      <Pressable onPress={() => setAvatarModalVisible(false)} hitSlop={12}>
                        <Ionicons name="close" size={20} color="rgba(51,65,85,0.7)" />
                      </Pressable>
                    </View>

                    <Text style={styles.modalHint}>
                      Paste an image URL (https://...). This will be used across the app.
                    </Text>

                    <View style={styles.modalInputWrap}>
                      <Ionicons name="link-outline" size={18} color="rgba(100,116,139,0.75)" />
                      <TextInput
                        value={avatarDraftUrl}
                        onChangeText={setAvatarDraftUrl}
                        placeholder="https://example.com/avatar.jpg"
                        placeholderTextColor="rgba(100,116,139,0.45)"
                        style={styles.modalInput}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                      />
                    </View>

                    <View style={styles.modalActions}>
                      <Pressable
                        onPress={() => {
                          setAvatarDraftUrl('');
                          setAvatarUrl('');
                          setAvatarModalVisible(false);
                        }}
                        style={({ pressed }) => [styles.modalGhostBtn, pressed && { opacity: 0.85 }]}
                      >
                        <Text style={styles.modalGhostText}>Remove</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          setAvatarUrl(avatarDraftUrl.trim());
                          setAvatarModalVisible(false);
                        }}
                        style={({ pressed }) => [styles.modalPrimaryBtn, pressed && { opacity: 0.92 }]}
                      >
                        <Text style={styles.modalPrimaryText}>Save</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFF',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: -0.2,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    formContainer: {
        width: '100%',
    },
    avatarCard: {
      borderRadius: 24,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,0.22)',
      shadowColor: '#894e56',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.08,
      shadowRadius: 30,
      elevation: 4,
      overflow: 'hidden',
      marginBottom: 14,
    },
    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 14,
    },
    avatarWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(179,113,122,0.10)',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.75)',
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImg: {
      width: '100%',
      height: '100%',
    },
    avatarFallback: {
      flex: 1,
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarEditBtn: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#B3717A',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.9)',
      overflow: 'hidden',
    },
    avatarTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: '#1e293b',
      letterSpacing: -0.2,
      marginBottom: 4,
    },
    avatarSub: {
      fontSize: 13,
      color: 'rgba(51,65,85,0.62)',
      lineHeight: 18,
    },
    avatarChangeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: 'rgba(226,232,240,0.55)',
      backgroundColor: '#FFFFFF',
    },
    avatarChangeBtnText: {
      fontSize: 13,
      fontWeight: '900',
      color: '#B3717A',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    glassCard: {
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 6,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,0.22)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 18,
      elevation: 2,
      overflow: 'hidden',
    },
    inputWrapper: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 12,
        fontWeight: '900',
        color: 'rgba(51,65,85,0.62)',
        marginBottom: 8,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(226,232,240,0.8)',
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
        color: '#1e293b',
    },
    bioInput: {
        textAlignVertical: 'top',
    },
    errorText: {
        fontSize: 13,
        color: '#b91c1c',
        marginTop: 4,
        marginBottom: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: '#B3717A',
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#B3717A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 8,
    },
    saveButtonDisabled: {
        backgroundColor: 'rgba(179,113,122,0.55)',
        shadowOpacity: 0.1,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(15,23,42,0.35)',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    modalCard: {
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderWidth: 1,
      borderColor: 'rgba(226,232,240,0.85)',
      padding: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: '#0f172a',
      letterSpacing: -0.2,
    },
    modalHint: {
      fontSize: 13,
      color: 'rgba(51,65,85,0.65)',
      lineHeight: 18,
      marginBottom: 12,
    },
    modalInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 46,
      backgroundColor: 'rgba(241,245,249,0.85)',
      borderWidth: 1,
      borderColor: 'rgba(226,232,240,0.9)',
    },
    modalInput: {
      flex: 1,
      fontSize: 14,
      color: '#0f172a',
      padding: 0,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      marginTop: 14,
    },
    modalGhostBtn: {
      flex: 1,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(226,232,240,0.9)',
      backgroundColor: 'rgba(255,255,255,0.8)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalGhostText: {
      fontSize: 13,
      fontWeight: '900',
      color: 'rgba(51,65,85,0.75)',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    modalPrimaryBtn: {
      flex: 1,
      height: 44,
      borderRadius: 14,
      backgroundColor: '#B3717A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalPrimaryText: {
      fontSize: 13,
      fontWeight: '900',
      color: '#fff',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
});
