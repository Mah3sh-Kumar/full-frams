import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Alert, FlatList, ScrollView, TouchableOpacity, Modal, Text, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedButtons } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { verifyUser, unverifyUser, updateUserRole, deleteUser } from '../../lib/admin';
import { useTheme } from '../../lib/design-system/ThemeContext';
import Button from '../../components/design-system/primitives/Button';
import Input from '../../components/design-system/primitives/Input';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import SelectPicker from '../../components/design-system/primitives/SelectPicker';
import { Ionicons } from '@expo/vector-icons';
import { exportCSV } from '../../lib/csvExport';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import EnhancedPicker from '../../components/EnhancedPicker';
import { getClasses, getBranches, getDepartments, ClassItem, BranchItem, DepartmentItem } from '../../lib/organization';
import { ActionButton } from '../../components/common/ActionButtons';

type UserData = {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'teacher' | 'student';
    is_verified: boolean;
    verified_at?: string;
    department?: string;
    enrollment_number?: string;
    class_level?: string;
    branch?: string;
    avatar_url?: string;  // Added avatar URL
    created_at?: string;  // Added created date
    last_login?: string;  // Added last login
};

export default function UserManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterVerification, setFilterVerification] = useState<string>('all');

    // Edit Modal State
    const [visible, setVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState<'admin' | 'teacher' | 'student'>('student');
    const [editDepartment, setEditDepartment] = useState('');
    const [editEnrollment, setEditEnrollment] = useState('');
    const [editClassLevel, setEditClassLevel] = useState('');
    const [editBranch, setEditBranch] = useState('');
    const [saving, setSaving] = useState(false);

    // Delete Confirmation
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

    // Verification Confirmation
    const [verifyConfirmVisible, setVerifyConfirmVisible] = useState(false);
    const [unverifyConfirmVisible, setUnverifyConfirmVisible] = useState(false);
    const [userToVerify, setUserToVerify] = useState<UserData | null>(null);

    // Create User Modal
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newUserRole, setNewUserRole] = useState<'student' | 'teacher'>('student');
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [showNewUserPassword, setShowNewUserPassword] = useState(false);
    const [newUserDepartment, setNewUserDepartment] = useState('');
    const [newUserEnrollment, setNewUserEnrollment] = useState('');
    const [newUserClassLevel, setNewUserClassLevel] = useState('');
    const [newUserBranch, setNewUserBranch] = useState('');
    const [creating, setCreating] = useState(false);

    // Database-driven dropdown data
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [departments, setDepartments] = useState<DepartmentItem[]>([]);
    const [branches, setBranches] = useState<BranchItem[]>([]);
    const [editBranches, setEditBranches] = useState<BranchItem[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchOrganizationalData();
    }, []);

    // Fetch branches when new user class level changes
    useEffect(() => {
        if (newUserClassLevel) {
            fetchBranchesForClass(newUserClassLevel, false);
        }
    }, [newUserClassLevel]);

    // Fetch branches when edit user class level changes
    useEffect(() => {
        if (editClassLevel) {
            fetchBranchesForClass(editClassLevel, true);
        }
    }, [editClassLevel]);

    const fetchOrganizationalData = async () => {
        setLoadingData(true);
        setDataError(null);
        try {
            const [classesResult, departmentsResult] = await Promise.all([
                getClasses(),
                getDepartments(),
            ]);

            if (classesResult.error) {
                throw new Error(classesResult.error);
            }
            if (departmentsResult.error) {
                throw new Error(departmentsResult.error);
            }

            setClasses(classesResult.data || []);
            setDepartments(departmentsResult.data || []);

            // Set default values
            if (classesResult.data && classesResult.data.length > 0) {
                setNewUserClassLevel(classesResult.data[0].id);
            }
            if (departmentsResult.data && departmentsResult.data.length > 0) {
                setNewUserDepartment(departmentsResult.data[0].name);
            }
        } catch (error: any) {
            console.error('Error fetching organizational data:', error);
            setDataError(error.message || 'Failed to load form data');
        } finally {
            setLoadingData(false);
        }
    };

    const fetchBranchesForClass = async (classId: string, isEdit: boolean) => {
        try {
            if (!classId) {
                if (isEdit) {
                    setEditBranches([]);
                } else {
                    setBranches([]);
                }
                return;
            }

            const branchesResult = await getBranches(classId);
            if (branchesResult.error) {
                throw new Error(branchesResult.error);
            }

            if (isEdit) {
                setEditBranches(branchesResult.data || []);
                // Set default branch if available
                if (branchesResult.data && branchesResult.data.length > 0) {
                    setEditBranch(branchesResult.data[0].name);
                } else {
                    setEditBranch('');
                }
            } else {
                setBranches(branchesResult.data || []);
                // Set default branch if available
                if (branchesResult.data && branchesResult.data.length > 0) {
                    setNewUserBranch(branchesResult.data[0].name);
                } else {
                    setNewUserBranch('');
                }
            }
        } catch (error: any) {
            console.error('Error fetching branches:', error);
            if (isEdit) {
                setEditBranches([]);
            } else {
                setBranches([]);
            }
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            const { data: teachersData } = await supabase.from('teachers').select('id, department');
            const { data: studentsData } = await supabase.from('students').select('id, enrollment_number, class_level, branch, class_id');

            const mergedUsers = usersData.map((user: any) => {
                const teacher = teachersData?.find((t: any) => t.id === user.id);
                const student = studentsData?.find((s: any) => s.id === user.id);
                return {
                    ...user,
                    department: teacher?.department,
                    enrollment_number: student?.enrollment_number,
                    class_level: student?.class_level,
                    branch: student?.branch,
                    class_id: student?.class_id,   // consolidated schema: org_class_id → class_id
                };
            });

            setUsers(mergedUsers);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to fetch users');
            console.error('Fetch users error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyUser = async () => {
        if (!userToVerify) return;

        try {
            const { error } = await verifyUser(userToVerify.id);
            if (error) throw new Error(error);

            Alert.alert('Success', 'User verified successfully');
            setVerifyConfirmVisible(false);
            setUserToVerify(null);
            fetchUsers();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to verify user');
        }
    };

    const handleUnverifyUser = async () => {
        if (!userToVerify) return;

        try {
            const { error } = await unverifyUser(userToVerify.id);
            if (error) throw new Error(error);

            Alert.alert('Success', 'User unverified successfully');
            setUnverifyConfirmVisible(false);
            setUserToVerify(null);
            fetchUsers();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to unverify user');
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;

        try {
            const { error } = await deleteUser(userToDelete.id);
            if (error) throw new Error(error);

            Alert.alert('Success', 'User deleted successfully');
            setDeleteConfirmVisible(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete user');
        }
    };

    const openEditModal = (user: UserData | any) => {
        setSelectedUser(user);
        setEditName(user.full_name || '');
        setEditRole(user.role);
        setEditDepartment(user.department || (departments.length > 0 ? departments[0].name : ''));
        setEditEnrollment(user.enrollment_number || '');
        setEditClassLevel(user.class_id || (classes.find(c => c.value === user.class_level)?.id) || '');
        setEditBranch(user.branch || '');
        setVisible(true);
    };

    const handleSave = async () => {
        if (!selectedUser) return;

        if (!editName.trim()) {
            Alert.alert('Error', 'Full name is required');
            return;
        }

        setSaving(true);
        try {
            // Update user profile
            const { error: userError } = await supabase
                .from('users')
                .update({ full_name: editName })
                .eq('id', selectedUser.id);

            if (userError) throw userError;

            // Handle role change
            if (editRole !== selectedUser.role) {
                // Delete old role-specific data
                if (selectedUser.role === 'teacher') {
                    await supabase.from('teachers').delete().eq('id', selectedUser.id);
                } else if (selectedUser.role === 'student') {
                    await supabase.from('students').delete().eq('id', selectedUser.id);
                }

                // Update role
                const { error: roleError } = await updateUserRole(selectedUser.id, editRole);
                if (roleError) throw new Error(roleError);

                // Create new role-specific data
                if (editRole === 'teacher') {
                    await supabase.from('teachers').insert({
                        id: selectedUser.id,
                        department: editDepartment
                    });
                } else if (editRole === 'student') {
                    if (!editEnrollment.trim()) {
                        throw new Error('Enrollment number is required for students');
                    }
                    await supabase.from('students').insert({
                        id: selectedUser.id,
                        enrollment_number: editEnrollment,
                        class_id: editClassLevel,    // consolidated schema: org_class_id → class_id
                        class_level: classes.find(c => c.id === editClassLevel)?.value || '',
                        branch: editBranch
                    });
                }
            } else {
                // Update existing role-specific data
                if (editRole === 'teacher') {
                    await supabase.from('teachers').upsert({
                        id: selectedUser.id,
                        department: editDepartment
                    });
                } else if (editRole === 'student') {
                    if (!editEnrollment.trim()) {
                        throw new Error('Enrollment number is required for students');
                    }
                    await supabase.from('students').upsert({
                        id: selectedUser.id,
                        enrollment_number: editEnrollment,
                        class_id: editClassLevel,    // consolidated schema: org_class_id → class_id
                        class_level: classes.find(c => c.id === editClassLevel)?.value || '',
                        branch: editBranch
                    });
                }
            }

            Alert.alert('Success', 'User updated successfully');
            setVisible(false);
            fetchUsers();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update user');
            console.error('Save error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
            return Alert.alert('Error', 'Please fill all required fields');
        }

        if (newUserRole === 'student' && !newUserEnrollment.trim()) {
            return Alert.alert('Error', 'Enrollment number is required for students');
        }

        setCreating(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: newUserEmail,
                password: newUserPassword,
                options: {
                    data: {
                        full_name: newUserName,
                        role: newUserRole
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // Create user profile (trigger should handle this, but we'll ensure it)
                const { error: profileError } = await supabase.from('users').upsert({
                    id: authData.user.id,
                    email: newUserEmail,
                    full_name: newUserName,
                    role: newUserRole,
                    is_verified: false
                });

                if (profileError) throw profileError;

                // Create role-specific profile
                if (newUserRole === 'teacher') {
                    await supabase.from('teachers').insert({
                        id: authData.user.id,
                        department: newUserDepartment,
                    });
                } else if (newUserRole === 'student') {
                    await supabase.from('students').insert({
                        id: authData.user.id,
                        enrollment_number: newUserEnrollment,
                        class_id: newUserClassLevel,    // consolidated schema: org_class_id → class_id
                        class_level: classes.find(c => c.id === newUserClassLevel)?.value || '',
                        branch: newUserBranch,
                    });
                }

                Alert.alert('Success', 'User created successfully. Remember to verify them!');
                setCreateModalVisible(false);
                resetCreateForm();
                fetchUsers();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create user');
            console.error('Create user error:', error);
        } finally {
            setCreating(false);
        }
    };

    const resetCreateForm = () => {
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setShowNewUserPassword(false);
        setNewUserRole('student');
        setNewUserDepartment(departments.length > 0 ? departments[0].name : '');
        setNewUserEnrollment('');
        setNewUserClassLevel(classes.length > 0 ? classes[0].value : '');
        setNewUserBranch('');
    };

    const handleExportUsers = async () => {
        try {
            let csv = 'ID,Email,Full Name,Role,Verified,Department,Enrollment Number,Class Level,Branch\n';
            users.forEach(user => {
                const row = [
                    user.id,
                    user.email,
                    user.full_name,
                    user.role,
                    user.is_verified ? 'Yes' : 'No',
                    user.department || '',
                    user.enrollment_number || '',
                    user.class_level || '',
                    user.branch || ''
                ].map(field => `"${field || ''}"`).join(',');
                csv += row + '\n';
            });

            await exportCSV(csv, 'users_export.csv');
        } catch (error) {
            Alert.alert('Error', 'Failed to export users');
            console.error(error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = !searchQuery ||
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.enrollment_number?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesVerification = filterVerification === 'all' ||
            (filterVerification === 'verified' && user.is_verified) ||
            (filterVerification === 'unverified' && !user.is_verified);
        return matchesSearch && matchesRole && matchesVerification;
    });

    const userStats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        teachers: users.filter(u => u.role === 'teacher').length,
        students: users.filter(u => u.role === 'student').length,
        unverified: users.filter(u => !u.is_verified).length,
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return tokens.colors.roles.admin.main;
            case 'teacher': return tokens.colors.roles.teacher.main;
            case 'student': return tokens.colors.roles.student.main;
            default: return tokens.colors.neutral.gray500;
        }
    };

    // Get initials from user name for avatar fallback
    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Get avatar URL or fallback to initials
    const getUserAvatar = (user: UserData) => {
        if (user.avatar_url) {
            return { type: 'url' as const, value: user.avatar_url };
        }
        return { type: 'initials' as const, value: getUserInitials(user.full_name || 'U') };
    };

    const { tokens, getBackgroundColor, getTextColor, getTextSecondaryColor, getSurfaceColor } = useTheme();

    const styles = useMemo(() => StyleSheet.create({
        mainContainer: {
            flex: 1,
        },
        scrollContainer: {
            flex: 1,
        },
        header: {
            paddingHorizontal: 26,
            paddingTop: 20,
            paddingBottom: 33,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
        },
        headerContent: {
            flex: 1,
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: '800',
            color: '#FFFFFF',
            marginBottom: 4,
            lineHeight: 28,
        },
        headerSubtitle: {
            fontSize: 14,
            color: '#FFFFFF',
            opacity: 0.95,
            lineHeight: 18,
        },
        headerActions: {
            flexDirection: 'row',
            gap: 10,
        },
        headerButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        section: {
            paddingHorizontal: 20,
            marginTop: 12,
            marginBottom: 4,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '700',
            marginBottom: 10,
        },
        statsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        statCard: {
            flex: 1,
            minWidth: '45%',
            borderRadius: 16,
            padding: 16,
            minHeight: 120,
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
        },
        statHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
        },
        statIconContainer: {
            width: 24,
            height: 24,
            borderRadius: 6,
            justifyContent: 'center',
            alignItems: 'center',
        },
        statValue: {
            fontSize: 30,
            fontWeight: '700',
        },
        statLabel: {
            fontSize: 15,
            fontWeight: '500',
            flex: 1,
        },
        errorCard: {
            borderRadius: 12,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
        },
        errorContent: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        errorText: {
            flex: 1,
            fontSize: 14,
        },
        retryText: {
            fontWeight: '600',
            fontSize: 14,
        },
        searchContainer: {
            marginBottom: 10,
        },
        filterButtons: {
            marginBottom: 10,
        },
        loadingContainer: {
            paddingVertical: 32,
            alignItems: 'center',
        },
        list: {
            paddingBottom: 8,
        },
        card: {
            marginBottom: 12,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
        },
        cardContent: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 14,
        },
        userInfo: { flex: 1 },
        userName: {
            fontSize: 16,
            fontWeight: '600',
        },
        email: {
            marginBottom: 6,
            marginTop: 3,
            fontSize: 13,
        },
        badges: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 6,
        },
        badge: {
            width: 20,
            height: 20,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
        },
        roleBadge: {
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 10,
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 10,
        },
        infoBadge: {
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 10,
        },
        badgeText: {
            fontSize: 10,
            fontWeight: '600',
            color: '#FFFFFF',
        },
        infoBadgeText: {
            fontSize: 10,
            fontWeight: '600',
        },
        actions: {
            flexDirection: 'row',
            gap: 8,
        },
        avatarContainer: {
            width: 48,
            height: 48,
            marginRight: 12,
        },
        userAvatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
        },
        avatarInitials: {
            width: 48,
            height: 48,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatarInitialsText: {
            fontSize: 18,
            fontWeight: '700',
        },
        actionButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },
        modal: {
            width: '95%',
            maxWidth: 500,
            minHeight: 200,
            padding: 24,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
        },
        modalTitle: {
            fontSize: 24,
            fontWeight: '700',
            marginBottom: 16,
        },
        modalActions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 16,
            gap: 12,
        },
    }), [tokens]);

    const renderUserItem = ({ item }: { item: UserData }) => {
        const avatar = getUserAvatar(item);

        return (
            <View style={[styles.card, { backgroundColor: getSurfaceColor() }]}>
                <View style={styles.cardContent}>
                    {/* User Avatar */}
                    <View style={styles.avatarContainer}>
                        {avatar.type === 'url' ? (
                            <Image
                                source={{ uri: avatar.value }}
                                style={styles.userAvatar}
                                onError={() => {
                                    // Fallback to initials if image fails to load
                                    const initials = getUserInitials(item.full_name || 'U');
                                    // This would need to be handled in state, but for now we'll just show initials
                                }}
                            />
                        ) : (
                            <View style={[styles.avatarInitials, { backgroundColor: getRoleColor(item.role) + '20' }]}>
                                <Text style={[styles.avatarInitialsText, { color: getRoleColor(item.role) }]}>
                                    {avatar.value}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.userInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.userName, { color: getTextColor() }]}>{item.full_name || 'No Name'}</Text>
                            {!item.is_verified && (
                                <View style={[styles.badge, { backgroundColor: tokens.colors.warning.main }]}>
                                    <Ionicons name="alert-circle" size={14} color="white" />
                                </View>
                            )}
                        </View>
                        <Text style={[styles.email, { color: getTextSecondaryColor() }]}>{item.email}</Text>
                        <View style={styles.badges}>
                            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                                <Text style={styles.badgeText}>{item.role.toUpperCase()}</Text>
                            </View>
                            {item.is_verified ? (
                                <View style={[styles.statusBadge, { backgroundColor: tokens.colors.success.main }]}>
                                    <Ionicons name="checkmark-circle" size={10} color="white" />
                                    <Text style={styles.badgeText}>Verified</Text>
                                </View>
                            ) : (
                                <View style={[styles.statusBadge, { backgroundColor: tokens.colors.warning.main }]}>
                                    <Ionicons name="alert-circle" size={10} color="white" />
                                    <Text style={styles.badgeText}>Pending</Text>
                                </View>
                            )}
                            {item.role === 'teacher' && item.department && (
                                <View style={[styles.infoBadge, { backgroundColor: tokens.colors.neutral.gray200 }]}>
                                    <Text style={[styles.infoBadgeText, { color: getTextColor() }]}>{item.department}</Text>
                                </View>
                            )}
                            {item.role === 'student' && item.enrollment_number && (
                                <View style={[styles.infoBadge, { backgroundColor: tokens.colors.neutral.gray200 }]}>
                                    <Text style={[styles.infoBadgeText, { color: getTextColor() }]}>{item.enrollment_number}</Text>
                                </View>
                            )}
                            {/* Add created date info */}
                            {item.created_at && (
                                <View style={[styles.infoBadge, { backgroundColor: tokens.colors.neutral.gray200 }]}>
                                    <Text style={[styles.infoBadgeText, { color: getTextColor() }]}>
                                        Joined {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.actions}>
                        {!item.is_verified ? (
                            <TouchableOpacity
                                onPress={() => {
                                    setUserToVerify(item);
                                    setVerifyConfirmVisible(true);
                                }}
                                style={styles.actionButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="checkmark-circle" size={22} color={tokens.colors.success.main} />
                            </TouchableOpacity>
                        ) : item.role !== 'admin' && (
                            <TouchableOpacity
                                onPress={() => {
                                    setUserToVerify(item);
                                    setUnverifyConfirmVisible(true);
                                }}
                                style={styles.actionButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close-circle" size={22} color={tokens.colors.warning.main} />
                            </TouchableOpacity>
                        )}
                        <ActionButton
                            type="edit"
                            onPress={() => openEditModal(item)}
                            accessibilityLabel={`Edit ${item.full_name}`}
                        />
                        {item.role !== 'admin' && (
                            <ActionButton
                                type="delete"
                                onPress={() => {
                                    setUserToDelete(item);
                                    setDeleteConfirmVisible(true);
                                }}
                                accessibilityLabel={`Delete ${item.full_name}`}
                            />
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.mainContainer, { backgroundColor: tokens.colors.roles.admin.main }]}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={tokens.colors.roles.admin.main}
                translucent={true}
            />
            {/* Purple Header Section */}
            <View style={[styles.header, { backgroundColor: tokens.colors.roles.admin.main }]}>
                <View style={styles.headerRow}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>User Management</Text>
                        <Text style={styles.headerSubtitle}>Manage users and roles</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={handleExportUsers} style={styles.headerButton} activeOpacity={0.7}>
                            <Ionicons name="download-outline" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCreateModalVisible(true)} style={styles.headerButton} activeOpacity={0.7}>
                            <Ionicons name="add" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView style={[styles.scrollContainer, { backgroundColor: getBackgroundColor() }]} showsVerticalScrollIndicator={false}>
                {/* Statistics */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Overview</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: getSurfaceColor() }]}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.info.main}15` }]}>
                                    <Ionicons name="people" size={20} color={tokens.colors.info.main} />
                                </View>
                                <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Total Users</Text>
                            </View>
                            <Text style={[styles.statValue, { color: getTextColor() }]}>{userStats.total}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: getSurfaceColor() }]}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.roles.admin.main}15` }]}>
                                    <Ionicons name="shield-checkmark" size={20} color={tokens.colors.roles.admin.main} />
                                </View>
                                <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Admins</Text>
                            </View>
                            <Text style={[styles.statValue, { color: getTextColor() }]}>{userStats.admins}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: getSurfaceColor() }]}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.roles.teacher.main}15` }]}>
                                    <Ionicons name="briefcase" size={20} color={tokens.colors.roles.teacher.main} />
                                </View>
                                <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Teachers</Text>
                            </View>
                            <Text style={[styles.statValue, { color: getTextColor() }]}>{userStats.teachers}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: getSurfaceColor() }]}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.roles.student.main}15` }]}>
                                    <Ionicons name="school" size={20} color={tokens.colors.roles.student.main} />
                                </View>
                                <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Students</Text>
                            </View>
                            <Text style={[styles.statValue, { color: getTextColor() }]}>{userStats.students}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: getSurfaceColor() }]}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.warning.main}15` }]}>
                                    <Ionicons name="alert-circle" size={20} color={tokens.colors.warning.main} />
                                </View>
                                <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Unverified</Text>
                            </View>
                            <Text style={[styles.statValue, { color: getTextColor() }]}>{userStats.unverified}</Text>
                        </View>
                    </View>
                </View>

                {/* Error Message */}
                {dataError && (
                    <View style={styles.section}>
                        <View style={[styles.errorCard, { backgroundColor: tokens.colors.error.light }]}>
                            <View style={styles.errorContent}>
                                <Text style={[styles.errorText, { color: tokens.colors.error.main }]}>{dataError}</Text>
                                <TouchableOpacity onPress={fetchOrganizationalData}>
                                    <Text style={[styles.retryText, { color: tokens.colors.primary.main }]}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Search and Filters */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Filter Users</Text>
                    <View style={styles.searchContainer}>
                        <Input
                            label=""
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search by name, email, or enrollment..."
                            icon={<Ionicons name="search" size={20} color={tokens.colors.neutral.gray500} />}
                            style={{ marginBottom: 0 }}
                        />
                    </View>

                    <View style={styles.filterButtons}>
                        <SegmentedButtons
                            value={filterRole}
                            onValueChange={setFilterRole}
                            buttons={[
                                { value: 'all', label: 'All' },
                                { value: 'admin', label: 'Admins' },
                                { value: 'teacher', label: 'Teachers' },
                                { value: 'student', label: 'Students' },
                            ]}
                            density="small"
                        />
                    </View>

                    <View style={styles.filterButtons}>
                        <SegmentedButtons
                            value={filterVerification}
                            onValueChange={setFilterVerification}
                            buttons={[
                                { value: 'all', label: 'All' },
                                { value: 'verified', label: 'Verified' },
                                { value: 'unverified', label: 'Unverified' },
                            ]}
                            density="small"
                        />
                    </View>
                </View>

                {/* User List */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: getTextColor() }]}>
                        Users ({filteredUsers.length})
                    </Text>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <LoadingSpinner size="large" />
                        </View>
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            renderItem={renderUserItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.list}
                            ListEmptyComponent={<EmptyState icon="account-off" title="No users found" />}
                            scrollEnabled={false}
                        />
                    )}
                </View>

                {/* Edit User Modal */}
                <Modal visible={visible} onRequestClose={() => setVisible(false)} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <KeyboardAwareScrollView
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
                            extraScrollHeight={50}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={[styles.modal, { backgroundColor: getSurfaceColor() }]}>
                                <Text style={[styles.modalTitle, { color: getTextColor() }]}>Edit User</Text>

                                <Input
                                    label="Full Name *"
                                    value={editName}
                                    onChangeText={setEditName}
                                />

                                <EnhancedPicker
                                    label="Role"
                                    value={editRole}
                                    items={[
                                        { label: 'Student', value: 'student' },
                                        { label: 'Teacher', value: 'teacher' },
                                        { label: 'Admin', value: 'admin' },
                                    ]}
                                    onValueChange={(value) => setEditRole(value as any)}
                                    testID="edit-role-picker"
                                />

                                {editRole === 'teacher' && (
                                    <SelectPicker
                                        label="Department"
                                        value={editDepartment}
                                        items={departments.map(dept => ({
                                            label: dept.name,
                                            value: dept.name,
                                            description: dept.description || undefined,
                                            icon: (dept.icon as any) || 'briefcase-outline'
                                        }))}
                                        onValueChange={setEditDepartment}
                                        disabled={loadingData}
                                        variant="department"
                                        searchable={true}
                                        testID="edit-department-picker"
                                    />
                                )}

                                {editRole === 'student' && (
                                    <>
                                        <Input
                                            label="Enrollment Number *"
                                            value={editEnrollment}
                                            onChangeText={setEditEnrollment}
                                        />
                                        <SelectPicker
                                            label="Class Level"
                                            value={editClassLevel}
                                            items={classes.map(c => ({
                                                label: c.name,
                                                value: c.id,
                                                description: c.academic_year ? `Year: ${c.academic_year}` : undefined,
                                                icon: c.value.includes('grad') ? 'school-outline' : 'library-outline'
                                            }))}
                                            onValueChange={setEditClassLevel}
                                            disabled={loadingData}
                                            variant="academic"
                                            searchable={true}
                                            testID="edit-class-level-picker"
                                        />
                                        {classes.find(c => c.id === editClassLevel)?.value?.startsWith('grad_year') && (
                                            <SelectPicker
                                                label="Branch"
                                                value={editBranch}
                                                items={editBranches.map(branch => ({
                                                    label: branch.name,
                                                    value: branch.name,
                                                    icon: 'briefcase-outline' as const
                                                }))}
                                                onValueChange={setEditBranch}
                                                disabled={loadingData}
                                                testID="edit-branch-picker"
                                            />
                                        )}
                                    </>
                                )}

                                <View style={styles.modalActions}>
                                    <Button variant="secondary" onPress={() => setVisible(false)} style={{ marginRight: tokens.spacing.sm }}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" onPress={handleSave} loading={saving}>
                                        Save
                                    </Button>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </Modal>

                {/* Create User Modal */}
                <Modal visible={createModalVisible} onRequestClose={() => setCreateModalVisible(false)} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <KeyboardAwareScrollView
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
                            extraScrollHeight={50}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={[styles.modal, { backgroundColor: getSurfaceColor() }]}>
                                <Text style={[styles.modalTitle, { color: getTextColor() }]}>Create New User</Text>

                                <SegmentedButtons
                                    value={newUserRole}
                                    onValueChange={(value) => setNewUserRole(value as any)}
                                    buttons={[
                                        { value: 'student', label: 'Student' },
                                        { value: 'teacher', label: 'Teacher' },
                                    ]}
                                    style={{ marginBottom: 15 }}
                                />

                                <Input label="Full Name *" value={newUserName} onChangeText={setNewUserName} />
                                <Input label="Email *" value={newUserEmail} onChangeText={setNewUserEmail} autoCapitalize="none" keyboardType="email-address" />
                                <Input
                                    label="Password *"
                                    value={newUserPassword}
                                    onChangeText={setNewUserPassword}
                                    secureTextEntry={!showNewUserPassword}
                                    rightIcon={
                                        <TouchableOpacity onPress={() => setShowNewUserPassword(!showNewUserPassword)}>
                                            <Ionicons
                                                name={showNewUserPassword ? 'eye-off-outline' : 'eye-outline'}
                                                size={24}
                                                color={tokens.colors.neutral.gray500}
                                            />
                                        </TouchableOpacity>
                                    }
                                />

                                {newUserRole === 'teacher' && (
                                    <SelectPicker
                                        label="Department"
                                        value={newUserDepartment}
                                        items={departments.map(dept => ({
                                            label: dept.name,
                                            value: dept.name,
                                            description: dept.description || undefined,
                                            icon: (dept.icon as any) || 'briefcase-outline'
                                        }))}
                                        onValueChange={setNewUserDepartment}
                                        disabled={loadingData}
                                        variant="department"
                                        searchable={true}
                                        testID="new-department-picker"
                                    />
                                )}

                                {newUserRole === 'student' && (
                                    <>
                                        <Input label="Enrollment Number *" value={newUserEnrollment} onChangeText={setNewUserEnrollment} />
                                        <SelectPicker
                                            label="Class Level"
                                            value={newUserClassLevel}
                                            items={classes.map(c => ({
                                                label: c.name,
                                                value: c.id,
                                                description: c.academic_year ? `Year: ${c.academic_year}` : undefined,
                                                icon: c.value.includes('grad') ? 'school-outline' : 'library-outline'
                                            }))}
                                            onValueChange={setNewUserClassLevel}
                                            disabled={loadingData}
                                            variant="academic"
                                            searchable={true}
                                            testID="new-class-level-picker"
                                        />
                                        {classes.find(c => c.id === newUserClassLevel)?.value?.startsWith('grad_year') && (
                                            <SelectPicker
                                                label="Branch"
                                                value={newUserBranch}
                                                items={branches.map(branch => ({
                                                    label: branch.name,
                                                    value: branch.name,
                                                    icon: 'briefcase-outline' as const
                                                }))}
                                                onValueChange={setNewUserBranch}
                                                disabled={loadingData}
                                                testID="new-branch-picker"
                                            />
                                        )}
                                    </>
                                )}

                                <View style={styles.modalActions}>
                                    <Button variant="secondary" onPress={() => setCreateModalVisible(false)} style={{ marginRight: tokens.spacing.sm }}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" onPress={handleCreateUser} loading={creating}>
                                        Create
                                    </Button>
                                </View>
                            </View>
                        </KeyboardAwareScrollView>
                    </View>
                </Modal>

                <ConfirmDialog
                    visible={deleteConfirmVisible}
                    title="Delete User"
                    message={`Are you sure you want to delete ${userToDelete?.full_name}? This action cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteConfirmVisible(false)}
                />

                <ConfirmDialog
                    visible={verifyConfirmVisible}
                    title="Verify User"
                    message={`Are you sure you want to verify ${userToVerify?.full_name}? This will grant them access to the system.`}
                    confirmText="Verify"
                    onConfirm={handleVerifyUser}
                    onCancel={() => {
                        setVerifyConfirmVisible(false);
                        setUserToVerify(null);
                    }}
                />

                <ConfirmDialog
                    visible={unverifyConfirmVisible}
                    title="Unverify User"
                    message={`Are you sure you want to unverify ${userToVerify?.full_name}? This will revoke their access to the system.`}
                    confirmText="Unverify"
                    onConfirm={handleUnverifyUser}
                    onCancel={() => {
                        setUnverifyConfirmVisible(false);
                        setUserToVerify(null);
                    }}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
