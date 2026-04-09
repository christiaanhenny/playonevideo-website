import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PurchasesPackage } from 'react-native-purchases';
import { X, Check, Crown } from 'lucide-react-native';
import { RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants';
import { PremiumService } from '../services/PremiumService';
import { useAppState } from '../context/AppStateContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
};

const FEATURES = [
  'Onbeperkt kinderprofielen (mappen)',
  'Apparaten koppelen & sync',
  'Toegang tot alle toekomstige functies',
];

export function PaywallScreen({ navigation }: Props) {
  const { refreshPremium } = useAppState();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    PremiumService.getOfferings().then(offerings => {
      const monthly = offerings?.current?.monthly ?? null;
      setPkg(monthly);
      setLoading(false);
    });
  }, []);

  const handlePurchase = async () => {
    if (!pkg) return;
    setPurchasing(true);
    try {
      const success = await PremiumService.purchase(pkg);
      if (success) {
        await refreshPremium();
        navigation.goBack();
      }
    } catch (e: any) {
      if (e?.userCancelled) {
        // gebruiker heeft geannuleerd — niks tonen
      } else {
        Alert.alert('Aankoop mislukt', e?.message ?? 'Probeer het opnieuw.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await PremiumService.restore();
      if (success) {
        await refreshPremium();
        navigation.goBack();
      } else {
        Alert.alert('Geen actief abonnement gevonden', 'We konden geen eerder abonnement terugvinden op dit Apple ID.');
      }
    } catch (e: any) {
      Alert.alert('Herstellen mislukt', e?.message ?? 'Probeer het opnieuw.');
    } finally {
      setRestoring(false);
    }
  };

  const priceLabel = pkg?.product.priceString ?? '€1,99';
  const hasFreeTrial = !!pkg?.product.introPrice && pkg.product.introPrice.price === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <X size={20} color={COLORS.textMuted} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Crown size={48} color={COLORS.textPrimary} style={{ marginBottom: 12 }} />
        <Text style={styles.title}>ParentVideo Pro</Text>
        <Text style={styles.subtitle}>
          Eén abonnement voor het hele gezin. Geen advertenties. Geen algoritmes.
        </Text>

        <View style={styles.featureList}>
          {FEATURES.map(f => (
            <View key={f} style={styles.featureRow}>
              <Check size={16} color={COLORS.textPrimary} style={{ marginTop: 2 }} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceCard}>
          {loading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <>
              {hasFreeTrial && (
                <>
                  <Text style={styles.trialBadge}>14 dagen gratis</Text>
                  <Text style={styles.trialSub}>daarna</Text>
                </>
              )}
              <Text style={styles.price}>{priceLabel}</Text>
              <Text style={styles.pricePer}>per maand</Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.subscribeBtn, (purchasing || loading) && styles.subscribeBtnDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || loading || !pkg}>
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeBtnText}>
              {hasFreeTrial ? '14 dagen gratis starten' : 'Abonnement starten'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}>
          <Text style={styles.restoreBtnText}>
            {restoring ? 'Herstellen…' : 'Eerder abonnement herstellen'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          {hasFreeTrial
            ? `Na de gratis proefperiode van 14 dagen wordt automatisch ${priceLabel}/maand in rekening gebracht via je Apple ID. Je kunt het altijd opzeggen via Instellingen → Apple ID → Abonnementen.`
            : `Het abonnement wordt maandelijks automatisch verlengd via je Apple ID. Je kunt het altijd opzeggen via Instellingen → Apple ID → Abonnementen.`}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  featureList: {
    width: '100%',
    gap: 14,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  priceCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  trialBadge: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  trialSub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  price: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  pricePer: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  subscribeBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeBtnDisabled: { opacity: 0.5 },
  subscribeBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: '#fff',
  },
  restoreBtn: {
    paddingVertical: 10,
    marginBottom: 20,
  },
  restoreBtnText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
  legal: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
});
