import { YOUTUBE_API_BASE, YOUTUBE_API_KEY } from '../constants';
import { VideoResult, Chapter } from '../types';
import { TranscriptItem } from './AIChapterService';

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const YouTubeService = {
  async search(query: string, type: 'video' | 'playlist' = 'video'): Promise<VideoResult[]> {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type,
      maxResults: '20',
      safeSearch: 'strict',
      key: YOUTUBE_API_KEY,
    });

    const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!res.ok) throw new Error(`YouTube search failed: ${res.status}`);
    const data = await res.json();

    if (!data.items) return [];

    const videoIds: string[] = data.items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => item.id.videoId);

    // Fetch video details (duration + embeddable status) in one batch call
    let durations: Record<string, number> = {};
    let embeddable: Record<string, boolean> = {};
    if (videoIds.length > 0 && type === 'video') {
      ({ durations, embeddable } = await YouTubeService.fetchVideoDurations(videoIds));
    }

    return data.items
      .map((item: any) => {
        const isVideo = item.id?.videoId;
        const isPlaylist = item.id?.playlistId;
        if (!isVideo && !isPlaylist) return null;

        // Skip videos that cannot be embedded (e.g. blocked by WildBrain)
        if (isVideo && embeddable[item.id.videoId] === false) return null;

        const durationSec = isVideo ? durations[item.id.videoId] ?? 0 : undefined;

        return {
          id: isVideo ? item.id.videoId : item.id.playlistId,
          type: isVideo ? 'video' : 'playlist',
          title: decodeHtmlEntities(item.snippet.title),
          channelName: item.snippet.channelTitle,
          thumbnail:
            item.snippet.thumbnails?.medium?.url ??
            item.snippet.thumbnails?.default?.url ?? '',
          durationSeconds: durationSec,
          duration: durationSec ? formatDuration(durationSec) : undefined,
          description: item.snippet.description,
          playlistId: isPlaylist ? item.id.playlistId : undefined,
        } as VideoResult;
      })
      .filter(Boolean) as VideoResult[];
  },

  async fetchVideoDurations(videoIds: string[]): Promise<{
    durations: Record<string, number>;
    embeddable: Record<string, boolean>;
  }> {
    const params = new URLSearchParams({
      part: 'contentDetails,status',
      id: videoIds.join(','),
      key: YOUTUBE_API_KEY,
    });
    const res = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
    if (!res.ok) return { durations: {}, embeddable: {} };
    const data = await res.json();
    const durations: Record<string, number> = {};
    const embeddable: Record<string, boolean> = {};
    for (const item of data.items ?? []) {
      durations[item.id] = parseISO8601Duration(item.contentDetails.duration);
      embeddable[item.id] = item.status?.embeddable !== false;
    }
    return { durations, embeddable };
  },

  async fetchPlaylistItems(playlistId: string): Promise<VideoResult[]> {
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId,
      maxResults: '50',
      key: YOUTUBE_API_KEY,
    });
    const res = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items?.length) return [];

    const videoIds = data.items
      .map((item: any) => item.snippet?.resourceId?.videoId)
      .filter(Boolean);

    let durations: Record<string, number> = {};
    let embeddable: Record<string, boolean> = {};
    if (videoIds.length > 0) {
      ({ durations, embeddable } = await YouTubeService.fetchVideoDurations(videoIds));
    }

    return data.items
      .map((item: any) => {
        const videoId = item.snippet?.resourceId?.videoId;
        if (!videoId) return null;
        if (embeddable[videoId] === false) return null;
        const durationSec = durations[videoId] ?? 0;
        return {
          id: videoId,
          type: 'video',
          title: decodeHtmlEntities(item.snippet.title),
          channelName: item.snippet.videoOwnerChannelTitle ?? '',
          thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
          durationSeconds: durationSec,
          duration: durationSec ? formatDuration(durationSec) : undefined,
          description: item.snippet.description ?? '',
        } as VideoResult;
      })
      .filter(Boolean) as VideoResult[];
  },

  async fetchTranscript(videoId: string): Promise<TranscriptItem[] | null> {
    // Try multiple approaches in order of reliability
    return (
      await YouTubeService._transcriptFromWatchPage(videoId) ??
      await YouTubeService._transcriptFromTimedText(videoId)
    );
  },

  async _transcriptFromWatchPage(videoId: string): Promise<TranscriptItem[] | null> {
    try {
      const pageRes = await fetch(
        `https://www.youtube.com/watch?v=${videoId}&hl=nl`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
            Accept: 'text/html,application/xhtml+xml',
          },
        },
      );
      const html = await pageRes.text();

      const marker = '"captionTracks":';
      const markerIdx = html.indexOf(marker);
      if (markerIdx === -1) return null;

      // The array starts right after the colon
      const arrStart = html.indexOf('[', markerIdx + marker.length - 1);
      if (arrStart === -1) return null;

      // Walk forward with bracket counting, respecting strings
      let depth = 0;
      let inString = false;
      let escape = false;
      let arrEnd = -1;
      for (let i = arrStart; i < Math.min(arrStart + 500_000, html.length); i++) {
        const c = html[i];
        if (escape) { escape = false; continue; }
        if (c === '\\' && inString) { escape = true; continue; }
        if (c === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (c === '[' || c === '{') depth++;
        else if (c === ']' || c === '}') {
          depth--;
          if (depth === 0) { arrEnd = i; break; }
        }
      }
      if (arrEnd === -1) return null;

      const captionTracks: Array<{ languageCode: string; baseUrl: string }> =
        JSON.parse(html.slice(arrStart, arrEnd + 1));
      if (!Array.isArray(captionTracks) || captionTracks.length === 0) return null;

      const track =
        captionTracks.find(t => t.languageCode === 'nl') ??
        captionTracks.find(t => t.languageCode === 'en') ??
        captionTracks[0];

      if (!track?.baseUrl) return null;

      // baseUrl is sometimes protocol-relative (//)
      const captionUrl = track.baseUrl.startsWith('//')
        ? `https:${track.baseUrl}`
        : track.baseUrl;

      const captionRes = await fetch(`${captionUrl}&fmt=json3`);
      if (!captionRes.ok) return null;

      return YouTubeService._parseCaption3(await captionRes.json());
    } catch {
      return null;
    }
  },

  async _transcriptFromTimedText(videoId: string): Promise<TranscriptItem[] | null> {
    for (const lang of ['nl', 'nl-NL', 'en']) {
      try {
        const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3&xorb=2&xobt=3&xovt=3`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const items = YouTubeService._parseCaption3(await res.json());
        if (items && items.length > 10) return items;
      } catch { continue; }
    }
    return null;
  },

  _parseCaption3(data: any): TranscriptItem[] | null {
    const events: any[] = data?.events ?? [];
    const items: TranscriptItem[] = events
      .filter(e => e.segs && e.tStartMs !== undefined)
      .map(e => ({
        startMs: e.tStartMs as number,
        text: (e.segs as Array<{ utf8?: string }>)
          .map(s => s.utf8 ?? '')
          .join('')
          .replace(/\n/g, ' ')
          .trim(),
      }))
      .filter(e => e.text.length > 0);
    return items.length > 10 ? items : null;
  },

  async searchChannels(query: string): Promise<VideoResult[]> {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'channel',
      maxResults: '20',
      safeSearch: 'strict',
      key: YOUTUBE_API_KEY,
    });
    const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!res.ok) throw new Error(`YouTube channel search failed: ${res.status}`);
    const data = await res.json();
    if (!data.items) return [];

    return data.items
      .map((item: any) => {
        const channelId = item.id?.channelId ?? item.snippet?.channelId;
        if (!channelId) return null;
        return {
          id: channelId,
          channelId,
          type: 'channel',
          title: decodeHtmlEntities(item.snippet.title),
          channelName: decodeHtmlEntities(item.snippet.title),
          thumbnail:
            item.snippet.thumbnails?.medium?.url ??
            item.snippet.thumbnails?.default?.url ?? '',
          description: item.snippet.description,
        } as VideoResult;
      })
      .filter(Boolean) as VideoResult[];
  },

  async fetchChannelUploadsPlaylistId(channelId: string): Promise<string | null> {
    const params = new URLSearchParams({
      part: 'contentDetails',
      id: channelId,
      key: YOUTUBE_API_KEY,
    });
    const res = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
  },

  async fetchVideoDetails(videoId: string): Promise<{
    durationSeconds: number;
    description: string;
    title: string;
    channelName: string;
    thumbnail: string;
    embeddable: boolean;
  } | null> {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails,status',
      id: videoId,
      key: YOUTUBE_API_KEY,
    });
    const res = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.items?.length) return null;
    const item = data.items[0];
    return {
      durationSeconds: parseISO8601Duration(item.contentDetails.duration),
      description: item.snippet.description ?? '',
      title: decodeHtmlEntities(item.snippet.title),
      channelName: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? '',
      embeddable: item.status?.embeddable !== false,
    };
  },
};
