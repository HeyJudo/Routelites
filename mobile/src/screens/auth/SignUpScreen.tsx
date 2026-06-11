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

type SignUpScreenProps = NativeStackScreenProps<RootStackParamList, "SignUp">;

export function SignUpScreen({ navigation }: SignUpScreenProps) {
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const resendConfirmation = useAuthStore((s) => s.resendConfirmation);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
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

  const handleSignUp = async () => {
    setError("");

    if (!email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: authError, needsConfirmation } = await signUp(email.trim(), password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else if (needsConfirmation) {
      setConfirmed(true);
    }
    // If no error and no needsConfirmation, session was created immediately —
    // onAuthStateChange fires and AppNavigator handles the redirect automatically.
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    const { error: authError } = await signInWithGoogle();
    setLoading(false);
    if (authError) {
      setError(authError.message);
    }
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

  if (confirmed) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <LogoMark showWordmark size="sm" />
          </View>

          <View style={styles.successContainer}>
            <View style={styles.header}>
              <Text style={styles.heading}>Account created</Text>
              <Text style={styles.subheading}>
                We sent a confirmation link to{" "}
                <Text style={styles.emailHighlight}>{email.trim()}</Text>
                {". Open it, then come back and log in."}
              </Text>
            </View>

            <View style={styles.actions}>
              <PrimaryButton onPress={() => navigation.navigate("SignIn")}>
                Go to log in
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
              Create your{" "}
              <Text style={styles.headingAccent}>account</Text>
            </Text>
            <Text style={styles.subheading}>Start optimizing your delivery routes</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(motion.base).delay(120)} style={styles.form}>
            <AuthInput
              autoCapitalize="none"
              autoCorrect={false}
              disabled={loading}
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
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
              secureTextEntry
              value={password}
            />

            <AuthInput
              autoCapitalize="none"
              autoCorrect={false}
              disabled={loading}
              label="Confirm password"
              onChangeText={setConfirmPassword}
              secureTextEntry
              value={confirmPassword}
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

          <Animated.View entering={FadeInDown.duration(motion.base).delay(180)} style={styles.actions}>
            <PrimaryButton loading={loading} onPress={handleSignUp}>
              Create account
            </PrimaryButton>

            <PrimaryButton
              disabled={loading}
              icon={<Text style={styles.googleG}>G</Text>}
              onPress={handleGoogle}
              variant="outline"
            >
              Continue with Google
            </PrimaryButton>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable disabled={loading} hitSlop={8} onPress={handleGuest}>
              <Text style={styles.guestText}>Continue as guest</Text>
            </Pressable>
          </Animated.View>

          <View style={styles.footer}>
            <Pressable
              hitSlop={8}
              onPress={() => navigation.navigate("SignIn")}
            >
              <Text style={styles.footerText}>
                Already have an account?{" "}
                <Text style={styles.footerLink}>Log in</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    paddingTop: spacing.xl,
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
  footer: {
    alignItems: "center",
    paddingTop: spacing.xl,
  },
  footerLink: {
    color: colors.primary,
    fontFamily: font.bold,
  },
  footerText: {
    ...type.body,
    color: colors.muted,
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
  subheading: {
    ...type.body,
    color: colors.muted,
  },
  successContainer: {
    flex: 1,
  },
});
