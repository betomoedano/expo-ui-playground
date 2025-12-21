/**
 * Declutterly - Home Screen
 * Dashboard with room cards, mascot, and quick actions
 */

import { Colors, RoomColors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { Room, ROOM_TYPE_INFO, RoomType, MASCOT_PERSONALITIES, FOCUS_QUOTES } from '@/types/declutter';
import { getMotivation } from '@/services/gemini';
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
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Text as RNText,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Mascot } from '@/components/features/Mascot';
import { CollectibleSpawn } from '@/components/features/CollectibleSpawn';

export default function HomeScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const {
    user,
    rooms,
    stats,
    addRoom,
    setActiveRoom,
    mascot,
    activeSpawn,
    dismissSpawn,
    collectionStats,
  } = useDeclutter();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [motivationQuote, setMotivationQuote] = useState<string>(
    FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]
  );

  // Rotate motivation quote periodically
  useEffect(() => {
    const loadMotivation = async () => {
      try {
        // Try to get AI-generated motivation, fallback to predefined quotes
        const context = rooms.length > 0
          ? `User has ${rooms.length} rooms and ${stats.totalTasksCompleted} tasks completed`
          : 'New user just getting started';
        const aiMotivation = await getMotivation(context);
        if (aiMotivation) {
          setMotivationQuote(aiMotivation);
        }
      } catch {
        // Fallback to random quote from list
        setMotivationQuote(FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]);
      }
    };

    loadMotivation();

    // Rotate quote every 5 minutes
    const interval = setInterval(() => {
      setMotivationQuote(FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]);
    }, 300000);

    return () => clearInterval(interval);
  }, [rooms.length, stats.totalTasksCompleted]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddRoom = (type: RoomType) => {
    const info = ROOM_TYPE_INFO[type];
    const newRoom = addRoom({
      name: info.label,
      type,
      emoji: info.emoji,
      messLevel: 0,
    });
    setShowAddRoom(false);
    if (newRoom) {
      setActiveRoom(newRoom.id);
      router.push(`/room/${newRoom.id}`);
    }
  };

  const handleRoomPress = (room: Room) => {
    setActiveRoom(room.id);
    router.push(`/room/${room.id}`);
  };

  const handleStartFocus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/focus?duration=25');
  };

  // Calculate overall progress
  const totalProgress = rooms.length > 0
    ? Math.round(rooms.reduce((acc, r) => acc + r.currentProgress, 0) / rooms.length)
    : 0;

  const inProgressRooms = rooms.filter(r => r.currentProgress > 0 && r.currentProgress < 100);
  const completedRooms = rooms.filter(r => r.currentProgress === 100);

  return (
    <Host style={styles.container}>
      {/* Collectible Spawn Overlay */}
      {activeSpawn && (
        <CollectibleSpawn
          spawn={activeSpawn}
          onCollect={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
          onDismiss={dismissSpawn}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Form>
          {/* Welcome Section with Mascot */}
          <Section title="">
            <HStack spacing={16}>
              <VStack spacing={4} alignment="leading">
                <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  Welcome back,
                </Text>
                <Text size={28} weight="bold">
                  {user?.name || 'Friend'} 👋
                </Text>
                <Text size={13} modifiers={[foregroundStyle(colors.primary)]}>
                  Level {stats.level} • {stats.xp} XP
                </Text>
              </VStack>
              <Spacer />
              {mascot && (
                <Pressable onPress={() => router.push('/mascot')}>
                  <View style={styles.mascotMini}>
                    <RNText style={styles.mascotEmoji}>
                      {MASCOT_PERSONALITIES[mascot.personality].emoji}
                    </RNText>
                    <RNText style={[styles.mascotName, { color: colors.textSecondary }]}>
                      {mascot.name}
                    </RNText>
                  </View>
                </Pressable>
              )}
            </HStack>
          </Section>

          {/* Quick Actions */}
          <Section title="Quick Actions">
            <HStack spacing={12}>
              <Pressable
                style={[styles.quickAction, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/camera')}
              >
                <RNText style={styles.quickActionEmoji}>📸</RNText>
                <RNText style={styles.quickActionText}>Capture</RNText>
              </Pressable>
              <Pressable
                style={[styles.quickAction, { backgroundColor: colors.success }]}
                onPress={handleStartFocus}
              >
                <RNText style={styles.quickActionEmoji}>⏱️</RNText>
                <RNText style={styles.quickActionText}>Focus</RNText>
              </Pressable>
              <Pressable
                style={[styles.quickAction, { backgroundColor: '#A855F7' }]}
                onPress={() => router.push('/collection')}
              >
                <RNText style={styles.quickActionEmoji}>✨</RNText>
                <RNText style={styles.quickActionText}>Collection</RNText>
              </Pressable>
            </HStack>
          </Section>

          {/* Stats Overview */}
          <Section title="Your Progress">
            <HStack spacing={16}>
              <VStack spacing={4} alignment="center">
                <Gauge
                  current={{ value: totalProgress / 100 }}
                  type="circular"
                  modifiers={[frame({ width: 80, height: 80 })]}
                />
                <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  Overall
                </Text>
              </VStack>

              <VStack spacing={8} alignment="leading">
                <HStack spacing={8}>
                  <Text size={24} weight="bold">{stats.totalTasksCompleted}</Text>
                  <Text modifiers={[foregroundStyle(colors.textSecondary)]}>tasks done</Text>
                </HStack>
                <HStack spacing={8}>
                  <Text size={24} weight="bold">{stats.currentStreak}</Text>
                  <Text modifiers={[foregroundStyle(colors.textSecondary)]}>day streak 🔥</Text>
                </HStack>
                <HStack spacing={8}>
                  <Text size={24} weight="bold">{collectionStats.uniqueCollected}</Text>
                  <Text modifiers={[foregroundStyle(colors.textSecondary)]}>items found</Text>
                </HStack>
              </VStack>
            </HStack>
          </Section>

          {/* In Progress Rooms */}
          {inProgressRooms.length > 0 && (
            <Section title="🎯 In Progress">
              {inProgressRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  colors={colors}
                  onPress={() => handleRoomPress(room)}
                />
              ))}
            </Section>
          )}

          {/* All Rooms */}
          {rooms.length > 0 ? (
            <Section title="🏠 Your Spaces">
              {rooms.filter(r => r.currentProgress < 100).map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  colors={colors}
                  onPress={() => handleRoomPress(room)}
                />
              ))}
              <Button
                label="Add Another Room"
                onPress={() => setShowAddRoom(true)}
                modifiers={[buttonStyle('bordered'), controlSize('small')]}
              />
            </Section>
          ) : (
            <Section title="🏠 Your Spaces">
              <VStack spacing={16} alignment="center">
                <Text size={48}>🏠</Text>
                <Text size={18} weight="semibold">No rooms yet</Text>
                <Text
                  size={14}
                  modifiers={[foregroundStyle(colors.textSecondary)]}
                >
                  Take a photo to add your first space!
                </Text>
                <Button
                  label="Add a Room"
                  onPress={() => setShowAddRoom(true)}
                  modifiers={[buttonStyle('bordered')]}
                />
              </VStack>
            </Section>
          )}

          {/* Completed Rooms */}
          {completedRooms.length > 0 && (
            <Section title="✅ Completed">
              {completedRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  colors={colors}
                  onPress={() => handleRoomPress(room)}
                />
              ))}
            </Section>
          )}

          {/* Add Room Options */}
          {showAddRoom && (
            <Section title="Add a Room">
              <VStack spacing={8}>
                {(Object.keys(ROOM_TYPE_INFO) as RoomType[]).map(type => (
                  <Button
                    key={type}
                    label={`${ROOM_TYPE_INFO[type].emoji} ${ROOM_TYPE_INFO[type].label}`}
                    onPress={() => handleAddRoom(type)}
                    modifiers={[buttonStyle('bordered'), controlSize('regular')]}
                  />
                ))}
                <Button
                  label="Cancel"
                  onPress={() => setShowAddRoom(false)}
                  modifiers={[buttonStyle('plain')]}
                />
              </VStack>
            </Section>
          )}

          {/* Mascot Section (if exists) */}
          {mascot && (
            <Section title="">
              <Pressable onPress={() => router.push('/mascot')}>
                <Group
                  modifiers={[
                    glassEffect({ glass: { variant: 'regular', interactive: true } }),
                    frame({ minHeight: 100 }),
                  ]}
                >
                  <HStack spacing={16}>
                    <Mascot size="small" showStats={false} interactive={false} />
                    <VStack spacing={4} alignment="leading">
                      <Text size={16} weight="semibold">{mascot.name} says:</Text>
                      <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
                        {getMascotMessage(mascot.mood, stats.currentStreak)}
                      </Text>
                    </VStack>
                    <Spacer />
                    <Text size={24}>❯</Text>
                  </HStack>
                </Group>
              </Pressable>
            </Section>
          )}

          {/* Motivation Quote */}
          <Section title="">
            <Group
              modifiers={[
                glassEffect({ glass: { variant: 'regular', interactive: false } }),
                frame({ minHeight: 80 }),
              ]}
            >
              <VStack spacing={4} alignment="center">
                <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
                  Today's motivation
                </Text>
                <Text size={16} weight="medium">
                  "{motivationQuote}" ✨
                </Text>
              </VStack>
            </Group>
          </Section>
        </Form>
      </ScrollView>
    </Host>
  );
}

// Get mascot message based on mood
function getMascotMessage(mood: string, streak: number): string {
  if (streak >= 7) return "We're on fire! Keep it up!";
  if (streak >= 3) return "Great streak going! You're doing amazing!";

  switch (mood) {
    case 'ecstatic':
      return "I'm so happy we're cleaning together!";
    case 'happy':
      return "Ready to tackle some tasks? Let's go!";
    case 'excited':
      return "Ooh, what should we clean next?";
    case 'content':
      return "Nice and tidy! Want to do more?";
    case 'neutral':
      return "Hey there! Miss cleaning with you!";
    case 'sad':
      return "I miss you! Let's clean something together?";
    default:
      return "Let's make today sparkle!";
  }
}

// Room Card Component
function RoomCard({
  room,
  colors,
  onPress,
}: {
  room: Room;
  colors: typeof Colors.light;
  onPress: () => void;
}) {
  const completedTasks = room.tasks.filter(t => t.completed).length;
  const totalTasks = room.tasks.length;

  return (
    <Pressable onPress={onPress}>
      <HStack spacing={12}>
        <VStack
          alignment="center"
          modifiers={[frame({ width: 60, height: 60 })]}
        >
          {room.photos.length > 0 ? (
            <Image
              source={{ uri: room.photos[room.photos.length - 1].uri }}
              style={{ width: 60, height: 60, borderRadius: 12 }}
            />
          ) : (
            <Text size={32}>{room.emoji}</Text>
          )}
        </VStack>

        <VStack spacing={4} alignment="leading">
          <Text size={17} weight="semibold">{room.name}</Text>
          <Text size={13} modifiers={[foregroundStyle(colors.textSecondary)]}>
            {totalTasks > 0
              ? `${completedTasks}/${totalTasks} tasks • ${room.currentProgress}%`
              : 'No tasks yet'}
          </Text>
        </VStack>

        <Spacer />

        <Gauge
          current={{ value: room.currentProgress / 100 }}
          type="circular"
          modifiers={[frame({ width: 44, height: 44 })]}
        />
      </HStack>
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
  mascotMini: {
    alignItems: 'center',
  },
  mascotEmoji: {
    fontSize: 36,
  },
  mascotName: {
    fontSize: 11,
    marginTop: 2,
  },
  quickAction: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
