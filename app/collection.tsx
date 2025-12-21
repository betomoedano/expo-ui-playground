/**
 * Declutterly - Collection Screen
 * View all collected items with rarity, stats, and animations
 */

import {
  Host,
  VStack,
  HStack,
  Text,
  Section,
  Button,
} from '@expo/ui/swift-ui';
import {
  frame,
  foregroundStyle,
  padding,
  cornerRadius,
} from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  useColorScheme,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Text as RNText,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useDeclutter } from '@/context/DeclutterContext';
import { Colors } from '@/constants/Colors';
import {
  COLLECTIBLES,
  RARITY_COLORS,
  CollectibleRarity,
  CollectibleCategory,
  Collectible,
} from '@/types/declutter';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 4;

type FilterType = 'all' | CollectibleCategory;

export default function CollectionScreen() {
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  const { collection, collectionStats, stats } = useDeclutter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<Collectible | null>(null);

  // Get count of each collectible
  const collectibleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    collection.forEach(item => {
      counts[item.collectibleId] = (counts[item.collectibleId] || 0) + 1;
    });
    return counts;
  }, [collection]);

  // Filter collectibles
  const filteredCollectibles = useMemo(() => {
    let items = COLLECTIBLES;
    if (filter !== 'all') {
      items = items.filter(c => c.category === filter);
    }
    return items;
  }, [filter]);

  // Calculate completion percentage
  const totalCollectibles = COLLECTIBLES.filter(c => !c.isSpecial).length;
  const uniqueOwned = collectionStats.uniqueCollected;
  const completionPercent = Math.round((uniqueOwned / totalCollectibles) * 100);

  const categories: { key: FilterType; label: string; emoji: string }[] = [
    { key: 'all', label: 'All', emoji: '📦' },
    { key: 'sparkles', label: 'Sparkles', emoji: '✨' },
    { key: 'tools', label: 'Tools', emoji: '🧹' },
    { key: 'creatures', label: 'Creatures', emoji: '🐰' },
    { key: 'treasures', label: 'Treasures', emoji: '💎' },
    { key: 'special', label: 'Special', emoji: '⭐' },
  ];

  function handleItemPress(item: Collectible) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
  }

  function getRarityGlow(rarity: CollectibleRarity): string {
    return RARITY_COLORS[rarity] + '40';
  }

  function isOwned(itemId: string): boolean {
    return collectibleCounts[itemId] > 0;
  }

  function canUnlock(item: Collectible): boolean {
    return stats.totalTasksCompleted >= item.requiredTasks;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <RNText style={[styles.backText, { color: colors.primary }]}>Back</RNText>
        </Pressable>
        <RNText style={[styles.title, { color: colors.text }]}>Collection</RNText>
        <View style={styles.placeholder} />
      </View>

      {/* Stats Overview */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <RNText style={[styles.statValue, { color: colors.text }]}>
              {collectionStats.totalCollected}
            </RNText>
            <RNText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total
            </RNText>
          </View>
          <View style={styles.statItem}>
            <RNText style={[styles.statValue, { color: colors.text }]}>
              {uniqueOwned}/{totalCollectibles}
            </RNText>
            <RNText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Unique
            </RNText>
          </View>
          <View style={styles.statItem}>
            <RNText style={[styles.statValue, { color: colors.primary }]}>
              {completionPercent}%
            </RNText>
            <RNText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Complete
            </RNText>
          </View>
        </View>

        {/* Rarity Breakdown */}
        <View style={styles.rarityRow}>
          {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as CollectibleRarity[]).map(rarity => {
            const countKey = `${rarity}Count` as 'commonCount' | 'uncommonCount' | 'rareCount' | 'epicCount' | 'legendaryCount';
            return (
              <View key={rarity} style={styles.rarityItem}>
                <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity] }]} />
                <RNText style={[styles.rarityCount, { color: colors.textSecondary }]}>
                  {collectionStats[countKey]}
                </RNText>
              </View>
            );
          })}
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map(cat => (
          <Pressable
            key={cat.key}
            onPress={() => {
              setFilter(cat.key);
              Haptics.selectionAsync();
            }}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === cat.key ? colors.primary : colors.card,
              },
            ]}
          >
            <RNText style={styles.filterEmoji}>{cat.emoji}</RNText>
            <RNText
              style={[
                styles.filterText,
                { color: filter === cat.key ? '#fff' : colors.text },
              ]}
            >
              {cat.label}
            </RNText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Empty State */}
      {collectionStats.totalCollected === 0 && (
        <View style={[styles.emptyStateContainer, { backgroundColor: colors.background }]}>
          <View style={styles.emptyStateContent}>
            <View style={styles.emptyStateIllustration}>
              <RNText style={styles.emptyStateMainEmoji}>🎁</RNText>
              <View style={styles.emptyStateFloatingEmojis}>
                <RNText style={styles.floatingEmoji1}>✨</RNText>
                <RNText style={styles.floatingEmoji2}>⭐</RNText>
                <RNText style={styles.floatingEmoji3}>💫</RNText>
              </View>
            </View>
            <RNText style={[styles.emptyStateTitle, { color: colors.text }]}>
              Start Your Collection!
            </RNText>
            <RNText style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
              Complete cleaning tasks to discover rare collectibles. Each task has a chance to spawn magical items!
            </RNText>
            <View style={[styles.emptyStateTip, { backgroundColor: colors.primary + '15' }]}>
              <RNText style={[styles.emptyStateTipText, { color: colors.primary }]}>
                💡 Complete your first task to unlock collectible spawns
              </RNText>
            </View>
            <Pressable
              style={[styles.emptyStateCTA, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/camera')}
            >
              <RNText style={styles.emptyStateCTAText}>Start Cleaning</RNText>
            </Pressable>
          </View>
        </View>
      )}

      {/* Collection Grid */}
      {collectionStats.totalCollected > 0 && (
      <ScrollView style={styles.gridScroll} contentContainerStyle={styles.gridContent}>
        <View style={styles.grid}>
          {filteredCollectibles.map(item => {
            const owned = isOwned(item.id);
            const unlockable = canUnlock(item);
            const count = collectibleCounts[item.id] || 0;

            return (
              <Pressable
                key={item.id}
                onPress={() => handleItemPress(item)}
                style={[
                  styles.gridItem,
                  {
                    backgroundColor: owned
                      ? getRarityGlow(item.rarity)
                      : colors.card,
                    borderColor: owned ? RARITY_COLORS[item.rarity] : colors.border,
                    opacity: unlockable ? 1 : 0.5,
                  },
                ]}
              >
                <RNText style={[styles.itemEmoji, { opacity: owned ? 1 : 0.3 }]}>
                  {owned ? item.emoji : '❓'}
                </RNText>
                {count > 1 && (
                  <View style={[styles.countBadge, { backgroundColor: RARITY_COLORS[item.rarity] }]}>
                    <RNText style={styles.countText}>x{count}</RNText>
                  </View>
                )}
                {!unlockable && (
                  <View style={styles.lockBadge}>
                    <RNText style={styles.lockText}>🔒</RNText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedItem(null)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onPress={e => e.stopPropagation()}
          >
            <View
              style={[
                styles.modalHeader,
                { backgroundColor: RARITY_COLORS[selectedItem.rarity] + '30' },
              ]}
            >
              <RNText style={styles.modalEmoji}>{selectedItem.emoji}</RNText>
              <View
                style={[
                  styles.rarityBadge,
                  { backgroundColor: RARITY_COLORS[selectedItem.rarity] },
                ]}
              >
                <RNText style={styles.rarityBadgeText}>
                  {selectedItem.rarity.toUpperCase()}
                </RNText>
              </View>
            </View>

            <View style={styles.modalBody}>
              <RNText style={[styles.modalName, { color: colors.text }]}>
                {selectedItem.name}
              </RNText>
              <RNText style={[styles.modalDescription, { color: colors.textSecondary }]}>
                {selectedItem.description}
              </RNText>

              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <RNText style={[styles.modalStatValue, { color: colors.primary }]}>
                    +{selectedItem.xpValue}
                  </RNText>
                  <RNText style={[styles.modalStatLabel, { color: colors.textSecondary }]}>
                    XP Value
                  </RNText>
                </View>
                <View style={styles.modalStatItem}>
                  <RNText style={[styles.modalStatValue, { color: colors.text }]}>
                    {collectibleCounts[selectedItem.id] || 0}
                  </RNText>
                  <RNText style={[styles.modalStatLabel, { color: colors.textSecondary }]}>
                    Owned
                  </RNText>
                </View>
                <View style={styles.modalStatItem}>
                  <RNText style={[styles.modalStatValue, { color: colors.text }]}>
                    {Math.round(selectedItem.spawnChance * 100)}%
                  </RNText>
                  <RNText style={[styles.modalStatLabel, { color: colors.textSecondary }]}>
                    Spawn Rate
                  </RNText>
                </View>
              </View>

              {selectedItem.requiredTasks > 0 && (
                <View style={[styles.requirementBox, { backgroundColor: colors.background }]}>
                  <RNText style={[styles.requirementText, { color: colors.textSecondary }]}>
                    {stats.totalTasksCompleted >= selectedItem.requiredTasks
                      ? '✅ Unlocked'
                      : `🔒 Complete ${selectedItem.requiredTasks} tasks to unlock`}
                  </RNText>
                </View>
              )}
            </View>

            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setSelectedItem(null)}
            >
              <RNText style={styles.closeButtonText}>Close</RNText>
            </Pressable>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
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
  statsCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  rarityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rarityCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 28,
  },
  countBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  lockBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  lockText: {
    fontSize: 12,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  modalEmoji: {
    fontSize: 64,
  },
  rarityBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  requirementBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 13,
  },
  closeButton: {
    margin: 20,
    marginTop: 0,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyStateIllustration: {
    position: 'relative',
    marginBottom: 24,
  },
  emptyStateMainEmoji: {
    fontSize: 80,
  },
  emptyStateFloatingEmojis: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingEmoji1: {
    position: 'absolute',
    top: -15,
    right: -20,
    fontSize: 24,
  },
  floatingEmoji2: {
    position: 'absolute',
    top: 5,
    left: -25,
    fontSize: 20,
  },
  floatingEmoji3: {
    position: 'absolute',
    bottom: -10,
    right: -25,
    fontSize: 22,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateTip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  emptyStateTipText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyStateCTA: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyStateCTAText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
