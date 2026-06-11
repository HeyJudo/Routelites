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

type SignInScreenProps = NativeStackScreenProps<RootStackParamList, "SignIn">;

export function SignInScreen({ navigation }: SignInScreenProps) {
  const signIn = useAuthStore((s) => s.signIn);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);
    if (authError) {
      setError(authError.message);
    }
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
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Log in to your RouteLite account</Text>
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
                placeholder="Your password"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={[styles.input, loading && styles.inputDisabled]}
                value={password}
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
            <PrimaryButton disabled={loading} onPress={handleSignIn}>
              Log in
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
              onPress={() => navigation.navigate("SignUp")}
            >
              <Text style={styles.footerText}>
                Don't have an account?{" "}
                <Text style={styles.footerLink}>Sign up</Text>
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
