import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string) {
    return await SecureStore.getItemAsync(key);
  },

  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key);
  },

  async clear() {
    // Note: SecureStore doesn't have a clear all method
    // You'll need to manually remove known keys
  }
};