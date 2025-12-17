import { Form, Host } from "@expo/ui/swift-ui";
import React from "react";

import { AppProvider } from "../liquid-glass/AppContext";
import { ButtonsSection } from "../liquid-glass/ButtonsSection";
import { ContextMenuSection } from "../liquid-glass/ContextMenuSection";
import { DashboardSection } from "../liquid-glass/DashboardSection";
import { DateTimeSection } from "../liquid-glass/DateTimeSection";
import { ProfileSection } from "../liquid-glass/ProfileSection";
import { SettingsSection } from "../liquid-glass/SettingsSection";
import { TaskManagementSection } from "../liquid-glass/TaskManagementSection";

function AppContent() {
  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <ProfileSection />
        <ButtonsSection />
        <DashboardSection />
        <TaskManagementSection />
        <ContextMenuSection />
        <DateTimeSection />
        <SettingsSection />
      </Form>
    </Host>
  );
}

export default function ModifiersScreen() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
