# Teacher Screens UI Audit Report

## Design System Standards

### Typography Scale
- **Display**: 32px / line-height 42 / weight 700
- **H1**: 26px / line-height 34 / weight 700
- **H2**: 22px / line-height 30 / weight 600
- **H3**: 18px / line-height 26 / weight 600
- **Body**: 15px / line-height 24 / weight 400
- **Caption**: 12px / line-height 20 / weight 400

### Color Opacity Standards
- **Primary Text**: 100% opacity (#0f172a in light mode)
- **Secondary Text**: 100% opacity (#64748b in light mode)
- **Disabled Text**: 38% opacity
- **Borders**: 100% opacity (#e2e8f0 in light mode)
- **Backgrounds**: Use defined color tokens, avoid manual opacity

---

## Issues Found

### 1. TeacherDashboard.tsx

#### Issues:
1. **Line 241**: `welcomeSubtitle` uses `opacity: 0.95` - Should use full opacity with proper color
2. **Line 228**: `welcomeTitle` fontSize 28 - Not in design system (should be 26 for H1)
3. **Line 236**: `welcomeSubtitle` fontSize 16 - Should be 15 (body) or 18 (H3)
4. **Line 247**: `iconButton` uses `rgba(255, 255, 255, 0.2)` and `rgba(255, 255, 255, 0.3)` - Should use defined color tokens
5. **Line 265**: `sectionTitle` fontSize 20 - Not in design system (should be 22 for H2)
6. **Line 283**: `taskTitle` fontSize 18 - Should use H3 (18px is correct but needs proper token)
7. **Line 288**: `taskDescription` fontSize 14 - Should be 15 (body) or 12 (caption)
8. **Line 310**: `statLabel` fontSize 12 - Correct (caption) but needs verification
9. **Line 316**: `statValue` fontSize 36 - Not in design system (too large)

### 2. AssignedSubjects.tsx

#### Issues:
1. **Line 73**: `title` fontSize 28 - Should be 26 (H1)
2. **Line 78**: `subtitle` fontSize 16 - Should be 15 (body)
3. **Line 103**: `subjectName` fontSize 18 - Correct (H3)
4. **Line 117**: `subjectCode` fontSize 14 - Should be 15 (body) or 12 (caption)
5. **Line 127**: `detailText` fontSize 14 - Should be 15 (body) or 12 (caption)
6. **Line 111**: `primaryText` fontSize 11 - Too small, should be 12 (caption)

### 3. AssignmentManager.tsx

#### Issues:
1. Multiple hardcoded opacity values in status badges
2. Inconsistent fontSize usage throughout
3. **Line 287**: `statLabel` uses `caption.fontSize` but should verify consistency
4. **Line 293**: `statValue` uses `h2.fontSize` - May be too large for stat cards
5. **Line 308**: `statusText` uses `caption.fontSize` - Correct
6. **Line 340**: `assignmentTitle` uses `h3.fontSize` - Correct
7. **Line 346**: `assignmentSubtext` uses `caption.fontSize` - Correct

### 4. AttendanceManager.tsx

#### Issues:
1. **Line 434**: `compactName` fontSize 14 - Should be 15 (body)
2. **Line 439**: `compactEnrollment` fontSize 11 - Should be 12 (caption)
3. **Line 485**: Inline fontSize 11 - Should be 12 (caption)
4. **Line 367**: `analyticsValue` uses `h3.fontSize` - Correct
5. **Line 372**: `analyticsLabel` uses `caption.fontSize` - Correct
6. **Line 328**: `dateText` uses `body.fontSize` - Correct
7. **Line 348**: `statValue` uses `h2.fontSize` - May be too large
8. **Line 353**: `statLabel` uses `caption.fontSize` - Correct

### 5. MarksReviewManager.tsx

#### Issues:
1. All typography appears to use design tokens correctly
2. **Line 145**: `statValue` uses `h2.fontSize` - Consistent with other screens
3. **Line 150**: `statLabel` uses `caption.fontSize` - Correct
4. **Line 179**: `studentName` uses `h3.fontSize` - Correct
5. **Line 184**: `enrollmentText` uses `caption.fontSize` - Correct
6. **Line 189**: `assignmentText` uses `body.fontSize` - Correct
7. **Line 194**: `subjectText` uses `caption.fontSize` - Correct
8. **Line 203**: `scoreText` uses `body.fontSize` - Correct
9. **Line 208**: `percentageText` uses `caption.fontSize` - Correct

---

## Recommendations

### Critical Fixes:
1. Remove all manual opacity values - use proper color tokens
2. Standardize all font sizes to design system scale
3. Replace hardcoded rgba() colors with design tokens
4. Ensure consistent spacing using design tokens

### Font Size Mapping:
- **Page Titles**: H1 (26px)
- **Section Titles**: H2 (22px)
- **Card Titles**: H3 (18px)
- **Body Text**: Body (15px)
- **Labels/Metadata**: Caption (12px)
- **Stat Values**: H2 (22px) or H3 (18px) depending on prominence

### Color Usage:
- **Primary Text**: `getTextColor()` - no opacity
- **Secondary Text**: `getTextSecondaryColor()` - no opacity
- **Backgrounds**: Use `getSurfaceColor()`, `getBackgroundColor()`
- **Status Colors**: Use `tokens.colors.success.main`, etc.

---

## Files to Update:
1. ✅ TeacherDashboard.tsx - Multiple issues
2. ✅ AssignedSubjects.tsx - Font size issues
3. ✅ AssignmentManager.tsx - Minor issues
4. ✅ AttendanceManager.tsx - Font size issues
5. ✅ MarksReviewManager.tsx - Mostly correct
