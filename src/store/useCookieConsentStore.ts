import { create } from 'zustand';

export interface CookiePreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  functional: boolean;
}

interface CookieConsentState {
  hasResponded: boolean;
  preferences: CookiePreferences;
  isPreferencesModalOpen: boolean;
  initConsent: () => void;
  acceptAll: () => void;
  acceptNecessaryOnly: () => void;
  savePreferences: (prefs: Partial<CookiePreferences>) => void;
  openPreferencesModal: () => void;
  closePreferencesModal: () => void;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  functional: true,
};

const STORAGE_KEY = 'diagram3d-cookie-consent';

export const useCookieConsentStore = create<CookieConsentState>((set, get) => ({
  hasResponded: true, // Start true to prevent SSR hydration flash; initConsent will evaluate
  preferences: DEFAULT_PREFERENCES,
  isPreferencesModalOpen: false,

  initConsent: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          hasResponded: true,
          preferences: { ...DEFAULT_PREFERENCES, ...parsed.preferences, necessary: true },
        });
      } else {
        set({ hasResponded: false });
      }
    } catch {
      set({ hasResponded: false });
    }
  },

  acceptAll: () => {
    const fullPrefs: CookiePreferences = {
      necessary: true,
      analytics: true,
      functional: true,
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ timestamp: new Date().toISOString(), preferences: fullPrefs })
        );
      } catch (e) {
        console.error('Failed to save cookie preferences', e);
      }
    }
    set({ hasResponded: true, preferences: fullPrefs, isPreferencesModalOpen: false });
  },

  acceptNecessaryOnly: () => {
    const minimalPrefs: CookiePreferences = {
      necessary: true,
      analytics: false,
      functional: false,
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ timestamp: new Date().toISOString(), preferences: minimalPrefs })
        );
      } catch (e) {
        console.error('Failed to save cookie preferences', e);
      }
    }
    set({ hasResponded: true, preferences: minimalPrefs, isPreferencesModalOpen: false });
  },

  savePreferences: (customPrefs) => {
    const finalPrefs: CookiePreferences = {
      ...get().preferences,
      ...customPrefs,
      necessary: true,
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ timestamp: new Date().toISOString(), preferences: finalPrefs })
        );
      } catch (e) {
        console.error('Failed to save cookie preferences', e);
      }
    }
    set({ hasResponded: true, preferences: finalPrefs, isPreferencesModalOpen: false });
  },

  openPreferencesModal: () => set({ isPreferencesModalOpen: true }),
  closePreferencesModal: () => set({ isPreferencesModalOpen: false }),
}));
