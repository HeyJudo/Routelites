import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { supabase } from "../lib/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  hasHydrated: boolean;
  postSignOutScreen: "SignUp" | null;

  initialize: () => void;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  continueAsGuest: () => void;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
  setPostSignOutScreen: (screen: "SignUp" | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  user: null,
  isGuest: false,
  hasHydrated: false,
  postSignOutScreen: null,

  initialize: () => {
    // Load any persisted session once at app start, then subscribe to changes.
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        hasHydrated: true,
      });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      });
    });
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    const needsConfirmation = !error && !data.session;
    return { error: error as Error | null, needsConfirmation };
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  },

  signInWithGoogle: async () => {
    try {
      // Use the native scheme directly — more reliable on Android than exp://
      const redirectTo = "routelite://auth-callback";
      console.log("[OAuth] redirectTo:", redirectTo);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError || !data.url) {
        return { error: (oauthError as Error | null) ?? new Error("No OAuth URL returned") };
      }

      console.log("[OAuth] Opening browser...");
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );
      console.log("[OAuth] Browser result:", result.type);

      if (result.type === "success") {
        const url = result.url;
        console.log("[OAuth] Redirect URL:", url);
        const parsedUrl = new URL(url);

        // PKCE flow: Supabase returns ?code= in the redirect URL
        const code = parsedUrl.searchParams.get("code");
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          return { error: exchangeError as Error | null };
        }

        // Implicit flow fallback: tokens in the URL fragment
        const params = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          return { error: setError as Error | null };
        }
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  resendConfirmation: async (email) => {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    return { error: error as Error | null };
  },

  continueAsGuest: () => {
    // isGuest is a per-launch choice — not persisted to AsyncStorage.
    set({ isGuest: true });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isGuest: false });
  },

  setPostSignOutScreen: (screen) => set({ postSignOutScreen: screen }),
}));
