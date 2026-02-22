# Design Document

## Overview

This design addresses four critical issues in the FRAMS application:

1. **User Management Visibility**: Admin panel not showing all users, particularly unverified teacher accounts
2. **Authentication Feedback**: Missing error messages for incorrect login credentials
3. **Dark Mode Functionality**: Theme switching not working properly across components
4. **Color Contrast Accessibility**: Poor contrast ratios affecting readability and compliance

The solution involves database query optimization, enhanced error handling, theme system improvements, and accessibility compliance updates.

## Architecture

The fixes will be implemented across three main layers:

### Data Layer
- Database query optimization for user retrieval
- RLS policy verification for admin access
- User verification system integration

### Business Logic Layer
- Enhanced authentication error handling
- Theme state management improvements
- Color contrast validation utilities

### Presentation Layer
- Component-level theme application
- Error message display system
- Accessibility-compliant color schemes

## Components and Interfaces

### 1. User Management System

**UserManagement Component**
- Enhanced `fetchUsers()` function with proper error handling
- Improved filtering logic for verification status
- Real-time updates when user verification changes

**Database Interface**
- Verify admin RLS policies allow full user access
- Ensure `is_verified` field is properly queried
- Add missing verification functions if needed

### 2. Authentication System

**SignInScreen Component**
- Enhanced error state management
- Specific error messages for different failure types
- Real-time error clearing on input change

**AuthContext Provider**
- Improved error parsing from Supabase responses
- Standardized error message formatting
- Better error state propagation

### 3. Theme System

**ThemeContext Provider**
- Enhanced theme persistence mechanism
- Improved component re-rendering on theme change
- Better integration with AsyncStorage

**Design System Components**
- Consistent theme application across all components
- Dynamic color resolution based on current mode
- Proper contrast ratio maintenance

### 4. Accessibility System

**Color Token Updates**
- WCAG 2.1 AA compliant color values
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text

## Data Models

### User Management Data Flow
```typescript
interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'student';
  is_verified: boolean;
  verified_at?: string;
  department?: string;
  enrollment_number?: string;
  class_level?: string;
  branch?: string;
}

interface UserQuery {
  includeUnverified: boolean;
  roleFilter?: string;
  searchQuery?: string;
}
```

### Authentication Error Model
```typescript
interface AuthError {
  type: 'invalid_credentials' | 'email_not_verified' | 'network_error' | 'unknown';
  message: string;
  field?: 'email' | 'password';
}
```

### Theme Configuration Model
```typescript
interface ThemeConfig {
  mode: 'light' | 'dark';
  role: UserRole;
  reducedMotion: boolean;
}

interface ColorToken {
  main: string;
  light: string;
  dark: string;
  contrast: string;
}
```
## Co
rrectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing the acceptance criteria, several properties can be consolidated to eliminate redundancy:

**Property Reflection:**
- Properties 1.1, 1.3, and 1.4 all relate to admin user queries and can be combined into a comprehensive admin access property
- Properties 2.4 and 2.5 both relate to error message behavior and can be combined
- Properties 3.1, 3.2, and 3.4 all relate to theme consistency and can be combined
- Properties 4.1, 4.2, 4.3, 4.4, and 4.5 all relate to contrast ratios and can be combined into accessibility compliance properties

**Property 1: Admin user access completeness**
*For any* admin user query, the system should return all users in the database regardless of verification status, with proper role-specific data merged from related tables
**Validates: Requirements 1.1, 1.3, 1.4, 1.5**

**Property 2: Authentication error feedback consistency**
*For any* authentication failure, the system should display an appropriate error message within 3 seconds and clear the message when user input changes
**Validates: Requirements 2.4, 2.5**

**Property 3: Theme consistency across components**
*For any* theme mode change, all UI components should immediately reflect the new theme colors without requiring application restart
**Validates: Requirements 3.1, 3.2, 3.4**

**Property 4: Theme persistence reliability**
*For any* theme selection, the system should restore the same theme when the application restarts
**Validates: Requirements 3.3**

**Property 5: Dark mode accessibility compliance**
*For any* component in dark mode, the system should maintain proper contrast ratios for accessibility
**Validates: Requirements 3.5**

**Property 6: Universal contrast ratio compliance**
*For any* text and background color combination, the system should maintain minimum contrast ratios (4.5:1 for normal text, 3:1 for large text) in both light and dark modes
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

## Error Handling

### Database Query Errors
- **Connection Failures**: Retry mechanism with exponential backoff
- **RLS Policy Errors**: Fallback to basic user info if role-specific data fails
- **Timeout Handling**: 10-second timeout with user notification

### Authentication Errors
- **Network Errors**: "Network connection failed. Please try again."
- **Invalid Credentials**: "Invalid email or password. Please try again."
- **Email Not Verified**: "Please verify your email before signing in. Check your inbox for the verification link."
- **Account Locked**: "Account temporarily locked. Please contact support."
- **Unknown Errors**: "An unexpected error occurred. Please try again."

### Theme System Errors
- **Storage Failures**: Fall back to system default theme
- **Invalid Theme Data**: Reset to light mode with user notification
- **Component Update Failures**: Force re-render with error boundary

### Accessibility Errors
- **Contrast Calculation Failures**: Fall back to high-contrast mode
- **Color Token Missing**: Use fallback colors with warning log
- **Theme Application Failures**: Maintain current theme until resolved

## Testing Strategy

### Unit Testing Approach
- **Database Queries**: Mock Supabase client responses for different scenarios
- **Authentication Flow**: Test error parsing and message formatting
- **Theme System**: Test theme switching and persistence logic
- **Color Utilities**: Test contrast ratio calculations

### Property-Based Testing Approach
Using **fast-check** library for React Native/TypeScript:

**Property Test Configuration**:
- Minimum 100 iterations per property test
- Custom generators for user data, theme configurations, and color values
- Shrinking enabled for minimal failing examples

**Test Generators**:
- `userGenerator`: Creates random user objects with various roles and verification states
- `themeConfigGenerator`: Creates random theme configurations
- `colorPairGenerator`: Creates random color combinations for contrast testing
- `authErrorGenerator`: Creates various authentication error scenarios

**Property Test Implementation**:
Each property-based test will be tagged with comments linking to design properties:
```typescript
// **Feature: admin-ui-fixes, Property 1: Admin user access completeness**
// **Validates: Requirements 1.1, 1.3, 1.4, 1.5**
```

### Integration Testing
- **End-to-End User Flows**: Test complete user management workflow
- **Theme Switching**: Test theme changes across multiple screens
- **Authentication Flows**: Test login with various error conditions
- **Accessibility Testing**: Automated contrast ratio validation

### Performance Testing
- **Query Performance**: Ensure user queries complete within 2 seconds
- **Theme Switching**: Ensure theme changes complete within 500ms
- **Error Display**: Ensure error messages appear within 3 seconds

### Accessibility Testing
- **Automated Contrast Checking**: Validate all color combinations
- **Screen Reader Testing**: Ensure proper semantic markup
- **Keyboard Navigation**: Test focus management and navigation