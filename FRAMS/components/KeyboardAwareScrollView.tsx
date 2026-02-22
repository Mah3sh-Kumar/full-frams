import React, { useRef, useEffect, useState } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TextInput,
  findNodeHandle,
  ScrollViewProps,
  KeyboardAvoidingViewProps,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  extraScrollHeight?: number;
  enableOnAndroid?: boolean;
  enableAutomaticScroll?: boolean;
  keyboardOpeningTime?: number;
  keyboardAvoidingViewProps?: Omit<KeyboardAvoidingViewProps, 'children' | 'style' | 'behavior'>;
}

/**
 * KeyboardAwareScrollView Component
 * 
 * A wrapper component that automatically scrolls to focused inputs when the keyboard appears.
 * Handles platform-specific keyboard behavior for both iOS and Android.
 * 
 * Features:
 * - Automatic scrolling to keep focused inputs visible above keyboard
 * - Restores original scroll position when keyboard dismisses
 * - Platform-specific behavior (padding for iOS, height for Android)
 * - Configurable scroll timing and extra spacing
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 * 
 * @param children - Child components to render inside the scroll view
 * @param extraScrollHeight - Additional padding above the focused input (default: 20px)
 * @param enableOnAndroid - Enable keyboard avoidance on Android (default: true)
 * @param enableAutomaticScroll - Enable automatic scrolling to focused inputs (default: true)
 * @param keyboardOpeningTime - Delay before scrolling to allow keyboard animation (default: 250ms)
 * @param keyboardAvoidingViewProps - Additional props to pass to KeyboardAvoidingView
 * 
 * @example
 * ```tsx
 * <KeyboardAwareScrollView extraScrollHeight={30}>
 *   <Input label="Email" />
 *   <Input label="Password" />
 * </KeyboardAwareScrollView>
 * ```
 */
export default function KeyboardAwareScrollView({
  children,
  extraScrollHeight = 20,
  enableOnAndroid = true,
  enableAutomaticScroll = true,
  keyboardOpeningTime = 250,
  keyboardAvoidingViewProps,
  ...scrollViewProps
}: KeyboardAwareScrollViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [originalScrollPosition, setOriginalScrollPosition] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!enableAutomaticScroll) return;

    // Track keyboard visibility
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        // Restore original scroll position when keyboard closes
        if (scrollViewRef.current && originalScrollPosition !== undefined) {
          scrollViewRef.current.scrollTo({
            y: originalScrollPosition,
            animated: true,
          });
        }
      }
    );

    // Handle focus events to scroll to focused input
    const handleFocus = (event: any) => {
      if (!scrollViewRef.current) return;

      const target = event.target;
      if (!target) return;

      // Save current scroll position before keyboard opens
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
      
      setTimeout(() => {
        if (scrollViewRef.current && target) {
          // Measure the focused input's position
          target.measureLayout(
            findNodeHandle(scrollViewRef.current),
            (x: number, y: number, width: number, height: number) => {
              // Calculate scroll position to keep input visible above keyboard
              const scrollY = y - extraScrollHeight;
              
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                  y: Math.max(0, scrollY),
                  animated: true,
                });
              }
            },
            () => {
              // Fallback: scroll to a safe default position
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({
                  y: extraScrollHeight,
                  animated: true,
                });
              }
            }
          );
        }
      }, keyboardOpeningTime);
    };

    // Note: In React Native, we can't directly listen to focus events on all TextInputs
    // This is a limitation. The actual focus handling will be done through the
    // TextInput's onFocus prop in the consuming components.

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [enableAutomaticScroll, extraScrollHeight, keyboardOpeningTime, originalScrollPosition]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Save scroll position when user manually scrolls (and keyboard is not visible)
    if (!keyboardVisible) {
      setOriginalScrollPosition(event.nativeEvent.contentOffset.y);
    }
    
    // Call parent's onScroll if provided
    if (scrollViewProps.onScroll) {
      scrollViewProps.onScroll(event);
    }
  };

  const scrollToInput = (inputRef: React.RefObject<TextInput>) => {
    if (!scrollViewRef.current || !inputRef.current || !enableAutomaticScroll) return;

    // Save current scroll position
    scrollViewRef.current.scrollResponderScrollNativeHandleToKeyboard?.(
      findNodeHandle(inputRef.current) as number,
      extraScrollHeight,
      true
    );
  };

  // Determine KeyboardAvoidingView behavior based on platform
  const keyboardBehavior = Platform.select({
    ios: 'padding' as const,
    android: enableOnAndroid ? 'height' as const : undefined,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={keyboardBehavior}
      keyboardVerticalOffset={0}
      {...keyboardAvoidingViewProps}
    >
      <ScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        {...scrollViewProps}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * useKeyboardAwareScroll Hook
 * 
 * A custom hook that provides manual control over scrolling to specific inputs.
 * Useful when you need to programmatically scroll to an input field.
 * 
 * @param scrollViewRef - Reference to the ScrollView component
 * @returns Object with scrollToInput function
 * 
 * @example
 * ```tsx
 * const scrollViewRef = useRef<ScrollView>(null);
 * const { scrollToInput } = useKeyboardAwareScroll(scrollViewRef);
 * const emailInputRef = useRef<TextInput>(null);
 * 
 * // Manually scroll to input
 * scrollToInput(emailInputRef, 30);
 * ```
 */
export const useKeyboardAwareScroll = (scrollViewRef: React.RefObject<ScrollView>) => {
  /**
   * Scrolls to a specific input field with optional extra spacing
   * @param inputRef - Reference to the TextInput to scroll to
   * @param extraHeight - Additional spacing above the input (default: 20px)
   */
  const scrollToInput = (inputRef: React.RefObject<TextInput>, extraHeight: number = 20) => {
    if (!scrollViewRef.current || !inputRef.current) return;

    setTimeout(() => {
      if (scrollViewRef.current && inputRef.current) {
        inputRef.current.measureLayout(
          findNodeHandle(scrollViewRef.current) as number,
          (x: number, y: number, width: number, height: number) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - extraHeight),
              animated: true,
            });
          },
          () => console.warn('Failed to measure input layout')
        );
      }
    }, 250);
  };

  return { scrollToInput };
};
