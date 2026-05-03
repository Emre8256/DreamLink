import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  Image, Modal, Pressable, StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { 
  User, Calendar, Ruler, Home, MapPin, GraduationCap, 
  Moon, Cigarette, Wine 
} from 'lucide-react-native';

// ─── Design Tokens (Bumble & Premium Soft UI) ───────────────
const QS_BOLD = 'Quicksand_700Bold';
const QS_MEDIUM = 'Quicksand_500Medium';

const C = {
  primary: '#A63F4F',      
  roseLt: '#F7E6E8',       
  roseMd: '#D697A2',       
  bg: '#FFFFFF',           
  sand: '#F8FAFC',         
  textMain: '#000000',     // Belirgin Siyah (Bumble Style)
  textMuted: '#111111',    // Tok Koyu Gri/Siyah
  textLight: '#94a3b8',    
  borderLight: 'rgba(0,0,0,0.06)',
};

// ─── Data Arrays ──────────────────────────────────────────────
const EDUCATION_OPTIONS = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Other'];
const CHRONOTYPE_OPTIONS = [
  { label: 'Night Owl 🦉', value: 'Night Owl' },
  { label: 'Early Bird 🌅', value: 'Early Bird' },
  { label: 'Deep Sleeper 🐻', value: 'Deep Sleeper' },
  { label: 'Light Sleeper 🐬', value: 'Light Sleeper' },
];
const SMOKING_OPTIONS = ['Non-Smoker', 'Sometimes', 'Smoker', 'Trying to Quit', 'Prefer Not to Say'];
const ALCOHOL_OPTIONS = ['Non-Drinker', 'Social Drinker', 'Regular Drinker', 'Prefer Not to Say'];
const AVAILABLE_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Russian', 'Arabic', 'Italian', 'Japanese', 'Korean', 'Turkish',
  'Portuguese', 'Hindi', 'Bengali', 'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Dutch', 'Swedish', 'Polish',
  'Thai', 'Vietnamese', 'Indonesian', 'Greek', 'Hebrew', 'Czech', 'Romanian', 'Hungarian', 'Ukrainian',
  'Persian (Farsi)', 'Urdu', 'Punjabi', 'Tamil', 'Telugu', 'Malay', 'Filipino (Tagalog)', 'Swahili',
  'Norwegian', 'Danish', 'Finnish', ' Icelandic', 'Catalan', 'Basque', 'Galician', 'Welsh', 'Irish',
  'Scottish Gaelic', 'Latin', 'Esperanto', 'Sign Language', 'Bulgarian', 'Serbian', 'Croatian', 'Bosnian',
  'Slovak', 'Slovenian', 'Lithuanian', 'Latvian', 'Estonian', 'Georgian', 'Armenian', 'Azerbaijani'
];

const PROMPT_QUESTIONS = [
  "The one dream I'd like to live again...",
  "The last thing I think about before falling asleep...",
  "The most absurd thing that happened to me in a dream...",
  "What my subconscious is trying to tell me...",
  "That nightmare that woke me up...",
  "If a director made a film of my dreams, it would definitely...",
  "The dream I wish was real...",
  "The mysterious place I see most often in my dreams...",
];

const RICH_INTERESTS = [
  { category: 'Dreams & Psychology', items: ['Lucid Dreaming 🌙', 'Astral Projection ✨', 'Sleep Analysis 💤', 'Mythology 🏛️', 'Symbolism 👁️', 'Psychology 🧠', 'Tarot 🎴', 'Astrology ⭐', 'Subconscious 🌌', 'Dream Journaling 📓', 'Jungian Psychology ⚖️', 'Numerology 🔢', 'Palm Reading ✋', 'Past Life Regression 🔄'] },
  { category: 'Art & Design', items: ['Digital Art 🎨', '3D Animation 🎬', 'Photography 📸', 'Ceramics & Sculpture 🏺', 'Oil Painting 🖌️', 'Graphic Design 🎭', 'Fashion Design 👗', 'Architecture 🏛️', 'Street Art graffiti 🎪', 'Calligraphy ✒️', 'Interior Design 🛋️', 'UX/UI Design 💻', 'Body Art & Tattoos 💉', 'Makeup Art 💄'] },
  { category: 'Music & Sound', items: ['Independent Music 🎵', 'Classical Music 🎼', 'Electronic Music 🎧', 'Jazz & Blues 🎺', 'Alternative Rock 🎸', 'Podcast Listening 🎙️', 'Playing Instruments 🎹', 'Hip-Hop & Rap 🎤', 'Ambient & Atmospheric 🎚️', 'Singer-Songwriter 🎻', 'World Music 🌍', 'Music Production 🎚️', 'K-Pop/Bollywood 💿', 'Vinyl Collecting 💿'] },
  { category: 'Life & Wellness', items: ['Meditation & Yoga 🧘', 'Night Walks 🌙', 'Nature Hiking 🥾', 'Mindfulness 🌿', 'Nutrition & Diet 🥗', 'Spa & Relaxation 🛀', 'Therapy 💆', 'Breathwork 🌬️', 'Sound Healing 🔔', 'Acupuncture 💉', 'Aromatherapy 🌸', 'Cold Therapy 🧊', 'Forest Bathing 🌲', 'Crystal Healing 💎'] },
  { category: 'Technology & Gaming', items: ['PC Gaming 🎮', 'Console Gaming 🎯', 'Retro Gaming 👾', 'VR/AR Experiences 🥽', 'Coding & Programming 💻', 'AI & Machine Learning 🤖', 'Cybersecurity 🔐', 'Tech News & Gadgets 📱', 'Streaming Content 📺', 'Board Games 🎲', 'Card Games 🃏', 'Esports 🏆', 'Tech DIY 🛠️', 'Home Automation 🏠'] },
  { category: 'Sports & Fitness', items: ['Weight Training 🏋️', 'Running & Marathon 🏃', 'Cycling 🚴', 'Swimming 🏊', 'Rock Climbing 🧗', 'Martial Arts 🥋', 'Team Sports ⚽', 'Yoga Flow 🧘‍♀️', 'Pilates 🤸', 'CrossFit 🔥', 'Dance & Choreography 💃', 'Sports Watching 📊', 'Outdoor Sports ⛰️', 'Winter Sports 🎿'] },
  { category: 'Travel & Adventure', items: ['Backpacking 🎒', 'Solo Travel 🌍', 'Road Trips 🚗', 'Adventure Sports 🪂', 'Luxury Travel ✈️', 'Cultural Immersion 🏺', 'Eco-Tourism 🌱', 'Cruises 🚢', 'Mountain Expeditions 🏔️', 'Safari & Wildlife 🦁', 'City Exploration 🏙️', 'Beach & Island Life 🏝️', 'Digital Nomad Life 💻🌴', 'Culinary Tours 🍜'] },
  { category: 'Food & Cooking', items: ['Home Cooking 🍳', 'Baking & Pastry 🍰', 'Molecular Gastronomy 🧪', 'Food Photography 📸', 'Wine & Sommelier 🍷', 'Coffee Culture ☕', 'Tea Ceremonies 🍵', 'Street Food 🥡', 'Fine Dining 🍽️', 'Plant-Based Cooking 🥬', 'BBQ & Grilling 🍖', 'International Cuisines 🥘', 'Fermentation 🥒', 'Food Blogging 📱'] },
  { category: 'Books & Literature', items: ['Fiction & Novels 📚', 'Science Fiction 🚀', 'Fantasy & Magic 🐉', 'Mystery & Thriller 🔍', 'Non-Fiction & Essays 📖', 'Poetry & Haiku ✍️', 'Graphic Novels 📕', 'Self-Development 📈', 'Philosophy ⚖️', 'Biography & Memoir 🗓️', 'History & Archaeology 🏺', 'Business & Finance 💰', 'Comics & Manga 📕', 'Audiobooks 🎧'] },
  { category: 'Science & Space', items: ['Astronomy & Stargazing 🔭', 'Physics & Quantum ⚛️', 'Biology & Genetics 🧬', 'Neuroscience 🧠', 'Chemistry Experiments 🧪', 'Space Exploration 🚀', 'Paleontology & Dinosaurs 🦕', 'Environmental Science 🌳', 'Mathematics & Puzzles 🔢', 'Robotics & DIY 🤖', 'Weather & Meteorology 🌤️', 'Oceanography 🌊', 'Medical Science 🏥', 'Crypto & Blockchain 🔗'] },
  { category: 'Nature & Animals', items: ['Birdwatching 🐦', 'Wildlife Photography 📸', 'Gardening & Plants 🌱', 'Marine Life 🤿', 'Pet Care 🐾', 'Sustainability 🌿', 'Organic Farming 🚜', 'Conservation 🌳', 'Insect Study 🐞', 'Astronomy Nightsky 🌌', 'Geology & Rocks 🪨', 'Forest Exploration 🌲', 'Zoo & Aquariums 🐠', 'Beekeeping 🐝'] },
  { category: 'Social & Lifestyle', items: ['Networking & Events 🤝', 'Volunteering & Charity 💝', 'Community Building 🏘️', 'Photography Walks 📷', 'Cooking for Friends 🍽️', 'Game Nights 🎲', 'Movie Marathons 🎬', 'Wine Tastings 🍷', 'Craft Fairs 🎨', 'Spiritual Retreats 🕉️', 'Personal Growth 🌱', 'Life Hacking 💡', 'Minimalism 📦', 'Home Brewing 🍺'] }
];

// ─── Height Data ───
const cmData = Array.from({ length: 101 }, (_, i) => (i + 130).toString());
const ftData = [
  "4'0\"", "4'1\"", "4'2\"", "4'3\"", "4'4\"", "4'5\"", "4'6\"", "4'7\"", "4'8\"", "4'9\"", "4'10\"", "4'11\"",
  "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"",
  "6'0\"", "6'1\"", "6'2\"", "6'3\"", "6'4\"", "6'5\"", "6'6\"", "6'7\"", "6'8\"", "6'9\"", "6'10\"", "6'11\"", "7'0\""
];

const ITEM_H = 56;
const PICKER_H = ITEM_H * 5;

function cmToFtIdx(cmIdx: number): number {
  const totalIn = Math.round((cmIdx + 130) / 2.54);
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn % 12;
  const target = `${ft}'${inch}"`;
  const idx = ftData.indexOf(target);
  return idx >= 0 ? idx : 22;
}

function ftToCmIdx(ftIdx: number): number {
  const m = ftData[ftIdx]?.match(/(\d+)'(\d+)"/);
  if (!m) return 52;
  const totalIn = parseInt(m[1]) * 12 + parseInt(m[2]);
  return Math.max(0, Math.min(100, Math.round(totalIn * 2.54) - 130));
}

// ─── Main Screen ──────────────────────────────────────────────
export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();

  // ── Form States (Max 4 Photos) ──
  const [photos, setPhotos] = useState<(string | null)[]>([
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
    null, null, null
  ]);
  
  // Text Fields
  const [nickname, setNickname] = useState('Alex');
  const [bio, setBio] = useState('Exploring the boundary between reality and imagination...');
  const [hometown, setHometown] = useState('Portland');
  const [location, setLocation] = useState('Seattle');

  // Read-only Identity Info
  const age = 28;
  const zodiac = 'Scorpio ♏';
  const gender = 'Male'; 
  
  // Height State
  const [height, setHeight] = useState('182 cm');
  const [heightModalVisible, setHeightModalVisible] = useState(false);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [pickerCmIdx, setPickerCmIdx] = useState(52);
  const [pickerFtIdx, setPickerFtIdx] = useState(23);
  const wheelRef = useRef<ScrollView>(null);
  const wheelScrollY = useRef(new Animated.Value(52 * ITEM_H)).current;
  const onWheelScroll = useRef(Animated.event(
    [{ nativeEvent: { contentOffset: { y: wheelScrollY } } }],
    { useNativeDriver: false }
  )).current;

  // Selects & Arrays
  const [education, setEducation] = useState('Bachelor');
  const [chronotype, setChronotype] = useState('Night Owl');
  const [smoking, setSmoking] = useState('Sometimes');
  const [alcohol, setAlcohol] = useState('Social Drinker');

  const [interests, setInterests] = useState<string[]>(['Lucid Dreaming 🌙', 'Independent Cinema 🎬']);
  const [draftInterests, setDraftInterests] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['English', 'Spanish']);
  const [languageSearch, setLanguageSearch] = useState('');

  // Prompts
  const [prompts, setPrompts] = useState<{question: string, answer: string}[]>([
    { question: "The one dream I'd like to live again...", answer: "That moment gliding through the sky, watching the whole city unfold." }
  ]);

  // ── Modals & UI States ──
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [sheetConfig, setSheetConfig] = useState<{visible: boolean, title: string, type: 'edu'|'chrono'|'smoking'|'alcohol', data: any[], selected: string}>({
    visible: false, title: '', type: 'edu', data: [], selected: ''
  });

  const [interestModalVisible, setInterestModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  
  const [promptManagerVisible, setPromptManagerVisible] = useState(false); 
  const [promptEditorVisible, setPromptEditorVisible] = useState(false);   
  const [activePromptIndex, setActivePromptIndex] = useState<number | null>(null); 
  const [draftQuestion, setDraftQuestion] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState<string>('');
  
  const [textEditConfig, setTextEditConfig] = useState<{
    visible: boolean; title: string; desc: string; value: string;
    field: 'nickname' | 'bio' | 'hometown' | 'location' | null;
    maxLength: number; multiline: boolean; keyboardType: 'default' | 'numeric';
  }>({ visible: false, title: '', desc: '', value: '', field: null, maxLength: 50, multiline: false, keyboardType: 'default' });

  // ── Functions ──
  const openSheet = (title: string, type: 'edu'|'chrono'|'smoking'|'alcohol', data: any[], selected: string) => {
    setSheetConfig({ visible: true, title, type, data, selected });
    Animated.timing(sheetAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSheetConfig(prev => ({ ...prev, visible: false }));
    });
  };

  // Height wheel helpers
  useEffect(() => {
    if (!heightModalVisible) return;
    const idx = heightUnit === 'cm' ? pickerCmIdx : pickerFtIdx;
    const offset = idx * ITEM_H;
    const timer = setTimeout(() => {
      wheelScrollY.setValue(offset);
      wheelRef.current?.scrollTo({ y: offset, animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, [heightModalVisible, heightUnit]);

  const handleUnitToggle = (unit: 'cm' | 'ft') => {
    if (unit === heightUnit) return;
    const newIdx = unit === 'ft' ? cmToFtIdx(pickerCmIdx) : ftToCmIdx(pickerFtIdx);
    const offset = newIdx * ITEM_H;
    wheelScrollY.setValue(offset);
    if (unit === 'ft') setPickerFtIdx(newIdx);
    else setPickerCmIdx(newIdx);
    setHeightUnit(unit);
    setTimeout(() => {
      wheelRef.current?.scrollTo({ y: offset, animated: false });
    }, 20);
  };

  const saveHeightSelection = () => {
    const val = heightUnit === 'cm'
      ? `${pickerCmIdx + 130} cm`
      : ftData[pickerFtIdx];
    setHeight(val);
    setHeightModalVisible(false);
  };

  const handleSheetSelect = (val: string) => {
    if (sheetConfig.type === 'edu') setEducation(val);
    if (sheetConfig.type === 'chrono') setChronotype(val);
    if (sheetConfig.type === 'smoking') setSmoking(val);
    if (sheetConfig.type === 'alcohol') setAlcohol(val);
    closeSheet();
  };

  const handlePhotoToggle = async (index: number) => {
    if (index === 0) {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.8 });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const newPhotos = [...photos];
        newPhotos[0] = result.assets[0].uri;
        setPhotos(newPhotos);
      }
    } else {
      if (photos[index]) {
        const newPhotos = [...photos];
        newPhotos[index] = null;
        setPhotos(newPhotos);
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.8 });
        if (!result.canceled && result.assets?.[0]?.uri) {
          const newPhotos = [...photos];
          newPhotos[index] = result.assets[0].uri;
          setPhotos(newPhotos);
        }
      }
    }
  };

  const openInterestsModal = () => {
    setDraftInterests([...interests]);
    setInterestModalVisible(true);
  };

  const toggleDraftInterest = (item: string) => {
    if (draftInterests.includes(item)) setDraftInterests(draftInterests.filter(i => i !== item));
    else if (draftInterests.length < 5) setDraftInterests([...draftInterests, item]);
  };

  const saveInterests = () => {
    setInterests(draftInterests);
    setInterestModalVisible(false);
  };

  const toggleLanguage = (item: string) => {
    if (languages.includes(item)) setLanguages(languages.filter(l => l !== item));
    else if (languages.length < 5) setLanguages([...languages, item]);
  };

  const startEditingPrompt = (slotIndex: number) => {
    setActivePromptIndex(slotIndex);
    if (prompts[slotIndex]) {
      setDraftQuestion(prompts[slotIndex].question);
      setDraftAnswer(prompts[slotIndex].answer);
    } else {
      setDraftQuestion(null);
      setDraftAnswer('');
    }
    setPromptEditorVisible(true);
  };

  const removePrompt = (slotIndex: number) => {
    const newPrompts = prompts.filter((_, i) => i !== slotIndex);
    setPrompts(newPrompts);
  };

  const finishPromptEditing = () => {
    if (!draftQuestion || !draftAnswer.trim()) return;
    const newPrompts = [...prompts];
    if (activePromptIndex !== null && activePromptIndex < prompts.length) {
      newPrompts[activePromptIndex] = { question: draftQuestion, answer: draftAnswer.trim() };
    } else {
      newPrompts.push({ question: draftQuestion, answer: draftAnswer.trim() });
    }
    setPrompts(newPrompts);
    setDraftQuestion(null);
    setDraftAnswer('');
    setPromptEditorVisible(false);
  };

  const openTextEditor = (field: 'nickname' | 'bio' | 'hometown' | 'location') => {
    let config = { visible: true, field, title: '', desc: '', value: '', maxLength: 50, multiline: false, keyboardType: 'default' as const };
    switch(field) {
      case 'nickname': config = { ...config, title: 'Your Name', desc: 'The name that appears on your profile.', value: nickname, maxLength: 30 }; break;
      case 'bio': config = { ...config, title: 'About me', desc: 'Express yourself freely.', value: bio, maxLength: 250, multiline: true }; break;
      case 'hometown': config = { ...config, title: 'Hometown', desc: 'Where are you from?', value: hometown, maxLength: 40 }; break;
      case 'location': config = { ...config, title: 'Location', desc: 'Which city are you in now?', value: location, maxLength: 40 }; break;
    }
    setTextEditConfig(config);
  };

  const saveTextEdit = () => {
    const val = textEditConfig.value.trim();
    switch(textEditConfig.field) {
      case 'nickname': setNickname(val); break;
      case 'bio': setBio(val); break;
      case 'hometown': setHometown(val); break;
      case 'location': setLocation(val); break;
    }
    setTextEditConfig({ ...textEditConfig, visible: false });
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── HEADER ── */}
      <View style={[s.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={26} color={C.textMain} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>

        {/* ── PHOTOS (4-Grid) ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Showcase</Text>
          <View style={s.photoGrid}>
            {photos.map((uri, index) => (
              <View key={index} style={s.photoWrapper}>
                <PhotoSlot uri={uri} index={index} onToggle={() => handlePhotoToggle(index)} isMain={index === 0} />
              </View>
            ))}
          </View>
        </View>

        {/* ── IDENTITY ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Identity</Text>
          <View style={s.cardGroup}>
            <TouchableOpacity style={s.cardRow} onPress={() => openTextEditor('nickname')}>
              <View style={s.rowLabelWrap}>
                <User size={18} color="#111111" />
                <Text style={s.rowLabel}>Name</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={nickname ? s.rowValue : s.rowValueEmpty}>{nickname || 'Add'}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textLight} />
              </View>
            </TouchableOpacity>
            <View style={s.divider} />
            <View style={s.cardRow}>
              <View style={s.rowLabelWrap}>
                <Calendar size={18} color="#111111" />
                <Text style={s.rowLabel}>Age & Zodiac</Text>
              </View>
              <Text style={s.rowValueReadOnly}>{age}, {zodiac}</Text>
            </View>
          </View>
        </View>

        {/* ── ABOUT ME ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>About me</Text>
          <TouchableOpacity style={s.bioCard} onPress={() => openTextEditor('bio')}>
             <Text style={bio ? s.bioText : s.bioTextEmpty} numberOfLines={4}>
               {bio || 'Write what\'s on your mind...'}
             </Text>
             <Ionicons name="create-outline" size={18} color={C.textLight} style={s.bioEditIcon} />
          </TouchableOpacity>
        </View>

        {/* ── BASIC INFO ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Basic info</Text>
          <View style={s.cardGroup}>
            <TouchableOpacity style={s.cardRow} onPress={() => setHeightModalVisible(true)}>
              <View style={s.rowLabelWrap}>
                <Ruler size={18} color="#111111" />
                <Text style={s.rowLabel}>Height</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={height ? s.rowValue : s.rowValueEmpty}>{height || 'Add'}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textLight} />
              </View>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.cardRow} onPress={() => openTextEditor('hometown')}>
              <View style={s.rowLabelWrap}>
                <Home size={18} color="#111111" />
                <Text style={s.rowLabel}>Hometown</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={hometown ? s.rowValue : s.rowValueEmpty}>{hometown || 'Add'}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textLight} />
              </View>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.cardRow} onPress={() => openTextEditor('location')}>
              <View style={s.rowLabelWrap}>
                <MapPin size={18} color="#111111" />
                <Text style={s.rowLabel}>Location</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={location ? s.rowValue : s.rowValueEmpty}>{location || 'Add'}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textLight} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── LIFESTYLE ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Lifestyle</Text>
          <View style={s.cardGroup}>
            <TouchableOpacity style={s.cardRow} onPress={() => openSheet('Education', 'edu', EDUCATION_OPTIONS, education)}>
              <View style={s.rowLabelWrap}>
                <GraduationCap size={18} color="#111111" />
                <Text style={s.rowLabel}>Education</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={education ? s.rowValue : s.rowValueEmpty}>{education || 'Select'}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textLight} />
              </View>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.cardRow} onPress={() => openSheet('Sleep Chronotype', 'chrono', CHRONOTYPE_OPTIONS.map(o=>o.value), chronotype)}>
              <View style={s.rowLabelWrap}>
                <Moon size={18} color="#111111" />
                <Text style={s.rowLabel}>Sleep Chronotype</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={chronotype ? s.rowValue : s.rowValueEmpty}>{CHRONOTYPE_OPTIONS.find(o=>o.value===chronotype)?.label || 'Select'}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textLight} />
              </View>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.cardRow} onPress={() => openSheet('Smoking', 'smoking', SMOKING_OPTIONS, smoking)}>
              <View style={s.rowLabelWrap}>
                <Cigarette size={18} color="#111111" />
                <Text style={s.rowLabel}>Smoking</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={smoking ? s.rowValue : s.rowValueEmpty}>{smoking || 'Select'}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textLight} />
              </View>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.cardRow} onPress={() => openSheet('Alcohol', 'alcohol', ALCOHOL_OPTIONS, alcohol)}>
               <View style={s.rowLabelWrap}>
                <Wine size={18} color="#111111" />
                <Text style={s.rowLabel}>Alcohol</Text>
              </View>
              <View style={s.rowRight}>
                <Text style={alcohol ? s.rowValue : s.rowValueEmpty}>{alcohol || 'Select'}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textLight} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── LANGUAGES I SPEAK ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Languages ({languages.length}/5)</Text>
          <View style={s.interestsCard}>
            <View style={s.pillsWrap}>
              {languages.map(item => (
                <View key={item} style={s.pillActive}><Text style={s.pillActiveText}>{item}</Text></View>
              ))}
            </View>
            <TouchableOpacity style={s.editTagsBtn} onPress={() => setLanguageModalVisible(true)}>
              <Ionicons name="pencil-outline" size={13} color={C.textMuted} />
              <Text style={s.editTagsBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── INTERESTS ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Interests ({interests.length}/5)</Text>
          <View style={s.interestsCard}>
            <View style={s.pillsWrap}>
              {interests.map(item => (
                <View key={item} style={s.pillActive}><Text style={s.pillActiveText}>{item}</Text></View>
              ))}
            </View>
            <TouchableOpacity style={s.editTagsBtn} onPress={openInterestsModal}>
              <Ionicons name="pencil-outline" size={13} color={C.textMuted} />
              <Text style={s.editTagsBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── PROFILE QUESTIONS (PROMPTS) ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Profile questions ({prompts.length}/2)</Text>
          <View style={s.promptsCard}>
            <Text style={s.promptDescText}>Choose the 2 questions that best describe you.</Text>
            {prompts.length > 0 && prompts.map((p, index) => (
              <TouchableOpacity key={index} style={s.promptCardMini} onPress={() => setPromptManagerVisible(true)}>
                <Text style={s.promptQuestionMini}>{p.question}</Text>
                <Text style={s.promptAnswerMini} numberOfLines={2}>{p.answer}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.promptManageBtn} onPress={() => setPromptManagerVisible(true)}>
               <Ionicons name="albums-outline" size={18} color={C.textMuted} style={{marginRight: 6}}/>
               <Text style={s.promptManageBtnText}>Manage Questions</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* ── HEIGHT PICKER MODAL ── */}
      <Modal visible={heightModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setHeightModalVisible(false)}>
        <View style={[s.modalRoot, { paddingTop: Platform.OS === 'ios' ? 20 : insets.top }]}>

          {/* Header */}
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setHeightModalVisible(false)} style={{ padding: 8, marginLeft: -8 }}>
              <Ionicons name="chevron-back" size={28} color={C.textMain} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Height</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Title block */}
          <View style={s.heightTitleWrap}>
            <Text style={s.heightMainTitle}>What's your height?</Text>
            <Text style={s.heightSubTitle}>You can change this anytime.</Text>
          </View>

          {/* Wheel */}
          <View style={s.wheelOuter}>
            {/* Selection highlight band */}
            <View style={s.wheelHighlight} pointerEvents="none" />

            <ScrollView
              ref={wheelRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_H}
              decelerationRate="fast"
              contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
              scrollEventThrottle={16}
              onScroll={onWheelScroll}
              onMomentumScrollEnd={(e) => {
                const data = heightUnit === 'cm' ? cmData : ftData;
                const idx = Math.max(0, Math.min(data.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));
                if (heightUnit === 'cm') setPickerCmIdx(idx);
                else setPickerFtIdx(idx);
              }}
              onScrollEndDrag={(e) => {
                const data = heightUnit === 'cm' ? cmData : ftData;
                const idx = Math.max(0, Math.min(data.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));
                if (heightUnit === 'cm') setPickerCmIdx(idx);
                else setPickerFtIdx(idx);
              }}
            >
              {(heightUnit === 'cm' ? cmData : ftData).map((val, idx) => {
                const iRange = [
                  (idx - 2) * ITEM_H, (idx - 1) * ITEM_H, idx * ITEM_H,
                  (idx + 1) * ITEM_H, (idx + 2) * ITEM_H,
                ];
                const opacity = wheelScrollY.interpolate({
                  inputRange: iRange, outputRange: [0.12, 0.4, 1, 0.4, 0.12], extrapolate: 'clamp',
                });
                const scale = wheelScrollY.interpolate({
                  inputRange: iRange, outputRange: [0.72, 0.86, 1, 0.86, 0.72], extrapolate: 'clamp',
                });
                return (
                  <Animated.View key={val} style={[s.wheelItem, { opacity, transform: [{ scale }] }]}>
                    <Text style={s.wheelItemText}>
                      {heightUnit === 'cm' ? `${val} cm` : val}
                    </Text>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>

          {/* cm / ft Toggle */}
          <View style={s.toggleContainer}>
            <View style={s.toggleBg}>
              <TouchableOpacity style={[s.toggleBtn, heightUnit === 'cm' && s.toggleBtnActive]} onPress={() => handleUnitToggle('cm')}>
                <Text style={[s.toggleBtnText, heightUnit === 'cm' && s.toggleBtnTextActive]}>cm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.toggleBtn, heightUnit === 'ft' && s.toggleBtnActive]} onPress={() => handleUnitToggle('ft')}>
                <Text style={[s.toggleBtnText, heightUnit === 'ft' && s.toggleBtnTextActive]}>ft</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save */}
          <View style={[s.fixedBottomBar, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={s.saveBtnBig} onPress={saveHeightSelection}>
              <Text style={s.saveBtnBigText}>Save</Text>
            </TouchableOpacity>
          </View>

        </View>
      </Modal>

      {/* ── BOTTOM SHEET (Education, Chronotype, Smoking, Alcohol) ── */}
      <Modal visible={sheetConfig.visible} transparent animationType="none" onRequestClose={closeSheet}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: sheetAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={closeSheet} />
        </Animated.View>
        <Animated.View style={[ s.bottomSheet, { paddingBottom: insets.bottom + 20, transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] } ]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>{sheetConfig.title}</Text>
          <ScrollView bounces={false}>
            {sheetConfig.data.map(opt => (
              <TouchableOpacity key={opt} style={s.sheetOption} onPress={() => handleSheetSelect(opt)}>
                <Text style={[s.sheetOptionText, sheetConfig.selected === opt && s.sheetOptionTextActive]}>
                  {sheetConfig.type === 'chrono' ? CHRONOTYPE_OPTIONS.find(c=>c.value===opt)?.label : opt}
                </Text>
                {sheetConfig.selected === opt && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </Modal>

      {/* ── TEXT EDIT MODAL ── */}
      <Modal visible={textEditConfig.visible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setTextEditConfig({...textEditConfig, visible: false})}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalRoot}>
          <View style={[s.modalHeader, { paddingTop: Platform.OS === 'ios' ? 20 : insets.top }]}>
             <TouchableOpacity onPress={() => setTextEditConfig({...textEditConfig, visible: false})} style={{padding: 8, marginLeft: -8}}>
                <Ionicons name="chevron-back" size={28} color={C.textMain} />
             </TouchableOpacity>
             <Text style={s.modalTitle}>{textEditConfig.title}</Text>
             <View style={{width: 40}} />
          </View>
          <ScrollView style={{ padding: 20 }}>
            <Text style={s.textEditDesc}>{textEditConfig.desc}</Text>
            <View style={[s.textEditInputContainer, textEditConfig.multiline && { minHeight: 120 }]}>
               <TextInput
                 style={[s.textEditInput, textEditConfig.multiline && s.textEditInputMultiline]}
                 autoFocus
                 value={textEditConfig.value}
                 onChangeText={(t) => setTextEditConfig({...textEditConfig, value: t})}
                 maxLength={textEditConfig.maxLength}
                 multiline={textEditConfig.multiline}
                 keyboardType={textEditConfig.keyboardType}
                 placeholder="Type here..."
                 placeholderTextColor={C.textLight}
               />
               <Text style={s.textEditCounter}>{textEditConfig.value.length}/{textEditConfig.maxLength}</Text>
            </View>
          </ScrollView>
          <View style={[s.fixedBottomBar, { paddingBottom: insets.bottom + 20 }]}>
             <TouchableOpacity style={s.saveBtnBig} onPress={saveTextEdit}>
               <Text style={s.saveBtnBigText}>Save</Text>
             </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── INTERESTS MODAL ── */}
      <Modal visible={interestModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setInterestModalVisible(false)}>
        <View style={[s.modalRoot, { paddingTop: Platform.OS === 'ios' ? 20 : insets.top }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setInterestModalVisible(false)}><Text style={s.modalActionText}>Cancel</Text></TouchableOpacity>
            <Text style={s.modalTitle}>Interests ({draftInterests.length}/5)</Text>
            <View style={{width: 50}} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
            {RICH_INTERESTS.map((cat, i) => (
              <View key={i} style={{ marginBottom: 24 }}>
                <Text style={s.interestCatTitle}>{cat.category}</Text>
                <View style={s.pillsWrap}>
                  {cat.items.map(item => {
                    const isSelected = draftInterests.includes(item);
                    return (
                      <TouchableOpacity key={item} onPress={() => toggleDraftInterest(item)} style={isSelected ? s.pillModalActive : s.pillModalIdle}>
                        <Text style={isSelected ? s.pillModalActiveText : s.pillModalIdleText}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={[s.fixedBottomBar, { paddingBottom: insets.bottom + 20 }]}>
             <TouchableOpacity style={s.saveBtnBig} onPress={saveInterests}>
               <Text style={s.saveBtnBigText}>Save Selections</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>

{/* ── LANGUAGES MODAL ── */}
<Modal visible={languageModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setLanguageModalVisible(false); setLanguageSearch(''); }}>
  <View style={[s.modalRoot, { paddingTop: Platform.OS === 'ios' ? 20 : insets.top }]}>
    <View style={s.modalHeader}>
      <TouchableOpacity onPress={() => { setLanguageModalVisible(false); setLanguageSearch(''); }}><Text style={s.modalActionText}>Close</Text></TouchableOpacity>
      <Text style={s.modalTitle}>Languages I Speak</Text>
      <View style={{width: 50}} />
    </View>
    <View style={s.searchInputContainer}>
      <Ionicons name="search" size={18} color={C.textLight} />
      <TextInput
        style={s.searchInput}
        placeholder="Search languages..."
        placeholderTextColor={C.textLight}
        value={languageSearch}
        onChangeText={setLanguageSearch}
      />
      {languageSearch.length > 0 && (
        <TouchableOpacity onPress={() => setLanguageSearch('')}>
          <Ionicons name="close-circle" size={18} color={C.textLight} />
        </TouchableOpacity>
      )}
    </View>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <View style={s.pillsWrap}>
        {AVAILABLE_LANGUAGES
          .filter(lang => lang.toLowerCase().includes(languageSearch.toLowerCase()))
          .map(item => {
          const isSelected = languages.includes(item);
          return (
            <TouchableOpacity key={item} onPress={() => toggleLanguage(item)} style={isSelected ? s.pillModalActive : s.pillModalIdle}>
              <Text style={isSelected ? s.pillModalActiveText : s.pillModalIdleText}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  </View>
</Modal>

      {/* ── PROMPT (MANAGE QUESTIONS) ── */}
      <Modal visible={promptManagerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPromptManagerVisible(false)}>
        <View style={[s.modalRoot, { paddingTop: Platform.OS === 'ios' ? 20 : insets.top }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setPromptManagerVisible(false)}>
               <Ionicons name="chevron-down" size={28} color={C.textMain} style={{marginLeft: -8}}/>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Manage Questions</Text>
            <View style={{width: 40}} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <Text style={s.textEditDesc}>You can add up to 2 questions to your profile.</Text>
            {[0, 1].map((slotIndex) => {
              const p = prompts[slotIndex];
              if (p) {
                return (
                  <View key={slotIndex} style={s.promptSlotFilled}>
                    <View style={s.promptSlotHeader}>
                      <Text style={s.promptQuestion}>{p.question}</Text>
                      <TouchableOpacity style={s.promptSlotDeleteBtn} onPress={() => removePrompt(slotIndex)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                        <Ionicons name="trash-outline" size={16} color={C.textLight} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => startEditingPrompt(slotIndex)}>
                      <Text style={s.promptAnswer}>{p.answer}</Text>
                    </TouchableOpacity>
                  </View>
                );
              } else {
                return (
                  <TouchableOpacity key={slotIndex} style={s.promptSlotEmpty} onPress={() => startEditingPrompt(slotIndex)}>
                    <Ionicons name="add-circle-outline" size={24} color={C.primary} style={{marginBottom: 8}}/>
                    <Text style={s.promptSlotEmptyText}>Select a Question</Text>
                  </TouchableOpacity>
                );
              }
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* ── PROMPT (SELECT/ANSWER QUESTION) ── */}
      <Modal visible={promptEditorVisible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setPromptEditorVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[s.modalRoot, { paddingTop: Platform.OS === 'ios' ? 20 : insets.top }]}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setPromptEditorVisible(false)}>
              <Text style={s.modalActionText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>{draftQuestion ? 'Answer' : 'Select Question'}</Text>
            <View style={{width: 40}} />
          </View>

          <ScrollView style={{ padding: 16 }}>
            {draftQuestion ? (
              <View style={s.promptAnswerContainer}>
                <Text style={s.promptAnswerTitle}>{draftQuestion}</Text>
                <TextInput
                  style={s.promptAnswerInput}
                  autoFocus
                  placeholder="Share your answer here..."
                  placeholderTextColor={C.textLight}
                  multiline
                  maxLength={150}
                  value={draftAnswer}
                  onChangeText={setDraftAnswer}
                />
              </View>
            ) : (
              <View style={{gap: 12}}>
                {PROMPT_QUESTIONS.map((q, i) => {
                  const isUsed = prompts.some(p => p.question === q);
                  if (isUsed && (activePromptIndex === null || prompts[activePromptIndex]?.question !== q)) return null; 
                  return (
                    <TouchableOpacity key={i} style={s.promptListCard} onPress={() => { setDraftQuestion(q); setDraftAnswer(''); }}>
                      <Text style={s.promptListText}>{q}</Text>
                      <Ionicons name="chevron-forward" size={16} color={C.textLight} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {draftQuestion && (
            <View style={[s.fixedBottomBar, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity style={s.saveBtnBig} onPress={finishPromptEditing}>
                <Text style={s.saveBtnBigText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

// ─── Reusable Photo Slot Component ──
const PhotoSlot = ({ uri, index, onToggle, isMain = false }: { uri: string | null; index: number; onToggle: () => void; isMain?: boolean }) => {
  if (uri) {
    return (
      <View style={s.photoFilled}>
        <Image source={{ uri }} style={s.photoImg} />
        <TouchableOpacity style={s.photoDelete} onPress={onToggle} hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
           <Ionicons name={isMain ? "repeat-outline" : "close"} size={14} color="#FFF" />
        </TouchableOpacity>
        {isMain && <View style={s.photoMainBadge}><Text style={s.photoMainBadgeTxt}>Main Profile</Text></View>}
      </View>
    );
  }
  return (
    <TouchableOpacity style={s.photoEmpty} onPress={onToggle} activeOpacity={0.7}>
      <View style={s.photoAddCircle}>
        <Ionicons name="add" size={24} color={C.primary} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Styles (Bumble Soft UI Applied) ─────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.sand }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.borderLight, zIndex: 10 },
  headerBtn: { width: 60, alignItems: 'flex-start' },
  headerTitle: { fontFamily: QS_BOLD, fontSize: 17, fontWeight: '700', color: '#000000' },
  headerSpacer: { width: 60 },

  content: { padding: 16, gap: 22 },
  section: { gap: 9 },
  sectionLabel: { fontFamily: QS_BOLD, fontSize: 16, fontWeight: '700', color: '#000000', marginLeft: 6 },

  // 4'lü Photo Grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  photoWrapper: { width: '48%', aspectRatio: 3/4 },
  photoFilled: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  photoEmpty: { flex: 1, borderRadius: 16, backgroundColor: C.bg, borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  photoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoAddCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.roseLt, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  photoDelete: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  photoEditBadge: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
  photoMainBadge: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  photoMainBadgeTxt: { fontFamily: QS_BOLD, fontSize: 10, fontWeight: '800', color: C.primary },

  // Cards & Rows (Soft UI - No Borders)
  cardGroup: { backgroundColor: C.bg, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowLabel: { fontFamily: QS_MEDIUM, fontSize: 15, color: '#000000' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowValue: { fontFamily: QS_MEDIUM, fontSize: 14, color: C.primary },
  rowValueEmpty: { fontFamily: QS_MEDIUM, fontSize: 14, color: C.textLight },
  rowValueReadOnly: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#111111' },
  divider: { height: 1, backgroundColor: C.borderLight, marginHorizontal: 16 },
  readOnlyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  // Bio Card
  bioCard: { backgroundColor: C.bg, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  bioText: { fontFamily: QS_MEDIUM, fontSize: 15, color: '#111111', lineHeight: 23, paddingRight: 26 },
  bioTextEmpty: { fontFamily: QS_MEDIUM, fontSize: 15, color: C.textLight, lineHeight: 23 },
  bioEditIcon: { position: 'absolute', top: 16, right: 16 },

  // Pills (Interests & Languages)
  interestsCard: { backgroundColor: C.bg, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillActive: { backgroundColor: '#F1F5F9', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20 },
  pillActiveText: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#000000' },
  editTagsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end', marginTop: 10, paddingVertical: 5, paddingHorizontal: 9 },
  editTagsBtnText: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#111111' },

  // Prompts UI (Ana Ekran)
  promptsCard: { backgroundColor: C.bg, borderRadius: 18, padding: 16, gap: 9, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  promptDescText: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#111111', lineHeight: 21 },
  promptCardMini: { backgroundColor: C.sand, borderRadius: 12, padding: 13 },
  promptQuestionMini: { fontFamily: QS_BOLD, fontSize: 12, fontWeight: '700', color: C.primary, textTransform: 'uppercase', marginBottom: 7 },
  promptAnswerMini: { fontFamily: QS_MEDIUM, fontSize: 15, color: '#111111', lineHeight: 22 },
  promptManageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingVertical: 11 },
  promptManageBtnText: { fontFamily: QS_MEDIUM, fontSize: 15, color: '#111111' },

  // ── Height Modal Styles ──
  heightTitleWrap: { paddingHorizontal: 26, marginTop: 30, marginBottom: 26 },
  heightMainTitle: { fontFamily: QS_BOLD, fontSize: 27, fontWeight: '800', color: '#000000', marginBottom: 7 },
  heightSubTitle: { fontFamily: QS_MEDIUM, fontSize: 16, color: '#64748B' },

  wheelOuter: { height: PICKER_H, overflow: 'hidden', position: 'relative' },
  wheelHighlight: {
    position: 'absolute', left: '12%', right: '12%',
    top: ITEM_H * 2, height: ITEM_H,
    backgroundColor: '#F1F5F9', borderRadius: 18,
    zIndex: 0,
  },
  wheelItem: { height: ITEM_H, justifyContent: 'center', alignItems: 'center', width: '100%' },
  wheelItemText: { fontFamily: QS_BOLD, fontSize: 23, color: '#000000', fontWeight: '700' },

  toggleContainer: { alignItems: 'center', marginTop: 35, marginBottom: 35 },
  toggleBg: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 30, padding: 5 },
  toggleBtn: { paddingVertical: 11, paddingHorizontal: 38, borderRadius: 26 },
  toggleBtnActive: { backgroundColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  toggleBtnText: { fontFamily: QS_BOLD, fontSize: 16, color: '#64748B' },
  toggleBtnTextActive: { color: '#FFFFFF' },

  // Bottom Sheet
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16, maxHeight: '60%', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 22 },
  sheetTitle: { fontFamily: QS_BOLD, fontSize: 19, fontWeight: '800', color: '#000000', paddingHorizontal: 26, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: C.borderLight, marginBottom: 10 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 26 },
  sheetOptionText: { fontFamily: QS_MEDIUM, fontSize: 16, color: '#000000' },
  sheetOptionTextActive: { color: C.primary, fontFamily: QS_BOLD },

  // Generic Modal Shared
  modalRoot: { flex: 1, backgroundColor: C.sand },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 18, backgroundColor: C.bg, borderBottomWidth: 1, borderColor: C.borderLight },
  modalActionText: { fontFamily: QS_BOLD, fontSize: 16, color: '#111111', fontWeight: '600' },
  modalTitle: { fontFamily: QS_BOLD, fontSize: 17, fontWeight: '800', color: '#000000' },

  // Search Input
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, marginHorizontal: 20, marginTop: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  searchInput: { flex: 1, fontFamily: QS_MEDIUM, fontSize: 15, color: '#000000', padding: 0 },
  
  // Modal Interests
  interestCatTitle: { fontFamily: QS_BOLD, fontSize: 13, fontWeight: '800', color: '#111111', marginBottom: 13, textTransform: 'uppercase', letterSpacing: 1 },
  pillModalIdle: { backgroundColor: C.bg, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  pillModalIdleText: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#111111' },
  pillModalActive: { backgroundColor: C.primary, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: {width:0, height:2} },
  pillModalActiveText: { fontFamily: QS_MEDIUM, fontSize: 14, color: '#FFF' },

  // Fixed Bottom Bar (Save Buttons)
  fixedBottomBar: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: C.bg, paddingHorizontal: 22, paddingTop: 18, borderTopWidth: 1, borderColor: C.borderLight },
  saveBtnBig: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  saveBtnBigText: { fontFamily: QS_BOLD, fontSize: 17, fontWeight: '800', color: '#FFF' },

  // Text Edit Modal
  textEditDesc: { fontFamily: QS_MEDIUM, fontSize: 16, color: '#111111', marginBottom: 22, lineHeight: 24 },
  textEditInputContainer: { backgroundColor: C.bg, borderRadius: 16, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 15, elevation: 4 },
  textEditInput: { fontFamily: QS_BOLD, fontSize: 19, color: '#000000', padding: 0 },
  textEditInputMultiline: { fontFamily: QS_MEDIUM, fontSize: 17, lineHeight: 25, textAlignVertical: 'top' },
  textEditCounter: { fontFamily: QS_BOLD, fontSize: 11, color: C.textLight, textAlign: 'right', marginTop: 12 },

  // Prompt Slots (Manager Modal)
  promptSlotFilled: { backgroundColor: C.bg, borderRadius: 18, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  promptSlotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 11 },
  promptQuestion: { fontFamily: QS_BOLD, fontSize: 12, fontWeight: '800', color: C.primary, flex: 1, paddingRight: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  promptAnswer: { fontFamily: QS_MEDIUM, fontSize: 18, color: '#000000', lineHeight: 27 },
  promptSlotDeleteBtn: { padding: 4 },
  promptSlotEmpty: { backgroundColor: C.bg, borderRadius: 20, paddingVertical: 35, borderWidth: 2, borderColor: C.borderLight, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  promptSlotEmptyText: { fontFamily: QS_BOLD, fontSize: 16, fontWeight: '700', color: '#111111' },

  // Prompt Answer Mode
  promptListCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.bg, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  promptListText: { fontFamily: QS_BOLD, fontSize: 15, fontWeight: '600', color: '#000000', flex: 1, paddingRight: 11 },
  promptAnswerContainer: { backgroundColor: C.bg, padding: 22, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  promptAnswerTitle: { fontFamily: QS_BOLD, fontSize: 15, fontWeight: '800', color: C.primary, marginBottom: 18, lineHeight: 21 },
  promptAnswerInput: { fontFamily: QS_MEDIUM, fontSize: 19, color: '#000000', minHeight: 130, textAlignVertical: 'top', lineHeight: 29 },
});