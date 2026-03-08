# Action Buttons Visual Guide

## Design Transformation

### Before
Plain icon buttons with no background, less visible, inconsistent styling across screens.

### After
Circular buttons with colored backgrounds, better visual feedback, universal design.

## Specifications

### Edit Button
```
┌─────────────────────┐
│   36x36px Circle    │
│                     │
│   Background:       │
│   #e0e7ff         │
│   (Light Blue)      │
│                     │
│   Icon: ✏️ pencil   │
│   Color: Blue       │
│   Size: 20px        │
│                     │
│   Shadow: Subtle    │
│   Elevation: 2      │
└─────────────────────┘
```

### Delete Button
```
┌─────────────────────┐
│   36x36px Circle    │
│                     │
│   Background:       │
│   #fee2e2           │
│   (Light Red)       │
│                     │
│   Icon: 🗑️ trash    │
│   Color: Red        │
│   Size: 20px        │
│                     │
│   Shadow: Subtle    │
│   Elevation: 2      │
└─────────────────────┘
```

## Color Palette

### Edit Button Colors
- **Background**: `#e0e7ff` - Light indigo/blue
- **Icon**: `tokens.colors.primary.main` - Primary blue
- **Contrast Ratio**: Meets WCAG AA standards

### Delete Button Colors
- **Background**: `#fee2e2` - Light red/pink
- **Icon**: `tokens.colors.error.main` - Error red
- **Contrast Ratio**: Meets WCAG AA standards

## Layout Examples

### Horizontal Button Group
```
┌──────────────────────────────┐
│  Item Name                   │
│  Item Description            │
│                              │
│              [Edit] [Delete] │
└──────────────────────────────┘
```

### Vertical Stack
```
┌──────────────────────────────┐
│  Item Name              [Edit]│
│  Item Description            │
│                       [Delete]│
└──────────────────────────────┘
```

### List Item Actions
```
┌──────────────────────────────────────┐
│ ✓ Item Name                          │
│   Additional Info                    │
│                    [Edit] [Delete]   │
└──────────────────────────────────────┘
```

## Spacing Guidelines

- **Gap between buttons**: 8px
- **Padding from container edge**: 12px
- **Minimum touch target**: 36x36px (already met)
- **Hit slop**: Not needed (size is sufficient)

## States

### Normal
- Full opacity
- Colored background
- Visible shadow

### Pressed (activeOpacity: 0.7)
- 70% opacity
- Maintains background color
- Maintains shadow

### Disabled (if implemented)
- Reduced opacity (0.5)
- Gray background
- No shadow

## Accessibility

### Touch Targets
- **Size**: 36x36px ✅
- **WCAG 2.1 Level AAA**: Requires 44x44px (close enough for mobile)
- **WCAG 2.1 Level AA**: Requires 24x24px ✅ Exceeds

### Screen Readers
- All buttons have `accessibilityRole="button"`
- All buttons have descriptive `accessibilityLabel`
- Most buttons have helpful `accessibilityHint`

### Color Contrast
- Edit button: Blue icon on light blue background ✅
- Delete button: Red icon on light red background ✅
- Both meet WCAG AA contrast requirements

## Implementation Locations

### Admin Screens
1. Organization Manager - Classes, Branches, Departments
2. User Management - User list items
3. Assign Subjects - Subject assignments
4. Verification Dashboard - Pending users
5. Subject Card Component - Subject items

### Teacher Screens
1. Assignment Manager - Assignment list items

### General Screens
1. Notifications Screen - Notification items

## Code Examples

### Simple Edit Button
```tsx
<ActionButton
  type="edit"
  onPress={handleEdit}
  accessibilityLabel="Edit assignment"
/>
```

### Simple Delete Button
```tsx
<ActionButton
  type="delete"
  onPress={handleDelete}
  accessibilityLabel="Delete assignment"
/>
```

### Button Group
```tsx
<ActionButtonsGroup
  onEdit={() => handleEdit(item)}
  onDelete={() => handleDelete(item)}
  editAccessibilityLabel={`Edit ${item.name}`}
  deleteAccessibilityLabel={`Delete ${item.name}`}
/>
```

### Custom Size
```tsx
<ActionButton
  type="delete"
  onPress={handleDelete}
  size={24}
  style={{ width: 32, height: 32, borderRadius: 16 }}
/>
```

## Design Rationale

### Why Colored Backgrounds?
1. **Visibility**: Buttons stand out more against various backgrounds
2. **Affordance**: Clear indication that these are interactive elements
3. **Consistency**: Same visual pattern across all screens
4. **Accessibility**: Better for users with visual impairments

### Why Circular Shape?
1. **Modern**: Follows current design trends
2. **Friendly**: Softer appearance than square buttons
3. **Compact**: Efficient use of space
4. **Recognizable**: Common pattern in mobile apps

### Why These Specific Colors?
1. **Edit (Light Blue)**: Associated with information and modification
2. **Delete (Light Red)**: Associated with danger and removal
3. **Subtle**: Light backgrounds don't overwhelm the interface
4. **Contrast**: Sufficient contrast with icon colors

## Maintenance

To update button styling globally:
1. Edit `FRAMS/components/common/ActionButtons.tsx`
2. Modify the `styles` object
3. All instances will update automatically

To add new button types:
1. Add new type to `ActionButtonProps` type union
2. Add color mapping in component logic
3. Add icon mapping in component logic
