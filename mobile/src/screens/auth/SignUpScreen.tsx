import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LogoMark } from "../../components/LogoMark";
import { PrimaryButton } from "../../components/PrimaryButton";
import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../state/authStore";
import { colors, radius, spacing } from "../../theme";

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
          <View style={styles.logoRow}>
            <LogoMark showWordmark size="sm" />
          </View>

          <View style={styles.header}>
            <Text style={styles.heading}>Create account</Text>
            <Text style={styles.subheading}>Start optimizing your delivery routes</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                style={[styles.input, loading && styles.inputDisabled]}
                value={email}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={[styles.input, loading && styles.inputDisabled]}
                value={password}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={[styles.input, loading && styles.inputDisabled]}
                value={confirmPassword}
              />
            </View>

            {error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.spinner} />
            ) : null}
          </View>

          <View style={styles.actions}>
            <PrimaryButton disabled={loading} onPress={handleSignUp}>
              Create account
            </PrimaryButton>

            <PrimaryButton disabled={loading} onPress={handleGoogle} variant="secondary">
              Continue with Google
            </PrimaryButton>

            <Pressable disabled={loading} hitSlop={8} onPress={handleGuest}>
              <Text style={styles.guestText}>Continue as guest</Text>
            </Pressable>
          </View>

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
  confirmationCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    padding: 12,
  },
  confirmationText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "600",
  },
  emailHighlight: {
    color: colors.text,
    fontWeight: "700",
  },
  resendText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  resendTextDim: {
    opacity: 0.5,
  },
  successContainer: {
    flex: 1,
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "600",
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  footer: {
    alignItems: "center",
    paddingTop: spacing.xl,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: "800",
  },
  footerText: {
    color: colors.muted,
    fontSize: 15,
  },
  form: {
    gap: spacing.lg,
  },
  guestText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  header: {
    gap: spacing.xs,
    paddingBottom: spacing.xl,
  },
  heading: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  keyboardView: {
    flex: 1,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  logoRow: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
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
  spinner: {
    alignSelf: "center",
  },
  subheading: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
});
