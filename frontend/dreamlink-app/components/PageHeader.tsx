import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  backgroundColor?: string;
  borderBottomColor?: string;
  paddingHorizontal?: number;
}

export const PageHeader = ({
  title,
  subtitle,
  rightElement,
  backgroundColor = '#FFFFFF',
  borderBottomColor = 'rgba(148,163,184,0.1)',
  paddingHorizontal = 22,
}: PageHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: Platform.OS === 'ios' ? insets.top : 0,
          paddingHorizontal,
          backgroundColor,
          borderBottomColor,
        },
      ]}
    >
      <View style={styles.headerContent}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingVertical: 14,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1714',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  rightElement: {
    marginLeft: 16,
  },
});
