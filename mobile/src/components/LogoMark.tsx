import { Image, StyleSheet, Text, View } from "react-native";

import { colors, type } from "../theme";

const logoImage = require("../../assets/logo.png");

type LogoMarkProps = {
  showWordmark?: boolean;
  size?: "sm" | "lg";
};

export function LogoMark({ showWordmark = true, size = "sm" }: LogoMarkProps) {
  const markSize = size === "lg" ? 78 : 30;

  return (
    <View style={styles.row}>
      <Image
        source={logoImage}
        style={{ width: markSize, height: markSize }}
        resizeMode="contain"
      />
      {showWordmark ? <Text style={styles.wordmark}>RouteLite</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  wordmark: {
    ...type.title,
    color: colors.primaryDark,
    letterSpacing: -0.5,
  },
});
