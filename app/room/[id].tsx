/**
 * Declutterly - Room Detail Screen
 * View room progress, tasks, and photos
 */

import { Colors, PriorityColors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { CleaningTask, Priority } from '@/types/declutter';
import {
  Button,
  Form,
  Gauge,
  Group,
  Host,
  HStack,
  Section,
  Spacer,
  Switch,
  Text,
  VStack,
  DisclosureGroup,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  foregroundStyle,
  frame,
  glassEffect,
  background,
} from '@expo/ui/swift-ui/modifiers';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Text as RNText,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export default function RoomDetailScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    rooms,
    toggleTask,
    toggleSubTask,
    deleteRoom,
    setActiveRoom,
    settings,
  } = useDeclutter();

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [celebratingTask, setCelebratingTask] = useState<string | null>(null);
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const room = rooms.find(r => r.id === id);

  // Celebration animation when task is completed
  const celebrateCompletion = (taskId: string) => {
    setCelebratingTask(taskId);

    // Scale bounce animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 200,
        friction: 3,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti fade animation
    Animated.sequence([
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(confettiAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => setCelebratingTask(null));
  };

  if (!room) {
    return (
      <Host style={styles.container}>
        <VStack spacing={16} alignment="center">
          <Text size={48}>🔍</Text>
          <Text size={18}>Room not found</Text>
          <Button label="Go Back" onPress={() => router.back()} />
        </VStack>
      </Host>
    );
  }

  // Filter tasks
  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'pending':
        return room.tasks.filter(t => !t.completed);
      case 'completed':
        return room.tasks.filter(t => t.completed);
      default:
        return room.tasks;
    }
  }, [room.tasks, filter]);

  // Group tasks by priority
  const tasksByPriority = useMemo(() => {
    const high = filteredTasks.filter(t => t.priority === 'high');
    const medium = filteredTasks.filter(t => t.priority === 'medium');
    const low = filteredTasks.filter(t => t.priority === 'low');
    return { high, medium, low };
  }, [filteredTasks]);

  // Calculate stats
  const completedCount = room.tasks.filter(t => t.completed).length;
  const totalTime = room.tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const remainingTime = room.tasks
    .filter(t => !t.completed)
    .reduce((acc, t) => acc + t.estimatedMinutes, 0);

  const handleTaskToggle = (taskId: string) => {
    const task = room.tasks.find(t => t.id === taskId);
    const wasCompleted = task?.completed;

    if (settings.hapticFeedback) {
      if (!wasCompleted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    toggleTask(room.id, taskId);

    // Celebrate if task was just completed
    if (!wasCompleted) {
      celebrateCompletion(taskId);
    }
  };

  const handleStartFocusMode = () => {
    setActiveRoom(room.id);
    router.push('/focus');
  };

  const handleSubTaskToggle = (taskId: string, subTaskId: string) => {
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleSubTask(room.id, taskId, subTaskId);
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleTakePhoto = () => {
    setActiveRoom(room.id);
    router.push('/camera');
  };

  const handleDeleteRoom = () => {
    Alert.alert(
      'Delete Room',
      'Are you sure you want to delete this room and all its tasks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRoom(room.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <Host style={styles.container}>
      {/* Celebration Confetti Overlay */}
      {celebratingTask && (
        <Animated.View
          style={[
            styles.confettiOverlay,
            { opacity: confettiAnim },
          ]}
          pointerEvents="none"
        >
          <View style={styles.confettiContainer}>
            {['🎉', '✨', '⭐', '🌟', '💫', '🎊'].map((emoji, i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.confettiEmoji,
                  {
                    transform: [
                      { scale: scaleAnim },
                      { translateY: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      })},
                    ],
                  },
                ]}
              >
                {emoji}
              </Animated.Text>
            ))}
          </View>
          <RNText style={styles.completedText}>Task Complete!</RNText>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Form>
          {/* Header with back button */}
          <Section title="">
            <HStack spacing={12}>
              <Button
                label="← Back"
                onPress={() => router.back()}
                modifiers={[buttonStyle('plain')]}
              />
              <Spacer />
              <Button
                label="🗑️"
                onPress={handleDeleteRoom}
                modifiers={[buttonStyle('plain'), foregroundStyle(colors.danger)]}
              />
            </HStack>
          </Section>

          {/* Room Header */}
          <Section title="">
            <HStack spacing={16}>
              {room.photos.length > 0 ? (
                <Image
                  source={{ uri: room.photos[room.photos.length - 1].uri }}
                  style={{ width: 80, height: 80, borderRadius: 16 }}
                />
              ) : (
                <VStack
                  alignment="center"
                  modifiers={[
                    frame({ width: 80, height: 80 }),
                    glassEffect({ glass: { variant: 'regular', interactive: false } }),
                  ]}
                >
                  <Text size={40}>{room.emoji}</Text>
                </VStack>
              )}

              <VStack spacing={4} alignment="leading">
                <Text size={24} weight="bold">{room.name}</Text>
                <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  {completedCount}/{room.tasks.length} tasks completed
                </Text>
                <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  ~{remainingTime} min remaining
                </Text>
              </VStack>
            </HStack>
          </Section>

          {/* Progress */}
          <Section title="Progress">
            <VStack spacing={12} alignment="center">
              <Gauge
                current={{ value: room.currentProgress / 100 }}
                type="circular"
                modifiers={[frame({ width: 120, height: 120 })]}
              />
              <Text size={32} weight="bold">{room.currentProgress}%</Text>
              {room.aiSummary && (
                <Text
                  size={14}
                  modifiers={[foregroundStyle(colors.textSecondary)]}
                >
                  {room.aiSummary}
                </Text>
              )}
            </VStack>
          </Section>

          {/* Focus Mode CTA */}
          {room.tasks.filter(t => !t.completed).length > 0 && (
            <Section title="">
              <Pressable onPress={handleStartFocusMode}>
                <View style={[styles.focusModeCard, { backgroundColor: colors.primary }]}>
                  <View style={styles.focusModeContent}>
                    <View style={styles.focusModeIcon}>
                      <RNText style={styles.focusModeEmoji}>🎯</RNText>
                    </View>
                    <View style={styles.focusModeText}>
                      <RNText style={styles.focusModeTitle}>Start Focus Session</RNText>
                      <RNText style={styles.focusModeSubtitle}>
                        {room.tasks.filter(t => !t.completed).length} tasks • ~{remainingTime} min
                      </RNText>
                    </View>
                    <RNText style={styles.focusModeArrow}>→</RNText>
                  </View>
                </View>
              </Pressable>
            </Section>
          )}

          {/* Actions */}
          <Section title="">
            <HStack spacing={12}>
              <Button
                label="📸 Take Photo"
                onPress={handleTakePhoto}
                modifiers={[buttonStyle('bordered'), controlSize('regular')]}
              />
              {room.photos.length >= 2 && (
                <Button
                  label="📊 Compare"
                  onPress={() => router.push({
                    pathname: '/analysis',
                    params: { roomId: room.id, mode: 'compare' }
                  })}
                  modifiers={[buttonStyle('bordered'), controlSize('regular')]}
                />
              )}
            </HStack>
          </Section>

          {/* Photos */}
          {room.photos.length > 0 && (
            <Section title="📷 Photos">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <HStack spacing={8}>
                  {room.photos.map((photo, index) => (
                    <VStack key={photo.id} spacing={4} alignment="center">
                      <Image
                        source={{ uri: photo.uri }}
                        style={{ width: 100, height: 100, borderRadius: 8 }}
                      />
                      <Text size={11} modifiers={[foregroundStyle(colors.textSecondary)]}>
                        {photo.type}
                      </Text>
                    </VStack>
                  ))}
                </HStack>
              </ScrollView>
            </Section>
          )}

          {/* Filter */}
          {room.tasks.length > 0 && (
            <Section title="">
              <HStack spacing={8}>
                <Button
                  label="All"
                  onPress={() => setFilter('all')}
                  modifiers={[
                    buttonStyle(filter === 'all' ? 'borderedProminent' : 'bordered'),
                    controlSize('small'),
                  ]}
                />
                <Button
                  label="To Do"
                  onPress={() => setFilter('pending')}
                  modifiers={[
                    buttonStyle(filter === 'pending' ? 'borderedProminent' : 'bordered'),
                    controlSize('small'),
                  ]}
                />
                <Button
                  label="Done"
                  onPress={() => setFilter('completed')}
                  modifiers={[
                    buttonStyle(filter === 'completed' ? 'borderedProminent' : 'bordered'),
                    controlSize('small'),
                  ]}
                />
              </HStack>
            </Section>
          )}

          {/* Quick Wins */}
          {room.tasks.filter(t => t.difficulty === 'quick' && !t.completed).length > 0 && (
            <Section title="⚡ Quick Wins (Under 5 min)">
              {room.tasks
                .filter(t => t.difficulty === 'quick' && !t.completed)
                .slice(0, 3)
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    colors={colors}
                    expanded={expandedTasks.has(task.id)}
                    onToggle={() => handleTaskToggle(task.id)}
                    onExpand={() => toggleTaskExpanded(task.id)}
                    onSubTaskToggle={(subTaskId) => handleSubTaskToggle(task.id, subTaskId)}
                    showQuickWinBadge
                  />
                ))}
            </Section>
          )}

          {/* High Priority Tasks */}
          {tasksByPriority.high.length > 0 && (
            <Section title="🔴 High Priority">
              {tasksByPriority.high.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  colors={colors}
                  expanded={expandedTasks.has(task.id)}
                  onToggle={() => handleTaskToggle(task.id)}
                  onExpand={() => toggleTaskExpanded(task.id)}
                  onSubTaskToggle={(subTaskId) => handleSubTaskToggle(task.id, subTaskId)}
                />
              ))}
            </Section>
          )}

          {/* Medium Priority Tasks */}
          {tasksByPriority.medium.length > 0 && (
            <Section title="🟡 Medium Priority">
              {tasksByPriority.medium.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  colors={colors}
                  expanded={expandedTasks.has(task.id)}
                  onToggle={() => handleTaskToggle(task.id)}
                  onExpand={() => toggleTaskExpanded(task.id)}
                  onSubTaskToggle={(subTaskId) => handleSubTaskToggle(task.id, subTaskId)}
                />
              ))}
            </Section>
          )}

          {/* Low Priority Tasks */}
          {tasksByPriority.low.length > 0 && (
            <Section title="🟢 Low Priority">
              {tasksByPriority.low.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  colors={colors}
                  expanded={expandedTasks.has(task.id)}
                  onToggle={() => handleTaskToggle(task.id)}
                  onExpand={() => toggleTaskExpanded(task.id)}
                  onSubTaskToggle={(subTaskId) => handleSubTaskToggle(task.id, subTaskId)}
                />
              ))}
            </Section>
          )}

          {/* No Tasks - Enhanced Empty State */}
          {room.tasks.length === 0 && (
            <Section title="">
              <View style={[styles.noTasksCard, { backgroundColor: colors.card }]}>
                <View style={styles.noTasksIllustration}>
                  <RNText style={styles.noTasksEmoji}>📋</RNText>
                  <View style={styles.noTasksSparkles}>
                    <RNText style={styles.noTasksSparkle1}>✨</RNText>
                    <RNText style={styles.noTasksSparkle2}>🧹</RNText>
                  </View>
                </View>
                <RNText style={[styles.noTasksTitle, { color: colors.text }]}>
                  Ready for AI Analysis
                </RNText>
                <RNText style={[styles.noTasksSubtitle, { color: colors.textSecondary }]}>
                  Take a photo of this space and our AI will create a personalized cleaning plan with step-by-step tasks.
                </RNText>
                <View style={styles.noTasksFeatures}>
                  <View style={styles.noTasksFeature}>
                    <RNText style={styles.noTasksFeatureEmoji}>📸</RNText>
                    <RNText style={[styles.noTasksFeatureText, { color: colors.textSecondary }]}>
                      Capture the space
                    </RNText>
                  </View>
                  <View style={styles.noTasksFeature}>
                    <RNText style={styles.noTasksFeatureEmoji}>🤖</RNText>
                    <RNText style={[styles.noTasksFeatureText, { color: colors.textSecondary }]}>
                      AI identifies tasks
                    </RNText>
                  </View>
                  <View style={styles.noTasksFeature}>
                    <RNText style={styles.noTasksFeatureEmoji}>⚡</RNText>
                    <RNText style={[styles.noTasksFeatureText, { color: colors.textSecondary }]}>
                      Get quick wins first
                    </RNText>
                  </View>
                </View>
                <Pressable
                  style={[styles.noTasksCTA, { backgroundColor: colors.primary }]}
                  onPress={handleTakePhoto}
                >
                  <RNText style={styles.noTasksCTAText}>📸 Capture Space</RNText>
                </Pressable>
              </View>
            </Section>
          )}

          {/* Motivation */}
          {room.motivationalMessage && (
            <Section title="">
              <Group
                modifiers={[
                  glassEffect({ glass: { variant: 'regular', interactive: false } }),
                  frame({ minHeight: 60 }),
                ]}
              >
                <Text size={15}>{room.motivationalMessage}</Text>
              </Group>
            </Section>
          )}
        </Form>
      </ScrollView>
    </Host>
  );
}

// Task Card Component
function TaskCard({
  task,
  colors,
  expanded,
  onToggle,
  onExpand,
  onSubTaskToggle,
  showQuickWinBadge,
}: {
  task: CleaningTask;
  colors: typeof Colors.light;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onSubTaskToggle: (subTaskId: string) => void;
  showQuickWinBadge?: boolean;
}) {
  const priorityColor = PriorityColors[task.priority];
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;

  return (
    <Pressable onPress={onExpand}>
      <VStack spacing={8}>
        <HStack spacing={12}>
          {/* Checkbox */}
          <Switch
            value={task.completed}
            onValueChange={onToggle}
          />

          {/* Task info */}
          <VStack spacing={2} alignment="leading">
            <HStack spacing={8}>
              <Text size={16}>{task.emoji}</Text>
              <RNText
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  textDecorationLine: task.completed ? 'line-through' : 'none',
                  opacity: task.completed ? 0.6 : 1,
                }}
              >
                {task.title}
              </RNText>
            </HStack>

            <HStack spacing={8}>
              <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
                ~{task.estimatedMinutes} min
              </Text>
              {showQuickWinBadge && (
                <Text size={11} modifiers={[foregroundStyle(colors.success)]}>
                  Quick Win!
                </Text>
              )}
              {hasSubtasks && (
                <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  {completedSubtasks}/{task.subtasks!.length} steps
                </Text>
              )}
            </HStack>
          </VStack>

          <Spacer />

          {/* Priority indicator */}
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: priorityColor,
            }}
          />
        </HStack>

        {/* Expanded content */}
        {expanded && (
          <VStack spacing={8} alignment="leading">
            {/* Description */}
            {task.description && (
              <Text
                size={14}
                modifiers={[foregroundStyle(colors.textSecondary)]}
              >
                {task.description}
              </Text>
            )}

            {/* Tips */}
            {task.tips && task.tips.length > 0 && (
              <VStack spacing={4} alignment="leading">
                <Text size={12} weight="semibold" modifiers={[foregroundStyle(colors.primary)]}>
                  💡 Tips:
                </Text>
                {task.tips.map((tip, i) => (
                  <Text
                    key={i}
                    size={13}
                    modifiers={[foregroundStyle(colors.textSecondary)]}
                  >
                    • {tip}
                  </Text>
                ))}
              </VStack>
            )}

            {/* Subtasks */}
            {hasSubtasks && (
              <VStack spacing={6} alignment="leading">
                <Text size={12} weight="semibold">Steps:</Text>
                {task.subtasks!.map(st => (
                  <HStack key={st.id} spacing={8}>
                    <Switch
                      value={st.completed}
                      onValueChange={() => onSubTaskToggle(st.id)}
                    />
                    <RNText
                      style={{
                        fontSize: 14,
                        textDecorationLine: st.completed ? 'line-through' : 'none',
                        opacity: st.completed ? 0.6 : 1,
                      }}
                    >
                      {st.title}
                    </RNText>
                  </HStack>
                ))}
              </VStack>
            )}
          </VStack>
        )}
      </VStack>
    </Pressable>
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
  // Focus Mode Card
  focusModeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  focusModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  focusModeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  focusModeEmoji: {
    fontSize: 24,
  },
  focusModeText: {
    flex: 1,
  },
  focusModeTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  focusModeSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  focusModeArrow: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  // Celebration Overlay
  confettiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  confettiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confettiEmoji: {
    fontSize: 32,
    marginHorizontal: 8,
  },
  completedText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // No Tasks Empty State
  noTasksCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  noTasksIllustration: {
    position: 'relative',
    marginBottom: 16,
  },
  noTasksEmoji: {
    fontSize: 56,
  },
  noTasksSparkles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  noTasksSparkle1: {
    position: 'absolute',
    top: -8,
    right: -15,
    fontSize: 18,
  },
  noTasksSparkle2: {
    position: 'absolute',
    bottom: -5,
    left: -15,
    fontSize: 16,
  },
  noTasksTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  noTasksSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  noTasksFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  noTasksFeature: {
    alignItems: 'center',
    flex: 1,
  },
  noTasksFeatureEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  noTasksFeatureText: {
    fontSize: 11,
    textAlign: 'center',
  },
  noTasksCTA: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  noTasksCTAText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
