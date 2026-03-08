# FRAMS Project Structure

## Root Directory
```
FRAMS-Project/
├── Face_Reco/              # Desktop application (Python)
├── FRAMS/                  # Mobile application (React Native)
├── docs/                   # Documentation and diagrams
├── supabase/              # Database migrations and config
├── README.md              # Main project documentation
├── QUICK_START_GUIDE.md   # Quick start instructions
└── BSC_CS_*.md           # BSc CS subject migration docs
```

## Face_Reco (Desktop App)
```
Face_Reco/
├── config/                # Configuration management
│   ├── __init__.py
│   └── config.py         # Environment variables and settings
├── core/                  # Core business logic
│   ├── __init__.py
│   ├── face_detector.py          # Face detection using MediaPipe
│   ├── face_recognizer.py        # Face recognition logic
│   ├── face_encoding_service.py  # Face encoding management
│   ├── face_registration_service.py
│   ├── encryption_service.py     # Face encoding encryption
│   └── error_handler.py          # Error handling utilities
├── database/              # Database layer
│   ├── __init__.py
│   ├── client.py         # Supabase client wrapper
│   └── migrations/       # Database migration scripts
│       ├── add_bsc_cs_subjects.py
│       ├── verify_bsc_cs_subjects.py
│       └── ...
├── gui/                   # User interface
│   ├── __init__.py
│   ├── main_window.py    # Main application window
│   ├── login_view.py     # Login screen
│   ├── dashboard.py      # Dashboard view
│   ├── enhanced_registration_view.py  # Face registration
│   ├── recognition_view.py            # Face recognition
│   ├── session_setup.py               # Attendance session setup
│   └── styles.py         # UI styling constants
├── tests/                 # Test suite
│   └── test_*.py
├── main.py               # Application entry point
├── requirements.txt      # Python dependencies
├── .env                  # Environment variables (not in git)
├── .gitignore
└── README.md
```

## FRAMS (Mobile App)
```
FRAMS/
├── assets/               # Images, fonts, icons
├── components/           # Reusable React components
│   ├── ui/              # UI components
│   └── ...
├── context/              # React Context providers
│   ├── AuthContext.tsx
│   └── ...
├── hooks/                # Custom React hooks
│   ├── useAuth.ts
│   └── ...
├── lib/                  # Utility libraries
│   ├── supabase.ts      # Supabase client
│   └── ...
├── screens/              # Application screens
│   ├── auth/            # Authentication screens
│   ├── teacher/         # Teacher-specific screens
│   ├── student/         # Student-specific screens
│   └── ...
├── scripts/              # Build and utility scripts
├── supabase/            # Supabase configuration
├── App.tsx              # Root component
├── index.js             # Entry point
├── package.json         # Node dependencies
├── tsconfig.json        # TypeScript configuration
├── app.json             # Expo configuration
├── eas.json             # Expo Application Services config
├── .gitignore
└── README.md
```

## Documentation
```
docs/
├── diagrams/            # System diagrams (Mermaid)
│   ├── figure_5_2_face_registration_flow.mmd
│   └── figure_5_3_face_recognition_flow.mmd
└── ...
```

## Database
```
supabase/
└── migrations/          # SQL migration files
    ├── 20260228065025_create_subjects_tables.sql
    ├── 20260308124218_add_bsc_cs_subjects_mumbai_university.sql
    └── ...
```

## Key Files

### Configuration
- `Face_Reco/.env` - Desktop app environment variables
- `FRAMS/.env` - Mobile app environment variables
- `Face_Reco/config/config.py` - Application configuration
- `FRAMS/lib/supabase.ts` - Supabase client configuration

### Entry Points
- `Face_Reco/main.py` - Desktop app entry point
- `FRAMS/App.tsx` - Mobile app root component
- `FRAMS/index.js` - Mobile app entry point

### Core Logic
- `Face_Reco/core/face_detector.py` - Face detection
- `Face_Reco/core/face_recognizer.py` - Face recognition
- `Face_Reco/database/client.py` - Database operations
- `FRAMS/lib/supabase.ts` - API client

### UI Components
- `Face_Reco/gui/main_window.py` - Desktop main window
- `FRAMS/screens/` - Mobile app screens
- `FRAMS/components/` - Reusable components

## Dependencies

### Face_Reco (Python)
- mediapipe - Face detection and recognition
- opencv-python - Camera and image processing
- supabase - Database client
- tkinter - GUI framework
- cryptography - Encryption

### FRAMS (React Native)
- react-native - Mobile framework
- expo - Development platform
- @supabase/supabase-js - Database client
- react-navigation - Navigation
- typescript - Type safety

## Build Outputs (Not in Git)

```
Face_Reco/
├── venv/                # Python virtual environment
└── __pycache__/         # Python bytecode cache

FRAMS/
├── node_modules/        # Node dependencies
├── .expo/              # Expo cache
└── dist/               # Build output
```

## Git Ignored Files

- `.env` files (contain secrets)
- `venv/` and `node_modules/` (dependencies)
- `__pycache__/` and `.pyc` files
- `.expo/` and build outputs
- IDE-specific files (`.vscode/`, `.idea/`)
- OS-specific files (`.DS_Store`, `Thumbs.db`)

---

This structure follows best practices for:
- Separation of concerns
- Modularity and reusability
- Clear organization
- Easy navigation
- Scalability
