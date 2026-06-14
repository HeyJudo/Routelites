import { GripVertical, Trash2 } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { colors, font, motion, radius, shadow, spacing, type } from "../theme";
import type { Stop } from "../types/route";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROW_HEIGHT = 72;
const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.8 };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DraggableStopListProps = {
  stops: Stop[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
};

// ---------------------------------------------------------------------------
// Single draggable row
// ---------------------------------------------------------------------------

type DraggableRowProps = {
  stop: Stop;
  index: number;
  totalCount: number;
  activeIndex: SharedValue<number>;
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
};

function DraggableRow({
  stop,
  index,
  totalCount,
  activeIndex,
  onReorder,
  onRemove,
}: DraggableRowProps) {
  const isActive = useSharedValue(false);
  const translateY = useSharedValue(0);
  const startY = useSharedValue(0);
  const currentIndex = useSharedValue(index);

  // Update currentIndex when the index prop changes (after reorders)
  currentIndex.value = index;

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      isActive.value = true;
      activeIndex.value = index;
      startY.value = 0;
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;

      // Calculate the target index based on drag offset
      const rawNewIndex = Math.round(
        index + e.translationY / ROW_HEIGHT,
      );
      const clampedIndex = Math.max(0, Math.min(totalCount - 1, rawNewIndex));

      if (clampedIndex !== currentIndex.value) {
        currentIndex.value = clampedIndex;
      }
    })
    .onEnd(() => {
      const finalIndex = currentIndex.value;

      if (finalIndex !== index) {
        runOnJS(onReorder)(index, finalIndex);
      }

      translateY.value = withSpring(0, SPRING_CONFIG);
      isActive.value = false;
      activeIndex.value = -1;
    })
    .onFinalize(() => {
      translateY.value = withSpring(0, SPRING_CONFIG);
      isActive.value = false;
      activeIndex.value = -1;
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isBeingDragged = isActive.value;

    return {
      transform: [
        { translateY: isBeingDragged ? translateY.value : 0 },
        { scale: withSpring(isBeingDragged ? 1.03 : 1, SPRING_CONFIG) },
      ],
      zIndex: isBeingDragged ? 100 : 1,
      shadowOpacity: withTiming(isBeingDragged ? 0.15 : 0, { duration: 150 }),
      elevation: isBeingDragged ? 8 : 0,
    };
  });

  return (
    <Animated.View style={[styles.rowOuter, animatedStyle]}>
      <View style={styles.row}>
        {/* Drag handle */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.dragHandle}>
            <GripVertical color={colors.muted} size={18} />
          </View>
        </GestureDetector>

        {/* Index badge */}
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>

        {/* Stop info */}
        <View style={styles.stopInfo}>
          <Text style={styles.stopLabel} numberOfLines={1}>
            {stop.label}
          </Text>
          {stop.address ? (
            <Text style={styles.stopAddress} numberOfLines={1}>
              {stop.address}
            </Text>
          ) : null}
        </View>

        {/* Remove button */}
        <Pressable
          accessibilityLabel={`Remove ${stop.label}`}
          hitSlop={8}
          onPress={() => onRemove(stop.id)}
          style={styles.removeBtn}
        >
          <Trash2 color={colors.danger} size={16} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DraggableStopList({
  stops,
  onReorder,
  onRemove,
}: DraggableStopListProps) {
  const activeIndex = useSharedValue(-1);

  if (stops.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No stops added yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hintRow}>
        <GripVertical color={colors.muted} size={14} />
        <Text style={styles.hintText}>
          Hold and drag to reorder stops
        </Text>
      </View>
      {stops.map((stop, index) => (
        <DraggableRow
          key={stop.id}
          stop={stop}
          index={index}
          totalCount={stops.length}
          activeIndex={activeIndex}
          onReorder={onReorder}
          onRemove={onRemove}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  dragHandle: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 32,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...type.body,
    color: colors.muted,
  },
  hintRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    paddingBottom: spacing.sm,
  },
  hintText: {
    ...type.caption,
    color: colors.muted,
  },
  indexBadge: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: 999,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  indexText: {
    ...type.caption,
    color: colors.primaryDark,
    fontFamily: font.heavy,
  },
  removeBtn: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: ROW_HEIGHT,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  rowOuter: {
    shadowColor: "#17211f",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  stopAddress: {
    ...type.caption,
    color: colors.muted,
    marginTop: 1,
  },
  stopInfo: {
    flex: 1,
  },
  stopLabel: {
    ...type.label,
    color: colors.text,
  },
});
