import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Crosshair, Search } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { RouteMap } from "../components/RouteMap";
import { ScreenShell } from "../components/ScreenShell";
import { demoStore } from "../data/demoRoute";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type SetStoreScreenProps = NativeStackScreenProps<RootStackParamList, "SetStore">;

export function SetStoreScreen({ navigation }: SetStoreScreenProps) {
  return (
    <View style={styles.container}>
      <AppHeader
        canGoBack
        onBack={() => navigation.goBack()}
        title="Set store location"
      />
      <ScreenShell padded={false}>
        <View style={styles.content}>
          <Text style={styles.helpText}>
            Choose where your delivery route starts.
          </Text>
          <View style={styles.searchBox}>
            <Search color={colors.muted} size={20} />
            <Text style={styles.searchText}>Search store or pickup location</Text>
          </View>
          <Pressable style={styles.currentLocation}>
            <Crosshair color={colors.primary} size={20} />
            <Text style={styles.currentLocationText}>Use current location</Text>
          </Pressable>
        </View>
        <View style={styles.mapArea}>
          <RouteMap store={demoStore} />
        </View>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.storeTitle}>{demoStore.label}</Text>
          <Text style={styles.storeAddress}>
            {demoStore.address}
          </Text>
          <PrimaryButton onPress={() => navigation.replace("MainTabs")}>
            Save store location
          </PrimaryButton>
        </View>
      </ScreenShell>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: 20,
  },
  currentLocation: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  currentLocationText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: "800",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 24,
    width: 32,
  },
  helpText: {
    color: colors.text,
    fontSize: 16,
  },
  mapArea: {
    backgroundColor: "#e7efed",
    flex: 1,
    overflow: "hidden",
  },
  searchBox: {
    alignItems: "center",
    borderColor: "#b9cbc5",
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  searchText: {
    color: colors.muted,
    fontSize: 16,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 20,
  },
  storeAddress: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 22,
  },
  storeTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
});
