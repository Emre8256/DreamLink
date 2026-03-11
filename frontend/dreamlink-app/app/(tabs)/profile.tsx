import {
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useNavigation, router, useFocusEffect, type Href } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getMyProfile, UserProfileResponse } from '../../services/api';

// 1. Temel ayar öğesi özelliklerini tanımla
type BaseSettingItem = {
  title: string;
  subtitle: string;
  route?: Href;
};

// 2. iconType 'ionicons' (veya tanımsız) ise, 'icon' Ionicons'tan gelmeli
type IoniconSettingItem = BaseSettingItem & {
  iconType?: 'ionicons';
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

// 3. iconType 'material' ise, 'icon' MaterialCommunityIcons'tan gelmeli
type MaterialSettingItem = BaseSettingItem & {
  iconType: 'material';
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

// 4. Ana tipimiz, bu ikisinin birleşimidir
type SettingItem = IoniconSettingItem | MaterialSettingItem;

// Ayar menüsü verisi
const settingsItems: SettingItem[] = [
  {
    icon: 'person-outline',
    title: 'Profili Düzenle',
    subtitle: 'İsim, profil resmi ve bio bilgilerinizi güncelleyin',
  },
  {
    icon: 'time-outline',
    title: 'Son Rüyalar',
    subtitle: 'Son girdilerinizi görüntüleyin ve düzenleyin',
  },
  {
    icon: 'heart-outline',
    title: 'Eşleşmeler',
    subtitle: 'Benzer rüyaları olan kişiler',
  },
  {
    icon: 'chatbubble-outline',
    title: 'Mesajlar',
    subtitle: 'Sohbetlerinize devam edin',
  },
  {
    icon: 'tune-variant',
    iconType: 'material',
    title: 'Rüya Temaları',
    subtitle: 'Sembol ve motifleri takip edin',
  },
  {
    icon: 'notifications-outline',
    title: 'Bildirimler',
    subtitle: 'Etiketlemeler, eşleşmeler ve güncellemeler',
    route: '/notifications',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Gizlilik',
    subtitle: 'Hesap görünürlüğü ve güvenlik',
  },
  {
    icon: 'settings-outline',
    title: 'Uygulama Ayarları',
    subtitle: 'Görünüm, dil, veri',
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { logout } = useAuth();

  const [profile, setProfile] = React.useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Çift başlığı engellemek için varsayılan header'ı gizle
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    // Router handling is done in AuthContext usually, but strictly:
    router.replace('/login');
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleNavigate = (route: Href | undefined) => {
    if (route) {
      router.push(route);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7E6BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profilim</Text>
          <Text style={styles.headerSubtitle}>Kişisel bilgileriniz</Text>
        </View>

      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profil Bilgi Kartı */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profile?.avatarUrl || 'https://ui-avatars.com/api/?name=' + (profile?.nickname || 'User') + '&background=random' }}
              style={styles.avatar}
            />
          </View>

          <Text style={styles.name}>{profile?.nickname}</Text>
          <Text style={styles.bio}>
            {profile?.bio || 'Henüz bir biyografi eklenmemiş.'}
          </Text>

          {/* İstatistik Bölümü (3'lü Kart) */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile?.dreamCount || 0}</Text>
              <Text style={styles.statLabel}>Rüya</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile?.followerCount || 0}</Text>
              <Text style={styles.statLabel}>Takipçi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Takip</Text>
            </View>
          </View>
        </View>

        {/* Ayarlar Menüsü */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-outline"
              size={24}
              color="#7E6BFF"
              style={styles.settingIcon}
            />

            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Profili Düzenle</Text>
              <Text style={styles.settingSubtitle}>İsim, profil resmi ve bio bilgilerinizi güncelleyin</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#C1C8FF"
            />
          </TouchableOpacity>

          {settingsItems.slice(1).map((item, index) => {
            const isEnabled = Boolean(item.route);
            return (
            <TouchableOpacity
              style={[
                styles.settingItem,
                index === settingsItems.length - 2 && styles.lastSettingItem,
                !isEnabled && styles.settingItemDisabled
              ]}
              key={item.title}
              activeOpacity={isEnabled ? 0.7 : 1}
              disabled={!isEnabled}
              onPress={isEnabled ? () => handleNavigate(item.route) : undefined}
            >
              {item.iconType === 'material' ? (
                <MaterialCommunityIcons
                  name={item.icon}
                  size={24}
                  color={isEnabled ? '#7E6BFF' : '#B8BEDB'}
                  style={styles.settingIcon}
                />
              ) : (
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={isEnabled ? '#7E6BFF' : '#B8BEDB'}
                  style={styles.settingIcon}
                />
              )}

              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, !isEnabled && styles.settingTitleDisabled]}>{item.title}</Text>
                <Text style={[styles.settingSubtitle, !isEnabled && styles.settingSubtitleDisabled]}>{item.subtitle}</Text>
              </View>

              {isEnabled ? (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#C1C8FF"
                />
              ) : (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Yakinda</Text>
                </View>
              )}
            </TouchableOpacity>
          );
          })}
        </View>

        {/* Çıkış Butonu */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF6B6B" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1FF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
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
    paddingTop: 32,
    paddingBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#F1F3FF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7E6BFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#7E6BFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#8A8CA8',
    marginTop: 4,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#EDF1FF',
    marginHorizontal: 16,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1FF',
  },
  settingItemDisabled: {
    opacity: 0.7,
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    marginRight: 16,
    width: 24,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D2D3A',
    marginBottom: 4,
  },
  settingTitleDisabled: {
    color: '#A3A8C2',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8A8CA8',
    lineHeight: 18,
  },
  settingSubtitleDisabled: {
    color: '#B8BEDB',
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF1FF',
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A8CA8',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 4,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
});