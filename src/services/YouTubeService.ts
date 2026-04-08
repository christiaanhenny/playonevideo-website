import { YOUTUBE_API_BASE, YOUTUBE_API_KEY } from '../constants';
import { VideoResult, Chapter } from '../types';

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
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
          title: item.snippet.title,
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
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? '',
      embeddable: item.status?.embeddable !== false,
    };
  },
};
