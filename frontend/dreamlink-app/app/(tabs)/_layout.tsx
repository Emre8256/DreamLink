import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, nameFilled, color, focused }: {
  name: IoniconName;
  nameFilled: IoniconName;
  color: string;
  focused: boolean;
}) {
  return <Ionicons name={focused ? nameFilled : name} size={26} color={color} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // ─── Yeni Premium Renk Paleti ───
  const activeColor = '#A63F4F'; // Koyu Rose (Crimson Deep)
  const inactiveColor = '#71717A'; // Uyumlu Tok Gri
  const badgeColor = '#A63F4F'; // Bildirim noktaları için premium rose

  const hasUnreadMessages = useAppStore(state => state.hasUnreadMessages);
  const hasUnreadMatches = useAppStore(state => state.hasUnreadMatches);
  const hasUnreadDreams = useAppStore(state => state.hasUnreadDreams);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700', // Yeni kalın font stiline uyum için 600'den 700'e çekildi
          letterSpacing: 0.3,
          paddingBottom: 4,
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          borderTopWidth: 0, // Çizgiyi tamamen sıfırladık
          elevation: 0,      // Android'deki olası gölgeyi engeller
          shadowOpacity: 0,  // iOS'taki olası gölgeyi engeller
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" nameFilled="home" color={color} focused={focused} />
          ),
          tabBarBadge: hasUnreadDreams ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: badgeColor, minWidth: 8, height: 8, borderRadius: 4, top: 4, right: 10 },
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          headerShown: false,
          tabBarLabel: 'Matches',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="heart-outline" nameFilled="heart" color={color} focused={focused} />
          ),
          tabBarBadge: hasUnreadMatches ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: badgeColor, minWidth: 8, height: 8, borderRadius: 4, top: 4, right: 10 },
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          headerShown: false,
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="sparkles-outline" nameFilled="sparkles" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          headerShown: false,
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chatbubbles-outline" nameFilled="chatbubbles" color={color} focused={focused} />
          ),
          tabBarBadge: hasUnreadMessages ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: badgeColor, minWidth: 8, height: 8, borderRadius: 4, top: 4, right: 10 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-outline" nameFilled="person" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}