import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useLayoutEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
  deleteMyAccount,
  formatRelativeTime,
  getMyProfile,
  getUserDreams,
  THEME_TO_TURKISH,
  type DreamResponse,
  type UserProfileResponse,
} from '../../services/api';

const PRIMARY = '#B3717A';

// --- JOURNAL CARD (unique styles; no shared card system) ---
const journalCardStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
  },
  pressed: {
    opacity: 0.96,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
    opacity: 1,
  },
  themeText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(51,65,85,0.62)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(51,65,85,0.32)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#334155',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    color: 'rgba(51,65,85,0.58)',
    lineHeight: 20,
  },
  chevron: {
    marginLeft: 10,
  },
});

const DreamJournalCard = React.memo(({ dream }: { dream: DreamResponse }) => {
  const timeLabel = formatRelativeTime(dream.createdAt);

  return (
    <Pressable
      onPress={() => router.push(`/dream/${dream.id}`)}
      android_ripple={{ color: 'rgba(179,113,122,0.10)' }}
      style={({ pressed }) => [journalCardStyles.card, pressed && journalCardStyles.pressed]}
    >
      <View style={journalCardStyles.content}>
        <View style={journalCardStyles.topRow}>
          <View style={journalCardStyles.metaLeft}>
            <View style={journalCardStyles.themeDot} />
            <Text style={journalCardStyles.themeText}>{THEME_TO_TURKISH[dream.theme]}</Text>
          </View>
          <Text style={journalCardStyles.time}>{timeLabel}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={journalCardStyles.title} numberOfLines={1}>
              {dream.title}
            </Text>
            <Text style={journalCardStyles.desc} numberOfLines={1}>
              {dream.description}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(148,163,184,0.9)" style={journalCardStyles.chevron} />
        </View>
      </View>
    </Pressable>
  );
});
DreamJournalCard.displayName = 'DreamJournalCard';

const ProfileAvatar = ({ url, name }: { url: string | null | undefined; name: string }) => {
  if (url) {
    return <Image source={{ uri: url }} style={styles.avatar} />;
  }
  const initial = (name.trim().charAt(0) || 'U').toUpperCase();
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
};

// --- STATS CARD (unique styles; no shared card system) ---
const statsCardStyles = StyleSheet.create({
  shell: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 6,
  },
  card: {
    borderRadius: 26,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  topTint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 60,
    backgroundColor: 'rgba(179,113,122,0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  col: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(148,163,184,0.22)',
    marginVertical: 12,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(179,113,122,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(179,113,122,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    color: '#334155',
    letterSpacing: -0.5,
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(51,65,85,0.55)',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
});

const StatsCard = React.memo(
  ({ dreams, followers, following }: { dreams: number; followers: number; following: number }) => (
    <View style={statsCardStyles.shell}>
      <View style={statsCardStyles.card}>
        <View style={statsCardStyles.topTint} />
        <View style={statsCardStyles.row}>
          <View style={statsCardStyles.col}>
            <View style={statsCardStyles.iconPill}>
              <Ionicons name="moon-outline" size={18} color={PRIMARY} />
            </View>
            <Text style={statsCardStyles.value}>{dreams}</Text>
            <Text style={statsCardStyles.label}>Dreams</Text>
          </View>
          <View style={statsCardStyles.divider} />
          <View style={statsCardStyles.col}>
            <View style={statsCardStyles.iconPill}>
              <Ionicons name="people-outline" size={18} color={PRIMARY} />
            </View>
            <Text style={statsCardStyles.value}>{followers}</Text>
            <Text style={statsCardStyles.label}>Followers</Text>
          </View>
          <View style={statsCardStyles.divider} />
          <View style={statsCardStyles.col}>
            <View style={statsCardStyles.iconPill}>
              <Ionicons name="person-add-outline" size={18} color={PRIMARY} />
            </View>
            <Text style={statsCardStyles.value}>{following}</Text>
            <Text style={statsCardStyles.label}>Following</Text>
          </View>
        </View>
      </View>
    </View>
  )
);
StatsCard.displayName = 'StatsCard';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { logout } = useAuth();
  const scrollRef = useRef<ScrollView | null>(null);

  const [profile, setProfile] = React.useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [journal, setJournal] = React.useState<DreamResponse[]>([]);

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

          try {
            const dreams = await getUserDreams(data.id, 0, 2);
            if (mounted) setJournal(dreams.content ?? []);
          } catch {
            if (mounted) setJournal([]);
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

  const handleLogout = async () => {
    await logout();
  };

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirmation required', 'Type DELETE to continue.');
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
      Alert.alert('Error', 'Account could not be deleted. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#e0f2fe', '#f8fafd']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topIconButton} />

        <Text style={styles.topTitle}>Profile</Text>

        <TouchableOpacity style={styles.topIconButton} activeOpacity={0.8} onPress={() => router.push('/edit-profile')}>
          <Ionicons name="pencil-outline" size={22} color="#334155" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={(r) => {
          scrollRef.current = r;
        }}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 200 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarRing} />
          <View style={styles.avatarInnerRing} />
          <ProfileAvatar url={profile?.avatarUrl} name={profile?.nickname || 'User'} />

          <View style={{ marginTop: 14, alignItems: 'center' }}>
            <Text style={styles.name}>
              {profile?.nickname || 'User'}
              {profile?.age ? `, ${profile.age}` : ''}
            </Text>

            {profile?.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={PRIMARY} />
                <Text style={styles.locationText}>{profile.location}</Text>
              </View>
            ) : null}

            <Text style={styles.bio} numberOfLines={4}>
              {profile?.bio?.trim()
                ? `"${profile.bio.trim()}"`
                : '"Chasing dreams and decoding the subconscious—together."'}
            </Text>
          </View>
        </View>

        {/* Stats Bar */}
        <StatsCard
          dreams={profile?.dreamCount ?? 0}
          followers={profile?.followerCount ?? 0}
          following={profile?.followingCount ?? 0}
        />

        {/* Dream Journal */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Dream Journal</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>

          {journal.length > 0 ? (
            <View style={{ gap: 12 }}>
              {journal.map((d) => (
                <DreamJournalCard key={d.id} dream={d} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyJournal}>
              <Text style={styles.emptyJournalTitle}>Your journal is empty</Text>
              <Text style={styles.emptyJournalSub}>Dreams you share will appear here.</Text>
            </View>
          )}
        </View>

        {/* Minimal account actions (Settings bölümü kaldırıldı) */}
        <View style={[styles.section, { paddingTop: 18 }]}>
          <View style={styles.accountActionsRow}>
            <TouchableOpacity style={styles.accountActionDanger} activeOpacity={0.9} onPress={() => setShowDeleteModal(true)}>
              <Ionicons name="trash-outline" size={18} color="#D14343" />
              <Text style={styles.accountActionDangerText}>Delete Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.accountAction} activeOpacity={0.9} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={PRIMARY} />
              <Text style={styles.accountActionText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal transparent visible={showDeleteModal} animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete your account?</Text>
            <Text style={styles.modalText}>
              Bu islem geri alinamaz. Tum profilin, ruyalarin ve ilgili verilerin kalici olarak silinir.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDanger}
                onPress={() => {
                  setShowDeleteModal(false);
                  setShowFinalDeleteModal(true);
                }}
              >
                <Text style={styles.modalDangerText}>Continue</Text>
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
            <Text style={styles.modalTitle}>Final confirmation</Text>
            <Text style={styles.modalText}>Type DELETE below to confirm.</Text>
            <TextInput
              style={styles.confirmInput}
              autoCapitalize="characters"
              value={confirmText}
              onChangeText={setConfirmText}
              editable={!deleting}
              placeholder="DELETE"
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
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDanger} onPress={handleDeleteAccount} disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDangerText}>Delete permanently</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafd',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 12,
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: -0.4,
  },
  topIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 14,
  },
  avatarRing: {
    position: 'absolute',
    width: 152,
    height: 152,
    borderRadius: 76,
    top: 8,
    backgroundColor: 'rgba(179, 113, 122, 0.25)',
    shadowColor: PRIMARY,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  avatarInnerRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#F1F3FF',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 44,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: -1,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#334155',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(51,65,85,0.7)',
    fontWeight: '600',
  },
  bio: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(51,65,85,0.75)',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    maxWidth: 320,
  },

  statsShell: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 10,
  },
  statsGlass: {
    flexDirection: 'row',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(148,163,184,0.35)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(179, 113, 122, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 122, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#334155',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(51,65,85,0.58)',
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(51,65,85,0.10)',
    marginHorizontal: 10,
  },

  section: {
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '800',
    color: PRIMARY,
  },

  journalCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    backgroundColor: 'rgba(255,255,255,0.01)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  journalCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  journalCardBg: {
    borderRadius: 22,
  },
  journalCardContent: {
    padding: 16,
  },
  journalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  journalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  journalBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  journalTime: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(51,65,85,0.34)',
    letterSpacing: 0.6,
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#334155',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  journalDesc: {
    fontSize: 13,
    color: 'rgba(51,65,85,0.62)',
    lineHeight: 18,
  },
  emptyJournal: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
    overflow: 'hidden',
  },
  emptyJournalTitle: { fontSize: 15, fontWeight: '800', color: '#334155', marginBottom: 6 },
  emptyJournalSub: { fontSize: 13, color: 'rgba(51,65,85,0.6)' },

  accountActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  accountAction: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
    overflow: 'hidden',
  },
  accountActionText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#334155',
    letterSpacing: 0.2,
  },
  accountActionDanger: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(209, 67, 67, 0.18)',
    overflow: 'hidden',
  },
  accountActionDangerText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#D14343',
    letterSpacing: 0.2,
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