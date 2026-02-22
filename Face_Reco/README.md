# FRAMS - Face Recognition Attendance System

A modern face recognition-based attendance management system built with PySide6, MediaPipe, and Supabase.

## Features

- ✅ **Real-time Face Recognition** using MediaPipe Face Detection & Face Mesh
- ✅ **Session-based Attendance** with class, subject, and date tracking
- ✅ **Live Camera Feed** with bounding boxes and confidence scores
- ✅ **Automatic Attendance Logging** to Supabase database
- ✅ **Modern GUI** built with PySide6
- 🚧 **Student Registration** (Coming in Phase 3)

## Tech Stack

- **Frontend**: PySide6 (Qt for Python)
- **Backend**: Python 3.10.10
- **Database**: Supabase (PostgreSQL)
- **Face Recognition**: MediaPipe + OpenCV
- **Computer Vision**: OpenCV (cv2)

## Project Structure

```
Face_Reco/
├── main.py                 # Application entry point
├── config.py               # Configuration management
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (create from .env.example)
├── .env.example           # Environment template
├── core/                   # Face recognition core
│   ├── __init__.py
│   ├── face_detector.py   # MediaPipe face detection
│   └── face_recognizer.py # Face embedding & matching
├── database/              # Database layer
│   ├── __init__.py
│   └── client.py          # Supabase client wrapper
└── gui/                   # PySide6 GUI components
    ├── __init__.py
    ├── main_window.py     # Main application window
    ├── dashboard.py       # Dashboard navigation
    ├── session_setup.py   # Session configuration
    └── recognition_view.py # Live recognition interface
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the `databaseSchema.sql` in your Supabase SQL Editor to create all required tables.

### 4. Run Application

```bash
python main.py
```

## Usage

### Recognition Flow (Current Implementation)

1. **Launch Application** - Opens dashboard
2. **Click "Start Recognition"** - Navigate to session setup
3. **Configure Session**:
   - Select Class
   - Select Subject
   - Choose Date
4. **Start Recognition** - Camera activates
5. **Automatic Attendance** - Faces are recognized and attendance is marked
6. **Stop & Save** - End session and save to database

### Registration Flow (Phase 3 - Coming Soon)

- Admin/Teacher login
- Student enrollment with face capture
- Face embedding generation and storage

## Configuration Options

Edit `.env` to customize:

- `CAMERA_INDEX`: Camera device index (default: 0)
- `CAMERA_WIDTH`: Camera resolution width (default: 1280)
- `CAMERA_HEIGHT`: Camera resolution height (default: 720)
- `FACE_DETECTION_CONFIDENCE`: Detection threshold (default: 0.5)
- `FACE_RECOGNITION_THRESHOLD`: Recognition threshold (default: 0.6)

## Database Schema

Key tables:
- `users` - User profiles (students, teachers, admins)
- `students` - Student details with face encodings
- `classes` - Academic classes
- `subjects` - Subjects per class
- `attendance` - Attendance records
- `org_classes`, `org_branches`, `org_departments` - Organizational structure

See `databaseSchema.sql` for complete schema.

## Development Roadmap

- [x] Phase 1: Project Setup
- [x] Phase 2: Recognition Flow
- [ ] Phase 3: Registration Flow
- [ ] Phase 4: Integration & Polish

## License

MIT License

## Credits

Built with:
- [PySide6](https://doc.qt.io/qtforpython/)
- [MediaPipe](https://google.github.io/mediapipe/)
- [OpenCV](https://opencv.org/)
- [Supabase](https://supabase.com/)
