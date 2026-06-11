import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LogoMark } from "../components/LogoMark";
import { colors, motion, type } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type SplashScreenProps = NativeStackScreenProps<RootStackParamList, "Splash">;

export function SplashScreen({ navigation }: SplashScreenProps) {
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, motion.spring);
    logoOpacity.value = withSpring(1, motion.spring);

    const timeoutId = setTimeout(() => {
      navigation.replace("Welcome");
    }, 900);

    return () => clearTimeout(timeoutId);
  }, [navigation]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <LogoMark showWordmark={false} size="lg" />
        </Animated.View>
        <Animated.Text
          entering={FadeInDown.delay(80).duration(250)}
          style={styles.title}
        >
          RouteLite
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(80).duration(250)}
          style={styles.subtitle}
        >
          Smarter delivery routes for Metro Manila
        </Animated.Text>
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
  subtitle: {
    color: colors.muted,
    maxWidth: 280,
    textAlign: "center",
    ...type.body,
  },
  title: {
    color: colors.text,
    letterSpacing: -0.5,
    ...type.display,
  },
});
