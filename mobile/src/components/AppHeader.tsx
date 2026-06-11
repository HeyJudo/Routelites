import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, type } from "../theme";
import { LogoMark } from "./LogoMark";

type AppHeaderProps = {
  canGoBack?: boolean;
  onBack?: () => void;
  showBorder?: boolean;
  title?: string;
};

export function AppHeader({
  canGoBack,
  onBack,
  showBorder = true,
  title,
}: AppHeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={[styles.header, showBorder ? styles.headerBorder : null]}>
        <View style={styles.side}>
          {canGoBack ? (
            <Pressable
              accessibilityLabel="Go back"
              onPress={onBack}
              style={styles.iconButton}
            >
              <ChevronLeft color={colors.primaryDark} size={26} />
            </Pressable>
          ) : null}
        </View>
        {title ? <Text style={styles.title}>{title}</Text> : <LogoMark />}
        <View style={[styles.side, styles.rightSide]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: colors.background,
    flexDirection: "row",
    height: 56,
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  headerBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  rightSide: {
    alignItems: "flex-end",
  },
  safeArea: {
    backgroundColor: colors.background,
  },
  side: {
    minWidth: 48,
  },
  title: {
    ...type.heading,
    color: colors.primaryDark,
  },
});
