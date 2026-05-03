import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { Moon, Sparkles, Heart, MessageCircle, User } from 'lucide-react-native';

type LucideIcon = React.ComponentType<{ size: number; color: string; strokeWidth: number }>;

function TabIcon({ Icon, color, focused }: {
  Icon: LucideIcon;
  color: string;
  focused: boolean;
}) {
  return <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 2} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // ─── Premium Renk Paleti ───
  const activeColor = '#A63F4F';
  const inactiveColor = '#71717A';
  const badgeColor = '#A63F4F';

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
          fontFamily: 'Quicksand_700Bold',
          fontSize: 11,
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
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Moon} color={color} focused={focused} />
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
            <TabIcon Icon={Sparkles} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          headerShown: false,
          tabBarLabel: 'Likes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Heart} color={color} focused={focused} />
          ),
          tabBarBadge: hasUnreadMatches ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: badgeColor, minWidth: 8, height: 8, borderRadius: 4, top: 4, right: 10 },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          headerShown: false,
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={MessageCircle} color={color} focused={focused} />
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
            <TabIcon Icon={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
