/**
 * Test Audit Script
 * Simple test to verify audit system works
 */

import * as path from 'path';
import { ScreenScanner } from './components/ScreenScanner';

async function testAudit() {
  console.log('🔍 Testing audit system...\n');

  try {
    const screensPath = path.join(process.cwd(), 'FRAMS', 'screens');
    const scanner = new ScreenScanner(screensPath);

    console.log('📱 Scanning screens...');
    const allScreens = await scanner.scanAllScreens();
    console.log(`✓ Found ${allScreens.length} screens\n`);

    // Print screens by category
    const authScreens = scanner.getScreensByCategory('auth');
    const adminScreens = scanner.getScreensByCategory('admin');
    const teacherScreens = scanner.getScreensByCategory('teacher');
    const studentScreens = scanner.getScreensByCategory('student');
    const auxiliaryScreens = scanner.getScreensByCategory('auxiliary');

    console.log('Screens by category:');
    console.log(`  - Authentication: ${authScreens.length} screens`);
    for (const screen of authScreens) {
      console.log(`    • ${screen.name}`);
    }
    console.log(`  - Admin: ${adminScreens.length} screens`);
    for (const screen of adminScreens) {
      console.log(`    • ${screen.name}`);
    }
    console.log(`  - Teacher: ${teacherScreens.length} screens`);
    for (const screen of teacherScreens) {
      console.log(`    • ${screen.name}`);
    }
    console.log(`  - Student: ${studentScreens.length} screens`);
    for (const screen of studentScreens) {
      console.log(`    • ${screen.name}`);
    }
    console.log(`  - Auxiliary: ${auxiliaryScreens.length} screens`);
    for (const screen of auxiliaryScreens) {
      console.log(`    • ${screen.name}`);
    }

    console.log('\n✅ Audit system test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAudit().catch(console.error);
