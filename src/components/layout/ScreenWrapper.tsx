import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, StyleProp, ViewStyle, Platform } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { SPACING } from '../../constants/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: string;
  barStyle?: 'dark-content' | 'light-content';
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  bg,
  barStyle,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const currentBg = bg || colors.background;
  const currentBarStyle = barStyle || (isDarkMode ? 'light-content' : 'dark-content');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentBg, paddingTop: statusBarHeight }]}>
      <StatusBar barStyle={currentBarStyle} backgroundColor={currentBg} translucent />
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.xs,
  },
});
