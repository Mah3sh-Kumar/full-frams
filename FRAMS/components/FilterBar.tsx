import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, Menu, Button } from 'react-native-paper';
import { useTheme } from '../lib/design-system/ThemeContext';

interface FilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    searchPlaceholder?: string;
    sortOptions?: { label: string; value: string }[];
    selectedSort?: string;
    onSortChange?: (value: string) => void;
}

export default function FilterBar({
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Search...',
    sortOptions,
    selectedSort,
    onSortChange,
}: FilterBarProps) {
    const { tokens, getSurfaceColor } = useTheme();
    const [menuVisible, setMenuVisible] = React.useState(false);

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            gap: tokens.spacing.sm,
            marginBottom: tokens.spacing.md,
        },
        searchbar: {
            flex: 1,
            backgroundColor: getSurfaceColor(),
            borderRadius: tokens.borders.radius.medium,
        },
        sortButton: {
            minWidth: 100,
            borderRadius: tokens.borders.radius.medium,
        },
    });

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder={searchPlaceholder}
                onChangeText={onSearchChange}
                value={searchQuery}
                style={styles.searchbar}
            />

            {sortOptions && onSortChange && (
                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                        <Button
                            mode="outlined"
                            onPress={() => setMenuVisible(true)}
                            icon="sort"
                            style={styles.sortButton}
                        >
                            Sort
                        </Button>
                    }
                >
                    {sortOptions.map((option) => (
                        <Menu.Item
                            key={option.value}
                            onPress={() => {
                                onSortChange(option.value);
                                setMenuVisible(false);
                            }}
                            title={option.label}
                            leadingIcon={selectedSort === option.value ? 'check' : undefined}
                        />
                    ))}
                </Menu>
            )}
        </View>
    );
}
