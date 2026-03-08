# Run Teacher Department Fix via Command Line

## Quick Start

### Option 1: Using Supabase CLI (Recommended)

**Prerequisites:**
- Supabase CLI installed: `npm install -g supabase`
- Logged in to Supabase: `supabase login`
- Linked to your project: `supabase link --project-ref YOUR_PROJECT_REF`

**Run the fix:**

```bash
# Navigate to FRAMS directory
cd FRAMS

# Windows
scripts\run-teacher-department-fix.bat

# Linux/Mac
bash scripts/run-teacher-department-fix.sh
```

### Option 2: Direct SQL Execution

If you prefer to run the SQL directly:

```bash
cd FRAMS
supabase db execute --file scripts/fix-and-sync-teacher-departments.sql
```

### Option 3: Manual via Supabase Dashboard

If CLI doesn't work, copy and paste the SQL:

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy contents from `FRAMS/scripts/fix-and-sync-teacher-departments.sql`
4. Paste and click "Run"

## What This Fix Does

1. ✅ Adds `updated_at` column to `teachers` table (if missing)
2. ✅ Creates safe trigger function for timestamp updates
3. ✅ Creates department sync functions
4. ✅ Creates automatic trigger on `subject_teachers` table
5. ✅ Backfills existing teachers with departments
6. ✅ Verifies all teachers have proper departments

## Expected Output

You should see messages like:

```
✅ Added updated_at column to teachers table
✅ Updated trigger to safe version
✅ Created department sync trigger
🔄 Starting backfill of teacher departments...
  ✅ Updated teacher 2f50604d-a472-42b5-b1ce-817ca038fa75 with department: Computer Science
✅ Backfill complete. Updated 1 teacher departments.
=== VERIFICATION ===
Total teachers: 1
Teachers with assigned department: 1
Teachers with "Not assigned": 0
✅ All teachers have proper departments!
```

## Verification

After running, check the output table showing:
- Teacher emails
- Their departments
- Number of subjects taught
- Status (✅ Assigned / ⚠️ Not assigned)

## Testing

1. Go to Admin panel
2. Assign a teacher to a new subject
3. Check teacher's profile - department should auto-update
4. No more "Not assigned" messages!

## Troubleshooting

**Error: "Supabase CLI not found"**
```bash
npm install -g supabase
```

**Error: "Not linked to project"**
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

**Error: "Permission denied"**
- On Linux/Mac: `chmod +x scripts/run-teacher-department-fix.sh`
- Or use Option 3 (Manual via Dashboard)

## Files Involved

- `scripts/fix-and-sync-teacher-departments.sql` - Complete SQL fix
- `scripts/run-teacher-department-fix.sh` - Linux/Mac runner
- `scripts/run-teacher-department-fix.bat` - Windows runner
