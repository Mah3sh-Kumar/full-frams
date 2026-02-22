# Design Document

## Overview

This design addresses TypeScript compilation errors in the FRAMS application by fixing type inconsistencies in the design system tokens, component prop definitions, and animated value handling. The solution ensures type safety throughout the application while maintaining backward compatibility with existing code.

The errors fall into four main categories:
1. **Border token access patterns** - Code accessing `tokens.borders.medium` instead of `tokens.borders.radius.medium`
2. **Color token structure** - Missing `background` property in the color palette
3. **Gradient type safety** - Return type mismatch for gradient color arrays
4. **Component prop definitions** - Missing or incorrect prop type definitions
5. **Animated value access** - Unsafe access to private `_value` property

## Architecture

The fix follows a layered approach:

```
┌─────────────────────────────────────┐
│     Application Components          │
│  (Screens, UI Components)           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Design System Layer             │
│  - Token Definitions                │
│  - Type Exports                     │
│  - Component Props                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     TypeScript Type System          │
│  - Compile-time validation          │
│  - Type inference                   │
└─────────────────────────────────────┘
```

## Components and Interfaces

### 1. Border Token Structure

**Current Issue**: Code accesses `tokens.borders.medium` but the structure is `tokens.borders.radius.medium`.

**Solution**: Add convenience properties at the top level of `BorderTokens` interface while maintaining the nested structure for backward compatibility.

```typescript
export interface BorderTokens {
  radius: BorderRadiusTokens;
  width: BorderWidthTokens;
  // Convenience accessors
  small: number;
  medium: number;
  large: number;
  full: number;
}
```

### 2. Color Token Structure

**Current Issue**: Code accesses `tokens.colors.background.main` but `background` doesn't exist in `ColorPalette`.

**Solution**: Add a `background` property to the `ColorPalette` interface that provides theme-aware background colors.

```typescript
export interface ColorPalette {
  primary: ColorToken;
  accent: ColorToken;
  success: ColorToken;
  warning: ColorToken;
  error: ColorToken;
  info: ColorToken;
  neutral: NeutralColors;
  roles: RoleColors;
  theme: ThemeColors;
  background: ColorToken;  // New property
}
```

### 3. Gradient Type Safety

**Current Issue**: `getGradientColors()` returns `string[]` but `LinearGradient` expects `readonly [ColorValue, ColorValue, ...ColorValue[]]`.

**Solution**: Update the return type to be a tuple with at least two elements.

```typescript
type GradientColors = readonly [string, string, ...string[]];

const getGradientColors = (): GradientColors => {
  // Implementation returns tuple type
  return customColors as GradientColors || tokens.colors.primary.gradient;
};
```

### 4. Component Prop Definitions

**LoadingSpinner Issue**: Component accepts `text` prop but TypeScript definition is missing it.

**Solution**: The prop is already defined correctly. The issue is in the usage - need to verify the import path.

**EmptyState Issue**: Component requires `title` prop but it's not being provided.

**Solution**: Ensure all usages provide the required `title` prop.

### 5. Animated Value Access

**Current Issue**: Code accesses `indicatorWidth._value` which is a private property.

**Solution**: Use a flag or alternative approach to track initialization state without accessing private properties.

```typescript
const isInitialized = useRef(false);

useEffect(() => {
  const activeTabLayout = tabLayouts.current[activeTab];
  if (activeTabLayout) {
    if (!isInitialized.current) {
      // Initialize without animation
      indicatorPosition.setValue(activeTabLayout.x);
      indicatorWidth.setValue(activeTabLayout.width);
      isInitialized.current = true;
    } else {
      // Animate subsequent changes
      Animated.parallel([...]).start();
    }
  }
}, [activeTab]);
```

### 6. Export Conflict Resolution

**Current Issue**: Duplicate export of `DesignTokens` type.

**Solution**: Remove the duplicate export statement in the type exports section.

## Data Models

### BorderTokens Type

```typescript
export interface BorderRadiusTokens {
  small: number;
  medium: number;
  large: number;
  full: number;
}

export interface BorderWidthTokens {
  thin: number;
  medium: number;
  thick: number;
}

export interface BorderTokens {
  radius: BorderRadiusTokens;
  width: BorderWidthTokens;
  // Convenience accessors for backward compatibility
  small: number;
  medium: number;
  large: number;
  full: number;
}
```

### ColorPalette Type

```typescript
export interface ColorPalette {
  primary: ColorToken;
  accent: ColorToken;
  success: ColorToken;
  warning: ColorToken;
  error: ColorToken;
  info: ColorToken;
  neutral: NeutralColors;
  roles: RoleColors;
  theme: ThemeColors;
  background: ColorToken;
}
```

### GradientColors Type

```typescript
type GradientColors = readonly [string, string, ...string[]];
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


Property 1: Border tokens provide convenience accessors
*For any* border token access pattern using `tokens.borders.medium` or `tokens.borders.full`, the system should provide valid numeric border radius values
**Validates: Requirements 1.1**

Property 2: Color palette includes background token
*For any* color token access, when accessing `tokens.colors.background.main`, the system should return a valid color string
**Validates: Requirements 1.2**

Property 3: TypeScript compilation succeeds
*For any* component using design tokens, the TypeScript compiler should successfully validate all token accesses without type errors
**Validates: Requirements 1.3, 1.4, 2.3, 4.3**

Property 4: Gradient colors return tuple type
*For any* gradient variant, the getGradientColors function should return an array with at least two color values
**Validates: Requirements 2.2**

Property 5: Animated values use type-safe access
*For any* animated value usage, the code should not access private `_value` properties
**Validates: Requirements 3.1, 3.2**

Property 6: LoadingSpinner accepts text prop
*For any* LoadingSpinner component usage, the TypeScript interface should accept an optional `text` property of type string
**Validates: Requirements 4.1**

Property 7: EmptyState requires title prop
*For any* EmptyState component usage, the TypeScript interface should require a `title` property
**Validates: Requirements 4.2**

Property 8: Optional props use default values
*For any* component with optional props, when those props are omitted, the component should render successfully using default values
**Validates: Requirements 4.4**

## Error Handling

### Type Errors

All type errors should be caught at compile time by TypeScript. The fixes ensure:

1. **Border token access**: Both nested (`tokens.borders.radius.medium`) and flat (`tokens.borders.medium`) access patterns work
2. **Color token access**: Background colors are available through the standard token structure
3. **Gradient types**: Color arrays are properly typed as tuples
4. **Component props**: All prop interfaces are complete and accurate

### Runtime Errors

The fixes prevent potential runtime errors:

1. **Undefined property access**: Ensuring all accessed properties exist in the type definitions
2. **Type mismatches**: Ensuring values match expected types (e.g., gradient color tuples)
3. **Missing required props**: TypeScript enforces required props at compile time

### Migration Strategy

To maintain backward compatibility:

1. **Border tokens**: Add convenience properties without removing nested structure
2. **Color tokens**: Add new `background` property without modifying existing structure
3. **Component props**: Update type definitions without changing component implementation
4. **Animated values**: Refactor to use ref flags instead of private property access

## Testing Strategy

### Unit Testing

Unit tests will verify:

1. **Token structure**: Border and color tokens have expected properties
2. **Component props**: Components accept correct prop types
3. **Gradient colors**: getGradientColors returns valid color arrays
4. **Default values**: Components work with optional props omitted

Example unit tests:
```typescript
describe('Design Tokens', () => {
  it('should provide border convenience accessors', () => {
    expect(tokens.borders.medium).toBe(14);
    expect(tokens.borders.full).toBe(9999);
  });

  it('should provide background color token', () => {
    expect(tokens.colors.background).toBeDefined();
    expect(tokens.colors.background.main).toBeDefined();
  });
});

describe('GradientBackground', () => {
  it('should return gradient colors as tuple', () => {
    const colors = getGradientColors('primary');
    expect(colors.length).toBeGreaterThanOrEqual(2);
  });
});
```

### Property-Based Testing

Property-based tests will verify universal properties using **fast-check** (JavaScript/TypeScript PBT library):

1. **Gradient color tuples**: For any variant, gradient colors have at least 2 elements
2. **Default prop values**: For any component with optional props, omitting them doesn't cause errors

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with the format: `**Feature: typescript-type-fixes, Property {number}: {property_text}**`
- Reference the corresponding correctness property from this design document

### Type Testing

TypeScript compilation itself serves as a test:
- All files must compile without errors
- Type checking validates token access patterns
- Component prop usage is validated at compile time

### Integration Testing

Integration tests will verify:
1. Components render correctly with design tokens
2. Gradient backgrounds display properly
3. Animated components work without accessing private properties
4. All screen components compile and render

## Implementation Notes

### Priority Order

1. **Fix border tokens** - Highest impact, affects multiple screens
2. **Fix color tokens** - Required for teacher/admin screens
3. **Fix gradient types** - Affects GradientBackground component
4. **Fix component props** - Affects specific component usages
5. **Fix animated values** - Affects TabBar component
6. **Fix export conflicts** - Clean up token exports

### Backward Compatibility

All changes maintain backward compatibility:
- Existing code using `tokens.borders.radius.medium` continues to work
- New code can use `tokens.borders.medium` for convenience
- No breaking changes to component APIs

### Testing Requirements

- TypeScript compilation must succeed with `npx tsc --noEmit`
- All existing tests must continue to pass
- New tests verify the fixes work correctly
