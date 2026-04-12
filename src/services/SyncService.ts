import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Folder, VideoResult } from '../types';

// De anon key is ontworpen om publiek te zijn (zie Supabase docs).
// Alle SCHRIJFACTIES lopen via de family-sync Edge Function die service_role gebruikt.
// Direct schrijven naar de DB met de anon key is geblokkeerd via RLS.
const SUPABASE_URL = 'https://yjduykwewqcxccsjamiv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZHV5a3dld3FjeGNjc2phbWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUwMTksImV4cCI6MjA5MTI0MTAxOX0.Ww7prgG3SEuh4M_BFLRI8iS6HTcyWxPLtAUpACZPtAU';

const FAMILY_SYNC_URL = `${SUPABASE_URL}/functions/v1/family-sync`;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FAMILY_ID_KEY     = 'sync_family_id';
const WRITE_SECRET_KEY  = 'sync_write_secret';

let _suppressPush = false;
let _channel: RealtimeChannel | null = null;

// Helper: roep de family-sync Edge Function aan
async function callFamilySync(body: Record<string, unknown>): Promise<Response> {
  return fetch(FAMILY_SYNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
}

function randomPairingCode(): string {
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

  async getWriteSecret(): Promise<string | null> {
    return AsyncStorage.getItem(WRITE_SECRET_KEY);
  },

  async isPaired(): Promise<boolean> {
    const id = await SyncService.getFamilyId();
    return id !== null;
  },

  // Ouder A: maakt een family aan via de beveiligde Edge Function.
  // De write_secret wordt veilig opgeslagen in AsyncStorage en is vereist
  // voor alle toekomstige schrijfacties op deze family.
  async createFamily(
    folders: Folder[],
    favourites: VideoResult[],
    revenuecatUserId: string | null,
  ): Promise<string> {
    const res = await callFamilySync({
      action: 'create',
      folders,
      favourites,
      revenuecat_user_id: revenuecatUserId,
    });

    if (!res.ok) {
      throw new Error(`Family aanmaken mislukt (${res.status})`);
    }

    const data: { family_id: string; pairing_code: string; write_secret: string } = await res.json();

    await Promise.all([
      AsyncStorage.setItem(FAMILY_ID_KEY, data.family_id),
      AsyncStorage.setItem(WRITE_SECRET_KEY, data.write_secret),
    ]);

    return data.pairing_code;
  },

  // Ouder B: koppelt via de gescande code.
  // SELECT is nog steeds toegestaan met de anon key (nodig voor pairing + realtime).
  async joinFamily(pairingCode: string): Promise<{
    folders: Folder[];
    favourites: VideoResult[];
    revenuecatUserId: string | null;
    subscriptionAdopted: boolean;
  }> {
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id, write_secret')
      .eq('pairing_code', pairingCode.toUpperCase().trim())
      .gt('expires_at', new Date().toISOString())
      .single();

    if (familyError || !family) {
      throw new Error('Ongeldige of verlopen koppelcode. Genereer een nieuwe QR.');
    }

    const { data, error: dataError } = await supabase
      .from('family_data')
      .select('folders, favourites, revenuecat_user_id, subscription_claimed')
      .eq('family_id', family.id)
      .single();

    if (dataError || !data) {
      throw new Error('Kon familiedata niet ophalen.');
    }

    // Sla write_secret op: beide apparaten kunnen nu pushen
    await Promise.all([
      AsyncStorage.setItem(FAMILY_ID_KEY, family.id),
      AsyncStorage.setItem(WRITE_SECRET_KEY, family.write_secret),
    ]);

    // Probeer de subscription atomisch te claimen via de Edge Function
    let subscriptionAdopted = false;
    if (!data.subscription_claimed && data.revenuecat_user_id) {
      const claimRes = await callFamilySync({
        action: 'claim',
        family_id: family.id,
        write_secret: family.write_secret,
      });
      if (claimRes.ok) {
        const claimData: { claimed: boolean } = await claimRes.json();
        subscriptionAdopted = claimData.claimed;
      }
    }

    return {
      folders: data.folders ?? [],
      favourites: data.favourites ?? [],
      revenuecatUserId: subscriptionAdopted ? (data.revenuecat_user_id ?? null) : null,
      subscriptionAdopted,
    };
  },

  // Stuur lokale wijzigingen via de beveiligde Edge Function
  async pushLists(folders: Folder[], favourites: VideoResult[]): Promise<void> {
    if (_suppressPush) return;

    const [familyId, writeSecret] = await Promise.all([
      SyncService.getFamilyId(),
      SyncService.getWriteSecret(),
    ]);

    if (!familyId || !writeSecret) return;

    await callFamilySync({
      action: 'push',
      family_id: familyId,
      write_secret: writeSecret,
      folders,
      favourites,
    });
  },

  // Start realtime luisteren (READ-only, anon key is voldoende)
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
          setTimeout(() => { _suppressPush = false; }, 500);
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
    await Promise.all([
      AsyncStorage.removeItem(FAMILY_ID_KEY),
      AsyncStorage.removeItem(WRITE_SECRET_KEY),
    ]);
  },
};
