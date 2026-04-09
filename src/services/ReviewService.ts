import { StorageService } from './StorageService';
import { SyncService } from './SyncService';

const REVIEW_INTERVAL_DAYS = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const ReviewService = {
  /**
   * Returns true if the review prompt should be shown after this video.
   * Conditions:
   *  1. Parents must have paired their phones.
   *  2. Either this is the first ever video watched, OR it has been 5+ days
   *     since the last review prompt was shown.
   */
  async shouldShowReview(): Promise<boolean> {
    const isPaired = await SyncService.isPaired();
    if (!isPaired) return false;

    const totalWatched = await StorageService.getTotalVideosWatched();
    const lastPrompt = await StorageService.getLastReviewPromptTimestamp();

    if (totalWatched === 1 && lastPrompt === null) {
      // First video after pairing — always show
      return true;
    }

    if (lastPrompt !== null) {
      const daysSinceLast = (Date.now() - lastPrompt) / MS_PER_DAY;
      return daysSinceLast >= REVIEW_INTERVAL_DAYS;
    }

    return false;
  },

  async markShown(): Promise<void> {
    await StorageService.setLastReviewPromptTimestamp();
  },
};
