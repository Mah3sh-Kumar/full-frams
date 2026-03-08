"""
Enhanced Face Encoding Registration Service
Implements the complete workflow for student face registration with validation
"""
import cv2
import numpy as np
import json
import hashlib
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import logging

from .face_detector import FaceDetector
from .face_recognizer import FaceRecognizer
from .face_encoding_service import FaceEncodingService
from .encryption_service import FaceEncodingEncryption
from database import SupabaseClient
from config.config import Config

logger = logging.getLogger(__name__)


class RegistrationStatus(Enum):
    """Registration status codes"""
    SUCCESS = "success"
    PENDING = "pending"
    FAILED = "failed"
    DUPLICATE = "duplicate"
    VALIDATION_ERROR = "validation_error"
    CAMERA_ERROR = "camera_error"
    FACE_DETECTION_ERROR = "face_detection_error"


class FaceQuality(Enum):
    """Face quality assessment levels"""
    EXCELLENT = "excellent"      # Perfect lighting, single face, good angle
    GOOD = "good"                # Minor issues but acceptable
    FAIR = "fair"                # Some issues, may affect accuracy
    POOR = "poor"                # Significant issues, should retry
    REJECT = "reject"            # Unacceptable, must retry


@dataclass
class FaceCaptureResult:
    """Result of face capture attempt"""
    success: bool
    frame: Optional[np.ndarray] = None
    face_region: Optional[np.ndarray] = None
    bounding_box: Optional[Tuple[int, int, int, int]] = None
    quality_score: float = 0.0
    quality_level: FaceQuality = FaceQuality.REJECT
    issues: List[str] = None
    confidence: float = 0.0
    
    def __post_init__(self):
        if self.issues is None:
            self.issues = []


@dataclass
class StudentVerificationResult:
    """Result of student verification"""
    valid: bool
    student_id: Optional[str] = None
    student_data: Optional[Dict] = None
    error: Optional[str] = None
    requires_confirmation: bool = False
    is_verified: bool = False
    has_encoding: bool = False


class FaceRegistrationService:
    """
    Comprehensive face registration service implementing the complete workflow:
    1. Department → Branch → Academic Year → Class → Student selection
    2. Student verification check
    3. Multi-frame face capture with quality assessment
    4. Face encoding generation and validation
    5. Secure storage with encryption
    6. Duplicate prevention
    """
    
    def __init__(self):
        """Initialize the registration service"""
        self.db = SupabaseClient()
        self.face_detector = FaceDetector()
        self.face_recognizer = FaceRecognizer()
        self.encoding_service = FaceEncodingService()
        self.encryption_service = FaceEncodingEncryption()
        
        # Configuration
        self.min_face_size = (100, 100)  # Minimum face size in pixels
        self.max_face_size = (400, 400)  # Maximum face size in pixels
        self.required_frames = 5         # Number of frames to capture
        self.min_quality_score = 0.7     # Minimum quality score for acceptance
        self.duplicate_threshold = 0.85  # Threshold for duplicate detection
        
        logger.info("Face Registration Service initialized")
    
    # ==================== HIERARCHICAL SELECTION METHODS ====================
    
    def get_departments(self) -> List[Dict[str, Any]]:
        """
        Get all departments from database
        
        Returns:
            List of department dictionaries
        """
        try:
            # Query org_departments table (not departments)
            response = self.db.client.table('org_departments').select(
                'id, name, code, is_active'
            ).eq('is_active', True).order('name').execute()
            print(f"Departments query returned: {len(response.data)} records")
            return response.data
        except Exception as e:
            logger.warning(f"Departments table not found or error: {e}")
            print(f"Error fetching departments: {e}")
            import traceback
            traceback.print_exc()
            return []  # Return empty list if table doesn't exist
    
    def get_branches_by_department(self, department_id: str) -> List[Dict[str, Any]]:
        """
        Get branches for a specific department using the hierarchical structure
        
        Args:
            department_id: Department ID to filter branches
            
        Returns:
            List of active branch dictionaries for the specified department
        """
        try:
            # Use the database function for proper hierarchical filtering
            response = self.db.client.rpc('get_branches_by_department', {
                'dept_id': department_id
            }).execute()
            
            logger.info(f"Loaded {len(response.data)} branches for department {department_id}")
            return response.data
            
        except Exception as e:
            logger.error(f"Error fetching branches for department {department_id}: {e}")
            # Fallback to direct query if function doesn't exist
            try:
                response = self.db.client.table('branches').select(
                    'id, name, code, display_order, is_active'
                ).eq('department_id', department_id).eq('is_active', True).order('display_order').execute()
                return response.data
            except Exception as fallback_error:
                logger.error(f"Fallback query also failed: {fallback_error}")
                return []
    
    def get_all_branches(self) -> List[Dict[str, Any]]:
        """
        Get all branches from database
        
        Returns:
            List of branch dictionaries
        """
        try:
            response = self.db.client.table('branches').select(
                'id, name, code, class_id, is_active'
            ).eq('is_active', True).order('name').execute()
            return response.data
        except Exception as e:
            logger.warning(f"Branches table not found or error: {e}")
            return []
    
    def get_academic_years(self) -> List[Dict[str, Any]]:
        """
        Get all academic years
        
        Returns:
            List of academic year dictionaries
        """
        try:
            response = self.db.client.table('academic_years').select(
                'id, name, start_date, end_date, is_current'
            ).order('start_date', desc=True).execute()
            print(f"Academic years query returned: {len(response.data)} records")
            return response.data
        except Exception as e:
            logger.error(f"Error fetching academic years: {e}")
            print(f"Error fetching academic years: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_classes_by_filters(
        self, 
        department_id: Optional[str] = None,
        branch_id: Optional[str] = None,
        academic_year_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get classes filtered by department, branch, and academic year
        
        Args:
            department_id: Optional department filter (used via branch filtering)
            branch_id: Optional branch filter
            academic_year_id: Optional academic year filter
            
        Returns:
            List of class dictionaries
        """
        try:
            # Use the database function if branch_id is provided
            if branch_id:
                response = self.db.client.rpc('get_classes_by_branch', {
                    'branch_id_param': branch_id
                }).execute()
                
                # Filter by academic year if provided
                if academic_year_id:
                    year_response = self.db.client.table('academic_years').select(
                        'name'
                    ).eq('id', academic_year_id).execute()
                    
                    if year_response.data:
                        year_name = year_response.data[0]['name']
                        response.data = [c for c in response.data if c.get('academic_year') == year_name]
                
                return response.data
            
            # Fallback to basic query if no branch specified
            query = self.db.client.table('classes').select(
                'id, name, academic_year, value, display_order, is_active'
            ).eq('is_active', True)
            
            # Filter by academic year if provided
            if academic_year_id:
                year_response = self.db.client.table('academic_years').select(
                    'name'
                ).eq('id', academic_year_id).execute()
                
                if year_response.data:
                    year_name = year_response.data[0]['name']
                    query = query.eq('academic_year', year_name)
            
            response = query.order('display_order').execute()
            return response.data
            
        except Exception as e:
            logger.error(f"Error fetching classes: {e}")
            return []
    
    def get_students_by_class(
        self, 
        class_id: str,
        include_verified_only: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get students for a specific class using the hierarchical structure
        
        Args:
            class_id: Class ID
            include_verified_only: If True, only include verified students
            
        Returns:
            List of student dictionaries with user details
        """
        try:
            # Use the database function for consistent results
            response = self.db.client.rpc('get_students_by_class', {
                'class_id_param': class_id
            }).execute()
            
            # Filter for verified students if requested
            if include_verified_only:
                # The function returns students with user details
                # We need to check if they're verified (this should be added to the function)
                # For now, fetch verification status separately
                students = response.data
                verified_students = []
                
                for student in students:
                    user_response = self.db.client.table('users').select(
                        'is_verified'
                    ).eq('id', student['id']).execute()
                    
                    if user_response.data and user_response.data[0].get('is_verified'):
                        verified_students.append(student)
                
                return verified_students
            
            return response.data
            
        except Exception as e:
            logger.error(f"Error fetching students for class {class_id}: {e}")
            # Fallback to direct query
            try:
                query = self.db.client.table('students').select(
                    'id, enrollment_number, class_id, face_encoding, '
                    'users!students_id_fkey(id, full_name, email, is_verified, role)'
                ).eq('class_id', class_id)
                
                if include_verified_only:
                    query = query.eq('users.is_verified', True)
                
                response = query.order('enrollment_number').execute()
                return response.data
            except Exception as fallback_error:
                logger.error(f"Fallback query also failed: {fallback_error}")
                return []
    
    # ==================== STUDENT VERIFICATION ====================
    
    def verify_student_for_registration(
        self, 
        student_id: str
    ) -> StudentVerificationResult:
        """
        Comprehensive student verification for face registration
        
        Args:
            student_id: Student ID to verify
            
        Returns:
            StudentVerificationResult with validation details
        """
        try:
            # Get student data with user information
            student_data = self.db.get_student_by_id(student_id)
            if not student_data:
                return StudentVerificationResult(
                    valid=False,
                    error=f"Student with ID {student_id} not found"
                )
            
            # Extract user data
            user_data = student_data.get('users', {})
            if not user_data:
                return StudentVerificationResult(
                    valid=False,
                    error="User record not found for student"
                )
            
            # Check 1: Is student verified?
            is_verified = user_data.get('is_verified', False)
            if not is_verified:
                return StudentVerificationResult(
                    valid=False,
                    student_id=student_id,
                    student_data=student_data,
                    error="Student is not verified. Please contact admin for approval.",
                    is_verified=False
                )
            
            # Check 2: Is student active (not soft-deleted)?
            if user_data.get('deleted_at') is not None:
                return StudentVerificationResult(
                    valid=False,
                    student_id=student_id,
                    student_data=student_data,
                    error="Student account is inactive",
                    is_verified=True
                )
            
            # Check 3: Does student already have face encoding?
            has_encoding = student_data.get('face_encoding') is not None
            if has_encoding:
                return StudentVerificationResult(
                    valid=False,
                    student_id=student_id,
                    student_data=student_data,
                    error="Student already has a face encoding registered",
                    is_verified=True,
                    has_encoding=True,
                    requires_confirmation=True
                )
            
            # All checks passed
            return StudentVerificationResult(
                valid=True,
                student_id=student_id,
                student_data=student_data,
                is_verified=True,
                has_encoding=False
            )
            
        except Exception as e:
            logger.error(f"Error verifying student: {e}")
            return StudentVerificationResult(
                valid=False,
                error=f"Verification error: {str(e)}"
            )
    
    # ==================== FACE CAPTURE AND QUALITY ASSESSMENT ====================
    
    def capture_face_frame(
        self, 
        frame: np.ndarray
    ) -> FaceCaptureResult:
        """
        Capture and assess quality of a single face frame
        
        Args:
            frame: Input frame from camera
            
        Returns:
            FaceCaptureResult with quality assessment
        """
        try:
            # Detect faces in the frame
            faces = self.face_detector.detect_faces(frame)
            
            # Check 1: Exactly one face detected
            if len(faces) == 0:
                return FaceCaptureResult(
                    success=False,
                    issues=["No face detected"]
                )
            
            if len(faces) > 1:
                return FaceCaptureResult(
                    success=False,
                    issues=[f"Multiple faces detected ({len(faces)})"]
                )
            
            # Get the single face bounding box
            bbox = faces[0]
            x, y, w, h = bbox
            
            # Check 2: Face size within acceptable range
            if w < self.min_face_size[0] or h < self.min_face_size[1]:
                return FaceCaptureResult(
                    success=False,
                    bounding_box=bbox,
                    issues=["Face too small - move closer to camera"]
                )
            
            if w > self.max_face_size[0] or h > self.max_face_size[1]:
                return FaceCaptureResult(
                    success=False,
                    bounding_box=bbox,
                    issues=["Face too large - move further from camera"]
                )
            
            # Extract face region
            face_region = self.face_detector.extract_face_region(frame, bbox)
            if face_region is None:
                return FaceCaptureResult(
                    success=False,
                    bounding_box=bbox,
                    issues=["Failed to extract face region"]
                )
            
            # Assess face quality
            quality_score, quality_level, issues = self._assess_face_quality(
                frame, face_region, bbox
            )
            
            # Calculate confidence based on quality
            confidence = min(1.0, quality_score * 1.2)  # Scale up slightly
            
            return FaceCaptureResult(
                success=True,
                frame=frame.copy(),
                face_region=face_region,
                bounding_box=bbox,
                quality_score=quality_score,
                quality_level=quality_level,
                issues=issues,
                confidence=confidence
            )
            
        except Exception as e:
            logger.error(f"Error capturing face frame: {e}")
            return FaceCaptureResult(
                success=False,
                issues=[f"Capture error: {str(e)}"]
            )
    
    def _assess_face_quality(
        self, 
        frame: np.ndarray, 
        face_region: np.ndarray, 
        bbox: Tuple[int, int, int, int]
    ) -> Tuple[float, FaceQuality, List[str]]:
        """
        Assess the quality of a detected face
        
        Args:
            frame: Original frame
            face_region: Cropped face region
            bbox: Face bounding box
            
        Returns:
            Tuple of (quality_score, quality_level, issues)
        """
        issues = []
        score_factors = []
        
        x, y, w, h = bbox
        frame_h, frame_w = frame.shape[:2]
        
        # Factor 1: Face position in frame (center is best)
        center_x = x + w/2
        center_y = y + h/2
        frame_center_x = frame_w / 2
        frame_center_y = frame_h / 2
        
        # Calculate distance from center (normalized)
        dist_x = abs(center_x - frame_center_x) / frame_w
        dist_y = abs(center_y - frame_center_y) / frame_h
        center_distance = np.sqrt(dist_x**2 + dist_y**2)
        
        if center_distance > 0.3:
            issues.append("Face not centered")
            score_factors.append(0.6)
        elif center_distance > 0.15:
            score_factors.append(0.8)
        else:
            score_factors.append(1.0)
        
        # Factor 2: Face size ratio (ideal is 20-30% of frame area)
        face_area = w * h
        frame_area = frame_w * frame_h
        face_ratio = face_area / frame_area
        
        if face_ratio < 0.1:
            issues.append("Face too small in frame")
            score_factors.append(0.5)
        elif face_ratio < 0.15:
            score_factors.append(0.7)
        elif face_ratio > 0.4:
            issues.append("Face too large in frame")
            score_factors.append(0.6)
        elif face_ratio > 0.3:
            score_factors.append(0.8)
        else:
            score_factors.append(1.0)  # Ideal 15-30%
        
        # Factor 3: Face aspect ratio (should be roughly square)
        aspect_ratio = w / h
        if aspect_ratio < 0.7 or aspect_ratio > 1.3:
            issues.append("Face at extreme angle")
            score_factors.append(0.6)
        elif aspect_ratio < 0.8 or aspect_ratio > 1.2:
            score_factors.append(0.8)
        else:
            score_factors.append(1.0)  # Ideal 0.8-1.2
        
        # Factor 4: Image brightness/contrast
        gray_face = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray_face)
        contrast = np.std(gray_face)
        
        if brightness < 50:
            issues.append("Face too dark")
            score_factors.append(0.5)
        elif brightness < 80:
            score_factors.append(0.7)
        elif brightness > 200:
            issues.append("Face overexposed")
            score_factors.append(0.6)
        elif brightness > 180:
            score_factors.append(0.8)
        else:
            score_factors.append(1.0)  # Ideal 80-180
        
        if contrast < 30:
            issues.append("Low contrast")
            score_factors.append(0.6)
        elif contrast < 50:
            score_factors.append(0.8)
        else:
            score_factors.append(1.0)  # Good contrast
        
        # Calculate overall score
        quality_score = np.mean(score_factors) if score_factors else 0.0
        
        # Determine quality level
        if quality_score >= 0.9:
            quality_level = FaceQuality.EXCELLENT
        elif quality_score >= 0.8:
            quality_level = FaceQuality.GOOD
        elif quality_score >= 0.7:
            quality_level = FaceQuality.FAIR
        elif quality_score >= 0.6:
            quality_level = FaceQuality.POOR
        else:
            quality_level = FaceQuality.REJECT
        
        return quality_score, quality_level, issues
    
    def capture_multiple_frames(
        self, 
        camera_index: int = 0,
        timeout_seconds: int = 30
    ) -> List[FaceCaptureResult]:
        """
        Capture multiple high-quality face frames
        
        Args:
            camera_index: Camera device index
            timeout_seconds: Maximum time to attempt capture
            
        Returns:
            List of successful FaceCaptureResult objects
        """
        camera = cv2.VideoCapture(camera_index)
        if not camera.isOpened():
            logger.error(f"Failed to open camera {camera_index}")
            return []
        
        try:
            camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            
            successful_captures = []
            start_time = datetime.now()
            
            logger.info(f"Starting multi-frame capture (target: {self.required_frames} frames)")
            
            while len(successful_captures) < self.required_frames:
                # Check timeout
                if (datetime.now() - start_time).seconds > timeout_seconds:
                    logger.warning(f"Capture timeout after {timeout_seconds} seconds")
                    break
                
                # Read frame
                ret, frame = camera.read()
                if not ret:
                    continue
                
                # Capture and assess face
                result = self.capture_face_frame(frame)
                
                if result.success and result.quality_level != FaceQuality.REJECT:
                    # Only accept frames with minimum quality
                    if result.quality_score >= self.min_quality_score:
                        successful_captures.append(result)
                        logger.info(f"Captured frame {len(successful_captures)}: "
                                  f"quality={result.quality_level.value}, "
                                  f"score={result.quality_score:.2f}")
                    else:
                        logger.debug(f"Frame rejected: quality score {result.quality_score:.2f} "
                                   f"< minimum {self.min_quality_score}")
                
                # Small delay to avoid capturing identical frames
                cv2.waitKey(100)
            
            logger.info(f"Capture complete: {len(successful_captures)}/{self.required_frames} frames captured")
            return successful_captures
            
        finally:
            camera.release()
    
    # ==================== FACE ENCODING GENERATION ====================
    
    def generate_face_encoding(
        self, 
        face_regions: List[np.ndarray]
    ) -> Optional[np.ndarray]:
        """
        Generate face encoding from multiple face regions
        
        Args:
            face_regions: List of cropped face regions
            
        Returns:
            Average face encoding or None
        """
        if not face_regions:
            return None
        
        encodings = []
        
        for region in face_regions:
            embedding = self.face_recognizer.generate_embedding(region)
            if embedding is not None:
                encodings.append(embedding)
        
        if not encodings:
            return None
        
        # Average the encodings for better accuracy
        avg_encoding = np.mean(encodings, axis=0)
        
        # Normalize to unit length
        norm = np.linalg.norm(avg_encoding)
        if norm > 0:
            avg_encoding = avg_encoding / norm
        
        return avg_encoding
    
    def check_duplicate_encoding(
        self, 
        new_encoding: np.ndarray,
        student_id: Optional[str] = None
    ) -> Tuple[bool, Optional[str], float]:
        """
        Check if face encoding is a duplicate of existing encodings
        
        Args:
            new_encoding: New face encoding to check
            student_id: Optional student ID to exclude from check
            
        Returns:
            Tuple of (is_duplicate, matched_student_id, similarity_score)
        """
        try:
            # Get all students with face encodings
            students = self.db.get_students_with_face_encodings()
            
            best_match_id = None
            best_similarity = 0.0
            
            for student in students:
                # Skip the current student if provided
                if student_id and student['id'] == student_id:
                    continue
                
                # Get face encoding
                encoding_data = student.get('face_encoding')
                if not encoding_data:
                    continue
                
                # Parse encoding
                if isinstance(encoding_data, str):
                    encoding_data = json.loads(encoding_data)
                
                if 'encoding' not in encoding_data:
                    continue
                
                existing_encoding = np.array(encoding_data['encoding'], dtype=np.float32)
                
                # Calculate similarity
                similarity = self._cosine_similarity(new_encoding, existing_encoding)
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match_id = student['id']
            
            # Check if similarity exceeds threshold
            is_duplicate = best_similarity >= self.duplicate_threshold
            
            return is_duplicate, best_match_id, best_similarity
            
        except Exception as e:
            logger.error(f"Error checking duplicate encoding: {e}")
            return False, None, 0.0
    
    def _cosine_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Calculate cosine similarity between two embeddings"""
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = np.dot(emb1, emb2) / (norm1 * norm2)
        return (similarity + 1) / 2  # Convert to 0-1 range
    
    # ==================== ENCRYPTION AND STORAGE ====================
    
    def encrypt_face_encoding(self, encoding: np.ndarray) -> Dict[str, Any]:
        """
        Encrypt face encoding for secure storage
        
        Args:
            encoding: Face encoding array
            
        Returns:
            Dictionary with encrypted encoding and metadata
        """
        # Convert to list for JSON serialization
        encoding_list = encoding.tolist()
        
        # Create metadata
        metadata = {
            'format': 'mediapipe',
            'source_system': 'Face_Reco',
            'created_at': datetime.utcnow().isoformat() + 'Z',
            'dimensions': len(encoding_list),
            'encryption_version': '1.0',
            'algorithm': 'AES-256-GCM'
        }
        
        # Encrypt the encoding
        encryption_result = self.encryption_service.encrypt_encoding(encoding_list, metadata)
        
        if not encryption_result.get('success'):
            raise Exception(f"Encryption failed: {encryption_result.get('error', 'Unknown error')}")
        
        # Return the encrypted encoding with hash
        return {
            'encrypted_encoding': encryption_result['encrypted_encoding'],
            'encoding_hash': encryption_result['encoding_hash']
        }
    
    def _calculate_encoding_hash(self, encoding: List[float]) -> str:
        """Calculate hash of encoding for integrity verification"""
        # Convert to bytes
        encoding_bytes = json.dumps(encoding, sort_keys=True).encode('utf-8')
        
        # Calculate SHA-256 hash
        return hashlib.sha256(encoding_bytes).hexdigest()
    
    # ==================== COMPLETE REGISTRATION WORKFLOW ====================
    
    def register_student_face(
        self,
        student_id: str,
        camera_index: int = 0
    ) -> Dict[str, Any]:
        """
        Complete face registration workflow for a student
        
        Args:
            student_id: Student ID to register
            camera_index: Camera device index
            
        Returns:
            Dictionary with registration result
        """
        try:
            logger.info(f"Starting face registration for student {student_id}")
            
            # Step 1: Verify student
            verification = self.verify_student_for_registration(student_id)
            if not verification.valid:
                return {
                    'status': RegistrationStatus.VALIDATION_ERROR.value,
                    'success': False,
                    'error': verification.error,
                    'student_id': student_id,
                    'requires_confirmation': verification.requires_confirmation
                }
            
            logger.info(f"Student {student_id} verified successfully")
            
            # Step 2: Capture multiple face frames
            capture_results = self.capture_multiple_frames(camera_index)
            
            if len(capture_results) < 3:  # Minimum 3 good frames
                return {
                    'status': RegistrationStatus.FACE_DETECTION_ERROR.value,
                    'success': False,
                    'error': f"Insufficient quality frames captured: {len(capture_results)}/3",
                    'student_id': student_id,
                    'frames_captured': len(capture_results)
                }
            
            logger.info(f"Captured {len(capture_results)} quality frames")
            
            # Step 3: Generate face encoding
            face_regions = [r.face_region for r in capture_results if r.face_region is not None]
            face_encoding = self.generate_face_encoding(face_regions)
            
            if face_encoding is None:
                return {
                    'status': RegistrationStatus.FACE_DETECTION_ERROR.value,
                    'success': False,
                    'error': "Failed to generate face encoding",
                    'student_id': student_id
                }
            
            logger.info(f"Face encoding generated: {len(face_encoding)} dimensions")
            
            # Step 4: Check for duplicates
            is_duplicate, duplicate_id, similarity = self.check_duplicate_encoding(
                face_encoding, student_id
            )
            
            if is_duplicate:
                return {
                    'status': RegistrationStatus.DUPLICATE.value,
                    'success': False,
                    'error': f"Face encoding matches existing student {duplicate_id} "
                           f"(similarity: {similarity:.3f})",
                    'student_id': student_id,
                    'duplicate_student_id': duplicate_id,
                    'similarity_score': similarity
                }
            
            logger.info(f"No duplicate found (best similarity: {similarity:.3f})")
            
            # Step 5: Encrypt and prepare for storage
            encrypted_result = self.encrypt_face_encoding(face_encoding)
            encrypted_encoding = encrypted_result['encrypted_encoding']
            
            # Step 6: Store in database
            result = self.db.enroll_student_face(
                student_id=student_id,
                face_encoding=encrypted_encoding  # Pass the encrypted encoding dict
            )
            
            if not result['success']:
                return {
                    'status': RegistrationStatus.FAILED.value,
                    'success': False,
                    'error': result.get('error', 'Database operation failed'),
                    'student_id': student_id,
                    'error_code': result.get('error_code')
                }
            
            logger.info(f"Face registration completed successfully for student {student_id}")
            
            # Step 7: Return success result
            return {
                'status': RegistrationStatus.SUCCESS.value,
                'success': True,
                'student_id': student_id,
                'frames_captured': len(capture_results),
                'average_quality': np.mean([r.quality_score for r in capture_results]),
                'encoding_dimensions': len(face_encoding),
                'timestamp': datetime.utcnow().isoformat(),
                'message': 'Face registration completed successfully'
            }
            
        except Exception as e:
            logger.error(f"Error in face registration workflow: {e}")
            return {
                'status': RegistrationStatus.FAILED.value,
                'success': False,
                'error': f"Registration failed: {str(e)}",
                'student_id': student_id
            }
    
    def get_registration_summary(self, student_id: str) -> Dict[str, Any]:
        """
        Get summary of registration status for a student
        
        Args:
            student_id: Student ID
            
        Returns:
            Registration summary
        """
        try:
            student_data = self.db.get_student_by_id(student_id)
            if not student_data:
                return {
                    'registered': False,
                    'error': 'Student not found'
                }
            
            has_encoding = student_data.get('face_encoding') is not None
            
            if has_encoding:
                encoding_data = student_data['face_encoding']
                if isinstance(encoding_data, str):
                    encoding_data = json.loads(encoding_data)
                
                return {
                    'registered': True,
                    'student_id': student_id,
                    'has_encoding': True,
                    'registration_date': encoding_data.get('metadata', {}).get('created_at'),
                    'encoding_format': encoding_data.get('metadata', {}).get('format'),
                    'dimensions': encoding_data.get('metadata', {}).get('dimensions')
                }
            else:
                return {
                    'registered': False,
                    'student_id': student_id,
                    'has_encoding': False,
                    'message': 'Face not yet registered'
                }
                
        except Exception as e:
            logger.error(f"Error getting registration summary: {e}")
            return {
                'registered': False,
                'error': str(e)
            }


# Singleton instance
face_registration_service = FaceRegistrationService()


def get_face_registration_service() -> FaceRegistrationService:
    """Get the singleton face registration service instance"""
    return face_registration_service