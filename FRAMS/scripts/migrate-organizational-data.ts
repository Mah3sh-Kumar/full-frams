/**
 * Migration Script: Populate Organizational Data
 * 
 * This script migrates hardcoded data from lib/constants.ts to the database.
 * It can be run independently to populate or update organizational data.
 * 
 * Requirements: 5.2, 5.3, 5.4
 * 
 * Usage:
 *   npx ts-node scripts/migrate-organizational-data.ts
 */

import { supabase } from '../lib/supabase';
import { CLASS_LEVELS, BRANCHES, DEPARTMENTS } from '../lib/constants';

interface MigrationResult {
  success: boolean;
  message: string;
  details?: {
    classes: number;
    branches: number;
    departments: number;
  };
  errors?: string[];
}

/**
 * Migrate class levels to org_classes table
 */
async function migrateClasses(): Promise<{ success: boolean; count: number; errors: string[] }> {
  console.log('\n📚 Migrating class levels...');
  const errors: string[] = [];
  let successCount = 0;

  for (let i = 0; i < CLASS_LEVELS.length; i++) {
    const classLevel = CLASS_LEVELS[i];
    
    try {
      const { error } = await supabase
        .from('org_classes')
        .upsert({
          name: classLevel.label,
          value: classLevel.value,
          display_order: i + 1,
          is_active: true,
        }, {
          onConflict: 'name',
          ignoreDuplicates: false,
        });

      if (error) {
        errors.push(`Failed to migrate class "${classLevel.label}": ${error.message}`);
        console.error(`  ❌ ${classLevel.label}: ${error.message}`);
      } else {
        successCount++;
        console.log(`  ✅ ${classLevel.label}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Exception migrating class "${classLevel.label}": ${errorMsg}`);
      console.error(`  ❌ ${classLevel.label}: ${errorMsg}`);
    }
  }

  console.log(`\nMigrated ${successCount}/${CLASS_LEVELS.length} class levels`);
  return { success: errors.length === 0, count: successCount, errors };
}

/**
 * Migrate branches to org_branches table
 */
async function migrateBranches(): Promise<{ success: boolean; count: number; errors: string[] }> {
  console.log('\n🌿 Migrating branches...');
  const errors: string[] = [];
  let successCount = 0;

  for (let i = 0; i < BRANCHES.length; i++) {
    const branch = BRANCHES[i];
    
    try {
      const { error } = await supabase
        .from('org_branches')
        .upsert({
          name: branch,
          class_id: null, // Not associated with specific class initially
          display_order: i + 1,
          is_active: true,
        }, {
          onConflict: 'name,class_id',
          ignoreDuplicates: false,
        });

      if (error) {
        errors.push(`Failed to migrate branch "${branch}": ${error.message}`);
        console.error(`  ❌ ${branch}: ${error.message}`);
      } else {
        successCount++;
        console.log(`  ✅ ${branch}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Exception migrating branch "${branch}": ${errorMsg}`);
      console.error(`  ❌ ${branch}: ${errorMsg}`);
    }
  }

  console.log(`\nMigrated ${successCount}/${BRANCHES.length} branches`);
  return { success: errors.length === 0, count: successCount, errors };
}

/**
 * Migrate departments to org_departments table
 */
async function migrateDepartments(): Promise<{ success: boolean; count: number; errors: string[] }> {
  console.log('\n🏢 Migrating departments...');
  const errors: string[] = [];
  let successCount = 0;

  for (let i = 0; i < DEPARTMENTS.length; i++) {
    const department = DEPARTMENTS[i];
    
    try {
      const { error } = await supabase
        .from('org_departments')
        .upsert({
          name: department,
          display_order: i + 1,
          is_active: true,
        }, {
          onConflict: 'name',
          ignoreDuplicates: false,
        });

      if (error) {
        errors.push(`Failed to migrate department "${department}": ${error.message}`);
        console.error(`  ❌ ${department}: ${error.message}`);
      } else {
        successCount++;
        console.log(`  ✅ ${department}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Exception migrating department "${department}": ${errorMsg}`);
      console.error(`  ❌ ${department}: ${errorMsg}`);
    }
  }

  console.log(`\nMigrated ${successCount}/${DEPARTMENTS.length} departments`);
  return { success: errors.length === 0, count: successCount, errors };
}

/**
 * Verify data integrity after migration
 */
async function verifyMigration(): Promise<{ success: boolean; message: string }> {
  console.log('\n🔍 Verifying migration...');
  
  try {
    // Count records in each table
    const { count: classCount, error: classError } = await supabase
      .from('org_classes')
      .select('*', { count: 'exact', head: true });

    const { count: branchCount, error: branchError } = await supabase
      .from('org_branches')
      .select('*', { count: 'exact', head: true });

    const { count: departmentCount, error: departmentError } = await supabase
      .from('org_departments')
      .select('*', { count: 'exact', head: true });

    if (classError || branchError || departmentError) {
      const errors = [classError, branchError, departmentError]
        .filter(e => e !== null)
        .map(e => e!.message)
        .join(', ');
      return { success: false, message: `Verification failed: ${errors}` };
    }

    console.log(`\n📊 Data counts:`);
    console.log(`  Classes: ${classCount ?? 0} (expected: ${CLASS_LEVELS.length})`);
    console.log(`  Branches: ${branchCount ?? 0} (expected: ${BRANCHES.length})`);
    console.log(`  Departments: ${departmentCount ?? 0} (expected: ${DEPARTMENTS.length})`);

    const allCountsValid = 
      (classCount ?? 0) >= CLASS_LEVELS.length &&
      (branchCount ?? 0) >= BRANCHES.length &&
      (departmentCount ?? 0) >= DEPARTMENTS.length;

    if (allCountsValid) {
      return { success: true, message: 'All data verified successfully!' };
    } else {
      return { 
        success: false, 
        message: 'Data counts do not match expected values. Some records may be missing.' 
      };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Verification error: ${errorMsg}` };
  }
}

/**
 * Main migration function
 */
async function runMigration(): Promise<MigrationResult> {
  console.log('='.repeat(60));
  console.log('🚀 Starting Organizational Data Migration');
  console.log('='.repeat(60));

  const allErrors: string[] = [];

  // Migrate classes
  const classResult = await migrateClasses();
  allErrors.push(...classResult.errors);

  // Migrate branches
  const branchResult = await migrateBranches();
  allErrors.push(...branchResult.errors);

  // Migrate departments
  const departmentResult = await migrateDepartments();
  allErrors.push(...departmentResult.errors);

  // Verify migration
  const verificationResult = await verifyMigration();

  console.log('\n' + '='.repeat(60));
  console.log('📋 Migration Summary');
  console.log('='.repeat(60));

  const result: MigrationResult = {
    success: allErrors.length === 0 && verificationResult.success,
    message: verificationResult.message,
    details: {
      classes: classResult.count,
      branches: branchResult.count,
      departments: departmentResult.count,
    },
    errors: allErrors.length > 0 ? allErrors : undefined,
  };

  if (result.success) {
    console.log('✅ Migration completed successfully!');
  } else {
    console.log('⚠️  Migration completed with errors:');
    allErrors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\nDetails:');
  console.log(`  Classes migrated: ${classResult.count}/${CLASS_LEVELS.length}`);
  console.log(`  Branches migrated: ${branchResult.count}/${BRANCHES.length}`);
  console.log(`  Departments migrated: ${departmentResult.count}/${DEPARTMENTS.length}`);
  console.log('='.repeat(60));

  return result;
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error during migration:', error);
      process.exit(1);
    });
}

export { runMigration, migrateClasses, migrateBranches, migrateDepartments, verifyMigration };
