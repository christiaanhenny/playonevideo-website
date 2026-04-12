import { Chapter } from '../types';

export type TranscriptItem = { startMs: number; text: string };

// De anon key is ontworpen om publiek te zijn (zie Supabase docs).
// De echte OpenAI API key staat veilig als Supabase secret, nooit in deze bundle.
const SUPABASE_URL = 'https://yjduykwewqcxccsjamiv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZHV5a3dld3FjeGNjc2phbWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUwMTksImV4cCI6MjA5MTI0MTAxOX0.Ww7prgG3SEuh4M_BFLRI8iS6HTcyWxPLtAUpACZPtAU';

export async function detectChaptersFromTranscript(
  transcript: TranscriptItem[],
  videoTitle: string,
  totalDurationSeconds: number,
): Promise<Chapter[]> {
  if (transcript.length < 10) return [];

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ transcript, videoTitle, totalDurationSeconds }),
    });

    if (!res.ok) return [];

    const chapters: Chapter[] = await res.json();
    return Array.isArray(chapters) && chapters.length >= 2 ? chapters : [];
  } catch {
    return [];
  }
}
