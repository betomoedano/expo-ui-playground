/**
 * Declutterly - Analysis Screen
 * AI analysis results and task breakdown
 */

import { Colors, PriorityColors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { analyzeRoomImage, analyzeProgress, getMotivation } from '@/services/gemini';
import { AIAnalysisResult, CleaningTask } from '@/types/declutter';
import {
  Button,
  Form,
  Gauge,
  Group,
  Host,
  HStack,
  Section,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  foregroundStyle,
  frame,
  glassEffect,
} from '@expo/ui/swift-ui/modifiers';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

export default function AnalysisScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { roomId, imageUri, mode } = useLocalSearchParams<{
    roomId: string;
    imageUri?: string;
    mode?: 'compare';
  }>();
  const {
    rooms,
    updateRoom,
    setTasksForRoom,
    isAnalyzing,
    setAnalyzing,
    analysisError,
    setAnalysisError,
  } = useDeclutter();

  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [progressResult, setProgressResult] = useState<{
    progressPercentage: number;
    completedTasks: string[];
    remainingTasks: string[];
    encouragement: string;
  } | null>(null);
  const [motivation, setMotivation] = useState<string>('');

  const room = rooms.find(r => r.id === roomId);

  useEffect(() => {
    if (mode === 'compare' && room && room.photos.length >= 2) {
      runProgressAnalysis();
    } else if (imageUri) {
      runAnalysis();
    }
  }, [roomId, imageUri, mode]);

  const runAnalysis = async () => {
    if (!imageUri || !roomId) return;

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // Get AI analysis
      const analysisResult = await analyzeRoomImage(base64);
      setResult(analysisResult);

      // Update room with analysis results
      updateRoom(roomId, {
        messLevel: analysisResult.messLevel,
        aiSummary: analysisResult.summary,
        motivationalMessage: analysisResult.encouragement,
        lastAnalyzedAt: new Date(),
      });

      // Set tasks for the room
      setTasksForRoom(roomId, analysisResult.tasks);

      // Get extra motivation
      const motivationalMessage = await getMotivation(
        `User just analyzed their ${room?.type || 'room'}. Mess level: ${analysisResult.messLevel}%`
      );
      setMotivation(motivationalMessage);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(
        error instanceof Error
          ? error.message
          : 'Failed to analyze image. Please try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const runProgressAnalysis = async () => {
    if (!room || room.photos.length < 2) return;

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      // Get before and latest photos
      const beforePhoto = room.photos.find(p => p.type === 'before') || room.photos[0];
      const latestPhoto = room.photos[room.photos.length - 1];

      // Read images as base64
      const [beforeBase64, afterBase64] = await Promise.all([
        FileSystem.readAsStringAsync(beforePhoto.uri, {
          encoding: 'base64',
        }),
        FileSystem.readAsStringAsync(latestPhoto.uri, {
          encoding: 'base64',
        }),
      ]);

      // Get progress analysis
      const progress = await analyzeProgress(beforeBase64, afterBase64);
      setProgressResult(progress);

      // Update room progress
      updateRoom(roomId!, {
        currentProgress: Math.max(room.currentProgress, progress.progressPercentage),
      });
    } catch (error) {
      console.error('Progress analysis error:', error);
      setAnalysisError(
        error instanceof Error
          ? error.message
          : 'Failed to analyze progress. Please try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGoToRoom = () => {
    router.replace(`/room/${roomId}`);
  };

  const handleRetry = () => {
    if (mode === 'compare') {
      runProgressAnalysis();
    } else {
      runAnalysis();
    }
  };

  // Loading state
  if (isAnalyzing) {
    return (
      <Host style={styles.container}>
        <VStack spacing={24} alignment="center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text size={20} weight="semibold">Analyzing your space...</Text>
          <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
            Our AI is creating your personalized cleaning plan
          </Text>
          <VStack spacing={8} alignment="center">
            <Text size={48}>🔍</Text>
            <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
              Looking for quick wins...
            </Text>
          </VStack>
        </VStack>
      </Host>
    );
  }

  // Error state
  if (analysisError) {
    return (
      <Host style={styles.container}>
        <Form>
          <Section title="">
            <VStack spacing={24} alignment="center">
              <Text size={48}>😕</Text>
              <Text size={20} weight="semibold">Oops!</Text>
              <Text
                size={14}
                modifiers={[foregroundStyle(colors.textSecondary)]}
              >
                {analysisError}
              </Text>
              <HStack spacing={12}>
                <Button
                  label="Try Again"
                  onPress={handleRetry}
                  modifiers={[buttonStyle('borderedProminent')]}
                />
                <Button
                  label="Go Back"
                  onPress={() => router.back()}
                  modifiers={[buttonStyle('bordered')]}
                />
              </HStack>
            </VStack>
          </Section>
        </Form>
      </Host>
    );
  }

  // Progress comparison view
  if (mode === 'compare' && progressResult) {
    return (
      <Host style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Form>
            <Section title="">
              <HStack>
                <Button
                  label="← Back"
                  onPress={() => router.back()}
                  modifiers={[buttonStyle('plain')]}
                />
              </HStack>
            </Section>

            <Section title="">
              <VStack spacing={16} alignment="center">
                <Text size={48}>🎉</Text>
                <Text size={24} weight="bold">Great Progress!</Text>
              </VStack>
            </Section>

            {/* Progress gauge */}
            <Section title="Progress Made">
              <VStack spacing={12} alignment="center">
                <Gauge
                  current={{ value: progressResult.progressPercentage / 100 }}
                  type="circular"
                  modifiers={[frame({ width: 150, height: 150 })]}
                />
                <Text size={36} weight="bold">{progressResult.progressPercentage}%</Text>
                <Text modifiers={[foregroundStyle(colors.textSecondary)]}>
                  improvement detected
                </Text>
              </VStack>
            </Section>

            {/* What was done */}
            {progressResult.completedTasks.length > 0 && (
              <Section title="✅ What You Accomplished">
                {progressResult.completedTasks.map((task, i) => (
                  <HStack key={i} spacing={8}>
                    <Text>✓</Text>
                    <Text>{task}</Text>
                  </HStack>
                ))}
              </Section>
            )}

            {/* What remains */}
            {progressResult.remainingTasks.length > 0 && (
              <Section title="📋 Still To Do">
                {progressResult.remainingTasks.map((task, i) => (
                  <HStack key={i} spacing={8}>
                    <Text>•</Text>
                    <Text>{task}</Text>
                  </HStack>
                ))}
              </Section>
            )}

            {/* Encouragement */}
            <Section title="">
              <Group
                modifiers={[
                  glassEffect({ glass: { variant: 'regular', interactive: false } }),
                  frame({ minHeight: 80 }),
                ]}
              >
                <Text size={16} weight="medium">
                  {progressResult.encouragement}
                </Text>
              </Group>
            </Section>

            <Section title="">
              <Button
                label="Continue Cleaning"
                onPress={handleGoToRoom}
                modifiers={[
                  buttonStyle('borderedProminent'),
                  controlSize('large'),
                  frame({ maxWidth: 400 }),
                ]}
              />
            </Section>
          </Form>
        </ScrollView>
      </Host>
    );
  }

  // Analysis results view
  if (result) {
    const totalTime = result.tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);

    return (
      <Host style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Form>
            <Section title="">
              <HStack>
                <Button
                  label="← Back"
                  onPress={() => router.back()}
                  modifiers={[buttonStyle('plain')]}
                />
              </HStack>
            </Section>

            {/* Header */}
            <Section title="">
              <VStack spacing={16} alignment="center">
                <Text size={48}>✨</Text>
                <Text size={24} weight="bold">Analysis Complete!</Text>
              </VStack>
            </Section>

            {/* Mess Level */}
            <Section title="Current State">
              <HStack spacing={16}>
                <VStack spacing={4} alignment="center">
                  <Gauge
                    current={{ value: result.messLevel / 100 }}
                    type="circular"
                    modifiers={[frame({ width: 100, height: 100 })]}
                  />
                  <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
                    Clutter Level
                  </Text>
                </VStack>

                <VStack spacing={8} alignment="leading">
                  <Text size={14}>{result.summary}</Text>
                  <HStack spacing={4}>
                    <Text size={13} modifiers={[foregroundStyle(colors.primary)]}>
                      ⏱️ ~{totalTime} min total
                    </Text>
                  </HStack>
                </VStack>
              </HStack>
            </Section>

            {/* Quick Wins */}
            {result.quickWins.length > 0 && (
              <Section title="⚡ Quick Wins (2 min each)">
                {result.quickWins.slice(0, 3).map((win, i) => (
                  <HStack key={i} spacing={8}>
                    <Text>•</Text>
                    <Text>{win}</Text>
                  </HStack>
                ))}
              </Section>
            )}

            {/* Task Preview */}
            <Section title={`📋 Your Plan (${result.tasks.length} tasks)`}>
              {result.tasks.slice(0, 5).map(task => (
                <TaskPreviewCard
                  key={task.id}
                  task={task}
                  colors={colors}
                />
              ))}
              {result.tasks.length > 5 && (
                <Text
                  size={14}
                  modifiers={[foregroundStyle(colors.textSecondary)]}
                >
                  +{result.tasks.length - 5} more tasks...
                </Text>
              )}
            </Section>

            {/* Encouragement */}
            <Section title="">
              <Group
                modifiers={[
                  glassEffect({ glass: { variant: 'regular', interactive: false } }),
                  frame({ minHeight: 80 }),
                ]}
              >
                <VStack spacing={8}>
                  <Text size={16} weight="medium">
                    {result.encouragement}
                  </Text>
                  {motivation && (
                    <Text
                      size={14}
                      modifiers={[foregroundStyle(colors.textSecondary)]}
                    >
                      {motivation}
                    </Text>
                  )}
                </VStack>
              </Group>
            </Section>

            {/* Action Button */}
            <Section title="">
              <Button
                label="🚀 Start Cleaning"
                onPress={handleGoToRoom}
                modifiers={[
                  buttonStyle('borderedProminent'),
                  controlSize('large'),
                  frame({ maxWidth: 400 }),
                ]}
              />
            </Section>
          </Form>
        </ScrollView>
      </Host>
    );
  }

  // Fallback
  return (
    <Host style={styles.container}>
      <VStack spacing={16} alignment="center">
        <Text size={20}>No analysis data</Text>
        <Button label="Go Back" onPress={() => router.back()} />
      </VStack>
    </Host>
  );
}

// Task Preview Card
function TaskPreviewCard({
  task,
  colors,
}: {
  task: CleaningTask;
  colors: typeof Colors.light;
}) {
  const priorityColor = PriorityColors[task.priority];

  return (
    <HStack spacing={12}>
      <Text size={24}>{task.emoji}</Text>
      <VStack spacing={2} alignment="leading">
        <Text weight="medium">{task.title}</Text>
        <HStack spacing={8}>
          <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
            ~{task.estimatedMinutes} min
          </Text>
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: priorityColor + '20',
            }}
          >
            <Text size={10} modifiers={[foregroundStyle(priorityColor)]}>
              {task.priority}
            </Text>
          </View>
          {task.difficulty === 'quick' && (
            <Text size={11} modifiers={[foregroundStyle(colors.success)]}>
              Quick Win!
            </Text>
          )}
        </HStack>
      </VStack>
    </HStack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
