/**
 * Declutterly - Mascot Component
 * Animated tamagotchi-style cleaning companion with rich animations
 */

import React, { useEffect, useMemo } from 'react';
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
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
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

// Sparkle effect for happy states
function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 300 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withSpring(1, { damping: 8 }),
          withTiming(0, { duration: 300 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      )
    );

    rotation.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(180, { duration: 600 }),
          withTiming(180, { duration: 600 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        animatedStyle,
        { left: x, top: y },
      ]}
    >
      ✨
    </Animated.Text>
  );
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
  if (activity === 'cleaning') return "Let's clean!";
  if (activity === 'cheering') return 'Great job!';
  if (activity === 'celebrating') return 'You did it!';
  if (activity === 'dancing') return 'Woohoo!';
  if (activity === 'sleeping') return 'Zzz...';

  switch (mood) {
    case 'ecstatic':
      return "I'm so happy!";
    case 'happy':
      return 'Ready!';
    case 'excited':
      return "Let's go!";
    case 'content':
      return 'Nice!';
    case 'neutral':
      return 'Hey!';
    case 'sad':
      return 'Miss you...';
    default:
      return `Hi!`;
  }
}

// Mood indicator color
function getMoodColor(mood: MascotMood): string {
  switch (mood) {
    case 'ecstatic':
      return '#FFD700';
    case 'happy':
      return '#22C55E';
    case 'excited':
      return '#3B82F6';
    case 'content':
      return '#10B981';
    case 'neutral':
      return '#6B7280';
    case 'sad':
      return '#EF4444';
    case 'sleepy':
      return '#8B5CF6';
    default:
      return '#22C55E';
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

  const { mascot, interactWithMascot } = useDeclutter();

  // Animation values
  const bounceY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const speechOpacity = useSharedValue(0);
  const eyeScale = useSharedValue(1);

  // Size configurations
  const sizeConfig = {
    small: { emoji: 28, container: 56, stats: false, glow: 70 },
    medium: { emoji: 56, container: 90, stats: true, glow: 110 },
    large: { emoji: 80, container: 130, stats: true, glow: 160 },
  };

  const config = sizeConfig[size];

  // Generate sparkle positions
  const sparkles = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => {
      const angle = (i / 4) * Math.PI * 2;
      const radius = config.container * 0.7;
      return {
        id: i,
        delay: i * 300,
        x: Math.cos(angle) * radius + config.container / 2 - 8,
        y: Math.sin(angle) * radius + config.container / 2 - 8,
      };
    });
  }, [config.container]);

  useEffect(() => {
    if (!mascot) return;

    // Glow animation (always active)
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500 }),
        withTiming(0.2, { duration: 1500 })
      ),
      -1,
      true
    );

    // Eye blink animation
    eyeScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      ),
      -1,
      false
    );

    // Different animations based on activity
    switch (mascot.activity) {
      case 'idle':
        // Gentle bounce
        bounceY.value = withRepeat(
          withSequence(
            withTiming(-6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        rotation.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(1, { duration: 300 });
        break;

      case 'dancing':
        // Wiggle animation
        rotation.value = withRepeat(
          withSequence(
            withTiming(-12, { duration: 180, easing: Easing.inOut(Easing.ease) }),
            withTiming(12, { duration: 180, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        bounceY.value = withRepeat(
          withSequence(
            withTiming(-12, { duration: 140 }),
            withTiming(0, { duration: 140 })
          ),
          -1,
          true
        );
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 180 }),
            withTiming(0.95, { duration: 180 })
          ),
          -1,
          true
        );
        break;

      case 'cheering':
        // Jump animation
        bounceY.value = withRepeat(
          withSequence(
            withSpring(-25, { damping: 6, stiffness: 200 }),
            withSpring(0, { damping: 8 })
          ),
          4,
          false
        );
        scale.value = withRepeat(
          withSequence(
            withSpring(1.15),
            withSpring(1)
          ),
          4,
          false
        );
        break;

      case 'celebrating':
        // Spin and jump
        rotation.value = withSequence(
          withTiming(360, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(720, { duration: 400, easing: Easing.out(Easing.ease) })
        );
        scale.value = withSequence(
          withSpring(1.25),
          withSpring(1),
          withSpring(1.15),
          withSpring(1)
        );
        bounceY.value = withSequence(
          withSpring(-20),
          withSpring(0)
        );
        break;

      case 'cleaning':
        // Sweeping motion
        rotation.value = withRepeat(
          withSequence(
            withTiming(-18, { duration: 280, easing: Easing.inOut(Easing.ease) }),
            withTiming(18, { duration: 280, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        bounceY.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 280 }),
            withTiming(3, { duration: 280 })
          ),
          -1,
          true
        );
        break;

      case 'sleeping':
        // Gentle breathing
        scale.value = withRepeat(
          withSequence(
            withTiming(1.06, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        bounceY.value = withRepeat(
          withSequence(
            withTiming(-2, { duration: 2500 }),
            withTiming(2, { duration: 2500 })
          ),
          -1,
          true
        );
        rotation.value = withTiming(5, { duration: 500 });
        break;
    }
  }, [mascot?.activity]);

  // Show speech bubble on mood change
  useEffect(() => {
    if (mascot) {
      speechOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 2500 }),
        withTiming(0, { duration: 200 })
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

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const speechBubbleStyle = useAnimatedStyle(() => ({
    opacity: speechOpacity.value,
    transform: [
      { scale: interpolate(speechOpacity.value, [0, 1], [0.8, 1]) },
      { translateY: interpolate(speechOpacity.value, [0, 1], [10, 0]) },
    ],
  }));

  function handlePress() {
    if (!interactive) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    interactWithMascot();
    onPress?.();

    // Trigger happy bounce
    scale.value = withSequence(
      withSpring(0.85, { damping: 6 }),
      withSpring(1.15, { damping: 6 }),
      withSpring(1, { damping: 8 })
    );
    rotation.value = withSequence(
      withTiming(-15, { duration: 100 }),
      withTiming(15, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  }

  if (!mascot) {
    return null;
  }

  const personalityInfo = MASCOT_PERSONALITIES[mascot.personality];
  const emoji = getMascotEmoji(mascot.personality, mascot.mood, mascot.activity);
  const speechText = getSpeechBubbleText(mascot.mood, mascot.activity, mascot.name);
  const moodColor = getMoodColor(mascot.mood);
  const isHappy = ['ecstatic', 'happy', 'excited'].includes(mascot.mood);

  return (
    <View style={[styles.wrapper, { minHeight: config.container + 80 }]}>
      {/* Speech Bubble */}
      <Animated.View
        style={[
          styles.speechBubble,
          speechBubbleStyle,
          { backgroundColor: colors.card },
        ]}
      >
        <RNText style={[styles.speechText, { color: colors.text }]}>
          {speechText}
        </RNText>
        <View style={[styles.speechTail, { borderTopColor: colors.card }]} />
      </Animated.View>

      {/* Mascot Container with Glow */}
      <View style={[styles.mascotWrapper, { width: config.glow, height: config.glow }]}>
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glow,
            glowStyle,
            {
              width: config.glow,
              height: config.glow,
              borderRadius: config.glow / 2,
              backgroundColor: personalityInfo.color,
            },
          ]}
        />

        {/* Sparkles for happy moods */}
        {isHappy && sparkles.map(s => (
          <Sparkle key={s.id} delay={s.delay} x={s.x} y={s.y} />
        ))}

        {/* Main mascot */}
        <Pressable onPress={handlePress} disabled={!interactive}>
          <Animated.View
            style={[
              styles.container,
              animatedStyle,
              {
                width: config.container,
                height: config.container,
                backgroundColor: personalityInfo.color + '25',
                borderColor: personalityInfo.color,
                shadowColor: personalityInfo.color,
              },
            ]}
          >
            <RNText style={{ fontSize: config.emoji }}>{emoji}</RNText>

            {/* Mood indicator dot */}
            <View
              style={[
                styles.moodDot,
                { backgroundColor: moodColor, borderColor: colors.card },
              ]}
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* Name with level badge */}
      <View style={styles.nameContainer}>
        <RNText style={[styles.name, { color: colors.text }]}>{mascot.name}</RNText>
        <View style={[styles.levelBadge, { backgroundColor: personalityInfo.color }]}>
          <RNText style={styles.levelBadgeText}>Lv.{mascot.level}</RNText>
        </View>
      </View>

      {/* Stats */}
      {showStats && config.stats && (
        <View style={styles.statsContainer}>
          {/* Compact stat bars */}
          <View style={styles.compactStats}>
            <View style={styles.compactStatItem}>
              <RNText style={styles.statIcon}>🍎</RNText>
              <View style={[styles.compactStatBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.compactStatFill,
                    {
                      width: `${mascot.hunger}%`,
                      backgroundColor: mascot.hunger > 30 ? '#22C55E' : '#EF4444',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.compactStatItem}>
              <RNText style={styles.statIcon}>⚡</RNText>
              <View style={[styles.compactStatBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.compactStatFill,
                    {
                      width: `${mascot.energy}%`,
                      backgroundColor: mascot.energy > 30 ? '#3B82F6' : '#F59E0B',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.compactStatItem}>
              <RNText style={styles.statIcon}>💖</RNText>
              <View style={[styles.compactStatBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.compactStatFill,
                    {
                      width: `${mascot.happiness}%`,
                      backgroundColor: mascot.happiness > 30 ? '#EC4899' : '#6B7280',
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* XP Progress */}
          <View style={styles.xpContainer}>
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
            <RNText style={[styles.xpText, { color: colors.textSecondary }]}>
              {mascot.xp}/{mascot.level * 50} XP
            </RNText>
          </View>
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speechText: {
    fontSize: 13,
    fontWeight: '600',
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
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 14,
  },
  container: {
    borderRadius: 999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  moodDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  statsContainer: {
    marginTop: 14,
    width: 140,
    gap: 10,
  },
  compactStats: {
    gap: 6,
  },
  compactStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    fontSize: 12,
    width: 18,
  },
  compactStatBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  compactStatFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpContainer: {
    gap: 4,
  },
  xpBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
  },
  xpText: {
    fontSize: 10,
    textAlign: 'center',
  },
});

export default Mascot;
