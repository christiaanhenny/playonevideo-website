import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants';
import { DonationService } from '../services/DonationService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DonationPrompt'>;
};

const AMOUNTS = ['$5', '$10', '$20', '$100'];

export function DonationPromptScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleDismiss = async () => {
    await DonationService.recordDismiss();
    navigation.goBack();
  };

  const handleDonate = async (amount: string) => {
    // In production: implement StoreKit / in-app purchase or link to payment page
    // For MVP: open a donation link or show a coming-soon alert
    Alert.alert(
      'Thank you! 🙏',
      `Payment processing will be available in the next release. You selected ${amount}.`,
      [
        {
          text: 'OK',
          onPress: async () => {
            await DonationService.recordDonation();
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>💙</Text>
          <Text style={styles.title}>Enjoying the app?</Text>
          <Text style={styles.body}>
            Help us keep it simple and calm for families.{'\n'}
            OneVideo is built by parents, for parents.
          </Text>

          {/* Amount grid */}
          <View style={styles.amounts}>
            {AMOUNTS.map(amount => (
              <TouchableOpacity
                key={amount}
                style={[styles.amountBtn, selected === amount && styles.amountBtnSelected]}
                onPress={() => setSelected(amount)}
                activeOpacity={0.75}>
                <Text style={[styles.amountText, selected === amount && styles.amountTextSelected]}>
                  {amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Donate button */}
          <TouchableOpacity
            style={[styles.donateBtn, !selected && styles.donateBtnDisabled]}
            disabled={!selected}
            onPress={() => selected && handleDonate(selected)}
            activeOpacity={0.85}>
            <Text style={styles.donateBtnText}>
              {selected ? `Support with ${selected}` : 'Select an amount'}
            </Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  amounts: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  amountBtn: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  amountBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  amountText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  amountTextSelected: {
    color: COLORS.primary,
  },
  donateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  donateBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  donateBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: '#fff',
  },
  dismissBtn: { padding: 8 },
  dismissText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
});
