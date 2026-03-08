import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/design-system/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import Button from '../../components/design-system/primitives/Button';
import SelectPicker from '../../components/design-system/primitives/SelectPicker';
import {
  getTeachers,
  getSubjectsForAssignment,
  assignTeacherToSubject,
  removeTeacherFromSubject,
  getTeacherAssignments,
  TeacherWithProfile,
  SubjectTeacherAssignment,
} from '../../lib/subjectTeachers';
import { getDepartments, getBranches, getClasses, DepartmentItem, BranchItem, ClassItem } from '../../lib/organization';
import AdminLayout from '../../components/admin/AdminLayout';
import { ActionButton } from '../../components/common/ActionButtons';

export default function AssignSubjects() {
  const { tokens, getTextColor, getSurfaceColor, getTextSecondaryColor, getBackgroundColor } = useTheme();

  // Data states
  const [teachers, setTeachers] = useState<TeacherWithProfile[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<SubjectTeacherAssignment[]>([]);

  // Selection states
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // UI states
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTeacherId) {
      loadTeacherAssignments();
    }
  }, [selectedTeacherId]);

  useEffect(() => {
    if (selectedDepartmentName) {
      loadBranches();
    }
  }, [selectedDepartmentName]);

  useEffect(() => {
    if (selectedBranchId) {
      loadClasses();
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (selectedClassId) {
      loadSubjects();
    }
  }, [selectedClassId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [teachersRes, departmentsRes] = await Promise.all([
        getTeachers(),
        getDepartments(),
      ]);

      if (teachersRes.error) throw new Error(teachersRes.error);
      if (departmentsRes.error) throw new Error(departmentsRes.error);

      setTeachers(teachersRes.data || []);
      setDepartments(departmentsRes.data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const { data, error } = await getBranches();
      if (error) throw new Error(error);

      // Filter branches by selected department name
      const selectedDept = departments.find(d => d.name === selectedDepartmentName);
      const filtered = (data || []).filter(
        (branch) => branch.department_id === selectedDept?.id
      );
      setBranches(filtered);
      
      // Reset downstream selections
      setSelectedBranchId('');
      setSelectedClassId('');
      setSelectedSubjectId('');
      setClasses([]);
      setSubjects([]);
    } catch (error: any) {
      console.error('Error loading branches:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await getClasses();
      if (error) throw new Error(error);

      // Filter classes by selected branch
      const filtered = (data || []).filter(
        (cls) => cls.branch_id === selectedBranchId
      );
      setClasses(filtered);
      
      // Reset downstream selections
      setSelectedClassId('');
      setSelectedSubjectId('');
      setSubjects([]);
    } catch (error: any) {
      console.error('Error loading classes:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const { data, error } = await getSubjectsForAssignment(
        selectedDepartmentName,
        selectedBranchId,
        selectedClassId
      );
      if (error) throw new Error(error);
      setSubjects(data || []);
      
      // Reset subject selection
      setSelectedSubjectId('');
    } catch (error: any) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadTeacherAssignments = async () => {
    try {
      const { data, error } = await getTeacherAssignments(selectedTeacherId);
      if (error) throw new Error(error);
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedTeacherId || !selectedSubjectId) {
      Alert.alert('Error', 'Please select both teacher and subject');
      return;
    }

    setAssigning(true);
    try {
      const { error } = await assignTeacherToSubject(selectedTeacherId, selectedSubjectId);
      if (error) throw new Error(error);

      Alert.alert('Success', 'Subject assigned to teacher successfully');
      loadTeacherAssignments();
      setSelectedSubjectId('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to assign subject');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (subjectId: string) => {
    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove this subject assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await removeTeacherFromSubject(selectedTeacherId, subjectId);
              if (error) throw new Error(error);

              Alert.alert('Success', 'Subject assignment removed');
              loadTeacherAssignments();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove assignment');
            }
          },
        },
      ]
    );
  };

  const renderAssignment = ({ item }: { item: SubjectTeacherAssignment }) => (
    <View style={[styles.assignmentCard, { backgroundColor: getSurfaceColor() }]}>
      <View style={styles.assignmentInfo}>
        <Text style={[styles.subjectName, { color: getTextColor() }]}>
          {item.subject_name}
        </Text>
        <Text style={[styles.subjectDetails, { color: getTextSecondaryColor() }]}>
          {item.subject_code} • {item.class_name}
        </Text>
        {item.is_primary && (
          <View style={[styles.primaryBadge, { backgroundColor: tokens.colors.primary.main }]}>
            <Text style={styles.primaryText}>Primary</Text>
          </View>
        )}
      </View>
      <ActionButton
        type="delete"
        onPress={() => handleRemove(item.subject_id)}
        accessibilityLabel={`Remove ${item.subject_name}`}
      />
    </View>
  );

  if (loading) {
    return (
      <AdminLayout title="Assign Subjects">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Assign Subjects">
      <ScrollView 
        style={[styles.container, { backgroundColor: getBackgroundColor() }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Teacher Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: getTextColor() }]}>
            1. Select Teacher
          </Text>
          <SelectPicker
            label="Teacher"
            value={selectedTeacherId}
            items={teachers.map((t) => ({
              label: `${t.full_name} (${t.department_name})`,
              value: t.id,
            }))}
            onValueChange={setSelectedTeacherId}
            searchable
          />
        </View>

        {selectedTeacherId && (
          <>
            {/* Department Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: getTextColor() }]}>
                2. Select Department
              </Text>
              <SelectPicker
                label="Department"
                value={selectedDepartmentName}
                items={departments.map((d) => ({
                  label: d.name,
                  value: d.name,
                }))}
                onValueChange={setSelectedDepartmentName}
              />
            </View>

            {/* Branch Selection */}
            {selectedDepartmentName && branches.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: getTextColor() }]}>
                  3. Select Branch
                </Text>
                <SelectPicker
                  label="Branch"
                  value={selectedBranchId}
                  items={branches.map((b) => ({
                    label: b.name,
                    value: b.id,
                  }))}
                  onValueChange={setSelectedBranchId}
                  searchable
                />
              </View>
            )}

            {/* Class Selection */}
            {selectedBranchId && classes.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: getTextColor() }]}>
                  4. Select Class
                </Text>
                <SelectPicker
                  label="Class"
                  value={selectedClassId}
                  items={classes.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                  onValueChange={setSelectedClassId}
                  searchable
                />
              </View>
            )}

            {/* Subject Selection */}
            {selectedClassId && subjects.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: getTextColor() }]}>
                  5. Select Subject
                </Text>
                <SelectPicker
                  label="Subject"
                  value={selectedSubjectId}
                  items={subjects.map((s) => ({
                    label: `${s.name} (${s.class_name})`,
                    value: s.id,
                  }))}
                  onValueChange={setSelectedSubjectId}
                  searchable
                />
                <Button
                  variant="primary"
                  onPress={handleAssign}
                  loading={assigning}
                  disabled={!selectedSubjectId || assigning}
                  style={styles.assignButton}
                >
                  Assign Subject
                </Button>
              </View>
            )}

            {/* Current Assignments */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: getTextColor() }]}>
                Assigned Subjects ({assignments.length})
              </Text>
              {assignments.length === 0 ? (
                <Text style={[styles.emptyText, { color: getTextSecondaryColor() }]}>
                  No subjects assigned yet
                </Text>
              ) : (
                <View style={styles.assignmentsList}>
                  {assignments.map((item) => (
                    <View key={item.id} style={[styles.assignmentCard, { backgroundColor: getSurfaceColor() }]}>
                      <View style={styles.assignmentInfo}>
                        <Text style={[styles.subjectName, { color: getTextColor() }]}>
                          {item.subject_name}
                        </Text>
                        <Text style={[styles.subjectDetails, { color: getTextSecondaryColor() }]}>
                          {item.subject_code} • {item.class_name}
                        </Text>
                        {item.is_primary && (
                          <View style={[styles.primaryBadge, { backgroundColor: tokens.colors.primary.main }]}>
                            <Text style={styles.primaryText}>Primary</Text>
                          </View>
                        )}
                      </View>
                      <ActionButton
                        type="delete"
                        onPress={() => handleRemove(item.subject_id)}
                        accessibilityLabel={`Remove ${item.subject_name}`}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  assignButton: {
    marginTop: 16,
  },
  assignmentsList: {
    marginTop: 8,
  },
  assignmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assignmentInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subjectDetails: {
    fontSize: 14,
  },
  primaryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  primaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
});
