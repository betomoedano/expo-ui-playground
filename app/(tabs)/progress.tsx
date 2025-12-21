/**
 * Declutterly - Progress Screen
 * Track achievements, stats, and overall progress
 */

import { Colors, ProgressColors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { BADGES, Badge } from '@/types/declutter';
import {
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
  foregroundStyle,
  frame,
  glassEffect,
  background,
} from '@expo/ui/swift-ui/modifiers';
import React, { useMemo } from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  ScrollView,
  Text as RNText,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];
  const { stats, rooms } = useDeclutter();

  // Calculate XP for next level
  const xpForNextLevel = stats.level * 100;
  const xpProgress = (stats.xp % 100) / 100;

  // Get locked and unlocked badges
  const unlockedBadges = stats.badges;
  const lockedBadges = BADGES.filter(
    b => !unlockedBadges.some(ub => ub.id === b.id)
  );

  // Calculate time spent
  const hours = Math.floor(stats.totalMinutesCleaned / 60);
  const minutes = stats.totalMinutesCleaned % 60;

  // Generate weekly activity data (mock data based on actual stats)
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1; // Convert to Mon=0

    // Simulate activity based on streak and tasks
    return days.map((day, index) => {
      let value = 0;
      if (index <= adjustedToday && stats.currentStreak > 0) {
        // More recent days have more activity
        const daysFromToday = adjustedToday - index;
        if (daysFromToday < stats.currentStreak) {
          value = Math.max(20, Math.min(100, stats.totalTasksCompleted * 5 - daysFromToday * 10));
        }
      }
      return {
        day,
        value: Math.max(0, value),
        isToday: index === adjustedToday,
      };
    });
  }, [stats.currentStreak, stats.totalTasksCompleted]);

  const maxWeeklyValue = Math.max(...weeklyData.map(d => d.value), 1);

  return (
    <Host style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Form>
          {/* Header */}
          <Section title="">
            <VStack spacing={4} alignment="leading">
              <Text size={28} weight="bold">Your Progress 📊</Text>
              <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
                Track your decluttering journey
              </Text>
            </VStack>
          </Section>

          {/* Level Progress */}
          <Section title="Level Progress">
            <VStack spacing={16} alignment="center">
              <HStack spacing={16} alignment="center">
                <VStack alignment="center">
                  <Text size={48} weight="bold">{stats.level}</Text>
                  <Text size={14} modifiers={[foregroundStyle(colors.textSecondary)]}>
                    Level
                  </Text>
                </VStack>

                <VStack spacing={8} alignment="leading">
                  <Gauge
                    current={{ value: xpProgress }}
                    type="linearCapacity"
                    modifiers={[frame({ width: 200, height: 20 })]}
                  />
                  <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
                    {stats.xp % 100} / 100 XP to next level
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Section>

          {/* Weekly Activity Chart */}
          <Section title="This Week's Activity">
            <View style={styles.weeklyChartContainer}>
              {weeklyData.map((item, index) => (
                <View key={index} style={styles.weeklyBarContainer}>
                  <View style={styles.weeklyBarWrapper}>
                    <View
                      style={[
                        styles.weeklyBar,
                        {
                          height: `${Math.max(5, (item.value / maxWeeklyValue) * 100)}%`,
                          backgroundColor: item.isToday
                            ? colors.primary
                            : item.value > 0
                            ? colors.primary + '80'
                            : colors.border,
                        },
                      ]}
                    />
                  </View>
                  <RNText
                    style={[
                      styles.weeklyDayLabel,
                      {
                        color: item.isToday ? colors.primary : colors.textSecondary,
                        fontWeight: item.isToday ? '700' : '400',
                      },
                    ]}
                  >
                    {item.day}
                  </RNText>
                  {item.isToday && (
                    <View style={[styles.todayIndicator, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              ))}
            </View>
            {stats.currentStreak > 0 && (
              <View style={[styles.streakBanner, { backgroundColor: colors.primary + '15' }]}>
                <RNText style={[styles.streakBannerText, { color: colors.primary }]}>
                  🔥 {stats.currentStreak} day streak! Keep it going!
                </RNText>
              </View>
            )}
          </Section>

          {/* Stats Grid */}
          <Section title="Statistics">
            <HStack spacing={12}>
              <StatCard
                emoji="✅"
                value={stats.totalTasksCompleted}
                label="Tasks Done"
                colors={colors}
              />
              <StatCard
                emoji="🏠"
                value={stats.totalRoomsCleaned}
                label="Rooms Cleaned"
                colors={colors}
              />
            </HStack>
            <HStack spacing={12}>
              <StatCard
                emoji="🔥"
                value={stats.currentStreak}
                label="Day Streak"
                colors={colors}
              />
              <StatCard
                emoji="⏱️"
                value={hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
                label="Time Spent"
                colors={colors}
              />
            </HStack>
            <HStack spacing={12}>
              <StatCard
                emoji="🏆"
                value={stats.longestStreak}
                label="Best Streak"
                colors={colors}
              />
              <StatCard
                emoji="🎖️"
                value={unlockedBadges.length}
                label="Badges Earned"
                colors={colors}
              />
            </HStack>
          </Section>

          {/* Earned Badges */}
          {unlockedBadges.length > 0 && (
            <Section title="🏅 Earned Badges">
              {unlockedBadges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  unlocked={true}
                  colors={colors}
                />
              ))}
            </Section>
          )}

          {/* Locked Badges */}
          <Section title="🔒 Badges to Earn">
            {lockedBadges.slice(0, 5).map(badge => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                unlocked={false}
                colors={colors}
                stats={stats}
              />
            ))}
          </Section>

          {/* Room Progress */}
          {rooms.length > 0 && (
            <Section title="Room Progress">
              {rooms.map(room => (
                <HStack key={room.id} spacing={12}>
                  <Text size={24}>{room.emoji}</Text>
                  <VStack spacing={4} alignment="leading">
                    <Text weight="medium">{room.name}</Text>
                    <Gauge
                      current={{ value: room.currentProgress / 100 }}
                      type="linearCapacity"
                      modifiers={[frame({ width: 150, height: 8 })]}
                    />
                  </VStack>
                  <Spacer />
                  <Text weight="semibold">{room.currentProgress}%</Text>
                </HStack>
              ))}
            </Section>
          )}

          {/* Motivation */}
          <Section title="">
            <Group
              modifiers={[
                glassEffect({ glass: { variant: 'regular', interactive: false } }),
                frame({ minHeight: 60 }),
              ]}
            >
              <Text size={15}>
                {stats.totalTasksCompleted === 0
                  ? "Your journey begins with a single task. You've got this! 💪"
                  : stats.totalTasksCompleted < 10
                  ? "Great start! Keep the momentum going! 🚀"
                  : stats.totalTasksCompleted < 50
                  ? "You're making amazing progress! 🌟"
                  : "You're a decluttering superstar! 👑"}
              </Text>
            </Group>
          </Section>
        </Form>
      </ScrollView>
    </Host>
  );
}

// Stat Card Component
function StatCard({
  emoji,
  value,
  label,
  colors,
}: {
  emoji: string;
  value: number | string;
  label: string;
  colors: typeof Colors.light;
}) {
  return (
    <Group
      modifiers={[
        glassEffect({ glass: { variant: 'regular', interactive: true } }),
        frame({ minWidth: 140, minHeight: 80 }),
      ]}
    >
      <VStack spacing={4} alignment="center">
        <Text size={24}>{emoji}</Text>
        <Text size={20} weight="bold">{value}</Text>
        <Text size={12} modifiers={[foregroundStyle(colors.textSecondary)]}>
          {label}
        </Text>
      </VStack>
    </Group>
  );
}

// Badge Card Component
function BadgeCard({
  badge,
  unlocked,
  colors,
  stats,
}: {
  badge: Badge;
  unlocked: boolean;
  colors: typeof Colors.light;
  stats?: ReturnType<typeof useDeclutter>['stats'];
}) {
  // Calculate progress for locked badges
  let progress = 0;
  if (!unlocked && stats) {
    switch (badge.type) {
      case 'tasks':
        progress = Math.min(1, stats.totalTasksCompleted / badge.requirement);
        break;
      case 'rooms':
        progress = Math.min(1, stats.totalRoomsCleaned / badge.requirement);
        break;
      case 'streak':
        progress = Math.min(1, stats.currentStreak / badge.requirement);
        break;
      case 'time':
        progress = Math.min(1, stats.totalMinutesCleaned / badge.requirement);
        break;
    }
  }

  return (
    <HStack spacing={12}>
      <Text size={32} modifiers={unlocked ? [] : [foregroundStyle('#999999')]}>
        {badge.emoji}
      </Text>
      <VStack spacing={2} alignment="leading">
        <Text weight="semibold" modifiers={unlocked ? [] : [foregroundStyle('#999999')]}>
          {badge.name}
        </Text>
        <Text
          size={13}
          modifiers={[foregroundStyle(colors.textSecondary)]}
        >
          {badge.description}
        </Text>
        {!unlocked && stats && (
          <Gauge
            current={{ value: progress }}
            type="linearCapacity"
            modifiers={[frame({ width: 100, height: 6 })]}
          />
        )}
      </VStack>
      <Spacer />
      {unlocked && (
        <Text size={13} modifiers={[foregroundStyle(colors.success)]}>
          ✓ Earned
        </Text>
      )}
    </HStack>
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
  // Weekly Chart Styles
  weeklyChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  weeklyBarContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  weeklyBarWrapper: {
    width: '70%',
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  weeklyBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  weeklyDayLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  todayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: -10,
  },
  streakBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  streakBannerText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
