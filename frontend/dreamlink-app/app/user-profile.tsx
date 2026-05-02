import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY_COLOR = '#B3717A';
const SCREEN_WIDTH = Dimensions.get('window').width;

// Dummy data for preview
const user = {
  name: 'Yunus Emre',
  age: 24,
  location: 'Istanbul, Turkey',
  bio: 'Dreamer. Jungian. Coffee lover.\n"Dreams are the poetry of the subconscious."',
  dreams: 12,
  followers: 1280,
  following: 345,
  joined: '234d',
  isFollowing: false,
  isLiked: false,
  likeCount: '1.2k',
  avatarUrl: '',
  online: true,
};


type DreamJournalItem = {
  id: string;
  title: string;
  desc: string;
  date: string;
};

const dreamJournal: DreamJournalItem[] = [
  { id: '1', title: 'Flying Over Istanbul', desc: 'I was flying above the Bosphorus...', date: '2d ago' },
  { id: '2', title: 'Lost in a Library', desc: 'Endless books, endless doors...', date: '5d ago' },
  { id: '3', title: 'Rainy Rooftop', desc: 'Dancing in the rain with strangers.', date: '1w ago' },
];

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const [isLiked, setIsLiked] = useState(user.isLiked);
  const [likeCount, setLikeCount] = useState(user.likeCount);

  // Header & Menu
  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
      <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#334155" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerBtn} onPress={() => setMenuVisible(true)}>
        <Ionicons name="ellipsis-horizontal" size={26} color="#334155" />
      </TouchableOpacity>
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.menuItemTextDanger}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="remove-circle" size={20} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.menuItemTextDanger}>Block</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  // Hero
  const renderHero = () => (
    <View style={styles.heroContainer}>
      <View style={styles.avatarAuraWrap}>
        <LinearGradient
          colors={[PRIMARY_COLOR + '22', 'rgba(255,255,255,0)']}
          style={styles.avatarAura}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.avatarBubble}>
          <Ionicons name="person" size={64} color="#B3717A" />
          {user.online && <View style={styles.onlineDot} />}
        </View>
      </View>
      <Text style={styles.nameText}>{user.name}, {user.age}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location" size={15} color="#64748b" style={{ marginRight: 4 }} />
        <Text style={styles.locationText}>{user.location}</Text>
      </View>
      <Text style={styles.bioText} numberOfLines={2}>{user.bio}</Text>
    </View>
  );

  // Stats
  const renderStats = () => (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statNum}>{user.dreams}</Text>
        <Text style={styles.statLabel}>Dreams</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNum}>{user.followers}</Text>
        <Text style={styles.statLabel}>Followers</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNum}>{user.following}</Text>
        <Text style={styles.statLabel}>Following</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNum}>{user.joined}</Text>
        <Text style={styles.statLabel}>Joined</Text>
      </View>
    </View>
  );

  // Actions
  const renderActions = () => (
    <View style={styles.actionRow}>
      <TouchableOpacity
        style={styles.followBtn}
        onPress={() => setIsFollowing(f => !f)}
        activeOpacity={0.85}
      >
        <Text style={styles.followBtnText}>{isFollowing ? 'Following' : 'Follow'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.likeBtn}
        onPress={() => {
          setIsLiked(l => !l);
          setLikeCount(l => (isLiked ? '1.2k' : '1.2k+1'));
        }}
        activeOpacity={0.85}
      >
        <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={PRIMARY_COLOR} style={{ marginRight: 6 }} />
        <Text style={styles.likeBtnText}>{likeCount}</Text>
      </TouchableOpacity>
    </View>
  );

  // Dream Journal List
  const renderDreamCard = ({ item }: { item: DreamJournalItem }) => (
    <View style={styles.dreamCard}>
      <Text style={styles.dreamCardTitle}>{item.title}</Text>
      <Text style={styles.dreamCardDesc} numberOfLines={2}>{item.desc}</Text>
      <Text style={styles.dreamCardDate}>{item.date}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={["#e0f2fe", "#fdf2f2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {renderHeader()}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {renderHero()}
        {renderStats()}
        {renderActions()}
        <View style={styles.journalHeaderRow}>
          <Text style={styles.journalHeader}>DREAM JOURNAL</Text>
        </View>
        <FlatList
          data={dreamJournal}
          renderItem={renderDreamCard}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 12 }}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 2,
    backgroundColor: 'transparent',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingVertical: 12,
    paddingBottom: 24,
    paddingHorizontal: 18,
    marginHorizontal: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  menuItemTextDanger: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 16,
  },
  heroContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  avatarAuraWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarAura: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    zIndex: 1,
    opacity: 0.7,
  },
  avatarBubble: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    zIndex: 2,
  },
  onlineDot: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 3,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 2,
    marginBottom: 2,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  bioText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    marginHorizontal: 18,
    marginBottom: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    shadowColor: '#B3717A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 18,
    gap: 12,
  },
  followBtn: {
    flex: 0.6,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  followBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  likeBtn: {
    flex: 0.3,
    backgroundColor: '#fff',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#B3717A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  likeBtnText: {
    color: PRIMARY_COLOR,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 2,
  },
  journalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 2,
    marginLeft: 18,
  },
  journalHeader: {
    color: PRIMARY_COLOR,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1.5,
  },
  dreamCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 18,
    marginHorizontal: 18,
    marginVertical: 7,
    padding: 18,
    shadowColor: '#B3717A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 2,
  },
  dreamCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B3717A',
    marginBottom: 4,
  },
  dreamCardDesc: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 6,
  },
  dreamCardDate: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'right',
  },
});
