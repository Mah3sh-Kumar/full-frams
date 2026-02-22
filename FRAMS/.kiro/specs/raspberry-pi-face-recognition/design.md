# Design Document

## Overview

The Raspberry Pi Face Recognition Attendance System is a distributed edge computing solution that combines local face recognition processing with cloud-based data storage. The system runs on Raspberry Pi 3B+ hardware in headless mode, using a USB webcam to capture video streams, perform real-time face recognition using the face_recognition library (dlib), and automatically record attendance in a Supabase PostgreSQL database.

The architecture prioritizes security by using service role authentication, performance optimization through local caching and Pi-specific settings, and reliability through comprehensive error handling and retry mechanisms. The system includes both a main attendance tracking application and a separate face registration utility for enrolling new students.

## Architecture

The system follows a modular, event-driven architecture with clear separation between hardware interface, computer vision processing, and database operations:

```
┌─────────────────────────────────────────────────────────────┐
│                    Raspberry Pi 3B+                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Camera        │  │  Face Recognition│  │   Database   │ │
│  │   Module        │  │     Module       │  │    Module    │ │
│  │                 │  │                 │  │              │ │
│  │ • USB Webcam    │  │ • face_recognition│  │ • Supabase   │ │
│  │ • OpenCV        │  │ • dlib/HOG       │  │ • Service    │ │
│  │ • Frame Capture │  │ • Encoding Cache │  │   Role Auth  │ │
│  │ • Preprocessing │  │ • Face Matching  │  │ • Attendance │ │
│  └─────────────────┘  └─────────────────┘  │   Records    │ │
│           │                     │          └──────────────┘ │
│           └─────────┬───────────┘                   │       │
│                     │                               │       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Main Controller                            │ │
│  │  • Event Loop Management                               │ │
│  │  • Error Handling & Retry Logic                       │ │
│  │  • Logging & Monitoring                               │ │
│  │  • Configuration Management                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Cloud                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   PostgreSQL    │  │   Row Level     │  │   Service    │ │
│  │   Database      │  │   Security      │  │   Role API   │ │
│  │                 │  │                 │  │              │ │
│  │ • students      │  │ • User Policies │  │ • Bypass RLS │ │
│  │ • attendance    │  │ • Role-based    │  │ • System     │ │
│  │ • face_encoding │  │   Access        │  │   Operations │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Camera Module (`camera_handler.py`)
**Purpose**: Manages USB webcam interface and video stream processing
**Key Functions**:
- `initialize_camera()`: Configure webcam with optimal settings for Pi
- `capture_frame()`: Capture and preprocess video frames
- `release_camera()`: Cleanup camera resources

**Interface**:
```python
class CameraHandler:
    def __init__(self, resolution=(320, 240), fps=10)
    def capture_frame() -> np.ndarray
    def is_available() -> bool
    def release()
```

### 2. Face Recognition Module (`face_recognition_handler.py`)
**Purpose**: Handles all computer vision operations including face detection, encoding, and matching
**Key Functions**:
- `detect_faces(frame)`: Detect faces in video frame using HOG model
- `encode_face(face_image)`: Generate face encoding from detected face
- `match_faces(unknown_encoding, known_encodings)`: Compare face against database
- `load_encodings_cache()`: Load and cache student face encodings

**Interface**:
```python
class FaceRecognitionHandler:
    def __init__(self, tolerance=0.6, model='hog')
    def detect_faces(frame: np.ndarray) -> List[Tuple]
    def encode_faces(frame: np.ndarray, face_locations: List) -> List[np.ndarray]
    def match_face(unknown_encoding: np.ndarray) -> Optional[str]
    def update_encodings_cache(encodings: Dict[str, np.ndarray])
```

### 3. Database Module (`database_handler.py`)
**Purpose**: Manages all Supabase database operations with service role authentication
**Key Functions**:
- `connect()`: Establish authenticated connection to Supabase
- `fetch_student_encodings()`: Retrieve all face encodings from students table
- `insert_attendance()`: Create new attendance record
- `check_existing_attendance()`: Verify if attendance already recorded today

**Interface**:
```python
class DatabaseHandler:
    def __init__(self, supabase_url: str, service_key: str, device_id: str)
    def connect() -> bool
    def fetch_student_encodings() -> Dict[str, np.ndarray]
    def insert_attendance(student_id: str, status: str = 'present') -> bool
    def check_existing_attendance(student_id: str, date: str) -> bool
```

### 4. Main Controller (`main.py`)
**Purpose**: Orchestrates the entire attendance system with event loop management
**Key Functions**:
- `initialize_system()`: Setup all modules and verify connectivity
- `process_frame()`: Main processing pipeline for each video frame
- `handle_recognition()`: Process recognized faces and record attendance
- `run_attendance_loop()`: Main event loop with error handling

**Interface**:
```python
class AttendanceSystem:
    def __init__(self, config: Dict)
    def initialize() -> bool
    def run() -> None
    def shutdown() -> None
```

### 5. Face Registration Script (`register_faces.py`)
**Purpose**: Standalone utility for enrolling new students in the system
**Key Functions**:
- `capture_student_photos()`: Interactive photo capture session
- `generate_encoding()`: Create face encoding from captured photos
- `store_encoding()`: Save encoding to Supabase students table

## Data Models

### Face Encoding Storage
Face encodings are stored in the `students.face_encoding` JSONB column:
```json
{
  "encoding": [0.123, -0.456, 0.789, ...],  // 128-dimensional array
  "created_at": "2024-12-21T10:30:00Z",
  "device_registered": "pi_device_001",
  "confidence_score": 0.95
}
```

### Attendance Record Structure
Attendance records follow the existing database schema:
```sql
INSERT INTO attendance (
    student_id,     -- UUID reference to students.id
    date,          -- DATE (YYYY-MM-DD)
    status,        -- 'present', 'absent', 'late'
    timestamp,     -- TIMESTAMP WITH TIME ZONE
    device_id      -- TEXT identifier for Pi device
)
```

### Configuration Model
System configuration stored in `config.json`:
```json
{
  "supabase": {
    "url": "https://your-project.supabase.co",
    "service_role_key": "eyJ..."
  },
  "camera": {
    "resolution": [320, 240],
    "fps": 10,
    "device_index": 0
  },
  "face_recognition": {
    "model": "hog",
    "tolerance": 0.6,
    "max_processing_time": 5.0
  },
  "system": {
    "device_id": "pi_device_001",
    "cache_refresh_interval": 300,
    "log_level": "INFO"
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*
Based on the prework analysis, I'll now define the key correctness properties that must hold for this system:

**Property 1: Authentication consistency**
*For any* valid service role key and Supabase URL, system initialization should successfully authenticate and verify database connectivity before proceeding with face recognition operations
**Validates: Requirements 1.1, 1.3**

**Property 2: Credential security**
*For any* system configuration, credentials should never be hardcoded in source code and should always be loaded from environment variables
**Validates: Requirements 1.2**

**Property 3: Face encoding cache consistency**
*For any* system startup, all available face encodings from the students table should be retrieved and cached in local memory for recognition operations
**Validates: Requirements 2.1, 2.2**

**Property 4: Offline operation continuity**
*For any* network disconnection event, the system should continue face recognition operations using cached encodings and queue attendance records for later synchronization
**Validates: Requirements 2.5, 5.5**

**Property 5: Pi-optimized processing parameters**
*For any* face detection and recognition operation, the system should use HOG model, 320x240 resolution, and 0.6 tolerance threshold consistently
**Validates: Requirements 3.1, 3.2, 3.3**

**Property 6: Face matching completeness**
*For any* detected face, the system should compare it against all cached student encodings and return either a valid student_id or null
**Validates: Requirements 4.1, 4.5**

**Property 7: Attendance record structure**
*For any* successful student identification, the created attendance record should include student_id, current date, 'present' status, timestamp, and device_id
**Validates: Requirements 5.1, 5.2**

**Property 8: Duplicate prevention**
*For any* student and date combination, only one attendance record should exist regardless of how many times the student is recognized that day
**Validates: Requirements 6.1, 6.2, 6.3**

**Property 9: Registration algorithm consistency**
*For any* face image, the encoding generated by the registration script should be compatible with the recognition system's matching algorithm
**Validates: Requirements 7.2**

**Property 10: Error handling and retry behavior**
*For any* system operation failure, appropriate error logging should occur and retry mechanisms should follow exponential backoff patterns
**Validates: Requirements 1.4, 5.4, 6.4**

## Error Handling

The system implements comprehensive error handling across all modules:

### Database Connection Errors
- **Connection Failures**: Exponential backoff retry (1s, 2s, 4s, 8s, max 60s)
- **Query Timeouts**: Log error, retry operation up to 3 times
- **Authentication Errors**: Log critical error, attempt re-authentication
- **Network Disconnection**: Switch to offline mode, queue operations

### Camera Hardware Errors
- **Camera Not Found**: Log error, retry initialization every 30 seconds
- **Frame Capture Failure**: Skip frame, continue with next capture
- **USB Disconnection**: Attempt camera re-initialization
- **Low Light Conditions**: Log warning, continue operation

### Face Recognition Errors
- **No Faces Detected**: Continue monitoring, no error logged
- **Encoding Generation Failure**: Log warning, skip frame
- **Processing Timeout**: Skip frame after 5 seconds, log performance warning
- **Memory Issues**: Clear cache, reload encodings, log memory warning

### Configuration Errors
- **Missing Environment Variables**: Log critical error, exit gracefully
- **Invalid Configuration Values**: Use defaults, log warning
- **File Permission Issues**: Log error with suggested fix

## Testing Strategy

The testing approach combines unit testing for individual components with property-based testing for system-wide correctness guarantees.

### Unit Testing Approach
Unit tests will verify specific functionality and edge cases:
- Database connection and query operations
- Face encoding generation and comparison
- Camera initialization and frame capture
- Configuration loading and validation
- Error handling for specific failure scenarios

### Property-Based Testing Approach
Property-based tests will verify universal properties using **Hypothesis** (Python PBT library):
- **Minimum 100 iterations** per property test to ensure statistical confidence
- **Random test data generation** for face encodings, student IDs, and system configurations
- **Invariant verification** across different input combinations
- **Error injection testing** to verify retry and recovery mechanisms

Each property-based test will be tagged with comments referencing the design document:
- Format: `# Feature: raspberry-pi-face-recognition, Property {number}: {property_text}`
- This ensures traceability between requirements, design properties, and test implementation

### Integration Testing
- End-to-end testing with mock Supabase database
- Camera simulation for consistent test environments
- Multi-device simulation for duplicate prevention testing
- Network failure simulation for offline operation testing

## Security Considerations

### Authentication Security
- Service role key stored in environment variables only
- No credentials in source code or configuration files
- Key rotation support through environment variable updates
- Connection encryption enforced for all database operations

### Data Privacy
- Face encodings stored as mathematical representations, not images
- Local processing ensures video streams never leave the device
- Attendance data includes only necessary identification information
- Compliance with data retention policies through configurable cleanup

### Network Security
- HTTPS/TLS encryption for all Supabase communications
- Certificate validation for API endpoints
- Firewall configuration recommendations for Pi deployment
- VPN support for secure remote management

### Physical Security
- Headless operation prevents unauthorized local access
- SSH key-based authentication for remote management
- Camera positioning guidelines to prevent tampering
- Device identification for multi-Pi deployments

## Deployment Architecture

### Hardware Requirements
- **Raspberry Pi 3B+** (minimum) with 1GB RAM
- **USB Webcam** with 720p capability (processed at 320x240)
- **MicroSD Card** 32GB Class 10 for OS and local storage
- **Network Connection** via Ethernet or WiFi
- **Power Supply** 5V 2.5A for stable operation

### Software Stack
- **Raspberry Pi OS Lite** (headless, no desktop environment)
- **Python 3.9+** with virtual environment
- **OpenCV 4.5+** for camera operations
- **dlib** with face_recognition library
- **supabase-py** for database connectivity
- **systemd** for service management and auto-start

### Directory Structure
```
/opt/attendance-system/
├── src/
│   ├── main.py                 # Main attendance system
│   ├── camera_handler.py       # Camera operations
│   ├── face_recognition_handler.py  # Face recognition
│   ├── database_handler.py     # Supabase operations
│   └── config.py              # Configuration management
├── scripts/
│   ├── register_faces.py      # Face registration utility
│   ├── install.sh            # System installation
│   └── setup_service.sh      # Systemd service setup
├── config/
│   ├── config.json           # System configuration
│   └── .env                  # Environment variables
├── logs/
│   ├── attendance.log        # Application logs
│   └── system.log           # System-level logs
├── cache/
│   └── offline_queue.json   # Offline attendance queue
└── tests/
    ├── unit/                # Unit tests
    ├── property/            # Property-based tests
    └── integration/         # Integration tests
```

### Service Configuration
The system runs as a systemd service for automatic startup and management:

```ini
[Unit]
Description=Face Recognition Attendance System
After=network.target
Wants=network.target

[Service]
Type=simple
User=attendance
WorkingDirectory=/opt/attendance-system
ExecStart=/opt/attendance-system/venv/bin/python src/main.py
Restart=always
RestartSec=10
Environment=PYTHONPATH=/opt/attendance-system/src

[Install]
WantedBy=multi-user.target
```

### Monitoring and Maintenance
- **Log rotation** configured for disk space management
- **Health check endpoint** for system monitoring
- **Performance metrics** logged for optimization
- **Remote update capability** through SSH and git
- **Backup procedures** for configuration and logs

This design provides a robust, secure, and maintainable solution for automated attendance tracking using edge computing principles and cloud database integration.