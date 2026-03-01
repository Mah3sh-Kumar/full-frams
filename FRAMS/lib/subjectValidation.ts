/**
 * Subject Management Validation Functions
 * 
 * This module provides comprehensive validation functions for subject management,
 * ensuring data quality and consistency before database operations.
 * 
 * Validates: Requirements 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Form validation result with field-specific errors
 */
export interface FormValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate subject name
 * 
 * Requirements:
 * - Not empty or whitespace-only
 * - Minimum length: 2 characters
 * - Maximum length: 100 characters
 * 
 * @param name - Subject name to validate
 * @returns Validation result with error message if invalid
 * 
 * Validates: Requirements 3.4, 6.1, 6.2
 */
export function validateSubjectName(name: string): ValidationResult {
  // Check for empty or whitespace-only
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: 'Subject name is required'
    };
  }

  const trimmedName = name.trim();

  // Check minimum length
  if (trimmedName.length < 2) {
    return {
      valid: false,
      error: 'Subject name must be at least 2 characters'
    };
  }

  // Check maximum length
  if (name.length > 100) {
    return {
      valid: false,
      error: 'Subject name cannot exceed 100 characters'
    };
  }

  return { valid: true };
}

/**
 * Validate subject code
 * 
 * Requirements:
 * - Not empty
 * - Pattern: lowercase letters, numbers, and underscores only
 * 
 * @param code - Subject code to validate
 * @returns Validation result with error message if invalid
 * 
 * Validates: Requirements 3.5, 6.3
 */
export function validateSubjectCode(code: string): ValidationResult {
  // Check for empty
  if (!code || code.trim().length === 0) {
    return {
      valid: false,
      error: 'Subject code is required'
    };
  }

  // Check pattern: lowercase letters, numbers, and underscores only
  const codePattern = /^[a-z0-9_]+$/;
  if (!codePattern.test(code.trim())) {
    return {
      valid: false,
      error: 'Subject code must contain only lowercase letters, numbers, and underscores'
    };
  }

  return { valid: true };
}

/**
 * Validate academic year selection
 * 
 * Requirements:
 * - Academic year must be selected (not null or empty)
 * 
 * @param academicYearId - Academic year ID to validate
 * @returns Validation result with error message if invalid
 * 
 * Validates: Requirements 6.5
 */
export function validateAcademicYear(academicYearId: string | null | undefined): ValidationResult {
  if (!academicYearId || academicYearId.trim().length === 0) {
    return {
      valid: false,
      error: 'Please select an academic year'
    };
  }

  return { valid: true };
}

/**
 * Validate teacher selection
 * 
 * Requirements:
 * - At least one teacher must be selected
 * 
 * @param teacherIds - Array of teacher IDs to validate
 * @returns Validation result with error message if invalid
 * 
 * Validates: Requirements 6.6
 */
export function validateTeacherSelection(teacherIds: string[]): ValidationResult {
  if (!teacherIds || teacherIds.length === 0) {
    return {
      valid: false,
      error: 'Please select at least one teacher'
    };
  }

  return { valid: true };
}

/**
 * Validate primary teacher selection
 * 
 * Requirements:
 * - When multiple teachers are assigned, exactly one must be designated as primary
 * - When only one teacher is assigned, they are automatically primary
 * 
 * @param teacherIds - Array of teacher IDs
 * @param primaryTeacherId - ID of the primary teacher
 * @returns Validation result with error message if invalid
 * 
 * Validates: Requirements 6.7
 */
export function validatePrimaryTeacher(
  teacherIds: string[],
  primaryTeacherId: string | null | undefined
): ValidationResult {
  // If no teachers selected, this validation doesn't apply
  // (will be caught by validateTeacherSelection)
  if (!teacherIds || teacherIds.length === 0) {
    return { valid: true };
  }

  // If only one teacher, they are automatically primary (no explicit selection needed)
  if (teacherIds.length === 1) {
    return { valid: true };
  }

  // Multiple teachers: must have exactly one primary teacher
  if (!primaryTeacherId || primaryTeacherId.trim().length === 0) {
    return {
      valid: false,
      error: 'Please designate one teacher as primary when multiple teachers are assigned'
    };
  }

  // Verify primary teacher is in the teacher list
  if (!teacherIds.includes(primaryTeacherId)) {
    return {
      valid: false,
      error: 'Primary teacher must be one of the selected teachers'
    };
  }

  return { valid: true };
}

/**
 * Validate complete subject form
 * 
 * Performs comprehensive validation of all subject form fields and returns
 * field-specific error messages for user feedback.
 * 
 * @param name - Subject name
 * @param code - Subject code
 * @param classId - Class ID
 * @param academicYearId - Academic year ID
 * @param teacherIds - Array of teacher IDs
 * @param primaryTeacherId - Primary teacher ID (required when multiple teachers)
 * @returns Form validation result with field-specific errors
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
 */
export function validateSubjectForm(
  name: string,
  code: string,
  classId: string | null | undefined,
  academicYearId: string | null | undefined,
  teacherIds: string[],
  primaryTeacherId: string | null | undefined
): FormValidationResult {
  const errors: Record<string, string> = {};

  // Validate subject name
  const nameValidation = validateSubjectName(name);
  if (!nameValidation.valid) {
    errors.name = nameValidation.error!;
  }

  // Validate subject code
  const codeValidation = validateSubjectCode(code);
  if (!codeValidation.valid) {
    errors.code = codeValidation.error!;
  }

  // Validate class selection
  if (!classId || classId.trim().length === 0) {
    errors.classId = 'Please select a class';
  }

  // Validate academic year selection
  const academicYearValidation = validateAcademicYear(academicYearId);
  if (!academicYearValidation.valid) {
    errors.academicYearId = academicYearValidation.error!;
  }

  // Validate teacher selection
  const teacherValidation = validateTeacherSelection(teacherIds);
  if (!teacherValidation.valid) {
    errors.teacherIds = teacherValidation.error!;
  }

  // Validate primary teacher (only if teachers are selected)
  if (teacherIds && teacherIds.length > 0) {
    const primaryTeacherValidation = validatePrimaryTeacher(teacherIds, primaryTeacherId);
    if (!primaryTeacherValidation.valid) {
      errors.primaryTeacherId = primaryTeacherValidation.error!;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
