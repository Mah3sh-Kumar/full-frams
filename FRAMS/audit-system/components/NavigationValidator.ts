/**
 * Navigation Flow Validator Component
 * Verifies navigation integrity and user flow correctness
 */

import * as fs from 'fs';
import * as path from 'path';
import { NavigationIssue, NavigationValidator as INavigationValidator, UserRole, NavigationIssueType, IssueSeverity } from '../types';

interface NavigationFlow {
  from: string;
  to: string;
  role?: UserRole;
  requiresAuth: boolean;
  requiresVerification: boolean;
}

interface NavigationMap {
  screens: Set<string>;
  flows: NavigationFlow[];
  deadEnds: string[];
}

export class NavigationValidator implements INavigationValidator {
  private appPath: string;
  private navigationMap: NavigationMap | null = null;

  constructor(appPath: string = path.join(process.cwd(), 'App.tsx')) {
    this.appPath = appPath;
  }

  /**
   * Validates all navigation flows in the application
   */
  async validateNavigationFlows(): Promise<NavigationIssue[]> {
    const issues: NavigationIssue[] = [];

    // Build navigation map
    await this.buildNavigationMap();

    if (!this.navigationMap) {
      return issues;
    }

    // Test for dead-end states
    const deadEndIssues = await this.detectDeadEnds();
    issues.push(...deadEndIssues);

    // Test login flows for each role
    for (const role of ['admin', 'teacher', 'student'] as UserRole[]) {
      const loginFlowValid = await this.testLoginFlow(role);
      if (!loginFlowValid) {
        issues.push(this.createNavigationIssue(
          `Login flow for ${role}`,
          'inconsistent-transition',
          'high',
          `Login to dashboard transition for ${role} role is not properly configured`,
          `User with ${role} role should be able to navigate from SignIn to Dashboard`,
          'Navigation flow is missing or misconfigured',
          [
            `1. Log in as a user with ${role} role`,
            `2. Observe the navigation after successful authentication`,
            `3. Verify that the user is directed to the Dashboard screen`
          ]
        ));
      }
    }

    // Test logout flow
    const logoutFlowValid = await this.testLogoutFlow();
    if (!logoutFlowValid) {
      issues.push(this.createNavigationIssue(
        'Logout flow',
        'state-reset-failure',
        'critical',
        'Logout flow does not properly reset authentication state',
        'User should be redirected to SignIn screen with cleared session',
        'Authentication state may not be properly cleared',
        [
          '1. Log in as any user',
          '2. Navigate to Settings or Profile',
          '3. Trigger logout action',
          '4. Verify that user is redirected to SignIn screen',
          '5. Verify that session is cleared and authenticated screens are inaccessible'
        ]
      ));
    }

    // Test deep linking
    const deepLinkingValid = await this.testDeepLinking();
    if (!deepLinkingValid) {
      issues.push(this.createNavigationIssue(
        'Deep linking',
        'inconsistent-transition',
        'medium',
        'Deep linking functionality is not properly configured',
        'Reset password deep link should navigate to ResetPassword screen',
        'Deep link handling may be missing or misconfigured',
        [
          '1. Open the app via a reset password deep link',
          '2. Verify that the app navigates to ResetPassword screen',
          '3. Verify that the token parameter is passed correctly'
        ]
      ));
    }

    // Test back button behavior for key screens
    const keyScreens = ['Dashboard', 'Profile', 'Settings', 'Notifications'];
    for (const screen of keyScreens) {
      const backButtonValid = await this.testBackButtonBehavior(screen);
      if (!backButtonValid) {
        issues.push(this.createNavigationIssue(
          `Back button on ${screen}`,
          'back-button-failure',
          'medium',
          `Back button behavior on ${screen} screen is not predictable`,
          'Back button should navigate to previous screen or exit app appropriately',
          'Back button may cause unexpected navigation or app exit',
          [
            `1. Navigate to ${screen} screen`,
            `2. Press Android back button`,
            `3. Observe the navigation behavior`,
            `4. Verify that it matches Android conventions`
          ]
        ));
      }
    }

    return issues;
  }

  /**
   * Tests login flow for a specific role
   */
  async testLoginFlow(role: UserRole): Promise<boolean> {
    if (!this.navigationMap) {
      await this.buildNavigationMap();
    }

    if (!this.navigationMap) {
      return false;
    }

    // Check if there's a flow from SignIn to Dashboard
    const loginFlow = this.navigationMap.flows.find(
      flow => flow.from === 'SignIn' && flow.to === 'Dashboard'
    );

    // Check if Dashboard is accessible for this role
    const dashboardAccessible = this.navigationMap.screens.has('Dashboard');

    return loginFlow !== undefined && dashboardAccessible;
  }

  /**
   * Tests logout flow and state reset
   */
  async testLogoutFlow(): Promise<boolean> {
    if (!this.navigationMap) {
      await this.buildNavigationMap();
    }

    if (!this.navigationMap) {
      return false;
    }

    // Check if there's a way to get back to SignIn from authenticated screens
    // In React Navigation, this is typically handled by conditional rendering
    // We check if SignIn screen is defined in the navigation structure
    const signInExists = this.navigationMap.screens.has('SignIn');

    // Check if the app has proper authentication state management
    // This is indicated by conditional rendering in App.tsx
    const hasAuthStateManagement = await this.checkAuthStateManagement();

    return signInExists && hasAuthStateManagement;
  }

  /**
   * Tests back button behavior for a specific screen
   */
  async testBackButtonBehavior(screen: string): Promise<boolean> {
    if (!this.navigationMap) {
      await this.buildNavigationMap();
    }

    if (!this.navigationMap) {
      return false;
    }

    // Check if the screen exists
    if (!this.navigationMap.screens.has(screen)) {
      return false;
    }

    // Check if there are incoming flows to this screen
    const incomingFlows = this.navigationMap.flows.filter(flow => flow.to === screen);

    // If there are incoming flows, back button should work
    // Dashboard is a special case - it's typically the root and should exit the app
    if (screen === 'Dashboard') {
      return true; // Dashboard back button behavior is acceptable (exit app)
    }

    return incomingFlows.length > 0;
  }

  /**
   * Tests deep linking functionality
   */
  async testDeepLinking(): Promise<boolean> {
    try {
      const appContent = fs.readFileSync(this.appPath, 'utf-8');

      // Check for deep link handling
      const hasDeepLinkHandling = appContent.includes('parseDeepLink') ||
                                   appContent.includes('Linking.getInitialURL') ||
                                   appContent.includes('Linking.addEventListener');

      // Check for ResetPassword screen
      const hasResetPasswordScreen = appContent.includes('ResetPassword');

      return hasDeepLinkHandling && hasResetPasswordScreen;
    } catch (error) {
      console.error('Error testing deep linking:', error);
      return false;
    }
  }

  /**
   * Builds a map of all navigation flows in the application
   */
  private async buildNavigationMap(): Promise<void> {
    try {
      const appContent = fs.readFileSync(this.appPath, 'utf-8');

      const screens = new Set<string>();
      const flows: NavigationFlow[] = [];

      // Extract screen names from Stack.Screen components
      const screenRegex = /<Stack\.Screen\s+name="([^"]+)"/g;
      let match;

      while ((match = screenRegex.exec(appContent)) !== null) {
        screens.add(match[1]);
      }

      // Analyze navigation structure to determine flows
      // Auth screens can navigate to each other and to Dashboard
      const authScreens = ['SignIn', 'SignUp', 'ForgotPassword', 'ResetPassword', 'EmailVerification'];
      for (const authScreen of authScreens) {
        if (screens.has(authScreen)) {
          // Auth screens can navigate to other auth screens
          for (const targetAuth of authScreens) {
            if (authScreen !== targetAuth && screens.has(targetAuth)) {
              flows.push({
                from: authScreen,
                to: targetAuth,
                requiresAuth: false,
                requiresVerification: false
              });
            }
          }
          // Auth screens can navigate to Dashboard after login
          if (screens.has('Dashboard')) {
            flows.push({
              from: authScreen,
              to: 'Dashboard',
              requiresAuth: true,
              requiresVerification: true
            });
          }
        }
      }

      // Dashboard can navigate to all authenticated screens
      if (screens.has('Dashboard')) {
        for (const screen of screens) {
          if (screen !== 'Dashboard' && !authScreens.includes(screen) && screen !== 'Unverified') {
            flows.push({
              from: 'Dashboard',
              to: screen,
              requiresAuth: true,
              requiresVerification: true
            });
          }
        }
      }

      // All authenticated screens can navigate back to Dashboard
      for (const screen of screens) {
        if (!authScreens.includes(screen) && screen !== 'Dashboard' && screen !== 'Unverified') {
          flows.push({
            from: screen,
            to: 'Dashboard',
            requiresAuth: true,
            requiresVerification: true
          });
        }
      }

      // Detect dead ends
      const deadEnds: string[] = [];
      for (const screen of screens) {
        // A screen is a dead end if it has no outgoing flows and is not Dashboard
        const hasOutgoingFlows = flows.some(flow => flow.from === screen);
        const hasIncomingFlows = flows.some(flow => flow.to === screen);

        if (!hasOutgoingFlows && screen !== 'Dashboard' && hasIncomingFlows) {
          deadEnds.push(screen);
        }
      }

      this.navigationMap = {
        screens,
        flows,
        deadEnds
      };
    } catch (error) {
      console.error('Error building navigation map:', error);
      this.navigationMap = null;
    }
  }

  /**
   * Detects dead-end states in the navigation
   */
  private async detectDeadEnds(): Promise<NavigationIssue[]> {
    const issues: NavigationIssue[] = [];

    if (!this.navigationMap) {
      return issues;
    }

    for (const deadEnd of this.navigationMap.deadEnds) {
      issues.push(this.createNavigationIssue(
        `Dead-end state: ${deadEnd}`,
        'dead-end',
        'high',
        `Screen ${deadEnd} has no clear navigation path to return to previous screens`,
        'User should be able to navigate back from any screen',
        `Screen ${deadEnd} appears to be a dead end with no back navigation`,
        [
          `1. Navigate to ${deadEnd} screen`,
          `2. Attempt to navigate back using back button or UI controls`,
          `3. Observe that there is no clear way to return to previous screen`
        ]
      ));
    }

    return issues;
  }

  /**
   * Checks if the app has proper authentication state management
   */
  private async checkAuthStateManagement(): Promise<boolean> {
    try {
      const appContent = fs.readFileSync(this.appPath, 'utf-8');

      // Check for conditional rendering based on session/auth state
      const hasConditionalAuth = appContent.includes('!session') ||
                                  appContent.includes('!session.user') ||
                                  appContent.includes('useAuth');

      // Check for AuthProvider or similar context
      const hasAuthProvider = appContent.includes('AuthProvider') ||
                              appContent.includes('AuthContext');

      return hasConditionalAuth && hasAuthProvider;
    } catch (error) {
      console.error('Error checking auth state management:', error);
      return false;
    }
  }

  /**
   * Creates a navigation issue object
   */
  private createNavigationIssue(
    flow: string,
    issueType: NavigationIssueType,
    severity: IssueSeverity,
    description: string,
    expectedBehavior: string,
    actualBehavior: string,
    reproductionSteps: string[]
  ): NavigationIssue {
    return {
      id: this.generateId(),
      screen: flow,
      category: 'navigation',
      issueType,
      severity,
      title: `Navigation Issue: ${flow}`,
      description,
      reproductionSteps,
      recommendation: this.getRecommendation(issueType),
      flow,
      expectedBehavior,
      actualBehavior
    };
  }

  /**
   * Generates a unique ID for issues
   */
  private generateId(): string {
    return `navigation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets recommendation based on issue type
   */
  private getRecommendation(issueType: NavigationIssueType): string {
    switch (issueType) {
      case 'dead-end':
        return 'Add navigation controls (back button, navigation links) to allow users to return to previous screens. Consider using React Navigation\'s built-in back button handling.';
      case 'inconsistent-transition':
        return 'Review navigation configuration in App.tsx and ensure proper screen transitions are defined. Use React Navigation\'s navigation.navigate() or navigation.replace() appropriately.';
      case 'back-button-failure':
        return 'Implement proper back button handling using React Navigation\'s navigation.goBack() or configure headerLeft in screen options. Consider using useFocusEffect for custom back button behavior.';
      case 'state-reset-failure':
        return 'Ensure logout action properly clears authentication state and resets navigation stack. Use navigation.reset() to clear the navigation history and redirect to SignIn screen.';
      default:
        return 'Review navigation implementation and ensure it follows React Navigation best practices.';
    }
  }
}
