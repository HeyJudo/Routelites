import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Bike, Car, Truck } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { FadeSlideView } from "../components/FadeSlideView";
import { OnboardingHeader } from "../components/OnboardingHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectableCard } from "../components/SelectableCard";
import type { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../state/authStore";
import { useProfileStore } from "../state/profileStore";
import { colors, radius, spacing, type } from "../theme";

type PersonalizeRiderScreenProps = NativeStackScreenProps<RootStackParamList, "PersonalizeRider">;

const VEHICLE_OPTIONS = [
  { value: "motorcycle", label: "Motorcycle", icon: <Truck color={colors.primary} size={20} /> },
  { value: "bicycle", label: "Bicycle", icon: <Bike color={colors.primary} size={20} /> },
  { value: "car", label: "Car / Van", icon: <Car color={colors.primary} size={20} /> },
] as const;

const STOPS_OPTIONS = ["5–10", "10–20", "20+"] as const;
type StopsValue = (typeof STOPS_OPTIONS)[number];

/**
 * Personalization step 2 — quick taps: vehicle type + typical daily stops.
 * Skippable (progressive profiling).  Progress ~50%.
 */
export function PersonalizeRiderScreen({ navigation }: PersonalizeRiderScreenProps) {
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const isGuest = useAuthStore((s) => s.isGuest);

  const [vehicle, setVehicle] = useState<string | null>(null);
  const [stops, setStops] = useState<StopsValue | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!isGuest && (vehicle || stops)) {
      setLoading(true);
      await updateProfile({
        vehicle_type: vehicle ?? undefined,
        typical_daily_stops: stops ?? undefined,
      });
      setLoading(false);
    }
    navigation.navigate("SetStore");
  };

  const handleSkip = () => {
    navigation.navigate("SetStore");
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader progress={50} canGoBack onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <FadeSlideView delay={80}>
          <Text style={styles.stepLabel}>STEP 2 OF 4</Text>
          <Text style={styles.title}>How do you ride?</Text>
          <Text style={styles.subtitle}>
            Helps us optimise route suggestions for your setup.
          </Text>
        </FadeSlideView>

        <FadeSlideView delay={140} style={styles.section}>
          <Text style={styles.sectionLabel}>Vehicle type</Text>
          <View style={styles.cardRow}>
            {VEHICLE_OPTIONS.map((opt) => (
              <SelectableCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                onPress={() => setVehicle(vehicle === opt.value ? null : opt.value)}
                selected={vehicle === opt.value}
              />
            ))}
          </View>
        </FadeSlideView>

        <FadeSlideView delay={200} style={styles.section}>
          <Text style={styles.sectionLabel}>Typical daily stops</Text>
          <View style={styles.chipRow}>
            {STOPS_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setStops(stops === opt ? null : opt)}
                style={[styles.chip, stops === opt && styles.chipSelected]}
              >
                <Text style={[styles.chipText, stops === opt && styles.chipTextSelected]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        </FadeSlideView>
      </View>

      <FadeSlideView delay={280} style={styles.footer}>
        <PrimaryButton loading={loading} onPress={handleSave}>
          Continue
        </PrimaryButton>
        <Pressable disabled={loading} hitSlop={8} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </FadeSlideView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chip: {
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    ...type.label,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.primaryDark,
  },
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
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    ...type.heading,
    color: colors.text,
  },
  skipText: {
    ...type.label,
    color: colors.muted,
    textAlign: "center",
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
});
