import { X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useRouteDraftStore } from "../state/routeDraftStore";
import { colors, radius, spacing, type } from "../theme";
import { DraggableStopList } from "./DraggableStopList";

type Props = { visible: boolean; onClose: () => void };

/**
 * Full-screen modal showing the current route stops with drag-to-reorder
 * and remove functionality. Uses DraggableStopList for gesture-based
 * reordering with haptic-like visual feedback.
 */
export function StopListModal({ visible, onClose }: Props) {
  const stops = useRouteDraftStore((s) => s.stops);
  const removeStop = useRouteDraftStore((s) => s.removeStop);
  const reorderStop = useRouteDraftStore((s) => s.reorderStop);
  const clearStops = useRouteDraftStore((s) => s.clearStops);

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Stops</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{stops.length}</Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={12}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <X color={colors.text} size={22} />
            </Pressable>
          </View>

          {/* Draggable stop list */}
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            <DraggableStopList
              stops={stops}
              onReorder={reorderStop}
              onRemove={removeStop}
            />
          </ScrollView>

          {/* Footer */}
          {stops.length > 0 && (
            <View style={styles.footer}>
              <Pressable onPress={clearStops} style={styles.clearBtn}>
                <Text style={styles.clearText}>Clear all stops</Text>
              </Pressable>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  clearBtn: {
    alignItems: "center",
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: 14,
  },
  clearText: { ...type.label, color: colors.danger },
  closeBtn: {
    alignItems: "center",
    backgroundColor: colors.mutedSoft,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  container: { backgroundColor: colors.background, flex: 1, paddingTop: 56 },
  countBadge: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 26,
    justifyContent: "center",
    minWidth: 26,
    paddingHorizontal: 6,
  },
  countText: {
    ...type.caption,
    color: colors.primaryDark,
  },
  footer: { padding: 20 },
  gestureRoot: { flex: 1 },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  list: { padding: 20 },
  title: { ...type.title, color: colors.text },
});
