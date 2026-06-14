import React, { createContext, useContext, useState, useRef } from 'react';
import { ScrollView } from 'react-native';

export type Gender = 'Man' | 'Woman' | 'Other' | '';
export type LifestyleValue = 'Never' | 'Sometimes' | 'Socially' | 'Often' | '';
export type PromptAnswer = { question: string; answer: string };

interface OnboardingContextType {
  name: string;
  setName: (v: string) => void;
  dobDay: string;
  setDobDay: (v: string) => void;
  dobMonth: string;
  setDobMonth: (v: string) => void;
  dobYear: string;
  setDobYear: (v: string) => void;
  gender: Gender;
  setGender: (v: Gender) => void;
  height: number;
  setHeight: (v: number) => void;
  interests: string[];
  setInterests: React.Dispatch<React.SetStateAction<string[]>>;
  smoking: LifestyleValue;
  setSmoking: (v: LifestyleValue) => void;
  alcohol: LifestyleValue;
  setAlcohol: (v: LifestyleValue) => void;
  prompts: PromptAnswer[];
  setPrompts: React.Dispatch<React.SetStateAction<PromptAnswer[]>>;
  photos: (string | null)[];
  setPhotos: React.Dispatch<React.SetStateAction<(string | null)[]>>;
  
  canContinue: boolean;
  setCanContinue: (v: boolean) => void;

  /** Optional intercept: if set, layout calls this instead of goNext */
  onContinuePress: (() => void) | null;
  setOnContinuePress: (fn: (() => void) | null) => void;

  /** Layout's goNext, set by layout so screens can navigate directly */
  goNext: (() => void) | null;
  setGoNext: (fn: () => void) => void;
  
  scrollTo: (y: number) => void;
  mainScrollRef: React.RefObject<ScrollView | null>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [height, setHeight] = useState(172);
  const [interests, setInterests] = useState<string[]>([]);
  const [smoking, setSmoking] = useState<LifestyleValue>('');
  const [alcohol, setAlcohol] = useState<LifestyleValue>('');
  const [prompts, setPrompts] = useState<PromptAnswer[]>([{ question: '', answer: '' }]);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
  
  const [canContinue, setCanContinue] = useState(false);
  const [onContinuePress, setOnContinuePressState] = useState<(() => void) | null>(null);

  const setOnContinuePress = (fn: (() => void) | null) => {
    setOnContinuePressState(() => fn);
  };

  const [goNext, setGoNextState] = useState<(() => void) | null>(null);
  const setGoNext = (fn: () => void) => {
    setGoNextState(() => fn);
  };
  
  const mainScrollRef = useRef<ScrollView>(null);

  const scrollTo = (y: number) => {
    setTimeout(() => {
      mainScrollRef.current?.scrollTo({ y, animated: true });
    }, 250);
  };

  return (
    <OnboardingContext.Provider
      value={{
        name,
        setName,
        dobDay,
        setDobDay,
        dobMonth,
        setDobMonth,
        dobYear,
        setDobYear,
        gender,
        setGender,
        height,
        setHeight,
        interests,
        setInterests,
        smoking,
        setSmoking,
        alcohol,
        setAlcohol,
        prompts,
        setPrompts,
        photos,
        setPhotos,
        canContinue,
        setCanContinue,
        onContinuePress,
        setOnContinuePress,
        goNext,
        setGoNext,
        scrollTo,
        mainScrollRef,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
