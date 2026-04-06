import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useNavigation, type Href } from 'expo-router';
import React, { useLayoutEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { deleteMyAccount, getMyProfile, type UserProfileResponse } from '../../services/api';
import { DEFAULT_FEATURES, type SettingItemConfig } from '../../types/navigation';

const SHOWABLE_SETTINGS: SettingItemConfig[] = [
  {
    id: 'matches',
    title: 'Esmeler',
    subtitle: 'Benzer ruyalari olan kisiler',
    icon: 'heart-outline',
    iconType: 'ionicons',
    route: '/(tabs)/matches',
  },
  {
    id: 'messages',
    title: 'Mesajlar',
    subtitle: 'Sohbetlerine devam et',
    icon: 'chatbubble-outline',
    iconType: 'ionicons',
    route: '/(tabs)/chat',
  },
  {
    id: 'notifications',
    title: 'Bildirimler',
    subtitle: 'Eslesme ve etkileşim guncellemeleri',
    icon: 'notifications-outline',
    iconType: 'ionicons',
    route: '/notifications',
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { logout } = useAuth();

  const [profile, setProfile] = React.useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showFinalDeleteModal, setShowFinalDeleteModal] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      const run = async () => {
        try {
          const data = await getMyProfile();
          if (mounted) {
            setProfile(data);
          }
        } catch (error) {
          console.error('Profil yuklenirken hata:', error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };
      run();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const availableSettings = useMemo(
    () => SHOWABLE_SETTINGS.filter((item) => DEFAULT_FEATURES[item.id] === 'available' && Boolean(item.route)),
    []
  );

  const handleLogout = async () => {
    await logout();
  };

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== 'SIL') {
      Alert.alert('Onay eksik', 'Devam etmek icin SIL yazmalisin.');
      return;
    }

    setDeleting(true);
    try {
      await deleteMyAccount();
      await logout();
      setShowFinalDeleteModal(false);
      setShowDeleteModal(false);
      setConfirmText('');
      router.replace('/login');
    } catch (error) {
      console.error('Hesap silme hatasi:', error);
      Alert.alert('Hata', 'Hesap silinemedi. Lutfen tekrar dene.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#7E6BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFF" translucent />

      <View style={[styles.header, { paddingTop: insets.top }]}> 
        <Text style={styles.headerTitle}>Profilim</Text>
        <Text style={styles.headerSubtitle}>Kisisel bilgilerin</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileContainer}>
          <Image
            source={{
              uri:
                profile?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nickname || 'User')}&background=random`,
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile?.nickname || 'Kullanici'}</Text>
          <Text style={styles.bio}>{profile?.bio || 'Henuz bir biyografi eklenmemis.'}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile?.dreamCount || 0}</Text>
              <Text style={styles.statLabel}>Ruya</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile?.followerCount || 0}</Text>
              <Text style={styles.statLabel}>Takipci</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Takip</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={22} color="#7E6BFF" style={styles.settingIcon} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Profili Duzenle</Text>
              <Text style={styles.settingSubtitle}>Isim, profil resmi ve bio bilgilerini guncelle</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C1C8FF" />
          </TouchableOpacity>

          {availableSettings.map((item, index) => (
            <TouchableOpacity
              style={[styles.settingItem, index === availableSettings.length - 1 && styles.lastSettingItem]}
              key={item.id}
              activeOpacity={0.8}
              onPress={() => item.route && router.push(item.route as Href)}
            >
              {item.iconType === 'material' ? (
                <MaterialCommunityIcons name={item.icon as any} size={22} color="#7E6BFF" style={styles.settingIcon} />
              ) : (
                <Ionicons name={item.icon as any} size={22} color="#7E6BFF" style={styles.settingIcon} />
              )}
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C1C8FF" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.dangerButton} activeOpacity={0.8} onPress={() => setShowDeleteModal(true)}>
          <Ionicons name="trash-outline" size={20} color="#D14343" style={styles.logoutIcon} />
          <Text style={styles.dangerButtonText}>Hesabimi Sil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF6B6B" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Cikis Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={showDeleteModal} animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Hesabini silmek istiyor musun?</Text>
            <Text style={styles.modalText}>
              Bu islem geri alinamaz. Tum profilin, ruyalarin ve ilgili verilerin kalici olarak silinir.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.modalCancelText}>Vazgec</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDanger}
                onPress={() => {
                  setShowDeleteModal(false);
                  setShowFinalDeleteModal(true);
                }}
              >
                <Text style={styles.modalDangerText}>Devam Et</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={showFinalDeleteModal}
        animationType="fade"
        onRequestClose={() => setShowFinalDeleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Son Onay</Text>
            <Text style={styles.modalText}>Onayi tamamlamak icin asagiya SIL yaz.</Text>
            <TextInput
              style={styles.confirmInput}
              autoCapitalize="characters"
              value={confirmText}
              onChangeText={setConfirmText}
              editable={!deleting}
              placeholder="SIL"
              placeholderTextColor="#A3A8C2"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowFinalDeleteModal(false);
                  setConfirmText('');
                }}
                disabled={deleting}
              >
                <Text style={styles.modalCancelText}>Vazgec</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDanger} onPress={handleDeleteAccount} disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDangerText}>Kalici Olarak Sil</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1FF',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D2D3A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#7E6BFF',
    fontWeight: '600',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  profileContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 28,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#F1F3FF',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D2D3A',
    marginBottom: 8,
  },
  bio: {
    fontSize: 15,
    color: '#5E5E72',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#EDF1FF',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#7E6BFF',
  },
  statLabel: {
    fontSize: 13,
    color: '#8A8CA8',
    marginTop: 4,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#EDF1FF',
    marginHorizontal: 12,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1FF',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    marginRight: 14,
    width: 24,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D3A',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8A8CA8',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(209, 67, 67, 0.1)',
    borderRadius: 14,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D14343',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D2D3A',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: '#5E5E72',
    lineHeight: 20,
    marginBottom: 14,
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: '#D9DDF0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#2D2D3A',
    fontSize: 14,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EEF1FF',
  },
  modalCancelText: {
    color: '#3B4570',
    fontWeight: '700',
  },
  modalDanger: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#D14343',
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDangerText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});