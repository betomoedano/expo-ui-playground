import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function HomeLayout() {
  const rawTheme = useColorScheme();
  const theme = rawTheme === "dark" ? "dark" : "light";
  const isGlassAvailable = isLiquidGlassAvailable();
  const blurEffect =
    theme === "dark" ? "systemMaterialDark" : "systemMaterialLight";

  const handleShowListInfo = () => {
    console.log("Show List Info pressed");
  };

  const handleSelectReminders = () => {
    console.log("Select Reminders pressed");
  };

  const handlePrint = () => {
    console.log("Print pressed");
  };

  const handleDeleteList = () => {
    console.log("Delete List pressed");
  };

  const handleNotifications = () => {
    console.log("Notifications pressed");
  };

  const handleDebugMode = () => {
    console.log("Debug Mode pressed");
  };

  const handleResetSettings = () => {
    console.log("Reset Settings pressed");
  };

  const handleAddItem = () => {
    console.log("Add Item pressed");
  };

  const handleSearch = () => {
    console.log("Search pressed");
  };

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
          unstable_headerLeftItems: (props) => [
            {
              type: "button",
              label: "Add",
              icon: {
                name: "plus",
                type: "sfSymbol",
              },
              variant: "done",
              onPress: handleAddItem,
              accessibilityLabel: "Add new item",
            },
            {
              type: "custom",
              element: (
                <GlassView
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: 22.5,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  isInteractive={true}
                >
                  <Image
                    source={{ uri: "https://github.com/betomoedano.png" }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                    }}
                  />
                </GlassView>
              ),
              hidesSharedBackground: true,
            },
            {
              type: "button",
              label: "Search",
              icon: {
                name: "magnifyingglass",
                type: "sfSymbol",
              },
              variant: "plain",
              onPress: handleSearch,
              accessibilityLabel: "Search items",
            },
          ],
          unstable_headerRightItems: (props) => [
            {
              type: "menu",
              variant: "prominent",
              // icon: {
              //   name: "ellipsis",
              //   type: "sfSymbol",
              // },
              label: "Options",
              menu: {
                title: "Home Options",
                items: [
                  {
                    type: "action",
                    label: "Show List Info",
                    onPress: handleShowListInfo,
                    icon: {
                      name: "info.circle",
                      type: "sfSymbol",
                    },
                  },
                  {
                    type: "action",
                    label: "Select Reminders",
                    onPress: handleSelectReminders,
                    icon: {
                      name: "checkmark.circle",
                      type: "sfSymbol",
                    },
                  },
                  {
                    type: "submenu",
                    label: "Sort By",
                    icon: {
                      name: "arrow.up.arrow.down",
                      type: "sfSymbol",
                    },
                    items: [
                      {
                        type: "action",
                        label: "Manual",
                        onPress: () => console.log("Manual sort pressed"),
                        icon: {
                          name: "hand.point.up.left",
                          type: "sfSymbol",
                        },
                      },
                      {
                        type: "action",
                        label: "Due Date",
                        onPress: () => console.log("Due Date sort pressed"),
                        icon: {
                          name: "calendar",
                          type: "sfSymbol",
                        },
                      },
                      {
                        type: "action",
                        label: "Creation Date",
                        onPress: () =>
                          console.log("Creation Date sort pressed"),
                        icon: {
                          name: "plus.circle",
                          type: "sfSymbol",
                        },
                      },
                      {
                        type: "action",
                        label: "Priority",
                        onPress: () => console.log("Priority sort pressed"),
                        icon: {
                          name: "exclamationmark.triangle",
                          type: "sfSymbol",
                        },
                      },
                      {
                        type: "action",
                        label: "Title",
                        onPress: () => console.log("Title sort pressed"),
                        icon: {
                          name: "textformat.abc",
                          type: "sfSymbol",
                        },
                      },
                    ],
                  },
                  {
                    type: "submenu",
                    label: "Settings",
                    icon: {
                      name: "gear",
                      type: "sfSymbol",
                    },
                    items: [
                      {
                        type: "action",
                        label: "Notifications",
                        onPress: handleNotifications,
                        icon: {
                          name: "bell",
                          type: "sfSymbol",
                        },
                      },
                      {
                        type: "submenu",
                        label: "Advanced",
                        icon: {
                          name: "wrench.and.screwdriver",
                          type: "sfSymbol",
                        },
                        items: [
                          {
                            type: "action",
                            label: "Debug Mode",
                            onPress: handleDebugMode,
                            icon: {
                              name: "ladybug",
                              type: "sfSymbol",
                            },
                          },
                          {
                            type: "action",
                            label: "Reset Settings",
                            onPress: handleResetSettings,
                            icon: {
                              name: "arrow.clockwise",
                              type: "sfSymbol",
                            },
                            destructive: true,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: "action",
                    label: "Print",
                    onPress: handlePrint,
                    icon: {
                      name: "printer",
                      type: "sfSymbol",
                    },
                  },
                  {
                    type: "action",
                    label: "Delete List",
                    onPress: handleDeleteList,
                    icon: {
                      name: "trash",
                      type: "sfSymbol",
                    },
                    destructive: true,
                  },
                ],
              },
            },
          ],
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
