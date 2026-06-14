import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { HelpCircle } from 'lucide-react-native';

// Enable layout animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─ Design tokens & Premium Palette (Aligned with today.tsx) ───────────────
const C = {
  rose: '#A63F4F',      // Dark Rose (Primary)
  roseLt: '#F7E6E8',    // Light Rose (Soft accents / background)
  roseMd: '#D697A2',    // Medium Rose (Borders, passive icons)
  roseDk: '#7D2D3A',    // Deep Rose (Deep contrast)
  bg: '#FFFFFF',        // Background
  sand: '#F8FAFC',      // Off-white / light gray for pills and inputs
  card: '#FFFFFF',
  t1: '#1C1714',        // Deep Charcoal (Titles)
  t2: '#475569',        // Slate Gray (Body text)
  tm: '#94a3b8',        // Muted Gray (Details, subtexts)
  white: '#FFFFFF',
} as const;

const QS_BOLD = 'Quicksand_700Bold';
const EDITORIAL_SERIF = 'PlayfairDisplay-Italic';

interface FaqItem {
  id: number;
  q: string;
  a: string;
  category: 'general' | 'matches' | 'security' | 'dreamium';
}

const FAQS: FaqItem[] = [
  {
    id: 1,
    q: 'What is DreamLink?',
    a: 'DreamLink is a luxurious and editorial social discovery platform that allows you to build meaningful connections with people on similar frequencies through the deep and mysterious world of your dreams.',
    category: 'general',
  },
  {
    id: 2,
    q: 'How Do Dream Matches Work?',
    a: 'The dream log you share daily is analyzed by our AI for symbols, themes, and emotional patterns. The next day, you are matched with other users who experienced similar subconscious reflections on the same night.',
    category: 'matches',
  },
  {
    id: 3,
    q: 'Why Can I Only Share 1 Dream Per Day?',
    a: 'To preserve the platform\'s editorial purity, depth, and unique daily dream experience, each user is limited to sharing only one dream per day. This ensures that sharing is more intentional and focused.',
    category: 'general',
  },
  {
    id: 4,
    q: 'Are My Dream Logs and Data Secure?',
    a: 'Absolutely. All your dream logs are protected with the highest encryption standards. Your dreams are only shared with the people you match with, within the platform\'s editorial design and entirely under your control.',
    category: 'security',
  },
  {
    id: 5,
    q: 'What is Dreamium Membership?',
    a: 'Dreamium Premium is our exclusive membership club offering advanced and detailed AI analysis reports, unlimited dream interpretation slots, dream rewind features, and access to exclusive editorial themes.',
    category: 'dreamium',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'matches', label: 'Matches' },
  { key: 'security', label: 'Security & Privacy' },
  { key: 'dreamium', label: 'Dreamium' },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Animation values for smooth entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleOpen = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(prev => (prev === id ? null : id));
  };

  // Filter FAQs based on category and search query
  const filteredFaqs = useMemo(() => {
    return FAQS.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={C.t1} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        {/* Balance spacer */}
        <View style={{ width: 36 }} />
      </View>

      <Animated.View
        style={[{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        needsOffscreenAlphaCompositing={true}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* Search Bar Container */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={C.t1} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="How can we help? (e.g., Match)"
                placeholderTextColor={C.tm}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  // Auto close any active accordion to avoid layout shifts during search
                  if (openIndex !== null) setOpenIndex(null);
                }}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={C.tm} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Chips Scroll */}
          <View style={styles.categoryWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => {
                      setSelectedCategory(cat.key);
                      if (openIndex !== null) setOpenIndex(null);
                    }}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* FAQ Accordion List */}
          <View style={styles.faqList}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item) => {
                const isOpen = openIndex === item.id;
                return (
                  <View key={item.id} style={[styles.faqCard, isOpen && styles.faqCardActive]}>
                    <TouchableOpacity
                      style={styles.faqQuestionRow}
                      onPress={() => toggleOpen(item.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.faqQuestion, isOpen && { color: C.rose }]}>
                        {item.q}
                      </Text>
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={isOpen ? C.rose : C.t2}
                      />
                    </TouchableOpacity>

                    {isOpen && (
                      <View style={styles.faqAnswerWrap}>
                        <Text style={styles.faqAnswer}>{item.a}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.noResults}>
                <View style={styles.noResultsIconWrap}>
                  <HelpCircle size={40} color={C.roseMd} strokeWidth={1.5} />
                </View>
                <Text style={styles.noResultsTitle}>No results found matching your search</Text>
                <Text style={styles.noResultsSub}>
                  Please try entering different keywords or selecting another category.
                </Text>
              </View>
            )}
          </View>

          {/* Premium Support Editorial Banner */}
          <View style={styles.supportCard}>
            <View style={styles.supportGlow} />
            <Text style={styles.supportEyebrow}>CUSTOMER SERVICE & CONTACT</Text>
            <Text style={styles.supportTitle}>Still haven't found what you're looking for?</Text>
            <Text style={styles.supportText}>
              We are here to support your experience. Contact us at any time.
            </Text>
            <TouchableOpacity
              style={styles.supportBtn}
              activeOpacity={0.85}
              onPress={() => {
                // Mock support response or trigger email
                alert('Support Request: You can reach us at support@dreamlink.app or through the Premium Contact line.');
              }}
            >
              <Text style={styles.supportBtnText}>CONTACT US</Text>
              <Ionicons name="mail-outline" size={16} color={C.white} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: 'rgba(28, 23, 20, 0.04)',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: QS_BOLD,
    fontSize: 18,
    color: C.t1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.sand,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(28, 23, 20, 0.06)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Quicksand_500Medium',
    fontSize: 14.5,
    color: C.t1,
    paddingVertical: 10,
  },
  clearButton: {
    padding: 4,
  },
  categoryWrap: {
    marginBottom: 22,
    marginHorizontal: -20,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.sand,
    borderWidth: 1,
    borderColor: 'rgba(28, 23, 20, 0.04)',
  },
  categoryChipActive: {
    backgroundColor: C.roseLt,
    borderColor: C.roseMd,
  },
  categoryText: {
    fontFamily: QS_BOLD,
    fontSize: 12.5,
    color: C.t2,
  },
  categoryTextActive: {
    color: C.roseDk,
  },
  faqList: {
    marginBottom: 30,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(28, 23, 20, 0.05)',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#1C1714',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  faqCardActive: {
    borderColor: 'rgba(166, 63, 79, 0.15)',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  faqQuestion: {
    fontFamily: QS_BOLD,
    fontSize: 14,
    color: C.t1,
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
  },
  faqAnswerWrap: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(28, 23, 20, 0.02)',
  },
  faqAnswer: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 13.5,
    lineHeight: 21,
    color: C.t2,
    marginTop: 10,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: C.sand,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(28, 23, 20, 0.04)',
  },
  noResultsIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1C1714',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  noResultsTitle: {
    fontFamily: QS_BOLD,
    fontSize: 15,
    color: C.t1,
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSub: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 12.5,
    color: C.tm,
    textAlign: 'center',
    lineHeight: 18,
  },
  supportCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 22,
    padding: 24,
    backgroundColor: '#1C1714', // Sleek elegant dark theme background matching brand values
    borderWidth: 1,
    borderColor: 'rgba(166, 63, 79, 0.2)',
    shadowColor: '#1C1714',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  supportGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -40,
    top: -40,
    backgroundColor: 'rgba(166, 63, 79, 0.2)',
  },
  supportEyebrow: {
    fontFamily: QS_BOLD,
    fontSize: 10,
    letterSpacing: 2,
    color: C.roseMd,
    marginBottom: 10,
  },
  supportTitle: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontSize: 20,
    lineHeight: 26,
    color: C.white,
    marginBottom: 10,
  },
  supportText: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  supportBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: C.rose,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: C.rose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  supportBtnText: {
    fontFamily: QS_BOLD,
    fontSize: 13.5,
    color: C.white,
    letterSpacing: 1,
  },
});
