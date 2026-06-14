import { Route } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, type } from "../theme";

export function ResultsTabScreen() {
  return (
    <View style={styles.container}>
      <Route color={colors.muted} size={48} />
      <Text style={styles.title}>No results yet</Text>
      <Text style={styles.copy}>
        Tap "Optimize route" in the Planner to see your optimized route here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.lg,
    justifyContent: "center",
    padding: 32,
  },
  copy: { ...type.body, color: colors.muted, textAlign: "center" },
  title: { ...type.title, color: colors.text },
});
