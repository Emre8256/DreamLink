import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { router, Stack } from 'expo-router';
import { getMyProfile, UserProfileResponse } from '../services/api';
import {
  MapPin, Moon, Ruler, Home, Briefcase,
  Cigarette, Wine
} from 'lucide-react-native';

// ─── Design Tokens (Bumble Soft UI) ───────────────────────────────────────────
const QS_BOLD = 'Quicksand_700Bold';
const QS_MEDIUM = 'Quicksand_500Medium';
const QS_SEMIBOLD = 'Quicksand_600SemiBold';
const QS_REGULAR = 'Quicksand_400Regular';
const SERIF = 'Quicksand_700Bold';

const C = {
  primary: '#A63F4F',
  pageBg: '#FFFFFF',
  bg: '#FFFFFF',
  textMain: '#000000',
  textMuted: '#111111',
  textLight: '#94a3b8',
  borderLight: 'rgba(0,0,0,0.04)',
};

const { width: SW } = Dimensions.get('window');

// ─── Mock Data Extension (Discover ile birebir aynı dolu görünüm için) ───
const MOCK_EXTRA_DATA = {
  hometown: 'Izmir',
  height: '182 cm',
  education: "Bachelor's",
  chronotype: 'Night Owl 🦉',
  smoking: 'Sometimes',
  alcohol: 'Social Drinker',
  languages: ['Turkish', 'English'],
  interests: ['Lucid Dreaming', 'Architecture', 'Film Photography', 'Surrealism', 'Espresso'],
  prompts: [
    { question: "Right before I fall asleep, I think about...", answer: "Where the boundaries of the universe end and what I'm doing here." },
    { question: "The mysterious place I see most in my dreams...", answer: "An old, wooden library where the stairs constantly change." }
  ],
  photos: [
    'https://i.pinimg.com/236x/2f/47/5d/2f475d794db006ffb24488e1fd1f81cf.jpg',
    'https://i.pinimg.com/236x/f1/bb/ac/f1bbac07a5e6959d7717fdc2b8fa4f92.jpg',
    'https://i.pinimg.com/236x/54/e0/95/54e095f8b951eca7270bc941788712cf.jpg',
    'https://i.pinimg.com/236x/dc/2a/85/dc2a85b0fc5373e45e8a16dc3e9572d2.jpg',
  ]
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfilePreviewScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProfile()
      .then(data => setProfile(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  // Eğer profil API'den gelmediyse Mock verilerle dolu dolu göster
  const name = profile?.nickname || 'Elara';
  const age = profile?.age || 26;
  const location = profile?.location || 'Istanbul';
  const bio = profile?.bio || 'Exploring the boundary between reality and imagination. I cannot go a day without architecture, film, and espresso.';
  const photos = profile?.photos?.length ? profile.photos : MOCK_EXTRA_DATA.photos;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* ─── Header ─── */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={C.textMain} />
        </TouchableOpacity>
        <View style={s.subHeader}>
          <Ionicons name="eye-outline" size={14} color={C.textMuted} />
          <Text style={s.subHeaderText}>Preview Mode</Text>
        </View>
        <View style={s.headerSpacer} />
      </View>

      {/* ─── Card (Scrollable) ─── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: SW * 0.03, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>

          {/* ── 1. Hero Image (Index 0) ── */}
          <View style={s.heroWrap}>
            <Image source={{ uri: photos[0] }} style={s.heroImage} />
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.84)']}
              locations={[0.35, 0.58, 1]}
              style={s.heroGradient}
            />
            <View style={s.heroBottom}>
              <View style={s.heroIdentity}>
                <Text style={s.heroName}>{name}, {age}</Text>
                <View style={s.heroMeta}>
                  <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.72)" />
                  <Text style={s.heroLocation}>{location}</Text>
                  <View style={s.onlineDot} />
                  <Text style={s.onlineText}>Online</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={s.innerContainer}>

            {/* ── Basics ── */}
            <View style={s.bumbleCard}>
              <Text style={s.bumbleCardTitle}>Basics</Text>
              <View style={s.pillsWrap}>
                <View style={s.pill}><Ruler size={14} color="#000" /><Text style={s.pillTxt}>{MOCK_EXTRA_DATA.height}</Text></View>
                <View style={s.pill}><Home size={14} color="#000" /><Text style={s.pillTxt}>{MOCK_EXTRA_DATA.hometown}</Text></View>
                <View style={s.pill}><Briefcase size={14} color="#000" /><Text style={s.pillTxt}>{MOCK_EXTRA_DATA.education}</Text></View>
              </View>
            </View>

            {/* ── About Me (Bio) ── */}
            <View style={s.bumbleCard}>
              <Text style={s.bumbleCardTitle}>About me</Text>
              <Text style={s.bioText}>{bio}</Text>
            </View>

            {/* ── Ekstra Fotoğraf 1 (Index 1) ── */}
            {photos[1] && (
              <View style={s.extraPhotoContainer}>
                <Image source={{ uri: photos[1] }} style={s.extraPhoto} />
              </View>
            )}

            {/* ── Prompt 1 ── */}
            <View style={s.promptCard}>
              <Text style={s.promptQuestion}>{MOCK_EXTRA_DATA.prompts[0].question}</Text>
              <View style={s.promptDivider} />
              <Text style={s.promptAnswer}>{MOCK_EXTRA_DATA.prompts[0].answer}</Text>
            </View>

            {/* ── Ekstra Fotoğraf 2 (Index 2) ── */}
            {photos[2] && (
              <View style={s.extraPhotoContainer}>
                <Image source={{ uri: photos[2] }} style={s.extraPhoto} />
              </View>
            )}

            {/* ── Lifestyle ── */}
            <View style={s.bumbleCard}>
              <Text style={s.bumbleCardTitle}>Lifestyle</Text>
              <View style={s.pillsWrap}>
                <View style={s.pill}><Moon size={14} color="#000" /><Text style={s.pillTxt}>{MOCK_EXTRA_DATA.chronotype}</Text></View>
                <View style={s.pill}><Cigarette size={14} color="#000" /><Text style={s.pillTxt}>{MOCK_EXTRA_DATA.smoking}</Text></View>
                <View style={s.pill}><Wine size={14} color="#000" /><Text style={s.pillTxt}>{MOCK_EXTRA_DATA.alcohol}</Text></View>
              </View>
            </View>

            {/* ── Prompt 2 ── */}
            <View style={s.promptCard}>
              <Text style={s.promptQuestion}>{MOCK_EXTRA_DATA.prompts[1].question}</Text>
              <View style={s.promptDivider} />
              <Text style={s.promptAnswer}>{MOCK_EXTRA_DATA.prompts[1].answer}</Text>
            </View>

            {/* ── Ekstra Fotoğraf 3 (Index 3) ── */}
            {photos[3] && (
              <View style={s.extraPhotoContainer}>
                <Image source={{ uri: photos[3] }} style={s.extraPhoto} />
              </View>
            )}

            {/* ── Languages ── */}
            <View style={s.bumbleCard}>
              <Text style={s.bumbleCardTitle}>Languages</Text>
              <View style={s.pillsWrap}>
                {MOCK_EXTRA_DATA.languages.map(l => (
                  <View key={l} style={s.pill}><Text style={s.pillTxt}>{l}</Text></View>
                ))}
              </View>
            </View>

            {/* ── Interests ── */}
            <View style={s.bumbleCard}>
              <Text style={s.bumbleCardTitle}>Interests</Text>
              <View style={s.pillsWrap}>
                {MOCK_EXTRA_DATA.interests.map((tag, i) => (
                  <View key={i} style={s.pill}>
                    <Text style={s.pillTxt}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* ─── Edit Profile CTA (fixed bottom) ─── */}
      <View style={[s.ctaBar, { paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#FFFFFF', '#FFFFFF']}
          locations={[0, 0.4, 1]}
          style={s.ctaFade}
          pointerEvents="none"
        />
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/edit-profile')}
          style={s.editBtn}
        >
          <LinearGradient
            colors={['#E8748A', C.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.editBtnGradient}
          >
            <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.editBtnText}>Edit Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── Styles (Soft UI & Bumble Aesthetic) ──────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: C.pageBg,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 40 },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subHeaderText: {
    fontFamily: QS_BOLD,
    fontSize: 13,
    color: '#000000',
    letterSpacing: 0.5,
  },

  // Main Card Container (Çerçevesiz, Yumuşak Gölgeli)
  card: {
    backgroundColor: C.bg,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },

  // Hero Image (3:4 Oranına Sabitlendi)
  heroWrap: {
    width: '100%',
    aspectRatio: 3 / 4, // Discover kartı ile birebir uyumlu oran
    position: 'relative',
    overflow: 'hidden'
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  heroIdentity: { flex: 1 },
  heroName: {
    fontFamily: SERIF,
    fontSize: 28,
    fontStyle: 'italic',
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocation: {
    fontFamily: QS_MEDIUM,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    marginLeft: 8,
  },
  onlineText: {
    fontFamily: QS_MEDIUM,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  // Inner Content
  innerContainer: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },

  // Bumble Cards
  bumbleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  bumbleCardTitle: {
    fontFamily: QS_BOLD,
    fontSize: 16,
    color: '#000000',
    marginBottom: 14,
  },
  bioText: {
    fontFamily: QS_REGULAR,
    fontSize: 15,
    color: '#111111',
    lineHeight: 24,
  },

  // Pills (Basics, Lifestyle, Interests)
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  pillTxt: {
    fontFamily: QS_BOLD,
    fontSize: 14,
    color: '#000000',
  },

  // Prompt Cards
  promptCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4
  },
  promptQuestion: { fontFamily: QS_SEMIBOLD, fontSize: 15, fontWeight: '600', color: C.textMain, marginBottom: 10, lineHeight: 22 },
  promptDivider: { height: 1.6, backgroundColor: C.borderLight, marginHorizontal: 4, marginBottom: 10 },
  promptAnswer: { fontFamily: QS_MEDIUM, fontSize: 15, color: '#111111', lineHeight: 22, marginBottom: 4 },

  // Extra Photos (3:4 Oranı)
  extraPhotoContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.bg,
    marginBottom: 16,
    aspectRatio: 3 / 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4
  },
  extraPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },

  // CTA Bar
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 80,
  },
  ctaFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  editBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  editBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  editBtnText: {
    fontFamily: QS_BOLD,
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.4,
  },
});