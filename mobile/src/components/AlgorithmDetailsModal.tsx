import { X } from "lucide-react-native";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, font, radius, spacing, type } from "../theme";
import type { OptimizeMetadata } from "../types/api";

type Props = {
  metadata: OptimizeMetadata;
  visible: boolean;
  onClose: () => void;
};

export function AlgorithmDetailsModal({ metadata, visible, onClose }: Props) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Algorithm details</Text>
            <Pressable onPress={onClose} accessibilityLabel="Close">
              <X color={colors.text} size={22} />
            </Pressable>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {metadata.mode === "exact" ? "EXACT MODE" : "CLUSTERED MODE"}
            </Text>
          </View>

          <Row label="Stops processed" value={String(metadata.stops_processed)} />
          <Row label="Dijkstra runs" value={String(metadata.dijkstra_runs)} />
          <Row label="Distance matrix" value={metadata.distance_matrix_size} />
          <Row label="Branches explored" value={String(metadata.branches_explored)} />
          <Row label="Branches pruned" value={String(metadata.branches_pruned)} />
          <Row label="Batches used" value={String(metadata.batches_used)} />
          <Row label="Computation time" value={`${metadata.computation_time_ms} ms`} />
          <Row
            label="Exact global optimum"
            value={metadata.exact_global_optimum ? "Yes" : "No"}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {metadata.exact_global_optimum
                ? "Full-set Branch and Bound guarantees the exact optimal tour for this stop set."
                : "Clustered B&B provides an optimized but not globally exact tour."}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    ...type.mono,
    color: colors.primaryDark,
    fontFamily: font.heavy,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginHorizontal: 20,
    padding: 24,
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 12,
  },
  footerText: { ...type.caption, color: colors.muted },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  overlay: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "center",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },
  rowLabel: { ...type.body, color: colors.muted },
  rowValue: { ...type.label, color: colors.text },
  title: { ...type.heading, color: colors.text },
});
