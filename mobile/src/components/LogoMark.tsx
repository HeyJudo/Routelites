import { MapPin } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

type LogoMarkProps = {
  showWordmark?: boolean;
  size?: "sm" | "lg";
};

export function LogoMark({ showWordmark = true, size = "sm" }: LogoMarkProps) {
  const markSize = size === "lg" ? 78 : 30;
  const iconSize = size === "lg" ? 38 : 18;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          {
            height: markSize,
            width: markSize,
          },
        ]}
      >
        <MapPin color={colors.primary} size={iconSize} strokeWidth={2.7} />
      </View>
      {showWordmark ? <Text style={styles.wordmark}>RouteLite</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.primarySoft,
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  wordmark: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: "800",
  },
});

