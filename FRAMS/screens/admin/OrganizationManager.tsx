/**
 * OrganizationManager Screen
 * 
 * Admin interface for managing organizational data structures including
 * classes, branches, and departments. Provides full CRUD operations with
 * validation and dependency checking.
 * 
 * Features:
 * - Tabbed interface for classes, branches, and departments
 * - Create, edit, and delete operations with confirmation
 * - Branch-class association management
 * - Dependency checking before deletion
 * - Real-time data synchronization
 * - Error handling with user-friendly messages
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10
 * 
 * @example
 * ```tsx
 * // Navigate from admin dashboard
 * navigation.navigate('OrganizationManager');
 * 
 * // Or with initial tab
 * navigation.navigate('OrganizationManager', { initialTab: 'branches' });
 * ```
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Alert, FlatList, StatusBar, Platform, KeyboardAvoidingView, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { useTheme } from '../../lib/design-system/ThemeContext';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  ClassItem,
  BranchItem,
  DepartmentItem,
} from '../../lib/organization';
import { SubjectItem, AcademicYearItem } from '../../lib/types';
import { getSubjects, createSubject, updateSubject, deleteSubject, copySubjectsForAcademicYear } from '../../lib/subjects';

type TabType = 'classes' | 'branches' | 'departments' | 'subjects';

import CreateClassForm from '../../components/admin/organization/CreateClassForm';
import CreateBranchForm from '../../components/admin/organization/CreateBranchForm';
import CreateDepartmentForm from '../../components/admin/organization/CreateDepartmentForm';
import SubjectCard from '../../components/admin/subjects/SubjectCard';
import SubjectForm from '../../components/admin/subjects/SubjectForm';
import AcademicYearTransitionDialog from '../../components/admin/subjects/AcademicYearTransitionDialog';

export default function OrganizationManager() {
  const { tokens, getTextColor, getSurfaceColor, getTextSecondaryColor, getBackgroundColor, mode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('classes');
  const [loading, setLoading] = useState(true);

  // Data states
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Subject-specific states
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([]);
  const [showArchivedSubjects, setShowArchivedSubjects] = useState(false);
  const [transitionDialogVisible, setTransitionDialogVisible] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassItem | BranchItem | DepartmentItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');

  // Delete confirmation
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Refetch subjects when showArchivedSubjects toggle changes
  useEffect(() => {
    if (activeTab === 'subjects') {
      fetchSubjects();
    }
  }, [showArchivedSubjects]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'classes') {
        const { data, error } = await getClasses(true);
        if (error) throw new Error(error);
        setClasses(data || []);
      } else if (activeTab === 'branches') {
        const { data, error } = await getBranches(undefined, true);
        if (error) throw new Error(error);
        setBranches(data || []);
        // Also fetch classes for the dropdown
        const classesResult = await getClasses(true);
        if (classesResult.data) setClasses(classesResult.data);
      } else if (activeTab === 'subjects') {
        await fetchSubjects();
      } else {
        const { data, error } = await getDepartments(true);
        if (error) throw new Error(error);
        setDepartments(data || []);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await getSubjects(
        showArchivedSubjects, // includeInactive - pass the toggle state
        false, // includeDeleted
        currentAcademicYear || undefined
      );

      if (error) {
        Alert.alert('Error', error);
        return;
      }

      setSubjects(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch subjects');
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setSelectedSubject(null);
    setModalVisible(true);
  };

  const openEditModal = (item: ClassItem | BranchItem | DepartmentItem) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleClassSubmit = async (name: string, value: string) => {
    setSaving(true);
    try {
      let result;
      if (editingItem) {
        result = await updateClass(editingItem.id, { name, value });
      } else {
        result = await createClass(name, value, undefined, `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
      }

      if (result.error) throw new Error(result.error);

      Alert.alert('Success', `Class ${editingItem ? 'updated' : 'created'} successfully`);
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const handleBranchSubmit = async (name: string, code: string, classId: string | null) => {
    setSaving(true);
    try {
      let result;
      if (editingItem) {
        result = await updateBranch(editingItem.id, { name, code, class_id: classId });
      } else {
        result = await createBranch(name, code, classId);
      }

      if (result.error) throw new Error(result.error);

      Alert.alert('Success', `Branch ${editingItem ? 'updated' : 'created'} successfully`);
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDepartmentSubmit = async (name: string, code: string) => {
    setSaving(true);
    try {
      let result;
      if (editingItem) {
        result = await updateDepartment(editingItem.id, { name, code });
      } else {
        result = await createDepartment(name, code);
      }

      if (result.error) throw new Error(result.error);

      Alert.alert('Success', `Department ${editingItem ? 'updated' : 'created'} successfully`);
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleSubjectSubmit = async (
    name: string,
    code: string,
    classId: string,
    academicYearId: string,
    teacherIds: string[],
    primaryTeacherId: string,
    isActive: boolean
  ) => {
    setSaving(true);
    try {
      let result;
      if (selectedSubject) {
        // Update existing subject
        result = await updateSubject(
          selectedSubject.id,
          { name, code, class_id: classId, is_active: isActive },
          teacherIds,
          primaryTeacherId
        );
      } else {
        // Create new subject
        result = await createSubject(name, code, classId, academicYearId, teacherIds, primaryTeacherId, isActive);
      }

      // Handle validation errors and database errors
      if (result.error) {
        // Display user-friendly error message
        Alert.alert('Error', result.error);
        return;
      }

      // Display success alert
      Alert.alert('Success', `Subject ${selectedSubject ? 'updated' : 'created'} successfully`);
      
      // Close modal
      setModalVisible(false);
      setSelectedSubject(null);
      
      // Refresh subject list
      fetchData();
    } catch (error: any) {
      // Handle unexpected errors
      console.error('Error in handleSubjectSubmit:', error);
      Alert.alert('Error', error.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleSubjectDelete = async (subject: SubjectItem) => {
    // Display confirmation dialog with subject name
    // Warn that action will archive the subject
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to delete "${subject.name}"?\n\nThis action will archive the subject.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call deleteSubject() with subject id and name
              const { error } = await deleteSubject(subject.id, subject.name);

              // Handle dependency errors with detailed counts
              if (error) {
                // Display specific messages for attendance, timetable, and face recognition dependencies
                // The error message from deleteSubject already includes detailed counts and suggests archiving
                Alert.alert('Cannot Delete Subject', error);
                return;
              }

              // Display success alert on successful soft deletion
              Alert.alert('Success', `Subject "${subject.name}" has been archived successfully`);
              
              // Refresh subject list (soft-deleted subjects will be excluded)
              fetchData();
            } catch (error: any) {
              // Handle other database errors with user-friendly messages
              console.error('Error in handleSubjectDelete:', error);
              Alert.alert('Error', error.message || 'Failed to delete subject');
            }
          }
        }
      ]
    );
  };

  const handleAcademicYearTransition = async (sourceYearId: string, targetYearId: string) => {
    try {
      // Call copySubjectsForAcademicYear
      const { data, error } = await copySubjectsForAcademicYear(sourceYearId, targetYearId);

      // Handle errors
      if (error) {
        Alert.alert('Error', error);
        throw new Error(error); // Re-throw to prevent dialog from closing
      }

      // Display summary showing number of subjects copied
      if (data) {
        Alert.alert(
          'Success',
          `Successfully copied ${data.copied_count} subject${data.copied_count !== 1 ? 's' : ''} to the target academic year.`
        );
      }

      // Refresh subject list after successful copy
      fetchData();
    } catch (error: any) {
      // Error already displayed in Alert above
      console.error('Error in handleAcademicYearTransition:', error);
      throw error; // Re-throw to keep dialog open
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      let error: string | null = null;

      if (activeTab === 'classes') {
        const result = await deleteClass(itemToDelete.id, itemToDelete.value);
        error = result.error;
      } else if (activeTab === 'branches') {
        const result = await deleteBranch(itemToDelete.id, itemToDelete.name);
        error = result.error;
      } else {
        const result = await deleteDepartment(itemToDelete.id, itemToDelete.name);
        error = result.error;
      }

      if (error) throw new Error(error);

      Alert.alert('Success', `${activeTab.slice(0, -1)} deleted successfully`);
      setDeleteConfirmVisible(false);
      setItemToDelete(null);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete');
    }
  };

  const confirmDelete = (item: any) => {
    setItemToDelete(item);
    setDeleteConfirmVisible(true);
  };

  const renderSubjectItem = ({ item }: { item: SubjectItem }) => {
    return (
      <SubjectCard
        subject={item}
        onEdit={(subject) => {
          // Set selectedSubject state with current subject data
          setSelectedSubject(subject);
          
          // Open SubjectForm modal with initialValues
          // The form will automatically load teacher assignments from subject.teachers
          // and extract teacherIds and primaryTeacherId
          setModalVisible(true);
        }}
        onDelete={handleSubjectDelete}
        showActions={true}
      />
    );
  };

  const renderItem = ({ item }: { item: ClassItem | BranchItem | DepartmentItem }) => {
    const isClass = activeTab === 'classes';
    const isBranch = activeTab === 'branches';
    const isDepartment = activeTab === 'departments';
  
    return (
      <View style={[styles.card, { backgroundColor: dynamicStyles.cardBackground }]}>
        <View style={styles.cardContent}>
          <View style={styles.itemInfo}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemName, { color: dynamicStyles.cardText }]}>{item.name}</Text>
              <View style={styles.statusBadge}>
                {item.is_active ? (
                  <View style={[styles.statusIndicator, { backgroundColor: tokens.colors.success.main }]}/>
                ) : (
                  <View style={[styles.statusIndicator, { backgroundColor: '#9CA3AF' }]}/>
                )}
              </View>
            </View>
  
            <View style={styles.itemDetails}>
              {isClass && (
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag" size={16} color={dynamicStyles.cardSecondaryText} />
                  <Text style={[styles.itemDetail, { color: dynamicStyles.cardSecondaryText }]}>
                    Value: {(item as ClassItem).value}
                  </Text>
                </View>
              )}
  
              {isBranch && (
                <>
                  <View style={styles.detailRow}>
                    <Ionicons name="code" size={16} color={dynamicStyles.cardSecondaryText} />
                    <Text style={[styles.itemDetail, { color: dynamicStyles.cardSecondaryText }]}>
                      Code: {(item as BranchItem).code}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="school" size={16} color={dynamicStyles.cardSecondaryText} />
                    <Text style={[styles.itemDetail, { color: dynamicStyles.cardSecondaryText }]}>
                      Class: {(item as BranchItem).class_id ? classes.find(c => c.id === (item as BranchItem).class_id)?.name || 'Unknown' : 'All Classes'}
                    </Text>
                  </View>
                </>
              )}
  
              {isDepartment && (
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={16} color={dynamicStyles.cardSecondaryText} />
                  <Text style={[styles.itemDetail, { color: dynamicStyles.cardSecondaryText }]}>
                    Code: {(item as DepartmentItem).code}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={[styles.actionButton, { backgroundColor: dynamicStyles.actionButtonBg }]}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.name}`}
              accessibilityHint="Opens edit form"
            >
              <Ionicons name="pencil" size={20} color={tokens.colors.primary.main} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDelete(item)}
              style={[styles.actionButton, { backgroundColor: dynamicStyles.actionButtonBg }]}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
              accessibilityHint="Opens delete confirmation"
            >
              <Ionicons name="trash" size={20} color={tokens.colors.error.main} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const getCurrentData = () => {
    let data: (ClassItem | BranchItem | DepartmentItem)[] = [];
    if (activeTab === 'classes') data = classes;
    else if (activeTab === 'branches') data = branches;
    else if (activeTab === 'departments') data = departments;
    else return []; // subjects handled separately

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item => 
        item.name.toLowerCase().includes(query) ||
        ('code' in item && item.code?.toLowerCase().includes(query))
      );
    }

    // Sort data
    data = [...data].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      const dateA = 'created_at' in a && a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = 'created_at' in b && b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return data;
  };

  const getFilteredSubjects = () => {
    let data = [...subjects];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query)
      );
    }

    // Sort data
    data = data.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return data;
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'classes':
        return (
          <CreateClassForm
            onSubmit={handleClassSubmit}
            onCancel={() => setModalVisible(false)}
            loading={saving}
            initialValues={editingItem as ClassItem | undefined}
          />
        );
      case 'branches':
        return (
          <CreateBranchForm
            onSubmit={handleBranchSubmit}
            onCancel={() => setModalVisible(false)}
            loading={saving}
            classes={classes}
            initialValues={editingItem as BranchItem | undefined}
          />
        );
      case 'departments':
        return (
          <CreateDepartmentForm
            onSubmit={handleDepartmentSubmit}
            onCancel={() => setModalVisible(false)}
            loading={saving}
            initialValues={editingItem as DepartmentItem | undefined}
          />
        );
      case 'subjects':
        return (
          <SubjectForm
            onSubmit={handleSubjectSubmit}
            onCancel={() => setModalVisible(false)}
            loading={saving}
            initialValues={selectedSubject ? {
              ...selectedSubject,
              teacher_ids: selectedSubject.teachers?.map(t => t.id) || [],
              primary_teacher_id: selectedSubject.teachers?.find(t => t.is_primary)?.id || ''
            } : undefined}
          />
        );
      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
      paddingHorizontal: 24,
      paddingTop: 48,
      paddingBottom: 24,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerTextContainer: {
      flex: 1,
    },
    headerTitles: {
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: '#FFFFFF',
      marginBottom: 8,
      lineHeight: 34,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#FFFFFF',
      opacity: 0.95,
      lineHeight: 22,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 16,
      padding: 12,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.8,
    },
    createButton: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    tabContainer: {
      paddingHorizontal: 24,
      paddingTop: 24,
      marginBottom: 16,
    },
    customTabs: {
      flexDirection: 'row',
      gap: 8,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    searchContainer: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      gap: 8,
      marginBottom: 16,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      padding: 0,
    },
    sortButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterContainer: {
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    filterToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterToggleText: {
      fontSize: 16,
      fontWeight: '500',
    },
    transitionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    transitionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    list: {
      padding: 24,
      paddingBottom: 40,
    },
    card: {
      marginBottom: 16,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    cardContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
    },
    itemInfo: { flex: 1 },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    itemName: {
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
    },
    statusBadge: {
      marginLeft: 12,
    },
    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    itemDetails: {
      gap: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    itemDetail: {
      fontSize: 14,
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalDismissArea: {
      flex: 1,
    },
    modal: {
      width: '100%',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '85%',
      minHeight: 400,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 16,
    },
    modalActions: {
      flexDirection: 'row',
      marginTop: 24,
    },
    // Enhanced Modal Styles
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalBackdropTouchable: {
      flex: 1,
    },
    modalContainer: {
      flex: 1,
    },
    modalSheet: {
      width: '100%',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      minHeight: 400,
      elevation: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    sheetHeader: {
      padding: 24,
      paddingBottom: 16,
    },
    sheetTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
    },
    formContainer: {
      paddingHorizontal: 24,
      paddingBottom: 34,
    },
  });

  // Dynamic styles based on theme
  const dynamicStyles = {
    cardBackground: mode === 'dark' ? tokens.colors.theme.dark.surface : '#FFFFFF',
    cardText: mode === 'dark' ? tokens.colors.theme.dark.text : '#1F2937',
    cardSecondaryText: mode === 'dark' ? tokens.colors.theme.dark.textSecondary : '#6B7280',
    actionButtonBg: mode === 'dark' ? tokens.colors.theme.dark.input : '#F3F4F6',
    dragHandleBg: mode === 'dark' ? tokens.colors.theme.dark.border : '#E5E7EB',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.roles.admin.main }]}>
      <StatusBar barStyle="light-content" backgroundColor={tokens.colors.roles.admin.main} translucent={true} />

      {/* Enhanced Header Section */}
      <View style={[styles.header, { backgroundColor: tokens.colors.roles.admin.main }]}>        
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Organization Manager</Text>
              <Text style={styles.headerSubtitle}>Manage classes, branches, and departments</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{classes.length}</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{branches.length}</Text>
                <Text style={styles.statLabel}>Branches</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{departments.length}</Text>
                <Text style={styles.statLabel}>Depts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{subjects.length}</Text>
                <Text style={styles.statLabel}>Subjects</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={openCreateModal}
            style={styles.createButton}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Create new ${activeTab.slice(0, -1)}`}
            accessibilityHint={`Opens form to create a new ${activeTab.slice(0, -1)}`}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area with Background */}
      <View style={{ flex: 1, backgroundColor: getBackgroundColor() }}>
        <View style={styles.tabContainer}>
        <View style={styles.customTabs}>
          {[
            { value: 'classes' as TabType, label: 'Classes', icon: 'school-outline' },
            { value: 'branches' as TabType, label: 'Branches', icon: 'git-branch-outline' },
            { value: 'departments' as TabType, label: 'Departments', icon: 'business-outline' },
            { value: 'subjects' as TabType, label: 'Subjects', icon: 'book-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.value}
              style={[
                styles.tabButton,
                activeTab === tab.value && { backgroundColor: tokens.colors.primary.main },
              ]}
              onPress={() => setActiveTab(tab.value)}
              accessible
              accessibilityRole="tab"
              accessibilityLabel={`${tab.label} tab`}
              accessibilityState={{ selected: activeTab === tab.value }}
              accessibilityHint={`Switches to ${tab.label} view`}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.value ? '#FFFFFF' : getTextColor()}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  { color: activeTab === tab.value ? '#FFFFFF' : getTextColor() },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search and Sort Bar */}
      <View style={styles.searchContainer}>
        <View 
          style={[styles.searchInputContainer, { backgroundColor: getSurfaceColor() }]}
          accessible
          accessibilityRole="search"
        >
          <Ionicons name="search" size={20} color={getTextSecondaryColor()} />
          <TextInput
            style={[styles.searchInput, { color: getTextColor() }]}
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor={getTextSecondaryColor()}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessible
            accessibilityLabel={`Search ${activeTab}`}
            accessibilityHint={`Type to filter ${activeTab} by name or code`}
          />
          {searchQuery !== '' && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              accessibilityHint="Clears the search text"
            >
              <Ionicons name="close-circle" size={20} color={getTextSecondaryColor()} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: getSurfaceColor() }]}
          onPress={() => setSortBy(sortBy === 'name' ? 'date' : 'name')}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${sortBy === 'name' ? 'date' : 'name'}`}
          accessibilityHint={`Currently sorting by ${sortBy}, tap to change`}
        >
          <Ionicons
            name={sortBy === 'name' ? 'text-outline' : 'time-outline'}
            size={20}
            color={getTextColor()}
          />
        </TouchableOpacity>
      </View>

      {/* Show Archived Toggle for Subjects Tab */}
      {activeTab === 'subjects' && (
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowArchivedSubjects(!showArchivedSubjects)}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Show archived subjects toggle"
              accessibilityHint={`Currently ${showArchivedSubjects ? 'showing' : 'hiding'} archived subjects`}
            >
              <Ionicons
                name={showArchivedSubjects ? 'checkbox' : 'square-outline'}
                size={24}
                color={showArchivedSubjects ? tokens.colors.primary.main : getTextSecondaryColor()}
              />
              <Text style={[styles.filterToggleText, { color: getTextColor() }]}>
                Show Archived
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.transitionButton, { backgroundColor: tokens.colors.primary.main }]}
              onPress={() => setTransitionDialogVisible(true)}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Academic Year Transition"
              accessibilityHint="Copy subjects from one academic year to another"
            >
              <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
              <Text style={styles.transitionButtonText}>
                Year Transition
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LoadingSpinner size="large" />
        </View>
      ) : activeTab === 'subjects' ? (
        <FlatList
          data={getFilteredSubjects()}
          renderItem={renderSubjectItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchSubjects}
          ListEmptyComponent={
            <EmptyState
              icon="book-outline"
              title="No subjects found"
              message="Create your first subject to get started"
            />
          }
        />
      ) : (
        <FlatList
          data={getCurrentData()}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open"
              title={`No ${activeTab} found`}
              message={`Create your first ${activeTab.slice(0, -1)} to get started`}
            />
          }
        />
      )}

      {/* Create/Edit Modal - Enhanced Bottom Sheet */}
      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
          >
            <View style={[styles.modalSheet, { backgroundColor: getSurfaceColor() }]}>              
              <View style={styles.sheetHeader}>
                <View style={[styles.dragHandle, { backgroundColor: dynamicStyles.dragHandleBg }]} />
                <View style={styles.sheetTitleContainer}>
                  <Text style={[styles.modalTitle, { color: getTextColor() }]}>                
                    {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Create ${activeTab.slice(0, -1)}`}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setModalVisible(false)}
                    style={[styles.closeButton, { backgroundColor: dynamicStyles.actionButtonBg }]}
                    accessibilityLabel="Close form"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={24} color={getTextSecondaryColor()} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <KeyboardAwareScrollView
                contentContainerStyle={styles.formContainer}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                scrollEnabled={true}
                extraScrollHeight={120}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {renderForm()}
              </KeyboardAwareScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={deleteConfirmVisible}
        title={`Delete ${activeTab.slice(0, -1)}`}
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        destructive
      />

      {/* Academic Year Transition Dialog */}
      <AcademicYearTransitionDialog
        visible={transitionDialogVisible}
        onClose={() => setTransitionDialogVisible(false)}
        onConfirm={handleAcademicYearTransition}
      />
      </View>
    </SafeAreaView>
  );
}
