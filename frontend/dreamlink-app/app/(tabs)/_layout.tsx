import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const activeColor = '#B3717A'; // Updated to primary from design
  const inactiveColor = '#94a3b8'; // text-slate-400

  // Bildirim durumlarını store'dan al
  const hasUnreadMessages = useAppStore(state => state.hasUnreadMessages);
  const hasUnreadMatches = useAppStore(state => state.hasUnreadMatches);
  const hasUnreadDreams = useAppStore(state => state.hasUnreadDreams);

  const windowWidth = Dimensions.get('window').width;
  const TARGET_WIDTH = 280; // Compact width
  const MIN_SIDE_MARGIN = Math.max(windowWidth * 0.05, 16); // >= 5% each side
  const sideMargin = Math.max((windowWidth - TARGET_WIDTH) / 2, MIN_SIDE_MARGIN);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 0, // <-- Burayı 16'dan 0'a çek veya bu satırı tamamen sil
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Math.max(insets.bottom + 8, 8),
          
          // MERKEZLEME İÇİN EN GARANTİ YÖNTEM:
          // Sağdan ve soldan büyük bir boşluk vererek çubuğu ortaya hapsediyoruz.
          marginHorizontal: 30,     // Bu sayıyı artırırsan çubuk kısalır, azaltırsan uzar.
          
          // GÖRSEL STİL
          backgroundColor: '#ffffff',
          borderRadius: 30,
          height: 64,
          
          // GÖLGE VE KENARLIK
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(226, 232, 240, 0.8)',
          
          // GÖLGE (iOS & Android)
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        
          // İÇERİK DÜZENİ
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="home-outline" size={26} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginTop: 4 }} />}
            </View>
          ),
          tabBarBadge: hasUnreadDreams ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF6B6B', minWidth: 10, height: 10, borderRadius: 5 },
        }}
      />

      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="heart-outline" size={26} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginTop: 4 }} />}
            </View>
          ),
          tabBarBadge: hasUnreadMatches ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF6B6B', minWidth: 10, height: 10, borderRadius: 5 },
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="sparkles-outline" size={26} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginTop: 4 }} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chats',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chatbubbles-outline" size={26} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginTop: 4 }} />}
            </View>
          ),
          tabBarBadge: hasUnreadMessages ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF6B6B', minWidth: 10, height: 10, borderRadius: 5 },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person-outline" size={26} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginTop: 4 }} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
