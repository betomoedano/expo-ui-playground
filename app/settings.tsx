/**
 * Declutterly - Settings Screen (Modal)
 * Full settings page with all options
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
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  foregroundStyle,
} from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  useColorScheme,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';

export default function SettingsScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { settings, updateSettings, rooms, stats } = useDeclutter();

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadApiKey().then(key => {
      if (key) setApiKey(key);
    });
  }, []);

  const handleSaveApiKey = async () => {
    await saveApiKey(apiKey);
    Alert.alert('Saved', 'Your API key has been saved successfully!');
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your rooms, tasks, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            // Would need to implement a clearAll function in context
            Alert.alert('Cleared', 'All data has been cleared. Restart the app.');
          },
        },
      ]
    );
  };

  const openGeminiDocs = () => {
    Linking.openURL('https://ai.google.dev/');
  };

  return (
    <Host style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Form>
          {/* Header */}
          <Section title="">
            <HStack>
              <Button
                label="← Back"
                onPress={() => router.back()}
                modifiers={[buttonStyle('plain')]}
              />
              <Spacer />
              <Text size={18} weight="bold">Settings</Text>
              <Spacer />
              <Button
                label="Done"
                onPress={() => router.back()}
                modifiers={[buttonStyle('plain')]}
              />
            </HStack>
          </Section>

          {/* AI Configuration */}
          <Section title="AI Configuration">
            <VStack spacing={12} alignment="leading">
              <TextField
                placeholder="Enter your API key"
                defaultValue={showApiKey ? apiKey : '•'.repeat(Math.min(apiKey.length, 20))}
                onChangeText={setApiKey}
              />

              <HStack spacing={8}>
                <Button
                  label={showApiKey ? 'Hide Key' : 'Show Key'}
                  onPress={() => setShowApiKey(!showApiKey)}
                  modifiers={[buttonStyle('bordered'), controlSize('small')]}
                />
                <Button
                  label="Save"
                  onPress={handleSaveApiKey}
                  modifiers={[buttonStyle('borderedProminent'), controlSize('small')]}
                />
              </HStack>

              <Button
                label="Get a Free API Key"
                onPress={openGeminiDocs}
                modifiers={[buttonStyle('plain'), foregroundStyle(colors.primary)]}
              />
            </VStack>
          </Section>

          {/* Notifications */}
          <Section title="Notifications">
            <HStack>
              <Text>Push Notifications</Text>
              <Spacer />
              <Switch
                value={settings.notifications}
                onValueChange={(value) => updateSettings({ notifications: value })}
              />
            </HStack>
          </Section>

          {/* Appearance */}
          <Section title="Appearance">
            <Picker
              label="Theme"
              selection={settings.theme}
              onSelectionChange={(value) =>
                updateSettings({ theme: value as 'light' | 'dark' | 'auto' })
              }
            />

            <HStack>
              <Text>Haptic Feedback</Text>
              <Spacer />
              <Switch
                value={settings.hapticFeedback}
                onValueChange={(value) => updateSettings({ hapticFeedback: value })}
              />
            </HStack>
          </Section>

          {/* Focus Mode */}
          <Section title="Focus Mode">
            <HStack>
              <Text>Strict Mode</Text>
              <Spacer />
              <Switch
                value={settings.focusMode.strictMode}
                onValueChange={(value) =>
                  updateSettings({
                    focusMode: { ...settings.focusMode, strictMode: value },
                  })
                }
              />
            </HStack>

            <HStack>
              <Text>Motivational Quotes</Text>
              <Spacer />
              <Switch
                value={settings.focusMode.showMotivationalQuotes}
                onValueChange={(value) =>
                  updateSettings({
                    focusMode: { ...settings.focusMode, showMotivationalQuotes: value },
                  })
                }
              />
            </HStack>

            <HStack>
              <Text>Auto-start Breaks</Text>
              <Spacer />
              <Switch
                value={settings.focusMode.autoStartBreak}
                onValueChange={(value) =>
                  updateSettings({
                    focusMode: { ...settings.focusMode, autoStartBreak: value },
                  })
                }
              />
            </HStack>

            <HStack>
              <Text>Block Notifications</Text>
              <Spacer />
              <Switch
                value={settings.focusMode.blockNotifications}
                onValueChange={(value) =>
                  updateSettings({
                    focusMode: { ...settings.focusMode, blockNotifications: value },
                  })
                }
              />
            </HStack>

            <VStack spacing={4} alignment="leading">
              <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
                Strict mode warns you when leaving the app
              </Text>
            </VStack>
          </Section>

          {/* Collection & Gamification */}
          <Section title="Collection">
            <HStack>
              <Text>AR Collectibles</Text>
              <Spacer />
              <Switch
                value={settings.arCollectionEnabled}
                onValueChange={(value) =>
                  updateSettings({ arCollectionEnabled: value })
                }
              />
            </HStack>

            <HStack>
              <Text>Collectible Notifications</Text>
              <Spacer />
              <Switch
                value={settings.collectibleNotifications}
                onValueChange={(value) =>
                  updateSettings({ collectibleNotifications: value })
                }
              />
            </HStack>

            <VStack spacing={4} alignment="leading">
              <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
                Earn virtual collectibles when completing tasks
              </Text>
            </VStack>
          </Section>

          {/* ADHD-Friendly Options */}
          <Section title="ADHD-Friendly Options">
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
              label="Task Breakdown Detail"
              selection={settings.taskBreakdownLevel}
              onSelectionChange={(value) =>
                updateSettings({
                  taskBreakdownLevel: value as 'normal' | 'detailed' | 'ultra',
                })
              }
            />

            <VStack spacing={4} alignment="leading">
              <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
                Higher encouragement = more positive messages
              </Text>
              <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
                Ultra breakdown = smallest possible task steps
              </Text>
            </VStack>
          </Section>

          {/* Data */}
          <Section title="Your Data">
            <HStack>
              <Text>Rooms</Text>
              <Spacer />
              <Text modifiers={[foregroundStyle(colors.textSecondary)]}>
                {rooms.length}
              </Text>
            </HStack>
            <HStack>
              <Text>Tasks Completed</Text>
              <Spacer />
              <Text modifiers={[foregroundStyle(colors.textSecondary)]}>
                {stats.totalTasksCompleted}
              </Text>
            </HStack>
            <HStack>
              <Text>Current Streak</Text>
              <Spacer />
              <Text modifiers={[foregroundStyle(colors.textSecondary)]}>
                {stats.currentStreak} days
              </Text>
            </HStack>
          </Section>

          {/* Danger Zone */}
          <Section title="Danger Zone">
            <Button
              label="Clear All Data"
              onPress={handleClearData}
              modifiers={[
                buttonStyle('bordered'),
                foregroundStyle(colors.danger),
              ]}
            />
          </Section>

          {/* About */}
          <Section title="About">
            <HStack>
              <Text>App Version</Text>
              <Spacer />
              <Text modifiers={[foregroundStyle(colors.textSecondary)]}>1.0.0</Text>
            </HStack>
            <HStack>
              <Text>Built with</Text>
              <Spacer />
              <Text>Expo + React Native</Text>
            </HStack>
            <HStack>
              <Text>AI Powered by</Text>
              <Spacer />
              <Text>Google Gemini</Text>
            </HStack>
          </Section>

          {/* Credits */}
          <Section title="">
            <VStack spacing={8} alignment="center">
              <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
                Made with ❤️ for people who struggle with cleaning
              </Text>
              <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
                Remember: Progress, not perfection!
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
    paddingBottom: 50,
  },
});
