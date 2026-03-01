import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../design-system/primitives/Input';
import Button from '../../design-system/primitives/Button';
import EnhancedPicker from '../../EnhancedPicker';
import { useTheme } from '../../../lib/design-system/ThemeContext';
import { fontWeights } from '../../../lib/design-system/tokens';
import { SubjectItem, AcademicYearItem } from '../../../lib/types';
import { ClassItem } from '../../../lib/organization';
import { getClasses } from '../../../lib/organization';
import { supabase } from '../../../lib/supabase';
import { validateSubjectForm } from '../../../lib/subjectValidation';

interface SubjectFormProps {
  onSubmit: (
    name: string,
    code: string,
    classId: string,
    academicYearId: string,
    teacherIds: string[],
    primaryTeacherId: string,
    isActive: boolean
  ) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  initialValues?: SubjectItem & {
    teacher_ids?: string[];
    primary_teacher_id?: string;
  };
}

interface TeacherItem {
  id: string;
  full_name: string;
  branch_id: string;
}

export default function SubjectForm({ onSubmit, onCancel, loading, initialValues }: SubjectFormProps) {
  const { 
    tokens, 
    getTextColor,
    getTextSecondaryColor, 
    getSurfaceColor, 
    getBorderColor 
  } = useTheme();

  // Form state
  const [name, setName] = useState(initialValues?.name || '');
  const [code, setCode] = useState(initialValues?.code || '');
  const [classId, setClassId] = useState(initialValues?.class_id || '');
  const [academicYearId, setAcademicYearId] = useState(initialValues?.academic_year_id || '');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>(initialValues?.teacher_ids || []);
  const [primaryTeacherId, setPrimaryTeacherId] = useState(initialValues?.primary_teacher_id || '');
  const [isActive, setIsActive] = useState(initialValues?.is_active ?? true);
  
  // Dropdown data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherItem[]>([]);
  
  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load classes on mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Load academic years on mount
  useEffect(() => {
    loadAcademicYears();
  }, []);

  // Load teachers on mount
  useEffect(() => {
    loadTeachers();
  }, []);

  // Filter teachers when class changes
  useEffect(() => {
    if (classId && classes.length > 0 && teachers.length > 0) {
      filterTeachersByBranch(classId);
    } else {
      setFilteredTeachers([]);
      // Clear teacher selections if class changes
      if (!initialValues) {
        setSelectedTeacherIds([]);
        setPrimaryTeacherId('');
      }
    }
  }, [classId, classes, teachers]);

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const { data, error } = await getClasses(false); // Only active classes
      if (error) {
        console.error('Error loading classes:', error);
        Alert.alert('Error', 'Failed to load classes');
      } else if (data) {
        setClasses(data);
      }
    } catch (error) {
      console.error('Exception loading classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadAcademicYears = async () => {
    try {
      setLoadingYears(true);
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error loading academic years:', error);
        Alert.alert('Error', 'Failed to load academic years');
      } else if (data) {
        setAcademicYears(data);
        
        // Set current academic year as default if not editing
        if (!initialValues) {
          const currentYear = data.find(y => y.is_current);
          if (currentYear) {
            setAcademicYearId(currentYear.id);
          }
        }
      }
    } catch (error) {
      console.error('Exception loading academic years:', error);
    } finally {
      setLoadingYears(false);
    }
  };

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, branch_id')
        .eq('role', 'teacher')
        .eq('is_verified', true)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error loading teachers:', error);
        Alert.alert('Error', 'Failed to load teachers');
      } else if (data) {
        setTeachers(data);
      }
    } catch (error) {
      console.error('Exception loading teachers:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const filterTeachersByBranch = (selectedClassId: string) => {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass) {
      setFilteredTeachers([]);
      return;
    }

    // Get the branch_id from the selected class
    // Note: We need to fetch the class with branch_id
    supabase
      .from('classes')
      .select('branch_id')
      .eq('id', selectedClassId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching class branch:', error);
          setFilteredTeachers([]);
          return;
        }

        if (data) {
          const classBranchId = data.branch_id;
          const filtered = teachers.filter(t => t.branch_id === classBranchId);
          setFilteredTeachers(filtered);

          // Clear teacher selections if they're not in the filtered list
          if (!initialValues) {
            const validTeacherIds = selectedTeacherIds.filter(id => 
              filtered.some(t => t.id === id)
            );
            setSelectedTeacherIds(validTeacherIds);
            
            if (primaryTeacherId && !filtered.some(t => t.id === primaryTeacherId)) {
              setPrimaryTeacherId('');
            }
          }
        }
      });
  };

  const handleNameChange = (text: string) => {
    setName(text);
    // Auto-generate code if creating a new subject and code is empty or hasn't been manually edited
    if (!initialValues && (!code || code === name.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, -1))) {
      setCode(text.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    }
  };

  const handleTeacherToggle = (teacherId: string) => {
    if (selectedTeacherIds.includes(teacherId)) {
      // Remove teacher
      const newTeacherIds = selectedTeacherIds.filter(id => id !== teacherId);
      setSelectedTeacherIds(newTeacherIds);
      
      // Clear primary if removing the primary teacher
      if (primaryTeacherId === teacherId) {
        setPrimaryTeacherId('');
      }
    } else {
      // Add teacher
      const newTeacherIds = [...selectedTeacherIds, teacherId];
      setSelectedTeacherIds(newTeacherIds);
      
      // Auto-set as primary if it's the first teacher
      if (newTeacherIds.length === 1) {
        setPrimaryTeacherId(teacherId);
      }
    }
  };

  const handlePrimaryTeacherChange = (teacherId: string) => {
    setPrimaryTeacherId(teacherId);
  };

  const validate = () => {
    // Use the validation function from subjectValidation.ts
    const result = validateSubjectForm(
      name,
      code,
      classId,
      academicYearId,
      selectedTeacherIds,
      primaryTeacherId
    );

    setErrors(result.errors);
    return result.valid;
  };

  const handleSubmit = async () => {
    if (validate()) {
      // Ensure primary teacher is set (auto-set if only one teacher)
      const finalPrimaryTeacherId = selectedTeacherIds.length === 1 
        ? selectedTeacherIds[0] 
        : primaryTeacherId;

      await onSubmit(
        name.trim(),
        code.trim().toLowerCase(),
        classId,
        academicYearId,
        selectedTeacherIds,
        finalPrimaryTeacherId,
        isActive
      );
    }
  };

  const isEditMode = !!initialValues;
  const isFormReady = !loadingClasses && !loadingYears && !loadingTeachers;

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      accessible
      accessibilityRole="none"
      accessibilityLabel="Subject form"
    >
      <Input
        label="Subject Name *"
        value={name}
        onChangeText={handleNameChange}
        placeholder="e.g. Mathematics"
        error={errors.name}
        editable={!loading}
        accessible
        accessibilityLabel="Subject name input"
        accessibilityHint="Enter the name of the subject"
      />
      
      <View style={{ marginBottom: tokens.spacing.md }}>
        <Input
          label="Subject Code *"
          value={code}
          onChangeText={setCode}
          placeholder="e.g. math_101"
          autoCapitalize="none"
          error={errors.code}
          editable={!loading}
          style={{ marginBottom: tokens.spacing.xs }}
          accessible
          accessibilityLabel="Subject code input"
          accessibilityHint="Enter a unique identifier using lowercase letters, numbers, and underscores"
        />
        <Text 
          style={{ 
            fontSize: tokens.typography.caption.fontSize, 
            color: getTextSecondaryColor(), 
            marginLeft: tokens.spacing.xs 
          }}
          accessible
          accessibilityRole="text"
        >
          Unique identifier (lowercase, numbers, _)
        </Text>
      </View>

      <EnhancedPicker
        label="Class *"
        value={classId}
        items={classes.map(c => ({ label: c.name, value: c.id }))}
        onValueChange={setClassId}
        error={errors.classId}
        disabled={loading || loadingClasses}
        placeholder={loadingClasses ? 'Loading classes...' : 'Select a class'}
        testID="subject-class-picker"
      />

      <EnhancedPicker
        label="Academic Year *"
        value={academicYearId}
        items={academicYears.map(y => ({ 
          label: `${y.name}${y.is_current ? ' (Current)' : ''}`, 
          value: y.id 
        }))}
        onValueChange={setAcademicYearId}
        error={errors.academicYearId}
        disabled={loading || loadingYears || isEditMode}
        placeholder={loadingYears ? 'Loading academic years...' : 'Select academic year'}
        testID="subject-academic-year-picker"
      />
      {isEditMode && (
        <Text 
          style={{ 
            fontSize: tokens.typography.caption.fontSize, 
            color: getTextSecondaryColor(), 
            marginLeft: tokens.spacing.xs, 
            marginTop: -tokens.spacing.md, 
            marginBottom: tokens.spacing.md 
          }}
          accessible
          accessibilityRole="text"
        >
          Academic year cannot be changed after creation
        </Text>
      )}

      {/* Teacher Multi-Select */}
      <View 
        style={{ marginBottom: tokens.spacing.md }}
        accessible
        accessibilityRole="none"
        accessibilityLabel="Teacher selection section"
      >
        <Text style={[
          styles.label, 
          { 
            fontSize: tokens.typography.body.fontSize,
            fontWeight: fontWeights.semibold,
            color: getTextColor(),
            marginBottom: tokens.spacing.sm,
          },
          errors.teacherIds && { color: tokens.colors.error.main }
        ]}>
          Teachers *
        </Text>
        
        {!classId && (
          <Text 
            style={{ 
              fontSize: tokens.typography.body.fontSize, 
              color: getTextSecondaryColor(), 
              marginBottom: tokens.spacing.md 
            }}
            accessible
            accessibilityRole="text"
          >
            Please select a class first to see available teachers
          </Text>
        )}

        {classId && filteredTeachers.length === 0 && !loadingTeachers && (
          <View 
            style={[
              styles.warningBox, 
              { 
                backgroundColor: getSurfaceColor(),
                borderColor: tokens.colors.warning.main,
                padding: tokens.spacing.md,
                borderRadius: tokens.borders.medium,
                borderWidth: 1,
                marginBottom: tokens.spacing.md,
              }
            ]}
            accessible
            accessibilityRole="alert"
            accessibilityLabel="Warning: No teachers available for this class's branch"
          >
            <Ionicons 
              name="warning-outline" 
              size={20} 
              color={tokens.colors.warning.main} 
              style={{ marginRight: tokens.spacing.sm }}
            />
            <Text style={{ 
              fontSize: tokens.typography.body.fontSize, 
              color: tokens.colors.warning.main,
              flex: 1
            }}>
              No teachers available for this class's branch
            </Text>
          </View>
        )}

        {classId && filteredTeachers.length > 0 && (
          <View 
            style={[
              styles.teacherList, 
              { 
                backgroundColor: getSurfaceColor(),
                borderColor: errors.teacherIds ? tokens.colors.error.main : getBorderColor(),
                borderRadius: tokens.borders.medium,
                borderWidth: 1,
              }
            ]}
            accessible
            accessibilityRole="list"
            accessibilityLabel={`Teacher list, ${selectedTeacherIds.length} of ${filteredTeachers.length} selected`}
          >
            {filteredTeachers.map(teacher => {
              const isSelected = selectedTeacherIds.includes(teacher.id);
              const isPrimary = primaryTeacherId === teacher.id;

              return (
                <TouchableOpacity
                  key={teacher.id}
                  style={[
                    styles.teacherItem,
                    isSelected && styles.teacherItemSelected,
                    { 
                      borderBottomColor: getBorderColor(),
                      padding: tokens.spacing.md,
                      borderBottomWidth: 1,
                    }
                  ]}
                  onPress={() => handleTeacherToggle(teacher.id)}
                  disabled={loading}
                  accessible
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`${teacher.full_name}${isPrimary ? ', primary teacher' : ''}`}
                  accessibilityHint={isSelected ? "Tap to deselect this teacher" : "Tap to select this teacher"}
                >
                  <View style={styles.teacherItemLeft}>
                    <View style={[
                      styles.checkbox,
                      { 
                        borderColor: getBorderColor(),
                        width: 24,
                        height: 24,
                        borderRadius: tokens.borders.small,
                        borderWidth: 2,
                        marginRight: tokens.spacing.md,
                      },
                      isSelected && { 
                        backgroundColor: tokens.colors.primary.main,
                        borderColor: tokens.colors.primary.main
                      }
                    ]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={tokens.colors.neutral.white} />
                      )}
                    </View>
                    <Text style={[
                      styles.teacherName,
                      { 
                        color: getTextSecondaryColor(),
                        fontSize: tokens.typography.body.fontSize,
                      },
                      isSelected && { 
                        color: tokens.colors.primary.main,
                        fontWeight: fontWeights.semibold,
                      }
                    ]}>
                      {teacher.full_name}
                    </Text>
                  </View>

                  {isSelected && selectedTeacherIds.length > 1 && (
                    <TouchableOpacity
                      style={[styles.primaryButton, { padding: tokens.spacing.xs }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePrimaryTeacherChange(teacher.id);
                      }}
                      disabled={loading}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={isPrimary ? "Primary teacher" : "Set as primary teacher"}
                      accessibilityHint={isPrimary ? "This is the primary teacher" : "Tap to set as primary teacher"}
                    >
                      <Ionicons
                        name={isPrimary ? "star" : "star-outline"}
                        size={20}
                        color={isPrimary ? tokens.colors.warning.main : getTextSecondaryColor()}
                      />
                      {isPrimary && (
                        <Text style={{ 
                          fontSize: tokens.typography.caption.fontSize, 
                          color: tokens.colors.warning.main,
                          marginLeft: tokens.spacing.xs,
                          fontWeight: fontWeights.semibold,
                        }}>
                          Primary
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {errors.teacherIds && (
          <Text 
            style={[
              styles.errorText,
              {
                fontSize: tokens.typography.body.fontSize,
                color: tokens.colors.error.main,
                marginTop: tokens.spacing.xs,
                marginLeft: tokens.spacing.xs,
              }
            ]}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >{errors.teacherIds}</Text>
        )}
        {errors.primaryTeacherId && (
          <Text 
            style={[
              styles.errorText,
              {
                fontSize: tokens.typography.body.fontSize,
                color: tokens.colors.error.main,
                marginTop: tokens.spacing.xs,
                marginLeft: tokens.spacing.xs,
              }
            ]}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >{errors.primaryTeacherId}</Text>
        )}

        {selectedTeacherIds.length > 1 && (
          <Text 
            style={{ 
              fontSize: tokens.typography.caption.fontSize, 
              color: getTextSecondaryColor(), 
              marginTop: tokens.spacing.sm, 
              marginLeft: tokens.spacing.xs 
            }}
            accessible
            accessibilityRole="text"
          >
            Tap the star icon to designate a primary teacher
          </Text>
        )}
      </View>

      {/* Active Status Toggle */}
      <View 
        style={{ marginBottom: tokens.spacing.md }}
        accessible
        accessibilityRole="none"
      >
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text 
              style={[
                styles.label, 
                { 
                  marginBottom: tokens.spacing.xs,
                  fontSize: tokens.typography.body.fontSize,
                  fontWeight: fontWeights.semibold,
                  color: getTextColor(),
                }
              ]}
              accessible
              accessibilityRole="text"
            >
              Active Status
            </Text>
            <Text 
              style={{ 
                fontSize: tokens.typography.caption.fontSize, 
                color: getTextSecondaryColor() 
              }}
              accessible
              accessibilityRole="text"
            >
              {isActive ? 'Subject is active and visible to students' : 'Subject is archived and hidden from students'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              { 
                backgroundColor: isActive ? tokens.colors.success.main : tokens.colors.neutral.gray500,
                width: 52,
                height: 32,
                borderRadius: tokens.borders.full,
                padding: 2,
              }
            ]}
            onPress={() => setIsActive(!isActive)}
            disabled={loading}
            accessible
            accessibilityRole="switch"
            accessibilityState={{ checked: isActive }}
            accessibilityLabel="Active status toggle"
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  width: 28,
                  height: 28,
                  borderRadius: tokens.borders.full,
                  backgroundColor: tokens.colors.neutral.white,
                  ...tokens.shadows.sm,
                },
                isActive && styles.toggleThumbActive
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.actions, { marginTop: tokens.spacing.xl, marginBottom: tokens.spacing.md }]}>
        <Button
          variant="secondary"
          onPress={onCancel}
          style={{ flex: 1, marginRight: tokens.spacing.sm }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={loading}
          disabled={!isFormReady}
          style={{ flex: 1 }}
        >
          {initialValues ? 'Update Subject' : 'Create Subject'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    // Styles applied inline using tokens
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherList: {
    overflow: 'hidden',
  },
  teacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teacherItemSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  teacherItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherName: {
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    // Styles applied inline using tokens
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    justifyContent: 'center',
  },
  toggleThumb: {
    // Styles applied inline using tokens
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  actions: {
    flexDirection: 'row',
  },
});
