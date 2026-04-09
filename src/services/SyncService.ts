import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Folder, VideoResult } from '../types';

const SUPABASE_URL = 'https://yjduykwewqcxccsjamiv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZHV5a3dld3FjeGNjc2phbWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUwMTksImV4cCI6MjA5MTI0MTAxOX0.Ww7prgG3SEuh4M_BFLRI8iS6HTcyWxPLtAUpACZPtAU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FAMILY_ID_KEY = 'sync_family_id';

// Voorkomt sync-loop: als remote update binnenkomt, pushen we niet terug
let _suppressPush = false;
let _channel: RealtimeChannel | null = null;

function randomPairingCode(): string {
  // Geen 0/O/1/I om verwarring te voorkomen
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export const SyncService = {
  isSuppressed(): boolean {
    return _suppressPush;
  },

  setSuppressPush(value: boolean): void {
    _suppressPush = value;
  },

  async getFamilyId(): Promise<string | null> {
    return AsyncStorage.getItem(FAMILY_ID_KEY);
  },

  async isPaired(): Promise<boolean> {
    const id = await SyncService.getFamilyId();
    return id !== null;
  },

  // Ouder A: maak een family aan en genereer een koppelcode
  async createFamily(
    folders: Folder[],
    favourites: VideoResult[],
    revenuecatUserId: string | null,
  ): Promise<string> {
    const pairingCode = randomPairingCode();

    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({ pairing_code: pairingCode })
      .select('id')
      .single();

    if (familyError) throw familyError;

    const { error: dataError } = await supabase
      .from('family_data')
      .insert({ family_id: family.id, folders, favourites, revenuecat_user_id: revenuecatUserId });

    if (dataError) throw dataError;

    await AsyncStorage.setItem(FAMILY_ID_KEY, family.id);
    return pairingCode;
  },

  // Ouder B: koppel via de gescande code
  async joinFamily(
    pairingCode: string,
  ): Promise<{ folders: Folder[]; favourites: VideoResult[]; revenuecatUserId: string | null }> {
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id')
      .eq('pairing_code', pairingCode.toUpperCase().trim())
      .gt('expires_at', new Date().toISOString())
      .single();

    if (familyError || !family) {
      throw new Error('Ongeldige of verlopen koppelcode. Genereer een nieuwe QR.');
    }

    const { data, error: dataError } = await supabase
      .from('family_data')
      .select('folders, favourites, revenuecat_user_id')
      .eq('family_id', family.id)
      .single();

    if (dataError || !data) {
      throw new Error('Kon familiedata niet ophalen.');
    }

    await AsyncStorage.setItem(FAMILY_ID_KEY, family.id);
    return {
      folders: data.folders ?? [],
      favourites: data.favourites ?? [],
      revenuecatUserId: data.revenuecat_user_id ?? null,
    };
  },

  // Stuur lokale wijzigingen naar de cloud
  async pushLists(folders: Folder[], favourites: VideoResult[]): Promise<void> {
    if (_suppressPush) return;
    const familyId = await SyncService.getFamilyId();
    if (!familyId) return;

    await supabase
      .from('family_data')
      .update({ folders, favourites, updated_at: new Date().toISOString() })
      .eq('family_id', familyId);
  },

  // Start realtime luisteren naar wijzigingen van het andere apparaat
  async subscribe(
    onUpdate: (folders: Folder[], favourites: VideoResult[]) => void,
  ): Promise<void> {
    const familyId = await SyncService.getFamilyId();
    if (!familyId) return;

    _channel = supabase
      .channel(`family_${familyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'family_data',
          filter: `family_id=eq.${familyId}`,
        },
        payload => {
          const { folders, favourites } = payload.new as {
            folders: Folder[];
            favourites: VideoResult[];
          };
          _suppressPush = true;
          onUpdate(folders, favourites);
          // Kort wachten zodat StorageService saves klaar zijn
          setTimeout(() => {
            _suppressPush = false;
          }, 500);
        },
      )
      .subscribe();
  },

  unsubscribe(): void {
    if (_channel) {
      supabase.removeChannel(_channel);
      _channel = null;
    }
  },

  async disconnect(): Promise<void> {
    SyncService.unsubscribe();
    await AsyncStorage.removeItem(FAMILY_ID_KEY);
  },
};
