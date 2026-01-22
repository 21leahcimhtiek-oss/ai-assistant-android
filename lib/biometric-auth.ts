import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Biometric Authentication Service
 * Handles Face ID, Touch ID, and fingerprint authentication
 */

const BIOMETRIC_ENABLED_KEY = '@mindspace_biometric_enabled';

export interface BiometricCapabilities {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  biometricName: string;
}

class BiometricAuthService {
  /**
   * Check if biometric authentication is available and enrolled
   */
  async checkCapabilities(): Promise<BiometricCapabilities> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      // Determine biometric name based on platform and type
      let biometricName = 'Biometric';
      if (Platform.OS === 'ios') {
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometricName = 'Face ID';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometricName = 'Touch ID';
        }
      } else if (Platform.OS === 'android') {
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometricName = 'Face Unlock';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometricName = 'Fingerprint';
        }
      }

      return {
        isAvailable,
        isEnrolled,
        supportedTypes,
        biometricName,
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
        biometricName: 'Biometric',
      };
    }
  }

  /**
   * Check if biometric authentication is enabled in app settings
   */
  async isEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication
   */
  async enable(): Promise<boolean> {
    try {
      const capabilities = await this.checkCapabilities();
      
      if (!capabilities.isAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }

      if (!capabilities.isEnrolled) {
        throw new Error('No biometric data enrolled. Please set up biometric authentication in your device settings');
      }

      // Test authentication before enabling
      const result = await this.authenticate('Enable biometric authentication');
      
      if (result.success) {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enabling biometric authentication:', error);
      throw error;
    }
  }

  /**
   * Disable biometric authentication
   */
  async disable(): Promise<void> {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
    } catch (error) {
      console.error('Error disabling biometric authentication:', error);
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(promptMessage?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const capabilities = await this.checkCapabilities();

      if (!capabilities.isAvailable || !capabilities.isEnrolled) {
        return {
          success: false,
          error: 'Biometric authentication is not available',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || `Unlock MindSpace with ${capabilities.biometricName}`,
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: 'Authentication error occurred',
      };
    }
  }

  /**
   * Prompt for biometric authentication if enabled
   * Returns true if authentication succeeds or is not enabled
   * Returns false if authentication fails
   */
  async promptIfEnabled(): Promise<boolean> {
    try {
      const enabled = await this.isEnabled();
      
      if (!enabled) {
        return true; // Not enabled, allow access
      }

      const result = await this.authenticate();
      return result.success;
    } catch (error) {
      console.error('Error in promptIfEnabled:', error);
      return true; // Allow access on error
    }
  }
}

export const biometricAuth = new BiometricAuthService();
