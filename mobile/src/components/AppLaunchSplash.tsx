import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { colors, motion, type } from "../theme";
import { LogoMark } from "./LogoMark";

/**
 * Full-screen branded launch animation. Shown while the app hydrates auth +
 * draft + profile stores. A minimum display time (~1.2 s) ensures the
 * animation always fully plays before the auth screen appears.
 */
export function AppLaunchSplash() {
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: motion.slow });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 160, mass: 0.8 });
  }, [logoOpacity, logoScale]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Decorative blobs */}
      <View pointerEvents="none" style={styles.blobTopLeft} />
      <View pointerEvents="none" style={styles.blobBottomRight} />

      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <LogoMark showWordmark={false} size="lg" />
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.duration(motion.base).delay(200)}
        style={styles.wordmark}
      >
        RouteLite
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.duration(motion.base).delay(360)}
        style={styles.tagline}
      >
        Smarter delivery routes
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  blobBottomRight: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    bottom: -100,
    height: 320,
    opacity: 0.45,
    position: "absolute",
    right: -100,
    width: 320,
  },
  blobTopLeft: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 260,
    left: -80,
    opacity: 0.5,
    position: "absolute",
    top: -60,
    width: 260,
  },
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  tagline: {
    ...type.body,
    color: colors.muted,
    marginTop: 8,
  },
  wordmark: {
    ...type.display,
    color: colors.primaryDark,
    letterSpacing: -0.5,
  },
});
