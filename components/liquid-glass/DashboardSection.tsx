import {
  Button,
  Gauge,
  HStack,
  Section,
  Slider,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import { foregroundStyle, frame } from "@expo/ui/swift-ui/modifiers";
import React, { use } from "react";
import { AppContext } from "./AppContext";
import { AppState } from "./types";

export function DashboardSection() {
  const {
    tasks,
    productivityScore,
    setProductivityScore,
    focusLevel,
    setFocusLevel,
  } = use(AppContext) as AppState;

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const highPriorityTasks = tasks.filter(
    (t) => t.priority === "high" && !t.completed
  ).length;
  const urgentTasksRate = totalTasks > 0 ? highPriorityTasks / totalTasks : 0;

  return (
    <Section title="📊 Performance Dashboard">
      <VStack spacing={20}>
        {/* Task Metrics Row */}
        <VStack spacing={12}>
          <Text size={16}>Task Completion Metrics</Text>
          <HStack spacing={16}>
            <Gauge
              current={{
                value: completionRate,
                label: `${Math.round(completionRate * 100)}%`,
              }}
              modifiers={[frame({ width: 100, height: 100 })]}
              color="green"
              type="circular"
            />
            <VStack spacing={4} alignment="leading">
              <Text size={14}>Completion Rate</Text>
              <Text size={12} modifiers={[foregroundStyle("gray")]}>
                {`${completedTasks} of ${totalTasks} completed`}
              </Text>
            </VStack>
          </HStack>
        </VStack>

        {/* Gauge Variants Showcase */}
        <VStack spacing={12}>
          <Text size={16}>Gauge Component Variants</Text>

          {/* Circular Gauges */}
          <HStack spacing={16}>
            <VStack spacing={8} alignment="center">
              <Gauge
                current={{
                  value: productivityScore,
                  label: `${Math.round(productivityScore * 100)}%`,
                }}
                modifiers={[frame({ width: 80, height: 80 })]}
                color="blue"
                type="circular"
              />
              <Text size={12}>Circular</Text>
            </VStack>

            <VStack spacing={8} alignment="center">
              <Gauge
                current={{
                  value: focusLevel,
                  label: `${Math.round(focusLevel * 100)}%`,
                }}
                modifiers={[frame({ width: 80, height: 80 })]}
                color="purple"
                type="circularCapacity"
              />
              <Text size={12}>Circular Capacity</Text>
            </VStack>

            <VStack spacing={8} alignment="center">
              <Gauge
                current={{
                  value: urgentTasksRate,
                  label: `${highPriorityTasks}`,
                }}
                modifiers={[frame({ width: 80, height: 80 })]}
                color={["red", "orange", "green"]}
                type="circularCapacity"
              />
              <Text size={12}>Multi-Color</Text>
            </VStack>
          </HStack>

          {/* Linear Gauges */}
          <VStack spacing={8}>
            <Text size={14}>Linear Gauge Types</Text>

            <VStack spacing={4}>
              <Text size={12} modifiers={[foregroundStyle("gray")]}>
                Default Linear
              </Text>
              <Gauge
                current={{ value: completionRate }}
                color="green"
                type="default"
              />
            </VStack>

            <VStack spacing={4}>
              <Text size={12} modifiers={[foregroundStyle("gray")]}>
                Linear
              </Text>
              <Gauge
                current={{ value: productivityScore }}
                color="blue"
                type="linear"
              />
            </VStack>

            <VStack spacing={4}>
              <Text size={12} modifiers={[foregroundStyle("gray")]}>
                Linear Capacity
              </Text>
              <Gauge
                current={{ value: focusLevel }}
                color="purple"
                type="linearCapacity"
              />
            </VStack>

            <VStack spacing={4}>
              <Text size={12} modifiers={[foregroundStyle("gray")]}>
                Gradient Linear
              </Text>
              <Gauge
                current={{ value: (productivityScore + focusLevel) / 2 }}
                color={["red", "yellow", "green"]}
                type="linear"
              />
            </VStack>
          </VStack>
        </VStack>

        {/* Interactive Sliders */}
        <VStack spacing={12}>
          <Text size={16}>Interactive Controls</Text>

          <VStack spacing={8}>
            <HStack spacing={12} alignment="center">
              <Text size={14}>Productivity Score:</Text>
              <Text size={14} modifiers={[foregroundStyle("blue")]}>
                {`${Math.round(productivityScore * 100)}%`}
              </Text>
            </HStack>
            <Slider
              value={productivityScore}
              onValueChange={setProductivityScore}
            />
          </VStack>

          <VStack spacing={8}>
            <HStack spacing={12} alignment="center">
              <Text size={14}>Focus Level:</Text>
              <Text size={14} modifiers={[foregroundStyle("purple")]}>
                {`${Math.round(focusLevel * 100)}%`}
              </Text>
            </HStack>
            <Slider value={focusLevel} onValueChange={setFocusLevel} />
          </VStack>
        </VStack>

        {/* Action Buttons */}
        <VStack spacing={8}>
          <Text size={16}>Quick Actions</Text>
          <HStack spacing={12}>
            <Button
              onPress={() => {
                setProductivityScore(Math.random());
                setFocusLevel(Math.random());
              }}
              systemImage="shuffle"
            >
              Randomize
            </Button>
          </HStack>
        </VStack>
      </VStack>
    </Section>
  );
}
