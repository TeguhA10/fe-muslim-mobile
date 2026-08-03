import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  SecureStore = null;
}

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {}
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {}
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
        const val = await SecureStore.getItemAsync(key);
        if (val) return val;
      }
    } catch (error) {}
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {}
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {}
  },
};
