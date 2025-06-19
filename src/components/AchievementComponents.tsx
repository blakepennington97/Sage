// Reusable components for the achievement system

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Box, Text } from './ui';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../constants/restyleTheme';
import { Achievement, ProgressRing, getTierColor, getCategoryColor } from '../types/achievements';

// Progress Ring Component (inspired by Apple Watch)
interface ProgressRingComponentProps {
  ring: ProgressRing;
  size?: number;
}

export const ProgressRingComponent: React.FC<ProgressRingComponentProps> = ({ 
  ring, 
  size = 80 
}) => {
  const theme = useTheme<Theme>();
  const progress = Math.min(ring.current / ring.target, 1);
  const circumference = 2 * Math.PI * (size / 2 - 8);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);
  
  return (
    <Box alignItems="center" marginHorizontal="sm">
      <Box 
        position="relative" 
        alignItems="center" 
        justifyContent="center"
        style={{ width: size, height: size }}
      >
        {/* Background circle */}
        <Box
          position="absolute"
          style={{
            width: size - 4,
            height: size - 4,
            borderRadius: (size - 4) / 2,
            borderWidth: 4,
            borderColor: theme.colors.surfaceVariant,
          }}
        />
        
        {/* Progress circle - would use SVG in real implementation */}
        <Box
          position="absolute"
          style={{
            width: size - 4,
            height: size - 4,
            borderRadius: (size - 4) / 2,
            borderWidth: 4,
            borderColor: ring.color,
            borderTopColor: progress > 0.75 ? ring.color : theme.colors.surfaceVariant,
            borderRightColor: progress > 0.5 ? ring.color : theme.colors.surfaceVariant,
            borderBottomColor: progress > 0.25 ? ring.color : theme.colors.surfaceVariant,
            borderLeftColor: progress > 0 ? ring.color : theme.colors.surfaceVariant,
            transform: [{ rotate: '-90deg' }],
          }}
        />
        
        {/* Center content */}
        <Box alignItems="center" justifyContent="center">
          <Text fontSize={20}>{ring.emoji}</Text>
          <Text variant="small" textAlign="center" fontWeight="bold">
            {ring.current}/{ring.target}
          </Text>
        </Box>
      </Box>
      
      <Text variant="caption" textAlign="center" marginTop="xs" maxWidth={size}>
        {ring.title}
      </Text>
    </Box>
  );
};

// Achievement Badge Component
interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  achievement, 
  onPress,
  size = 'medium'
}) => {
  const theme = useTheme<Theme>();
  const tierColor = getTierColor(achievement.tier);
  const categoryColor = getCategoryColor(achievement.category);
  
  const dimensions = {
    small: { width: 60, height: 60, fontSize: 20 },
    medium: { width: 80, height: 80, fontSize: 24 },
    large: { width: 100, height: 100, fontSize: 32 },
  };
  
  const { width, height, fontSize } = dimensions[size];
  
  const content = (
    <Box alignItems="center" marginHorizontal="xs">
      <Box
        alignItems="center"
        justifyContent="center"
        style={{
          width,
          height,
          borderRadius: width / 2,
          backgroundColor: achievement.isUnlocked ? theme.colors.surface : theme.colors.surfaceVariant,
          borderWidth: 3,
          borderColor: achievement.isUnlocked ? tierColor : theme.colors.border,
          opacity: achievement.isUnlocked ? 1 : 0.6,
          shadowColor: achievement.isUnlocked ? tierColor : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: achievement.isUnlocked ? 4 : 0,
        }}
      >
        <Text style={{ fontSize }}>{achievement.emoji}</Text>
        
        {/* Progress indicator for locked achievements */}
        {!achievement.isUnlocked && achievement.progress > 0 && (
          <Box
            position="absolute"
            bottom={-2}
            style={{
              width: width * 0.8,
              height: 4,
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 2,
            }}
          >
            <Box
              style={{
                width: `${achievement.progress * 100}%`,
                height: 4,
                backgroundColor: categoryColor,
                borderRadius: 2,
              }}
            />
          </Box>
        )}
      </Box>
      
      <Text 
        variant="caption" 
        textAlign="center" 
        marginTop="xs" 
        numberOfLines={2}
        style={{ maxWidth: width + 10 }}
      >
        {achievement.title}
      </Text>
      
      {achievement.isUnlocked && (
        <Text 
          variant="small" 
          color="secondaryText" 
          textAlign="center"
        >
          +{achievement.points} pts
        </Text>
      )}
    </Box>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  
  return content;
};

// Achievement Category Section
interface AchievementCategorySectionProps {
  title: string;
  achievements: Achievement[];
  color: string;
  onAchievementPress?: (achievement: Achievement) => void;
}

export const AchievementCategorySection: React.FC<AchievementCategorySectionProps> = ({
  title,
  achievements,
  color,
  onAchievementPress,
}) => {
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  
  return (
    <Box marginBottom="lg">
      <Box 
        flexDirection="row" 
        justifyContent="space-between" 
        alignItems="center" 
        marginBottom="md"
      >
        <Text variant="h3" color="primaryText">{title}</Text>
        <Box
          paddingHorizontal="sm"
          paddingVertical="xs"
          borderRadius="sm"
          style={{ backgroundColor: `${color}20` }}
        >
          <Text variant="caption" style={{ color }} fontWeight="600">
            {unlockedCount}/{achievements.length}
          </Text>
        </Box>
      </Box>
      
      <Box flexDirection="row" flexWrap="wrap" gap="sm">
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            onPress={onAchievementPress ? () => onAchievementPress(achievement) : undefined}
            size="medium"
          />
        ))}
      </Box>
    </Box>
  );
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  emoji: string;
  color: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  emoji,
  color,
}) => {
  return (
    <Box
      backgroundColor="surface"
      borderRadius="lg"
      padding="md"
      borderWidth={1}
      borderColor="border"
      alignItems="center"
      flex={1}
      marginHorizontal="xs"
    >
      <Text fontSize={32} marginBottom="xs">{emoji}</Text>
      <Text variant="h2" textAlign="center" style={{ color }}>
        {value}
      </Text>
      <Text variant="caption" textAlign="center" fontWeight="600">
        {title}
      </Text>
      {subtitle && (
        <Text variant="small" color="secondaryText" textAlign="center">
          {subtitle}
        </Text>
      )}
    </Box>
  );
};