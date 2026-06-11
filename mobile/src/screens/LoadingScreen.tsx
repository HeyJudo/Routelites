import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { CheckCircle2, Circle, CircleAlert, Route } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LogoMark } from "../components/LogoMark";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, font, motion, radius, spacing, type } from "../theme";
import type { RootStackParamList } from "../navigation/types";

import { optimizeRoute, OptimizeRequest } from "../api/routes";
import { ApiError } from "../api/clients";
import { useRouteDraftStore } from "../state/routeDraftStore";

type LoadingScreenProps = NativeStackScreenProps<RootStackParamList, "Loading">;

const STEPS = [
  "Mapping stops",
  "Calculating shortest paths",
  "Finding best stop order",
];
const STEP_DELAY_MS = 720;

export function LoadingScreen({ navigation }: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storeLocation = useRouteDraftStore((s) => s.storeLocation);
  const stops = useRouteDraftStore((s) => s.stops);

  // Ring sweep animation
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Route icon pulse
  const iconScale = useSharedValue(1);
  useEffect(() => {
    iconScale.value = withRepeat(
      withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const iconScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Step pacing — restarts on each new attempt
  useEffect(() => {
    if (error) return;
    setCurrentStep(0);

    const advance = () => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= STEPS.length) return prev;
        timerRef.current = setTimeout(advance, STEP_DELAY_MS);
        return next;
      });
    };
    timerRef.current = setTimeout(advance, STEP_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [attempt, error]);

  // Backend request — reruns on each new attempt
  useEffect(() => {
    let cancelled = false;

    async function callBackend() {
      try {
        const request: OptimizeRequest = {
          store: {
            lat: storeLocation!.lat,
            lng: storeLocation!.lng,
            lon: storeLocation!.lng,
            label: storeLocation!.label || "Store",
            address: storeLocation!.address ?? "",
          },
          stops: stops.map((s) => ({
            id: s.id,
            lat: s.lat,
            lng: s.lng,
            lon: s.lng,
            label: s.label || "Stop",
            address: s.address ?? "",
          })),
        };

        console.log("Sending optimize request to backend...");
        const [response] = await Promise.all([
          optimizeRoute(request),
          new Promise<void>((resolve) =>
            setTimeout(resolve, STEPS.length * STEP_DELAY_MS)
          ),
        ]);

        if (!cancelled) {
          console.log("Route optimization successful!");
          navigation.replace("Results", { response });
        }
      } catch (err) {
        if (!cancelled) {
          let message = "Something went wrong. Try again.";

          if (err instanceof ApiError) {
            if (err.status === 422) {
              message =
                (err.body as any)?.detail ??
                "Invalid request. Check your stops and try again.";
            } else if (err.status === 501) {
              message =
                "Routes with 11+ stops are not supported yet. Use 1-10 stops.";
            } else if (err.status === 500) {
              message = "Something went wrong. Try again.";
            }
          } else {
            message = "Could not reach the server. Is the backend running?";
          }

          setError(message);
        }
      }
    }

    callBackend();

    return () => {
      // Setting cancelled=true prevents setError / navigation.replace
      // from firing after unmount (Cancel button) or after a new attempt
      // kicks off a fresh effect run.
      cancelled = true;
    };
  }, [navigation, storeLocation, stops, attempt]);

  const handleRetry = () => {
    setError(null);
    // Incrementing attempt re-triggers both effects above with a clean slate.
    setAttempt((a) => a + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <LogoMark />
      </View>
      <View style={styles.card}>
        {error ? (
          <Animated.View
            entering={FadeInDown.duration(motion.base)}
            style={styles.errorContent}
          >
            <CircleAlert color={colors.danger} size={40} />
            <Text style={styles.errorTitle}>Optimization failed</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <PrimaryButton onPress={handleRetry}>Try again</PrimaryButton>
            <PrimaryButton
              variant="secondary"
              onPress={() => navigation.goBack()}
            >
              Go back
            </PrimaryButton>
          </Animated.View>
        ) : (
          <>
            <View style={styles.loaderContainer}>
              {/* Base track ring */}
              <View style={styles.loaderTrack} />
              {/* Rotating sweep arc (~270° visible, bottom+left borders transparent) */}
              <Animated.View style={[styles.loaderArc, spinStyle]} />
              {/* Pulsing icon at center */}
              <Animated.View style={[styles.loaderIcon, iconScaleStyle]}>
                <Route color={colors.primary} size={36} />
              </Animated.View>
            </View>
            <Text style={styles.title}>Optimizing route</Text>
            {STEPS.map((label, i) => (
              <ProgressStep
                key={label}
                label={label}
                complete={i < currentStep}
                active={i === currentStep}
              />
            ))}
            <View style={styles.divider} />
            <Text style={styles.algorithmText}>
              USING DIJKSTRA + BRANCH AND BOUND
            </Text>
            <Pressable
              accessibilityLabel="Cancel optimization"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

type ProgressStepProps = { active?: boolean; complete?: boolean; label: string };

function ProgressStep({ active, complete, label }: ProgressStepProps) {
  const haloOpacity = useSharedValue(active ? 0.5 : 0);

  useEffect(() => {
    if (active) {
      haloOpacity.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      haloOpacity.value = 0;
    }
  }, [active]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
  }));

  return (
    <View style={[styles.step, active && styles.activeStep]}>
      {active && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.activeHalo, haloStyle]}
        />
      )}
      {complete ? (
        <Animated.View entering={ZoomIn.duration(200)}>
          <CheckCircle2 color="#6aa7a0" size={22} />
        </Animated.View>
      ) : (
        <Circle color={active ? colors.primary : "#a9bbb5"} size={22} />
      )}
      <Text style={[styles.stepText, active && styles.activeStepText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  activeHalo: {
    backgroundColor: colors.mutedSoft,
    borderRadius: radius.sm,
  },
  activeStep: { backgroundColor: colors.mutedSoft },
  activeStepText: { color: colors.primaryDark, fontFamily: font.bold },
  algorithmText: {
    color: colors.muted,
    textAlign: "center",
    textTransform: "uppercase",
    ...type.mono,
  },
  brand: { alignItems: "center", paddingTop: 44 },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelText: {
    color: colors.muted,
    ...type.label,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    gap: spacing.md,
    marginHorizontal: 18,
    marginTop: 130,
    padding: 32,
    paddingTop: 32,
  },
  container: { backgroundColor: colors.mapSurface, flex: 1 },
  divider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  errorContent: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  errorMessage: {
    color: colors.muted,
    textAlign: "center",
    ...type.body,
  },
  errorTitle: {
    color: colors.text,
    textAlign: "center",
    ...type.heading,
  },
  loaderArc: {
    borderBottomColor: "transparent",
    borderColor: colors.primary,
    borderLeftColor: "transparent",
    borderRadius: 50,
    borderWidth: 8,
    height: 96,
    position: "absolute",
    width: 96,
  },
  loaderContainer: {
    alignItems: "center",
    alignSelf: "center",
    height: 96,
    justifyContent: "center",
    width: 96,
  },
  loaderIcon: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  loaderTrack: {
    borderColor: colors.primarySoft,
    borderRadius: 50,
    borderWidth: 8,
    height: 96,
    position: "absolute",
    width: 96,
  },
  step: {
    alignItems: "center",
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 48,
    overflow: "hidden",
    paddingHorizontal: 14,
  },
  stepText: { color: colors.muted, ...type.body },
  title: {
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
    ...type.title,
  },
});
