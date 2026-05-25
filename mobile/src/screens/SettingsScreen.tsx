import { FlaskConical, Info, PlugZap, Store } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radius, spacing } from "../theme";

export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <AppHeader showMenu />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Manage routing preferences and system status.
        </Text>
        <SettingsCard
          icon={<Store color={colors.primaryDark} size={22} />}
          title="Store Location"
        >
          <Text style={styles.bodyText}>Currently assigned to Depot Alpha.</Text>
          <PrimaryButton variant="secondary">Change store location</PrimaryButton>
        </SettingsCard>
        <SettingsCard
          icon={<PlugZap color={colors.primaryDark} size={22} />}
          title="Connection"
        >
          <Text style={styles.bodyText}>Backend routing engine is online.</Text>
          <PrimaryButton>Test backend status</PrimaryButton>
        </SettingsCard>
        <SettingsCard
          icon={<FlaskConical color={colors.primaryDark} size={22} />}
          title="Demo & Development"
        >
          <PrimaryButton variant="secondary">Load demo route</PrimaryButton>
          <PrimaryButton variant="danger">Clear route draft</PrimaryButton>
        </SettingsCard>
        <SettingsCard
          icon={<Info color={colors.muted} size={22} />}
          title="About"
        >
          <Text style={styles.bodyText}>
            RouteLite uses Dijkstra + Branch and Bound for route optimization.
          </Text>
        </SettingsCard>
      </ScrollView>
    </View>
  );
}

type SettingsCardProps = {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
};

function SettingsCard({ children, icon, title }: SettingsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <View style={styles.iconWrap}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.lg,
    padding: 20,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  cardTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: 20,
    paddingBottom: 120,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: -8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
});

