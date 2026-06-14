import BottomSheet, {
  BottomSheetProps,
  BottomSheetScrollView,
  BottomSheetFlatList,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { forwardRef } from "react";

import { colors, motion, radius, shadow } from "../theme";

// Re-export for convenience so screens import from one place
export { BottomSheetScrollView, BottomSheetFlatList };

type AppBottomSheetProps = Omit<BottomSheetProps, "snapPoints"> & {
  children: React.ReactNode;
  snapPoints: string[];
  index?: number;
  onChange?: (index: number) => void;
};

export const AppBottomSheet = forwardRef<BottomSheet, AppBottomSheetProps>(
  function AppBottomSheet(
    { children, snapPoints, index = 0, onChange, ...rest },
    ref,
  ) {
    const animationConfigs = useBottomSheetSpringConfigs(motion.spring);

    return (
      <BottomSheet
        ref={ref}
        snapPoints={snapPoints}
        index={index}
        onChange={onChange}
        animationConfigs={animationConfigs}
        enablePanDownToClose={false}
        backgroundStyle={{
          backgroundColor: colors.background,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.border,
          width: 40,
          height: 4,
        }}
        style={shadow.lg}
        {...rest}
      >
        {children}
      </BottomSheet>
    );
  },
);
