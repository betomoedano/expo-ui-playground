import {
  Button,
  ContextMenu,
  Host,
  HStack,
  Section,
  Submenu,
  Switch,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import { foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import React, { use } from "react";
import { AppContext } from "./AppContext";
import { AppState } from "./types";

export function ContextMenuSection() {
  const { contextMenuStates, updateContextMenuState, tasks, toggleTask } = use(
    AppContext
  ) as AppState;

  const menuOptions = [
    {
      systemImage: "info.circle",
      title: "Task Overview",
      type: "button",
    },
    {
      title: "Filter Tasks",
      systemImage: "line.3.horizontal.decrease.circle",
      type: "submenu",
      items: [
        {
          title: "Show All",
          systemImage: "list.bullet",
          type: "button",
        },
        {
          title: "High Priority Only",
          systemImage: "exclamationmark.triangle.fill",
          type: "button",
        },
        {
          title: "Due Today",
          systemImage: "calendar.badge.clock",
          type: "button",
        },
        {
          title: "Overdue",
          systemImage: "calendar.badge.exclamationmark",
          type: "button",
        },
      ],
    },
    {
      title: "Show Completed Tasks",
      systemImage: "checkmark.circle",
      type: "switch",
      value: contextMenuStates["Show Completed Tasks"],
    },
    {
      title: "View Options",
      systemImage: "eye",
      type: "submenu",
      items: [
        {
          title: "Auto Refresh",
          systemImage: "arrow.clockwise",
          type: "switch",
          value: contextMenuStates["Auto Refresh"],
        },
        {
          title: "Notifications",
          systemImage: "bell",
          type: "switch",
          value: contextMenuStates["Notifications"],
        },
        {
          title: "Advanced Settings",
          systemImage: "gear",
          type: "submenu",
          items: [
            {
              title: "Dark Mode",
              systemImage: "moon.fill",
              type: "switch",
              value: contextMenuStates["Dark Mode"],
            },
            {
              title: "Reset All Settings",
              systemImage: "arrow.clockwise.circle",
              type: "button",
              destructive: true,
            },
            {
              title: "Export Data",
              systemImage: "square.and.arrow.up",
              type: "button",
            },
          ],
        },
      ],
    },
    {
      title: "Quick Actions",
      systemImage: "bolt",
      type: "submenu",
      items: [
        {
          title: "Mark All Complete",
          systemImage: "checkmark.circle.fill",
          type: "button",
        },
        {
          title: "Clear Completed",
          systemImage: "trash",
          type: "button",
          destructive: true,
        },
      ],
    },
    {
      title: "Help & Support",
      systemImage: "questionmark.circle",
      type: "button",
    },
  ];

  const renderMenuOption = (
    option: any,
    index: number
  ): React.ReactElement | null => {
    switch (option.type) {
      case "button":
        return (
          <Button
            key={index}
            systemImage={option.systemImage}
            role={option.destructive ? "destructive" : undefined}
            onPress={() => {
              console.log(`Context menu action: ${option.title}`);
              // Handle specific actions
              if (option.title === "Mark All Complete") {
                tasks
                  .filter((t) => !t.completed)
                  .forEach((task) => toggleTask(task.id));
              }
            }}
          >
            {option.title}
          </Button>
        );

      case "switch":
        return (
          <Switch
            key={index}
            value={option.value}
            label={option.title}
            variant="checkbox"
            onValueChange={(value) => {
              updateContextMenuState(option.title, value);
            }}
          />
        );

      case "submenu":
        return (
          <Submenu
            key={index}
            button={
              <Button systemImage={option.systemImage}>{option.title}</Button>
            }
          >
            {option.items?.map((subItem: any, subIndex: number) =>
              renderMenuOption(subItem, subIndex)
            )}
          </Submenu>
        );

      default:
        return null;
    }
  };

  return (
    <Section title="🔗 Context Menu & Actions">
      <VStack spacing={16}>
        <Text size={16}>Interactive Context Menu</Text>

        <VStack spacing={12}>
          <Text size={14}>Menu Demo</Text>
          <Text size={12} modifiers={[foregroundStyle("gray")]}>
            Long press the menu button below to see nested context menu options
          </Text>

          <HStack spacing={16} alignment="center">
            <Host style={{ width: 120, height: 50 }}>
              <ContextMenu>
                <ContextMenu.Items>
                  {menuOptions.map((option, index) =>
                    renderMenuOption(option, index)
                  )}
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                  <Button systemImage="ellipsis.circle.fill">
                    Menu Options
                  </Button>
                </ContextMenu.Trigger>
              </ContextMenu>
            </Host>

            <VStack spacing={4} alignment="leading">
              <Text size={12} modifiers={[foregroundStyle("gray")]}>
                Context Menu Features:
              </Text>
              <Text size={10} modifiers={[foregroundStyle("gray")]}>
                • Nested submenus
              </Text>
              <Text size={10} modifiers={[foregroundStyle("gray")]}>
                • Toggle switches
              </Text>
              <Text size={10} modifiers={[foregroundStyle("gray")]}>
                • Destructive actions
              </Text>
              <Text size={10} modifiers={[foregroundStyle("gray")]}>
                • System icons
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </VStack>
    </Section>
  );
}
