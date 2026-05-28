import { StyleSheet, View } from "react-native";

import { colors } from "../theme";

type OnboardingIllustrationProps = {
  /** Which illustration to show */
  variant: "welcome" | "store" | "stops";
};

/**
 * Simple line-art style illustrations for onboarding screens.
 * Uses basic shapes to create a clean, professional look.
 */
export function OnboardingIllustration({ variant }: OnboardingIllustrationProps) {
  if (variant === "welcome") {
    return (
      <View style={styles.container}>
        {/* Road/path background */}
        <View style={styles.roadBg} />
        
        {/* Delivery truck body */}
        <View style={styles.truckBody}>
          <View style={styles.truckCab} />
          <View style={styles.truckCargo}>
            <View style={styles.cargoLine1} />
            <View style={styles.cargoLine2} />
          </View>
        </View>
        
        {/* Wheels */}
        <View style={[styles.wheel, styles.wheelFront]} />
        <View style={[styles.wheel, styles.wheelBack]} />
        
        {/* Route dots */}
        <View style={[styles.routeDot, styles.dot1]} />
        <View style={[styles.routeDot, styles.dot2]} />
        <View style={[styles.routeDot, styles.dot3]} />
        
        {/* Dashed route line */}
        <View style={styles.routeLine}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={styles.routeDash} />
          ))}
        </View>
      </View>
    );
  }

  if (variant === "store") {
    return (
      <View style={styles.container}>
        {/* Store building */}
        <View style={styles.storeBuilding}>
          <View style={styles.storeRoof} />
          <View style={styles.storeBody}>
            <View style={styles.storeDoor} />
            <View style={styles.storeWindow} />
            <View style={styles.storeWindow} />
          </View>
        </View>
        
        {/* Location pin */}
        <View style={styles.locationPin}>
          <View style={styles.pinHead} />
          <View style={styles.pinPoint} />
        </View>
        
        {/* Ground line */}
        <View style={styles.groundLine} />
      </View>
    );
  }

  // variant === "stops"
  return (
    <View style={styles.container}>
      {/* Map background */}
      <View style={styles.mapBg}>
        <View style={styles.mapRoad1} />
        <View style={styles.mapRoad2} />
      </View>
      
      {/* Stop markers */}
      <View style={[styles.stopMarker, styles.marker1]}>
        <View style={styles.markerInner} />
      </View>
      <View style={[styles.stopMarker, styles.marker2]}>
        <View style={styles.markerInner} />
      </View>
      <View style={[styles.stopMarker, styles.marker3]}>
        <View style={styles.markerInner} />
      </View>
      
      {/* Connecting lines */}
      <View style={styles.connectLine1} />
      <View style={styles.connectLine2} />
      
      {/* Hand/finger tap indicator */}
      <View style={styles.tapHand}>
        <View style={styles.tapCircle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    alignItems: "center",
    backgroundColor: "#f0f7f5",
    borderRadius: 20,
    height: 220,
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },

  // Welcome variant - Truck
  roadBg: {
    backgroundColor: "#e0ebe8",
    bottom: 40,
    height: 60,
    left: 0,
    position: "absolute",
    right: 0,
  },
  truckBody: {
    flexDirection: "row",
    position: "absolute",
    top: 80,
  },
  truckCab: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 50,
    width: 45,
  },
  truckCargo: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderRadius: 6,
    borderWidth: 2,
    height: 60,
    justifyContent: "center",
    marginLeft: -4,
    marginTop: -10,
    paddingHorizontal: 8,
    width: 80,
  },
  cargoLine1: {
    backgroundColor: colors.border,
    borderRadius: 2,
    height: 4,
    marginBottom: 6,
    width: "100%",
  },
  cargoLine2: {
    backgroundColor: colors.border,
    borderRadius: 2,
    height: 4,
    width: "70%",
  },
  wheel: {
    backgroundColor: colors.text,
    borderRadius: 10,
    height: 20,
    position: "absolute",
    top: 130,
    width: 20,
  },
  wheelFront: {
    left: 95,
  },
  wheelBack: {
    left: 155,
  },
  routeDot: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    height: 12,
    position: "absolute",
    width: 12,
  },
  dot1: {
    right: 30,
    top: 50,
  },
  dot2: {
    right: 60,
    top: 90,
  },
  dot3: {
    right: 40,
    top: 130,
  },
  routeLine: {
    flexDirection: "column",
    gap: 6,
    position: "absolute",
    right: 50,
    top: 60,
  },
  routeDash: {
    backgroundColor: colors.primary,
    borderRadius: 2,
    height: 6,
    opacity: 0.4,
    width: 3,
  },

  // Store variant
  storeBuilding: {
    alignItems: "center",
    position: "absolute",
    top: 50,
  },
  storeRoof: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 30,
    borderLeftColor: "transparent",
    borderLeftWidth: 15,
    borderRightColor: "transparent",
    borderRightWidth: 15,
    height: 0,
    width: 0,
  },
  storeBody: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderWidth: 2,
    flexDirection: "row",
    gap: 8,
    height: 70,
    justifyContent: "center",
    marginTop: -2,
    paddingHorizontal: 12,
    width: 120,
  },
  storeDoor: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 4,
    borderWidth: 2,
    height: 40,
    width: 24,
  },
  storeWindow: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 4,
    borderWidth: 2,
    height: 20,
    width: 20,
  },
  locationPin: {
    alignItems: "center",
    position: "absolute",
    right: 50,
    top: 40,
  },
  pinHead: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 28,
    width: 28,
  },
  pinPoint: {
    borderLeftColor: "transparent",
    borderLeftWidth: 8,
    borderRightColor: "transparent",
    borderRightWidth: 8,
    borderTopColor: colors.primary,
    borderTopWidth: 14,
    height: 0,
    marginTop: -4,
    width: 0,
  },
  groundLine: {
    backgroundColor: colors.border,
    bottom: 50,
    height: 3,
    left: 40,
    position: "absolute",
    right: 40,
  },

  // Stops variant
  mapBg: {
    backgroundColor: "#e8f0ed",
    borderRadius: 12,
    height: 180,
    overflow: "hidden",
    position: "absolute",
    width: 280,
  },
  mapRoad1: {
    backgroundColor: colors.card,
    height: 8,
    left: 0,
    position: "absolute",
    right: 0,
    top: 60,
    transform: [{ rotate: "-15deg" }],
  },
  mapRoad2: {
    backgroundColor: colors.card,
    height: 8,
    left: 0,
    position: "absolute",
    right: 0,
    top: 120,
    transform: [{ rotate: "10deg" }],
  },
  stopMarker: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 3,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    width: 28,
  },
  markerInner: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  marker1: {
    left: 60,
    top: 60,
  },
  marker2: {
    left: 140,
    top: 100,
  },
  marker3: {
    left: 200,
    top: 70,
  },
  connectLine1: {
    backgroundColor: colors.primary,
    height: 3,
    left: 85,
    position: "absolute",
    top: 85,
    transform: [{ rotate: "30deg" }],
    width: 60,
  },
  connectLine2: {
    backgroundColor: colors.primary,
    height: 3,
    left: 160,
    position: "absolute",
    top: 95,
    transform: [{ rotate: "-25deg" }],
    width: 50,
  },
  tapHand: {
    alignItems: "center",
    bottom: 30,
    justifyContent: "center",
    position: "absolute",
    right: 40,
  },
  tapCircle: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 2,
    height: 40,
    width: 40,
  },
});
