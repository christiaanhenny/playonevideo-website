import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { COLORS, FONTS, MAX_PIN_ATTEMPTS, PIN_COOLDOWN_MS } from '../constants';
import { AuthService } from '../services/AuthService';
import { StorageService } from '../services/StorageService';
import { useAppState } from '../context/AppStateContext';
import { PinInput } from '../components/PinInput';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ParentAuth'>;
  route: RouteProp<RootStackParamList, 'ParentAuth'>;
};

type Mode = 'loading' | 'biometric' | 'pin' | 'setup_pin' | 'confirm_pin' | 'cooldown';

export function ParentAuthScreen({ navigation, route }: Props) {
  const { returnTo, returnParams } = route.params;
  const { unlock } = useAppState();

  const [mode, setMode] = useState<Mode>('loading');
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [newPin, setNewPin] = useState('');
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initAuth();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const initAuth = async () => {
    if (route.params.forceSetup) {
      setMode('setup_pin');
      return;
    }

    const hasPin = await StorageService.hasPin();
    const biometricAvailable = await AuthService.isBiometricAvailable();
    const settings = await StorageService.getSettings();
    const type = await AuthService.getBiometricType();
    setBiometricType(type);

    if (!hasPin) {
      setMode('setup_pin');
      return;
    }

    if (biometricAvailable && settings.biometricEnabled) {
      setMode('biometric');
      triggerBiometric();
    } else {
      setMode('pin');
    }
  };

  const triggerBiometric = async () => {
    const result = await AuthService.authenticateWithBiometrics();
    if (result.success) {
      handleSuccess();
    } else {
      setMode('pin');
    }
  };

  const handleSuccess = () => {
    unlock();
    // Always reset the stack so auth modal is fully dismissed and
    // the target screen appears as a clean push — no popup stacking.
    if (returnTo === 'LockedHome') {
      navigation.reset({ index: 0, routes: [{ name: 'LockedHome' }] });
    } else {
      navigation.reset({
        index: 1,
        routes: [
          { name: 'LockedHome' },
          { name: returnTo as any, params: returnParams },
        ],
      });
    }
  };

  const handlePinComplete = async (pin: string) => {
    if (mode === 'setup_pin') {
      setNewPin(pin);
      setMode('confirm_pin');
      return;
    }

    if (mode === 'confirm_pin') {
      if (pin === newPin) {
        await StorageService.savePin(pin);
        handleSuccess();
      } else {
        setPinError('PINs komen niet overeen. Probeer opnieuw.');
        setNewPin('');
        setMode('setup_pin');
      }
      return;
    }

    const result = await AuthService.authenticateWithPin(pin);
    if (result.success) {
      setFailedAttempts(0);
      setPinError(null);
      handleSuccess();
    } else {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= MAX_PIN_ATTEMPTS) {
        startCooldown();
      } else {
        const remaining = MAX_PIN_ATTEMPTS - attempts;
        setPinError(`Onjuiste PIN. Nog ${remaining} poging${remaining === 1 ? '' : 'en'}.`);
      }
    }
  };

  const startCooldown = () => {
    setMode('cooldown');
    setPinError(null);
    let remaining = PIN_COOLDOWN_MS / 1000;
    setCooldownRemaining(remaining);
    cooldownRef.current = setInterval(() => {
      remaining -= 1;
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        setFailedAttempts(0);
        setMode('pin');
      }
    }, 1000);
  };

  const renderContent = () => {
    switch (mode) {
      case 'loading':
        return (
          <View style={styles.centeredBlock}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        );

      case 'biometric':
        return (
          <View style={styles.centeredBlock}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>
                {biometricType === 'Face ID' ? '👤' : '👆'}
              </Text>
            </View>
            <Text style={styles.title}>{biometricType ?? 'Biometrie'}</Text>
            <Text style={styles.subtitle}>
              Gebruik {biometricType ?? 'biometrie'} om de oudercontrole te ontgrendelen
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={triggerBiometric} activeOpacity={0.88}>
              <Text style={styles.primaryButtonText}>
                Verifieer met {biometricType ?? 'biometrie'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={() => setMode('pin')}>
              <Text style={styles.linkText}>Gebruik PIN</Text>
            </TouchableOpacity>
          </View>
        );

      case 'pin':
        return (
          <View style={styles.centeredBlock}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>🔐</Text>
            </View>
            <Text style={styles.title}>Voer PIN in</Text>
            <Text style={styles.subtitle}>Jouw 4-cijferige ouder-PIN</Text>
            <PinInput onComplete={handlePinComplete} error={pinError} />
            {biometricType && (
              <TouchableOpacity style={styles.linkButton} onPress={triggerBiometric}>
                <Text style={styles.linkText}>Gebruik {biometricType}</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'setup_pin':
        return (
          <View style={styles.centeredBlock}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>🛡️</Text>
            </View>
            <Text style={styles.title}>Maak een PIN</Text>
            <Text style={styles.subtitle}>
              Stel een 4-cijferige PIN in{'\n'}om de oudercontrole te beveiligen
            </Text>
            <PinInput onComplete={handlePinComplete} error={pinError} />
          </View>
        );

      case 'confirm_pin':
        return (
          <View style={styles.centeredBlock}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>✅</Text>
            </View>
            <Text style={styles.title}>Bevestig PIN</Text>
            <Text style={styles.subtitle}>Voer dezelfde PIN nogmaals in</Text>
            <PinInput onComplete={handlePinComplete} error={pinError} />
          </View>
        );

      case 'cooldown':
        return (
          <View style={styles.centeredBlock}>
            <View style={[styles.iconCircle, styles.iconCircleError]}>
              <Text style={styles.cooldownNumber}>{cooldownRemaining}</Text>
            </View>
            <Text style={styles.title}>Te veel pogingen</Text>
            <Text style={styles.subtitle}>
              Wacht nog {cooldownRemaining} seconde{cooldownRemaining !== 1 ? 'n' : ''}
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.closeButton} onPress={() => {
          if (returnTo === 'LockedHome') {
            navigation.reset({ index: 0, routes: [{ name: 'LockedHome' }] });
          } else {
            navigation.goBack();
          }
        }}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  centeredBlock: {
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircleError: {
    backgroundColor: COLORS.error,
  },
  iconEmoji: { fontSize: 38 },
  cooldownNumber: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: '#fff',
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginTop: 12,
    minWidth: 220,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  linkButton: { marginTop: 8, padding: 10, minHeight: 44, justifyContent: 'center' },
  linkText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primaryLight,
    fontWeight: '500',
  },
});
