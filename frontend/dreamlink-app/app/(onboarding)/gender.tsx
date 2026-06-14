import React, { useEffect } from 'react';

import { useOnboarding } from './OnboardingContext';
import { OnboardingSection } from './components/OnboardingSection';
import { Choice } from './components/ChoiceChip';

export default function GenderScreen() {
  const { gender, setGender, setCanContinue } = useOnboarding();

  useEffect(() => {
    setCanContinue(Boolean(gender));
  }, [gender, setCanContinue]);

  const options = ['Man', 'Woman', 'Other'] as const;
  const labelMap = {
    Man: 'Man',
    Woman: 'Woman',
    Other: 'Other',
  };

  return (
    <OnboardingSection
      title="How should we describe you? 💫"
      copy="This helps us find the most compatible dream connections for you."
    >
      {options.map((option) => (
        <Choice
          key={option}
          label={labelMap[option]}
          selected={gender === option}
          onPress={() => setGender(option)}
        />
      ))}
    </OnboardingSection>
  );
}
