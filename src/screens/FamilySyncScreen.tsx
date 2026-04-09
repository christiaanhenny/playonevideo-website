import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { RootStackParamList } from '../types';
import { COLORS, FONTS } from '../constants';
import { SyncService } from '../services/SyncService';
import { StorageService } from '../services/StorageService';
import { PremiumService } from '../services/PremiumService';
import { ChevronLeft, X, Link2, Smartphone, CircleCheck } from 'lucide-react-native';
import { useAppState } from '../context/AppStateContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FamilySync'>;
};

type Screen = 'menu' | 'hosting' | 'scanning' | 'loading' | 'paired';

const QR_PREFIX = 'parentvideo:pair:';

export function FamilySyncScreen({ navigation }: Props) {
  const { isPremium } = useAppState();
  const [screen, setScreen] = useState<Screen>('menu');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isPaired, setIsPaired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanHandled, setScanHandled] = useState(false);

  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!isPremium) {
      navigation.replace('Paywall');
      return;
    }
    SyncService.isPaired().then(setIsPaired);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  const startHosting = async () => {
    setError(null);
    setScreen('loading');
    try {
      const folders = await StorageService.getFolders();
      const favourites = await StorageService.getFavourites();
      const rcUserId = await PremiumService.getAppUserID();
      const code = await SyncService.createFamily(folders, favourites, rcUserId);
      setPairingCode(code);
      setScreen('hosting');
    } catch (e: any) {
      setError(e.message ?? 'Er ging iets mis.');
      setScreen('menu');
    }
  };

  const startScanning = async () => {
    setError(null);
    setScanHandled(false);
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Cameratoegang nodig', 'Geef toegang tot de camera in de instellingen.');
        return;
      }
    }
    setScreen('scanning');
  };

  const handleQRScanned = useCallback(
    async (value: string) => {
      if (scanHandled) return;
      if (!value.startsWith(QR_PREFIX)) return;

      setScanHandled(true);
      setScreen('loading');

      const code = value.replace(QR_PREFIX, '');
      try {
        const { folders, favourites, revenuecatUserId } = await SyncService.joinFamily(code);
        // Sla de ontvangen lijsten op (suppressPush is al aan in joinFamily flow)
        SyncService.setSuppressPush(true);
        await StorageService.saveFolders(folders);
        await StorageService.saveFavourites(favourites);
        SyncService.setSuppressPush(false);
        // Adopteer het abonnement van de andere ouder
        if (revenuecatUserId) {
          await PremiumService.adoptSharedUserID(revenuecatUserId);
        }
        setIsPaired(true);
        setScreen('paired');
      } catch (e: any) {
        setError(e.message ?? 'Koppelen mislukt.');
        setScreen('menu');
      }
    },
    [scanHandled],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (codes.length > 0 && codes[0].value) {
        handleQRScanned(codes[0].value);
      }
    },
  });

  const handleDisconnect = () => {
    Alert.alert(
      'Koppeling verbreken',
      'Jullie lijsten blijven bewaard, maar stoppen met synchroniseren.',
      [
        { text: 'Annuleer', style: 'cancel' },
        {
          text: 'Verbreken',
          style: 'destructive',
          onPress: async () => {
            await SyncService.disconnect();
            setIsPaired(false);
            setPairingCode(null);
            setScreen('menu');
          },
        },
      ],
    );
  };

  // ─── Al gekoppeld ────────────────────────────────────────────
  if (isPaired && screen === 'menu') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Link2 size={52} color={COLORS.primary} style={{ marginBottom: 4 }} />
          <Text style={styles.title}>Apparaten gekoppeld</Text>
          <Text style={styles.subtitle}>
            Mappen en favorieten worden automatisch gesynchroniseerd.
          </Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleDisconnect}>
            <Text style={styles.dangerBtnText}>Koppeling verbreken</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Succes ───────────────────────────────────────────────────
  if (screen === 'paired') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <CircleCheck size={52} color={COLORS.success} style={{ marginBottom: 4 }} />
          <Text style={styles.title}>Gekoppeld!</Text>
          <Text style={styles.subtitle}>
            Jullie lijsten zijn gesynchroniseerd en worden voortaan automatisch bijgehouden.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Klaar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Laden ────────────────────────────────────────────────────
  if (screen === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.subtitle, { marginTop: 16 }]}>Even geduld…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── QR tonen (host) ─────────────────────────────────────────
  if (screen === 'hosting' && pairingCode) {
    const qrValue = `${QR_PREFIX}${pairingCode}`;
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <Header onBack={() => setScreen('menu')} />
        <View style={styles.center}>
          <Text style={styles.title}>Scan deze QR</Text>
          <Text style={styles.subtitle}>
            Laat de andere ouder deze QR scannen in de app. Geldig 10 minuten.
          </Text>
          <View style={styles.qrWrapper}>
            <QRCode value={qrValue} size={220} color={COLORS.textPrimary} backgroundColor="#fff" />
          </View>
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>Code:</Text>
            <Text style={styles.codeValue}>{pairingCode}</Text>
          </View>
          <Text style={styles.hint}>Of laat de andere ouder de code handmatig invoeren (nog niet beschikbaar).</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Camera (scanner) ─────────────────────────────────────────
  if (screen === 'scanning') {
    if (!device) {
      return (
        <SafeAreaView style={styles.safe}>
          <Header onBack={() => setScreen('menu')} />
          <View style={styles.center}>
            <Text style={styles.subtitle}>Camera niet beschikbaar.</Text>
          </View>
        </SafeAreaView>
      );
    }
    return (
      <View style={styles.cameraFull}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          codeScanner={codeScanner}
        />
        {/* Overlay */}
        <SafeAreaView style={styles.cameraOverlay}>
          <TouchableOpacity onPress={() => setScreen('menu')} style={styles.cameraBack}>
            <X size={14} color="#fff" />
            <Text style={styles.cameraBackText}>Annuleer</Text>
          </TouchableOpacity>
          <View style={styles.scanFrame} />
          <Text style={styles.cameraHint}>Richt de camera op de QR-code van de andere ouder</Text>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Menu ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <Header onBack={() => navigation.goBack()} />
      <View style={styles.center}>
        <Smartphone size={52} color={COLORS.primary} style={{ marginBottom: 4 }} />
        <Text style={styles.title}>Apparaten koppelen</Text>
        <Text style={styles.subtitle}>
          Koppel twee telefoons zodat mappen en favorieten automatisch synchroon lopen.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.primaryBtn} onPress={startHosting}>
          <Text style={styles.primaryBtnText}>QR-code tonen</Text>
          <Text style={styles.btnSub}>Op de eerste telefoon</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={startScanning}>
          <Text style={styles.secondaryBtnText}>QR-code scannen</Text>
          <Text style={[styles.btnSub, { color: COLORS.textMuted }]}>Op de tweede telefoon</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ChevronLeft size={18} color={COLORS.primaryLight} />
        <Text style={styles.backText}>Terug</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Koppelen</Text>
      <View style={{ width: 70 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backBtn: { width: 70, flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: FONTS.sizes.md, color: COLORS.primaryLight, fontWeight: '600' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: 4,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  btnSub: { fontSize: FONTS.sizes.xs, color: '#fff', marginTop: 2, opacity: 0.7 },
  dangerBtn: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
    marginTop: 8,
  },
  dangerBtnText: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.error },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginVertical: 8,
  },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  codeValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },
  hint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  // Camera styles
  cameraFull: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  cameraBack: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cameraBackText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '600' },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  cameraHint: {
    color: '#fff',
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
    borderRadius: 8,
  },
});
