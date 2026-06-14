import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";

import { useAuthStore } from "../../state/authStore";

const STORAGE_PREFIX = "routelite-walkthrough-seen";

/**
 * Build a per-identity storage key so the walkthrough is tracked per account
 * (and once for guests). A brand-new account therefore sees the tour even if
 * another account on the same device already completed it.
 */
function buildKey(): string {
  const { isGuest, user } = useAuthStore.getState();
  if (user) return `${STORAGE_PREFIX}:${user.id}`;
  if (isGuest) return `${STORAGE_PREFIX}:guest`;
  return STORAGE_PREFIX;
}

/**
 * Manages the walkthrough lifecycle: whether the current account has seen it,
 * and show/dismiss controls. The walkthrough itself is a full-screen carousel
 * (see WalkthroughCarousel) so no layout measurement is involved.
 */
export function useWalkthrough() {
  const [isVisible, setIsVisible] = useState(false);

  const shouldShow = useCallback(async (): Promise<boolean> => {
    try {
      const seen = await AsyncStorage.getItem(buildKey());
      return !seen;
    } catch {
      return false;
    }
  }, []);

  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  const complete = useCallback(async () => {
    setIsVisible(false);
    try {
      await AsyncStorage.setItem(buildKey(), "true");
    } catch {
      // Silently fail
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(buildKey());
    } catch {
      // Silently fail
    }
  }, []);

  return {
    isVisible,
    shouldShow,
    show,
    complete,
    reset,
  };
}
