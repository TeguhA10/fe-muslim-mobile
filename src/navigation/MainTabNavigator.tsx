import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { AdzanScreen } from '../features/adzan/screens/AdzanScreen';
import { IbadahScreen } from '../features/ibadah/screens/IbadahScreen';
import { MasjidMapScreen } from '../features/maps/screens/MasjidMapScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { useThemeStore } from '../store/useThemeStore';
import { Home, Clock, Compass, MapPin, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export const MainTabNavigator: React.FC = () => {
  const { colors, isDarkMode } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: isDarkMode ? '#000000' : '#64748B',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Adzan"
        component={AdzanScreen}
        options={{
          tabBarLabel: 'Adzan',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Ibadah"
        component={IbadahScreen}
        options={{
          tabBarLabel: 'Ibadah',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Maps"
        component={MasjidMapScreen}
        options={{
          tabBarLabel: 'Masjid',
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};
