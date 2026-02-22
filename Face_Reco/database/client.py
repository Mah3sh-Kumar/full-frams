"""
Supabase Client Wrapper
Provides database operations for the attendance system
"""
from supabase import create_client, Client
from config.config import Config
from typing import Optional, List, Dict, Any
import json


class SupabaseClient:
    """Singleton Supabase client wrapper"""
    
    _instance: Optional['SupabaseClient'] = None
    _client: Optional[Client] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
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
    ) -> bool:
        """Mark attendance for a student"""
        try:
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
            
            return True
        except Exception as e:
            print(f"Error marking attendance: {e}")
            return False
    
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
        class_id: Optional[str] = None,
        class_level: Optional[str] = None,
        branch: Optional[str] = None
    ) -> Dict[str, Any]:
        """Enroll face data for an existing student"""
        try:
            student_data = {
                "face_encoding": {"encoding": face_encoding}
            }
            # Add optional fields if provided
            if enrollment_number: student_data["enrollment_number"] = enrollment_number
            if class_id: student_data["class_id"] = class_id
            if class_level: student_data["class_level"] = class_level
            if branch: student_data["branch"] = branch

            response = self.client.table('students').update(
                student_data
            ).eq('id', student_id).execute()
            
            return {
                "success": True,
                "data": response.data[0] if response.data else None
            }
        except Exception as e:
            print(f"Error enrolling student: {e}")
            return {"success": False, "error": str(e)}

    def register_student(
        self,
        email: str,
        full_name: str,
        enrollment_number: str,
        class_id: str,
        class_level: str,
        branch: str,
        face_encoding: List[float],
        password: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Legacy registration flow (creates a new student if they don't exist)
        Note: The user's other app might have already created the student.
        """
        try:
            # Check if student already exists in users table
            existing_user = self.get_user_by_email(email)
            if existing_user:
                return self.enroll_student_face(
                    existing_user['id'],
                    face_encoding,
                    enrollment_number,
                    class_id,
                    class_level,
                    branch
                )

            # If not, create a placeholder student (optional, based on requirement)
            # For now, let's stick to the prompt's request to restrict to Verified Teachers
            # and assume students are often pre-created.
            
            # NOTE: sign_up might be restricted in Supabase or require specific config
            # We should not create auth users without proper password handling
            # Instead, we should create a student record without auth user
            # and let the admin handle password setup
            
            # Generate a secure random password if not provided
            import secrets
            import string
            
            if not password:
                # Generate a secure random password
                alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
                password = ''.join(secrets.choice(alphabet) for _ in range(16))
            
            # Validate password strength
            if len(password) < 8:
                return {"success": False, "error": "Password must be at least 8 characters long"}
            
            # Check for common password patterns
            common_passwords = ["password", "123456", "qwerty", "admin", "welcome"]
            if password.lower() in common_passwords:
                return {"success": False, "error": "Password is too common, please choose a stronger password"}
            
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
                "class_level": class_level,
                "branch": branch,
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
            if "password" in error_msg.lower():
                error_msg = "Registration failed due to password requirements"
            print(f"Error registering student: {error_msg}")
            return {"success": False, "error": "Registration failed. Please check the provided information."}

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
