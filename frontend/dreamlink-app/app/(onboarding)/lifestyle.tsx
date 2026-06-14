import React, { useEffect } from 'react';
import { Cigarette, Wine } from 'lucide-react-native';

import { useOnboarding } from './OnboardingContext';
import { OnboardingSection } from './components/OnboardingSection';
import { LifestyleSelector } from './components/LifestyleSelector';
import { C } from './styles';

export default function LifestyleScreen() {
  const { smoking, setSmoking, alcohol, setAlcohol, setCanContinue } = useOnboarding();

  useEffect(() => {
    setCanContinue(smoking !== '' && alcohol !== '');
  }, [smoking, alcohol, setCanContinue]);

  return (
    <OnboardingSection
      title="Little lifestyle habits ☕"
      copy="Align your habits to find matches that mirror your lifestyle."
    >
      <LifestyleSelector
        title="Smoking Habits"
        icon={<Cigarette color={C.white} size={18} strokeWidth={2} />}
        value={smoking}
        onChange={setSmoking}
      />
      <LifestyleSelector
        title="Drinking Habits"
        icon={<Wine color={C.white} size={18} strokeWidth={2} />}
        value={alcohol}
        onChange={setAlcohol}
      />
    </OnboardingSection>
  );
}
