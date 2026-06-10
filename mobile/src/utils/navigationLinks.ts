import { Linking, Platform } from "react-native";

export async function openNavigation(
  lat: number,
  lng: number,
  label?: string,
): Promise<void> {
  try {
    const encodedLabel = label ? encodeURIComponent(label) : "";

    // Try Google Maps native app first on Android
    if (Platform.OS === "android") {
      const googleNative = `google.navigation:q=${lat},${lng}`;
      const canOpen = await Linking.canOpenURL(googleNative).catch(() => false);
      if (canOpen) {
        await Linking.openURL(googleNative);
        return;
      }
    }

    // Universal Google Maps web URL (works on iOS + Android fallback)
    const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving${encodedLabel ? `&destination_place_id=${encodedLabel}` : ""}`;
    const canOpenGoogle = await Linking.canOpenURL(googleWeb).catch(() => false);
    if (canOpenGoogle) {
      await Linking.openURL(googleWeb);
      return;
    }

    // Waze fallback
    const waze = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    await Linking.openURL(waze);
  } catch (err) {
    console.warn("[navigationLinks] openNavigation failed:", err);
  }
}
