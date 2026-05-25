import { ChevronLeft, MoreVertical } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme";
import { LogoMark } from "./LogoMark";

type AppHeaderProps = {
  canGoBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  title?: string;
};

export function AppHeader({
  canGoBack,
  onBack,
  showMenu,
  title,
}: AppHeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
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
        <View style={[styles.side, styles.rightSide]}>
          {showMenu ? (
            <Pressable accessibilityLabel="More options" style={styles.iconButton}>
              <MoreVertical color={colors.text} size={22} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: 14,
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
    color: colors.primaryDark,
    fontSize: 21,
    fontWeight: "800",
  },
});

