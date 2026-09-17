import AsyncStorage from '@react-native-async-storage/async-storage';
import aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * Encrypted session storage for Supabase auth.
 *
 * SecureStore alone is not enough: it caps values at roughly 2KB, and a
 * Supabase session (access token + refresh token + user object) regularly
 * exceeds that. AsyncStorage alone is not enough either — it is unencrypted on
 * disk, and this holds a refresh token that can mint new sessions.
 *
 * So: the session is AES-encrypted and the ciphertext goes to AsyncStorage
 * (unbounded), while only the 256-bit key goes to SecureStore (tiny, and backed
 * by Keychain/Keystore). This is the pattern Supabase documents for Expo.
 *
 * A fresh key is generated per write, so a stale key can never decrypt a newer
 * value.
 */
export const LargeSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const ciphertext = await AsyncStorage.getItem(key);
    if (!ciphertext) return null;

    const keyHex = await SecureStore.getItemAsync(key);
    if (!keyHex) {
      // Ciphertext without its key is unrecoverable — drop it so the user gets
      // a clean signed-out state rather than a permanently failing session.
      await AsyncStorage.removeItem(key);
      return null;
    }

    try {
      const cipher = new aesjs.ModeOfOperation.ctr(
        aesjs.utils.hex.toBytes(keyHex),
        new aesjs.Counter(1),
      );
      return aesjs.utils.utf8.fromBytes(
        cipher.decrypt(aesjs.utils.hex.toBytes(ciphertext)),
      );
    } catch {
      await this.removeItem(key);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    const encryptionKey = Crypto.getRandomBytes(256 / 8);
    const cipher = new aesjs.ModeOfOperation.ctr(
      encryptionKey,
      new aesjs.Counter(1),
    );
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    // Key first: a key with no ciphertext is harmless, ciphertext with no key
    // is not.
    await SecureStore.setItemAsync(
      key,
      aesjs.utils.hex.fromBytes(encryptionKey),
    );
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encrypted));
  },

  async removeItem(key: string): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(key),
      SecureStore.deleteItemAsync(key),
    ]);
  },
};
