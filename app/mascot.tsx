/**
 * Declutterly - Mascot Screen
 * Full mascot view with stats, interactions, and customization
 */

import { Colors } from '@/constants/Colors';
import { useDeclutter } from '@/context/DeclutterContext';
import { MASCOT_PERSONALITIES } from '@/types/declutter';
import { Mascot } from '@/components/features/Mascot';
import { router } from 'expo-router';
import React from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  Pressable,
  Text as RNText,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export default function MascotScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  const { mascot, interactWithMascot, feedMascot, stats } = useDeclutter();

  if (!mascot) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <RNText style={[styles.backText, { color: colors.primary }]}>Back</RNText>
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <RNText style={styles.emptyEmoji}>🥺</RNText>
          <RNText style={[styles.emptyTitle, { color: colors.text }]}>
            No Buddy Yet
          </RNText>
          <RNText style={[styles.emptyText, { color: colors.textSecondary }]}>
            Complete the onboarding to choose your cleaning companion!
          </RNText>
        </View>
      </View>
    );
  }

  const personalityInfo = MASCOT_PERSONALITIES[mascot.personality];
  const xpToNextLevel = (mascot.level * 50) - mascot.xp;

  const handlePet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    interactWithMascot();
  };

  const handleFeed = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    feedMascot();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <RNText style={[styles.backText, { color: colors.primary }]}>Back</RNText>
        </Pressable>
        <RNText style={[styles.title, { color: colors.text }]}>Your Buddy</RNText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Mascot Display */}
        <View style={[styles.mascotSection, { backgroundColor: personalityInfo.color + '20' }]}>
          <Mascot size="large" showStats interactive onPress={handlePet} />
          <RNText style={[styles.tapHint, { color: colors.textSecondary }]}>
            Tap to interact!
          </RNText>
        </View>

        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <RNText style={[styles.sectionTitle, { color: colors.text }]}>Stats</RNText>

          {/* Level Progress */}
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <RNText style={[styles.levelText, { color: colors.text }]}>
                Level {mascot.level}
              </RNText>
              <RNText style={[styles.xpText, { color: colors.textSecondary }]}>
                {mascot.xp} / {mascot.level * 50} XP
              </RNText>
            </View>
            <View style={[styles.xpBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.xpFill,
                  {
                    width: `${(mascot.xp / (mascot.level * 50)) * 100}%`,
                    backgroundColor: personalityInfo.color,
                  },
                ]}
              />
            </View>
            <RNText style={[styles.xpHint, { color: colors.textSecondary }]}>
              {xpToNextLevel} XP to next level
            </RNText>
          </View>

          {/* Stat Bars */}
          <View style={styles.statBars}>
            <StatBar
              label="Hunger"
              value={mascot.hunger}
              color="#22C55E"
              colors={colors}
            />
            <StatBar
              label="Energy"
              value={mascot.energy}
              color="#3B82F6"
              colors={colors}
            />
            <StatBar
              label="Happiness"
              value={mascot.happiness}
              color="#F59E0B"
              colors={colors}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <RNText style={[styles.sectionTitle, { color: colors.text }]}>Actions</RNText>

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={handleFeed}
            >
              <RNText style={styles.actionEmoji}>🍎</RNText>
              <RNText style={styles.actionText}>Feed</RNText>
              <RNText style={styles.actionHint}>+20 Hunger</RNText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handlePet}
            >
              <RNText style={styles.actionEmoji}>👋</RNText>
              <RNText style={styles.actionText}>Pet</RNText>
              <RNText style={styles.actionHint}>+15 Happy</RNText>
            </Pressable>

            <Pressable
              style={[styles.actionButton, { backgroundColor: '#A855F7' }]}
              onPress={() => router.push('/focus?duration=25')}
            >
              <RNText style={styles.actionEmoji}>🧹</RNText>
              <RNText style={styles.actionText}>Clean</RNText>
              <RNText style={styles.actionHint}>Together!</RNText>
            </Pressable>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <RNText style={[styles.sectionTitle, { color: colors.text }]}>About</RNText>
          <View style={styles.infoRow}>
            <RNText style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Personality
            </RNText>
            <RNText style={[styles.infoValue, { color: colors.text }]}>
              {personalityInfo.emoji} {personalityInfo.name}
            </RNText>
          </View>
          <View style={styles.infoRow}>
            <RNText style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Current Mood
            </RNText>
            <RNText style={[styles.infoValue, { color: colors.text }]}>
              {getMoodEmoji(mascot.mood)} {mascot.mood}
            </RNText>
          </View>
          <View style={styles.infoRow}>
            <RNText style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Tasks Together
            </RNText>
            <RNText style={[styles.infoValue, { color: colors.text }]}>
              {stats.totalTasksCompleted}
            </RNText>
          </View>
          <View style={styles.infoRow}>
            <RNText style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Days Together
            </RNText>
            <RNText style={[styles.infoValue, { color: colors.text }]}>
              {Math.floor((Date.now() - new Date(mascot.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1}
            </RNText>
          </View>
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: personalityInfo.color + '20' }]}>
          <RNText style={styles.tipsEmoji}>💡</RNText>
          <RNText style={[styles.tipsText, { color: colors.text }]}>
            Complete tasks to feed {mascot.name} and keep them happy! A happy buddy means more motivation for you.
          </RNText>
        </View>
      </ScrollView>
    </View>
  );
}

function StatBar({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: number;
  color: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.statBarContainer}>
      <View style={styles.statBarHeader}>
        <RNText style={[styles.statBarLabel, { color: colors.textSecondary }]}>
          {label}
        </RNText>
        <RNText style={[styles.statBarValue, { color: colors.text }]}>
          {value}%
        </RNText>
      </View>
      <View style={[styles.statBarBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.statBarFill,
            { width: `${value}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function getMoodEmoji(mood: string): string {
  switch (mood) {
    case 'ecstatic': return '🤩';
    case 'happy': return '😊';
    case 'excited': return '😄';
    case 'content': return '🙂';
    case 'neutral': return '😐';
    case 'sad': return '😢';
    case 'sleepy': return '😴';
    default: return '😊';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 50,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  mascotSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 24,
    marginBottom: 20,
  },
  tapHint: {
    fontSize: 13,
    marginTop: 8,
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  levelSection: {
    marginBottom: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  xpText: {
    fontSize: 14,
  },
  xpBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 5,
  },
  xpHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  statBars: {
    gap: 12,
  },
  statBarContainer: {
    gap: 4,
  },
  statBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBarLabel: {
    fontSize: 13,
  },
  statBarValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  statBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  actionHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipsEmoji: {
    fontSize: 24,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
});
