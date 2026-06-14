import type { LucideIcon } from "lucide-react-native";
import {
  MapPin,
  Navigation,
  Route,
  Sparkles,
  Store,
  Bookmark,
} from "lucide-react-native";

export interface WalkthroughSlide {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Full-screen walkthrough slides shown once after the rider completes
 * onboarding. Reliable, measurement-free guided tour.
 */
export const PLANNER_WALKTHROUGH_SLIDES: WalkthroughSlide[] = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to RouteLite",
    description:
      "Your personal route optimizer. We help you find the fastest delivery order so you save time and fuel every day.",
  },
  {
    id: "store",
    icon: Store,
    title: "Start from your store",
    description:
      "Your store is the starting point. Every route you plan begins and ends right here.",
  },
  {
    id: "stops",
    icon: MapPin,
    title: "Add your delivery stops",
    description:
      "Search for an address, or long-press anywhere on the map to drop a delivery pin.",
  },
  {
    id: "mode",
    icon: Sparkles,
    title: "Shortest or fastest",
    description:
      "Optimize by shortest distance, or fastest time using live traffic data to plan around congestion.",
  },
  {
    id: "optimize",
    icon: Route,
    title: "Optimize and go",
    description:
      "When your stops are ready, tap Optimize. Our algorithm finds the best order in seconds.",
  },
  {
    id: "save",
    icon: Bookmark,
    title: "Save and revisit",
    description:
      "Keep routes you run often under My Routes, then load and start a delivery run anytime.",
  },
];
