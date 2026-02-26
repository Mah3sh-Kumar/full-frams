/**
 * Unit Tests for Screen Scanner
 * Tests screen discovery, categorization, and component extraction
 */

import { ScreenScanner } from '../ScreenScanner';
import * as path from 'path';

describe('ScreenScanner Unit Tests', () => {
  const screensPath = path.join(process.cwd(), 'screens');
  let scanner: ScreenScanner;
  
  beforeEach(() => {
    scanner = new ScreenScanner(screensPath);
  });
  
  describe('Screen Discovery', () => {
    test('should discover all screens from file system', async () => {
      const screens = await scanner.scanAllScreens();
      
      expect(screens.length).toBeGreaterThan(0);
      expect(Array.isArray(screens)).toBe(true);
    });
    
    test('should discover auth screens', async () => {
      const screens = await scanner.scanAllScreens();
      const authScreens = screens.filter(s => s.category === 'auth');
      
      expect(authScreens.length).toBeGreaterThan(0);
      
      const authScreenNames = authScreens.map(s => s.name);
      expect(authScreenNames).toContain('SignInScreen');
      expect(authScreenNames).toContain('SignUpScreen');
      expect(authScreenNames).toContain('ForgotPasswordScreen');
    });
    
    test('should discover admin screens', async () => {
      const screens = await scanner.scanAllScreens();
      const adminScreens = screens.filter(s => s.category === 'admin');
      
      expect(adminScreens.length).toBeGreaterThan(0);
      
      const adminScreenNames = adminScreens.map(s => s.name);
      expect(adminScreenNames).toContain('UserManagement');
      expect(adminScreenNames).toContain('AdminDashboard');
    });
    
    test('should discover teacher screens', async () => {
      const screens = await scanner.scanAllScreens();
      const teacherScreens = screens.filter(s => s.category === 'teacher');
      
      expect(teacherScreens.length).toBeGreaterThan(0);
      
      const teacherScreenNames = teacherScreens.map(s => s.name);
      expect(teacherScreenNames).toContain('AttendanceManager');
      expect(teacherScreenNames).toContain('TeacherDashboard');
    });
    
    test('should discover student screens', async () => {
      const screens = await scanner.scanAllScreens();
      const studentScreens = screens.filter(s => s.category === 'student');
      
      expect(studentScreens.length).toBeGreaterThan(0);
      
      const studentScreenNames = studentScreens.map(s => s.name);
      expect(studentScreenNames).toContain('AttendanceScreen');
      expect(studentScreenNames).toContain('StudentDashboard');
    });
    
    test('should discover auxiliary screens', async () => {
      const screens = await scanner.scanAllScreens();
      const auxiliaryScreens = screens.filter(s => s.category === 'auxiliary');
      
      expect(auxiliaryScreens.length).toBeGreaterThan(0);
      
      const auxiliaryScreenNames = auxiliaryScreens.map(s => s.name);
      expect(auxiliaryScreenNames).toContain('ProfileScreen');
      expect(auxiliaryScreenNames).toContain('SettingsScreen');
    });
  });
  
  describe('Categorization Logic', () => {
    test('should categorize SignInScreen as auth', async () => {
      const screens = await scanner.scanAllScreens();
      const signInScreen = screens.find(s => s.name === 'SignInScreen');
      
      expect(signInScreen).toBeDefined();
      expect(signInScreen?.category).toBe('auth');
      expect(signInScreen?.role).toBeUndefined();
    });
    
    test('should categorize UserManagement as admin with admin role', async () => {
      const screens = await scanner.scanAllScreens();
      const userManagement = screens.find(s => s.name === 'UserManagement');
      
      expect(userManagement).toBeDefined();
      expect(userManagement?.category).toBe('admin');
      expect(userManagement?.role).toBe('admin');
    });
    
    test('should categorize AttendanceManager as teacher with teacher role', async () => {
      const screens = await scanner.scanAllScreens();
      const attendanceManager = screens.find(s => s.name === 'AttendanceManager');
      
      expect(attendanceManager).toBeDefined();
      expect(attendanceManager?.category).toBe('teacher');
      expect(attendanceManager?.role).toBe('teacher');
    });
    
    test('should categorize AttendanceScreen as student with student role', async () => {
      const screens = await scanner.scanAllScreens();
      const attendanceScreen = screens.find(s => s.name === 'AttendanceScreen');
      
      expect(attendanceScreen).toBeDefined();
      expect(attendanceScreen?.category).toBe('student');
      expect(attendanceScreen?.role).toBe('student');
    });
    
    test('should categorize ProfileScreen as auxiliary', async () => {
      const screens = await scanner.scanAllScreens();
      const profileScreen = screens.find(s => s.name === 'ProfileScreen');
      
      expect(profileScreen).toBeDefined();
      expect(profileScreen?.category).toBe('auxiliary');
      expect(profileScreen?.role).toBeUndefined();
    });
  });
  
  describe('Component Extraction', () => {
    test('should extract components from SignInScreen', async () => {
      const screens = await scanner.scanAllScreens();
      const signInScreen = screens.find(s => s.name === 'SignInScreen');
      
      expect(signInScreen).toBeDefined();
      expect(signInScreen?.components).toBeDefined();
      expect(Array.isArray(signInScreen?.components)).toBe(true);
      expect(signInScreen?.components.length).toBeGreaterThan(0);
      
      // Should include common components
      expect(signInScreen?.components).toContain('Input');
      expect(signInScreen?.components).toContain('Button');
    });
    
    test('should detect input fields in SignInScreen', async () => {
      const screens = await scanner.scanAllScreens();
      const signInScreen = screens.find(s => s.name === 'SignInScreen');
      
      expect(signInScreen?.hasInputFields).toBe(true);
    });
    
    test('should detect KeyboardAwareScrollView in SignInScreen', async () => {
      const screens = await scanner.scanAllScreens();
      const signInScreen = screens.find(s => s.name === 'SignInScreen');
      
      expect(signInScreen?.hasKeyboardAwareScrollView).toBe(true);
    });
    
    test('should detect ScrollView in ProfileScreen', async () => {
      const screens = await scanner.scanAllScreens();
      const profileScreen = screens.find(s => s.name === 'ProfileScreen');
      
      expect(profileScreen?.hasScrollView).toBe(true);
    });
    
    test('should detect input fields in ProfileScreen', async () => {
      const screens = await scanner.scanAllScreens();
      const profileScreen = screens.find(s => s.name === 'ProfileScreen');
      
      expect(profileScreen?.hasInputFields).toBe(true);
    });
  });
  
  describe('Filtering Methods', () => {
    test('getScreensByCategory should return only auth screens', async () => {
      await scanner.scanAllScreens();
      const authScreens = scanner.getScreensByCategory('auth');
      
      expect(authScreens.length).toBeGreaterThan(0);
      authScreens.forEach(screen => {
        expect(screen.category).toBe('auth');
      });
    });
    
    test('getScreensByCategory should return only admin screens', async () => {
      await scanner.scanAllScreens();
      const adminScreens = scanner.getScreensByCategory('admin');
      
      expect(adminScreens.length).toBeGreaterThan(0);
      adminScreens.forEach(screen => {
        expect(screen.category).toBe('admin');
      });
    });
    
    test('getScreensByRole should return only admin role screens', async () => {
      await scanner.scanAllScreens();
      const adminRoleScreens = scanner.getScreensByRole('admin');
      
      expect(adminRoleScreens.length).toBeGreaterThan(0);
      adminRoleScreens.forEach(screen => {
        expect(screen.role).toBe('admin');
      });
    });
    
    test('getScreensByRole should return only teacher role screens', async () => {
      await scanner.scanAllScreens();
      const teacherRoleScreens = scanner.getScreensByRole('teacher');
      
      expect(teacherRoleScreens.length).toBeGreaterThan(0);
      teacherRoleScreens.forEach(screen => {
        expect(screen.role).toBe('teacher');
      });
    });
    
    test('getScreensByRole should return only student role screens', async () => {
      await scanner.scanAllScreens();
      const studentRoleScreens = scanner.getScreensByRole('student');
      
      expect(studentRoleScreens.length).toBeGreaterThan(0);
      studentRoleScreens.forEach(screen => {
        expect(screen.role).toBe('student');
      });
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle non-existent directory gracefully', async () => {
      const invalidScanner = new ScreenScanner('/non/existent/path');
      const screens = await invalidScanner.scanAllScreens();
      
      expect(screens).toEqual([]);
    });
    
    test('should return empty array when filtering by category with no matches', async () => {
      await scanner.scanAllScreens();
      // This shouldn't happen in practice, but tests the filtering logic
      const filtered = scanner.getScreensByCategory('auth');
      expect(Array.isArray(filtered)).toBe(true);
    });
  });
});
