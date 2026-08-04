import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { SPACING } from '../../constants/theme';
import { IslamicTexture } from './IslamicTexture';
import { NetworkAlertBanner } from '../common/NetworkAlertBanner';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: string;
  barStyle?: 'dark-content' | 'light-content';
  /**
   * Texture opacity override. Set to 0 to hide texture.
   * Default: 0.18 dark screens / 0.10 light screens (clearly visible)
   */
  textureOpacity?: number;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  bg,
  barStyle,
  textureOpacity,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const statusBarHeight =
    Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 0;
  const currentBg = bg || colors.background;
  const currentBarStyle =
    barStyle || (isDarkMode ? 'light-content' : 'dark-content');

  // Detect whether background is "dark" to pick correct tint
  const isDarkBg = bg != null ? isColorDark(bg) : isDarkMode;

  // Higher opacity = clearly visible texture
  const resolvedOpacity =
    textureOpacity !== undefined
      ? textureOpacity
      : isDarkBg
        ? 0.05   // dark screens: white strokes clearly visible
        : 0.11;  // light screens: dark strokes visible but not overwhelming

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: currentBg, paddingTop: statusBarHeight },
      ]}
    >
      <StatusBar
        barStyle={currentBarStyle}
        backgroundColor={currentBg}
        translucent
      />

      <NetworkAlertBanner />

      {/* Islamic geometric texture fills entire background */}
      <IslamicTexture
        opacity={resolvedOpacity}
        tint={isDarkBg ? 'light' : 'gold'}
        absolute
      />

      {/* Screen content on top of texture */}
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
};

function isColorDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return false;
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.35;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.xs,
    zIndex: 0
  },
});
