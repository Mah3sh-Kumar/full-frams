# Subject Management Design Document

## Overview

The Subject Management feature adds a fourth tab to the existing OrganizationManager screen, providing administrators with a comprehensive interface to manage academic subjects. This feature enables full CRUD operations on subjects, which represent courses or academic disciplines taught within classes, with many-to-many relationships to teachers.

### Purpose

Subjects are core entities in the academic system that:
- Link multiple teachers to the courses they teach through a junction table
- Associate courses with specific class levels
- Enable students to access subjects through their class assignments
- Enable attendance tracking and assignment management per subject
- Provide organizational structure for academic activities

### Key Features

- View all subjects with associated class and teacher information
- Search and filter subjects by name or code
- Create new subjects with validation and multi-teacher assignment
- Edit existing subject information and teacher assignments
- Delete subjects with dependency checking
- Many-to-many teacher-subject relationships via junction table
- Class-based student access to subjects
- Integrated as fourth tab in OrganizationManager
- Pull-to-refresh for data synchronization

### User Roles

- **Admin**: Full CRUD access to all subjects via OrganizationManager
- **Teacher**: Can view all subjects they teach (via junction table)
- **Student**: Access subjects through their class assignment (read-only)


## Architecture

### High-Level Architecture

The Subject Management feature integrates into the existing OrganizationManager screen as a fourth tab, following the established FRAMS architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  OrganizationManager Screen (screens/admin/)           │ │
│  │  - Tab navigation (Classes, Branches, Depts, Subjects)│ │
│  │  - Subjects tab with list view                         │ │
│  │  - Search and filter UI                                │ │
│  │  - Bottom sheet modal for create/edit                  │ │
│  │  - Confirmation dialogs                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  subjects.ts (lib/)                                    │ │
│  │  - getSubjects(includeInactive?)                       │ │
│  │  - createSubject(name, code, classId, teacherIds[])    │ │
│  │  - updateSubject(id, updates, teacherIds[])            │ │
│  │  - deleteSubject(id, name)                             │ │
│  │  - assignTeachersToSubject(subjectId, teacherIds[])    │ │
│  │  - removeTeachersFromSubject(subjectId, teacherIds[])  │ │
│  │  - Validation logic                                    │ │
│  │  - Error mapping                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Access Layer                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Supabase Client (lib/supabase.ts)                     │ │
│  │  - Database queries with RLS                           │ │
│  │  - Junction table management                           │ │
│  │  - Real-time subscriptions (future)                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Supabase PostgreSQL                                   │ │
│  │  - subjects table                                      │ │
│  │  - subject_teachers table (junction)                   │ │
│  │  - classes table (FK reference)                        │ │
│  │  - users table (FK reference)                          │ │
│  │  - RLS policies                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Flow

```
AdminDashboard
    │
    ├─> OrganizationManager (existing screen)
    │       │
    │       ├─> Classes Tab (existing)
    │       ├─> Branches Tab (existing)
    │       ├─> Departments Tab (existing)
    │       └─> Subjects Tab (NEW)
    │               │
    │               ├─> Subject List View
    │               │       │
    │               │       ├─> Create Subject (bottom sheet)
    │               │       ├─> Edit Subject (bottom sheet)
    │               │       └─> Delete Subject (confirmation dialog)
    │               │
    │               └─> Search/Filter Controls
    │
    └─> Other Admin Screens
```


## Components and Interfaces

### Screen Components

#### OrganizationManager (Modified Existing Screen)

**Location**: `FRAMS/screens/admin/OrganizationManager.tsx`

**Modifications**:
- Add "subjects" as fourth tab type
- Add subjects state management
- Add subject-specific data fetching
- Add subject form rendering
- Update statistics to include subject count

**Additional State Management**:
```typescript
const [subjects, setSubjects] = useState<SubjectItem[]>([]);
// Existing states for classes, branches, departments remain
```

**Key Methods** (additions):
- `fetchSubjects()`: Load subjects with teachers from database
- `handleSubjectSubmit()`: Create or update subject with teacher assignments
- `handleSubjectDelete()`: Delete subject and junction table entries

#### SubjectForm (Form Component)

**Location**: `FRAMS/components/admin/subjects/SubjectForm.tsx`

**Responsibilities**:
- Render form fields for subject creation/editing
- Handle form validation
- Manage form state
- Load dropdown data (classes, teachers)
- Support multi-select for teacher assignment
- Submit form data to parent

**Props**:
```typescript
interface SubjectFormProps {
  onSubmit: (name: string, code: string, classId: string, teacherIds: string[]) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  initialValues?: SubjectItem & { teacher_ids?: string[] };
}
```

**State Management**:
```typescript
const [name, setName] = useState('');
const [code, setCode] = useState('');
const [classId, setClassId] = useState('');
const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
const [classes, setClasses] = useState<ClassItem[]>([]);
const [teachers, setTeachers] = useState<TeacherItem[]>([]);
const [errors, setErrors] = useState<Record<string, string>>({});
```

#### SubjectCard (List Item Component)

**Location**: `FRAMS/components/admin/subjects/SubjectCard.tsx`

**Responsibilities**:
- Display subject information in card format
- Show associated class and all assigned teachers
- Render action buttons (edit, delete)
- Display active status indicator

**Props**:
```typescript
interface SubjectCardProps {
  subject: SubjectItem & { teachers?: TeacherInfo[] };
  onEdit: (subject: SubjectItem) => void;
  onDelete: (subject: SubjectItem) => void;
  showActions: boolean; // false for non-admin roles
}

interface TeacherInfo {
  id: string;
  full_name: string;
}
```

### Reusable Components

The feature will leverage existing FRAMS design system components:

- **LoadingSpinner**: Loading states during data fetch
- **EmptyState**: Empty list message
- **ConfirmDialog**: Delete confirmation
- **Input**: Text input fields
- **EnhancedPicker**: Dropdown selectors for class
- **MultiSelect**: Multi-select interface for teacher assignment (NEW or custom implementation)
- **Button**: Action buttons
- **Card**: Base card component for subject items


## Data Models

### SubjectItem Interface

```typescript
export interface SubjectItem {
  id: string;                    // UUID primary key
  name: string;                  // Subject name (e.g., "Mathematics")
  code: string;                  // Subject code (e.g., "math_101")
  class_id: string;              // Foreign key to classes table
  is_active: boolean;            // Active status flag
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  
  // Joined data (from queries)
  class_name?: string;           // From classes.name
  teachers?: TeacherInfo[];      // From subject_teachers join
}

export interface TeacherInfo {
  id: string;                    // Teacher user ID
  full_name: string;             // Teacher name
}

export interface SubjectTeacherItem {
  id: string;                    // UUID primary key
  subject_id: string;            // Foreign key to subjects table
  teacher_id: string;            // Foreign key to users table
  created_at: string;            // ISO timestamp
}
```

### Database Schema

#### subjects Table

```sql
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_subjects_class_id ON public.subjects(class_id);
CREATE INDEX idx_subjects_code ON public.subjects(code);
CREATE INDEX idx_subjects_is_active ON public.subjects(is_active);
```

#### subject_teachers Table (Junction Table)

```sql
CREATE TABLE public.subject_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subject_id, teacher_id)
);

-- Indexes for performance
CREATE INDEX idx_subject_teachers_subject_id ON public.subject_teachers(subject_id);
CREATE INDEX idx_subject_teachers_teacher_id ON public.subject_teachers(teacher_id);
```

#### Related Tables

**classes Table** (existing):
- `id`: UUID primary key
- `name`: Text (e.g., "Class 10")
- `value`: Text (e.g., "10")
- `is_active`: Boolean
- Students are linked to classes, and subjects are linked to classes, so students inherit subjects through their class

**users Table** (existing):
- `id`: UUID primary key
- `full_name`: Text
- `email`: Text
- `role`: Enum ('admin', 'teacher', 'student')
- `class_id`: UUID (for students - links to classes table)
- `is_verified`: Boolean
- `class_id`: UUID (for students)

### Data Relationships

```
subjects
  └─> class_id → classes.id (RESTRICT on delete)

subject_teachers (junction table)
  ├─> subject_id → subjects.id (CASCADE on delete)
  └─> teacher_id → users.id (CASCADE on delete)

users (students)
  └─> class_id → classes.id
      └─> subjects filtered by class_id

attendance (future)
  └─> subject_id → subjects.id (RESTRICT on delete)

assignments (future)
  └─> subject_id → subjects.id (RESTRICT on delete)
```

### Validation Rules

**Subject Name**:
- Required: Yes
- Min length: 2 characters
- Max length: 100 characters
- Pattern: Any printable characters
- Trimmed: Yes

**Subject Code**:
- Required: Yes
- Pattern: `^[a-z0-9_]+$` (lowercase letters, numbers, underscores only)
- Unique: Yes (enforced by database)
- Trimmed: Yes

**Class ID**:
- Required: Yes
- Must reference existing active class

**Teacher IDs**:
- Required: Yes (at least one teacher)
- Must reference existing users with role='teacher'
- Supports multiple teachers via junction table (lowercase letters, numbers, underscores only)
- Unique: Yes (enforced by database)
- Trimmed: Yes

**Class ID**:
- Required: Yes
- Must reference existing active class

**Teacher IDs** (array):
- Required: Yes (at least one teacher must be assigned)
- Each ID must reference existing user with role='teacher'
- Multiple teachers can be assigned to a single subject


## API and Database Interactions

### Data Access Functions

All database operations are encapsulated in `lib/subjects.ts` following the established pattern from `lib/organization.ts`.

#### getSubjects

```typescript
/**
 * Get subjects from the database with their assigned teachers
 * @param includeInactive - Whether to include inactive subjects (admin only)
 * @returns Promise with subjects array (including teachers) and error
 */
export async function getSubjects(
  includeInactive: boolean = false
): Promise<{ data: (SubjectItem & { teachers: TeacherInfo[] })[] | null; error: string | null }>;
```

**Query**:
```typescript
let query = supabase
  .from('subjects')
  .select(`
    id,
    name,
    code,
    class_id,
    is_active,
    created_at,
    updated_at,
    classes:class_id (
      name
    ),
    subject_teachers (
      teacher:teacher_id (
        id,
        full_name
      )
    )
  `)
  .order('name', { ascending: true });

if (!includeInactive) {
  query = query.eq('is_active', true);
}

// Transform the response to flatten teacher data
const { data, error } = await query;
if (data) {
  return {
    data: data.map(subject => ({
      ...subject,
      class_name: subject.classes?.name,
      teachers: subject.subject_teachers?.map(st => st.teacher) || []
    })),
    error: null
  };
}
```

#### getSubjectsByTeacher

```typescript
/**
 * Get subjects taught by a specific teacher
 * @param teacherId - UUID of the teacher
 * @returns Promise with subjects array and error
 */
export async function getSubjectsByTeacher(
  teacherId: string
): Promise<{ data: SubjectItem[] | null; error: string | null }>;
```

**Query**:
```typescript
const { data, error } = await supabase
  .from('subject_teachers')
  .select(`
    subject:subject_id (
      id,
      name,
      code,
      class_id,
      is_active,
      classes:class_id (
        name
      )
    )
  `)
  .eq('teacher_id', teacherId);
```

#### getSubjectsByClass

```typescript
/**
 * Get subjects for a specific class (for student access)
 * @param classId - UUID of the class
 * @returns Promise with subjects array (including teachers) and error
 */
export async function getSubjectsByClass(
  classId: string
): Promise<{ data: (SubjectItem & { teachers: TeacherInfo[] })[] | null; error: string | null }>;
```

**Query**:
```typescript
const { data, error } = await supabase
  .from('subjects')
  .select(`
    id,
    name,
    code,
    class_id,
    is_active,
    classes:class_id (
      name
    ),
    subject_teachers (
      teacher:teacher_id (
        id,
        full_name
      )
    )
  `)
  .eq('class_id', classId)
  .eq('is_active', true);
```

#### createSubject

```typescript
/**
 * Create a new subject with teacher assignments
 * @param name - Subject name
 * @param code - Subject code (lowercase with underscores)
 * @param classId - UUID of the class
 * @param teacherIds - Array of teacher UUIDs
 * @returns Promise with created subject and error
 */
export async function createSubject(
  name: string,
  code: string,
  classId: string,
  teacherIds: string[]
): Promise<{ data: SubjectItem | null; error: string | null }>;
```

**Validation Steps**:
1. Validate name (length, not empty)
2. Validate code (pattern, not empty)
3. Validate at least one teacher selected
4. Trim inputs
5. Insert into subjects table
6. Insert into subject_teachers junction table
7. Handle unique constraint violations

**Query**:
```typescript
// Step 1: Create subject
const { data: subject, error: subjectError } = await supabase
  .from('subjects')
  .insert({
    name: name.trim(),
    code: code.trim().toLowerCase(),
    class_id: classId,
    is_active: true,
  })
  .select()
  .single();

if (subjectError) return { data: null, error: getSubjectErrorMessage(subjectError) };

// Step 2: Create teacher assignments
const teacherAssignments = teacherIds.map(teacherId => ({
  subject_id: subject.id,
  teacher_id: teacherId
}));

const { error: assignmentError } = await supabase
  .from('subject_teachers')
  .insert(teacherAssignments);

if (assignmentError) {
  // Rollback: delete the subject
  await supabase.from('subjects').delete().eq('id', subject.id);
  return { data: null, error: getSubjectErrorMessage(assignmentError) };
}

return { data: subject, error: null };
```

#### updateSubject

```typescript
/**
 * Update an existing subject and its teacher assignments
 * @param id - UUID of the subject
 * @param updates - Fields to update
 * @param teacherIds - Array of teacher UUIDs (replaces existing assignments)
 * @returns Promise with updated subject and error
 */
export async function updateSubject(
  id: string,
  updates: {
    name?: string;
    code?: string;
    class_id?: string;
    is_active?: boolean;
  },
  teacherIds?: string[]
): Promise<{ data: SubjectItem | null; error: string | null }>;
```

**Query**:
```typescript
// Step 1: Update subject
const { data: subject, error: subjectError } = await supabase
  .from('subjects')
  .update(updates)
  .eq('id', id)
  .select()
  .single();

if (subjectError) return { data: null, error: getSubjectErrorMessage(subjectError) };

// Step 2: Update teacher assignments if provided
if (teacherIds) {
  // Delete existing assignments
  await supabase
    .from('subject_teachers')
    .delete()
    .eq('subject_id', id);

  // Create new assignments
  if (teacherIds.length > 0) {
    const teacherAssignments = teacherIds.map(teacherId => ({
      subject_id: id,
      teacher_id: teacherId
    }));

    const { error: assignmentError } = await supabase
      .from('subject_teachers')
      .insert(teacherAssignments);

    if (assignmentError) {
      return { data: null, error: getSubjectErrorMessage(assignmentError) };
    }
  }
}

return { data: subject, error: null };
```

#### deleteSubject

```typescript
/**
 * Delete a subject (CASCADE deletes subject_teachers entries)
 * @param id - UUID of the subject
 * @param name - Subject name (for error messages)
 * @returns Promise with error
 */
export async function deleteSubject(
  id: string,
  name: string
): Promise<{ error: string | null }>;
```

**Query**:
```typescript
// CASCADE on subject_teachers is handled by database
const { error } = await supabase
  .from('subjects')
  .delete()
  .eq('id', id);

if (error) return { error: getSubjectErrorMessage(error) };
return { error: null };
```

### Error Handling

Error codes are mapped to user-friendly messages:

```typescript
const SUBJECT_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'A subject with this code already exists',
  '23503': 'Invalid reference - the associated class or teacher does not exist',
  '23502': 'Required field is missing',
  '23514': 'Invalid data format',
  'PGRST116': 'Subject not found',
};

function getSubjectErrorMessage(error: any): string {
  if (error?.code && SUBJECT_ERROR_MESSAGES[error.code]) {
    return SUBJECT_ERROR_MESSAGES[error.code];
  }
  
  // Handle foreign key constraint errors specifically
  if (error?.code === '23503' && error?.message?.includes('attendance')) {
    return 'Cannot delete subject: it is being used in attendance records';
  }
  if (error?.code === '23503' && error?.message?.includes('assignments')) {
    return 'Cannot delete subject: it is being used in assignments';
  }
  
  return error?.message || 'An unexpected error occurred';
}
```

### Row Level Security (RLS)

The subjects and subject_teachers tables will have RLS policies:

```sql
-- Enable RLS on subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all subjects
CREATE POLICY "Subjects Authenticated Read" ON public.subjects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins have full access
CREATE POLICY "Subjects Admin Full" ON public.subjects
  FOR ALL USING (public.is_admin());

-- Enable RLS on subject_teachers
ALTER TABLE public.subject_teachers ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all subject-teacher assignments
CREATE POLICY "Subject Teachers Authenticated Read" ON public.subject_teachers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins have full access to subject-teacher assignments
CREATE POLICY "Subject Teachers Admin Full" ON public.subject_teachers
  FOR ALL USING (public.is_admin());
```


## UI/UX Design Patterns

### Design System Integration

The Subject Management feature follows the FRAMS design system established in `lib/design-system/` and matches the existing OrganizationManager tab patterns:

**Color Scheme**:
- Admin primary color: `tokens.colors.roles.admin.main` for header
- Success: `tokens.colors.success.main` for active status
- Error: `tokens.colors.error.main` for delete actions
- Warning: `tokens.colors.warning.main` for validation errors

**Typography**:
- Header title: 28px, weight 800
- Card title: 18px, weight 600
- Body text: 16px, weight 400
- Secondary text: 14px, weight 400

**Spacing**:
- Screen padding: 24px horizontal
- Card margin: 16px bottom
- Card padding: 20px
- Button gap: 12px

### Screen Layout

#### Header Section (Shared with OrganizationManager)

```
┌─────────────────────────────────────────────────────────┐
│  [Admin Color Background]                               │
│                                                          │
│  Organization Manager                  [+]              │
│  Manage classes, branches, departments, and subjects    │
│                                                          │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │    15    │    8     │    3     │    12    │         │
│  │ Classes  │ Branches │  Depts   │ Subjects │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
└─────────────────────────────────────────────────────────┘
```

#### Tab Navigation (Modified)

```
┌─────────────────────────────────────────────────────────┐
│  [Classes] [Branches] [Departments] [Subjects]          │
└─────────────────────────────────────────────────────────┘
```

#### Search and Filter Bar

```
┌─────────────────────────────────────────────────────────┐
│  [🔍 Search subjects...]              [Sort: Name ▼]   │
└─────────────────────────────────────────────────────────┘
```

#### Subject List

```
┌─────────────────────────────────────────────────────────┐
│  Mathematics                                  ●         │
│  Code: math_101                                         │
│  Class: Class 10                                        │
│  Teachers: John Doe, Jane Smith, Bob Wilson             │
│                                          [✏️]  [🗑️]     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Physics                                      ●         │
│  Code: physics_101                                      │
│  Class: Class 10                                        │
│  Teachers: Jane Smith                                   │
│                                          [✏️]  [🗑️]     │
└─────────────────────────────────────────────────────────┘
```

### Bottom Sheet Modal (Create/Edit)

```
┌─────────────────────────────────────────────────────────┐
│                      ─────                              │
│                                                          │
│  Create Subject                              [✕]        │
│                                                          │
│  Subject Name *                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Mathematics                                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Subject Code *                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ math_101                                           │ │
│  └────────────────────────────────────────────────────┘ │
│  Lowercase letters, numbers, and underscores only       │
│                                                          │
│  Class *                                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Class 10                                      ▼   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Teachers * (Select one or more)                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ☑ John Doe                                         │ │
│  │ ☑ Jane Smith                                       │ │
│  │ ☐ Bob Wilson                                       │ │
│  │ ☐ Alice Johnson                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Cancel]                              [Create Subject] │
└─────────────────────────────────────────────────────────┘
```

### Confirmation Dialog

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Delete Subject                                          │
│                                                          │
│  Are you sure you want to delete "Mathematics"?         │
│  This action cannot be undone.                           │
│                                                          │
│  [Cancel]                                    [Delete]   │
└─────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                      📚                                  │
│                                                          │
│              No subjects found                           │
│                                                          │
│     Create your first subject to get started            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Responsive Behavior

**Light/Dark Mode**:
- Automatically adapts to theme mode using `useTheme()` hook
- Card backgrounds: `getSurfaceColor()`
- Text colors: `getTextColor()`, `getTextSecondaryColor()`
- Background: `getBackgroundColor()`

**Loading States**:
- Initial load: Full-screen `LoadingSpinner`
- Pull-to-refresh: Native refresh indicator
- Form submission: Disabled buttons with loading state

**Accessibility**:
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Form inputs have proper labels and hints
- Error messages are announced to screen readers
- Sufficient color contrast ratios (WCAG AA)


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Validation properties 6.1 and 6.3 duplicate 3.4 and 3.5
- Error handling properties 4.6 and 5.7 duplicate 3.10
- Loading indicator properties 10.1 duplicates 9.6
- Error mapping property 10.3 duplicates 3.10
- Error handling property 11.8 duplicates 10.4
- UI consistency property 8.2 is covered by other display properties
- Read-only access property 8.4 is covered by 8.3

The following properties provide unique validation value:

### Property 1: Subject Card Display Completeness

For any subject data, when rendered as a card, the output should contain the subject name, subject code, associated class name, and associated teacher name.

**Validates: Requirements 1.2**

### Property 2: Active Status Indicator Presence

For any subject, when rendered as a card, the output should include a status indicator element.

**Validates: Requirements 1.3**

### Property 3: Subject List Sorting

For any list of subjects, when sorted by name in ascending order, each subject's name should be lexicographically less than or equal to the next subject's name.

**Validates: Requirements 1.5**

### Property 4: Search Filter Correctness

For any search query and any list of subjects, the filtered results should only contain subjects where the name or code contains the search text (case-insensitive).

**Validates: Requirements 2.2, 2.5**

### Property 5: Sort Toggle State Machine

For any sort state (name or date), activating the sort toggle should change the state to the other option, and activating it again should return to the original state.

**Validates: Requirements 2.4**

### Property 6: Subject Name Validation - Minimum Length

For any string with length less than 2 or that is empty or whitespace-only, subject name validation should fail with an appropriate error message.

**Validates: Requirements 3.4, 6.1**

### Property 7: Subject Name Validation - Maximum Length

For any string with length greater than 100 characters, subject name validation should fail with an appropriate error message.

**Validates: Requirements 6.2**

### Property 8: Subject Code Validation Pattern

For any string that contains characters other than lowercase letters, numbers, and underscores, subject code validation should fail with an appropriate error message.

**Validates: Requirements 3.5, 6.3**

### Property 9: Create Subject Database Persistence

For any valid subject data (name, code, classId, teacherId), when submitted through the create function, a subsequent query should return a subject with matching data.

**Validates: Requirements 3.8**

### Property 10: Database Error Mapping

For any database error with a recognized PostgreSQL error code, the error message returned should be a user-friendly message, not the raw database error.

**Validates: Requirements 3.10, 10.4**

### Property 11: Edit Button Presence

For any list of subjects displayed to an admin user, each subject card should contain an edit action button.

**Validates: Requirements 4.1**

### Property 12: Update Subject Database Persistence

For any existing subject and any valid updates, when submitted through the update function, a subsequent query should return the subject with the updated data.

**Validates: Requirements 4.4**

### Property 13: Delete Button Presence

For any list of subjects displayed to an admin user, each subject card should contain a delete action button.

**Validates: Requirements 5.1**

### Property 14: Delete Subject Database Removal

For any existing subject, when deletion is confirmed and executed, a subsequent query should not return that subject.

**Validates: Requirements 5.4**

### Property 15: Class Selection Validation

For any form submission without a class selected (null or empty classId), validation should fail and prevent submission.

**Validates: Requirements 6.4**

### Property 16: Teacher Selection Validation

For any form submission without a teacher selected (null or empty teacherId), validation should fail and prevent submission.

**Validates: Requirements 6.5**

### Property 17: Validation Error Message Specificity

For any validation failure, the error message displayed should specifically identify which field failed validation and why.

**Validates: Requirements 6.6**

### Property 18: Validation Prevents Submission

For any form with validation errors, attempting to submit should not trigger the database operation.

**Validates: Requirements 6.7**

### Property 19: Teacher Subject Filtering

For any teacher user, when loading subjects, the returned list should only contain subjects where the teacher_id matches the current user's ID.

**Validates: Requirements 8.1**

### Property 20: Teacher Role Action Button Hiding

For any subject list displayed to a teacher user, the subject cards should not contain create, edit, or delete action buttons.

**Validates: Requirements 8.3**

### Property 21: Theme Mode Support

For any theme mode (light or dark), all UI components should render with appropriate colors from the theme tokens without errors.

**Validates: Requirements 9.2**

### Property 22: Loading State Indicator

For any database operation in progress, a loading indicator should be visible to the user.

**Validates: Requirements 9.6, 10.1**

### Property 23: Success Feedback Display

For any successful database operation (create, update, delete), a success message should be displayed to the user.

**Validates: Requirements 10.2**

### Property 24: Data Access Function Return Structure

For any data access function in subjects.ts, the return value should be an object with both 'data' and 'error' properties.

**Validates: Requirements 11.7**


## Error Handling

### Error Categories

The Subject Management feature handles four categories of errors:

1. **Validation Errors**: Client-side validation failures
2. **Database Errors**: PostgreSQL constraint violations and query failures
3. **Network Errors**: Connection issues with Supabase
4. **Authorization Errors**: RLS policy violations

### Validation Error Handling

**Strategy**: Validate inputs before submission to provide immediate feedback.

**Implementation**:
```typescript
function validateSubjectForm(
  name: string,
  code: string,
  classId: string,
  teacherId: string
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Name validation
  if (!name || name.trim().length === 0) {
    errors.name = 'Subject name is required';
  } else if (name.trim().length < 2) {
    errors.name = 'Subject name must be at least 2 characters';
  } else if (name.length > 100) {
    errors.name = 'Subject name cannot exceed 100 characters';
  }
  
  // Code validation
  if (!code || code.trim().length === 0) {
    errors.code = 'Subject code is required';
  } else if (!/^[a-z0-9_]+$/.test(code)) {
    errors.code = 'Subject code must contain only lowercase letters, numbers, and underscores';
  }
  
  // Class validation
  if (!classId) {
    errors.classId = 'Please select a class';
  }
  
  // Teacher validation
  if (!teacherId) {
    errors.teacherId = 'Please select a teacher';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
```

**User Feedback**:
- Display error messages below each field
- Highlight invalid fields with error color
- Disable submit button until all errors are resolved
- Show error count in form header if multiple errors

### Database Error Handling

**Strategy**: Map PostgreSQL error codes to user-friendly messages.

**Error Code Mapping**:
```typescript
const SUBJECT_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'A subject with this code already exists',
  '23503': 'Invalid reference - the associated class or teacher does not exist',
  '23502': 'Required field is missing',
  '23514': 'Invalid data format',
  'PGRST116': 'Subject not found',
};
```

**Foreign Key Constraint Handling**:
```typescript
function getSubjectErrorMessage(error: any): string {
  // Handle specific foreign key violations
  if (error?.code === '23503') {
    if (error?.message?.includes('attendance')) {
      return 'Cannot delete subject: it is being used in attendance records';
    }
    if (error?.message?.includes('assignments')) {
      return 'Cannot delete subject: it is being used in assignments';
    }
    return 'Invalid reference - the associated class or teacher does not exist';
  }
  
  // Handle other known errors
  if (error?.code && SUBJECT_ERROR_MESSAGES[error.code]) {
    return SUBJECT_ERROR_MESSAGES[error.code];
  }
  
  // Fallback for unknown errors
  return error?.message || 'An unexpected error occurred';
}
```

**User Feedback**:
- Display error alert with user-friendly message
- For foreign key violations on delete, suggest alternative actions
- Log technical error details to console for debugging
- Provide retry option for transient failures

### Network Error Handling

**Strategy**: Detect network failures and provide appropriate feedback.

**Implementation**:
```typescript
try {
  const { data, error } = await getSubjects();
  if (error) throw new Error(error);
  setSubjects(data || []);
} catch (error: any) {
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    Alert.alert(
      'Connection Error',
      'Unable to connect to the server. Please check your internet connection and try again.',
      [{ text: 'Retry', onPress: () => fetchSubjects() }]
    );
  } else {
    Alert.alert('Error', error.message || 'Failed to load subjects');
  }
}
```

**User Feedback**:
- Show connection error message
- Provide retry button
- Display offline indicator if persistent
- Cache last successful data for offline viewing (future enhancement)

### Authorization Error Handling

**Strategy**: Handle RLS policy violations gracefully.

**Implementation**:
```typescript
if (error?.code === 'PGRST301' || error?.message?.includes('permission')) {
  Alert.alert(
    'Access Denied',
    'You do not have permission to perform this action.',
    [{ text: 'OK' }]
  );
  return;
}
```

**User Feedback**:
- Display clear permission denied message
- Hide UI elements that user cannot access (preventive)
- Log authorization failures for security audit
- Redirect to appropriate screen if needed

### Error Recovery Strategies

**Automatic Retry**:
- Network errors: Retry with exponential backoff
- Transient database errors: Single retry attempt

**User-Initiated Retry**:
- Provide "Try Again" button in error alerts
- Pull-to-refresh to reload data
- Form resubmission after fixing validation errors

**Graceful Degradation**:
- Show cached data if available during network errors
- Display partial data if some queries fail
- Maintain UI responsiveness during errors

**Error Logging**:
- Log all errors to console with context
- Include user ID, timestamp, and action attempted
- Prepare for future integration with error tracking service (e.g., Sentry)


## Testing Strategy

### Dual Testing Approach

The Subject Management feature will employ both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
**Property Tests**: Verify universal properties across all inputs

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing

**Library**: `fast-check` (already in FRAMS dependencies)

**Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: subject-management, Property {number}: {property_text}`

**Test File Structure**:
```
FRAMS/tests/
  ├── subjects.test.ts              # Unit tests
  └── subjects.properties.test.ts   # Property-based tests
```

### Property Test Examples

#### Property 1: Subject Card Display Completeness

```typescript
import fc from 'fast-check';

describe('Subject Management Properties', () => {
  it('Property 1: Subject card displays all required fields', () => {
    // Feature: subject-management, Property 1: Subject card displays all required fields
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 2, maxLength: 100 }),
          code: fc.stringMatching(/^[a-z0-9_]+$/),
          class_name: fc.string({ minLength: 1 }),
          teacher_name: fc.string({ minLength: 1 }),
          is_active: fc.boolean(),
        }),
        (subject) => {
          const rendered = renderSubjectCard(subject);
          expect(rendered).toContain(subject.name);
          expect(rendered).toContain(subject.code);
          expect(rendered).toContain(subject.class_name);
          expect(rendered).toContain(subject.teacher_name);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property 4: Search Filter Correctness

```typescript
it('Property 4: Search filter returns only matching subjects', () => {
  // Feature: subject-management, Property 4: Search filter correctness
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 2, maxLength: 100 }),
          code: fc.stringMatching(/^[a-z0-9_]+$/),
        })
      ),
      fc.string(),
      (subjects, searchQuery) => {
        const filtered = filterSubjects(subjects, searchQuery);
        const query = searchQuery.toLowerCase();
        
        filtered.forEach(subject => {
          const matches = 
            subject.name.toLowerCase().includes(query) ||
            subject.code.toLowerCase().includes(query);
          expect(matches).toBe(true);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 6: Subject Name Validation - Minimum Length

```typescript
it('Property 6: Subject name validation rejects short names', () => {
  // Feature: subject-management, Property 6: Name validation minimum length
  fc.assert(
    fc.property(
      fc.oneof(
        fc.constant(''),
        fc.constant(' '),
        fc.string({ maxLength: 1 }),
        fc.stringOf(fc.constant(' '), { maxLength: 10 })
      ),
      (invalidName) => {
        const result = validateSubjectName(invalidName);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 8: Subject Code Validation Pattern

```typescript
it('Property 8: Subject code validation rejects invalid patterns', () => {
  // Feature: subject-management, Property 8: Code validation pattern
  fc.assert(
    fc.property(
      fc.string().filter(s => !/^[a-z0-9_]+$/.test(s) && s.length > 0),
      (invalidCode) => {
        const result = validateSubjectCode(invalidCode);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('lowercase letters, numbers, and underscores');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage

**Component Tests**:
- SubjectManager screen renders correctly
- SubjectForm displays all fields
- SubjectCard displays subject information
- Modal opens and closes properly
- Confirmation dialog shows correct message

**Integration Tests**:
- Create subject flow (form → validation → database → refresh)
- Edit subject flow (select → populate → update → refresh)
- Delete subject flow (select → confirm → delete → refresh)
- Search and filter interaction
- Sort toggle interaction

**Edge Cases**:
- Empty subject list displays empty state
- Loading state shows spinner
- Error states display appropriate messages
- Duplicate subject code shows specific error
- Foreign key constraint violation shows specific error
- Network error shows retry option

**Role-Based Tests**:
- Admin sees all subjects and action buttons
- Teacher sees only their subjects
- Teacher does not see action buttons
- Navigation card appears for admin only

### Test Data Generators

**Subject Generator**:
```typescript
const subjectArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 2, maxLength: 100 }),
  code: fc.stringMatching(/^[a-z0-9_]+$/),
  class_id: fc.uuid(),
  teacher_id: fc.uuid(),
  is_active: fc.boolean(),
  created_at: fc.date().map(d => d.toISOString()),
  updated_at: fc.date().map(d => d.toISOString()),
});
```

**Valid Subject Name Generator**:
```typescript
const validSubjectName = fc.string({ minLength: 2, maxLength: 100 })
  .filter(s => s.trim().length >= 2);
```

**Valid Subject Code Generator**:
```typescript
const validSubjectCode = fc.stringMatching(/^[a-z0-9_]+$/)
  .filter(s => s.length > 0);
```

### Mocking Strategy

**Database Mocking**:
- Mock Supabase client for unit tests
- Use test database for integration tests
- Mock RLS policies for authorization tests

**Navigation Mocking**:
- Mock React Navigation for screen tests
- Verify navigation calls with correct parameters

**Theme Mocking**:
- Mock useTheme hook for component tests
- Test both light and dark modes

### Continuous Integration

**Test Execution**:
- Run all tests on every commit
- Run property tests with 100 iterations in CI
- Run property tests with 1000 iterations nightly

**Coverage Goals**:
- Unit test coverage: >80%
- Property test coverage: All 24 properties
- Integration test coverage: All user flows

**Performance Benchmarks**:
- Subject list rendering: <100ms for 50 items
- Search filtering: <50ms for 100 items
- Form validation: <10ms


## Implementation Notes

### File Structure

```
FRAMS/
├── lib/
│   └── subjects.ts                          # Data access layer (NEW)
├── screens/
│   └── admin/
│       └── SubjectManager.tsx               # Main screen (NEW)
├── components/
│   └── admin/
│       └── subjects/                        # Subject components (NEW)
│           ├── SubjectForm.tsx              # Create/edit form
│           └── SubjectCard.tsx              # List item card
├── tests/
│   ├── subjects.test.ts                     # Unit tests (NEW)
│   └── subjects.properties.test.ts          # Property tests (NEW)
└── lib/
    └── types.ts                             # Add SubjectManager to RootStackParamList
```

### Type Definitions Update

Add to `lib/types.ts`:
```typescript
export type RootStackParamList = {
  // ... existing routes
  
  // Admin
  UserManagement: undefined;
  OrganizationManager: undefined;
  AuditLogs: undefined;
  VerificationDashboard: undefined;
  Reports: undefined;
  SubjectManager: undefined;  // NEW
};
```

### Navigation Registration

Add to `App.tsx` in the admin stack:
```typescript
{role === 'admin' && (
  <>
    <Stack.Screen name="UserManagement" component={UserManagement} options={{ headerShown: false }} />
    <Stack.Screen name="OrganizationManager" component={OrganizationManager} options={{ headerShown: false }} />
    <Stack.Screen name="AuditLogs" component={AuditLogsScreen} options={{ title: 'Audit Logs' }} />
    <Stack.Screen name="VerificationDashboard" component={VerificationDashboard} options={{ title: 'User Verification' }} />
    <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SubjectManager" component={SubjectManager} options={{ headerShown: false }} />  {/* NEW */}
  </>
)}
```

### Admin Dashboard Integration

Add navigation card to `screens/admin/AdminDashboard.tsx`:
```typescript
<TouchableOpacity
  style={styles.card}
  onPress={() => navigation.navigate('SubjectManager')}
  accessible
  accessibilityRole="button"
  accessibilityLabel="Subject Management"
  accessibilityHint="Manage academic subjects"
>
  <View style={styles.cardIcon}>
    <Ionicons name="book" size={32} color={tokens.colors.primary.main} />
  </View>
  <Text style={styles.cardTitle}>Subject Management</Text>
  <Text style={styles.cardDescription}>Manage academic subjects</Text>
</TouchableOpacity>
```

### Database Migration

Create migration file `supabase/migrations/YYYYMMDD_create_subjects_table.sql`:
```sql
-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON public.subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON public.subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON public.subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_is_active ON public.subjects(is_active);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Subjects Authenticated Read" ON public.subjects;
CREATE POLICY "Subjects Authenticated Read" ON public.subjects
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Subjects Admin Full" ON public.subjects;
CREATE POLICY "Subjects Admin Full" ON public.subjects
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Subjects Teacher Write" ON public.subjects;
CREATE POLICY "Subjects Teacher Write" ON public.subjects
  FOR UPDATE USING (
    public.is_teacher() AND 
    teacher_id = auth.uid()
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subjects_updated_at ON public.subjects;
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### Performance Considerations

**Query Optimization**:
- Use indexes on foreign keys (class_id, teacher_id)
- Use index on code for uniqueness checks
- Use index on is_active for filtering
- Limit query results if list grows large (pagination future enhancement)

**Rendering Optimization**:
- Use FlatList for efficient list rendering
- Implement item key extraction for React optimization
- Use memo for SubjectCard component
- Debounce search input (300ms)

**State Management**:
- Minimize re-renders with proper state structure
- Use useCallback for event handlers
- Use useMemo for filtered/sorted data

**Network Optimization**:
- Cache subject list in memory
- Implement pull-to-refresh for manual updates
- Consider real-time subscriptions for multi-user scenarios (future)

### Security Considerations

**Input Sanitization**:
- Trim all text inputs
- Validate code pattern on client and server
- Prevent SQL injection through parameterized queries (Supabase handles this)

**Authorization**:
- Enforce RLS policies at database level
- Hide UI elements based on role (defense in depth)
- Validate user permissions before operations

**Data Integrity**:
- Use foreign key constraints to prevent orphaned records
- Use RESTRICT on delete to prevent accidental data loss
- Validate references exist before creating subjects

### Accessibility

**Screen Reader Support**:
- All buttons have accessibilityLabel and accessibilityHint
- Form fields have proper labels
- Error messages are announced
- Loading states are announced

**Keyboard Navigation**:
- Tab order follows logical flow
- Enter key submits forms
- Escape key closes modals

**Visual Accessibility**:
- Sufficient color contrast (WCAG AA)
- Text size respects system settings
- Icons have text labels
- Status indicators use color and shape

### Future Enhancements

**Phase 2 Features**:
- Bulk import subjects from CSV
- Subject templates for common curricula
- Subject categories/departments
- Subject prerequisites and relationships
- Academic year management
- Subject scheduling integration

**Performance Enhancements**:
- Pagination for large subject lists
- Virtual scrolling for very large lists
- Optimistic UI updates
- Background sync

**User Experience**:
- Drag-and-drop reordering
- Bulk edit operations
- Advanced filtering (by class, teacher, status)
- Export subject list to CSV
- Subject usage statistics

**Integration**:
- Real-time updates with Supabase subscriptions
- Integration with attendance system
- Integration with assignment system
- Integration with timetable system

