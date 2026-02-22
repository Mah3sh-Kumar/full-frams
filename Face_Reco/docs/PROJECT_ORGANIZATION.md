# Project Organization Guide

## New Structure

```
Face_Reco/
├── main.py                    # Application entry point
├── requirements.txt           # Python dependencies
├── README.md                  # Project documentation
├── .gitignore                 # Git ignore rules
│
├── config/                    # Configuration files
│   ├── __init__.py           # Package marker
│   └── config.py             # Application configuration
│
├── core/                      # Core business logic
│   ├── __init__.py
│   ├── auth_boundary_resolver.py
│   ├── conflict_resolution_service.py
│   ├── device_fingerprint.py
│   ├── encryption_service.py
│   ├── error_handler.py
│   ├── face_detector.py
│   ├── face_encoding_cache.py
│   ├── face_encoding_converter.py
│   ├── face_encoding_service.py
│   ├── face_recognizer.py
│   ├── performance_optimizer.py
│   └── synchronization_service.py
│
├── database/                  # Database layer
│   ├── __init__.py
│   └── client.py
│
├── gui/                       # GUI components
│   ├── __init__.py
│   ├── dashboard.py
│   ├── login_view.py
│   ├── main_window.py
│   ├── recognition_view.py
│   ├── registration_view.py
│   ├── session_setup.py
│   └── styles.py
│
├── scripts/                   # Utility scripts
│   ├── debug/                 # Debug scripts
│   │   ├── debug_registration.py
│   │   └── debug_students.py
│   │
│   ├── add_sample_data.py
│   ├── add_subjects_manual.sql
│   ├── add_subjects_simple.sql
│   ├── add_subjects.sql
│   ├── add_user.py
│   ├── check_rls.py
│   ├── check_users.py
│   ├── debug_subjects.py
│   ├── find_user_id.py
│   ├── fix_add_subjects.py
│   ├── fix_rls_subjects.sql
│   ├── hammer_fix_rls.sql
│   ├── password_check.py
│   ├── populate_subjects.py
│   ├── sample_data.sql
│   ├── test_auth_methods.py
│   ├── test_connection.py
│   ├── test_rls.py
│   ├── test_subject_fetch.py
│   └── verify_user_records.py
│
├── sql/                       # SQL files
│   ├── check_students_query.sql
│   ├── databaseSchema.sql
│   ├── diagnose_user_permissions.sql
│   └── fix_rls_policies.sql
│
├── tests/                     # Test files
│   ├── test_auth.py
│   ├── test_login.py
│   ├── test_registration.py
│   ├── test_tables.py
│   ├── test_user.py
│   └── test_users_access.py
│
├── docs/                      # Documentation
│   ├── QUICK_FIX_SUBJECTS.md
│   └── PROJECT_ORGANIZATION.md (this file)
│
└── utils/                     # Utility functions (empty for now)
```

## Key Changes

1. **Moved configuration** to `config/` folder
2. **Organized scripts** into logical categories
3. **Created dedicated folders** for:
   - `tests/` - All test files
   - `sql/` - All SQL files  
   - `docs/` - Documentation files
   - `utils/` - Utility functions (currently empty)
4. **Updated imports** to reflect new structure

## Running the Application

The application entry point remains `main.py` in the root directory.

```bash
cd Face_Reco
python main.py
```

## Import Updates

All imports of `Config` have been updated from:
```python
from config import Config
```
to:
```python
from config.config import Config
```

## Benefits

- **Cleaner root directory** - Only essential files remain
- **Better organization** - Files grouped by purpose
- **Easier navigation** - Logical folder structure
- **Scalable** - Easy to add new files to appropriate folders
- **Maintainable** - Clear separation of concerns