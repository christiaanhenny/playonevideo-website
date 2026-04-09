import { OPENAI_API_KEY } from '../constants';
import { Chapter } from '../types';

export type TranscriptItem = { startMs: number; text: string };

function msToTimestamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function timestampToSeconds(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// Sample transcript: one segment per minute window, to keep token count low.
// A 2.5h video → ~150 lines, roughly 2k tokens input.
function sampleTranscript(items: TranscriptItem[]): string {
  const minuteMap = new Map<number, TranscriptItem>();
  for (const item of items) {
    const minute = Math.floor(item.startMs / 60000);
    if (!minuteMap.has(minute)) {
      minuteMap.set(minute, item);
    }
  }
  return Array.from(minuteMap.values())
    .map(item => `[${msToTimestamp(item.startMs)}] ${item.text}`)
    .join('\n');
}

export async function detectChaptersFromTranscript(
  transcript: TranscriptItem[],
  videoTitle: string,
  totalDurationSeconds: number,
): Promise<Chapter[]> {
  if (transcript.length < 10) return [];

  const transcriptText = sampleTranscript(transcript);

  const prompt = `Je krijgt een transcript van een YouTube compilatievideo: "${videoTitle}".
Dit is een compilatie van meerdere korte afleveringen achter elkaar, zonder chapters.

Analyseer het transcript en identificeer waar elke nieuwe aflevering begint.
Zoek naar patronen zoals:
- Herhalende intro-zinnen of titelaaankondigingen
- Plotselinge onderwerpwissels na een stilte
- Een naam of titel die wordt uitgesproken als openingszin

Geef de chapters terug als JSON array in dit exacte formaat:
[{"start": "0:00:00", "title": "Naam van de aflevering"}]

Regels:
- Gebruik alleen timestamps die in het transcript voorkomen
- Minimaal 2, maximaal 40 chapters
- De eerste chapter begint altijd op of vlak bij 0:00:00
- Geef ALLEEN de JSON array terug, geen uitleg of markdown

Transcript (één regel per minuut):
${transcriptText}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content?.trim() ?? '';
    if (!content) return [];

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed: Array<{ start: string; title: string }> = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length < 2) return [];

    parsed.sort((a, b) => timestampToSeconds(a.start) - timestampToSeconds(b.start));

    return parsed.map((item, i) => ({
      index: i,
      title: item.title,
      startSeconds: timestampToSeconds(item.start),
      endSeconds:
        i < parsed.length - 1
          ? timestampToSeconds(parsed[i + 1].start)
          : totalDurationSeconds,
    }));
  } catch {
    return [];
  }
}
