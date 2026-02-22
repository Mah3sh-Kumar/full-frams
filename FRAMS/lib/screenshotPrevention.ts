import { Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

/**
 * Configuration for screenshot prevention
 * 
 * @property enabled - Master switch to enable/disable all prevention
 * @property preventScreenshots - Prevent screenshot capture
 * @property preventScreenRecording - Prevent screen recording
 */
export interface ScreenshotPreventionConfig {
  enabled: boolean;
  preventScreenshots: boolean;
  preventScreenRecording: boolean;
}

/**
 * ScreenshotPreventionService
 * 
 * Singleton service for preventing screenshots and screen recording across platforms.
 * Implements platform-specific prevention strategies with graceful degradation.
 * 
 * Platform Support:
 * - Android: Uses FLAG_SECURE via expo-screen-capture
 * - iOS: Uses secure field overlay via expo-screen-capture
 * - Web: Not supported (gracefully degrades)
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 * 
 * @example
 * ```typescript
 * // Initialize on app startup
 * import { initializeScreenshotPrevention } from './lib/screenshotPrevention';
 * await initializeScreenshotPrevention();
 * 
 * // Or use the service directly
 * import { screenshotPrevention } from './lib/screenshotPrevention';
 * await screenshotPrevention.enable();
 * ```
 */
export class ScreenshotPreventionService {
  private static instance: ScreenshotPreventionService;
  private isCurrentlyEnabled: boolean = false;
  private config: ScreenshotPreventionConfig = {
    enabled: true,
    preventScreenshots: true,
    preventScreenRecording: true,
  };

  private constructor() {}

  /**
   * Get singleton instance of the service
   */
  public static getInstance(): ScreenshotPreventionService {
    if (!ScreenshotPreventionService.instance) {
      ScreenshotPreventionService.instance = new ScreenshotPreventionService();
    }
    return ScreenshotPreventionService.instance;
  }

  /**
   * Enable screenshot and screen recording prevention
   * Handles platform-specific implementation and graceful degradation
   */
  public async enable(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Check if the module is available
      if (!ScreenCapture.preventScreenCaptureAsync) {
        console.warn('Screenshot prevention not available on this platform');
        return;
      }

      // Enable prevention
      await ScreenCapture.preventScreenCaptureAsync();
      this.isCurrentlyEnabled = true;
    } catch (error) {
      // Silently handle errors - don't crash the app or show error messages
      console.warn('Failed to enable screenshot prevention:', error);
      this.isCurrentlyEnabled = false;
    }
  }

  /**
   * Disable screenshot and screen recording prevention
   */
  public async disable(): Promise<void> {
    try {
      if (!ScreenCapture.allowScreenCaptureAsync) {
        return;
      }

      await ScreenCapture.allowScreenCaptureAsync();
      this.isCurrentlyEnabled = false;
    } catch (error) {
      console.warn('Failed to disable screenshot prevention:', error);
    }
  }

  /**
   * Check if screenshot prevention is currently enabled
   */
  public isEnabled(): boolean {
    return this.isCurrentlyEnabled;
  }

  /**
   * Update configuration
   */
  public setConfig(config: Partial<ScreenshotPreventionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): ScreenshotPreventionConfig {
    return { ...this.config };
  }
}

/**
 * Initialize screenshot prevention on app startup
 * Call this in your App.tsx or main entry point
 */
export async function initializeScreenshotPrevention(): Promise<void> {
  const service = ScreenshotPreventionService.getInstance();
  await service.enable();
}

// Export singleton instance for convenience
export const screenshotPrevention = ScreenshotPreventionService.getInstance();
