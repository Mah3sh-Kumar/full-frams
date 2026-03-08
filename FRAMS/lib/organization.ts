import { supabase } from './supabase';

/**
 * Error code mapping for user-friendly messages
 * Maps PostgreSQL error codes to human-readable messages
 */
const ORG_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'An item with this name already exists',
  '23503': 'Invalid reference - the associated item does not exist',
  '23502': 'Required field is missing',
  'PGRST116': 'Item not found',
};

/**
 * Converts database errors to user-friendly messages
 * @param error - Error object from Supabase
 * @returns User-friendly error message
 */
function getOrgErrorMessage(error: any): string {
  if (error?.code && ORG_ERROR_MESSAGES[error.code]) {
    return ORG_ERROR_MESSAGES[error.code];
  }
  return error?.message || 'An unexpected error occurred';
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OrganizationItem {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ClassItem extends OrganizationItem {
  value: string;
  display_order: number;
  academic_year: string | null;
  branch_id: string | null;
}

export interface BranchItem extends OrganizationItem {
  code: string;
  class_id: string | null;
  department_id: string | null;
  display_order: number;
}

export interface DepartmentItem extends OrganizationItem {
  code: string;
  display_order: number;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates that a name is not empty and meets basic requirements
 */
function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Name cannot exceed 100 characters' };
  }
  return { valid: true };
}

/**
 * Validates that a code/value identifier is properly formatted
 */
function validateCode(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Code cannot be empty' };
  }
  // Code should be lowercase with underscores
  if (!/^[a-z0-9_]+$/.test(code)) {
    return { valid: false, error: 'Code must contain only lowercase letters, numbers, and underscores' };
  }
  return { valid: true };
}

// ============================================================================
// CLASS OPERATIONS
// ============================================================================

/**
 * Get all classes from the database
 * @param includeInactive - Whether to include inactive classes (admin only)
 */
export async function getClasses(
  includeInactive: boolean = false
): Promise<{ data: ClassItem[] | null; error: string | null }> {
  try {
    console.log('🔍 getClasses called with includeInactive:', includeInactive);
    
    let query = supabase
      .from('classes')          // consolidated schema: org_classes → classes
      .select('id, name, value, display_order, is_active, academic_year, branch_id, created_at, updated_at')
      .order('display_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    console.log('📊 getClasses - Raw response:', { data, error });

    if (error) {
      console.error('❌ Supabase error in getClasses:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    // Transform the data to match the ClassItem interface
    const transformedData = data?.map(item => ({
      id: item.id,
      name: item.name,
      value: item.value,
      display_order: item.display_order,
      is_active: item.is_active,
      academic_year: item.academic_year,
      branch_id: item.branch_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
    })) || [];

    console.log('✅ getClasses - Returning:', transformedData);
    return { data: transformedData, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getClasses:', error);
    return { data: null, error: getOrgErrorMessage(error) };
  }
}

/**
 * Create a new class
 * @param name - Display name of the class
 * @param value - Internal value identifier
 * @param displayOrder - Optional display order
 */
export async function createClass(
  name: string,
  value: string,
  displayOrder?: number,
  academicYear?: string
): Promise<{ data: ClassItem | null; error: string | null }> {
  try {
    // ... validation omitted for brevity in search_replace, but I'll include the whole block to be safe
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return { data: null, error: nameValidation.error! };
    }

    const valueValidation = validateCode(value);
    if (!valueValidation.valid) {
      return { data: null, error: valueValidation.error! };
    }

    let order = displayOrder;
    if (order === undefined) {
      const { data: existingClasses } = await getClasses(true);
      order = existingClasses ? existingClasses.length : 0;
    }

    const { data, error } = await supabase
      .from('classes')          // consolidated schema: org_classes → classes
      .insert({
        name: name.trim(),
        value: value.trim(),
        display_order: order,
        academic_year: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating class:', error);
    return { data: null, error: getOrgErrorMessage(error) };
  }
}

/**
 * Update an existing class
 * @param id - UUID of the class to update
 * @param updates - Fields to update
 */
export async function updateClass(
  id: string,
  updates: { name?: string; value?: string; academic_year?: string; display_order?: number; is_active?: boolean }
): Promise<{ data: ClassItem | null; error: string | null }> {
  try {
    // Validate name if provided
    if (updates.name !== undefined) {
      const nameValidation = validateName(updates.name);
      if (!nameValidation.valid) {
        return { data: null, error: nameValidation.error! };
      }
      updates.name = updates.name.trim();
    }

    // Validate value if provided
    if (updates.value !== undefined) {
      const valueValidation = validateCode(updates.value);
      if (!valueValidation.valid) {
        return { data: null, error: valueValidation.error! };
      }
      updates.value = updates.value.trim();
    }

    // Include academic_year in updates since it's now in org_classes
    const validUpdates = updates;

    const { data, error } = await supabase
      .from('classes')          // consolidated schema: org_classes → classes
      .update(validUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating class:', error);
    return { data: null, error: getOrgErrorMessage(error) };
  }
}

/**
 * Delete a class (only if not in use)
 * @param id - UUID of the class to delete
 * @param value - Value identifier of the class (for dependency checking)
 */
export async function deleteClass(
  id: string,
  value: string
): Promise<{ error: string | null }> {
  try {
    // Check if class can be deleted
    const canDelete = await canDeleteClass(value);
    if (!canDelete.data) {
      return { error: canDelete.error || 'Cannot delete class: it is currently in use by students' };
    }

    const { error } = await supabase
      .from('classes')          // consolidated schema: org_classes → classes
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting class:', error);
    return { error: getOrgErrorMessage(error) };
  }
}

/**
 * Check if a class can be safely deleted
 * @param value - Value identifier of the class
 */
export async function canDeleteClass(
  value: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    // Check if any students are using this class value
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('class_level', value);

    if (error) throw error;

    // Class can be deleted if no students are using it
    return { data: (count === 0), error: null };
  } catch (error: any) {
    console.error('Error checking if class can be deleted:', error);
    return { data: false, error: getOrgErrorMessage(error) };
  }
}

// ============================================================================
// BRANCH OPERATIONS
// ============================================================================

/**
 * Get all branches from the database
 * @param classId - Optional class ID to filter branches
 * @param includeInactive - Whether to include inactive branches
 */
export async function getBranches(
  classId?: string,
  includeInactive: boolean = false
): Promise<{ data: BranchItem[] | null; error: string | null }> {
  try {
    console.log('🔍 getBranches called with classId:', classId, 'includeInactive:', includeInactive);
    
    let query = supabase
      .from('branches')         // consolidated schema: org_branches → branches
      .select('*')
      .order('display_order', { ascending: true });

    if (classId !== undefined) {
      query = query.eq('class_id', classId);
    }

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    console.log('📊 getBranches - Raw response:', { data, error });

    if (error) {
      console.error('❌ Supabase error in getBranches:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    const result = data || [];
    console.log('✅ getBranches - Returning:', result);
    return { data: result, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getBranches:', error);
    return { data: null, error: getOrgErrorMessage(error) };
  }
}

/**
 * Create a new branch
 * @param name - Display name of the branch
 * @param classId - Optional class ID to associate with
 * @param displayOrder - Optional display order
 */
export async function createBranch(
  name: string,
  code: string,
  classId?: string | null,
  displayOrder?: number
): Promise<{ data: BranchItem | null; error: string | null }> {
  try {
    // Validate inputs
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return { data: null, error: nameValidation.error! };
    }

    const codeValidation = validateCode(code);
    if (!codeValidation.valid) {
      return { data: null, error: codeValidation.error! };
    }

    // If no display order provided, get the next available order
    let order = displayOrder;
    if (order === undefined) {
      const { data: existingBranches } = await getBranches(classId ?? undefined, true);
      order = existingBranches ? existingBranches.length : 0;
    }

    const { data, error } = await supabase
      .from('branches')         // consolidated schema: org_branches → branches
      .insert({
        name: name.trim(),
        code: code.trim(),
        class_id: classId || null,
        display_order: order,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return { data: null, error: getOrgErrorMessage(error) };
  }
}

/**
 * Update an existing branch
 * @param id - UUID of the branch to update
 * @param updates - Fields to update
 */
export async function updateBranch(
  id: string,
  updates: { name?: string; code?: string; class_id?: string | null; display_order?: number; is_active?: boolean }
): Promise<{ data: BranchItem | null; error: string | null }> {
  try {
    // Validate name if provided
    if (updates.name !== undefined) {
      const nameValidation = validateName(updates.name);
      if (!nameValidation.valid) {
        return { data: null, error: nameValidation.error! };
      }
      updates.name = updates.name.trim();
    }

    // Validate code if provided
    if (updates.code !== undefined) {
      const codeValidation = validateCode(updates.code);
      if (!codeValidation.valid) {
        return { data: null, error: codeValidation.error! };
      }
      updates.code = updates.code.trim();
    }

    const { data, error } = await supabase
      .from('branches')         // consolidated schema: org_branches → branches
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return { data: null, error: getOrgErrorMessage(error) };
  }
}

export async function deleteBranch(
  id: string,
  name: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('branches')         // consolidated schema: org_branches → branches
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return { error: getOrgErrorMessage(error) };
  }
}

export async function canDeleteBranch(
  name: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    // Check if branch is in use by any students (via FK class_id, not denorm text)
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('branch', name);
    // NOTE: students.branch is still a text denorm field (kept by schema migration).
    // Once Face_Reco is fully migrated, switch this to a class_id FK check.

    if (error) throw error;

    return { data: (count === 0), error: null };
  } catch (error: any) {
    console.error('Error checking if branch can be deleted:', error);
    return { data: false, error: getOrgErrorMessage(error) };
  }
}

// ============================================================================
// DEPARTMENT OPERATIONS
// ============================================================================

/**
 * Get all departments from the database
 * @param includeInactive - Whether to include inactive departments
 */
export async function getDepartments(
  includeInactive: boolean = false
): Promise<{ data: DepartmentItem[] | null; error: string | null }> {
  try {
    console.log('🔍 getDepartments called with includeInactive:', includeInactive);
    
    let query = supabase
      .from('org_departments')
      .select('*')
      .order('display_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    console.log('📊 getDepartments - Raw response:', { data, error });

    if (error) {
      console.error('❌ Supabase error in getDepartments:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    const result = data || [];
    console.log('✅ getDepartments - Returning:', result);
    return { data: result, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getDepartments:', error);
    return { data: null, error: getOrgErrorMessage(error) };
  }
}

/**
 * Create a new department
 * @param name - Display name of the department
 * @param displayOrder - Optional display order
 */
export async function createDepartment(
  name: string,
  code: string,
  displayOrder?: number
): Promise<{ data: DepartmentItem | null; error: string | null }> {
  try {
    // Validate inputs
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return { data: null, error: nameValidation.error! };
    }

    const codeValidation = validateCode(code);
    if (!codeValidation.valid) {
      return { data: null, error: codeValidation.error! };
    }

    // If no display order provided, get the next available order
    let order = displayOrder;
    if (order === undefined) {
      const { data: existingDepartments } = await getDepartments(true);
      order = existingDepartments ? existingDepartments.length : 0;
    }

    const { data, error } = await supabase
      .from('org_departments')
      .insert({
        name: name.trim(),
        code: code.trim(),
        display_order: order,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating department:', error);
    return { data: null, error: getOrgErrorMessage(error) };
  }
}

export async function updateDepartment(
  id: string,
  updates: { name?: string; code?: string; display_order?: number; is_active?: boolean }
): Promise<{ data: DepartmentItem | null; error: string | null }> {
  try {
    // Validate name if provided
    if (updates.name !== undefined) {
      const nameValidation = validateName(updates.name);
      if (!nameValidation.valid) {
        return { data: null, error: nameValidation.error! };
      }
      updates.name = updates.name.trim();
    }

    // Validate code if provided
    if (updates.code !== undefined) {
      const codeValidation = validateCode(updates.code);
      if (!codeValidation.valid) {
        return { data: null, error: codeValidation.error! };
      }
      updates.code = updates.code.trim();
    }

    const { data, error } = await supabase
      .from('org_departments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating department:', error);
    return { data: null, error: getOrgErrorMessage(error) };
  }
}

export async function deleteDepartment(
  id: string,
  name: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('org_departments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return { error: getOrgErrorMessage(error) };
  }
}

export async function canDeleteDepartment(
  name: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    // Check if department is in use by any teachers
    // Check if department is in use by any teachers
    const { count, error } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true })
      .eq('department', name);

    if (error) throw error;

    return { data: (count === 0), error: null };
  } catch (error: any) {
    console.error('Error checking if department can be deleted:', error);
    return { data: false, error: getOrgErrorMessage(error) };
  }
}
