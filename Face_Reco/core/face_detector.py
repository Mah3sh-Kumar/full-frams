"""
Face Detection using MediaPipe
Detects faces in video frames and extracts face regions
"""
import cv2
import numpy as np
from typing import List, Tuple, Optional
from config.config import Config


class FaceDetector:
    """Face detection using MediaPipe Face Detection"""
    
    def __init__(self, min_detection_confidence: float = None):
        """
        Initialize Face Detector (using OpenCV)
        
        Args:
            min_detection_confidence: Minimum confidence for detection (0.0 to 1.0)
        """
        self.min_detection_confidence = (
            min_detection_confidence or Config.FACE_DETECTION_CONFIDENCE
        )
        
        # Use OpenCV's Haar Cascade for face detection
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        print(f"✓ Face Detector initialized (confidence: {self.min_detection_confidence})")
    
    def detect_faces(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in a frame using OpenCV
        
        Args:
            frame: BGR image from OpenCV
            
        Returns:
            List of bounding boxes as (x, y, width, height)
        """
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces with improved parameters for better accuracy
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,      # Smaller scale factor for better detection
            minNeighbors=6,        # More neighbors for fewer false positives
            minSize=(50, 50),      # Larger minimum size
            maxSize=(500, 500),    # Reasonable maximum size
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        # Convert to the expected format (x, y, width, height)
        return [(x, y, w, h) for (x, y, w, h) in faces]
    
    def extract_face_region(
        self,
        frame: np.ndarray,
        bbox: Tuple[int, int, int, int],
        padding: int = 30
    ) -> Optional[np.ndarray]:
        """
        Extract face region from frame with optional padding
        
        Args:
            frame: Original frame
            bbox: Bounding box (x, y, width, height)
            padding: Extra pixels around face
            
        Returns:
            Cropped face image or None
        """
        x, y, w, h = bbox
        
        # Add padding
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(frame.shape[1], x + w + padding)
        y2 = min(frame.shape[0], y + h + padding)
        
        # Extract region
        face_region = frame[y1:y2, x1:x2]
        
        return face_region if face_region.size > 0 else None
    
    def draw_detections(
        self,
        frame: np.ndarray,
        faces: List[Tuple[int, int, int, int]],
        labels: Optional[List[str]] = None,
        color: Tuple[int, int, int] = (0, 255, 0),
        show_landmarks: bool = False
    ) -> np.ndarray:
        """
        Draw bounding boxes and labels on frame
        
        Args:
            frame: Original frame
            faces: List of bounding boxes
            labels: Optional labels for each face
            color: BGR color for boxes
            
        Returns:
            Frame with drawings
        """
        annotated_frame = frame.copy()
        
        for i, (x, y, w, h) in enumerate(faces):
            # Draw main rectangle
            cv2.rectangle(annotated_frame, (x, y), (x + w, y + h), color, 2)
                    
            # Draw corner indicators for better precision
            corner_length = min(w, h) // 8
            # Top-left corner
            cv2.line(annotated_frame, (x, y), (x + corner_length, y), color, 3)
            cv2.line(annotated_frame, (x, y), (x, y + corner_length), color, 3)
            # Top-right corner
            cv2.line(annotated_frame, (x + w, y), (x + w - corner_length, y), color, 3)
            cv2.line(annotated_frame, (x + w, y), (x + w, y + corner_length), color, 3)
            # Bottom-left corner
            cv2.line(annotated_frame, (x, y + h), (x + corner_length, y + h), color, 3)
            cv2.line(annotated_frame, (x, y + h), (x, y + h - corner_length), color, 3)
            # Bottom-right corner
            cv2.line(annotated_frame, (x + w, y + h), (x + w - corner_length, y + h), color, 3)
            cv2.line(annotated_frame, (x + w, y + h), (x + w, y + h - corner_length), color, 3)
                    
            # Draw center point
            center_x, center_y = x + w//2, y + h//2
            cv2.circle(annotated_frame, (center_x, center_y), 4, color, -1)
            
            # Draw label if provided
            if labels and i < len(labels):
                label = labels[i]
                
                # Background for text
                (text_w, text_h), _ = cv2.getTextSize(
                    label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
                )
                cv2.rectangle(
                    annotated_frame,
                    (x, y - text_h - 10),
                    (x + text_w, y),
                    color,
                    -1
                )
                
                # Text
                cv2.putText(
                    annotated_frame,
                    label,
                    (x, y - 5),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 255),
                    2
                )
        
        return annotated_frame
    
    def __del__(self):
        """Cleanup resources"""
        pass
