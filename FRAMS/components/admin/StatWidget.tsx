import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/design-system/ThemeContext';

interface StatWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  iconColor: string;
  backgroundColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  onPress?: () => void;
  isLoading?: boolean;
}

const StatWidget: React.FC<StatWidgetProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  backgroundColor,
  trend,
  onPress,
  isLoading = false
}) => {
  const { tokens, getTextColor, getTextSecondaryColor } = useTheme();

  const renderTrend = () => {
    if (!trend) return null;
    
    return (
      <View style={styles.trendContainer}>
        <Ionicons 
          name={trend.isPositive ? 'trending-up' : 'trending-down'} 
          size={16} 
          color={trend.isPositive ? tokens.colors.success.main : tokens.colors.error.main}
        />
        <Text style={[
          styles.trendText,
          { 
            color: trend.isPositive ? tokens.colors.success.main : tokens.colors.error.main,
            fontWeight: '600'
          }
        ]}>
          {trend.value > 0 ? '+' : ''}{trend.value}%
        </Text>
        <Text style={[styles.trendLabel, { color: getTextSecondaryColor() }]}>
          {trend.label}
        </Text>
      </View>
    );
  };

  const content = (
    <View style={[
      styles.container,
      { 
        backgroundColor: backgroundColor,
        borderColor: tokens.colors.neutral.gray200,
        shadowColor: tokens.colors.neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }
    ]}>
      <View style={styles.header}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: `${iconColor}20` }
        ]}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
        {trend && renderTrend()}
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.value, { color: getTextColor() }]}>
          {isLoading ? '--' : value}
        </Text>
        <Text style={[styles.title, { color: getTextSecondaryColor() }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: getTextSecondaryColor() }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendLabel: {
    fontSize: 12,
    marginLeft: 4,
  },
  content: {
    gap: 4,
  },
  value: {
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 36,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.8,
  },
});

export default StatWidget;