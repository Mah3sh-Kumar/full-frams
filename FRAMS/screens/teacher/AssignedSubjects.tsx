import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../lib/design-system/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { getTeacherAssignments, SubjectTeacherAssignment } from '../../lib/subjectTeachers';

export default function AssignedSubjects() {
  const { session } = useAuth();
  const { tokens, getTextColor, getSurfaceColor, getTextSecondaryColor, getBackgroundColor } = useTheme();

  const [assignments, setAssignments] = useState<SubjectTeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await getTeacherAssignments(session.user.id);
      if (error) throw new Error(error);
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAssignments();
    setRefreshing(false);
  }, []);

  const renderAssignment = ({ item }: { item: SubjectTeacherAssignment }) => (
    <View style={[styles.card, { backgroundColor: getSurfaceColor() }]}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="book-outline" size={24} color={tokens.colors.primary.main} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.subjectName, { color: getTextColor() }]}>
              {item.subject_name}
            </Text>
            {item.is_primary && (
              <View style={[styles.primaryBadge, { backgroundColor: tokens.colors.primary.main }]}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.primaryText}>Primary</Text>
              </View>
            )}
          </View>
          <Text style={[styles.subjectCode, { color: getTextSecondaryColor() }]}>
            {item.subject_code}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="school-outline" size={16} color={getTextSecondaryColor()} />
          <Text style={[styles.detailText, { color: getTextSecondaryColor() }]}>
            Class: {item.class_name}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={getTextSecondaryColor()} />
          <Text style={[styles.detailText, { color: getTextSecondaryColor() }]}>
            Assigned: {new Date(item.assigned_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: getTextColor() }]}>Assigned Subjects</Text>
        <Text style={[styles.subtitle, { color: getTextSecondaryColor() }]}>
          {assignments.length} {assignments.length === 1 ? 'subject' : 'subjects'}
        </Text>
      </View>

      {assignments.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="No Subjects Assigned"
          message="You don't have any subjects assigned yet. Contact your administrator."
        />
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderAssignment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.colors.primary.main}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    lineHeight: 26,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  primaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    lineHeight: 20,
  },
  subjectCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 15,
    marginLeft: 8,
    lineHeight: 24,
  },
});
