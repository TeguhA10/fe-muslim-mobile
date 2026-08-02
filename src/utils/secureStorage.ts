import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  // Fallback to AsyncStorage if expo-secure-store native module is unavailable in Expo Go
  SecureStore = null;
}

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      await AsyncStorage.setItem(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
        const val = await SecureStore.getItemAsync(key);
        if (val !== null) return val;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      return await AsyncStorage.getItem(key);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
        await SecureStore.deleteItemAsync(key);
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      await AsyncStorage.removeItem(key);
    }
  },
};
