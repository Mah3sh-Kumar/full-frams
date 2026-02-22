import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, TouchableOpacity, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    subscribeToNotifications,
    type Notification,
} from '../lib/notifications';
import { tokens } from '../lib/design-system/tokens';
import { useTheme } from '../lib/design-system/ThemeContext';
import Card from '../components/design-system/primitives/Card';
import Button from '../components/design-system/primitives/Button';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import type { StackScreenProps } from '@react-navigation/stack';

type Props = StackScreenProps<any, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
    const { session } = useAuth();
    const { getBackgroundColor, getSurfaceColor, getTextColor, getTextSecondaryColor, getBorderColor } = useTheme();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();

        // Subscribe to real-time updates
        const userId = session?.user?.id;
        if (!userId) return;

        const unsubscribe = subscribeToNotifications(userId, (newNotification) => {
            setNotifications((prev) => [newNotification, ...prev]);
        });

        return () => {
            unsubscribe();
        };
    }, [session]);

    const loadNotifications = async () => {
        setLoading(true);
        const data = await fetchNotifications();
        setNotifications(data);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const handleMarkAsRead = async (id: string) => {
        const success = await markAsRead(id);
        if (success) {
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === id ? { ...notif, read: true } : notif
                )
            );
        }
    };

    const handleMarkAllAsRead = async () => {
        const success = await markAllAsRead();
        if (success) {
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, read: true }))
            );
        }
    };

    const handleDelete = async (id: string) => {
        const success = await deleteNotification(id);
        if (success) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    const getIconName = (type: string) => {
        switch (type) {
            case 'assignment':
                return 'file-document';
            case 'grade':
                return 'star';
            case 'attendance':
                return 'calendar-check';
            default:
                return 'bell';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'assignment':
                return tokens.colors.info.main;
            case 'grade':
                return tokens.colors.success.main;
            case 'attendance':
                return tokens.colors.warning.main;
            default:
                return tokens.colors.primary.main;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const getSectionTitle = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return 'Earlier';
    };

    const groupedNotifications = useMemo(() => {
        const groups: { [key: string]: Notification[] } = {};
        notifications.forEach(notification => {
            const section = getSectionTitle(notification.created_at);
            if (!groups[section]) groups[section] = [];
            groups[section].push(notification);
        });
        return Object.entries(groups).map(([title, data]) => ({ title, data }));
    }, [notifications]);

    const renderNotification = ({ item }: { item: Notification }) => {
        const cardStyle = {
            ...styles.notificationCard,
            backgroundColor: getSurfaceColor(),
            ...(item.read ? {} : {
                borderLeftWidth: 4,
                borderLeftColor: tokens.colors.primary.main,
            }),
        };

        return (
            <TouchableOpacity
                onPress={() => handleMarkAsRead(item.id)}
                activeOpacity={0.7}
            >
                <View style={cardStyle}>
                    <View style={styles.cardContent}>
                        <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) + '15' }]}>
                            <Ionicons name={getIconName(item.type) as any} size={24} color={getIconColor(item.type)} />
                        </View>
                        <View style={styles.textContainer}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.title, { color: getTextColor() }]}>{item.title}</Text>
                                {!item.read && (
                                    <View style={styles.unreadDot} />
                                )}
                            </View>
                            <Text style={[styles.message, { color: getTextSecondaryColor() }]}>{item.message}</Text>
                            <View style={styles.footer}>
                                <Text style={[styles.date, { color: tokens.colors.neutral.gray500 }]}>{formatDate(item.created_at)}</Text>
                                <TouchableOpacity
                                    onPress={() => handleDelete(item.id)}
                                    style={styles.deleteButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="trash-outline" size={20} color={tokens.colors.error.main} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section }: { section: { title: string } }) => (
        <View style={[styles.sectionHeader, { backgroundColor: getBackgroundColor() }]}>
            <Text style={[styles.sectionHeaderText, { color: getTextSecondaryColor() }]}>{section.title}</Text>
        </View>
    );

    if (loading) {
        return <LoadingSpinner text="Loading notifications..." />;
    }

    if (notifications.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
                <View style={[styles.header, { backgroundColor: getSurfaceColor() }]}>
                    <Text style={[styles.headerTitle, { color: getTextColor() }]}>Notifications</Text>
                </View>
                <EmptyState
                    icon="bell-outline"
                    title="No Notifications"
                    message="You're all caught up! New notifications will appear here."
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
            <View style={[styles.header, { backgroundColor: getSurfaceColor() }]}>
                <Text style={[styles.headerTitle, { color: getTextColor() }]}>Notifications</Text>
                {notifications.length > 0 && (
                    <Button
                        variant="ghost"
                        onPress={handleMarkAllAsRead}
                        size="small"
                    >
                        Mark All Read
                    </Button>
                )}
            </View>

            <SectionList
                sections={groupedNotifications}
                renderItem={renderNotification}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                stickySectionHeadersEnabled={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: tokens.spacing.md,
        ...tokens.shadows.sm,
    },
    headerTitle: {
        fontSize: tokens.typography.h2.fontSize,
        fontWeight: tokens.typography.h2.fontWeight,
    },
    sectionHeader: {
        paddingHorizontal: tokens.spacing.md,
        paddingVertical: tokens.spacing.sm,
        marginTop: tokens.spacing.sm,
    },
    sectionHeaderText: {
        fontSize: tokens.typography.caption.fontSize,
        fontWeight: tokens.typography.h3.fontWeight,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    deleteButton: {
        padding: tokens.spacing.sm,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: tokens.spacing.md,
    },
    notificationCard: {
        marginBottom: tokens.spacing.md,
        borderRadius: tokens.borders.medium,
        ...tokens.shadows.sm,
    },
    cardContent: {
        flexDirection: 'row',
        padding: tokens.spacing.md,
    },
    iconContainer: {
        marginRight: tokens.spacing.sm,
        width: 48,
        height: 48,
        borderRadius: tokens.borders.radius.medium,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: tokens.spacing.xs,
    },
    title: {
        fontSize: tokens.typography.h3.fontSize,
        fontWeight: tokens.typography.h3.fontWeight,
        lineHeight: tokens.typography.h3.lineHeight,
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: tokens.borders.full,
        backgroundColor: tokens.colors.primary.main,
        marginLeft: tokens.spacing.xs,
    },
    message: {
        fontSize: tokens.typography.body.fontSize,
        lineHeight: tokens.typography.body.lineHeight,
        marginBottom: tokens.spacing.xs,
    },
    date: {
        fontSize: tokens.typography.caption.fontSize,
        lineHeight: tokens.typography.caption.lineHeight,
        color: tokens.colors.neutral.gray500,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 48,
    },
});
