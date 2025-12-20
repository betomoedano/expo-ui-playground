/**
 * Declutterly - Home Screen
 * Dashboard with room cards and quick actions
 */

import { Colors, RoomColors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { Room, ROOM_TYPE_INFO, RoomType } from '@/types/declutter';
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
import { GlassView } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';

export default function HomeScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { user, rooms, stats, addRoom, setActiveRoom } = useDeclutter();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
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

  // Calculate overall progress
  const totalProgress = rooms.length > 0
    ? Math.round(rooms.reduce((acc, r) => acc + r.currentProgress, 0) / rooms.length)
    : 0;

  const inProgressRooms = rooms.filter(r => r.currentProgress > 0 && r.currentProgress < 100);
  const completedRooms = rooms.filter(r => r.currentProgress === 100);

  return (
    <Host style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Form>
          {/* Welcome Section */}
          <Section title="">
            <VStack spacing={4} alignment="leading">
              <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
                Welcome back,
              </Text>
              <Text size={28} weight="bold">
                {user?.name || 'Friend'} 👋
              </Text>
            </VStack>
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
                  <Text size={24} weight="bold">{stats.level}</Text>
                  <Text modifiers={[foregroundStyle(colors.textSecondary)]}>level</Text>
                </HStack>
              </VStack>
            </HStack>
          </Section>

          {/* Quick Action */}
          <Section title="">
            <Button
              label="📸 Capture a Space"
              onPress={() => router.push('/camera')}
              modifiers={[
                buttonStyle('borderedProminent'),
                controlSize('large'),
                frame({ maxWidth: 400 }),
              ]}
            />
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

          {/* Motivation */}
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
                  "Progress, not perfection. Every small step counts!" ✨
                </Text>
              </VStack>
            </Group>
          </Section>
        </Form>
      </ScrollView>
    </Host>
  );
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
  const roomColor = RoomColors[room.type] || RoomColors.other;
  const completedTasks = room.tasks.filter(t => t.completed).length;
  const totalTasks = room.tasks.length;

  return (
    <Pressable onPress={onPress}>
      <HStack spacing={12}>
        {/* Room emoji/image */}
        <VStack
          alignment="center"
          modifiers={[
            frame({ width: 60, height: 60 }),
          ]}
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

        {/* Room info */}
        <VStack spacing={4} alignment="leading">
          <Text size={17} weight="semibold">{room.name}</Text>
          <Text size={13} modifiers={[foregroundStyle(colors.textSecondary)]}>
            {totalTasks > 0
              ? `${completedTasks}/${totalTasks} tasks • ${room.currentProgress}%`
              : 'No tasks yet'}
          </Text>
        </VStack>

        <Spacer />

        {/* Progress indicator */}
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
});
