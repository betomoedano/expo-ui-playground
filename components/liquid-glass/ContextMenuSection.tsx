import {
  Button,
  ContextMenu,
  Host,
  HStack,
  Section,
  Toggle,
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

  const menuOptions: any[] = [
    {
      systemImage: "info.circle",
      title: "Task Overview",
      type: "button",
    },
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
    {
      title: "Show Completed Tasks",
      systemImage: "checkmark.circle",
      type: "switch",
      value: contextMenuStates["Show Completed Tasks"],
    },
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
      title: "Dark Mode",
      systemImage: "moon.fill",
      type: "switch",
      value: contextMenuStates["Dark Mode"],
    },
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
            label={option.title}
            role={option.destructive ? "destructive" : undefined}
            onPress={() => {
              console.log(`Context menu action: ${option.title}`);
              if (option.title === "Mark All Complete") {
                tasks
                  .filter((t) => !t.completed)
                  .forEach((task) => toggleTask(task.id));
              }
            }}
          />
        );

      case "switch":
        return (
          <Toggle
            key={index}
            isOn={option.value}
            label={option.title}
            onIsOnChange={(value) => {
              updateContextMenuState(option.title, value);
            }}
          />
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
                  <Button
                    systemImage="ellipsis.circle.fill"
                    label="Menu Options"
                  />
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
