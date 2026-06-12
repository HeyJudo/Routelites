import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import { AuthInput } from "../components/AuthInput";
import { FadeSlideView } from "../components/FadeSlideView";
import { OnboardingHeader } from "../components/OnboardingHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import type { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../state/authStore";
import { useProfileStore } from "../state/profileStore";
import { colors, spacing, type } from "../theme";
import { useState } from "react";

type PersonalizeProfileScreenProps = NativeStackScreenProps<RootStackParamList, "PersonalizeProfile">;

/**
 * Personalization step 1 — essential info: store/business name + rider name.
 * Progress ~25%.
 */
export function PersonalizeProfileScreen({ navigation }: PersonalizeProfileScreenProps) {
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const profile = useProfileStore((s) => s.profile);
  const isGuest = useAuthStore((s) => s.isGuest);

  const [storeName, setStoreName] = useState(profile?.storeName ?? "");
  const [riderName, setRiderName] = useState(profile?.displayName ?? "");
  const [loading, setLoading] = useState(false);

  const canContinue = storeName.trim().length > 0;

  const handleContinue = async () => {
    if (!canContinue) return;

    if (!isGuest) {
      setLoading(true);
      await updateProfile({
        store_name: storeName.trim(),
        display_name: riderName.trim() || null,
      });
      setLoading(false);
    }

    navigation.navigate("PersonalizeRider");
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader progress={25} canGoBack onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <FadeSlideView delay={80}>
          <Text style={styles.stepLabel}>STEP 1 OF 4</Text>
          <Text style={styles.title}>
            Tell us about{" "}
            <Text style={styles.titleAccent}>your store</Text>
          </Text>
          <Text style={styles.subtitle}>
            We'll use this to personalise your routes and run summaries.
          </Text>
        </FadeSlideView>

        <FadeSlideView delay={160} style={styles.form}>
          <AuthInput
            autoCapitalize="words"
            autoCorrect={false}
            disabled={loading}
            label="Store or business name"
            onChangeText={setStoreName}
            placeholder="e.g. Jollibee Fairview"
            value={storeName}
          />
          <AuthInput
            autoCapitalize="words"
            autoCorrect={false}
            disabled={loading}
            label="Your rider name (optional)"
            onChangeText={setRiderName}
            placeholder="e.g. Juan"
            value={riderName}
          />
          <Text style={styles.hint}>
            You can update these later in Settings.
          </Text>
        </FadeSlideView>
      </View>

      <FadeSlideView delay={260} style={styles.footer}>
        <PrimaryButton disabled={!canContinue} loading={loading} onPress={handleContinue}>
          Continue
        </PrimaryButton>
      </FadeSlideView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.xl,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  footer: {
    gap: spacing.md,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  form: {
    gap: spacing.lg,
  },
  hint: {
    ...type.caption,
    color: colors.muted,
  },
  stepLabel: {
    ...type.caption,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    ...type.body,
    color: colors.muted,
  },
  title: {
    ...type.display,
    color: colors.text,
    marginBottom: 8,
  },
  titleAccent: {
    color: colors.primary,
  },
});
