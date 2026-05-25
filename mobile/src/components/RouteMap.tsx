import { Store } from "lucide-react-native";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, {
  Marker,
  type LongPressEvent,
  type Region,
} from "react-native-maps";

import { metroManilaRegion } from "../data/demoRoute";
import { colors } from "../theme";
import type { Stop, StoreLocation } from "../types/route";

type RouteMapProps = {
  initialRegion?: Region;
  onLongPress?: (coordinate: { latitude: number; longitude: number }) => void;
  stops?: Stop[];
  store: StoreLocation;
};

function RouteMapComponent({
  initialRegion = metroManilaRegion,
  onLongPress,
  stops = [],
  store,
}: RouteMapProps) {
  const handleLongPress = (event: LongPressEvent) => {
    onLongPress?.(event.nativeEvent.coordinate);
  };

  return (
    <MapView
      initialRegion={initialRegion}
      onLongPress={handleLongPress}
      showsCompass={false}
      showsMyLocationButton={false}
      style={StyleSheet.absoluteFill}
    >
      <Marker
        coordinate={{
          latitude: store.lat,
          longitude: store.lng,
        }}
        description={store.address}
        title={store.label}
      >
        <View style={styles.storeMarker}>
          <Store color={colors.card} size={18} />
        </View>
      </Marker>
      {stops.map((stop, index) => (
        <Marker
          coordinate={{
            latitude: stop.lat,
            longitude: stop.lng,
          }}
          description={stop.address}
          key={stop.id}
          title={stop.label}
        >
          <View style={styles.stopMarker}>
            <Text style={styles.stopMarkerText}>{index + 1}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

export const RouteMap = memo(RouteMapComponent);

const styles = StyleSheet.create({
  stopMarker: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderRadius: 16,
    borderWidth: 3,
    height: 32,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    width: 32,
  },
  stopMarkerText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900",
  },
  storeMarker: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.card,
    borderRadius: 26,
    borderWidth: 3,
    height: 52,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    width: 52,
  },
});
