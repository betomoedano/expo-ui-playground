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
import React, { useEffect, useState, useRef } from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Text as RNText,
} from 'react-native';

const { width } = Dimensions.get('window');

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
  const [loadingStage, setLoadingStage] = useState(0);

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const room = rooms.find(r => r.id === roomId);

  // Loading stages
  const loadingStages = [
    { emoji: '📷', text: 'Processing your photo...' },
    { emoji: '🔍', text: 'Analyzing room layout...' },
    { emoji: '🧹', text: 'Identifying clutter areas...' },
    { emoji: '📋', text: 'Creating your personalized plan...' },
    { emoji: '✨', text: 'Almost ready!' },
  ];

  // Animate loading stages
  useEffect(() => {
    if (isAnalyzing) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotate animation for scanning effect
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Progress through stages
      const stageInterval = setInterval(() => {
        setLoadingStage(prev => {
          const next = prev < loadingStages.length - 1 ? prev + 1 : prev;
          Animated.timing(progressAnim, {
            toValue: (next + 1) / loadingStages.length,
            duration: 300,
            useNativeDriver: false,
          }).start();
          return next;
        });
      }, 2000);

      return () => {
        clearInterval(stageInterval);
        pulseAnim.setValue(1);
        rotateAnim.setValue(0);
      };
    } else {
      setLoadingStage(0);
      progressAnim.setValue(0);
    }
  }, [isAnalyzing]);

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

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Loading state with image preview
  if (isAnalyzing) {
    const currentStage = loadingStages[loadingStage];

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Image Preview with Scanning Effect */}
        {imageUri && (
          <View style={styles.loadingImageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.loadingImage}
              contentFit="cover"
            />

            {/* Scanning Overlay */}
            <View style={styles.scanningOverlay}>
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 300],
                        }),
                      },
                    ],
                  },
                ]}
              />

              {/* Corner brackets */}
              <View style={[styles.scanCorner, styles.scanCornerTL]} />
              <View style={[styles.scanCorner, styles.scanCornerTR]} />
              <View style={[styles.scanCorner, styles.scanCornerBL]} />
              <View style={[styles.scanCorner, styles.scanCornerBR]} />
            </View>

            {/* Gradient overlay */}
            <View style={styles.gradientOverlay} />
          </View>
        )}

        {/* Loading Info Card */}
        <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
          <View style={styles.loadingHeader}>
            <Animated.View
              style={[
                styles.loadingEmojiContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <RNText style={styles.loadingEmoji}>{currentStage.emoji}</RNText>
            </Animated.View>
            <View style={styles.loadingTextContainer}>
              <RNText style={[styles.loadingTitle, { color: colors.text }]}>
                Analyzing your space...
              </RNText>
              <RNText style={[styles.loadingSubtitle, { color: colors.textSecondary }]}>
                {currentStage.text}
              </RNText>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.primary,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Stage Indicators */}
          <View style={styles.stageIndicators}>
            {loadingStages.map((stage, index) => (
              <View
                key={index}
                style={[
                  styles.stageIndicator,
                  {
                    backgroundColor:
                      index <= loadingStage ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {/* Tips */}
          <View style={[styles.tipContainer, { backgroundColor: colors.primary + '15' }]}>
            <RNText style={[styles.tipText, { color: colors.primary }]}>
              💡 Tip: The more of your room visible, the better our AI can help!
            </RNText>
          </View>
        </View>
      </View>
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
  // Loading State Styles
  loadingImageContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingImage: {
    flex: 1,
    width: '100%',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  scanCornerTL: {
    top: 20,
    left: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  scanCornerTR: {
    top: 20,
    right: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  scanCornerBL: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  scanCornerBR: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'transparent',
    // Using solid color as gradient fallback
    opacity: 0.7,
  },
  loadingCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  loadingEmoji: {
    fontSize: 28,
  },
  loadingTextContainer: {
    flex: 1,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  loadingSubtitle: {
    fontSize: 15,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  stageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  stageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tipContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
