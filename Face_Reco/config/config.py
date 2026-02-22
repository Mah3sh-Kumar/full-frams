"""
Configuration Management for FRAMS
Loads environment variables and provides centralized config access
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration"""
    
    # Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    
    # Application
    APP_NAME = os.getenv('APP_NAME', 'FRAMS')
    DEBUG_MODE = os.getenv('DEBUG_MODE', 'False').lower() == 'true'
    
    # Camera Settings
    CAMERA_INDEX = int(os.getenv('CAMERA_INDEX', 0))
    CAMERA_WIDTH = int(os.getenv('CAMERA_WIDTH', 1280))
    CAMERA_HEIGHT = int(os.getenv('CAMERA_HEIGHT', 720))
    
    # Face Recognition
    FACE_DETECTION_CONFIDENCE = float(os.getenv('FACE_DETECTION_CONFIDENCE', 0.5))
    FACE_RECOGNITION_THRESHOLD = float(os.getenv('FACE_RECOGNITION_THRESHOLD', 0.6))
    
    # Face Embedding Configuration
    FACE_EMBEDDING_DIMENSION = 1404  # MediaPipe Face Mesh: 468 landmarks × 3 coordinates (x,y,z)
    FACE_IMAGE_SIZE = (192, 192)  # Standard input size for MediaPipe Face Mesh
    FACE_NORMALIZATION_MIN = -1.0  # Normalization range for face landmarks
    FACE_NORMALIZATION_MAX = 1.0
    
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        if not cls.SUPABASE_URL or not cls.SUPABASE_KEY:
            raise ValueError(
                "Missing Supabase credentials. "
                "Please set SUPABASE_URL and SUPABASE_KEY in .env file"
            )
        return True

# Validate on import
if __name__ != '__main__':
    Config.validate()
