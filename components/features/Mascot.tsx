/**
 * Declutterly - Mascot Component
 * Animated tamagotchi-style cleaning companion
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text as RNText,
  useColorScheme,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useDeclutter } from '@/context/DeclutterContext';
import { Colors } from '@/constants/Colors';
import { MASCOT_PERSONALITIES, MascotActivity, MascotMood } from '@/types/declutter';

interface MascotProps {
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  interactive?: boolean;
  onPress?: () => void;
}

// Get emoji based on personality, mood, and activity
function getMascotEmoji(
  personality: string,
  mood: MascotMood,
  activity: MascotActivity
): string {
  // Activity-specific emojis
  if (activity === 'cleaning') return '🧹';
  if (activity === 'cheering') return '🎉';
  if (activity === 'celebrating') return '🥳';
  if (activity === 'dancing') return '💃';
  if (activity === 'sleeping') return '😴';

  // Mood-based emojis
  switch (mood) {
    case 'ecstatic':
      return '🤩';
    case 'happy':
      return '😊';
    case 'excited':
      return '😄';
    case 'content':
      return '🙂';
    case 'neutral':
      return '😐';
    case 'sad':
      return '😢';
    case 'sleepy':
      return '😴';
    default:
      return '😊';
  }
}

// Get speech bubble text
function getSpeechBubbleText(mood: MascotMood, activity: MascotActivity, name: string): string {
  if (activity === 'cleaning') return "Let's clean together!";
  if (activity === 'cheering') return 'Great job!';
  if (activity === 'celebrating') return 'You did it!';
  if (activity === 'dancing') return 'Woohoo!';
  if (activity === 'sleeping') return 'Zzz...';

  switch (mood) {
    case 'ecstatic':
      return "I'm so happy!";
    case 'happy':
      return 'Ready to clean!';
    case 'excited':
      return "Let's go!";
    case 'content':
      return 'Nice and tidy!';
    case 'neutral':
      return 'Hey there!';
    case 'sad':
      return 'I miss you...';
    default:
      return `Hi! I'm ${name}!`;
  }
}

export function Mascot({
  size = 'medium',
  showStats = false,
  interactive = true,
  onPress,
}: MascotProps) {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  const { mascot, interactWithMascot, feedMascot } = useDeclutter();

  // Animation values
  const bounceY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const speechOpacity = useSharedValue(0);

  // Size configurations
  const sizeConfig = {
    small: { emoji: 32, container: 60, stats: false },
    medium: { emoji: 64, container: 100, stats: true },
    large: { emoji: 96, container: 150, stats: true },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    if (!mascot) return;

    // Different animations based on activity
    switch (mascot.activity) {
      case 'idle':
        // Gentle bounce
        bounceY.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        rotation.value = withTiming(0, { duration: 300 });
        break;

      case 'dancing':
        // Wiggle animation
        rotation.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 200 }),
            withTiming(10, { duration: 200 })
          ),
          -1,
          true
        );
        bounceY.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 150 }),
            withTiming(0, { duration: 150 })
          ),
          -1,
          true
        );
        break;

      case 'cheering':
        // Jump animation
        bounceY.value = withRepeat(
          withSequence(
            withSpring(-20, { damping: 5 }),
            withSpring(0, { damping: 5 })
          ),
          3,
          false
        );
        break;

      case 'celebrating':
        // Spin and jump
        rotation.value = withRepeat(
          withTiming(360, { duration: 500 }),
          2,
          false
        );
        scale.value = withRepeat(
          withSequence(
            withSpring(1.2),
            withSpring(1)
          ),
          3,
          false
        );
        break;

      case 'cleaning':
        // Sweeping motion
        rotation.value = withRepeat(
          withSequence(
            withTiming(-15, { duration: 300 }),
            withTiming(15, { duration: 300 })
          ),
          -1,
          true
        );
        break;

      case 'sleeping':
        // Gentle breathing
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 2000 }),
            withTiming(1, { duration: 2000 })
          ),
          -1,
          true
        );
        break;
    }
  }, [mascot?.activity]);

  // Show speech bubble on mood change
  useEffect(() => {
    if (mascot) {
      speechOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 300 })
      );
    }
  }, [mascot?.mood, mascot?.activity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounceY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const speechBubbleStyle = useAnimatedStyle(() => ({
    opacity: speechOpacity.value,
    transform: [{ scale: speechOpacity.value }],
  }));

  function handlePress() {
    if (!interactive) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    interactWithMascot();
    onPress?.();

    // Trigger bounce
    scale.value = withSequence(
      withSpring(0.9),
      withSpring(1.1),
      withSpring(1)
    );
  }

  if (!mascot) {
    return null;
  }

  const personalityInfo = MASCOT_PERSONALITIES[mascot.personality];
  const emoji = getMascotEmoji(mascot.personality, mascot.mood, mascot.activity);
  const speechText = getSpeechBubbleText(mascot.mood, mascot.activity, mascot.name);

  return (
    <View style={styles.wrapper}>
      {/* Speech Bubble */}
      <Animated.View style={[styles.speechBubble, speechBubbleStyle, { backgroundColor: colors.card }]}>
        <RNText style={[styles.speechText, { color: colors.text }]}>{speechText}</RNText>
        <View style={[styles.speechTail, { borderTopColor: colors.card }]} />
      </Animated.View>

      {/* Mascot Container */}
      <Pressable onPress={handlePress} disabled={!interactive}>
        <Animated.View
          style={[
            styles.container,
            animatedStyle,
            {
              width: config.container,
              height: config.container,
              backgroundColor: personalityInfo.color + '30',
              borderColor: personalityInfo.color,
            },
          ]}
        >
          <RNText style={{ fontSize: config.emoji }}>{emoji}</RNText>
        </Animated.View>
      </Pressable>

      {/* Name */}
      <RNText style={[styles.name, { color: colors.text }]}>{mascot.name}</RNText>

      {/* Stats */}
      {showStats && config.stats && (
        <View style={styles.statsContainer}>
          {/* Hunger Bar */}
          <View style={styles.statRow}>
            <RNText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Hunger
            </RNText>
            <View style={[styles.statBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.statFill,
                  {
                    width: `${mascot.hunger}%`,
                    backgroundColor: mascot.hunger > 30 ? colors.success : colors.danger,
                  },
                ]}
              />
            </View>
          </View>

          {/* Happiness Bar */}
          <View style={styles.statRow}>
            <RNText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Happy
            </RNText>
            <View style={[styles.statBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.statFill,
                  {
                    width: `${mascot.happiness}%`,
                    backgroundColor: mascot.happiness > 30 ? '#FFD700' : colors.warning,
                  },
                ]}
              />
            </View>
          </View>

          {/* Level */}
          <RNText style={[styles.levelText, { color: colors.textSecondary }]}>
            Lv. {mascot.level} • {mascot.xp} XP
          </RNText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  speechBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: 150,
  },
  speechText: {
    fontSize: 12,
    textAlign: 'center',
  },
  speechTail: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  container: {
    borderRadius: 999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  statsContainer: {
    marginTop: 12,
    width: 120,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    width: 45,
  },
  statBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 3,
  },
  levelText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default Mascot;
