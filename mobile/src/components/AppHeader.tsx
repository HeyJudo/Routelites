import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "../state/authStore";
import { useProfileStore } from "../state/profileStore";
import { colors, font, radius, spacing, type } from "../theme";
import { LogoMark } from "./LogoMark";

type AppHeaderProps = {
  canGoBack?: boolean;
  onBack?: () => void;
  showBorder?: boolean;
  showGreeting?: boolean;
  title?: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getInitial(name: string | null | undefined): string {
  if (!name) return "R";
  return name.charAt(0).toUpperCase();
}

export function AppHeader({
  canGoBack,
  onBack,
  showBorder = true,
  showGreeting = false,
  title,
}: AppHeaderProps) {
  const profile = useProfileStore((s) => s.profile);
  const isGuest = useAuthStore((s) => s.isGuest);

  const riderName = profile?.displayName;
  const storeName = profile?.storeName;
  const displayGreeting = showGreeting && (riderName || isGuest);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={[styles.header, showBorder ? styles.headerBorder : null]}>
        {/* Left section */}
        <View style={styles.leftSection}>
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

        {/* Center / Content */}
        {displayGreeting ? (
          <View style={styles.greetingRow}>
            {/* Text block — left-aligned */}
            <View style={styles.greetingTextBlock}>
              <Text style={styles.greetingLabel}>{getGreeting()} 👋</Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {riderName || "Rider"}
              </Text>
            </View>

            {/* Avatar circle — right side */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitial(riderName)}
              </Text>
            </View>
          </View>
        ) : title ? (
          <View style={styles.centerBlock}>
            <Text style={styles.title}>{title}</Text>
          </View>
        ) : (
          <View style={styles.centerBlock}>
            <LogoMark />
          </View>
        )}

        {/* Right spacer (only used when NOT greeting mode) */}
        {!displayGreeting && <View style={styles.rightSection} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontFamily: font.bold,
    fontSize: 16,
  },
  centerBlock: {
    alignItems: "center",
    flex: 1,
  },
  greetingLabel: {
    ...type.caption,
    color: colors.muted,
  },
  greetingName: {
    ...type.heading,
    color: colors.text,
    fontSize: 18,
  },
  greetingRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  greetingTextBlock: {
    flex: 1,
    gap: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.background,
    flexDirection: "row",
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  leftSection: {
    minWidth: 16,
  },
  rightSection: {
    alignItems: "flex-end",
    minWidth: 48,
  },
  safeArea: {
    backgroundColor: colors.background,
  },
  title: {
    ...type.heading,
    color: colors.primaryDark,
  },
});
