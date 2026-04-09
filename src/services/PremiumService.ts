import Purchases, { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { REVENUECAT_API_KEY, PREMIUM_ENTITLEMENT_ID } from '../constants';

export const PremiumService = {
  configure() {
    if (!REVENUECAT_API_KEY) return;
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  },

  async getAppUserID(): Promise<string | null> {
    try {
      return await Purchases.getAppUserID();
    } catch {
      return null;
    }
  },

  // Adopteer de RevenueCat identiteit van de andere ouder zodat het abonnement gedeeld wordt.
  async adoptSharedUserID(userId: string): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      return PREMIUM_ENTITLEMENT_ID in customerInfo.entitlements.active;
    } catch {
      return false;
    }
  },

  async isPremium(): Promise<boolean> {
    try {
      const info = await Purchases.getCustomerInfo();
      return PREMIUM_ENTITLEMENT_ID in info.entitlements.active;
    } catch {
      return false;
    }
  },

  async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      return await Purchases.getOfferings();
    } catch {
      return null;
    }
  },

  async purchase(pkg: PurchasesPackage): Promise<boolean> {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return PREMIUM_ENTITLEMENT_ID in customerInfo.entitlements.active;
  },

  async restore(): Promise<boolean> {
    const info = await Purchases.restorePurchases();
    return PREMIUM_ENTITLEMENT_ID in info.entitlements.active;
  },

  async getSubscriptionStatus(): Promise<'trial' | 'active' | 'none'> {
    try {
      const info = await Purchases.getCustomerInfo();
      const entitlement = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
      if (!entitlement) return 'none';
      if (entitlement.periodType === 'TRIAL') return 'trial';
      return 'active';
    } catch {
      return 'none';
    }
  },
};
