// src/components/premium/InlineQuotaIndicator.tsx
// Inline quota indicator component for React Native
// Displays remaining quota uses next to buttons (e.g., "2/3 left")

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useQuota } from '../../hooks/useQuota';
import { useSubscription } from '../../hooks/useSubscription';
import type { QuotaFeatureType } from '../../types/quota';

interface InlineQuotaIndicatorProps {
  featureType: QuotaFeatureType;
  style?: ViewStyle;
}

/**
 * Inline quota indicator component
 *
 * Displays remaining quota uses next to buttons with color coding:
 * - Green: More than 1 use remaining
 * - Yellow: Exactly 1 use remaining
 * - Red: 0 uses remaining
 *
 * Auto-hides for premium users (who have unlimited access).
 */
export default function InlineQuotaIndicator({
  featureType,
  style,
}: InlineQuotaIndicatorProps) {
  const { isPremium } = useSubscription();
  const { quota, loading, getRemainingUses } = useQuota();

  // Hide for premium users
  if (isPremium) {
    return null;
  }

  // Hide while loading
  if (loading) {
    return null;
  }

  // Hide if quota data is unavailable
  if (!quota) {
    return null;
  }

  const feature = quota[featureType];
  const remaining = getRemainingUses(featureType);

  // Hide if unlimited
  if (feature.isUnlimited || remaining === null) {
    return null;
  }

  // Determine color based on remaining count
  const getBadgeStyle = () => {
    if (remaining === 0) {
      return [styles.badge, styles.redBadge];
    } else if (remaining === 1) {
      return [styles.badge, styles.yellowBadge];
    } else {
      return [styles.badge, styles.greenBadge];
    }
  };

  const getTextStyle = () => {
    if (remaining === 0) {
      return [styles.text, styles.redText];
    } else if (remaining === 1) {
      return [styles.text, styles.yellowText];
    } else {
      return [styles.text, styles.greenText];
    }
  };

  const limit = feature.limit;

  return (
    <View style={[getBadgeStyle(), style]}>
      <Text style={getTextStyle()}>
        ({remaining}/{limit} left)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  greenBadge: {
    backgroundColor: '#dcfce7',
  },
  yellowBadge: {
    backgroundColor: '#fef3c7',
  },
  redBadge: {
    backgroundColor: '#fee2e2',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  greenText: {
    color: '#16a34a',
  },
  yellowText: {
    color: '#ca8a04',
  },
  redText: {
    color: '#dc2626',
  },
});
