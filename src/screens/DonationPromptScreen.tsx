import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants';
import { DonationService } from '../services/DonationService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DonationPrompt'>;
};

const AMOUNTS = ['€5', '€10', '€20', '€50'];

export function DonationPromptScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleDismiss = async () => {
    await DonationService.recordDismiss();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="rgba(0,0,0,0.4)" />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>💙</Text>
          <Text style={styles.title}>Bevalt de app?</Text>
          <Text style={styles.body}>
            Help ons om de app rustig en simpel te houden voor gezinnen.{'\n'}
            PlayOneVideo is gemaakt door ouders, voor ouders.
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

          {/* Coming soon notice */}
          <View style={styles.comingSoonBox}>
            <Text style={styles.comingSoonIcon}>🚧</Text>
            <Text style={styles.comingSoonText}>
              Online doneren komt binnenkort beschikbaar. Bedankt voor je interesse!
            </Text>
          </View>

          {/* Dismiss */}
          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
            <Text style={styles.dismissText}>Misschien later</Text>
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
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    gap: 12,
  },
  emoji: { fontSize: 48 },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  amounts: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  amountBtn: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 22,
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
  comingSoonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  comingSoonIcon: { fontSize: 18 },
  comingSoonText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: '#92400E',
    lineHeight: 18,
  },
  dismissBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
});
