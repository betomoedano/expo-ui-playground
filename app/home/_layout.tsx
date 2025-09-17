import ContextMenuProfile from "@/components/ContextMenu.ios";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function HomeLayout() {
  const rawTheme = useColorScheme();
  const theme = rawTheme === "dark" ? "dark" : "light";
  const isGlassAvailable = isLiquidGlassAvailable();
  const blurEffect =
    theme === "dark" ? "systemMaterialDark" : "systemMaterialLight";

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerLargeTitle: true,
          headerTransparent: true,
          headerTintColor: theme === "dark" ? "white" : "black",
          headerLargeStyle: { backgroundColor: "transparent" },
          headerBlurEffect: isGlassAvailable ? undefined : blurEffect,
          title: "Home",
          headerLeft: () => <ContextMenuProfile />,
        }}
      />
      <Stack.Screen
        name="sheet"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.25, 0.5],
          sheetGrabberVisible: true,
          contentStyle: {
            backgroundColor: isLiquidGlassAvailable() ? "transparent" : "white",
          },
          headerShown: false,
        }}
      />
    </Stack>
  );
}
