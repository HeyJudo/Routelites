//import type { OptimizeResponse } from "../types/api";
import type { OptimizeResponse } from "../api/routes";

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  SetStore: undefined;
  OnboardingStops: undefined;
  MainTabs: { screen?: string; params?: object } | undefined;
  Loading: undefined;
  Results: { response: OptimizeResponse };
  ActiveDelivery: { runId: string } | undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Planner: undefined;
  MyRoutes: undefined;
  Settings: undefined;
};
