import { ChevronDown, ChevronUp, Trash2, X } from "lucide-react-native";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, radius, spacing } from "../theme";

type Props = { visible: boolean; onClose: () => void };

/**
 * Render a slide-in modal showing the current route stops with per-stop reorder and remove controls.
 *
 * The modal lists stops with a 1-based index badge, primary label, truncated address, and actions to move a stop up/down or remove it.
 * When no stops exist an empty-state message is shown. When stops are present a footer exposes a "Clear all stops" action.
 *
 * @param visible - Whether the modal is visible
 * @param onClose - Called when the modal should be closed (e.g., header close button or system back)
 * @returns The rendered modal element containing the stops list and controls
 */
export function StopListModal({ visible, onClose }: Props) {
  const stops = useRouteDraftStore((s) => s.stops);
  const removeStop = useRouteDraftStore((s) => s.removeStop);
  const reorderStop = useRouteDraftStore((s) => s.reorderStop);
  const clearStops = useRouteDraftStore((s) => s.clearStops);

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Stops ({stops.length})</Text>
          <Pressable hitSlop={12} onPress={onClose}>
            <X color={colors.text} size={24} />
          </Pressable>
        </View>

        <FlatList
          contentContainerStyle={styles.list}
          data={stops}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <View style={styles.number}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.label}>{item.label}</Text>
                <Text numberOfLines={1} style={styles.address}>
                  {item.address}
                </Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  disabled={index === 0}
                  hitSlop={6}
                  onPress={() => reorderStop(index, index - 1)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    (pressed || index === 0) && styles.actionDisabled,
                  ]}
                >
                  <ChevronUp
                    color={index === 0 ? colors.border : colors.text}
                    size={18}
                  />
                </Pressable>
                <Pressable
                  disabled={index === stops.length - 1}
                  hitSlop={6}
                  onPress={() => reorderStop(index, index + 1)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    (pressed || index === stops.length - 1) &&
                      styles.actionDisabled,
                  ]}
                >
                  <ChevronDown
                    color={
                      index === stops.length - 1 ? colors.border : colors.text
                    }
                    size={18}
                  />
                </Pressable>
                <Pressable
                  hitSlop={6}
                  onPress={() => removeStop(item.id)}
                  style={styles.actionBtn}
                >
                  <Trash2 color={colors.danger} size={18} />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No stops added yet.</Text>
          }
        />

        {stops.length > 0 && (
          <View style={styles.footer}>
            <Pressable onPress={clearStops} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear all stops</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionBtn: { padding: 6 },
  actionDisabled: { opacity: 0.3 },
  actions: { alignItems: "center", flexDirection: "row", gap: 2 },
  address: { color: colors.muted, fontSize: 13 },
  clearBtn: {
    alignItems: "center",
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: 14,
  },
  clearText: { color: colors.danger, fontSize: 15, fontWeight: "800" },
  container: { backgroundColor: colors.background, flex: 1, paddingTop: 56 },
  empty: { color: colors.muted, fontSize: 15, textAlign: "center" },
  footer: { padding: 20 },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  info: { flex: 1 },
  label: { color: colors.text, fontSize: 15, fontWeight: "800" },
  list: { gap: spacing.md, padding: 20 },
  number: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: 999,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  numberText: { color: colors.primaryDark, fontSize: 12, fontWeight: "900" },
  row: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: 12,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "900" },
});
