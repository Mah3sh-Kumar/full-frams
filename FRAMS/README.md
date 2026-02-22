<div align="center">

# 🎓 FRAMS
### Face Recognition Attendance Management System

**Reliable Attendance Through Intelligent Vision**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Mah3sh-Kumar/FRAMS.git)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020.svg)](https://expo.dev/)

*A comprehensive IoT-enabled academic management system combining automated face recognition attendance with a powerful mobile application for students, teachers, and administrators.*

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup-supabase)
  - [Hardware Setup](#2-hardware-setup-raspberry-pi)
  - [Mobile App Setup](#3-mobile-app-setup)
- [Usage](#-usage)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## Overview

FRAMS is an intelligent attendance management system that leverages computer vision and IoT technology to automate attendance tracking in educational institutions. The system combines:

- **Edge Computing**: Raspberry Pi devices with camera modules for real-time face recognition
- **Cloud Backend**: Supabase for scalable data management, authentication, and real-time synchronization
- **Mobile Application**: Cross-platform React Native app for comprehensive academic management

The system eliminates manual attendance processes, reduces proxy attendance, and provides real-time analytics for better decision-making.

---

## ✨ Features

### 🤖 Automated Attendance
- **Face Recognition**: OpenCV-powered facial recognition for contactless attendance
- **Real-time Processing**: Instant attendance marking with sub-second response times
- **Multi-device Support**: Deploy multiple Raspberry Pi units across different classrooms
- **Offline Capability**: Queue attendance records when offline, sync when connected

### 👥 Role-Based Access Control

#### �‍🎓 Students
- View personal attendance records with detailed analytics
- Access assignments, grades, and academic calendar
- Receive push notifications for important updates
- Download attendance reports in CSV format
- Track attendance percentage by subject

#### 👨‍🏫 Teachers
- Manage classes, subjects, and student enrollments
- Create and grade assignments
- Manual attendance override capabilities
- Generate class-wise attendance reports
- View real-time attendance statistics
- Export data for analysis

#### �‍c💼 Administrators
- Complete user management (students, teachers, staff)
- **Organization Management**: Create and manage classes, branches, and departments
- **Dynamic Dropdowns**: Database-driven organizational data with real-time updates
- **Dependency Checking**: Prevent deletion of items in use by students/teachers
- System-wide analytics and reporting
- Device management and monitoring
- Bulk user operations (import/export)
- Audit logs and system health monitoring
- Configure attendance policies and thresholds

### 📊 Analytics & Reporting
- Interactive charts and visualizations
- Attendance trends and patterns
- Exportable reports (CSV, PDF)
- Real-time dashboard updates
- Customizable date range filters

### 🔔 Notifications
- Push notifications for attendance alerts
- Assignment deadlines and grade updates
- System announcements
- Low attendance warnings

### 🎨 Modern UI/UX
- Material Design 3 components
- **Enhanced Dropdowns**: Improved picker with search, proper value display, and visual feedback
- **Keyboard-Aware Forms**: Automatic scrolling to keep inputs visible above keyboard
- **Screenshot Prevention**: Security feature to prevent unauthorized screen capture
- Dark mode support (coming soon)
- Smooth animations and transitions
- Responsive layouts for all screen sizes
- Full accessibility support (screen readers, keyboard navigation)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRAMS System                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Edge Layer     │      │   Cloud Layer    │      │  Client Layer    │
│                  │      │                  │      │                  │
│  Raspberry Pi    │◄────►│    Supabase      │◄────►│  Mobile App      │
│  + Camera        │ HTTPS │                  │ HTTPS│  (React Native)  │
│  + OpenCV        │      │  - PostgreSQL    │      │                  │
│  + Face Recog    │      │  - Auth          │      │  - Student UI    │
│                  │      │  - Storage       │      │  - Teacher UI    │
│                  │      │  - Realtime      │      │  - Admin UI      │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

### System Components

1. **Edge Layer (Hardware)**
   - Raspberry Pi 4 with Camera Module
   - OpenCV for image processing
   - Face Recognition library for identification
   - Local caching for offline operation

2. **Cloud Layer (Backend)**
   - **Supabase PostgreSQL**: Relational database for all data
   - **Supabase Auth**: Secure authentication with JWT
   - **Supabase Storage**: Profile pictures and face encodings
   - **Supabase Realtime**: WebSocket connections for live updates

3. **Client Layer (Mobile)**
   - React Native with Expo for cross-platform development
   - React Navigation for routing
   - React Native Paper for Material Design components
   - Context API for state management

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Python 3.8+** - [Download](https://www.python.org/)
- **Git** - [Download](https://git-scm.com/)
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **Supabase Account** - [Sign up](https://supabase.com/)

For hardware setup:
- Raspberry Pi 4 (2GB RAM minimum, 4GB recommended)
- Raspberry Pi Camera Module v2 or compatible USB webcam
- MicroSD card (16GB minimum, Class 10)
- Stable internet connection

---

### 1. Backend Setup (Supabase)

#### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **New Project**
3. Fill in project details:
   - **Name**: FRAMS
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
4. Wait for project provisioning (2-3 minutes)

#### Step 2: Configure Database

1. Navigate to **SQL Editor** in the Supabase dashboard
2. Run the database setup scripts in order:
   ```sql
   -- Run these files in sequence:
   backend/database_setup_final.sql
   backend/add_profile_and_notifications.sql
   backend/add_user_verification.sql
   backend/improvements.sql
   ```
3. Run the organizational data migration:
   ```sql
   -- Create organizational tables and migrate data
   supabase/migrations/003_organizational_data_schema.sql
   supabase/migrations/004_populate_organizational_data.sql
   ```
4. Verify tables are created in **Table Editor**:
   - `org_classes` - Academic grade levels
   - `org_branches` - Academic streams/divisions
   - `org_departments` - Organizational departments

#### Step 3: Configure Storage

1. Go to **Storage** in the Supabase dashboard
2. Create the following buckets:
   - `avatars` (public)
   - `face-encodings` (private)
3. Set up storage policies as defined in the SQL scripts

#### Step 4: Get API Credentials

1. Go to **Project Settings** > **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
3. Keep these secure - you'll need them for configuration

---

### 2. Hardware Setup (Raspberry Pi)

#### Step 1: Prepare Raspberry Pi

1. Flash Raspberry Pi OS (64-bit recommended) to SD card using [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Enable camera interface:
   ```bash
   sudo raspi-config
   # Navigate to: Interface Options > Camera > Enable
   ```
3. Update system:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

#### Step 2: Install Dependencies

1. Install system packages:
   ```bash
   sudo apt install -y python3-pip python3-opencv libatlas-base-dev
   ```

2. Navigate to hardware directory:
   ```bash
   cd hardware
   ```

3. Install Python dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```

#### Step 3: Configure Environment

1. Create `.env` file in the `hardware` directory:
   ```bash
   nano .env
   ```

2. Add configuration:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   DEVICE_ID=RPI_CLASSROOM_1
   CAMERA_INDEX=0
   RECOGNITION_THRESHOLD=0.6
   ```

3. Save and exit (Ctrl+X, Y, Enter)

#### Step 4: Test Camera

```bash
python3 -c "import cv2; print('OpenCV version:', cv2.__version__)"
```

#### Step 5: Run Face Recognition System

```bash
python3 main.py
```

The system will:
- Initialize camera
- Load face encodings from Supabase
- Start recognition loop
- Mark attendance automatically when faces are detected

---

### 3. Mobile App Setup

#### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/frams.git
cd frams
```

#### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

#### Step 3: Configure Environment

1. Create `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

#### Step 4: Start Development Server

```bash
npm start
# or
npx expo start
```

#### Step 5: Run on Device/Emulator

Choose your platform:

- **Android**: Press `a` or run `npm run android`
- **iOS**: Press `i` or run `npm run ios` (macOS only)
- **Web**: Press `w` or run `npm run web`

Or scan the QR code with:
- **Android**: Expo Go app
- **iOS**: Camera app (opens in Expo Go)

---

## 📱 Usage

### First Time Setup

1. **Create Admin Account**:
   - Run the admin creation script or use Supabase dashboard
   - Set role to `admin` in the `profiles` table

2. **Login**:
   - Open the app
   - Use admin credentials to login

3. **Configure Organization**:
   - Navigate to Admin Dashboard → Organization Manager
   - Create classes (e.g., Grade 1, Grade 2, etc.)
   - Create branches for each class (e.g., Arts, Science, Commerce)
   - Create departments (e.g., Mathematics, English, etc.)
   - These will automatically appear in signup and user management forms

4. **Add Users**:
   - Navigate to Admin Dashboard → User Management
   - Add teachers and students
   - Select from dynamically populated dropdowns
   - Upload profile pictures for face recognition

5. **Configure Classes**:
   - Create subjects
   - Assign teachers to subjects
   - Enroll students in classes

6. **Register Faces**:
   - Students upload clear face photos
   - System generates face encodings
   - Encodings synced to Raspberry Pi devices

### Daily Operations

**For Students**:
- Stand in front of camera for attendance
- Check attendance status in app
- View assignments and grades

**For Teachers**:
- Monitor real-time attendance
- Create assignments
- Generate reports

**For Admins**:
- Monitor system health
- View analytics
- Manage users and devices

---

## 🛠 Tech Stack

### Mobile Application
- **Framework**: React Native 0.81.5
- **Platform**: Expo ~54.0
- **UI Library**: React Native Paper 5.14
- **Navigation**: React Navigation 7.x
- **State Management**: React Context API
- **Charts**: React Native Chart Kit
- **Language**: TypeScript 5.9

### Backend
- **Database**: Supabase (PostgreSQL 15)
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime (WebSockets)
- **API**: RESTful + GraphQL

### Hardware/AI
- **Platform**: Raspberry Pi 4
- **Language**: Python 3.8+
- **Computer Vision**: OpenCV 4.x
- **Face Recognition**: face_recognition library
- **ML Framework**: dlib

### Development Tools
- **Version Control**: Git
- **Package Manager**: npm/yarn
- **Testing**: Jest, React Testing Library
- **Code Quality**: TypeScript, ESLint
- **CI/CD**: GitHub Actions (optional)

---

## 📁 Project Structure

```
frams/
├── assets/                 # Images, icons, fonts
├── backend/               # Database SQL scripts
│   ├── database_setup_final.sql
│   ├── add_profile_and_notifications.sql
│   └── ...
├── components/            # Reusable React components
│   ├── design-system/    # Design system components
│   ├── EnhancedPicker.tsx  # Improved dropdown component
│   ├── KeyboardAwareScrollView.tsx  # Keyboard handling
│   ├── Toast.tsx
│   └── ...
├── context/              # React Context providers
│   └── AuthContext.tsx
├── hardware/             # Raspberry Pi code
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── lib/                  # Utility functions
│   ├── supabase.ts
│   ├── database.ts
│   ├── organization.ts   # Organization CRUD operations
│   ├── screenshotPrevention.ts  # Screenshot prevention
│   └── ...
├── screens/              # App screens
│   ├── admin/
│   │   ├── OrganizationManager.tsx  # Manage classes/branches/departments
│   │   └── ...
│   ├── teacher/
│   ├── student/
│   └── ...
├── scripts/              # Utility scripts
├── supabase/             # Supabase configuration
├── .env.example          # Environment variables template
├── App.tsx               # Root component
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── README.md             # This file
```

---

## 📚 API Documentation

### Authentication Endpoints

```typescript
// Sign Up
POST /auth/signup
Body: { email, password, full_name, role }

// Sign In
POST /auth/signin
Body: { email, password }

// Sign Out
POST /auth/signout
```

### Attendance Endpoints

```typescript
// Mark Attendance
POST /api/attendance
Body: { student_id, subject_id, device_id }

// Get Attendance Records
GET /api/attendance?student_id={id}&date_from={date}&date_to={date}
```

For complete API documentation, see the Supabase auto-generated docs in your project dashboard.

---

## 🔧 Troubleshooting

### Common Issues

**Issue**: App won't connect to Supabase
- **Solution**: Verify `.env` file has correct credentials
- Check internet connection
- Ensure Supabase project is active

**Issue**: Face recognition not working
- **Solution**: Ensure good lighting conditions
- Check camera is properly connected
- Verify face encodings are uploaded
- Adjust `RECOGNITION_THRESHOLD` in hardware `.env`

**Issue**: Expo app crashes on startup
- **Solution**: Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

**Issue**: Raspberry Pi camera not detected
- **Solution**: Enable camera in `raspi-config`
- Check camera cable connection
- Test with: `raspistill -o test.jpg`

**Issue**: Dropdown values not displaying correctly
- **Solution**: Ensure you're using EnhancedPicker component
- Check that items array has proper label/value structure
- Verify value prop matches one of the item values

**Issue**: Keyboard covering input fields
- **Solution**: Wrap form in KeyboardAwareScrollView component
- Adjust extraScrollHeight prop if needed
- Ensure ScrollView has enough content height

**Issue**: Cannot delete class/branch/department
- **Solution**: Check if item is in use by existing users
- Remove user associations before deletion
- View error message for specific dependencies

### Getting Help

- Check [Issues](https://github.com/yourusername/frams/issues) for known problems
- Create a new issue with detailed description
- Join our community discussions

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure:
- Code follows existing style
- All tests pass
- Documentation is updated
- Commit messages are clear

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👏 Acknowledgments

- OpenCV community for computer vision tools
- Supabase team for the excellent backend platform
- React Native and Expo teams
- All contributors and testers

---

## 📞 Contact

**Project Maintainer**: Your Name

- Email: your.email@example.com
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

---

<div align="center">

**Made with ❤️ for better education management**

⭐ Star this repo if you find it helpful!

</div>#   F R A M S  
 #   F R A M S  
 #   F R A M S  
 #   F R A M S  
 #   C o d e R a b b i t   T e s t  
 