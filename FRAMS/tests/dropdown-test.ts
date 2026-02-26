/**
 * Dropdown Menu Test
 * 
 * This test verifies that the dropdown menus are working correctly
 * by checking if data is being fetched from the database.
 */

import { getDepartments, getClasses, getBranches } from '../lib/organization';

export async function testDropdownMenus() {
  console.log('🧪 Starting Dropdown Menu Tests...\n');

  try {
    // Test 1: Fetch Departments
    console.log('📋 Test 1: Fetching Departments');
    const departmentsResult = await getDepartments();
    
    if (departmentsResult.error) {
      console.error('❌ FAILED: Error fetching departments:', departmentsResult.error);
    } else if (!departmentsResult.data || departmentsResult.data.length === 0) {
      console.error('❌ FAILED: No departments found');
    } else {
      console.log('✅ PASSED: Departments fetched successfully');
      console.log(`   Found ${departmentsResult.data.length} departments:`);
      departmentsResult.data.forEach(dept => {
        console.log(`   - ${dept.name} (${dept.code})`);
      });
    }

    // Test 2: Fetch Classes
    console.log('\n📋 Test 2: Fetching Classes');
    const classesResult = await getClasses();
    
    if (classesResult.error) {
      console.error('❌ FAILED: Error fetching classes:', classesResult.error);
    } else if (!classesResult.data || classesResult.data.length === 0) {
      console.error('❌ FAILED: No classes found');
    } else {
      console.log('✅ PASSED: Classes fetched successfully');
      console.log(`   Found ${classesResult.data.length} classes:`);
      classesResult.data.slice(0, 5).forEach(cls => {
        console.log(`   - ${cls.name} (${cls.value})`);
      });
      if (classesResult.data.length > 5) {
        console.log(`   ... and ${classesResult.data.length - 5} more`);
      }
    }

    // Test 3: Fetch Branches for first class
    console.log('\n📋 Test 3: Fetching Branches for first class');
    if (classesResult.data && classesResult.data.length > 0) {
      const firstClass = classesResult.data[0];
      const branchesResult = await getBranches(firstClass.id);
      
      if (branchesResult.error) {
        console.error('❌ FAILED: Error fetching branches:', branchesResult.error);
      } else if (!branchesResult.data || branchesResult.data.length === 0) {
        console.warn('⚠️  WARNING: No branches found for class:', firstClass.name);
      } else {
        console.log('✅ PASSED: Branches fetched successfully');
        console.log(`   Found ${branchesResult.data.length} branches for ${firstClass.name}:`);
        branchesResult.data.slice(0, 5).forEach(branch => {
          console.log(`   - ${branch.name} (${branch.code})`);
        });
        if (branchesResult.data.length > 5) {
          console.log(`   ... and ${branchesResult.data.length - 5} more`);
        }
      }
    }

    console.log('\n✅ All dropdown tests completed!');
  } catch (error) {
    console.error('❌ Unexpected error during tests:', error);
  }
}

// Export for use in other modules
export default testDropdownMenus;
