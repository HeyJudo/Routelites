import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme";

type ScreenShellProps = {
  children: ReactNode;
  padded?: boolean;
};

export function ScreenShell({ children, padded = true }: ScreenShellProps) {
  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={[styles.container, padded ? styles.padded : null]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  padded: {
    padding: 20,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});

