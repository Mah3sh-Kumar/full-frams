# Design Document

## Overview

This design document outlines the technical approach for implementing five critical UI and administrative improvements to the education management application. The improvements address keyboard handling issues, screenshot prevention security, dropdown menu functionality bugs, UI/UX enhancements, and administrative control over organizational data structures.

The application is built using React Native with Expo, TypeScript, and Supabase as the backend. The design leverages existing design system components and patterns while introducing new functionality for admin management capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Forms      │  │   Dropdowns  │  │ Admin Screens│      │
│  │ (Keyboard)   │  │  (Enhanced)  │  │  (CRUD UI)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │KeyboardAware │  │  Enhanced    │  │Organization  │      │
│  │  Wrapper     │  │  Picker      │  │  Manager     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Screenshot   │  │  Dropdown    │  │Organization  │      │
│  │ Prevention   │  │  State Mgmt  │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Supabase Backend                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ Classes  │  │ Branches │  │Departments│          │   │
│  │  │  Table   │  │  Table   │  │  Table    │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Keyboard Management Flow**: Form components → KeyboardAvoidingView wrapper → ScrollView with automatic positioning
2. **Screenshot Prevention Flow**: App initialization → Native module configuration → Platform-specific prevention
3. **Dropdown Flow**: User interaction → Enhanced Picker component → State management → Display update
4. **Admin Management Flow**: Admin UI → Organization service → Supabase API → Database tables

## Components and Interfaces

### 1. Keyboard Management Components

#### KeyboardAwareScrollView Wrapper
A reusable wrapper component that handles keyboard avoidance for all forms.

```typescript
interface KeyboardAwareScrollViewProps {
  children: React.ReactNode;
  extraScrollHeight?: number;
  enableOnAndroid?: boolean;
  enableAutomaticScroll?: boolean;
  keyboardOpeningTime?: number;
}
```

**Responsibilities:**
- Automatically scroll to focused input
- Maintain proper spacing above keyboard
- Handle keyboard show/hide events
- Restore scroll position on keyboard dismiss

### 2. Screenshot Prevention Module

#### ScreenshotPrevention Service
A platform-specific service that prevents screenshots and screen recording.

```typescript
interface ScreenshotPreventionConfig {
  enabled: boolean;
  preventScreenshots: boolean;
  preventScreenRecording: boolean;
}

interface ScreenshotPreventionService {
  enable(): Promise<void>;
  disable(): Promise<void>;
  isEnabled(): boolean;
}
```

**Platform Implementation:**
- **Android**: Use `FLAG_SECURE` window flag via native module
- **iOS**: Use `UITextField` secure text field overlay technique

### 3. Enhanced Dropdown Components

#### EnhancedPicker Component
An improved picker component with proper state management and visual feedback.

```typescript
interface EnhancedPickerProps<T> {
  label: string;
  value: T;
  items: PickerItem<T>[];
  onValueChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  searchable?: boolean;
  testID?: string;
}

interface PickerItem<T> {
  label: string;
  value: T;
  disabled?: boolean;
}
```

**Features:**
- Controlled component with proper value display
- Search/filter functionality for long lists
- Visual feedback on selection
- Error state support
- Accessibility support

### 4. Organization Management Components

#### OrganizationManager Screen
Admin interface for managing classes, branches, and departments.

```typescript
interface OrganizationManagerProps {
  initialTab?: 'classes' | 'branches' | 'departments';
}

interface OrganizationItem {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface ClassItem extends OrganizationItem {
  display_order: number;
}

interface BranchItem extends OrganizationItem {
  class_id: string;
  display_order: number;
}

interface DepartmentItem extends OrganizationItem {
  display_order: number;
}
```

#### OrganizationService
Service layer for CRUD operations on organizational data.

```typescript
interface OrganizationService {
  // Classes
  getClasses(): Promise<ClassItem[]>;
  createClass(name: string): Promise<ClassItem>;
  updateClass(id: string, name: string): Promise<void>;
  deleteClass(id: string): Promise<void>;
  
  // Branches
  getBranches(classId?: string): Promise<BranchItem[]>;
  createBranch(name: string, classId: string): Promise<BranchItem>;
  updateBranch(id: string, name: string): Promise<void>;
  deleteBranch(id: string): Promise<void>;
  
  // Departments
  getDepartments(): Promise<DepartmentItem[]>;
  createDepartment(name: string): Promise<DepartmentItem>;
  updateDepartment(id: string, name: string): Promise<void>;
  deleteDepartment(id: string): Promise<void>;
  
  // Validation
  canDelete(type: 'class' | 'branch' | 'department', id: string): Promise<boolean>;
}
```

## Data Models

### Database Schema

#### Classes Table
```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Branches Table
```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, class_id)
);
```

#### Departments Table
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Migration Strategy

1. Create new tables for classes, branches, and departments
2. Migrate existing hardcoded data from `lib/constants.ts` to database
3. Update all references to use database-driven data
4. Add RLS policies for admin-only write access
5. Maintain backward compatibility during transition

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing the prework analysis, several properties can be consolidated:

- Properties 3.1, 3.2, 3.3, and 3.5 all test the same behavior (dropdown value display) for different dropdown types. These can be combined into a single comprehensive property.
- Property 1.5 is a specific case of property 1.1 (keyboard navigation is just another way to focus fields).
- Properties 5.2, 5.4 can be combined into a single property about creating organizational items.
- Properties 5.5 and 5.6 can be combined into a single property about CRUD operations propagating to UI.

### Keyboard Management Properties

Property 1: Focused input visibility
*For any* form and any input field, when that input field receives focus and the keyboard opens, the input field should remain visible in the viewport above the keyboard.
**Validates: Requirements 1.1, 1.5**

Property 2: Keyboard dismissal restores scroll position
*For any* form at any scroll position, opening the keyboard and then closing it should return the form to its original scroll position.
**Validates: Requirements 1.3**

### Screenshot Prevention Properties

No universal properties - all requirements are platform-specific examples or edge cases that will be tested with specific example tests.

### Dropdown Value Display Properties

Property 3: Dropdown selection display
*For any* dropdown menu (class, branch, or department) and any valid selection value, selecting that value should immediately update the displayed value in the dropdown field to match the selection.
**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

Property 4: Dropdown persistence round-trip
*For any* form with dropdown selections, saving the form, closing it, and reopening it should display all previously selected dropdown values correctly.
**Validates: Requirements 3.4**

### Dropdown UI Enhancement Properties

Property 5: Search functionality for large lists
*For any* dropdown menu containing more than 10 options, the dropdown should provide search/filter functionality that correctly filters options based on user input.
**Validates: Requirements 4.4**

### Admin Management Properties

Property 6: Organizational item creation and availability
*For any* valid organizational item name (class, branch, or department), creating that item should persist it to the database and make it immediately available in the corresponding dropdown menus.
**Validates: Requirements 5.2, 5.4**

Property 7: Branch-class association filtering
*For any* class with associated branches, selecting that class in a form should display only the branches associated with that specific class in the branch dropdown, excluding branches from other classes.
**Validates: Requirements 5.3, 5.7**

Property 8: Organizational item updates propagate
*For any* existing organizational item (class, branch, or department), updating or deleting that item should immediately reflect the change in the database and in all dropdown menus throughout the application.
**Validates: Requirements 5.5, 5.6**

Property 9: Deletion prevention for items in use
*For any* organizational item (class, branch, or department) that is referenced by existing users or other data, attempting to delete that item should be prevented and a warning message should be displayed.
**Validates: Requirements 5.8**

Property 10: Complete organizational item display
*For any* set of organizational items in the database, the admin management interface should display all items of each type (classes, branches, departments) in the respective list views.
**Validates: Requirements 5.10**

## Error Handling

### Keyboard Management Errors

1. **Keyboard Event Listener Failures**: Gracefully degrade to standard KeyboardAvoidingView behavior
2. **Scroll Calculation Errors**: Use safe defaults (scroll to focused element with 20px padding)
3. **Platform-Specific Issues**: Detect platform and apply appropriate strategy

### Screenshot Prevention Errors

1. **Native Module Unavailable**: Log warning but don't crash app
2. **Permission Denied**: Continue app operation without screenshot prevention
3. **Platform Not Supported**: Silently skip prevention on unsupported platforms

### Dropdown Errors

1. **Invalid Selection**: Revert to previous valid selection or placeholder
2. **Data Loading Failures**: Display error state with retry option
3. **Search Failures**: Fall back to unfiltered list

### Admin Management Errors

1. **Database Connection Failures**: Display error message with retry option
2. **Validation Errors**: Show inline error messages with specific guidance
3. **Deletion Constraint Violations**: Display detailed message about dependencies
4. **Duplicate Name Errors**: Show error and suggest alternative names
5. **Permission Errors**: Redirect to appropriate screen with error message

### Error Display Strategy

- Use inline error messages for form validation
- Use toast notifications for transient errors
- Use alert dialogs for critical errors requiring user action
- Log all errors to console for debugging

## Testing Strategy

### Unit Testing

Unit tests will verify specific behaviors and edge cases:

**Keyboard Management:**
- Test keyboard event listeners attach correctly
- Test scroll calculations for various input positions
- Test platform-specific behavior switches

**Screenshot Prevention:**
- Test module initialization on each platform
- Test enable/disable functionality
- Test configuration persistence

**Dropdown Components:**
- Test value prop updates display correctly
- Test search filtering logic
- Test selection callbacks fire correctly
- Test error state rendering

**Admin Management:**
- Test CRUD service methods
- Test validation logic
- Test dependency checking
- Test RLS policy enforcement

**Testing Framework:** Jest with React Native Testing Library

### Property-Based Testing

Property-based tests will verify universal properties across many inputs:

**Testing Framework:** fast-check (already in devDependencies)

**Configuration:** Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Organization:**
- Co-locate property tests with implementation files using `.test.ts` suffix
- Tag each property test with a comment referencing the design document property
- Use format: `// Feature: admin-ui-improvements, Property N: [property description]`

**Generators:**
- Form generator: Creates forms with varying numbers of inputs
- Dropdown data generator: Creates realistic class/branch/department data
- User action generator: Simulates user interactions with forms and dropdowns
- Organizational data generator: Creates valid organizational structures

**Property Test Coverage:**
- Property 1: Generate forms with 1-20 inputs, focus each input, verify visibility
- Property 2: Generate forms at various scroll positions, test keyboard open/close cycle
- Property 3: Generate all dropdown types with various values, test selection display
- Property 4: Generate form states, test save/load cycle
- Property 5: Generate dropdowns with 11-100 options, test search functionality
- Property 6: Generate valid organizational names, test creation and availability
- Property 7: Generate class-branch associations, test filtering
- Property 8: Generate organizational items, test update/delete propagation
- Property 9: Generate items with dependencies, test deletion prevention
- Property 10: Generate organizational data sets, test complete display

### Integration Testing

Integration tests will verify component interactions:

- Test complete form submission flow with keyboard handling
- Test admin creating organizational item and it appearing in signup form
- Test branch filtering when class selection changes
- Test deletion prevention when item is in use by existing user

### Manual Testing Checklist

Due to platform-specific nature of some features:

- [ ] Test keyboard behavior on physical Android device
- [ ] Test keyboard behavior on physical iOS device
- [ ] Test screenshot prevention on Android
- [ ] Test screenshot prevention on iOS
- [ ] Test screen recording prevention on both platforms
- [ ] Test dropdown UI on various screen sizes
- [ ] Test admin management workflow end-to-end

## Implementation Phases

### Phase 1: Foundation (Keyboard & Screenshot Prevention)
- Implement KeyboardAwareScrollView wrapper
- Implement screenshot prevention native modules
- Update existing forms to use new keyboard wrapper
- Test on both platforms

### Phase 2: Dropdown Enhancement
- Create EnhancedPicker component
- Implement search/filter functionality
- Fix value display bugs in existing dropdowns
- Update all dropdown usages

### Phase 3: Database Migration
- Create database tables for organizational data
- Write migration scripts
- Implement RLS policies
- Migrate existing hardcoded data

### Phase 4: Admin Management UI
- Create OrganizationManager screen
- Implement CRUD interfaces for each entity type
- Add navigation from admin dashboard
- Implement dependency checking

### Phase 5: Integration & Testing
- Update all forms to use database-driven dropdowns
- Implement branch filtering based on class selection
- Write comprehensive tests
- Perform manual testing on devices

## Security Considerations

### Screenshot Prevention
- Implement on both platforms to prevent data leakage
- Handle gracefully on platforms where not supported
- Document limitations (e.g., screen recording apps with special permissions)

### Admin Management
- Enforce admin-only access through RLS policies
- Validate all inputs server-side
- Prevent SQL injection through parameterized queries
- Audit log all organizational changes
- Implement rate limiting on CRUD operations

### Data Validation
- Sanitize all user inputs
- Enforce unique constraints at database level
- Validate relationships before deletion
- Prevent orphaned records through foreign key constraints

## Performance Considerations

### Keyboard Management
- Debounce scroll calculations (50ms)
- Use native driver for animations where possible
- Minimize re-renders during keyboard events

### Dropdown Components
- Virtualize long lists (>50 items)
- Debounce search input (300ms)
- Cache filtered results
- Lazy load dropdown data

### Admin Management
- Paginate organizational item lists
- Cache dropdown data with 5-minute TTL
- Batch database operations where possible
- Optimize queries with proper indexes

### Database Optimization
- Add indexes on name columns for search
- Add indexes on foreign keys
- Use database-level caching
- Implement connection pooling

## Accessibility

### Keyboard Management
- Ensure focus indicators remain visible
- Support keyboard navigation between fields
- Announce keyboard state changes to screen readers

### Dropdown Components
- Provide proper ARIA labels
- Support keyboard navigation (arrow keys, enter, escape)
- Announce selection changes to screen readers
- Ensure sufficient color contrast

### Admin Management
- Provide descriptive labels for all actions
- Support keyboard-only navigation
- Announce success/error states
- Ensure touch targets are at least 44x44 points

## Monitoring and Analytics

### Metrics to Track
- Keyboard-related scroll adjustments per session
- Screenshot prevention activation rate
- Dropdown interaction patterns
- Admin CRUD operation frequency
- Error rates for each feature
- Performance metrics (render times, API latency)

### Error Tracking
- Log all screenshot prevention failures
- Track keyboard handling errors
- Monitor dropdown state inconsistencies
- Alert on admin operation failures

## Future Enhancements

### Keyboard Management
- Predictive scroll positioning based on input type
- Custom keyboard toolbar with next/previous buttons
- Smart field ordering suggestions

### Dropdown Components
- Multi-select support
- Grouped options
- Custom option rendering
- Async data loading with infinite scroll

### Admin Management
- Bulk import/export of organizational data
- Organizational hierarchy visualization
- Change history and rollback
- Template management for common structures
- Advanced filtering and sorting

## Dependencies

### New Dependencies Required
- `expo-screen-capture` - For screenshot prevention (if available)
- `react-native-keyboard-aware-scroll-view` - For enhanced keyboard handling (alternative to custom implementation)

### Existing Dependencies Used
- `@react-native-picker/picker` - Base picker component
- `@supabase/supabase-js` - Database operations
- `react-native-paper` - UI components
- `fast-check` - Property-based testing

## Rollback Strategy

### Feature Flags
Implement feature flags for each major component:
- `ENABLE_KEYBOARD_AWARE_SCROLL` - Can disable if issues arise
- `ENABLE_SCREENSHOT_PREVENTION` - Can disable per platform
- `ENABLE_ENHANCED_DROPDOWNS` - Can revert to basic pickers
- `ENABLE_ADMIN_MANAGEMENT` - Can disable admin CRUD UI

### Database Rollback
- Maintain migration scripts with down migrations
- Keep constants.ts as fallback data source
- Implement feature flag to switch between database and hardcoded data

### Monitoring
- Track error rates for each new feature
- Set up alerts for abnormal behavior
- Implement automatic rollback triggers for critical failures
