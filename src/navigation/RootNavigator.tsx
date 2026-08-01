import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MainTabNavigator } from './MainTabNavigator';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../features/auth/screens/RegisterScreen';
import { VerifyOtpScreen } from '../features/auth/screens/VerifyOtpScreen';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { useAuthStore } from '../store/useAuthStore';
import { useLocationStore } from '../store/useLocationStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, setAuthToken } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const Stack = createNativeStackNavigator();

const AUTH_STORAGE_KEYS = {
  accessToken: 'auth_access_token',
  refreshToken: 'auth_refresh_token',
} as const;

export const RootNavigator: React.FC = () => {
  const {
    isAuthenticated,
    isGuest,
    continueAsGuest,
    pendingRegisterRedirect,
    clearRegisterRedirect,
  } = useAuthStore();

  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'verify-otp' | 'forgot-password'>('login');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>('');
  const [unverifiedOtpExpiresAt, setUnverifiedOtpExpiresAt] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  const showMainApp = isAuthenticated || isGuest;

  useEffect(() => {
    let isActive = true;

    const bootstrapAuth = async () => {
      try {
        await useLocationStore.getState().loadSavedLocation();
        const storedAccessToken = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
        const storedRefreshToken = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);

        const accessToken = storedAccessToken?.trim() || '';
        const refreshToken = storedRefreshToken?.trim() || '';

        if (!accessToken) return;

        setAuthToken(accessToken);

        try {
          const meRes = await apiClient.get(ENDPOINTS.AUTH.ME);
          const user = meRes.data?.data?.user || null;
          if (user && isActive) {
            await useAuthStore.getState().login(user, accessToken, refreshToken || null);
          }
          return;
        } catch (meErr: any) {
          if (!refreshToken) {
            if (isActive) await useAuthStore.getState().logout();
            return;
          }
        }

        try {
          const refreshRes = await apiClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN, { refresh_token: refreshToken });
          const newAccessToken = refreshRes.data?.data?.accessToken || '';
          const newRefreshToken = refreshRes.data?.data?.refreshToken || '';
          if (!newAccessToken || !newRefreshToken) {
            if (isActive) await useAuthStore.getState().logout();
            return;
          }

          setAuthToken(newAccessToken);
          if (isActive) await useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

          const meRes = await apiClient.get(ENDPOINTS.AUTH.ME);
          const user = meRes.data?.data?.user || null;
          if (user && isActive) {
            await useAuthStore.getState().login(user, newAccessToken, newRefreshToken);
          } else if (isActive) {
            await useAuthStore.getState().logout();
          }
        } catch (refreshErr: any) {
          if (isActive) await useAuthStore.getState().logout();
        }
      } finally {
        if (isActive) setIsBooting(false);
      }
    };

    bootstrapAuth();

    return () => {
      isActive = false;
    };
  }, []);

  // Always reset to login screen when unauthenticated (e.g. after logout)
  useEffect(() => {
    if (!isAuthenticated && !isGuest) {
      setAuthScreen('login');
    }
  }, [isAuthenticated, isGuest]);

  // Watch for guest-to-register redirect requests from inside the main app
  useEffect(() => {
    if (pendingRegisterRedirect) {
      setAuthScreen('register');
      clearRegisterRedirect();
    }
  }, [pendingRegisterRedirect]);

  const navigateToVerifyOtp = (email: string, otpExpiresAt?: string | null) => {
    setUnverifiedEmail(email);
    setUnverifiedOtpExpiresAt(otpExpiresAt || null);
    setAuthScreen('verify-otp');
  };

  if (isBooting) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashTitle}>Muslim App</Text>
        <Text style={styles.splashSubtitle}>Memuat sesi...</Text>
        <ActivityIndicator size="large" color="#FDE047" style={styles.splashSpinner} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showMainApp ? (
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : authScreen === 'register' ? (
          <Stack.Screen name="Register">
            {(props) => (
              <RegisterScreen
                onNavigateLogin={() => setAuthScreen('login')}
                onNavigateVerifyOtp={navigateToVerifyOtp}
              />
            )}
          </Stack.Screen>
        ) : authScreen === 'verify-otp' ? (
          <Stack.Screen name="VerifyOtp">
            {(props) => (
              <VerifyOtpScreen
                email={unverifiedEmail}
                otpExpiresAt={unverifiedOtpExpiresAt}
                onNavigateLogin={() => setAuthScreen('login')}
              />
            )}
          </Stack.Screen>
        ) : authScreen === 'forgot-password' ? (
          <Stack.Screen name="ForgotPassword">
            {(props) => (
              <ForgotPasswordScreen
                onNavigateLogin={() => setAuthScreen('login')}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                onNavigateRegister={() => setAuthScreen('register')}
                onNavigateForgotPassword={() => setAuthScreen('forgot-password')}
                onNavigateVerifyOtp={navigateToVerifyOtp}
                onContinueGuest={continueAsGuest}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0B3B24',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  splashTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  splashSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'center',
  },
  splashSpinner: {
    marginTop: 18,
  },
});
