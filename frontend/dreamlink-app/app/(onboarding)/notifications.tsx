import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';

import { useOnboarding } from './OnboardingContext';
import { C } from './styles';

export default function NotificationsScreen() {
  const { setCanContinue } = useOnboarding();

  // Optional — user can always skip
  useEffect(() => {
    setCanContinue(true);
  }, [setCanContinue]);

  return (
    <View style={local.container}>
      <View style={local.center}>
        <View style={local.bellCircle}>
          <Bell color={C.white} size={28} strokeWidth={2.5} />
        </View>
        <Text style={local.title}>Stay in the loop</Text>
        <Text style={local.copy}>
          Get notified when someone likes you, sends a message, or your dream connection is nearby.
        </Text>
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 8,
  },
  bellCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.rose,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: C.rose,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    color: C.white,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
    textAlign: 'center',
    includeFontPadding: false,
  },
  copy: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Quicksand_500Medium',
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
  },
});
