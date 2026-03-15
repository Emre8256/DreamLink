import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const activeColor = '#6e44ff';
  const inactiveColor = 'gray';

  // Bildirim durumlarını store'dan al
  const hasUnreadMessages = useAppStore(state => state.hasUnreadMessages);
  const hasUnreadMatches = useAppStore(state => state.hasUnreadMatches);
  const hasUnreadDreams = useAppStore(state => state.hasUnreadDreams);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 65 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
          tabBarBadge: hasUnreadDreams ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF6B6B', scaleX: 0.5, scaleY: 0.5 },
        }}
      />

      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
          ),
          tabBarBadge: hasUnreadMatches ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF6B6B', scaleX: 0.5, scaleY: 0.5 },
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chats',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
          ),
          tabBarBadge: hasUnreadMessages ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF6B6B', scaleX: 0.5, scaleY: 0.5 },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: true,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}