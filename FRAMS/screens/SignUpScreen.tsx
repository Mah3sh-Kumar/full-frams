import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, SignUpPayload } from '../context/AuthContext';
import { checkEnrollmentNumberUnique } from '../lib/database';
import SelectPicker from '../components/design-system/primitives/SelectPicker';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../lib/design-system/ThemeContext';
import Button from '../components/design-system/primitives/Button';
import Input from '../components/design-system/primitives/Input';
import { Stack } from '../components/design-system/layout';
import { isValidEmail } from '../lib/validation';
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView';
import EnhancedPicker from '../components/EnhancedPicker';
import { getClasses, getBranches, getDepartments, ClassItem, BranchItem, DepartmentItem } from '../lib/organization';

type Props = StackScreenProps<any, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
    const { signUp, loading: authLoading } = useAuth();
    const { getTextColor, getSurfaceColor, getTextSecondaryColor, getBackgroundColor, tokens, mode } = useTheme();
    const isDark = mode === 'dark';

    // Form state
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Student-specific
    const [enrollmentNumber, setEnrollmentNumber] = useState('');
    const [classLevel, setClassLevel] = useState('');
    const [branch, setBranch] = useState('');

    // Teacher-specific
    const [department, setDepartment] = useState('');

    // Database-driven dropdown data
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [branches, setBranches] = useState<BranchItem[]>([]);
    const [departments, setDepartments] = useState<DepartmentItem[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    // UI state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounce timer ref for enrollment number validation
    const enrollmentCheckTimer = useRef<NodeJS.Timeout | null>(null);

    // Fetch organizational data on mount
    useEffect(() => {
        fetchOrganizationalData();
    }, []);

    // Fetch branches when class level changes
    useEffect(() => {
        if (classLevel) {
            fetchBranchesForClass(classLevel);
        }
    }, [classLevel]);

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

            // Set default values with proper null checks
            if (classesResult.data && Array.isArray(classesResult.data) && classesResult.data.length > 0) {
                setClassLevel(classesResult.data[0].value);
            }
            if (departmentsResult.data && Array.isArray(departmentsResult.data) && departmentsResult.data.length > 0) {
                setDepartment(departmentsResult.data[0].name);
            }
        } catch (error: any) {
            console.error('Error fetching organizational data:', error);
            setDataError(error.message || 'Failed to load form data');
            Alert.alert('Error', 'Failed to load form data. Please try again.');
        } finally {
            setLoadingData(false);
        }
    };

    const fetchBranchesForClass = async (classValue: string) => {
        try {
            // Find the class ID from the value
            const selectedClass = classes.find(c => c.value === classValue);
            if (!selectedClass) {
                setBranches([]);
                return;
            }

            const branchesResult = await getBranches(selectedClass.id);
            if (branchesResult.error) {
                throw new Error(branchesResult.error);
            }

            setBranches(branchesResult.data || []);
            
            // Set default branch if available with proper null checks
            if (branchesResult.data && Array.isArray(branchesResult.data) && branchesResult.data.length > 0) {
                setBranch(branchesResult.data[0].name);
            } else {
                setBranch('');
            }
        } catch (error: any) {
            console.error('Error fetching branches:', error);
            setBranches([]);
        }
    };

    // Debounced enrollment number validation
    const checkEnrollmentDebounced = useCallback((value: string) => {
        if (enrollmentCheckTimer.current) {
            clearTimeout(enrollmentCheckTimer.current);
        }

        enrollmentCheckTimer.current = setTimeout(async () => {
            if (value.trim() && role === 'student') {
                const isUnique = await checkEnrollmentNumberUnique(value);
                if (!isUnique) {
                    setErrors(prev => ({
                        ...prev,
                        enrollmentNumber: 'This enrollment number is already registered'
                    }));
                }
            }
        }, 500); // 500ms debounce
    }, [role]);

    // Cleanup timer on unmount and when component unmounts
    useEffect(() => {
        return () => {
            if (enrollmentCheckTimer.current) {
                clearTimeout(enrollmentCheckTimer.current);
                enrollmentCheckTimer.current = null;
            }
        };
    }, []);

    // Also cleanup timer when role changes to prevent stale validations
    useEffect(() => {
        if (enrollmentCheckTimer.current) {
            clearTimeout(enrollmentCheckTimer.current);
            enrollmentCheckTimer.current = null;
        }
    }, [role]);

    const validateForm = async (): Promise<boolean> => {
        const newErrors: Record<string, string> = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (role === 'student') {
            if (!enrollmentNumber.trim()) {
                newErrors.enrollmentNumber = 'Enrollment number is required';
            } else {
                const isUnique = await checkEnrollmentNumberUnique(enrollmentNumber);
                if (!isUnique) {
                    newErrors.enrollmentNumber = 'This enrollment number is already registered';
                }
            }

            if (classLevel.startsWith('grad_year') && !branch.trim()) {
                newErrors.branch = 'Branch is required for graduation students';
            }
        }

        if (role === 'teacher' && !department.trim()) {
            newErrors.department = 'Department is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUp = useCallback(async () => {
        try {
            const isValid = await validateForm();
            if (!isValid) {
                return;
            }

            setIsSubmitting(true);

            const payload: SignUpPayload = {
                role,
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                password,
            };

            if (role === 'student') {
                payload.enrollmentNumber = enrollmentNumber.trim();
                payload.classLevel = classLevel;
                
                // Find dynamic class ID for the new org_class_id field
                const selectedClass = classes.find(c => c.value === classLevel);
                if (selectedClass) {
                    payload.classId = selectedClass.id;
                }
                
                if (classLevel.startsWith('grad_year')) {
                    payload.branch = branch.trim();
                }
            } else if (role === 'teacher') {
                payload.department = department;
            }

            const { error } = await signUp(payload);

            if (error) {
                Alert.alert('Signup Failed', error);
            } else {
                Alert.alert('Success', 'Account created successfully!');
            }
        } catch (err: any) {
            console.error('Error in handleSignUp:', err);
            Alert.alert('Error', `An unexpected error occurred: ${err.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    }, [role, fullName, email, password, enrollmentNumber, classLevel, branch, department, signUp, navigation]);

    const isFormValid = useCallback(() => {
        if (!fullName || !email || !password || !confirmPassword) return false;
        if (password !== confirmPassword) return false;
        if (role === 'student' && !enrollmentNumber) return false;
        if (role === 'student' && classLevel.startsWith('grad_year') && !branch) return false;
        if (role === 'teacher' && !department) return false;
        return true;
    }, [fullName, email, password, confirmPassword, role, enrollmentNumber, classLevel, branch, department]);

    // Memoized handlers to prevent re-renders
    const handleFullNameChange = useCallback((text: string) => {
        setFullName(text);
        if (errors.fullName) {
            setErrors(prev => ({ ...prev, fullName: '' }));
        }
    }, [errors.fullName]);

    const handleEmailChange = useCallback((text: string) => {
        setEmail(text);
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: '' }));
        }
    }, [errors.email]);

    const handlePasswordChange = useCallback((text: string) => {
        setPassword(text);
        if (errors.password) {
            setErrors(prev => ({ ...prev, password: '' }));
        }
    }, [errors.password]);

    const handleConfirmPasswordChange = useCallback((text: string) => {
        setConfirmPassword(text);
        if (errors.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
    }, [errors.confirmPassword]);

    const handleEnrollmentChange = useCallback((text: string) => {
        setEnrollmentNumber(text);
        if (errors.enrollmentNumber) {
            setErrors(prev => ({ ...prev, enrollmentNumber: '' }));
        }
        // Trigger debounced validation
        checkEnrollmentDebounced(text);
    }, [errors.enrollmentNumber, checkEnrollmentDebounced]);

    return (
        <View style={{ flex: 1, backgroundColor: getBackgroundColor() }}>
            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                extraScrollHeight={20}
                enableAutomaticScroll={true}
            >
                <View style={styles.content}>
                    <Text style={[styles.title, { color: getTextColor() }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: getTextSecondaryColor() }]}>Sign up to get started</Text>

                    {dataError && (
                        <View style={[
                            styles.errorContainer, 
                            { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2' }
                        ]}>
                            <Text style={[styles.errorText, { color: tokens.colors.error.main }]}>{dataError}</Text>
                            <TouchableOpacity onPress={fetchOrganizationalData}>
                                <Text style={[styles.retryText, { color: tokens.colors.primary.main }]}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <Stack spacing="md">
                        {/* Role Selection */}
                        <View>
                            <Text style={[styles.label, { color: getTextColor() }]}>I am a:</Text>
                            <View style={styles.roleContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.roleButton, 
                                        { 
                                            backgroundColor: getSurfaceColor(),
                                            borderColor: role === 'student' ? tokens.colors.primary.main : tokens.colors.theme[mode as 'light' | 'dark'].border
                                        },
                                        role === 'student' && { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : 'rgba(99, 102, 241, 0.1)' }
                                    ]}
                                    onPress={() => {
                                        setRole('student');
                                        setErrors({});
                                    }}
                                    disabled={isSubmitting || authLoading}
                                    accessible
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: role === 'student' }}
                                >
                                    <Ionicons
                                        name="school-outline"
                                        size={24}
                                        color={role === 'student' ? tokens.colors.primary.main : getTextSecondaryColor()}
                                        style={{ marginBottom: 8 }}
                                    />
                                    <Text style={[
                                        styles.roleButtonText, 
                                        { color: role === 'student' ? tokens.colors.primary.main : getTextSecondaryColor() }
                                    ]}>
                                        Student
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.roleButton, 
                                        { 
                                            backgroundColor: getSurfaceColor(),
                                            borderColor: role === 'teacher' ? tokens.colors.primary.main : tokens.colors.theme[mode as 'light' | 'dark'].border
                                        },
                                        role === 'teacher' && { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.1)' : 'rgba(99, 102, 241, 0.1)' }
                                    ]}
                                    onPress={() => {
                                        setRole('teacher');
                                        setErrors({});
                                    }}
                                    disabled={isSubmitting || authLoading}
                                    accessible
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: role === 'teacher' }}
                                >
                                    <Ionicons
                                        name="briefcase-outline"
                                        size={24}
                                        color={role === 'teacher' ? tokens.colors.primary.main : getTextSecondaryColor()}
                                        style={{ marginBottom: 8 }}
                                    />
                                    <Text style={[
                                        styles.roleButtonText, 
                                        { color: role === 'teacher' ? tokens.colors.primary.main : getTextSecondaryColor() }
                                    ]}>
                                        Teacher
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Common Fields */}
                        <Input
                            label="Full Name"
                            value={fullName}
                            onChangeText={handleFullNameChange}
                            disabled={isSubmitting || authLoading}
                            error={errors.fullName}
                        />

                        <Input
                            label="Email"
                            value={email}
                            onChangeText={handleEmailChange}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            disabled={isSubmitting || authLoading}
                            error={errors.email}
                        />

                        <Input
                            label="Password"
                            value={password}
                            onChangeText={handlePasswordChange}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            disabled={isSubmitting || authLoading}
                            error={errors.password}
                            rightIcon={
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons 
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                                        size={24} 
                                        color={getTextSecondaryColor()} 
                                    />
                                </TouchableOpacity>
                            }
                        />
                        <PasswordStrengthIndicator password={password} />

                        <View style={styles.passwordHintContainer}>
                            <Ionicons name="information-circle-outline" size={14} color={getTextSecondaryColor()} />
                            <Text style={[styles.passwordHintText, { color: getTextSecondaryColor() }]}>
                                Password must be at least 8 characters
                            </Text>
                        </View>

                        <Input
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={handleConfirmPasswordChange}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            disabled={isSubmitting || authLoading}
                            error={errors.confirmPassword}
                            rightIcon={
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons 
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                                        size={24} 
                                        color={getTextSecondaryColor()} 
                                    />
                                </TouchableOpacity>
                            }
                        />

                        {/* Student-Specific Fields */}
                        {role === 'student' && (
                            <>
                                <Input
                                    label="Enrollment Number"
                                    value={enrollmentNumber}
                                    onChangeText={handleEnrollmentChange}
                                    disabled={isSubmitting || authLoading || loadingData}
                                    error={errors.enrollmentNumber}
                                    keyboardType="numeric"
                                />

                                <SelectPicker
                                    label="Class Level"
                                    value={classLevel}
                                    items={classes.map(c => ({ 
                                        label: c.name, 
                                        value: c.value,
                                        description: c.academic_year ? `Year: ${c.academic_year}` : undefined,
                                        icon: c.value.includes('grad') ? 'school-outline' : 'library-outline'
                                    }))}
                                    onValueChange={(value) => setClassLevel(value)}
                                    disabled={isSubmitting || authLoading || loadingData}
                                    variant="academic"
                                    searchable={true}
                                    testID="class-level-picker"
                                />

                                {classLevel.startsWith('grad_year') && (
                                    <SelectPicker
                                        label="Branch"
                                        value={branch}
                                        items={branches.map(b => ({ 
                                            label: b.name, 
                                            value: b.name,
                                            icon: 'briefcase-outline' as const
                                        }))}
                                        onValueChange={(value) => setBranch(value)}
                                        disabled={isSubmitting || authLoading || loadingData}
                                        error={errors.branch}
                                        testID="branch-picker"
                                    />
                                )}
                            </>
                        )}

                        {/* Teacher-Specific Fields */}
                        {role === 'teacher' && (
                            <SelectPicker
                                label="Department"
                                value={department}
                                items={departments.map(dept => ({ 
                                    label: dept.name, 
                                    value: dept.name,
                                    description: dept.description || undefined,
                                    icon: (dept.icon as any) || 'briefcase-outline'
                                }))}
                                onValueChange={(value) => setDepartment(value)}
                                disabled={isSubmitting || authLoading || loadingData}
                                error={errors.department}
                                variant="department"
                                searchable={true}
                                testID="department-picker"
                            />
                        )}

                        <Button
                            variant="primary"
                            onPress={handleSignUp}
                            loading={isSubmitting || authLoading}
                            disabled={isSubmitting || authLoading || !isFormValid()}
                        >
                            Sign Up
                        </Button>

                        <View style={styles.signInContainer}>
                            <Text style={[styles.signInText, { color: getTextSecondaryColor() }]}>Already have an account? </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('SignIn')}
                                disabled={isSubmitting || authLoading}
                            >
                                <Text style={[styles.signInLink, { color: tokens.colors.primary.main }]}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </Stack>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingVertical: 32,
    },
    content: {
        padding: 16,
        maxWidth: 500,
        width: '100%',
        alignSelf: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        borderWidth: 2,
        alignItems: 'center',
    },
    roleButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },

    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    signInText: {
        fontSize: 16,
    },
    signInLink: {
        fontSize: 16,
        fontWeight: '600',
    },
    errorContainer: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 14,
        flex: 1,
    },
    retryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    passwordHintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -8,
        marginBottom: 8,
        gap: 4,
    },
    passwordHintText: {
        fontSize: 12,
    },
});
