import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Check, Edit2, MessageCircle, Plus, RefreshCcw, X } from 'lucide-react-native';
import * as NavigationBar from 'expo-navigation-bar';

import { useOnboarding } from './OnboardingContext';
import { OnboardingSection } from './components/OnboardingSection';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { styles, C } from './styles';

const PROMPT_CATEGORIES = [
  {
    label: 'Thoughts',
    questions: [
      'The thought that spins in my head before sleeping is...',
      'Something most people get wrong about me is...',
      'The question that keeps me up at night is...',
      'Something I disagree with most people on is...',
      'If I could change one thing in the world, it would be...',
      'The most beautiful thing about humanity is...',
    ],
  },
  {
    label: 'Dreams',
    questions: [
      'A dream that is still fresh in my mind is...',
      'If my life were a movie, the title would be...',
      'My next big dream in life is...',
      'Where I want to be in five years is...',
      'If I were brave enough, the first thing I would do is...',
      'In a parallel universe, I would probably be...',
    ],
  },
  {
    label: 'Daily Life',
    questions: [
      'My ideal Sunday morning looks like...',
      'The absolute best way for me to recharge is...',
      'My perfect cozy day at home includes...',
      'A simple little thing that always makes me happy is...',
      'The non-negotiable part of my morning routine is...',
      'One thing I absolutely cannot say no to is...',
    ],
  },
  {
    label: 'Connections',
    questions: [
      'A great conversation starter for me is...',
      'The question I ask to truly get to know someone is...',
      'My version of a perfect first date looks like...',
      'To be honest, what I value most in a connection is...',
      'What my friends would say about me is...',
      'What I think makes someone truly attractive is...',
    ],
  },
  {
    label: 'Deep Dive',
    questions: [
      'Someone who really gets me knows that...',
      'The hardest lesson I\'ve learned over the years is...',
      'I am most honest with myself when...',
      'A ritual that holds a deep meaning for me is...',
      'The way I usually overcome my fears is...',
      'Something I don\'t say out loud but am proud of is...',
    ],
  },
  {
    label: 'Fun & Leisure',
    questions: [
      'My favorite getaway method is...',
      'An activity I never, ever get bored of is...',
      'I couldn\'t live without my music because...',
      'A hobby of mine that usually surprises people is...',
      'The best spontaneous thing I\'ve ever done was...',
      'If I had to name my current playlist, it would be...',
    ],
  },
];

type ModalState = 'none' | 'picking_question' | 'answering';

export default function PromptsScreen() {
  const { prompts, setPrompts, setCanContinue } = useOnboarding();
  const insets = useSafeAreaInsets();
  const [modalState, setModalState] = useState<ModalState>('none');
  const [activePromptIndex, setActivePromptIndex] = useState<number | null>(null);
  const [promptModalCategory, setPromptModalCategory] = useState(0);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const modalScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (modalState !== 'answering') {
      keyboardHeight.setValue(0);
      setKeyboardVisible(false);
      setKbHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardVisible(true);
      setKbHeight(e.endCoordinates.height);
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration ?? 250 : 0,
        useNativeDriver: false,
      }).start();
      setTimeout(() => {
        modalScrollRef.current?.scrollToEnd({ animated: true });
      }, Platform.OS === 'ios' ? 50 : 100);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, (e) => {
      setKeyboardVisible(false);
      setKbHeight(0);
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration ?? 250 : 0,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [modalState, keyboardHeight]);

  const naturalBottom = Math.max(insets.bottom + 16, 24);

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setBackgroundColorAsync('#FFFFFF');
        NavigationBar.setButtonStyleAsync('dark');
      } catch (err) {
        console.warn('NavigationBar error:', err);
      }
    }
  }, [modalState]);

  const selectedPrompts = useMemo(() => prompts.filter((prompt) => prompt.question), [prompts]);

  const validPromptsCount = useMemo(() => {
    return prompts.filter((p) => p.question && p.answer.trim().length > 0).length;
  }, [prompts]);

  const isValid = validPromptsCount >= 1;

  useEffect(() => {
    setCanContinue(isValid);
  }, [isValid, setCanContinue]);

  const handleAddPrompt = () => {
    if (!prompts[0]?.question) {
      setActivePromptIndex(0);
      setModalState('picking_question');
      setPromptModalCategory(0);
    } else if (prompts.length < 2) {
      setPrompts([...prompts, { question: '', answer: '' }]);
      setActivePromptIndex(prompts.length);
      setModalState('picking_question');
      setPromptModalCategory(0);
    } else if (prompts.length === 2 && !prompts[1].question) {
      setActivePromptIndex(1);
      setModalState('picking_question');
      setPromptModalCategory(0);
    }
  };

  const handleEditPrompt = (index: number) => {
    setActivePromptIndex(index);
    setModalState('answering');
  };

  const updateActivePrompt = (patch: Partial<{ question: string; answer: string }>) => {
    if (activePromptIndex === null) return;
    setPrompts((current) =>
      current.map((item, i) => (i === activePromptIndex ? { ...item, ...patch } : item)),
    );
  };

  const removePrompt = (index: number) => {
    setPrompts((current) => {
      const filtered = current.filter((_, i) => i !== index);
      return filtered.length === 0 ? [{ question: '', answer: '' }] : filtered;
    });
  };

  const closeModalAndCleanUp = () => {
    setPrompts((current) => {
      const cleaned = current.filter((p) => p.question && p.answer.trim().length > 0);
      return cleaned.length === 0 ? [{ question: '', answer: '' }] : cleaned;
    });
    setModalState('none');
  };

  return (
    <OnboardingSection
      title="Choose some starter questions! ✨"
      copy="Select one or two questions for your profile. This helps others break the ice and start a warm conversation with you!"
    >
      <View style={styles.promptGrid}>
        {prompts.map((prompt, index) => {
          if (!prompt.question) return null;

          return (
            <AnimatedPressable
              key={`${prompt.question}-${index}`}
              style={styles.promptDisplayCard}
              onPress={() => handleEditPrompt(index)}
            >
              <View style={styles.promptEditIcon}>
                <Edit2 color={C.white} size={15} />
              </View>
              <Pressable
                style={styles.promptRemoveIcon}
                onPress={() => removePrompt(index)}
              >
                <X color={C.white} size={15} />
              </Pressable>
              <View style={styles.promptCardBadge}>
                <MessageCircle color={C.white} size={14} />
                <Text style={styles.promptCardBadgeText}>Question {selectedPrompts.indexOf(prompt) + 1}</Text>
              </View>
              <Text style={styles.promptDisplayQuestion}>{prompt.question}</Text>
              <Text style={styles.promptDisplayAnswer}>
                {prompt.answer || 'Tap to add your answer'}
              </Text>
            </AnimatedPressable>
          );
        })}

        {selectedPrompts.length < 2 && (
          <AnimatedPressable style={styles.addPromptButton} onPress={handleAddPrompt}>
            <View style={styles.addPromptIcon}>
              <Plus color={C.white} size={22} />
            </View>
            <Text style={styles.addPromptText}>
              {selectedPrompts.length === 0 ? 'Pick a question' : 'Add another question'}
            </Text>
            <Text style={styles.addPromptSubtext}>Select a question and share your response.</Text>
          </AnimatedPressable>
        )}
      </View>

      <Modal
        visible={modalState === 'picking_question'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModalAndCleanUp}
        statusBarTranslucent={true}
      >
        <View style={styles.promptModalSurface}>
          <StatusBar style="light" />
          <LinearGradient colors={['#8C3048', '#4C1523', '#1F0C10', '#0E0B0D']} style={StyleSheet.absoluteFill} />
          <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: naturalBottom }}>
            <View style={[styles.modalHeader, { alignItems: 'center' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Choose a question</Text>
              </View>
              <Pressable onPress={closeModalAndCleanUp} style={[styles.modalClose, { marginTop: 0 }]}>
                <X color={C.white} size={20} />
              </Pressable>
            </View>

            <View style={styles.modalTabBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modalTabRow}
              >
                {PROMPT_CATEGORIES.map((cat, i) => {
                  const active = promptModalCategory === i;
                  return (
                    <Pressable
                      key={cat.label}
                      style={[styles.modalTab, active && styles.modalTabActive]}
                      onPress={() => setPromptModalCategory(i)}
                    >
                      <Text style={[styles.modalTabText, active && styles.modalTabTextActive]}>
                        {cat.label}
                      </Text>
                      <View style={[styles.modalTabLine, active && styles.modalTabLineActive]} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.modalQuestions} showsVerticalScrollIndicator={false}>
              {PROMPT_CATEGORIES[promptModalCategory].questions.map((q) => {
                const isSelected =
                  activePromptIndex !== null && prompts[activePromptIndex]?.question === q;
                const isAlreadySelected = prompts.some(
                  (p, idx) => idx !== activePromptIndex && p.question === q,
                );
                return (
                  <Pressable
                    key={q}
                    disabled={isAlreadySelected}
                    style={[
                      styles.questionOption,
                      isSelected && styles.questionOptionSelected,
                      isAlreadySelected && { opacity: 0.5 },
                    ]}
                    onPress={() => {
                      if (activePromptIndex !== null) {
                        updateActivePrompt({ question: q });
                        setModalState('answering');
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.questionOptionText,
                        isSelected && styles.questionOptionTextSelected,
                      ]}
                    >
                      {q}
                    </Text>
                    <View
                      style={[
                        styles.questionOptionCheck,
                        (isSelected || isAlreadySelected) && styles.questionOptionCheckSelected,
                      ]}
                    >
                      {(isSelected || isAlreadySelected) && (
                        <Check color={C.white} size={14} strokeWidth={3} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalState === 'answering'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModalAndCleanUp}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.promptModalSurface}>
            <StatusBar style="light" />
            <LinearGradient colors={['#8C3048', '#4C1523', '#1F0C10', '#0E0B0D']} style={StyleSheet.absoluteFill} />
            <View style={{ flex: 1, paddingTop: insets.top + 18, paddingHorizontal: 24, paddingBottom: naturalBottom + 60 + 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={styles.modalAccentPill}>
                  <Text style={styles.modalAccentText}>YOUR ANSWER</Text>
                </View>
                <Pressable onPress={closeModalAndCleanUp} style={styles.modalClose}>
                  <X color={C.white} size={20} />
                </Pressable>
              </View>

              <ScrollView
                ref={modalScrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingBottom: keyboardVisible ? kbHeight + 60 + 16 : 0,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.answerModalQuestion}>
                  {activePromptIndex !== null ? prompts[activePromptIndex]?.question : ''}
                </Text>

                <Pressable
                  style={styles.answerModalChangeQuestion}
                  onPress={() => setModalState('picking_question')}
                >
                  <RefreshCcw color={C.white} size={14} />
                  <Text style={styles.answerModalChangeQuestionText}>Change Question</Text>
                </Pressable>

                <TextInput
                  value={activePromptIndex !== null ? prompts[activePromptIndex]?.answer : ''}
                  onChangeText={(answer) => updateActivePrompt({ answer })}
                  placeholder="Type your thoughts here..."
                  placeholderTextColor={C.muted}
                  multiline
                  autoFocus
                  style={styles.answerModalInput}
                  selectionColor={C.rose}
                  onFocus={() => {
                    setTimeout(() => {
                      modalScrollRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                />
              </ScrollView>

              <Animated.View
                style={{
                  position: 'absolute',
                  left: 28,
                  right: 28,
                  bottom: keyboardHeight.interpolate({
                    inputRange: [0, 1000],
                    outputRange: [naturalBottom, naturalBottom + 1000],
                    extrapolate: 'clamp',
                  }),
                  gap: 12,
                }}
              >
                <AnimatedPressable
                  style={[styles.primaryButton, { marginTop: 0, marginBottom: 0 }]}
                  onPress={closeModalAndCleanUp}
                >
                  <Text style={styles.primaryText}>Save</Text>
                </AnimatedPressable>
              </Animated.View>
            </View>
          </View>
        </View>
      </Modal>
    </OnboardingSection>
  );
}
