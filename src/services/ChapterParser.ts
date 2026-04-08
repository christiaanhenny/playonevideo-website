import { Chapter } from '../types';

// Matches lines like:
//   0:00 Intro
//   00:00 Intro
//   0:00:00 Intro
//   1:23:45 - Some chapter title
const TIMESTAMP_REGEX =
  /(?:^|\n)[ \t]*(\d{1,2}:\d{2}(?::\d{2})?)[ \t]*[-–—]?[ \t]*(.+)/gm;

function parseTimestamp(ts: string): number {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export function parseChaptersFromDescription(
  description: string,
  totalDurationSeconds: number,
): Chapter[] {
  const matches: Array<{ start: number; title: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = TIMESTAMP_REGEX.exec(description)) !== null) {
    const start = parseTimestamp(match[1].trim());
    const title = match[2].trim();
    matches.push({ start, title });
  }

  if (matches.length < 2) return [];

  // Sort by timestamp ascending
  matches.sort((a, b) => a.start - b.start);

  // First chapter must start at or near 0:00 (allow up to 30s for intros)
  if (matches[0].start > 30) return [];

  return matches.map((m, i) => ({
    index: i,
    title: m.title,
    startSeconds: m.start,
    endSeconds: i < matches.length - 1 ? matches[i + 1].start : totalDurationSeconds,
  }));
}
