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
  withRepeat,
  runOnJS,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
  ZoomIn,
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

// Particle component for celebration effect
function Particle({ delay, color }: { delay: number; color: string }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 150;
    const randomY = -Math.random() * 100 - 50;

    scale.value = withSequence(
      withTiming(0, { duration: delay }),
      withSpring(1, { damping: 8 }),
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
    );

    translateX.value = withSequence(
      withTiming(0, { duration: delay }),
      withTiming(randomX, { duration: 800, easing: Easing.out(Easing.ease) })
    );

    translateY.value = withSequence(
      withTiming(0, { duration: delay }),
      withTiming(randomY, { duration: 800, easing: Easing.out(Easing.ease) })
    );

    opacity.value = withSequence(
      withTiming(1, { duration: delay }),
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 400 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, animatedStyle, { backgroundColor: color }]} />
  );
}

export function CollectibleSpawn({ spawn, onCollect, onDismiss }: CollectibleSpawnProps) {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  const { collectItem } = useDeclutter();

  const [timeLeft, setTimeLeft] = useState(30);
  const [collected, setCollected] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const collectScale = useSharedValue(1);
  const floatY = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);

  // Calculate position
  const posX = spawn.position.x * width;
  const posY = spawn.position.y * height;
  const rarityColor = RARITY_COLORS[spawn.collectible.rarity];

  useEffect(() => {
    // Entry animation
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });

    // Continuous float animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 600 }),
        withTiming(0.5, { duration: 600 })
      ),
      -1,
      true
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );

    // Slight rotation wobble
    rotation.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 500 }),
        withTiming(8, { duration: 500 })
      ),
      -1,
      true
    );

    // Ring pulse effect
    ringScale.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 0 }),
        withTiming(1.8, { duration: 1500, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );

    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 0 }),
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
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
    setShowParticles(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Collection animation
    collectScale.value = withSequence(
      withSpring(1.3, { damping: 4 }),
      withTiming(0, { duration: 400, easing: Easing.in(Easing.back(2)) })
    );

    rotation.value = withTiming(720, { duration: 600, easing: Easing.out(Easing.ease) });

    setTimeout(() => {
      collectItem(spawn.collectible.id);
      onCollect();
    }, 600);
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
    transform: [{ scale: glowScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  // Get rarity label
  const getRarityLabel = () => {
    switch (spawn.collectible.rarity) {
      case 'legendary': return 'LEGENDARY!';
      case 'epic': return 'EPIC!';
      case 'rare': return 'RARE!';
      case 'uncommon': return 'Nice!';
      default: return '';
    }
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Background dim for rare+ items */}
      {['rare', 'epic', 'legendary'].includes(spawn.collectible.rarity) && !collected && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.dimBackground, { opacity: spawn.collectible.rarity === 'legendary' ? 0.4 : 0.2 }]}
        />
      )}

      <Animated.View
        style={[
          styles.container,
          containerStyle,
          {
            left: posX - 70,
            top: posY - 70,
          },
        ]}
      >
        {/* Expanding ring effect */}
        <Animated.View
          style={[
            styles.ring,
            ringStyle,
            { borderColor: rarityColor },
          ]}
        />

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
          <View style={[styles.inner, { borderColor: rarityColor, shadowColor: rarityColor }]}>
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

          {/* Timer with progress ring */}
          <View style={styles.timerContainer}>
            <View style={[styles.timerProgress, { backgroundColor: timeLeft <= 5 ? '#FF4444' : rarityColor }]}>
              <View
                style={[
                  styles.timerProgressFill,
                  {
                    width: `${(timeLeft / 30) * 100}%`,
                    backgroundColor: timeLeft <= 5 ? '#FF6666' : rarityColor,
                  },
                ]}
              />
            </View>
            <RNText style={[styles.timerText, { color: timeLeft <= 5 ? '#FF4444' : '#fff' }]}>
              {timeLeft}s
            </RNText>
          </View>
        </Pressable>

        {/* Tap hint */}
        {!collected && (
          <View style={styles.hintContainer}>
            <RNText style={styles.hintText}>Tap to collect!</RNText>
            {getRarityLabel() && (
              <RNText style={[styles.rarityLabel, { color: rarityColor }]}>
                {getRarityLabel()}
              </RNText>
            )}
          </View>
        )}

        {/* Particles */}
        {showParticles && (
          <View style={styles.particlesContainer}>
            {Array.from({ length: 12 }).map((_, i) => (
              <Particle key={i} delay={i * 30} color={rarityColor} />
            ))}
          </View>
        )}
      </Animated.View>

      {/* Collection celebration */}
      {collected && (
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          style={[styles.celebration, { left: posX - 100, top: posY - 80 }]}
        >
          <RNText style={[styles.celebrationXP, { color: rarityColor }]}>
            +{spawn.collectible.xpValue} XP
          </RNText>
          <RNText style={styles.celebrationName}>{spawn.collectible.name}</RNText>
          <View style={[styles.celebrationBadge, { backgroundColor: rarityColor }]}>
            <RNText style={styles.celebrationEmoji}>{spawn.collectible.emoji}</RNText>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  dimBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  container: {
    position: 'absolute',
    width: 140,
    height: 160,
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    top: 10,
    left: 20,
  },
  glow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    top: 5,
    left: 15,
  },
  button: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  inner: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  emoji: {
    fontSize: 40,
  },
  rarityBadge: {
    position: 'absolute',
    top: -5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  rarityText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  timerContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    gap: 2,
  },
  timerProgress: {
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hintContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  hintText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  rarityLabel: {
    fontSize: 11,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
  particlesContainer: {
    position: 'absolute',
    top: 50,
    left: 70,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  celebration: {
    position: 'absolute',
    width: 200,
    alignItems: 'center',
  },
  celebrationXP: {
    fontSize: 36,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  celebrationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginTop: 4,
  },
  celebrationBadge: {
    marginTop: 8,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  celebrationEmoji: {
    fontSize: 24,
  },
});

export default CollectibleSpawn;
