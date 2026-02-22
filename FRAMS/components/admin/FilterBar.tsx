import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/design-system/ThemeContext';

interface FilterOption {
  key: string;
  label: string;
  value: string | number | boolean;
}

interface FilterBarProps {
  filters: FilterOption[];
  activeFilters: Record<string, string | number | boolean>;
  onFilterChange: (key: string, value: string | number | boolean) => void;
  onClearAll?: () => void;
  showClearAll?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  showClearAll = true
}) => {
  const { tokens, getBackgroundColor, getSurfaceColor, getTextColor, getTextSecondaryColor } = useTheme();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const isActiveFilter = (filter: FilterOption) => {
    return activeFilters[filter.key] === filter.value;
  };

  const toggleFilter = (filter: FilterOption) => {
    if (isActiveFilter(filter)) {
      onFilterChange(filter.key, '');
    } else {
      onFilterChange(filter.key, filter.value);
    }
  };

  const clearAllFilters = () => {
    filters.forEach(filter => {
      onFilterChange(filter.key, '');
    });
    if (onClearAll) onClearAll();
  };

  const hasActiveFilters = Object.values(activeFilters).some(value => value !== '');

  const groupFiltersByCategory = () => {
    // Group filters by their key prefixes (before first underscore)
    const grouped: Record<string, FilterOption[]> = {};
    
    filters.forEach(filter => {
      const category = filter.key.split('_')[0] || 'general';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(filter);
    });
    
    return grouped;
  };

  const renderFilterChip = (filter: FilterOption) => {
    const isActive = isActiveFilter(filter);
    
    return (
      <TouchableOpacity
        key={`${filter.key}-${filter.value}`}
        style={[
          styles.chip,
          {
            backgroundColor: isActive 
              ? tokens.colors.primary.main 
              : tokens.colors.neutral.gray100,
            borderColor: isActive 
              ? tokens.colors.primary.main 
              : tokens.colors.neutral.gray300,
          }
        ]}
        onPress={() => toggleFilter(filter)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.chipText,
          {
            color: isActive 
              ? tokens.colors.primary.contrast 
              : getTextSecondaryColor(),
            fontWeight: isActive ? '600' : '400'
          }
        ]}>
          {filter.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const groupedFilters = groupFiltersByCategory();

  return (
    <View style={[styles.container, { backgroundColor: getSurfaceColor() }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: getTextColor() }]}>
          Filters
        </Text>
        
        {showClearAll && hasActiveFilters && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearAllFilters}
          >
            <Ionicons name="close" size={16} color={tokens.colors.error.main} />
            <Text style={[styles.clearText, { color: tokens.colors.error.main }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.entries(groupedFilters).map(([category, categoryFilters]) => (
          <View key={category} style={styles.categorySection}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => setExpandedSections(prev => ({
                ...prev,
                [category]: !prev[category]
              }))}
            >
              <Text style={[styles.categoryTitle, { color: getTextSecondaryColor() }]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              <Ionicons 
                name={expandedSections[category] ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={getTextSecondaryColor()} 
              />
            </TouchableOpacity>
            
            {(expandedSections[category] || categoryFilters.length <= 3) && (
              <View style={styles.chipContainer}>
                {categoryFilters.map(renderFilterChip)}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      {filters.length > 0 && (
        <View style={styles.activeFiltersContainer}>
          <Text style={[styles.activeFiltersTitle, { color: getTextSecondaryColor() }]}>
            Active Filters:
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersScroll}
          >
            {filters
              .filter(filter => isActiveFilter(filter))
              .map(filter => (
                <View 
                  key={`active-${filter.key}-${filter.value}`}
                  style={[
                    styles.activeFilterChip,
                    { backgroundColor: tokens.colors.primary.light }
                  ]}
                >
                  <Text style={[
                    styles.activeFilterText,
                    { color: tokens.colors.primary.main }
                  ]}>
                    {filter.label}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => toggleFilter(filter)}
                    style={styles.removeFilterButton}
                  >
                    <Ionicons 
                      name="close" 
                      size={12} 
                      color={tokens.colors.primary.main} 
                    />
                  </TouchableOpacity>
                </View>
              ))
            }
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  categorySection: {
    marginRight: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    lineHeight: 16,
  },
  activeFiltersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  activeFiltersScroll: {
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  activeFilterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  removeFilterButton: {
    padding: 2,
  },
});

export default FilterBar;