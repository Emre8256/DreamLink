import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

import { useAuth } from '../context/AuthContext';
import {
  getMyProfile,
  deleteMyAccount,
  getBlockedUsers,
  unblockUser,
  BlockedUser,
} from '../services/api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const QS_BOLD = 'Quicksand_700Bold';
const QS_MEDIUM = 'Quicksand_500Medium';

const C = {
  primary: '#A63F4F',
  roseLt: '#F7E6E8',
  roseMd: '#D697A2',
  roseDk: '#7D2D3A',
  bg: '#F8F9FB',
  surface: '#FFFFFF',
  textMain: '#1C1714',
  textMuted: '#475569',
  textLight: '#94a3b8',
  iconDefault: '#64748B',
  iconBg: '#F1F5F9',
  border: '#F1F5F9',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: 'rgba(239,68,68,0.15)',
};


// ─── Settings Row Component ──────────────────────────────────────────────────
const SettingsRow = ({
  iconName,
  label,
  sublabel,
  type,
  value,
  onPress,
  onToggle,
  danger,
  divider,
  rightElement,
  rightText,
  premiumBadge,
  disabled,
}: {
  iconName: string;
  label: string;
  sublabel?: string;
  type: 'link' | 'toggle' | 'custom' | 'danger';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
  divider?: boolean;
  rightElement?: React.ReactNode;
  rightText?: string;
  premiumBadge?: boolean;
  disabled?: boolean;
}) => (
  <>
    <TouchableOpacity
      activeOpacity={type !== 'toggle' ? 0.7 : 1}
      onPress={type !== 'toggle' ? onPress : undefined}
      style={[s.row, danger && s.dangerRow, disabled && { opacity: 0.4 }]}
      disabled={type === 'toggle' || disabled}
    >
      <View style={s.rowLeft}>
        <View style={[s.rowIconBg, danger && { backgroundColor: C.dangerBg }]}>
          <Ionicons
            name={iconName as any}
            size={17}
            color={danger ? C.danger : C.iconDefault}
          />
        </View>
        <View style={{ flexShrink: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[s.rowLabel, danger && s.dangerLabel]}>{label}</Text>
            {premiumBadge && (
              <View style={s.premiumPill}>
                <Text style={s.premiumPillText}>DREAMIUM</Text>
              </View>
            )}
          </View>
          {sublabel && <Text style={s.rowSubLabel}>{sublabel}</Text>}
        </View>
      </View>
      <View style={{ flex: 1 }} />
      {rightText && <Text style={s.rowRightText}>{rightText}</Text>}
      {type === 'link' && <Ionicons name="chevron-forward" size={15} color="#CBD5E1" />}
      {type === 'toggle' && (
        <Switch
          value={!!value}
          onValueChange={onToggle}
          trackColor={{ true: C.primary, false: '#D1D5DB' }}
          thumbColor="#FFF"
          disabled={disabled}
        />
      )}
      {type === 'custom' && rightElement}
    </TouchableOpacity>
    {divider && <View style={s.rowDivider} />}
  </>
);

// ─── Section Card Component ─────────────────────────────────────────────────
const SectionCard = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <View style={s.sectionCard}>
    {title && <Text style={s.sectionCardTitle}>{title}</Text>}
    <View style={s.sectionCardContent}>{children}</View>
  </View>
);

// ─── Settings Categories Config ──────────────────────────────────────────────
const CATEGORIES = [
  { key: 'account', label: 'Account', desc: 'Email and account management', icon: 'person-outline' },
  { key: 'privacy', label: 'Privacy & Safety', desc: 'Visibility and blocked users', icon: 'shield-outline' },
  { key: 'notifications', label: 'Notifications', desc: 'Match, message and activity alerts', icon: 'notifications-outline' },
  { key: 'support', label: 'Support & Legal', desc: 'Help, purchases and legal info', icon: 'help-circle-outline' },
] as const;

type SubPageKey = (typeof CATEGORIES)[number]['key'] | 'blocked' | null;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();

  const [currentSubPage, setCurrentSubPage] = useState<SubPageKey>(null);
  const [userEmail, setUserEmail] = useState('user@dreamlink.com');

  useEffect(() => {
    if (user?.token) {
      try {
        const decoded = jwtDecode<{ sub?: string }>(user.token);
        if (decoded.sub) {
          setUserEmail(decoded.sub);
        }
      } catch (e) {
        console.warn('Failed to decode token for email', e);
      }
    }
  }, [user]);


  // States for Privacy
  const [hasDreamium, setHasDreamium] = useState(false);
  const [incognito, setIncognito] = useState(false);

  // States for Email editing
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState('');

  // Blocked Users State with 2 mock users by default
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([
    { id: 'mock-1', nickname: 'SereneDreamer', blockedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
    { id: 'mock-2', nickname: 'NightWalker', blockedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
  ]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Notification Toggles
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifLike, setNotifLike] = useState(true);
  const [notifMessage, setNotifMessage] = useState(true);
  const [notifDreamlink, setNotifDreamlink] = useState(true);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFinalDeleteModal, setShowFinalDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Initial Data Sync
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await getMyProfile();

        // Load persisted settings from local storage if available
        const savedIncognito = await AsyncStorage.getItem('settings_incognito');
        const savedNotifEnabled = await AsyncStorage.getItem('settings_notifEnabled');
        const savedHasDreamium = await AsyncStorage.getItem('settings_hasDreamium');
        const savedNotifDreamlink = await AsyncStorage.getItem('settings_notifDreamlink');

        if (savedIncognito) setIncognito(savedIncognito === 'true');
        if (savedNotifEnabled) setNotifEnabled(savedNotifEnabled === 'true');
        if (savedHasDreamium) setHasDreamium(savedHasDreamium === 'true');
        if (savedNotifDreamlink) setNotifDreamlink(savedNotifDreamlink === 'true');
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Fetch Blocked Users when entering blocked list
  const fetchBlocked = async () => {
    setLoadingBlocked(true);
    try {
      const data = await getBlockedUsers();
      const apiBlocked = data.blockedUsers || [];
      // Prepends API response with our 2 mock users
      const mockUsers = [
        { id: 'mock-1', nickname: 'SereneDreamer', blockedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
        { id: 'mock-2', nickname: 'NightWalker', blockedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
      ];
      setBlockedUsers([...apiBlocked, ...mockUsers]);
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
      // fallback to mock users on error
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    if (currentSubPage === 'blocked') {
      fetchBlocked();
    }
  }, [currentSubPage]);

  // Save changes wrapper
  const saveSetting = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('Failed to persist setting locally', e);
    }
  };

  const handleUnblock = async (userId: string, nickname: string) => {
    Alert.alert('Unblock User', `Are you sure you want to unblock ${nickname}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!userId.startsWith('mock-')) {
              await unblockUser(userId);
            }
            setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
            Alert.alert('Success', `${nickname} has been unblocked.`);
          } catch (e) {
            Alert.alert('Error', 'Failed to unblock user.');
          }
        },
      },
    ]);
  };

  const handleDeleteAccountConfirm = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirmation Required', 'Please type DELETE to proceed.');
      return;
    }
    setDeleting(true);
    try {
      if (deleteReason.trim()) {
        console.log('Account deletion feedback:', deleteReason);
      }
      await deleteMyAccount();
      await logout();
      setShowFinalDeleteModal(false);
      setShowDeleteModal(false);
      setConfirmText('');
      setDeleteReason('');
      router.replace('/login');
    } catch (err) {
      Alert.alert('Error', 'Account could not be deleted. Try again.');
    } finally {
      setDeleting(false);
    }
  };


  const handleBack = () => {
    if (currentSubPage === 'blocked') {
      setCurrentSubPage('privacy');
      return;
    }
    if (currentSubPage !== null) {
      setCurrentSubPage(null);
      return;
    }
    router.back();
  };

  const headerTitle = useMemo(() => {
    if (currentSubPage === 'blocked') return 'Blocked Users';
    if (currentSubPage === null) return 'Settings';
    const found = CATEGORIES.find((c) => c.key === currentSubPage);
    return found ? found.label : 'Settings';
  }, [currentSubPage]);

  // ─── Rendering Helper Modules ──────────────────────────────────────────────


  const handleEmailSave = () => {
    const trimmed = editEmailValue.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setUserEmail(trimmed);
    setIsEditingEmail(false);
    saveSetting('settings_email', trimmed);
    Alert.alert('Email Updated', 'A verification link has been sent to your new email.');
  };

  const renderAccount = () => (
    <>
      <SectionCard title="ACCOUNT INFO">
        {isEditingEmail ? (
          <View style={s.emailEditContainer}>
            <TextInput
              style={s.emailInput}
              value={editEmailValue}
              onChangeText={setEditEmailValue}
              placeholder="Enter new email"
              placeholderTextColor={C.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
            <View style={s.emailEditActions}>
              <TouchableOpacity
                style={s.emailCancelBtn}
                onPress={() => setIsEditingEmail(false)}
                activeOpacity={0.7}
              >
                <Text style={s.emailCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.emailSaveBtn}
                onPress={handleEmailSave}
                activeOpacity={0.7}
              >
                <Text style={s.emailSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={s.infoRow}
            activeOpacity={0.7}
            onPress={() => { setEditEmailValue(userEmail); setIsEditingEmail(true); }}
          >
            <View style={s.infoRowLeft}>
              <View style={s.rowIconBg}>
                <Ionicons name="mail-outline" size={17} color={C.iconDefault} />
              </View>
              <Text style={s.infoLabel}>Email</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.infoValue} numberOfLines={1}>{userEmail}</Text>
              <Ionicons name="create-outline" size={14} color={C.textLight} />
            </View>
          </TouchableOpacity>
        )}
      </SectionCard>

      <TouchableOpacity
        style={s.deleteAccountLink}
        onPress={() => setShowDeleteModal(true)}
        activeOpacity={0.7}
      >
        <Text style={s.deleteAccountText}>Delete Account</Text>
      </TouchableOpacity>
    </>
  );

  const renderPrivacy = () => (
    <>
      <SectionCard title="PROFILE VISIBILITY">
        <SettingsRow
          iconName="eye-off-outline"
          label="Incognito Mode"
          sublabel="Browse profiles without being seen"
          type="toggle"
          value={incognito}
          premiumBadge
          onToggle={(val) => {
            if (val && !hasDreamium) {
              Alert.alert(
                'Dreamium Required',
                'Incognito Mode is a premium feature. Would you like to activate Dreamium subscription to enable it?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Get Dreamium',
                    onPress: () => {
                      setHasDreamium(true);
                      saveSetting('settings_hasDreamium', 'true');
                      setIncognito(true);
                      saveSetting('settings_incognito', 'true');
                      Alert.alert('Success', 'Dreamium subscription activated. Incognito Mode has been enabled!');
                    },
                  },
                ]
              );
            } else {
              setIncognito(val);
              saveSetting('settings_incognito', val.toString());
            }
          }}
        />
      </SectionCard>

      <SectionCard title="SAFETY">
        <SettingsRow
          iconName="shield-outline"
          label="Blocked Users"
          sublabel="Manage profiles you've blocked"
          type="link"
          onPress={() => setCurrentSubPage('blocked')}
        />
      </SectionCard>
    </>
  );

  const renderBlocked = () => (
    <View style={{ flex: 1 }}>
      {loadingBlocked ? (
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
      ) : blockedUsers.length > 0 ? (
        blockedUsers.map((u) => (
          <View key={u.id} style={s.blockedUserCard}>
            <View style={s.blockedUserLeft}>
              <View style={s.blockedAvatarWrap}>
                <Ionicons name="person" size={20} color="#94A3B8" />
              </View>
              <View>
                <Text style={s.blockedNickname}>{u.nickname}</Text>
                <Text style={s.blockedDate}>Blocked {new Date(u.blockedAt).toLocaleDateString()}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.unblockButton}
              onPress={() => handleUnblock(u.id, u.nickname)}
              activeOpacity={0.7}
            >
              <Text style={s.unblockBtnText}>Unblock</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={s.emptyState}>
          <View style={s.emptyIconBg}>
            <Ionicons name="shield-checkmark-outline" size={28} color={C.primary} />
          </View>
          <Text style={s.emptyStateTitle}>No blocked users</Text>
          <Text style={s.emptyStateDesc}>You haven't blocked anyone yet. Profiles you block will appear here.</Text>
        </View>
      )}
    </View>
  );

  const renderNotifications = () => (
    <>
      <SectionCard title="PERMISSION">
        <SettingsRow
          iconName="notifications-outline"
          label="Allow Notifications"
          sublabel="Enable push notifications on this device"
          type="toggle"
          value={notifEnabled}
          onToggle={(val) => {
            setNotifEnabled(val);
            saveSetting('settings_notifEnabled', val.toString());
          }}
        />
      </SectionCard>

      <SectionCard title="CONNECTIONS">
        <SettingsRow
          iconName="flame-outline"
          label="New Matches"
          sublabel="When a dream connection is made"
          type="toggle"
          value={notifMatch}
          onToggle={setNotifMatch}
          disabled={!notifEnabled}
          divider
        />
        <SettingsRow
          iconName="heart-outline"
          label="Likes"
          sublabel="When someone likes your profile"
          type="toggle"
          value={notifLike}
          onToggle={setNotifLike}
          disabled={!notifEnabled}
        />
      </SectionCard>

      <SectionCard title="ACTIVITY">
        <SettingsRow
          iconName="chatbubble-outline"
          label="Messages"
          sublabel="New chat messages from matches"
          type="toggle"
          value={notifMessage}
          onToggle={setNotifMessage}
          disabled={!notifEnabled}
        />
      </SectionCard>

      <SectionCard title="FROM DREAMLINK">
        <SettingsRow
          iconName="gift-outline"
          label="DreamLink"
          sublabel="News, tips, and special offers"
          type="toggle"
          value={notifDreamlink}
          onToggle={(val) => {
            setNotifDreamlink(val);
            saveSetting('settings_notifDreamlink', val.toString());
          }}
          disabled={!notifEnabled}
        />
      </SectionCard>
    </>
  );

  const renderSupport = () => (
    <>
      <SectionCard title="HELP">
        <SettingsRow
          iconName="help-circle-outline"
          label="Help & FAQ"
          sublabel="Troubleshooting and usage tips"
          type="link"
          onPress={() => router.push('/help')}
          divider
        />
        <SettingsRow
          iconName="chatbubble-outline"
          label="Contact Support"
          sublabel="Get help from our team"
          type="link"
          onPress={() => Alert.alert('Support', 'Send us an email at support@dreamlink.app')}
        />
      </SectionCard>

      <SectionCard title="PURCHASES">
        <SettingsRow
          iconName="refresh-outline"
          label="Restore Purchases"
          sublabel="Recover previous premium subscriptions"
          type="link"
          onPress={() => {
            Alert.alert('Restore', 'Checking your purchase history...', [
              { text: 'OK' }
            ]);
          }}
        />
      </SectionCard>

      <SectionCard title="LEGAL">
        <SettingsRow
          iconName="document-text-outline"
          label="Terms of Service"
          type="link"
          onPress={() => Alert.alert('Terms', 'DreamLink Terms of Service and usage agreements.')}
          divider
        />
        <SettingsRow
          iconName="shield-checkmark-outline"
          label="Privacy Policy"
          type="link"
          onPress={() => Alert.alert('Privacy', 'DreamLink Privacy Policy and data protection.')}
          divider
        />
        <SettingsRow
          iconName="information-circle-outline"
          label="About DreamLink"
          type="link"
          rightText="v1.2.4"
          onPress={() => Alert.alert('DreamLink', 'Version 1.2.4 (Build 1024)\nSubconscious Connection Engine\n\n© 2026 DreamLink Inc.')}
        />
      </SectionCard>
    </>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ─── Header ─── */}
      <View style={[s.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={s.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={C.textMain} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{headerTitle}</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {currentSubPage === null && (
          <>
            {/* Main Menu List */}
            <View style={s.menuList}>
              {CATEGORIES.map((cat, i) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[s.menuItem, i === CATEGORIES.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                  onPress={() => setCurrentSubPage(cat.key)}
                >
                  <View style={s.menuIconWrap}>
                    <Ionicons name={cat.icon as any} size={19} color={C.iconDefault} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.menuItemLabel}>{cat.label}</Text>
                    <Text style={s.menuItemDesc}>{cat.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Sign Out */}
            <TouchableOpacity
              onPress={async () => {
                await logout();
                router.replace('/login');
              }}
              activeOpacity={0.8}
              style={s.signOutBtn}
            >
              <Ionicons name="log-out-outline" size={17} color={C.danger} style={{ marginRight: 8 }} />
              <Text style={s.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={s.footerContainer}>
              <Text style={s.footerVersion}>DreamLink v1.2.4 (1024)</Text>
              <Text style={s.footerSub}>Subconscious Connection Engine</Text>
              <Text style={s.footerCopyright}>© 2026 DreamLink Inc.</Text>
            </View>
          </>
        )}

        {/* Subpages Routing */}
        {currentSubPage === 'account' && renderAccount()}
        {currentSubPage === 'privacy' && renderPrivacy()}
        {currentSubPage === 'blocked' && renderBlocked()}
        {currentSubPage === 'notifications' && renderNotifications()}
        {currentSubPage === 'support' && renderSupport()}
      </ScrollView>

      {/* Delete Account Modal 1 */}
      <Modal transparent visible={showDeleteModal} animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={s.backdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: C.danger }]}>Delete Account?</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <Ionicons name="close" size={20} color={C.iconDefault} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalBodyText}>
              This action cannot be undone. All your profile data, matched dreams, and chat history will be permanently deleted.
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.dangerBtn}
                onPress={() => {
                  setShowDeleteModal(false);
                  setShowFinalDeleteModal(true);
                }}
              >
                <Text style={s.dangerBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal 2 (Final confirmation) */}
      <Modal transparent visible={showFinalDeleteModal} animationType="fade" onRequestClose={() => setShowFinalDeleteModal(false)}>
        <View style={s.backdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Final Confirmation</Text>
              <TouchableOpacity onPress={() => { setShowFinalDeleteModal(false); setConfirmText(''); setDeleteReason(''); }}>
                <Ionicons name="close" size={20} color={C.iconDefault} />
              </TouchableOpacity>
            </View>
            
            <Text style={s.modalBodyText}>Please type "DELETE" below to confirm account deletion.</Text>
            <TextInput
              style={s.inputConfirm}
              autoCapitalize="characters"
              value={confirmText}
              onChangeText={setConfirmText}
              editable={!deleting}
              placeholder="DELETE"
              placeholderTextColor="#CBD5E1"
            />
            
            <Text style={[s.modalBodyText, { marginTop: 10, marginBottom: 8 }]}>Why are you leaving? (Optional)</Text>
            <TextInput
              style={s.inputReason}
              value={deleteReason}
              onChangeText={setDeleteReason}
              editable={!deleting}
              placeholder="Please tell us why you are deleting your account..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => {
                  setShowFinalDeleteModal(false);
                  setConfirmText('');
                  setDeleteReason('');
                }}
                disabled={deleting}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.dangerBtn, { backgroundColor: confirmText.trim().toUpperCase() === 'DELETE' ? C.danger : '#E2E8F0' }]}
                onPress={handleDeleteAccountConfirm}
                disabled={deleting || confirmText.trim().toUpperCase() !== 'DELETE'}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={[s.dangerBtnText, { color: confirmText.trim().toUpperCase() === 'DELETE' ? '#FFF' : '#94A3B8' }]}>
                    Delete Permanently
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: QS_BOLD, fontSize: 17, color: C.textMain, letterSpacing: -0.2 },

  // Menu List
  menuList: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemLabel: { fontFamily: QS_BOLD, fontSize: 14, color: C.textMain },
  menuItemDesc: { fontFamily: QS_MEDIUM, fontSize: 11, color: C.textLight, marginTop: 2 },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.dangerBg,
    borderWidth: 1,
    borderColor: C.dangerBorder,
    paddingVertical: 13,
    borderRadius: 14,
    marginBottom: 28,
  },
  signOutBtnText: { fontFamily: QS_BOLD, fontSize: 13.5, color: C.danger },

  footerContainer: { alignItems: 'center', gap: 3, marginBottom: 20 },
  footerVersion: { fontFamily: QS_BOLD, fontSize: 11, color: C.textLight },
  footerSub: { fontFamily: QS_MEDIUM, fontSize: 10, color: C.textLight },
  footerCopyright: { fontFamily: QS_MEDIUM, fontSize: 9, color: '#CBD5E1', marginTop: 2 },

  // Section Card
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  sectionCardTitle: {
    fontFamily: QS_BOLD,
    fontSize: 11,
    color: C.textLight,
    paddingTop: 14,
    paddingBottom: 4,
    paddingHorizontal: 16,
    letterSpacing: 0.8,
  },
  sectionCardContent: { paddingVertical: 4 },

  // Settings Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 },
  rowIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: { fontFamily: QS_BOLD, fontSize: 13.5, color: C.textMain },
  rowSubLabel: { fontFamily: QS_MEDIUM, fontSize: 10.5, color: C.textLight, marginTop: 1 },
  rowRightText: { fontFamily: QS_MEDIUM, fontSize: 12.5, color: C.textLight, marginRight: 6 },
  dangerRow: {},
  dangerLabel: { color: C.danger },
  rowDivider: { height: 1, backgroundColor: C.border, marginLeft: 60 },

  // Premium Pill Badge
  premiumPill: {
    backgroundColor: C.roseLt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumPillText: { fontFamily: QS_BOLD, fontSize: 8.5, color: C.primary, letterSpacing: 0.5 },

  // Account Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontFamily: QS_BOLD, fontSize: 13, color: C.textMuted, marginLeft: 12 },
  infoValue: { fontFamily: QS_MEDIUM, fontSize: 13, color: C.textMain, maxWidth: '50%', textAlign: 'right' },

  // Email Edit
  emailEditContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  emailInput: {
    fontFamily: QS_MEDIUM,
    fontSize: 14,
    color: C.textMain,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.iconBg,
  },
  emailEditActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  emailCancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.iconBg },
  emailCancelText: { fontFamily: QS_BOLD, fontSize: 12.5, color: C.textMuted },
  emailSaveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.primary },
  emailSaveText: { fontFamily: QS_BOLD, fontSize: 12.5, color: '#FFF' },

  // Delete Account Link
  deleteAccountLink: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  deleteAccountText: {
    fontFamily: QS_MEDIUM,
    fontSize: 13,
    color: C.danger,
  },

  // Blocked Users Screen
  blockedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    marginBottom: 10,
  },
  blockedUserLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  blockedAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  blockedNickname: { fontFamily: QS_BOLD, fontSize: 14, color: C.textMain },
  blockedDate: { fontFamily: QS_MEDIUM, fontSize: 10, color: C.textLight, marginTop: 2 },
  unblockButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: C.roseLt,
  },
  unblockBtnText: { fontFamily: QS_BOLD, fontSize: 11.5, color: C.primary },

  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.roseLt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyStateTitle: { fontFamily: QS_BOLD, fontSize: 16, color: C.textMain },
  emptyStateDesc: { fontFamily: QS_MEDIUM, fontSize: 12, color: C.textMuted, textAlign: 'center', paddingHorizontal: 40, marginTop: 6, lineHeight: 18 },

  // Modals
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: C.surface, borderRadius: 18, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontFamily: QS_BOLD, fontSize: 16, color: C.textMain },
  modalBodyText: { fontFamily: QS_MEDIUM, fontSize: 12.5, color: C.textMuted, lineHeight: 19, marginBottom: 20 },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.iconBg },
  cancelBtnText: { fontFamily: QS_BOLD, fontSize: 12.5, color: C.textMuted },
  dangerBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.danger, minWidth: 100, alignItems: 'center', justifyContent: 'center' },
  dangerBtnText: { fontFamily: QS_BOLD, fontSize: 12.5, color: '#FFF' },
  inputConfirm: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: C.textMain, fontSize: 13.5, fontFamily: QS_BOLD, marginBottom: 20, textAlign: 'center' },
  inputReason: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.textMain,
    fontSize: 13,
    fontFamily: QS_MEDIUM,
    marginBottom: 20,
    backgroundColor: C.iconBg,
    textAlignVertical: 'top',
    height: 70,
  },
});
