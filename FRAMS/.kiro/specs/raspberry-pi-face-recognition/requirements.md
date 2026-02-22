# Requirements Document

## Introduction

This document specifies the requirements for a complete Raspberry Pi ↔ Supabase integration system that enables automated face recognition attendance tracking. The system will run on a Raspberry Pi 3B+ in headless mode, using a USB webcam to capture and recognize student faces, then automatically record attendance in the Supabase backend. The system includes both attendance tracking and face registration capabilities, with optimized settings for edge computing on resource-constrained hardware.

## Glossary

- **Raspberry_Pi_System**: The complete Python application running on Raspberry Pi 3B+ hardware for face recognition and attendance tracking
- **Supabase_Backend**: The cloud database system storing student face encodings and attendance records
- **Face_Encoding**: A numerical representation of facial features stored as JSONB in the database
- **Service_Role_Key**: A server-side authentication key that bypasses Row Level Security for system operations
- **HOG_Model**: Histogram of Oriented Gradients face detection model optimized for CPU processing
- **Attendance_Record**: A database entry containing student_id, date, status, timestamp, and device_id
- **Face_Registration_Script**: A separate Python utility for capturing and storing student face encodings
- **Device_ID**: A unique identifier for each Raspberry Pi device in the system

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want the Raspberry Pi to securely connect to Supabase using service role authentication, so that the device can access student data and record attendance without exposing credentials to client code.

#### Acceptance Criteria

1. WHEN the Raspberry_Pi_System initializes, THE system SHALL authenticate with Supabase_Backend using the service_role_key
2. WHEN authentication occurs, THE system SHALL store credentials securely in environment variables and never expose them in source code
3. WHEN the connection is established, THE system SHALL verify database connectivity before proceeding with face recognition operations
4. WHEN authentication fails, THE system SHALL log the error and retry connection with exponential backoff
5. WHEN the system operates, THE service_role_key SHALL bypass Row Level Security policies to enable system-level database operations

### Requirement 2

**User Story:** As a system administrator, I want the system to fetch and cache student face encodings from Supabase, so that face recognition can be performed locally on the Raspberry Pi without requiring network calls for each recognition attempt.

#### Acceptance Criteria

1. WHEN the Raspberry_Pi_System starts, THE system SHALL retrieve all Face_Encoding data from the students table in Supabase_Backend
2. WHEN face encodings are retrieved, THE system SHALL cache them in local memory for fast access during recognition
3. WHEN the face encoding cache is empty, THE system SHALL log a warning and continue monitoring for new encodings
4. WHEN face encodings are updated in the database, THE system SHALL refresh the local cache periodically
5. WHEN network connectivity is lost, THE system SHALL continue operating with the cached face encodings

### Requirement 3

**User Story:** As a system operator, I want the Raspberry Pi to perform face recognition using Pi-optimized settings, so that the system can operate efficiently on resource-constrained hardware while maintaining acceptable accuracy.

#### Acceptance Criteria

1. WHEN face detection occurs, THE Raspberry_Pi_System SHALL use the HOG_Model for CPU-optimized processing
2. WHEN capturing video frames, THE system SHALL process images at 320x240 resolution to optimize performance
3. WHEN performing face recognition, THE system SHALL use a tolerance threshold of 0.6 for matching accuracy
4. WHEN multiple faces are detected, THE system SHALL process each face individually against the cached encodings
5. WHEN face recognition processing exceeds 5 seconds per frame, THE system SHALL skip the frame and continue with the next

### Requirement 4

**User Story:** As an attendance system, I want to match detected faces with stored student encodings, so that I can identify students and record their attendance automatically.

#### Acceptance Criteria

1. WHEN a face is detected in the video stream, THE Raspberry_Pi_System SHALL compare the Face_Encoding against all cached student encodings
2. WHEN a face matches a stored encoding within the tolerance threshold, THE system SHALL identify the corresponding student_id
3. WHEN no match is found, THE system SHALL log the unrecognized face event and continue monitoring
4. WHEN multiple potential matches are found, THE system SHALL select the match with the lowest distance score
5. WHEN face matching completes, THE system SHALL return the matched student_id or null if no match found

### Requirement 5

**User Story:** As an attendance tracking system, I want to insert attendance records into Supabase when students are recognized, so that their presence is automatically recorded in the database.

#### Acceptance Criteria

1. WHEN a student is successfully identified, THE Raspberry_Pi_System SHALL create an Attendance_Record in the Supabase_Backend
2. WHEN creating attendance records, THE system SHALL include student_id, current date, 'present' status, current timestamp, and Device_ID
3. WHEN inserting attendance records, THE system SHALL use the service_role_key to bypass Row Level Security policies
4. WHEN attendance insertion fails, THE system SHALL log the error and retry up to 3 times with exponential backoff
5. WHEN database connectivity is lost, THE system SHALL queue attendance records locally and sync when connection is restored

### Requirement 6

**User Story:** As an attendance system, I want to prevent duplicate attendance records for the same student on the same day, so that multiple face detections don't create redundant database entries.

#### Acceptance Criteria

1. WHEN checking for existing attendance, THE Raspberry_Pi_System SHALL query the attendance table for records matching student_id and current date
2. WHEN an attendance record already exists for the student and date, THE system SHALL skip creating a new record
3. WHEN no existing attendance record is found, THE system SHALL proceed with creating a new Attendance_Record
4. WHEN duplicate prevention fails due to database error, THE system SHALL log the error and attempt the operation once more
5. WHEN multiple Raspberry Pi devices are used, THE duplicate prevention SHALL work correctly across all devices

### Requirement 7

**User Story:** As a system administrator, I want a face registration script that captures and stores student face encodings in Supabase, so that new students can be enrolled in the face recognition system.

#### Acceptance Criteria

1. WHEN the Face_Registration_Script is executed, THE system SHALL prompt for student enrollment number and capture face images
2. WHEN face images are captured, THE system SHALL generate Face_Encoding data using the same algorithm as the recognition system
3. WHEN face encoding is generated, THE system SHALL store it in the students table face_encoding column as JSONB
4. WHEN storing face encodings, THE system SHALL use the service_role_key to update the Supabase_Backend
5. WHEN face registration completes successfully, THE system SHALL confirm the enrollment and provide the student_id

### Requirement 8

**User Story:** As a system maintainer, I want the code to be modular and readable with clear separation of concerns, so that the system can be easily maintained, debugged, and extended.

#### Acceptance Criteria

1. WHEN examining the codebase, THE Raspberry_Pi_System SHALL separate database operations, face recognition, and camera handling into distinct modules
2. WHEN reviewing the code structure, THE system SHALL include proper error handling, logging, and configuration management
3. WHEN reading the code, THE system SHALL include comprehensive docstrings and comments explaining complex operations
4. WHEN extending functionality, THE modular design SHALL allow adding new features without modifying core recognition logic
5. WHEN debugging issues, THE system SHALL provide detailed logging at appropriate levels (DEBUG, INFO, WARNING, ERROR)