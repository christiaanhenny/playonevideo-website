import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { AuthService } from '../services/AuthService';
import { StorageService } from '../services/StorageService';
import { useAppState } from '../context/AppStateContext';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Triggers Face ID/Touch ID before navigating. If biometrics succeed the target
 * screen opens directly with no auth sheet visible. If biometrics fail (or are
 * not enabled) we fall back to the ParentAuth PIN screen as before.
 */
export function useParentAuth() {
  const navigation = useNavigation<NavProp>();
  const { unlock } = useAppState();

  const navigateWithAuth = useCallback(
    async (returnTo: keyof RootStackParamList, returnParams?: object) => {
      const biometricAvailable = await AuthService.isBiometricAvailable();
      const settings = await StorageService.getSettings();

      if (biometricAvailable && settings.biometricEnabled) {
        const result = await AuthService.authenticateWithBiometrics();
        if (result.success) {
          unlock();
          if (returnTo === 'LockedHome') {
            navigation.reset({ index: 0, routes: [{ name: 'LockedHome' }] });
          } else {
            navigation.navigate(returnTo as any, returnParams as any);
          }
          return;
        }
        // Face ID failed → show PIN, skip trying biometrics again
        navigation.navigate('ParentAuth', { returnTo, returnParams, skipBiometric: true });
      } else {
        navigation.navigate('ParentAuth', { returnTo, returnParams });
      }
    },
    [navigation, unlock],
  );

  return { navigateWithAuth };
}
