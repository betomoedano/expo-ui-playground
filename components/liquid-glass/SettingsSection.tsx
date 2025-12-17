import { DisclosureGroup, Picker, Section, Switch } from "@expo/ui/swift-ui";
import React, { use, useState } from "react";
import { AppContext } from "./AppContext";
import { AppState } from "./types";

export function SettingsSection() {
  const { settings, updateSettings } = use(AppContext) as AppState;
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const themeOptions = ["light", "dark", "auto"];
  const themeIndex = themeOptions.indexOf(settings.theme);

  const languageOptions = ["en", "es", "fr", "de"];
  const languageIndex = languageOptions.indexOf(settings.language);

  return (
    <Section title="⚙️ App Settings">
      <Switch
        value={settings.notifications}
        label="Push Notifications"
        onValueChange={(value) => updateSettings({ notifications: value })}
      />

      <Switch
        value={settings.autoSave}
        label="Auto-save Changes"
        onValueChange={(value) => updateSettings({ autoSave: value })}
      />

      <DisclosureGroup
        onStateChange={setSettingsExpanded}
        isExpanded={settingsExpanded}
        label="Advanced Settings"
      >
        <Picker
          label="App Theme"
          selection={themeOptions[themeIndex]}
          onSelectionChange={(selection) => {
            updateSettings({ theme: selection as "light" | "dark" | "auto" });
          }}
        />

        <Picker
          label="Language"
          selection={languageOptions[languageIndex]}
          onSelectionChange={(selection) => {
            updateSettings({
              language: selection as "en" | "es" | "fr" | "de",
            });
          }}
        />
      </DisclosureGroup>
    </Section>
  );
}
