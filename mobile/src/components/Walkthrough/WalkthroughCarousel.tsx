import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { colors, font, radius, shadow, spacing, type } from "../../theme";
import type { WalkthroughSlide } from "./walkthroughSteps";

const { width: SCREEN_W } = Dimensions.get("window");

type WalkthroughCarouselProps = {
  slides: WalkthroughSlide[];
  onComplete: () => void;
  riderName?: string | null;
};

export function WalkthroughCarousel({
  slides,
  onComplete,
  riderName,
}: WalkthroughCarouselProps) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLast = index === slides.length - 1;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      if (next !== index) setIndex(next);
    },
    [index],
  );

  const goTo = useCallback((i: number) => {
    scrollRef.current?.scrollTo({ x: i * SCREEN_W, animated: true });
    setIndex(i);
  }, []);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      goTo(index + 1);
    }
  }, [isLast, index, goTo, onComplete]);

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      {/* Skip — top right */}
      <View style={styles.topBar}>
        <Pressable onPress={onComplete} hitSlop={10} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {slides.map((slide, i) => (
          <Slide
            key={slide.id}
            slide={slide}
            greeting={i === 0 ? riderName : null}
          />
        ))}
      </ScrollView>

      {/* Footer: dots + button */}
      <View style={styles.footer}>
        <View style={styles.dotRow}>
          {slides.map((_, i) => (
            <Dot key={i} active={i === index} />
          ))}
        </View>

        <Pressable onPress={handleNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {isLast ? "Get started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ── Slide ──────────────────────────────────────────────────────────────────

function Slide({
  slide,
  greeting,
}: {
  slide: WalkthroughSlide;
  greeting?: string | null;
}) {
  const Icon = slide.icon;
  return (
    <View style={styles.slide}>
      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <Icon color={colors.textOnPrimary} size={40} strokeWidth={2.2} />
        </View>
      </View>

      {greeting ? (
        <Text style={styles.greeting}>Hey, {greeting}</Text>
      ) : null}
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.description}>{slide.description}</Text>
    </View>
  );
}

// ── Animated dot ─────────────────────────────────────────────────────────────

function Dot({ active }: { active: boolean }) {
  const w = useSharedValue(active ? 22 : 7);

  // Update width when active changes
  w.value = withSpring(active ? 22 : 7, { damping: 18, stiffness: 200 });

  const style = useAnimatedStyle(() => ({
    width: w.value,
    backgroundColor: active ? colors.primary : colors.border,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  description: {
    ...type.body,
    color: colors.muted,
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
    textAlign: "center",
  },
  dot: {
    borderRadius: 4,
    height: 7,
  },
  dotRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 48,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  greeting: {
    ...type.label,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 96,
    justifyContent: "center",
    width: 96,
    ...shadow.md,
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  nextBtn: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    minWidth: 120,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
  },
  nextText: {
    ...type.label,
    color: colors.textOnPrimary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 9999,
  },
  scroll: {
    flex: 1,
  },
  skipBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...type.label,
    color: colors.muted,
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    width: SCREEN_W,
  },
  title: {
    ...type.display,
    color: colors.text,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    textAlign: "center",
  },
  topBar: {
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
  },
});
