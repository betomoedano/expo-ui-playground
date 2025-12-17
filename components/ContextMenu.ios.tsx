import {
  Button,
  ContextMenu,
  Host,
  Image,
  Submenu,
  Switch,
} from "@expo/ui/swift-ui";
import * as React from "react";
import { View } from "react-native";

const options = [
  {
    systemImage: "info.circle",
    title: "Show List Info",
    type: "button",
  },
  {
    title: "Select Reminders",
    systemImage: "checkmark.circle",
    type: "button",
  },
  {
    title: "Sort By",
    systemImage: "arrow.up.arrow.down",
    type: "submenu",
    items: [
      {
        title: "Manual",
        systemImage: "hand.point.up.left",
        type: "button",
      },
      {
        title: "Due Date",
        systemImage: "calendar",
        type: "button",
      },
      {
        title: "Creation Date",
        systemImage: "plus.circle",
        type: "button",
      },
      {
        title: "Priority",
        systemImage: "exclamationmark.triangle",
        type: "button",
      },
      {
        title: "Title",
        systemImage: "textformat.abc",
        type: "button",
      },
    ],
  },
  {
    title: "Show Completed",
    systemImage: "eye",
    type: "switch",
    value: true,
  },
  {
    title: "Settings",
    systemImage: "gear",
    type: "submenu",
    items: [
      {
        title: "Notifications",
        systemImage: "bell",
        type: "button",
      },
      {
        title: "Advanced",
        systemImage: "wrench.and.screwdriver",
        type: "submenu",
        items: [
          {
            title: "Debug Mode",
            systemImage: "ladybug",
            type: "button",
          },
          {
            title: "Reset Settings",
            systemImage: "arrow.clockwise",
            type: "button",
            destructive: true,
          },
        ],
      },
    ],
  },
  {
    title: "Print",
    systemImage: "printer",
    type: "button",
  },
  {
    title: "Delete List",
    systemImage: "trash",
    type: "button",
    destructive: true,
  },
];

export default function ContextMenuProfile() {
  const [switchStates, setSwitchStates] = React.useState<
    Record<string, boolean>
  >({
    "Show Completed": true,
  });

  const renderOption = (
    option: any,
    index: number
  ): React.ReactElement | null => {
    switch (option.type) {
      case "button":
        return (
          <Button
            key={index}
            systemImage={option.systemImage}
            label={option.title}
            role={option.destructive ? "destructive" : undefined}
            onPress={() => console.log(`Pressed: ${option.title}`)}
          />
        );

      case "switch":
        return (
          <Switch
            key={index}
            value={switchStates[option.title] || false}
            label={option.title}
            variant="checkbox"
            onValueChange={(value) =>
              setSwitchStates((prev) => ({ ...prev, [option.title]: value }))
            }
          />
        );
      case "submenu":
        return (
          <Submenu
            key={index}
            button={
              <Button systemImage={option.systemImage} label={option.title} />
            }
          >
            {option.items?.map((subItem: any, subIndex: number) =>
              renderOption(subItem, subIndex)
            )}
          </Submenu>
        );
      default:
        return null;
    }
  };

  return (
    <Host style={{ width: 150, height: 50 }}>
      <ContextMenu>
        <ContextMenu.Items>
          {options.map((option, index) => renderOption(option, index))}
        </ContextMenu.Items>
        <ContextMenu.Trigger>
          <View>
            <Host style={{ width: 35, height: 35 }}>
              <Image systemName="ellipsis" />
            </Host>
          </View>
        </ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
}
