import { Store } from "lucide-react-native";
import { forwardRef, memo, useImperativeHandle, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, {
  Marker,
  type LongPressEvent,
  type Region,
} from "react-native-maps";

import { metroManilaRegion } from "../data/demoRoute";
import { mapStyle } from "../data/mapStyle";
import { colors, font, shadow, type } from "../theme";
import type { Stop, StoreLocation } from "../types/route";

export type RouteMapHandle = {
  /** Animate the map camera to a specific coordinate with a close zoom */
  focusLocation: (lat: number, lng: number) => void;
};

type RouteMapProps = {
  initialRegion?: Region;
  onLongPress?: (coordinate: { latitude: number; longitude: number }) => void;
  stops?: Stop[];
  store: StoreLocation;
};

const RouteMapComponent = forwardRef<RouteMapHandle, RouteMapProps>(
  function RouteMapComponent(
    { initialRegion = metroManilaRegion, onLongPress, stops = [], store },
    ref,
  ) {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      focusLocation(lat: number, lng: number) {
        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          400,
        );
      },
    }));

    const handleLongPress = (event: LongPressEvent) => {
      onLongPress?.(event.nativeEvent.coordinate);
    };

    return (
      <MapView
        ref={mapRef}
        customMapStyle={mapStyle}
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
            <Store color={colors.textOnPrimary} size={16} />
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
  },
);

export const RouteMap = memo(RouteMapComponent);

const styles = StyleSheet.create({
  stopMarker: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.card,
    borderRadius: 16,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    ...shadow.sm,
    width: 28,
  },
  stopMarkerText: {
    ...type.caption,
    color: colors.textOnPrimary,
    fontFamily: font.heavy,
  },
  storeMarker: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.card,
    borderRadius: 22,
    borderWidth: 3,
    height: 40,
    justifyContent: "center",
    ...shadow.md,
    width: 40,
  },
});
