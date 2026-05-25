import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LogoMark } from "../components/LogoMark";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type SplashScreenProps = NativeStackScreenProps<RootStackParamList, "Splash">;

export function SplashScreen({ navigation }: SplashScreenProps) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      navigation.replace("Welcome");
    }, 900);

    return () => clearTimeout(timeoutId);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.center}>
        <LogoMark showWordmark={false} size="lg" />
        <Text style={styles.title}>RouteLite</Text>
        <Text style={styles.subtitle}>
          Smarter delivery routes for Metro Manila
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.loadingText}>OPTIMIZING DATA</Text>
        <View style={styles.track}>
          <View style={styles.progress} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    gap: 16,
  },
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: 28,
  },
  footer: {
    alignItems: "center",
    bottom: 70,
    position: "absolute",
  },
  loadingText: {
    color: colors.muted,
    fontFamily: "monospace",
    fontSize: 11,
    letterSpacing: 0,
    marginBottom: 12,
  },
  progress: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 4,
    width: 64,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 280,
    textAlign: "center",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  track: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    width: 168,
  },
});

