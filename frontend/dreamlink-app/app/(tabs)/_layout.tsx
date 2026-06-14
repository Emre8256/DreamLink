import React, { useRef } from 'react';
import { Tabs } from 'expo-router';
import { View, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Moon,
  Heart,
  BookOpen,
  MessageCircle,
  User
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';

const TabButton = (props: any) => {
  const { children, onPress } = props;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const handlePress = (e: any) => {
    // Reset and start ripple animation
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Call the original onPress
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View style={{
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#A63F4F',
            opacity: rippleAnim.interpolate({
              inputRange: [0, 0.2, 1],
              outputRange: [0, 0.12, 0], // Pale color spread
            }),
            transform: [{
              scale: rippleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 2.5], // Starts small and fills the area
              })
            }],
          }}
        />
        {children}
      </View>
    </Pressable>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // ─── Orijinal Temaya Dönüş ───
  const activeColor = '#A63F4F'; // Orijinal Rose Red aktif rengi
  const inactiveColor = '#71717A'; // Uyumlu tok gri
  const badgeColor = '#A63F4F'; // Bildirim noktaları

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
          fontFamily: 'Quicksand_700Bold',
          letterSpacing: 0.3,
          paddingBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 60 + insets.bottom, // Yükseklik kesinlikle aynı kaldı
          paddingTop: 6, // İkonlar orijinal tasarımındaki gibi yukarı yaklaştı
          borderTopWidth: 0, // Çizgi tamamen sıfırlandı, arkaplanla bütünleşti
          elevation: 0,      // Android gölgesi engellendi[cite: 3]
          shadowOpacity: 0,  // iOS gölgesi engellendi[cite: 3]
        },
      }}>

      <Tabs.Screen
        name="today"
        options={{
          headerShown: false,
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <BookOpen color={color} size={26} strokeWidth={focused ? 2.5 : 2} />
          ),
          tabBarBadge: hasUnreadDreams ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: badgeColor, minWidth: 8, height: 8, borderRadius: 4, top: 4, right: 10 },
          tabBarButton: (props) => <TabButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="likes"
        options={{
          headerShown: false,
          tabBarLabel: 'Likes',
          tabBarIcon: ({ color, focused }) => (
            <Heart color={color} size={26} strokeWidth={focused ? 2.5 : 2} />
          ),
          tabBarBadge: hasUnreadMatches ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: badgeColor, minWidth: 8, height: 8, borderRadius: 4, top: 4, right: 10 },
          tabBarButton: (props) => <TabButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="matches"
        options={{
          headerShown: false,
          tabBarLabel: 'Matches',
          tabBarIcon: ({ color, focused }) => (
            <Moon color={color} size={26} strokeWidth={focused ? 2.5 : 2} />
          ),
          tabBarButton: (props) => <TabButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          headerShown: false,
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle color={color} size={26} strokeWidth={focused ? 2.5 : 2} />
          ),
          tabBarBadge: hasUnreadMessages ? '' : undefined,
          tabBarBadgeStyle: { backgroundColor: badgeColor, minWidth: 8, height: 8, borderRadius: 4, top: 4, right: 10 },
          tabBarButton: (props) => <TabButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={26} strokeWidth={focused ? 2.5 : 2} />
          ),
          tabBarButton: (props) => <TabButton {...props} />,
        }}
      />
    </Tabs>
  );
}