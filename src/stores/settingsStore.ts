import { create } from 'zustand';

interface SettingsState {
  vibrationEnabled: boolean;
  vibrationSupported: boolean;
  animationsEnabled: boolean;

  toggleVibration: () => void;
  toggleAnimations: () => void;
}

const STORAGE_KEY = 'impostor_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { vibrationEnabled: true, animationsEnabled: true };
}

function saveSettings(s: { vibrationEnabled: boolean; animationsEnabled: boolean }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const initial = loadSettings();

export const useSettingsStore = create<SettingsState>((set) => ({
  vibrationEnabled: initial.vibrationEnabled,
  vibrationSupported: typeof navigator !== 'undefined' && 'vibrate' in navigator,
  animationsEnabled: initial.animationsEnabled,

  toggleVibration: () => {
    set((state) => {
      const next = !state.vibrationEnabled;
      saveSettings({ vibrationEnabled: next, animationsEnabled: state.animationsEnabled });
      return { vibrationEnabled: next };
    });
  },

  toggleAnimations: () => {
    set((state) => {
      const next = !state.animationsEnabled;
      saveSettings({ vibrationEnabled: state.vibrationEnabled, animationsEnabled: next });
      return { animationsEnabled: next };
    });
  },
}));
