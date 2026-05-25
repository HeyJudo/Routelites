import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowRight } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { LogoMark } from "../components/LogoMark";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radius } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type WelcomeScreenProps = NativeStackScreenProps<RootStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LogoMark />
      </View>
      <View style={styles.mapPreview}>
        <View style={styles.river} />
        <View style={[styles.road, styles.roadOne]} />
        <View style={[styles.road, styles.roadTwo]} />
        <View style={[styles.road, styles.roadThree]} />
      </View>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Plan better delivery routes</Text>
        <Text style={styles.copy}>
          Add stops, optimize the order, and compare your route against the
          original input order.
        </Text>
        <PrimaryButton
          icon={<ArrowRight color={colors.card} size={20} />}
          onPress={() => navigation.navigate("SetStore")}
        >
          Get started
        </PrimaryButton>
        <Text style={styles.demoText}>Try demo route</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  copy: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 28,
    textAlign: "center",
  },
  demoText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 26,
    textAlign: "center",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 28,
    width: 32,
  },
  header: {
    alignItems: "center",
    paddingBottom: 16,
    paddingTop: 52,
  },
  mapPreview: {
    backgroundColor: "#edf5f5",
    flex: 1,
    overflow: "hidden",
  },
  river: {
    backgroundColor: "#bdeff4",
    borderRadius: 80,
    height: 84,
    left: -30,
    position: "absolute",
    top: 310,
    transform: [{ rotate: "-18deg" }],
    width: 460,
  },
  road: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 12,
    opacity: 0.85,
    position: "absolute",
    width: 440,
  },
  roadOne: {
    left: -60,
    top: 120,
    transform: [{ rotate: "32deg" }],
  },
  roadThree: {
    left: -10,
    top: 255,
    transform: [{ rotate: "-8deg" }],
  },
  roadTwo: {
    left: -25,
    top: 205,
    transform: [{ rotate: "-28deg" }],
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 28,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 14,
    textAlign: "center",
  },
});

