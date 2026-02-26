/**
 * Comprehensive Audit Runner
 * Executes the full audit on all FRAMS screens and generates a report
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  ScreenScanner,
  KeyboardDetector,
  TypographyAnalyzer,
  LayoutTester,
  NavigationValidator,
  VisualChecker,
  PerformanceMonitor,
  ReportGenerator,
} from './index';
import { DEFAULT_AUDIT_CONFIG } from './config/audit.config';
import { AllIssues, ScreenInfo } from './types';

/**
 * Main audit execution function
 */
async function runComprehensiveAudit() {
  console.log('🔍 Starting comprehensive FRAMS UI/UX audit...\n');

  try {
    // Initialize audit components
    const screensPath = path.join(process.cwd(), 'FRAMS', 'screens');
    const scanner = new ScreenScanner(screensPath);
    const keyboardDetector = new KeyboardDetector();
    const typographyAnalyzer = new TypographyAnalyzer();
    const layoutTester = new LayoutTester();
    const navigationValidator = new NavigationValidator();
    const visualChecker = new VisualChecker();
    const performanceMonitor = new PerformanceMonitor();
    const reportGenerator = new ReportGenerator();

    // Step 1: Scan all screens
    console.log('📱 Step 1: Scanning all screens...');
    const allScreens = await scanner.scanAllScreens();
    console.log(`✓ Found ${allScreens.length} screens\n`);

    // Organize screens by category
    const authScreens = scanner.getScreensByCategory('auth');
    const adminScreens = scanner.getScreensByCategory('admin');
    const teacherScreens = scanner.getScreensByCategory('teacher');
    const studentScreens = scanner.getScreensByCategory('student');
    const auxiliaryScreens = scanner.getScreensByCategory('auxiliary');

    console.log(`  - Authentication: ${authScreens.length} screens`);
    console.log(`  - Admin: ${adminScreens.length} screens`);
    console.log(`  - Teacher: ${teacherScreens.length} screens`);
    console.log(`  - Student: ${studentScreens.length} screens`);
    console.log(`  - Auxiliary: ${auxiliaryScreens.length} screens\n`);

    // Initialize issues collection
    const allIssues: AllIssues = {
      keyboard: [],
      typography: [],
      layout: [],
      navigation: [],
      visual: [],
      performance: [],
    };

    // Step 2: Run audit on authentication screens
    console.log('🔐 Step 2: Auditing authentication screens...');
    await auditScreenCategory(
      authScreens,
      keyboardDetector,
      typographyAnalyzer,
      layoutTester,
      visualChecker,
      performanceMonitor,
      allIssues
    );
    console.log(`✓ Completed authentication audit\n`);

    // Step 3: Run audit on admin screens
    console.log('👨‍💼 Step 3: Auditing admin screens...');
    await auditScreenCategory(
      adminScreens,
      keyboardDetector,
      typographyAnalyzer,
      layoutTester,
      visualChecker,
      performanceMonitor,
      allIssues
    );
    console.log(`✓ Completed admin audit\n`);

    // Step 4: Run audit on teacher screens
    console.log('👨‍🏫 Step 4: Auditing teacher screens...');
    await auditScreenCategory(
      teacherScreens,
      keyboardDetector,
      typographyAnalyzer,
      layoutTester,
      visualChecker,
      performanceMonitor,
      allIssues
    );
    console.log(`✓ Completed teacher audit\n`);

    // Step 5: Run audit on student screens
    console.log('👨‍🎓 Step 5: Auditing student screens...');
    await auditScreenCategory(
      studentScreens,
      keyboardDetector,
      typographyAnalyzer,
      layoutTester,
      visualChecker,
      performanceMonitor,
      allIssues
    );
    console.log(`✓ Completed student audit\n`);

    // Step 6: Run audit on auxiliary screens
    console.log('🔧 Step 6: Auditing auxiliary screens...');
    await auditScreenCategory(
      auxiliaryScreens,
      keyboardDetector,
      typographyAnalyzer,
      layoutTester,
      visualChecker,
      performanceMonitor,
      allIssues
    );
    console.log(`✓ Completed auxiliary audit\n`);

    // Step 7: Run navigation validation
    console.log('🗺️  Step 7: Validating navigation flows...');
    const navigationIssues = await navigationValidator.validateNavigationFlows();
    allIssues.navigation = navigationIssues;
    console.log(`✓ Navigation validation complete (${navigationIssues.length} issues found)\n`);

    // Step 8: Generate comprehensive report
    console.log('📊 Step 8: Generating comprehensive audit report...');
    const report = await reportGenerator.generateReport(allIssues);
    
    // Save report to file
    const reportDir = path.join(process.cwd(), 'audit-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `audit-report-${timestamp}.md`);
    fs.writeFileSync(reportPath, report);
    console.log(`✓ Report saved to: ${reportPath}\n`);

    // Print summary
    console.log('📈 Audit Summary:');
    console.log(`  - Total Issues Found: ${
      allIssues.keyboard.length +
      allIssues.typography.length +
      allIssues.layout.length +
      allIssues.navigation.length +
      allIssues.visual.length +
      allIssues.performance.length
    }`);
    console.log(`  - Keyboard Issues: ${allIssues.keyboard.length}`);
    console.log(`  - Typography Issues: ${allIssues.typography.length}`);
    console.log(`  - Layout Issues: ${allIssues.layout.length}`);
    console.log(`  - Navigation Issues: ${allIssues.navigation.length}`);
    console.log(`  - Visual Issues: ${allIssues.visual.length}`);
    console.log(`  - Performance Issues: ${allIssues.performance.length}`);
    
    const uxScore = reportGenerator.calculateUXScore(allIssues);
    console.log(`  - UX Score: ${uxScore}/100\n`);

    console.log('✅ Comprehensive audit completed successfully!');
    return { success: true, reportPath, allIssues };
  } catch (error) {
    console.error('❌ Audit failed:', error);
    return { success: false, error };
  }
}

/**
 * Audit a category of screens
 */
async function auditScreenCategory(
  screens: ScreenInfo[],
  keyboardDetector: any,
  typographyAnalyzer: any,
  layoutTester: any,
  visualChecker: any,
  performanceMonitor: any,
  allIssues: AllIssues
) {
  for (const screen of screens) {
    try {
      // Run keyboard detection
      const keyboardIssues = await keyboardDetector.detectKeyboardIssues(screen);
      allIssues.keyboard.push(...keyboardIssues);

      // Run typography analysis
      const typographyIssues = await typographyAnalyzer.analyzeTypography(screen);
      allIssues.typography.push(...typographyIssues);

      // Run layout testing
      const layoutIssues = await layoutTester.testResponsiveness(
        screen,
        DEFAULT_AUDIT_CONFIG.devices
      );
      allIssues.layout.push(...layoutIssues);

      // Run visual consistency check
      const visualIssues = await visualChecker.checkConsistency(screen);
      allIssues.visual.push(...visualIssues);

      // Run performance monitoring
      for (const condition of DEFAULT_AUDIT_CONFIG.testConditions) {
        const performanceIssues = await performanceMonitor.monitorPerformance(
          screen,
          condition
        );
        allIssues.performance.push(...performanceIssues);
      }

      console.log(`  ✓ ${screen.name}`);
    } catch (error) {
      console.error(`  ✗ ${screen.name}: ${error}`);
    }
  }
}

// Run the audit
runComprehensiveAudit().catch(console.error);
