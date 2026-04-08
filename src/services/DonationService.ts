import { StorageService } from './StorageService';
import {
  DONATION_INTERVAL,
  DONATION_SUPPRESS_AFTER_DISMISS,
  DONATION_SUPPRESS_AFTER_DONATE_DAYS,
} from '../constants';

const MS_PER_DAY = 86_400_000;

export const DonationService = {
  async shouldShowPrompt(): Promise<boolean> {
    const settings = await StorageService.getSettings();
    if (!settings.donationPromptsEnabled) return false;

    const openCount = await StorageService.getAppOpenCount();
    if (openCount === 0 || openCount % DONATION_INTERVAL !== 0) return false;

    const dismissCount = await StorageService.getDonationDismissCount();

    // Suppress if recently dismissed: track opens since last prompt using stored open count
    if (dismissCount > 0) {
      const lastPromptOpenCount = await StorageService.getLastDonationPromptOpenCount();
      if (lastPromptOpenCount !== null) {
        const suppressThreshold = dismissCount * DONATION_SUPPRESS_AFTER_DISMISS;
        const opensSincePrompt = openCount - lastPromptOpenCount;
        if (opensSincePrompt < suppressThreshold) return false;
      }
    }

    // Suppress 30 days after a donation
    const lastDonation = await StorageService.getLastDonationTimestamp();
    if (lastDonation) {
      const daysSince = (Date.now() - lastDonation) / MS_PER_DAY;
      if (daysSince < DONATION_SUPPRESS_AFTER_DONATE_DAYS) return false;
    }

    return true;
  },

  async recordDismiss(): Promise<void> {
    const openCount = await StorageService.getAppOpenCount();
    await StorageService.incrementDonationDismissCount();
    await StorageService.setLastDonationPromptTimestamp();
    await StorageService.setLastDonationPromptOpenCount(openCount);
  },

  async recordDonation(): Promise<void> {
    await StorageService.setLastDonationTimestamp();
  },
};
