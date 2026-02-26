/**
 * Screen Scanner Component
 * Discovers and catalogs all screens in the FRAMS application
 */

import * as fs from 'fs';
import * as path from 'path';
import { ScreenInfo, ScreenScanner as IScreenScanner, ScreenCategory, UserRole } from '../types';

export class ScreenScanner implements IScreenScanner {
  private screensBasePath: string;
  private scannedScreens: ScreenInfo[] = [];

  constructor(screensBasePath: string = path.join(process.cwd(), 'screens')) {
    this.screensBasePath = screensBasePath;
  }

  /**
   * Scans all screens in the FRAMS application
   * Traverses the screens directory and extracts component information
   */
  async scanAllScreens(): Promise<ScreenInfo[]> {
    this.scannedScreens = [];
    
    // Scan root level screens (auth and auxiliary)
    await this.scanDirectory(this.screensBasePath, 'root');
    
    // Scan role-specific directories
    const roleDirs = ['admin', 'teacher', 'student'];
    for (const roleDir of roleDirs) {
      const rolePath = path.join(this.screensBasePath, roleDir);
      if (fs.existsSync(rolePath)) {
        await this.scanDirectory(rolePath, roleDir as UserRole);
      }
    }
    
    return this.scannedScreens;
  }

  /**
   * Gets screens filtered by category
   */
  getScreensByCategory(category: ScreenCategory): ScreenInfo[] {
    return this.scannedScreens.filter(screen => screen.category === category);
  }

  /**
   * Gets screens filtered by user role
   */
  getScreensByRole(role: UserRole): ScreenInfo[] {
    return this.scannedScreens.filter(screen => screen.role === role);
  }

  /**
   * Scans a directory for screen files
   */
  private async scanDirectory(dirPath: string, context: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
        const screenInfo = await this.parseScreenFile(filePath, context);
        if (screenInfo) {
          this.scannedScreens.push(screenInfo);
        }
      }
    }
  }

  /**
   * Parses a screen file to extract component information
   */
  private async parseScreenFile(filePath: string, context: string): Promise<ScreenInfo | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath, path.extname(filePath));
      
      // Determine category and role
      const { category, role } = this.categorizeScreen(fileName, context);
      
      // Extract component information
      const components = this.extractComponents(content);
      const hasInputFields = this.hasInputFields(content);
      const hasScrollView = this.hasScrollView(content);
      const hasKeyboardAwareScrollView = this.hasKeyboardAwareScrollView(content);
      
      return {
        name: fileName,
        path: filePath,
        category,
        role,
        hasInputFields,
        hasScrollView,
        hasKeyboardAwareScrollView,
        components,
      };
    } catch (error) {
      console.error(`Error parsing screen file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Categorizes a screen based on its name and context
   */
  private categorizeScreen(fileName: string, context: string): { category: ScreenCategory; role?: UserRole } {
    const lowerName = fileName.toLowerCase();
    
    // Role-based screens
    if (context === 'admin') {
      return { category: 'admin', role: 'admin' };
    }
    if (context === 'teacher') {
      return { category: 'teacher', role: 'teacher' };
    }
    if (context === 'student') {
      return { category: 'student', role: 'student' };
    }
    
    // Authentication screens
    const authScreens = ['signin', 'signup', 'forgotpassword', 'resetpassword', 
                         'emailverification', 'unverified'];
    if (authScreens.some(auth => lowerName.includes(auth))) {
      return { category: 'auth' };
    }
    
    // Everything else is auxiliary
    return { category: 'auxiliary' };
  }

  /**
   * Extracts component names from the file content
   */
  private extractComponents(content: string): string[] {
    const components: string[] = [];
    
    // Extract imported components
    const importRegex = /import\s+(?:{[^}]+}|[\w]+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      // Extract component names from the import statement
      const importStatement = match[0];
      const componentMatch = importStatement.match(/import\s+(?:{([^}]+)}|([\w]+))/);
      
      if (componentMatch) {
        if (componentMatch[1]) {
          // Named imports
          const namedImports = componentMatch[1].split(',').map(c => c.trim());
          components.push(...namedImports);
        } else if (componentMatch[2]) {
          // Default import
          components.push(componentMatch[2]);
        }
      }
    }
    
    // Extract JSX components used in the file
    const jsxRegex = /<([A-Z][a-zA-Z0-9]*)/g;
    while ((match = jsxRegex.exec(content)) !== null) {
      const componentName = match[1];
      if (!components.includes(componentName)) {
        components.push(componentName);
      }
    }
    
    return [...new Set(components)]; // Remove duplicates
  }

  /**
   * Checks if the screen has input fields
   */
  private hasInputFields(content: string): boolean {
    const inputPatterns = [
      /<Input\s/,
      /<TextInput\s/,
      /TextInput\s*{/,
      /Input\s*{/,
      /<TextField\s/,
    ];
    
    return inputPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Checks if the screen has ScrollView
   */
  private hasScrollView(content: string): boolean {
    const scrollViewPatterns = [
      /<ScrollView\s/,
      /ScrollView\s*{/,
    ];
    
    return scrollViewPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Checks if the screen has KeyboardAwareScrollView
   */
  private hasKeyboardAwareScrollView(content: string): boolean {
    const keyboardAwarePatterns = [
      /<KeyboardAwareScrollView\s/,
      /KeyboardAwareScrollView\s*{/,
    ];
    
    return keyboardAwarePatterns.some(pattern => pattern.test(content));
  }
}
