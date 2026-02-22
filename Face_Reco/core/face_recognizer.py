"""
Face Recognition Engine
Generates face embeddings using MediaPipe Face Mesh and matches against database
"""
import cv2
import numpy as np
from typing import Optional, List, Dict, Tuple
import mediapipe as mp
from config.config import Config
import json
import logging

# Set up logging
logger = logging.getLogger(__name__)


class FaceRecognizer:
    """Face recognition using MediaPipe Face Mesh for feature extraction"""
    
    def __init__(self, recognition_threshold: float = None):
        """
        Initialize Face Recognizer with MediaPipe Face Mesh
        
        Args:
            recognition_threshold: Similarity threshold for matching (0.0 to 1.0)
        """
        self.recognition_threshold = (
            recognition_threshold or Config.FACE_RECOGNITION_THRESHOLD
        )
        
        # Initialize MediaPipe Face Mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Database of known faces
        self.known_faces: Dict[str, np.ndarray] = {}
        self.student_info: Dict[str, Dict] = {}
        
        logger.info(f"Face Recognizer initialized (threshold: {self.recognition_threshold})")
    
    def generate_embedding(self, face_image: np.ndarray) -> Optional[np.ndarray]:
        """
        Generate face embedding from face image using MediaPipe Face Mesh
        
        Args:
            face_image: Cropped face image (BGR)
            
        Returns:
            Face embedding as numpy array or None
        """
        try:
            # Validate input
            if face_image is None or face_image.size == 0:
                logger.warning("Empty face image provided for embedding generation")
                return None
            
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            
            # Resize to standard size for consistent processing
            target_size = Config.FACE_IMAGE_SIZE
            resized_image = cv2.resize(rgb_image, target_size)
            
            # Process with MediaPipe Face Mesh
            results = self.face_mesh.process(resized_image)
            
            if not results.multi_face_landmarks:
                logger.debug("No face landmarks detected in image")
                return None
            
            # Extract landmarks from the first detected face
            face_landmarks = results.multi_face_landmarks[0]
            
            # Convert landmarks to embedding vector
            embedding = []
            for landmark in face_landmarks.landmark:
                # Normalize coordinates to [-1, 1] range
                x_norm = (landmark.x * 2) - 1  # Convert from [0,1] to [-1,1]
                y_norm = (landmark.y * 2) - 1
                z_norm = landmark.z  # Z is already centered around 0
                
                embedding.extend([x_norm, y_norm, z_norm])
            
            # Convert to numpy array and validate dimension
            embedding_array = np.array(embedding, dtype=np.float32)
            
            if len(embedding_array) != Config.FACE_EMBEDDING_DIMENSION:
                logger.error(f"Embedding dimension mismatch: expected {Config.FACE_EMBEDDING_DIMENSION}, got {len(embedding_array)}")
                return None
            
            # Validate embedding values
            if not np.isfinite(embedding_array).all():
                logger.error("Embedding contains non-finite values")
                return None
            
            # Normalize embedding to unit length for better cosine similarity
            norm = np.linalg.norm(embedding_array)
            if norm > 0:
                embedding_array = embedding_array / norm
            
            return embedding_array
            
        except Exception as e:
            logger.error(f"Error generating face embedding: {e}")
            return None
    
    def load_known_faces(self, students_data: List[Dict]) -> int:
        """
        Load known faces from database
        
        Args:
            students_data: List of student records with face_encoding
            
        Returns:
            Number of faces loaded
        """
        self.known_faces.clear()
        self.student_info.clear()
        
        loaded_count = 0
        
        for student in students_data:
            if not student.get('face_encoding'):
                continue
            
            try:
                # Parse face encoding from JSON
                encoding_data = student['face_encoding']
                if isinstance(encoding_data, str):
                    encoding_data = json.loads(encoding_data)
                
                # Extract embedding array
                if 'encoding' in encoding_data:
                    embedding = np.array(encoding_data['encoding'], dtype=np.float32)
                    
                    # Validate embedding dimension
                    if len(embedding) != Config.FACE_EMBEDDING_DIMENSION:
                        logger.warning(f"Student {student.get('id')} has incorrect embedding dimension: {len(embedding)}")
                        continue
                    
                    student_id = student['id']
                    self.known_faces[student_id] = embedding
                    
                    # Store student info
                    user_data = student.get('users', {})
                    self.student_info[student_id] = {
                        'id': student_id,
                        'enrollment_number': student.get('enrollment_number', 'N/A'),
                        'name': user_data.get('full_name', 'Unknown'),
                        'class': student.get('class_level', 'N/A'),
                        'branch': student.get('branch', 'N/A')
                    }
                    
                    loaded_count += 1
            
            except Exception as e:
                logger.error(f"Error loading face for student {student.get('id')}: {e}")
        
        logger.info(f"Loaded {loaded_count} known faces")
        return loaded_count
    
    def recognize_face(self, face_embedding: np.ndarray) -> Optional[Tuple[str, float, Dict]]:
        """
        Recognize a face by comparing with known faces
        
        Args:
            face_embedding: Face embedding to match
            
        Returns:
            Tuple of (student_id, confidence, student_info) or None
        """
        if not self.known_faces:
            logger.debug("No known faces loaded for recognition")
            return None
        
        if face_embedding is None or len(face_embedding) != Config.FACE_EMBEDDING_DIMENSION:
            logger.warning("Invalid face embedding provided for recognition")
            return None
        
        best_match_id = None
        best_similarity = 0.0
        
        # Compare with all known faces using cosine similarity
        for student_id, known_embedding in self.known_faces.items():
            similarity = self._cosine_similarity(face_embedding, known_embedding)
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match_id = student_id
        
        # Check if similarity meets threshold
        if best_similarity >= self.recognition_threshold:
            logger.debug(f"Face recognized: {best_match_id} with confidence {best_similarity:.3f}")
            return (
                best_match_id,
                best_similarity,
                self.student_info.get(best_match_id, {})
            )
        
        logger.debug(f"No match found (best similarity: {best_similarity:.3f}, threshold: {self.recognition_threshold})")
        return None
    
    def _cosine_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding
            embedding2: Second embedding
            
        Returns:
            Similarity score (0.0 to 1.0)
        """
        # Normalize embeddings (should already be normalized, but do it again for safety)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        # Cosine similarity
        similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)
        
        # Convert to 0-1 range (cosine ranges from -1 to 1)
        return (similarity + 1) / 2
    
    def get_loaded_count(self) -> int:
        """Get number of loaded known faces"""
        return len(self.known_faces)
    
    def __del__(self):
        """Cleanup resources"""
        try:
            if hasattr(self, 'face_mesh') and self.face_mesh:
                self.face_mesh.close()
        except Exception as e:
            logger.error(f"Error cleaning up face recognizer: {e}")
