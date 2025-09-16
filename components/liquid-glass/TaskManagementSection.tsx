import {
  ContentUnavailableView,
  HStack,
  Picker,
  Section,
  Switch,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import { foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import React, { use } from "react";
import { AppContext } from "./AppContext";
import { AppState } from "./types";

export function TaskManagementSection() {
  const { tasks, toggleTask, taskFilter, setTaskFilter } = use(
    AppContext
  ) as AppState;

  const filterOptions = ["all", "pending", "completed"];
  const filterIndex = filterOptions.indexOf(taskFilter);

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === "all") return true;
    if (taskFilter === "pending") return !task.completed;
    if (taskFilter === "completed") return task.completed;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <Section title="✅ Task Management">
      <Picker
        label="Filter Tasks"
        options={filterOptions}
        selectedIndex={filterIndex}
        onOptionSelected={({ nativeEvent: { index } }) => {
          setTaskFilter(
            filterOptions[index] as "all" | "pending" | "completed"
          );
        }}
        variant="segmented"
      />

      {filteredTasks.length === 0 ? (
        <ContentUnavailableView
          title="No tasks found"
          systemImage="checkmark.circle"
          description={`No ${taskFilter} tasks at the moment`}
        />
      ) : (
        <VStack spacing={8}>
          {filteredTasks.map((task) => (
            <HStack key={task.id} spacing={12} alignment="center">
              <Text size={24}>{task.emoji}</Text>
              <VStack spacing={4} alignment="leading">
                <HStack spacing={8} alignment="center">
                  <Text
                    size={16}
                    modifiers={task.completed ? [foregroundStyle("gray")] : []}
                  >
                    {task.title}
                  </Text>
                  <Text
                    size={12}
                    modifiers={[
                      foregroundStyle(getPriorityColor(task.priority)),
                    ]}
                  >
                    {task.priority.toUpperCase()}
                  </Text>
                </HStack>
                <Text size={14} modifiers={[foregroundStyle("gray")]}>
                  {task.description}
                </Text>
                <Text size={12} modifiers={[foregroundStyle("gray")]}>
                  {`Due: ${task.dueDate.toLocaleDateString()}`}
                </Text>
              </VStack>
              <Switch
                value={task.completed}
                onValueChange={() => toggleTask(task.id)}
              />
            </HStack>
          ))}
        </VStack>
      )}
    </Section>
  );
}
