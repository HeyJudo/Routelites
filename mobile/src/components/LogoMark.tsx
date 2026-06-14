import { MapPin } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, shadow, type } from "../theme";

type LogoMarkProps = {
  showWordmark?: boolean;
  size?: "sm" | "lg";
};

export function LogoMark({ showWordmark = true, size = "sm" }: LogoMarkProps) {
  const markSize = size === "lg" ? 78 : 30;
  const iconSize = size === "lg" ? 38 : 18;
  const isLg = size === "lg";

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          isLg ? styles.markLg : styles.markSm,
          {
            height: markSize,
            width: markSize,
          },
        ]}
      >
        <MapPin
          color={isLg ? colors.textOnPrimary : colors.primary}
          size={iconSize}
          strokeWidth={2.7}
        />
      </View>
      {showWordmark ? <Text style={styles.wordmark}>RouteLite</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    ...shadow.sm,
  },
  markLg: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 0,
  },
  markSm: {
    backgroundColor: colors.card,
    borderColor: colors.primarySoft,
    borderWidth: 2,
  },
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
