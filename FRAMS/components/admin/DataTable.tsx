import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/design-system/ThemeContext';

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  sortable?: boolean;
  onRowPress?: (item: T, index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
}

const DataTable = <T,>({
  data,
  columns,
  searchable = false,
  sortable = true,
  onRowPress,
  emptyMessage = "No data available",
  loading = false
}: DataTableProps<T>) => {
  const { tokens, getBackgroundColor, getSurfaceColor, getTextColor, getTextSecondaryColor } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    return data.filter(item => {
      return Object.values(item as Record<string, unknown>).some(value => 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [data, searchQuery]);

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortable) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig, sortable]);

  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    
    setSortConfig(prevConfig => {
      if (!prevConfig || prevConfig.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }
      if (prevConfig.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }
      return null;
    });
  };

  const renderCell = (item: T, column: Column<T>, index: number) => {
    if (column.render) {
      return column.render(item, index);
    }
    
    const value = item[column.key as keyof T];
    return (
      <Text style={[styles.cellText, { color: getTextColor() }]}>
        {value !== null && value !== undefined ? String(value) : '-'}
      </Text>
    );
  };

  const renderHeader = () => (
    <View style={[styles.headerRow, { backgroundColor: tokens.colors.neutral.gray50 }]}>
      {columns.map((column, index) => (
        <TouchableOpacity
          key={String(column.key)}
          style={[
            styles.headerCell,
            { 
              width: column.width ? column.width : `${100 / columns.length}%`,
              borderRightWidth: index < columns.length - 1 ? 1 : 0,
              borderRightColor: tokens.colors.neutral.gray200
            }
          ]}
          onPress={() => column.sortable !== false && handleSort(String(column.key))}
          disabled={!sortable || column.sortable === false}
        >
          <View style={styles.headerContent}>
            <Text style={[styles.headerText, { color: getTextSecondaryColor() }]}>
              {column.title}
            </Text>
            {sortable && column.sortable !== false && (
              <View style={styles.sortIndicator}>
                <Ionicons 
                  name={
                    sortConfig?.key === String(column.key) 
                      ? sortConfig.direction === 'asc' 
                        ? 'caret-up' 
                        : 'caret-down'
                      : 'swap-vertical'
                  } 
                  size={14} 
                  color={sortConfig?.key === String(column.key) 
                    ? tokens.colors.primary.main 
                    : tokens.colors.neutral.gray400
                  }
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRow = ({ item, index }: { item: T; index: number }) => (
    <TouchableOpacity
      style={[
        styles.row,
        { 
          backgroundColor: index % 2 === 0 ? getSurfaceColor() : tokens.colors.neutral.gray50,
          borderBottomWidth: 1,
          borderBottomColor: tokens.colors.neutral.gray200
        }
      ]}
      onPress={() => onRowPress?.(item, index)}
      disabled={!onRowPress}
    >
      {columns.map((column, colIndex) => (
        <View
          key={String(column.key)}
          style={[
            styles.cell,
            { 
              width: column.width ? column.width : `${100 / columns.length}%`,
              borderRightWidth: colIndex < columns.length - 1 ? 1 : 0,
              borderRightColor: tokens.colors.neutral.gray200
            }
          ]}
        >
          {renderCell(item, column, index)}
        </View>
      ))}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
        <Text style={[styles.loadingText, { color: getTextColor() }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      {searchable && (
        <View style={[styles.searchContainer, { backgroundColor: getSurfaceColor() }]}>
          <Ionicons 
            name="search" 
            size={20} 
            color={tokens.colors.neutral.gray400} 
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: getTextColor() }]}
            placeholder="Search..."
            placeholderTextColor={tokens.colors.neutral.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={tokens.colors.neutral.gray400} 
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {sortedData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="document-text-outline" 
            size={48} 
            color={tokens.colors.neutral.gray300} 
          />
          <Text style={[styles.emptyText, { color: getTextSecondaryColor() }]}>
            {emptyMessage}
          </Text>
        </View>
      ) : (
        <View style={styles.tableContainer}>
          {renderHeader()}
          <FlatList
            data={sortedData}
            renderItem={renderRow}
            keyExtractor={(item, index) => `${String(item)}-${index}`}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  tableContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
  },
  headerCell: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortIndicator: {
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 40,
  },
});

export default DataTable;