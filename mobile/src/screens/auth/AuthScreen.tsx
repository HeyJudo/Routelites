import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthInput } from "../../components/AuthInput";
import { LogoMark } from "../../components/LogoMark";
import { PrimaryButton } from "../../components/PrimaryButton";
import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { colors, font, motion, radius, spacing, type } from "../../theme";

type AuthScreenProps = NativeStackScreenProps<RootStackParamList, "Auth">;

/** Combined sign-in / sign-up screen. Google + guest are the primary paths. */
export function AuthScreen(_props: AuthScreenProps) {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const resendConfirmation = useAuthStore((s) => s.resendConfirmation);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // When Supabase says the email is new and user confirms account creation
  const [offerCreate, setOfferCreate] = useState(false);
  // After signUp that needs email confirmation
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendError, setResendError] = useState("");

  const shakeX = useSharedValue(0);
  const prevError = useRef("");

  useEffect(() => {
    if (error && error !== prevError.current) {
      shakeX.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 60 }),
        withTiming(-4, { duration: 60 }),
        withTiming(4, { duration: 60 }),
        withTiming(0, { duration: 70 }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    prevError.current = error;
  }, [error, shakeX]);

  const errorShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleContinue = async () => {
    setError("");
    setOfferCreate(false);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error: signInErr } = await signIn(email.trim(), password);
    setLoading(false);

    if (!signInErr) return; // success — navigator handles redirect

    const msg = signInErr.message ?? "";
    const isInvalidCreds = msg.toLowerCase().includes("invalid login credentials") ||
      msg.toLowerCase().includes("invalid") ||
      msg.toLowerCase().includes("credentials");

    if (isInvalidCreds) {
      // Surface inline account-creation offer instead of hard error
      setOfferCreate(true);
      setError("No account found for that email. Create one?");
    } else {
      setError(msg || "Something went wrong. Please try again.");
    }
  };

  const handleCreateAccount = async () => {
    setError("");
    setOfferCreate(false);
    setLoading(true);
    const { error: signUpErr, needsConfirmation: nc } = await signUp(email.trim(), password);
    setLoading(false);

    if (signUpErr) {
      setError(signUpErr.message || "Could not create account.");
    } else if (nc) {
      setNeedsConfirmation(true);
    }
    // If no error and session created immediately — navigator handles it
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    const { error: authError } = await signInWithGoogle();
    setLoading(false);
    if (authError) setError(authError.message);
  };

  const handleGuest = () => {
    continueAsGuest();
  };

  const handleResend = async () => {
    setResendStatus("sending");
    setResendError("");
    const { error: resendErr } = await resendConfirmation(email.trim());
    if (resendErr) {
      setResendStatus("error");
      setResendError(resendErr.message);
    } else {
      setResendStatus("sent");
    }
  };

  // --- Confirmation waiting state ---
  if (needsConfirmation) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoRow}>
            <LogoMark showWordmark size="sm" />
          </View>
          <View style={styles.header}>
            <Text style={styles.heading}>Check your email</Text>
            <Text style={styles.subheading}>
              We sent a confirmation link to{" "}
              <Text style={styles.emailHighlight}>{email.trim()}</Text>
              {". Open it, then come back to sign in."}
            </Text>
          </View>
          <View style={styles.actions}>
            <PrimaryButton onPress={() => setNeedsConfirmation(false)}>
              Back to sign in
            </PrimaryButton>
            <Pressable
              disabled={resendStatus === "sending"}
              hitSlop={8}
              onPress={handleResend}
            >
              <Text style={[styles.resendText, resendStatus === "sending" && styles.resendTextDim]}>
                {resendStatus === "sending" ? "Sending…" : "Resend confirmation email"}
              </Text>
            </Pressable>
            {resendStatus === "sent" ? (
              <View style={styles.confirmationCard}>
                <Text style={styles.confirmationText}>Sent! Check your inbox.</Text>
              </View>
            ) : null}
            {resendStatus === "error" && resendError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{resendError}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Background blob */}
          <View pointerEvents="none" style={styles.blob} />

          <Animated.View entering={FadeInDown.duration(motion.base).delay(0)} style={styles.logoRow}>
            <LogoMark showWordmark size="sm" />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(motion.base).delay(60)} style={styles.header}>
            <Text style={styles.heading}>
              Welcome to{" "}
              <Text style={styles.headingAccent}>RouteLite</Text>
            </Text>
            <Text style={styles.subheading}>Sign in or create your account below</Text>
          </Animated.View>

          {/* Primary social actions */}
          <Animated.View entering={FadeInDown.duration(motion.base).delay(100)} style={styles.socialActions}>
            <PrimaryButton
              disabled={loading}
              icon={<Text style={styles.googleG}>G</Text>}
              onPress={handleGoogle}
              variant="outline"
            >
              Continue with Google
            </PrimaryButton>
            <Pressable disabled={loading} hitSlop={8} onPress={handleGuest}>
              <Text style={styles.guestText}>Continue as guest</Text>
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View entering={FadeInDown.duration(motion.base).delay(140)} style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in with email</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Email + password */}
          <Animated.View entering={FadeInDown.duration(motion.base).delay(180)} style={styles.form}>
            <AuthInput
              autoCapitalize="none"
              autoCorrect={false}
              disabled={loading}
              keyboardType="email-address"
              label="Email"
              onChangeText={(v) => { setEmail(v); setOfferCreate(false); }}
              placeholder="you@example.com"
              value={email}
            />
            <AuthInput
              autoCapitalize="none"
              autoCorrect={false}
              disabled={loading}
              label="Password"
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureToggle
              value={password}
            />

            {error ? (
              <Animated.View
                entering={FadeInDown.duration(motion.base)}
                style={[styles.errorCard, errorShakeStyle]}
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}
          </Animated.View>

          {/* CTA row */}
          <Animated.View entering={FadeInDown.duration(motion.base).delay(220)} style={styles.actions}>
            {offerCreate ? (
              <>
                <PrimaryButton loading={loading} onPress={handleCreateAccount}>
                  Create account
                </PrimaryButton>
                <Pressable hitSlop={8} onPress={() => { setOfferCreate(false); setError(""); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </>
            ) : (
              <PrimaryButton loading={loading} onPress={handleContinue}>
                Continue
              </PrimaryButton>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  blob: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 280,
    left: -80,
    opacity: 0.5,
    position: "absolute",
    top: -60,
    width: 280,
    zIndex: -1,
  },
  cancelText: {
    ...type.label,
    color: colors.muted,
    textAlign: "center",
  },
  confirmationCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    padding: 12,
  },
  confirmationText: {
    ...type.label,
    color: colors.primaryDark,
  },
  dividerLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  dividerText: {
    ...type.caption,
    color: colors.muted,
  },
  emailHighlight: {
    color: colors.text,
    fontFamily: font.bold,
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: 12,
  },
  errorText: {
    ...type.label,
    color: colors.danger,
  },
  form: {
    gap: spacing.lg,
  },
  googleG: {
    color: "#4285F4", // Google brand blue — intentional
    fontFamily: font.heavy,
    fontSize: 16, // Google "G" glyph — intentionally larger than type.label
  },
  guestText: {
    ...type.label,
    color: colors.muted,
    textAlign: "center",
  },
  header: {
    gap: spacing.xs,
    paddingBottom: spacing.xl,
  },
  heading: {
    ...type.display,
    color: colors.text,
  },
  headingAccent: {
    color: colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  logoRow: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  resendText: {
    ...type.label,
    color: colors.primary,
    textAlign: "center",
  },
  resendTextDim: {
    opacity: 0.5,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  socialActions: {
    gap: spacing.md,
  },
  subheading: {
    ...type.body,
    color: colors.muted,
  },
});
