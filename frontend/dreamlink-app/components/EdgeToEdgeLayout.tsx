import React, { useEffect } from 'react';
import { View, StatusBar, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface EdgeToEdgeLayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  statusBarBg?: string;
  safeEdges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const EdgeToEdgeLayout = ({
  children,
  backgroundColor = '#FFFFFF',
  statusBarStyle = 'dark-content',
  statusBarBg,
  safeEdges = ['top', 'bottom'],
}: EdgeToEdgeLayoutProps) => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    StatusBar.setBarStyle(statusBarStyle, true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(statusBarBg || backgroundColor);
      StatusBar.setTranslucent(true);
    }
  }, [statusBarStyle, statusBarBg, backgroundColor]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        {
          paddingTop: safeEdges.includes('top') ? insets.top : 0,
          paddingBottom: safeEdges.includes('bottom') ? insets.bottom : 0,
          paddingLeft: safeEdges.includes('left') ? insets.left : 0,
          paddingRight: safeEdges.includes('right') ? insets.right : 0,
        },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
