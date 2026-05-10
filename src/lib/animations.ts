import { useSettingsStore } from '@/stores/settingsStore';

export function useAnimDelay() {
  const enabled = useSettingsStore((s) => s.animationsEnabled);
  return (delay: number) => (enabled ? delay : 0);
}

export function useAnimDuration() {
  const enabled = useSettingsStore((s) => s.animationsEnabled);
  return (duration: number) => (enabled ? duration : 0);
}

export function useAnimTransition(defaultTransition?: Record<string, any>) {
  const enabled = useSettingsStore((s) => s.animationsEnabled);
  if (!enabled) {
    return { duration: 0, delay: 0 };
  }
  return defaultTransition;
}
