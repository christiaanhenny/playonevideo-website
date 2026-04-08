import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { StorageService } from './StorageService';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: false });

export type AuthResult =
  | { success: true }
  | { success: false; error: string };

export const AuthService = {
  async isBiometricAvailable(): Promise<boolean> {
    const { available } = await rnBiometrics.isSensorAvailable();
    return available;
  },

  async getBiometricType(): Promise<string | null> {
    const { biometryType } = await rnBiometrics.isSensorAvailable();
    if (biometryType === BiometryTypes.FaceID) return 'Face ID';
    if (biometryType === BiometryTypes.TouchID) return 'Touch ID';
    if (biometryType === BiometryTypes.Biometrics) return 'Biometrics';
    return null;
  },

  async authenticateWithBiometrics(): Promise<AuthResult> {
    const { available } = await rnBiometrics.isSensorAvailable();
    if (!available) {
      return { success: false, error: 'Biometrics not available' };
    }
    const { success, error } = await rnBiometrics.simplePrompt({
      promptMessage: 'Verify to unlock parent controls',
      cancelButtonText: 'Use PIN',
    });
    if (success) return { success: true };
    return { success: false, error: error ?? 'Authentication failed' };
  },

  async authenticateWithPin(enteredPin: string): Promise<AuthResult> {
    const storedPin = await StorageService.getPin();
    if (!storedPin) {
      return { success: false, error: 'No PIN configured' };
    }
    if (enteredPin === storedPin) {
      return { success: true };
    }
    return { success: false, error: 'Incorrect PIN' };
  },

  async hasAnyAuth(): Promise<boolean> {
    const hasPin = await StorageService.hasPin();
    const hasBiometric = await AuthService.isBiometricAvailable();
    const settings = await StorageService.getSettings();
    return hasPin || (hasBiometric && settings.biometricEnabled);
  },
};
