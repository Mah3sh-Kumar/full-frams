/**
 * Migration Script: Populate Organizational Data
 * 
 * This script migrates hardcoded data from lib/constants.ts to the database.
 * It can be run independently to populate or update organizational data.
 * 
 * Requirements: 5.2, 5.3, 5.4
 * 
 * Usage:
 *   node scripts/migrate-organizational-data.js
 */

// Note: This is a JavaScript version that can run without ts-node
// For TypeScript version, see migrate-organizational-data.ts

const { createClient } = require('@supabase/supabase-js');
require('react-native-url-polyfill/auto');

// Hardcoded constants (from lib/constants.ts)
const CLASS_LEVELS = [
  { label: 'Class 9', value: 'class_9' },
  { label: 'Class 10', value: 'class_10' },
  { label: 'Class 11', value: 'class_11' },
  { label: 'Class 12', value: 'class_12' },
  { label: 'Graduation Year 1', value: 'grad_year_1' },
  { label: 'Graduation Year 2', value: 'grad_year_2' },
  { label: 'Graduation Year 3', value: 'grad_year_3' },
  { label: 'Graduation Year 4', value: 'grad_year_4' },
];

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'BBA',
  'BCA',
  'B.Com',
  'B.Sc',
  'Other',
];

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Commerce',
  'Economics',
  'Other',
];

// Initialize Supabase client
// Note: In production, use environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Supabase credentials not found in environment variables');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Migrate class levels to org_classes table
 */
async function migrateClasses() {
  console.log('\n📚 Migrating class levels...');
  const errors = [];
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
async function migrateBranches() {
  console.log('\n🌿 Migrating branches...');
  const errors = [];
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
async function migrateDepartments() {
  console.log('\n🏢 Migrating departments...');
  const errors = [];
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
async function verifyMigration() {
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
        .map(e => e.message)
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
async function runMigration() {
  console.log('='.repeat(60));
  console.log('🚀 Starting Organizational Data Migration');
  console.log('='.repeat(60));

  const allErrors = [];

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

  const result = {
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

// Run migration
runMigration()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  });

module.exports = { runMigration, migrateClasses, migrateBranches, migrateDepartments, verifyMigration };
