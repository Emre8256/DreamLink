import React from 'react';
import { ScrollView, View, StyleSheet, ViewStyle, ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface PageContentProps extends Omit<ScrollViewProps, 'children'> {
  children: React.ReactNode;
  paddingHorizontal?: number;
  paddingVertical?: number;
  backgroundColor?: string;
  showsVerticalScrollIndicator?: boolean;
  scrollable?: boolean;
}

/**
 * Standardized content wrapper with edge-to-edge safe area handling
 * and consistent padding hierarchy throughout the app
 */
export const PageContent = ({
  children,
  paddingHorizontal = 22,
  paddingVertical = 0,
  backgroundColor = '#FFFFFF',
  showsVerticalScrollIndicator = false,
  scrollable = true,
  ...props
}: PageContentProps) => {
  const insets = useSafeAreaInsets();

  const contentStyle = {
    paddingHorizontal,
    paddingVertical,
  };

  if (!scrollable) {
    return (
      <View
        style={[
          styles.nonScrollableContainer,
          {
            paddingBottom: insets.bottom,
            backgroundColor,
          },
        ]}
      >
        <View style={contentStyle}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor }}
      contentContainerStyle={{
        paddingHorizontal,
        paddingVertical,
        paddingBottom: insets.bottom + paddingVertical,
      }}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      scrollIndicatorInsets={{ right: 1 }}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  nonScrollableContainer: {
    flex: 1,
  },
});
