import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform, Easing } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { AdzanScreen } from '../features/adzan/screens/AdzanScreen';
import { IbadahScreen } from '../features/ibadah/screens/IbadahScreen';
import { MasjidMapScreen } from '../features/maps/screens/MasjidMapScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { useThemeStore } from '../store/useThemeStore';
import { Newspaper, BellRing, BookOpen, Landmark, UserCheck, LucideIcon } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

interface AnimatedTabIconProps {
  focused: boolean;
  color: string;
  isDarkMode: boolean;
  IconComponent: LucideIcon | any;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  focused,
  color,
  isDarkMode,
  IconComponent,
}) => {
  const animValue = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.poly(3)),
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.1],
  });

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  const dotScale = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <View style={styles.tabItemContainer}>
      <Animated.View
        style={[
          styles.iconContainer,
          focused && {
            backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.16)' : '#DCFCE7',
          },
          {
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        <IconComponent color={color} size={22} />
      </Animated.View>

      {/* Active Indicator Dot */}
      <Animated.View
        style={[
          styles.activeDot,
          { backgroundColor: color },
          { transform: [{ scale: dotScale }] },
        ]}
      />
    </View>
  );
};

export const MainTabNavigator: React.FC = () => {
  const { colors, isDarkMode } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 6,
          paddingTop: 6,
          elevation: 10,
          shadowColor: isDarkMode ? '#000000' : '#0F172A',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              focused={focused}
              color={color}
              isDarkMode={isDarkMode}
              IconComponent={Newspaper}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Adzan"
        component={AdzanScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              focused={focused}
              color={color}
              isDarkMode={isDarkMode}
              IconComponent={BellRing}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Ibadah"
        component={IbadahScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              focused={focused}
              color={color}
              isDarkMode={isDarkMode}
              IconComponent={BookOpen}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Maps"
        component={MasjidMapScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              focused={focused}
              color={color}
              isDarkMode={isDarkMode}
              IconComponent={Landmark}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              focused={focused}
              color={color}
              isDarkMode={isDarkMode}
              IconComponent={UserCheck}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
