import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { LogoMark } from "../components/LogoMark";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type SplashScreenProps = NativeStackScreenProps<RootStackParamList, "Splash">;

export function SplashScreen({ navigation }: SplashScreenProps) {
  const progressWidth = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Fade in content
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate progress bar
    Animated.timing(progressWidth, {
      toValue: 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    // Navigate after animation
    const timeoutId = setTimeout(() => {
      navigation.replace("Welcome");
    }, 1400);

    return () => clearTimeout(timeoutId);
  }, [navigation, progressWidth, contentOpacity, contentTranslateY]);

  const widthInterpolated = progressWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <Animated.View
        style={[
          styles.center,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        <LogoMark showWordmark={false} size="lg" />
        <Text style={styles.title}>RouteLite</Text>
        <Text style={styles.subtitle}>
          Smarter delivery routes for Metro Manila
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.loadingText}>GETTING READY</Text>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.progress,
              {
                width: widthInterpolated,
              },
            ]}
          />
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
    left: 0,
    position: "absolute",
    right: 0,
  },
  loadingText: {
    color: colors.muted,
    fontFamily: "monospace",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
  },
  progress: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: "100%",
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
    borderRadius: 4,
    height: 6,
    marginHorizontal: 60,
    overflow: "hidden",
    width: 200,
  },
});
