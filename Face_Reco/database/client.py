"""
Supabase Client Wrapper
Provides database operations for the attendance system
"""
from supabase import create_client, Client
from typing import Optional, List, Dict, Any
from config.config import Config
import json


class SupabaseClient:
    """Singleton Supabase client wrapper"""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        config = Config()
        self._client: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
        self._initialized = True

    # ==================== VALIDATION HELPERS ====================

    def _validate_student_for_operation(
            self,
            student_id: str,
            check_face_encoding: bool = False
        ) -> Dict[str, Any]:
            """
            Validate student exists, is verified, and is active.

            Args:
                student_id: The student ID to validate
                check_face_encoding: If True, check if student already has a face encoding

            Returns:
                Dict with keys:
                    - valid (bool): Whether validation passed
                    - error (str): Error message if validation failed
                    - student (dict): Student data if validation passed
                    - requires_confirmation (bool): Optional, set if face encoding exists
            """
            try:
                # Query student first
                student_result = self.client.table('students').select(
                    'id, class_id, face_encoding'
                ).eq('id', student_id).execute()

                if not student_result.data:
                    return {"valid": False, "error": f"Student with ID {student_id} not found"}

                student = student_result.data[0]

                # Query user data separately
                user_result = self.client.table('users').select(
                    'is_verified, deleted_at'
                ).eq('id', student_id).execute()

                if not user_result.data:
                    return {"valid": False, "error": f"User record not found for student {student_id}"}

                user = user_result.data[0]

                # Check if user is verified
                if not user.get('is_verified', False):
                    return {"valid": False, "error": "Student is not verified. Please contact admin for approval."}

                # Check if user is active (not soft-deleted)
                if user.get('deleted_at') is not None:
                    return {"valid": False, "error": "Student account is inactive"}

                # Check for existing face encoding if requested
                if check_face_encoding and student.get('face_encoding') is not None:
                    return {
                        "valid": False,
                        "error": "Student already has a face encoding. Please use update mode or contact admin.",
                        "requires_confirmation": True
                    }

                return {"valid": True, "student": student}

            except Exception as e:
                print(f"Error validating student: {e}")
                return {"valid": False, "error": f"Validation error: {str(e)}"}

    def _validate_face_encoding(self, face_encoding: List[float]) -> Dict[str, Any]:
        """
        Validate face encoding has correct format and dimensions.

        Args:
            face_encoding: The face encoding array to validate

        Returns:
            Dict with keys:
                - valid (bool): Whether validation passed
                - error (str): Error message if validation failed
        """
        # Check if face_encoding is a list
        if not isinstance(face_encoding, list):
            return {"valid": False, "error": "Face encoding must be a list"}

        # Check if length is exactly 1404 (MediaPipe format)
        if len(face_encoding) != 1404:
            return {
                "valid": False,
                "error": f"Invalid face encoding dimensions. Expected 1404, got {len(face_encoding)}"
            }

        return {"valid": True}

    def _validate_class_id(self, class_id: str) -> Dict[str, Any]:
        """
        Validate class_id exists in classes table.

        Args:
            class_id: The class ID to validate

        Returns:
            Dict with keys:
                - valid (bool): Whether validation passed
                - error (str): Error message if validation failed
        """
        try:
            result = self.client.table('classes').select('id').eq('id', class_id).execute()

            if not result.data:
                return {"valid": False, "error": f"Class with ID {class_id} not found"}

            return {"valid": True}

        except Exception as e:
            print(f"Error validating class_id: {e}")
            return {"valid": False, "error": f"Validation error: {str(e)}"}

    # ==================== CORE METHODS ====================
    
    def _initialize(self):
        """Initialize Supabase client"""
        try:
            # Use positional arguments for supabase-py v2.x
            self._client = create_client(
                Config.SUPABASE_URL,
                Config.SUPABASE_KEY
            )
            print("✓ Supabase client initialized successfully")
        except Exception as e:
            print(f"✗ Failed to initialize Supabase client: {e}")
            # Don't raise - allow app to start even if DB connection fails
            self._client = None
    
    @property
    def client(self) -> Client:
        """Get the Supabase client instance"""
        if self._client is None:
            raise RuntimeError("Supabase client not initialized. Check your credentials in .env file")
        return self._client
    
    # ==================== STUDENT OPERATIONS ====================
    
    def get_all_students(self) -> List[Dict[str, Any]]:
        """Fetch all students with their face encodings"""
        try:
            # Specify the join path to avoid ambiguity
            response = self.client.table('students').select(
                'id, enrollment_number, class_level, branch, face_encoding, '
                'users!students_id_fkey(full_name, email)'
            ).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching students: {e}")
            return []
    
    def get_student_by_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single student by ID"""
        try:
            response = self.client.table('students').select(
                'id, enrollment_number, class_level, branch, face_encoding, '
                'users!students_id_fkey(full_name, email)'
            ).eq('id', student_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error fetching student: {e}")
            return None
    
    def get_students_with_face_encodings(self) -> List[Dict[str, Any]]:
        """Get all students who have face encodings registered"""
        try:
            response = self.client.table('students').select(
                'id, enrollment_number, face_encoding, '
                'users!students_id_fkey(full_name)'
            ).not_.is_('face_encoding', 'null').execute()
            return response.data
        except Exception as e:
            print(f"Error fetching students with encodings: {e}")
            return []
    
    # ==================== SUBJECT OPERATIONS ====================
    
    def get_all_subjects(self) -> List[Dict[str, Any]]:
        """Fetch all subjects"""
        try:
            response = self.client.table('subjects').select(
                'id, name, code, class_id, '
                'classes(name, academic_year)'
            ).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching subjects: {e}")
            return []
    
    def get_subjects_by_class(self, class_id: str) -> List[Dict[str, Any]]:
        """Fetch subjects for a specific class"""
        try:
            response = self.client.table('subjects').select(
                'id, name, code'
            ).eq('class_id', class_id).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching subjects for class: {e}")
            return []
    
    # ==================== CLASS OPERATIONS ====================
    
    def get_all_classes(self) -> List[Dict[str, Any]]:
        """Fetch all classes"""
        try:
            response = self.client.table('classes').select(
                'id, name, academic_year, is_active'
            ).eq('is_active', True).order('name').execute()
            return response.data
        except Exception as e:
            print(f"Error fetching classes: {e}")
            return []
    
    # ==================== ATTENDANCE OPERATIONS ====================
    
    def mark_attendance(
            self,
            student_id: str,
            subject_id: str,
            date: str,
            status: str = 'present'
        ) -> Dict[str, Any]:
            """
            Mark attendance for a student.

            Args:
                student_id: The student ID
                subject_id: The subject ID
                date: The attendance date in YYYY-MM-DD format
                status: The attendance status (default: 'present')

            Returns:
                Dict with keys:
                    - success (bool): Whether the operation succeeded
                    - data (dict): The attendance record if successful
                    - error (str): Error message if operation failed
                    - error_code (str): Error code for programmatic handling
            """
            try:
                # Validate date format and range
                from datetime import datetime, timedelta
                try:
                    attendance_date = datetime.strptime(date, '%Y-%m-%d')
                    current_date = datetime.now()

                    # Warn if date is more than 365 days in past or future
                    days_diff = abs((attendance_date - current_date).days)
                    if days_diff > 365:
                        print(f"Warning: Attendance date {date} is {days_diff} days from current date (outside typical academic year range)")
                except ValueError:
                    return {
                        "success": False,
                        "error": f"Invalid date format '{date}'. Expected YYYY-MM-DD",
                        "error_code": "INVALID_DATE_FORMAT"
                    }

                # Validate student exists and is verified
                student_validation = self._validate_student_for_operation(student_id, check_face_encoding=False)
                if not student_validation["valid"]:
                    error_msg = student_validation["error"]
                    # Determine error code based on error message
                    if "not found" in error_msg:
                        error_code = "STUDENT_NOT_FOUND"
                    elif "not verified" in error_msg:
                        error_code = "STUDENT_NOT_VERIFIED"
                    elif "inactive" in error_msg:
                        error_code = "STUDENT_INACTIVE"
                    else:
                        error_code = "VALIDATION_ERROR"

                    return {
                        "success": False,
                        "error": error_msg,
                        "error_code": error_code
                    }

                student = student_validation["student"]

                # Validate subject exists and get class_id
                subject_result = self.client.table('subjects').select('id, class_id').eq('id', subject_id).execute()

                if not subject_result.data:
                    return {
                        "success": False,
                        "error": f"Subject with ID {subject_id} not found",
                        "error_code": "SUBJECT_NOT_FOUND"
                    }

                subject = subject_result.data[0]

                # Validate enrollment: student's class_id must match subject's class_id
                student_class_id = student.get('class_id')
                subject_class_id = subject.get('class_id')

                if student_class_id != subject_class_id:
                    return {
                        "success": False,
                        "error": f"Student {student_id} (class {student_class_id}) is not enrolled in subject {subject_id} (class {subject_class_id})",
                        "error_code": "ENROLLMENT_MISMATCH"
                    }

                data = {
                    'student_id': student_id,
                    'subject_id': subject_id,
                    'date': date,
                    'status': status
                }

                # Upsert to handle duplicate entries
                response = self.client.table('attendance').upsert(
                    data,
                    on_conflict='student_id,subject_id,date'
                ).execute()

                return {"success": True, "data": response.data}
            except Exception as e:
                print(f"Error marking attendance: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "error_code": "DATABASE_ERROR"
                }
    
    def get_attendance_by_session(
        self,
        subject_id: str,
        date: str
    ) -> List[Dict[str, Any]]:
        """Get attendance records for a specific session"""
        try:
            response = self.client.table('attendance').select(
                'id, status, timestamp, '
                'students(enrollment_number, users(full_name))'
            ).eq('subject_id', subject_id).eq('date', date).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching attendance: {e}")
            return []
    
    def get_unregistered_students(self) -> List[Dict[str, Any]]:
        """Fetch students who don't have face encodings yet"""
        try:
            response = self.client.table('students').select(
                'id, enrollment_number, class_level, branch, '
                'users!students_id_fkey(full_name, email)'
            ).is_('face_encoding', 'null').execute()
            return response.data
        except Exception as e:
            print(f"Error fetching unregistered students: {e}")
            return []
    
    # ==================== AUTH & REGISTRATION ====================
    
    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user"""
        try:
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user:
                print(f"✓ Authentication successful for: {email}")
                # Check if verified Teacher or Admin
                user_data = self.get_user_by_email(email)
                print(f"User data fetched: {user_data}")
                
                if not user_data:
                    print("✗ User profile not found in users table")
                    return {"success": False, "error": "User profile not found"}
                
                if not user_data.get('is_verified'):
                    print(f"✗ Account not verified. is_verified={user_data.get('is_verified')}")
                    return {"success": False, "error": "Account pending verification by Admin"}
                
                user_role = user_data.get('role')
                print(f"User role: {user_role}")
                if user_role not in ['teacher', 'admin']:
                    print(f"✗ Role '{user_role}' not authorized. Only 'teacher' and 'admin' roles allowed.")
                    return {"success": False, "error": "Access restricted to Teachers and Admins"}
                
                print(f"✓ Login successful for {user_data.get('full_name')} ({user_role})")
                return {"success": True, "user": response.user, "profile": user_data}
            
            print("✗ Invalid credentials - authentication failed")
            return {"success": False, "error": "Invalid credentials"}
        except Exception as e:
            print(f"Login error: {e}")
            return {"success": False, "error": str(e)}

    def sign_out(self):
        """Sign out current user"""
        try:
            self.client.auth.sign_out()
        except Exception as e:
            # Log sign-out errors instead of silently suppressing them
            print(f"⚠️ sign_out warning: {e}")

    def enroll_student_face(
            self,
            student_id: str,
            face_encoding: List[float],
            enrollment_number: Optional[str] = None,
            class_id: Optional[str] = None
        ) -> Dict[str, Any]:
            """
            Enroll face data for an existing student.

            This function validates the student exists, is verified, is active, and doesn't
            already have a face encoding before updating the database.

            Args:
                student_id: The student ID to enroll face for
                face_encoding: The face encoding array (must be 1404 dimensions)
                enrollment_number: Optional enrollment number to update
                class_id: Optional class ID to update (must exist in classes table)

            Returns:
                Dict with keys:
                    - success (bool): Whether the operation succeeded
                    - data (dict): Student data if successful
                    - error (str): Error message if failed
                    - error_code (str): Error code if failed
            """
            try:
                # Validation 1: Check face_encoding dimensions (fast, no DB query)
                encoding_validation = self._validate_face_encoding(face_encoding)

                if not encoding_validation["valid"]:
                    return {
                        "success": False,
                        "error": encoding_validation["error"],
                        "error_code": "INVALID_FACE_ENCODING"
                    }

                # Validation 2: Check class_id exists (if provided) - fast DB query
                if class_id is not None:
                    class_validation = self._validate_class_id(class_id)

                    if not class_validation["valid"]:
                        return {
                            "success": False,
                            "error": class_validation["error"],
                            "error_code": "CLASS_NOT_FOUND"
                        }

                # Validation 3: Check student exists, is verified, is active, and has no face encoding
                student_validation = self._validate_student_for_operation(
                    student_id, 
                    check_face_encoding=True
                )

                if not student_validation["valid"]:
                    error_code = "STUDENT_NOT_FOUND"
                    if "not verified" in student_validation["error"]:
                        error_code = "STUDENT_NOT_VERIFIED"
                    elif "inactive" in student_validation["error"]:
                        error_code = "STUDENT_INACTIVE"
                    elif "already has a face encoding" in student_validation["error"]:
                        error_code = "DUPLICATE_FACE_ENCODING"

                    return {
                        "success": False,
                        "error": student_validation["error"],
                        "error_code": error_code,
                        "requires_confirmation": student_validation.get("requires_confirmation", False)
                    }

                # All validations passed - construct update data
                student_data = {
                    "face_encoding": {"encoding": face_encoding}
                }

                # Add optional fields if provided
                if enrollment_number:
                    student_data["enrollment_number"] = enrollment_number
                if class_id:
                    student_data["class_id"] = class_id

                # Update database
                response = self.client.table('students').update(
                    student_data
                ).eq('id', student_id).execute()

                return {
                    "success": True,
                    "data": response.data[0] if response.data else None,
                    "message": "Face enrollment successful"
                }

            except Exception as e:
                print(f"Error enrolling student: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "error_code": "DATABASE_ERROR"
                }

    def register_student(
            self,
            email: str,
            full_name: str,
            enrollment_number: str,
            class_id: str,
            face_encoding: List[float],
            password: Optional[str] = None
        ) -> Dict[str, Any]:
            """
            Register a new student with face encoding.

            This function creates a new auth user and student record with face data.
            It validates that the email is unique and the class exists before creating the user.

            Args:
                email: Student's email address (must be unique)
                full_name: Student's full name
                enrollment_number: Student's enrollment/roll number
                class_id: Foreign key reference to classes table
                face_encoding: MediaPipe face embedding (must be 1404 dimensions)
                password: Optional password (auto-generated if not provided)

            Returns:
                Dict with success status, user_id, and data or error message

            Requirements: 2.6, 2.5, 2.7, 2.14, 2.16
            """
            try:
                # Requirement 2.6: Check for duplicate email BEFORE creating auth user
                existing_user_check = self.client.table('users').select('id, email').eq('email', email).execute()
                if existing_user_check.data:
                    return {
                        "success": False,
                        "error": f"Email {email} already exists. Please use a different email or enroll face for existing student.",
                        "error_code": "DUPLICATE_EMAIL"
                    }

                # Requirement 2.5: Validate class_id exists
                class_validation = self._validate_class_id(class_id)
                if not class_validation["valid"]:
                    return {
                        "success": False,
                        "error": class_validation["error"],
                        "error_code": "CLASS_NOT_FOUND"
                    }

                # Requirement 2.7: Validate face_encoding dimensions
                encoding_validation = self._validate_face_encoding(face_encoding)
                if not encoding_validation["valid"]:
                    return {
                        "success": False,
                        "error": encoding_validation["error"],
                        "error_code": "INVALID_FACE_ENCODING"
                    }

                # Generate a secure random password if not provided
                import secrets
                import string

                if not password:
                    # Generate a secure random password
                    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
                    password = ''.join(secrets.choice(alphabet) for _ in range(16))

                # Validate password strength
                if len(password) < 8:
                    return {
                        "success": False,
                        "error": "Password must be at least 8 characters long",
                        "error_code": "INVALID_PASSWORD"
                    }

                # Check for common password patterns
                common_passwords = ["password", "123456", "qwerty", "admin", "welcome"]
                if password.lower() in common_passwords:
                    return {
                        "success": False,
                        "error": "Password is too common, please choose a stronger password",
                        "error_code": "WEAK_PASSWORD"
                    }

                # Create auth user with secure password
                auth_response = self.client.auth.sign_up({
                    "email": email,
                    "password": password,
                    "options": {
                        "data": {
                            "full_name": full_name,
                            "role": "student"
                        }
                    }
                })

                if not auth_response.user:
                    raise Exception("Failed to create auth user")

                user_id = auth_response.user.id

                student_data = {
                    "id": user_id,
                    "enrollment_number": enrollment_number,
                    "class_id": class_id,
                    "face_encoding": {"encoding": face_encoding}
                }

                response = self.client.table('students').upsert(student_data).execute()

                # Log success without exposing password
                print(f"✓ Student registered: {full_name} ({enrollment_number})")

                return {
                    "success": True,
                    "user_id": user_id,
                    "data": response.data[0] if response.data else None,
                    "message": "Student registered successfully. Password has been set."
                }

            except Exception as e:
                # Don't expose detailed error messages that might contain sensitive info
                error_msg = str(e)
                error_code = "REGISTRATION_FAILED"
                
                if "password" in error_msg.lower():
                    error_msg = "Registration failed due to password requirements"
                    error_code = "PASSWORD_ERROR"
                elif "email" in error_msg.lower():
                    error_code = "EMAIL_ERROR"
                elif "auth" in error_msg.lower():
                    error_code = "AUTH_ERROR"
                    
                print(f"Error registering student: {error_msg}")
                return {
                    "success": False,
                    "error": "Registration failed. Please check the provided information.",
                    "error_code": error_code
                }


    # ==================== USER OPERATIONS ====================
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Fetch user by email"""
        try:
            response = self.client.table('users').select(
                'id, email, role, full_name, is_verified'
            ).eq('email', email).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error fetching user: {e}")
            return None
