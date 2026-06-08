import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CheckCircle2, ChevronLeft, Circle, Route } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { LogoMark } from "../components/LogoMark";
import { mockOptimizeResponse } from "../mocks/mockOptimizeResponse";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

import { optimizeRoute, OptimizeRequest, OptimizeResponse } from "../api/routes";
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storeLocation = useRouteDraftStore((s) => s.storeLocation);
  const stops = useRouteDraftStore((s) => s.stops);

  useEffect(() => {

    const advance = () => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= STEPS.length)   return prev;
        //  timerRef.current = setTimeout(() => {
          //  navigation.replace("Results", { response: mockOptimizeResponse });
          //}, STEP_DELAY_MS);
        
        timerRef.current = setTimeout(advance, STEP_DELAY_MS);
        return next;
      });
    };
    timerRef.current = setTimeout(advance, STEP_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

useEffect(() => {
    let cancelled = false;

    async function callBackend() {
      try {
        // Construct the expected payload shape
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
        const [response] = await Promise.all([optimizeRoute(request),
        new Promise <void> (resolve => setTimeout(resolve, STEPS.length * STEP_DELAY_MS)),
        ]);
        
        if (!cancelled) {
          console.log("🎉 Route optimization successful!");
           navigation.replace("Results", { response});
        }
      } catch (error) {
        if (!cancelled) {
    let message = "Something went wrong. Try again.";

    if (error instanceof ApiError) {
      if (error.status === 422) {
        message = (error.body as any)?.detail ?? "Invalid request. Check your stops and try again.";
      } else if (error.status === 501) {
        message = "Routes with 11+ stops are not supported yet. Use 1-10 stops.";
      } else if (error.status === 500) {
        message = "Something went wrong. Try again.";
      }
    } else {
      message = "Could not reach the server. Is the backend running?";
    }

    Alert.alert("Optimization failed", message, [
      { text: "Go back", onPress: () => navigation.goBack() },
    ]);
  }
}
    }

    callBackend();
    
    return () => {
      cancelled = true;
    };
  }, [navigation, storeLocation, stops]);


  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <LogoMark />
      </View>
      <View style={styles.card}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft color={colors.primaryDark} size={28} />
        </Pressable>
        <View style={styles.loader}>
          <Route color={colors.primary} size={36} />
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
      </View>
    </View>
  );
}

type ProgressStepProps = { active?: boolean; complete?: boolean; label: string };

function ProgressStep({ active, complete, label }: ProgressStepProps) {
  return (
    <View style={[styles.step, active && styles.activeStep]}>
      {complete ? (
        <CheckCircle2 color="#6aa7a0" size={22} />
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
  activeStep: { backgroundColor: colors.mutedSoft },
  activeStepText: { color: colors.primaryDark, fontWeight: "900" },
  algorithmText: {
    color: colors.muted,
    fontFamily: "monospace",
    fontSize: 11,
    textAlign: "center",
  },
  backButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    left: 16,
    position: "absolute",
    top: 16,
    width: 44,
  },
  brand: { alignItems: "center", paddingTop: 44 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    gap: spacing.md,
    marginHorizontal: 18,
    marginTop: 130,
    padding: 32,
    paddingTop: 64,
  },
  container: { backgroundColor: "#e6eeeb", flex: 1 },
  divider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  loader: {
    alignItems: "center",
    alignSelf: "center",
    borderColor: colors.primarySoft,
    borderRadius: 50,
    borderWidth: 8,
    height: 96,
    justifyContent: "center",
    width: 96,
  },
  step: {
    alignItems: "center",
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  stepText: { color: colors.muted, fontSize: 16 },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
  },
});
