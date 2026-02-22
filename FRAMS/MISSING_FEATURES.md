# Codebase & Database Analysis Report

After a thorough review of the `FRAMS` React Native application and the `FaceRecognition` Python module, here are the findings regarding missing features, functions, and database structure.

## 1. Missing Database Tables

To support a robust, production-ready system, the following tables are missing and have been added to the proposed `FINAL_DB_SCHEMA.sql`:

1.  **`devices`**:
    *   *Purpose*: To manage and authenticate the Raspberry Pi units used for Face Recognition.
    *   *Current State*: The system accepts any string as `device_id`.
    *   *Improvement*: A table to register legitimate devices with an API key/secret.
2.  **`audit_logs`**:
    *   *Purpose*: To track critical actions (e.g., changing grades, un-verifying users, changing global settings) for accountability.
    *   *Current State*: No audit trail.
3.  **`system_settings`**:
    *   *Purpose*: To store global configuration (e.g., "Allow Student Signups", "Current Academic Year") without hardcoding them in the app.

## 2. Missing Features & Functions

### Backend (Supabase/SQL)
*   **Device Authentication**: A secure function to verify if a Raspberry Pi is allowed to post attendance.
*   **Face Encoding Integrity**: Constraints to ensure `face_encoding` is a valid 128-float array (hard to do strictly in SQL, but verifiable via API).
*   **Auto-Grading**: Triggers to automatically update "Average Score" or "Grade" based on assignment scores.

### Frontend (React Native)
*   **Device Management Screen**: An Admin screen to Add/Remove/Block Raspberry Pi devices.
*   **Audit Log Viewer**: An Admin screen to see who did what.
*   **Conflicting Data Models**: The app uses `org_classes` (Organization Manager) for setup but queries the legacy `classes` table for some subject/student relationships.
    *   *Recommendation*: In the long run, migrate fully to `org_classes` and add an `academic_year` column to it, deprecating the `classes` table. For now, the schema includes both to prevent breaking changes.

## 3. Discrepancies
*   **Students Table**: Contains `class_id` (UUID) AND `class_level` (Text). This allows for inconsistent states (e.g., `class_id` points to "Class 10" but `class_level` says "Class 9").
    *   *Fix*: The schema keeps them but you should treat `class_id` as the source of truth if populated.

## 4. Security Recommendations
*   **RLS Policies**: The proposed schema includes robust Row Level Security (RLS) to ensure Students cannot edit their own attendance or grades.
*   **Device Secrets**: The `devices` table enables a "Secret Key" mechanism so only your specific Pis can write to the DB.
