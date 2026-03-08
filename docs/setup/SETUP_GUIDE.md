# FRAMS Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Face_Reco Setup](#face_reco-setup)
4. [FRAMS Mobile Setup](#frams-mobile-setup)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

**For Face_Reco (Desktop App):**
- Python 3.10 or higher
- pip (Python package manager)
- Webcam/Camera
- Windows/Linux/macOS

**For FRAMS (Mobile App):**
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Android/iOS device with Expo Go app, OR
- Android Studio (for Android emulator), OR
- Xcode (for iOS simulator, macOS only)

**For Database:**
- Supabase account (free tier works)
- Internet connection

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name:** FRAMS
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to you
5. Wait for project to be created (~2 minutes)

### 2. Get API Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 3. Run Database Migrations

The migrations are already in the `supabase/migrations/` folder. They will be automatically applied when you push to Supabase.

**Option 1: Using Supabase CLI (Recommended)**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

**Option 2: Manual (via Supabase Dashboard)**
1. Go to **SQL Editor** in Supabase dashboard
2. Copy content from each migration file in `supabase/migrations/`
3. Run them in order (sorted by timestamp)

### 4. Verify Database Setup

Run this query in SQL Editor to verify:
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should show: attendance, classes, branches, org_departments, subjects, students, users, etc.
```

---

## Face_Reco Setup

### 1. Navigate to Directory
```bash
cd Face_Reco
```

### 2. Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

**Note:** If you encounter errors:
- **MediaPipe:** May require Visual C++ Redistributable on Windows
- **OpenCV:** Should install automatically
- **Supabase:** `pip install supabase`

### 4. Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
APP_NAME=FRAMS
DEBUG_MODE=False
CAMERA_INDEX=0
FACE_DETECTION_CONFIDENCE=0.5
FACE_RECOGNITION_THRESHOLD=0.6
```

### 5. Test Connection
```bash
python -c "from database.client import SupabaseClient; client = SupabaseClient(); print('✓ Connected')"
```

### 6. Run Application
```bash
python main.py
```

**Expected:** Login window appears

---

## FRAMS Mobile Setup

### 1. Navigate to Directory
```bash
cd FRAMS
```

### 2. Install Dependencies
```bash
npm install
```

**Note:** This may take 5-10 minutes on first install.

### 3. Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Start Development Server
```bash
npx expo start
```

**Expected:** QR code appears in terminal

### 5. Run on Device

**Option 1: Physical Device (Easiest)**
1. Install "Expo Go" app from App Store/Play Store
2. Scan QR code with:
   - **iOS:** Camera app
   - **Android:** Expo Go app
3. App loads on your device

**Option 2: Android Emulator**
1. Install Android Studio
2. Create virtual device (AVD)
3. Start emulator
4. Press `a` in Expo terminal

**Option 3: iOS Simulator (macOS only)**
1. Install Xcode
2. Press `i` in Expo terminal

---

## Testing

### Test 1: Create Admin User

1. Open FRAMS mobile app
2. Tap "Sign Up"
3. Fill in:
   - **Name:** Admin User
   - **Email:** admin@test.com
   - **Password:** Admin@123
   - **Role:** Admin
4. Submit

5. Go to Supabase Dashboard → **Authentication** → **Users**
6. Find the user and verify them manually (set `is_verified = true` in users table)

### Test 2: Login as Admin

1. Open FRAMS app
2. Login with admin@test.com / Admin@123
3. **Expected:** Dashboard appears

### Test 3: Create Student

1. In FRAMS, tap "Sign Up"
2. Select "Student" role
3. Fill in:
   - **Name:** Test Student
   - **Email:** student@test.com
   - **Password:** Student@123
   - **Enrollment:** CS001
4. Select:
   - **Department:** Science & Technology
   - **Branch:** Computer Science
   - **Class:** F.Y. B.Sc. (Computer Science)
5. Submit

6. Login as admin and verify the student

### Test 4: Face Registration

1. Open Face_Reco desktop app
2. Login as admin
3. Click "Face Registration"
4. Select student: CS001 - Test Student
5. Position face in camera frame
6. Click "Capture & Register"
7. **Expected:** "Face registered successfully"

### Test 5: Attendance Marking

**Via Face Recognition:**
1. In Face_Reco, click "Face Recognition"
2. Select:
   - **Department:** Science & Technology
   - **Branch:** Computer Science
   - **Class:** F.Y. B.Sc. (Computer Science)
   - **Subject:** Programming in C
3. Click "Start Recognition"
4. Show face to camera
5. **Expected:** Attendance marked automatically

**Via Mobile App:**
1. In FRAMS, go to "Mark Attendance"
2. Select Department → Branch → Class → Subject
3. Mark students present/absent
4. Submit

### Test 6: View Attendance

1. In FRAMS, go to "View Attendance"
2. Select filters
3. **Expected:** Attendance records appear

---

## Troubleshooting

### Face_Reco Issues

**Problem:** "Module not found" error
```bash
# Solution: Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**Problem:** Camera not working
```bash
# Solution: Try different camera index
# Edit .env: CAMERA_INDEX=1
```

**Problem:** "Supabase connection failed"
```bash
# Solution: Check .env file
# Verify SUPABASE_URL and SUPABASE_KEY are correct
# Test: python -c "from database.client import SupabaseClient; SupabaseClient()"
```

**Problem:** Face detection not working
```bash
# Solution: Check lighting
# Ensure face is well-lit and clearly visible
# Adjust FACE_DETECTION_CONFIDENCE in .env (try 0.3)
```

### FRAMS Issues

**Problem:** "Expo Go" app shows error
```bash
# Solution: Clear cache and restart
npx expo start -c
```

**Problem:** "Network error" when logging in
```bash
# Solution: Check .env file
# Verify EXPO_PUBLIC_SUPABASE_URL and KEY are correct
# Ensure device is on same network as development machine
```

**Problem:** Subjects not appearing
```bash
# Solution: Verify database has subjects
# Run: cd Face_Reco && python database/migrations/verify_bsc_cs_subjects.py
```

**Problem:** Build fails
```bash
# Solution: Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

**Problem:** Tables not found
```bash
# Solution: Run migrations
# Via Supabase CLI: supabase db push
# Or manually via SQL Editor
```

**Problem:** RLS policy errors
```bash
# Solution: Check user is verified
# In Supabase Dashboard → Authentication → Users
# Set is_verified = true for the user
```

**Problem:** Foreign key constraint errors
```bash
# Solution: Verify hierarchy
# Department → Branch → Class → Subject
# Ensure all IDs are valid
```

---

## Next Steps

After successful setup:

1. **Populate Data:**
   - Add more departments, branches, classes
   - Add subjects for other programs
   - Register more students

2. **Customize:**
   - Adjust face recognition thresholds
   - Modify UI themes
   - Add custom features

3. **Deploy:**
   - Build FRAMS for production: `eas build`
   - Package Face_Reco: `pyinstaller main.py`

4. **Monitor:**
   - Check Supabase logs
   - Review attendance reports
   - Monitor system performance

---

## Support

For issues:
1. Check this guide's Troubleshooting section
2. Review error messages carefully
3. Check Supabase dashboard for database issues
4. Verify all environment variables are correct

---

## Summary

✅ **Setup Complete!** You should now have:
- Supabase database with all tables and data
- Face_Reco desktop app running
- FRAMS mobile app running
- Test admin and student accounts
- Face registration working
- Attendance marking working

**Total Setup Time:** ~30 minutes

**Ready to use!** 🎉
