/**
 * Declutterly - Collectible Spawn Overlay
 * Animated overlay that appears when a collectible spawns
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text as RNText,
  useColorScheme,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useDeclutter } from '@/context/DeclutterContext';
import { Colors } from '@/constants/Colors';
import { RARITY_COLORS, SpawnEvent } from '@/types/declutter';

const { width, height } = Dimensions.get('window');

interface CollectibleSpawnProps {
  spawn: SpawnEvent;
  onCollect: () => void;
  onDismiss: () => void;
}

export function CollectibleSpawn({ spawn, onCollect, onDismiss }: CollectibleSpawnProps) {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  const { collectItem } = useDeclutter();

  const [timeLeft, setTimeLeft] = useState(30);
  const [collected, setCollected] = useState(false);

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const bounce = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const collectScale = useSharedValue(1);
  const floatY = useSharedValue(0);

  // Calculate position
  const posX = spawn.position.x * width;
  const posY = spawn.position.y * height;

  useEffect(() => {
    // Entry animation
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });

    // Continuous float animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 500 }),
        withTiming(0.4, { duration: 500 })
      ),
      -1,
      true
    );

    // Slight rotation wobble
    rotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 400 }),
        withTiming(5, { duration: 400 })
      ),
      -1,
      true
    );

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  function handleTimeout() {
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDismiss)();
    });
  }

  function handleCollect() {
    if (collected) return;
    setCollected(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Collection animation
    collectScale.value = withSequence(
      withSpring(1.5, { damping: 4 }),
      withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
    );

    rotation.value = withTiming(720, { duration: 500 });

    setTimeout(() => {
      collectItem(spawn.collectible.id);
      onCollect();
    }, 500);
  }

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value * collectScale.value },
      { translateY: floatY.value },
    ],
  }));

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const rarityColor = RARITY_COLORS[spawn.collectible.rarity];

  // Import withRepeat at the top
  const { withRepeat } = require('react-native-reanimated');

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.container,
          containerStyle,
          {
            left: posX - 60,
            top: posY - 60,
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glow,
            glowStyle,
            { backgroundColor: rarityColor },
          ]}
        />

        {/* Collectible button */}
        <Pressable onPress={handleCollect} style={styles.button}>
          <View style={[styles.inner, { borderColor: rarityColor }]}>
            <Animated.Text style={[styles.emoji, emojiStyle]}>
              {spawn.collectible.emoji}
            </Animated.Text>
          </View>

          {/* Rarity badge */}
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
            <RNText style={styles.rarityText}>
              {spawn.collectible.rarity.charAt(0).toUpperCase()}
            </RNText>
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <RNText style={[styles.timerText, { color: timeLeft <= 5 ? '#FF4444' : '#fff' }]}>
              {timeLeft}s
            </RNText>
          </View>
        </Pressable>

        {/* Tap hint */}
        {!collected && (
          <RNText style={styles.hintText}>Tap to collect!</RNText>
        )}
      </Animated.View>

      {/* Collection celebration */}
      {collected && (
        <View style={[styles.celebration, { left: posX - 100, top: posY - 100 }]}>
          <RNText style={styles.celebrationText}>+{spawn.collectible.xpValue} XP!</RNText>
          <RNText style={styles.celebrationName}>{spawn.collectible.name}</RNText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    width: 120,
    height: 140,
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: 0,
  },
  button: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emoji: {
    fontSize: 36,
  },
  rarityBadge: {
    position: 'absolute',
    top: 0,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  rarityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  timerContainer: {
    position: 'absolute',
    bottom: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 4,
  },
  celebration: {
    position: 'absolute',
    width: 200,
    alignItems: 'center',
  },
  celebrationText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  celebrationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 4,
  },
});

export default CollectibleSpawn;
