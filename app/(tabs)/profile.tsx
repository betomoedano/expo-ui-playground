/**
 * Declutterly - Profile Screen
 * User profile, settings, and app info
 */

import { Colors } from '@/constants/Colors';
import { useDeclutter, saveApiKey, loadApiKey } from '@/context/DeclutterContext';
import { getGeminiApiKey } from '@/services/gemini';
import {
  Button,
  Form,
  Host,
  HStack,
  Section,
  Spacer,
  Switch,
  Text,
  TextField,
  VStack,
  Picker,
  DisclosureGroup,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  foregroundStyle,
  frame,
  glassEffect,
} from '@expo/ui/swift-ui/modifiers';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  useColorScheme,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

export default function ProfileScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { user, settings, updateSettings, stats, rooms } = useDeclutter();

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  useEffect(() => {
    // Load current API key
    loadApiKey().then(key => {
      if (key) setApiKey(key);
    });
  }, []);

  const handleSaveApiKey = async () => {
    await saveApiKey(apiKey);
    Alert.alert('Saved', 'API key has been saved successfully!');
  };

  const encouragementOptions = ['minimal', 'moderate', 'maximum'];
  const breakdownOptions = ['normal', 'detailed', 'ultra'];
  const themeOptions = ['light', 'dark', 'auto'];

  return (
    <Host style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Form>
          {/* Profile Header */}
          <Section title="">
            <VStack spacing={16} alignment="center">
              {/* Avatar */}
              <VStack
                alignment="center"
                modifiers={[
                  frame({ width: 100, height: 100 }),
                  glassEffect({ glass: { variant: 'regular', interactive: true } }),
                ]}
              >
                <Text size={48}>👤</Text>
              </VStack>

              <VStack spacing={4} alignment="center">
                <Text size={24} weight="bold">{user?.name || 'User'}</Text>
                <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  Level {stats.level} Declutterer
                </Text>
              </VStack>
            </VStack>
          </Section>

          {/* Quick Stats */}
          <Section title="Quick Stats">
            <HStack spacing={8}>
              <VStack spacing={2} alignment="center">
                <Text size={20} weight="bold">{stats.totalTasksCompleted}</Text>
                <Text size={11} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  Tasks
                </Text>
              </VStack>
              <Spacer />
              <VStack spacing={2} alignment="center">
                <Text size={20} weight="bold">{rooms.length}</Text>
                <Text size={11} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  Rooms
                </Text>
              </VStack>
              <Spacer />
              <VStack spacing={2} alignment="center">
                <Text size={20} weight="bold">{stats.currentStreak}</Text>
                <Text size={11} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  Streak
                </Text>
              </VStack>
              <Spacer />
              <VStack spacing={2} alignment="center">
                <Text size={20} weight="bold">{stats.badges.length}</Text>
                <Text size={11} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  Badges
                </Text>
              </VStack>
            </HStack>
          </Section>

          {/* Preferences */}
          <Section title="Preferences">
            <HStack spacing={8}>
              <Text>Notifications</Text>
              <Spacer />
              <Switch
                value={settings.notifications}
                onValueChange={(value) => updateSettings({ notifications: value })}
              />
            </HStack>

            <HStack spacing={8}>
              <Text>Haptic Feedback</Text>
              <Spacer />
              <Switch
                value={settings.hapticFeedback}
                onValueChange={(value) => updateSettings({ hapticFeedback: value })}
              />
            </HStack>

            <Picker
              label="Theme"
              selection={settings.theme}
              onSelectionChange={(value) =>
                updateSettings({ theme: value as 'light' | 'dark' | 'auto' })
              }
            />

            <Picker
              label="Encouragement Level"
              selection={settings.encouragementLevel}
              onSelectionChange={(value) =>
                updateSettings({
                  encouragementLevel: value as 'minimal' | 'moderate' | 'maximum',
                })
              }
            />

            <Picker
              label="Task Breakdown"
              selection={settings.taskBreakdownLevel}
              onSelectionChange={(value) =>
                updateSettings({
                  taskBreakdownLevel: value as 'normal' | 'detailed' | 'ultra',
                })
              }
            />
          </Section>

          {/* AI Settings */}
          <Section title="AI Settings">
            <DisclosureGroup
              isExpanded={settingsExpanded}
              onStateChange={setSettingsExpanded}
              label="Gemini API Key"
            >
              <VStack spacing={12}>
                <TextField
                  placeholder="Enter your Gemini API key"
                  defaultValue={showApiKey ? apiKey : '•'.repeat(Math.min(apiKey.length, 20))}
                  onChangeText={setApiKey}
                />
                <HStack spacing={8}>
                  <Button
                    label={showApiKey ? 'Hide' : 'Show'}
                    onPress={() => setShowApiKey(!showApiKey)}
                    modifiers={[buttonStyle('bordered'), controlSize('small')]}
                  />
                  <Button
                    label="Save Key"
                    onPress={handleSaveApiKey}
                    modifiers={[buttonStyle('borderedProminent'), controlSize('small')]}
                  />
                </HStack>
                <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  Get a free API key at ai.google.dev
                </Text>
              </VStack>
            </DisclosureGroup>
          </Section>

          {/* About */}
          <Section title="About">
            <HStack>
              <Text>Version</Text>
              <Spacer />
              <Text modifiers={[foregroundStyle(colors.textSecondary)]}>1.0.0</Text>
            </HStack>
            <HStack>
              <Text>Made with</Text>
              <Spacer />
              <Text>❤️ for ADHD minds</Text>
            </HStack>
          </Section>

          {/* Tips */}
          <Section title="💡 Tips">
            <VStack spacing={8} alignment="leading">
              <Text size={14}>
                • Start small - even 5 minutes counts!
              </Text>
              <Text size={14}>
                • Focus on one area at a time
              </Text>
              <Text size={14}>
                • Celebrate every completed task
              </Text>
              <Text size={14}>
                • It's okay to take breaks
              </Text>
              <Text size={14}>
                • Progress, not perfection
              </Text>
            </VStack>
          </Section>
        </Form>
      </ScrollView>
    </Host>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
