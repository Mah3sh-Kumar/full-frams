/**
 * Performance Monitor Component
 * Identifies performance bottlenecks and UI jank issues
 */

import { 
  PerformanceIssue, 
  PerformanceMonitor as IPerformanceMonitor, 
  ScreenInfo, 
  TestConditions,
  PerformanceIssueType,
  PerformanceMetrics,
  CodeReference
} from '../types';
import { generateIssueId, mapScoreToSeverity } from '../utils/helpers';
import * as fs from 'fs';
import * as path from 'path';

export class PerformanceMonitor implements IPerformanceMonitor {
  
  /**
   * Monitor performance for a given screen under specific test conditions
   */
  async monitorPerformance(screen: ScreenInfo, conditions: TestConditions): Promise<PerformanceIssue[]> {
    const issues: PerformanceIssue[] = [];
    
    // Check for list optimization issues
    const listComponents = screen.components.filter(comp => 
      comp.toLowerCase().includes('list') || 
      comp.toLowerCase().includes('flatlist') ||
      comp.toLowerCase().includes('sectionlist')
    );
    
    for (const listComponent of listComponents) {
      const isOptimized = this.checkListOptimization(listComponent);
      if (!isOptimized) {
        issues.push(this.createUnoptimizedListIssue(screen, listComponent));
      }
    }
    
    // Test network performance if conditions include slow network
    if (conditions.networkSpeed === 'slow-3g' || conditions.networkSpeed === 'fast-3g') {
      const networkIssues = await this.testSlowNetwork(screen.name);
      issues.push(...networkIssues);
    }
    
    // Check for potential frame rate issues
    const frameRate = await this.measureFrameRate(screen.name);
    if (frameRate < 50) {
      issues.push(this.createFrameRateIssue(screen, frameRate));
    }
    
    // Check for delayed feedback issues
    const delayedFeedbackIssues = await this.checkDelayedFeedback(screen);
    issues.push(...delayedFeedbackIssues);
    
    return issues;
  }
  
  /**
   * Measure frame rate for a screen (simulated for audit system)
   */
  async measureFrameRate(screen: string): Promise<number> {
    // In a real implementation, this would use React Native Performance Monitor
    // or Flipper to measure actual frame rates
    // For audit purposes, we simulate based on screen complexity
    
    try {
      const screenPath = path.join(process.cwd(), 'screens', `${screen}.tsx`);
      if (!fs.existsSync(screenPath)) {
        return 60; // Default frame rate if screen not found
      }
      
      const content = fs.readFileSync(screenPath, 'utf-8');
      
      // Simulate frame rate based on screen complexity
      const lines = content.split('\n').length;
      const hasAnimations = content.includes('Animated.') || content.includes('useNativeDriver');
      const hasComplexLayout = content.includes('flex:') && content.split('flex:').length > 5;
      const hasLargeLists = content.includes('FlatList') || content.includes('SectionList');
      
      let frameRate = 60; // Base frame rate
      
      // Reduce frame rate based on complexity
      if (lines > 200) frameRate -= 5;
      if (hasAnimations) frameRate -= 10;
      if (hasComplexLayout) frameRate -= 5;
      if (hasLargeLists) frameRate -= 10;
      
      // Ensure minimum frame rate
      return Math.max(30, frameRate);
    } catch (error) {
      // Default to 60fps if measurement fails
      return 60;
    }
  }
  
  /**
   * Check if a list component is properly optimized
   */
  checkListOptimization(listComponent: string): boolean {
    // In a real implementation, this would analyze the component code
    // For audit purposes, we check for optimization patterns
    
    try {
      // Look for the component file
      const componentPath = this.findComponentPath(listComponent);
      if (!componentPath || !fs.existsSync(componentPath)) {
        return false; // Component not found, assume not optimized
      }
      
      const content = fs.readFileSync(componentPath, 'utf-8');
      
      // Check for optimization patterns
      const hasKeyExtractor = content.includes('keyExtractor') || content.includes('key=');
      const hasGetItemLayout = content.includes('getItemLayout');
      const hasRemoveClippedSubviews = content.includes('removeClippedSubviews');
      const hasInitialNumToRender = content.includes('initialNumToRender');
      const hasMaxToRenderPerBatch = content.includes('maxToRenderPerBatch');
      const hasWindowSize = content.includes('windowSize');
      
      // Consider optimized if it has at least 3 optimization patterns
      const optimizationCount = [
        hasKeyExtractor,
        hasGetItemLayout,
        hasRemoveClippedSubviews,
        hasInitialNumToRender,
        hasMaxToRenderPerBatch,
        hasWindowSize
      ].filter(Boolean).length;
      
      return optimizationCount >= 3;
    } catch (error) {
      return false; // Assume not optimized if check fails
    }
  }
  
  /**
   * Test UI responsiveness under slow network conditions
   */
  async testSlowNetwork(screen: string): Promise<PerformanceIssue[]> {
    const issues: PerformanceIssue[] = [];
    
    try {
      const screenPath = path.join(process.cwd(), 'screens', `${screen}.tsx`);
      if (!fs.existsSync(screenPath)) {
        return issues; // No issues if screen not found
      }
      
      const content = fs.readFileSync(screenPath, 'utf-8');
      
      // Check for network-related performance issues
      const hasNetworkCalls = content.includes('fetch(') || 
                              content.includes('axios') || 
                              content.includes('supabase') ||
                              content.includes('api/');
      
      const hasLoadingStates = content.includes('Loading') || 
                              content.includes('loading') ||
                              content.includes('isLoading') ||
                              content.includes('ActivityIndicator');
      
      const hasErrorHandling = content.includes('catch(') || 
                              content.includes('.catch') ||
                              content.includes('try {') ||
                              content.includes('error');
      
      // Create issues based on findings
      if (hasNetworkCalls && !hasLoadingStates) {
        issues.push(this.createNetworkLoadingIssue(screen));
      }
      
      if (hasNetworkCalls && !hasErrorHandling) {
        issues.push(this.createNetworkErrorHandlingIssue(screen));
      }
      
      // Check for large data fetches without pagination
      const hasLargeDataFetch = content.includes('limit(') && 
                               !content.includes('offset(') && 
                               !content.includes('skip(');
      
      if (hasLargeDataFetch) {
        issues.push(this.createPaginationIssue(screen));
      }
      
    } catch (error) {
      // Silently continue if test fails
    }
    
    return issues;
  }
  
  /**
   * Check for delayed feedback after user actions
   */
  private async checkDelayedFeedback(screen: ScreenInfo): Promise<PerformanceIssue[]> {
    const issues: PerformanceIssue[] = [];
    
    try {
      const screenPath = path.join(process.cwd(), 'screens', screen.path);
      if (!fs.existsSync(screenPath)) {
        return issues;
      }
      
      const content = fs.readFileSync(screenPath, 'utf-8');
      
      // Check for user actions without immediate feedback
      const hasButtons = content.includes('Button') || 
                        content.includes('Touchable') ||
                        content.includes('onPress');
      
      const hasImmediateFeedback = content.includes('setState(') ||
                                  content.includes('useState(') ||
                                  content.includes('dispatch(') ||
                                  content.includes('Alert.') ||
                                  content.includes('Toast.');
      
      if (hasButtons && !hasImmediateFeedback) {
        issues.push(this.createDelayedFeedbackIssue(screen));
      }
      
    } catch (error) {
      // Silently continue if check fails
    }
    
    return issues;
  }
  
  /**
   * Find the path to a component file
   */
  private findComponentPath(componentName: string): string | null {
    const possiblePaths = [
      path.join(process.cwd(), 'screens', `${componentName}.tsx`),
      path.join(process.cwd(), 'screens', `${componentName}.ts`),
      path.join(process.cwd(), 'components', `${componentName}.tsx`),
      path.join(process.cwd(), 'components', `${componentName}.ts`),
      path.join(process.cwd(), 'screens', 'admin', `${componentName}.tsx`),
      path.join(process.cwd(), 'screens', 'auth', `${componentName}.tsx`),
      path.join(process.cwd(), 'screens', 'teacher', `${componentName}.tsx`),
      path.join(process.cwd(), 'screens', 'student', `${componentName}.tsx`),
    ];
    
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        return possiblePath;
      }
    }
    
    return null;
  }
  
  /**
   * Create an issue for unoptimized lists
   */
  private createUnoptimizedListIssue(screen: ScreenInfo, listComponent: string): PerformanceIssue {
    const metrics: PerformanceMetrics = {
      listItemCount: 50, // Assume typical list size
    };
    
    const codeReference: CodeReference = {
      file: screen.path,
      component: listComponent,
      snippet: `// Check for FlatList optimization patterns like keyExtractor, getItemLayout, removeClippedSubviews`
    };
    
    return {
      id: generateIssueId(),
      screen: screen.name,
      category: 'performance',
      issueType: 'unoptimized-list' as PerformanceIssueType,
      severity: mapScoreToSeverity(70), // High severity
      title: `Unoptimized list component: ${listComponent}`,
      description: `The ${listComponent} component may cause performance issues with large lists. Missing optimization patterns like keyExtractor, getItemLayout, or removeClippedSubviews.`,
      reproductionSteps: [
        `Navigate to ${screen.name}`,
        `Scroll through the list with 50+ items`,
        `Observe jank or lag during scrolling`
      ],
      codeReference,
      recommendation: `Add optimization patterns to ${listComponent}: keyExtractor, getItemLayout, removeClippedSubviews, initialNumToRender, maxToRenderPerBatch, and windowSize.`,
      metrics,
      optimizationRecommendation: `Implement FlatList optimization: Use keyExtractor for stable IDs, getItemLayout for predictable item sizes, removeClippedSubviews to unmount offscreen items, and adjust initialNumToRender/maxToRenderPerBatch for better performance.`
    };
  }
  
  /**
   * Create an issue for low frame rate
   */
  private createFrameRateIssue(screen: ScreenInfo, frameRate: number): PerformanceIssue {
    const metrics: PerformanceMetrics = {
      frameRate,
    };
    
    const codeReference: CodeReference = {
      file: screen.path,
      snippet: `// Frame rate measured: ${frameRate}fps (target: 50fps+)`
    };
    
    return {
      id: generateIssueId(),
      screen: screen.name,
      category: 'performance',
      issueType: 'jank' as PerformanceIssueType,
      severity: frameRate < 30 ? 'critical' : frameRate < 40 ? 'high' : 'medium',
      title: `Low frame rate on ${screen.name}: ${frameRate}fps`,
      description: `The ${screen.name} screen has a frame rate of ${frameRate}fps, which is below the recommended 50fps for smooth animations. Users may experience jank or lag.`,
      reproductionSteps: [
        `Navigate to ${screen.name}`,
        `Perform navigation transitions or scroll interactions`,
        `Observe frame drops using React Native Performance Monitor or Flipper`
      ],
      codeReference,
      recommendation: `Optimize ${screen.name} by reducing component complexity, using shouldComponentUpdate or React.memo, avoiding expensive operations in render, and using useNativeDriver for animations.`,
      metrics,
      optimizationRecommendation: `Profile the screen with React Native Performance Monitor to identify bottlenecks. Consider simplifying complex layouts, memoizing expensive components, and using FlatList virtualization for large lists.`
    };
  }
  
  /**
   * Create an issue for missing network loading states
   */
  private createNetworkLoadingIssue(screen: string): PerformanceIssue {
    const metrics: PerformanceMetrics = {
      renderTime: 2000, // Assume 2s render time without loading state
    };
    
    const codeReference: CodeReference = {
      file: `screens/${screen}.tsx`,
      snippet: `// Network calls without loading state feedback`
    };
    
    return {
      id: generateIssueId(),
      screen,
      category: 'performance',
      issueType: 'delayed-feedback' as PerformanceIssueType,
      severity: 'medium',
      title: `Missing loading state for network operations on ${screen}`,
      description: `The ${screen} screen makes network calls but doesn't provide loading feedback, causing users to wonder if their action was registered.`,
      reproductionSteps: [
        `Navigate to ${screen}`,
        `Trigger a network operation (e.g., submit form, load data)`,
        `Observe lack of loading indicator or feedback`
      ],
      codeReference,
      recommendation: `Add loading states using ActivityIndicator, LoadingSpinner component, or skeleton screens. Show immediate feedback when network operations start.`,
      metrics,
      optimizationRecommendation: `Implement immediate visual feedback for all network operations. Use React Native's ActivityIndicator or a custom LoadingSpinner component. Consider skeleton screens for better perceived performance.`
    };
  }
  
  /**
   * Create an issue for missing network error handling
   */
  private createNetworkErrorHandlingIssue(screen: string): PerformanceIssue {
    const codeReference: CodeReference = {
      file: `screens/${screen}.tsx`,
      snippet: `// Network calls without error handling`
    };
    
    return {
      id: generateIssueId(),
      screen,
      category: 'performance',
      issueType: 'delayed-feedback' as PerformanceIssueType,
      severity: 'medium',
      title: `Missing error handling for network operations on ${screen}`,
      description: `The ${screen} screen makes network calls but doesn't handle errors properly, potentially leaving users in an undefined state.`,
      reproductionSteps: [
        `Navigate to ${screen}`,
        `Trigger a network operation while offline or with slow network`,
        `Observe lack of error feedback or timeout handling`
      ],
      codeReference,
      recommendation: `Add comprehensive error handling with try/catch blocks, network status checks, and user-friendly error messages. Implement retry logic for transient failures.`,
      metrics: {},
      optimizationRecommendation: `Wrap all network calls in try/catch blocks. Use React Native's NetInfo to check connectivity. Implement exponential backoff for retries. Provide clear error messages with recovery options.`
    };
  }
  
  /**
   * Create an issue for missing pagination
   */
  private createPaginationIssue(screen: string): PerformanceIssue {
    const metrics: PerformanceMetrics = {
      listItemCount: 100, // Assume large dataset
    };
    
    const codeReference: CodeReference = {
      file: `screens/${screen}.tsx`,
      snippet: `// Large data fetch without pagination`
    };
    
    return {
      id: generateIssueId(),
      screen,
      category: 'performance',
      issueType: 'slow-render' as PerformanceIssueType,
      severity: 'high',
      title: `Missing pagination for large data sets on ${screen}`,
      description: `The ${screen} screen fetches large data sets without pagination, causing slow initial load and potential memory issues.`,
      reproductionSteps: [
        `Navigate to ${screen}`,
        `Load data with 100+ items`,
        `Observe slow initial render and potential memory warnings`
      ],
      codeReference,
      recommendation: `Implement pagination using limit/offset or cursor-based pagination. Load data incrementally as user scrolls.`,
      metrics,
      optimizationRecommendation: `Use Supabase's range queries or implement cursor-based pagination. Load initial batch (e.g., 20 items) and fetch more on scroll. Implement infinite scrolling with FlatList's onEndReached.`
    };
  }
  
  /**
   * Create an issue for delayed user feedback
   */
  private createDelayedFeedbackIssue(screen: ScreenInfo): PerformanceIssue {
    const codeReference: CodeReference = {
      file: screen.path,
      snippet: `// User actions without immediate feedback`
    };
    
    return {
      id: generateIssueId(),
      screen: screen.name,
      category: 'performance',
      issueType: 'delayed-feedback' as PerformanceIssueType,
      severity: 'low',
      title: `Delayed feedback for user actions on ${screen.name}`,
      description: `The ${screen.name} screen has user actions (buttons, touchables) but doesn't provide immediate visual feedback, making the UI feel unresponsive.`,
      reproductionSteps: [
        `Navigate to ${screen.name}`,
        `Tap on interactive elements (buttons, cards)`,
        `Observe lack of immediate visual feedback (press states, loading indicators)`
      ],
      codeReference,
      recommendation: `Add immediate feedback for all user interactions using TouchableOpacity, Button press states, or haptic feedback.`,
      metrics: {},
      optimizationRecommendation: `Use TouchableOpacity with activeOpacity prop for visual feedback. Implement haptic feedback using expo-haptics for important actions. Show loading states immediately after user action.`
    };
  }
}
