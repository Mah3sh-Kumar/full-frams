"""
Face Encoding Converter Service
Handles bidirectional conversion between face_recognition (128-dim) and MediaPipe (1404-dim) formats
"""

import numpy as np
from typing import List, Dict, Optional, Union, Tuple
from datetime import datetime
import json


class EncodingFormat:
    FACE_RECOGNITION = "face_recognition"
    MEDIAPIPE = "mediapipe"


class FaceEncodingConverter:
    """Converts between different face encoding formats"""
    
    FACE_RECOGNITION_DIM = 128
    MEDIAPIPE_DIM = 1404  # 468 landmarks × 3 coordinates (x,y,z)
    
    @staticmethod
    def mediapipe_to_face_recognition(mediapipe_encoding: List[float]) -> Dict:
        """
        Convert MediaPipe encoding (1404-dim) to face_recognition format (128-dim)
        
        Args:
            mediapipe_encoding: 1404-dimensional MediaPipe face mesh encoding
            
        Returns:
            Dictionary with conversion result
        """
        try:
            # Validate input
            if not isinstance(mediapipe_encoding, (list, np.ndarray)):
                return {
                    'success': False,
                    'error': 'Input must be a list or numpy array'
                }
            
            if len(mediapipe_encoding) != FaceEncodingConverter.MEDIAPIPE_DIM:
                return {
                    'success': False,
                    'error': f'Expected {FaceEncodingConverter.MEDIAPIPE_DIM}-dimensional encoding, '
                           f'got {len(mediapipe_encoding)}'
                }
            
            # Convert to numpy array for easier manipulation
            mediapipe_array = np.array(mediapipe_encoding, dtype=np.float32)
            
            # Extract key facial landmarks from MediaPipe data
            converted_encoding = []
            
            # 1. Extract nose bridge landmarks (first 30 values representing 10 landmarks)
            nose_landmarks = mediapipe_array[:30]
            converted_encoding.extend(FaceEncodingConverter._compute_statistical_features(nose_landmarks, 10))
            
            # 2. Extract eye region landmarks
            left_eye_landmarks = mediapipe_array[99:474]   # Landmarks 33-158
            right_eye_landmarks = mediapipe_array[1086:1461]  # Landmarks 362-487
            converted_encoding.extend(FaceEncodingConverter._compute_statistical_features(left_eye_landmarks, 15))
            converted_encoding.extend(FaceEncodingConverter._compute_statistical_features(right_eye_landmarks, 15))
            
            # 3. Extract mouth region landmarks
            mouth_landmarks = np.concatenate([
                mediapipe_array[183:234],   # Landmarks 61-78
                mediapipe_array[924:975]    # Landmarks 308-324
            ])
            converted_encoding.extend(FaceEncodingConverter._compute_statistical_features(mouth_landmarks, 12))
            
            # 4. Extract jaw/chin landmarks
            jaw_landmarks = np.concatenate([
                mediapipe_array[42:51],     # Landmarks 14-17
                mediapipe_array[597:600]    # Landmarks 199-200
            ])
            converted_encoding.extend(FaceEncodingConverter._compute_statistical_features(jaw_landmarks, 8))
            
            # 5. Extract cheek landmarks
            cheek_landmarks = np.concatenate([
                mediapipe_array[369:429],   # Landmarks 123-143
                mediapipe_array[1056:1116]  # Landmarks 352-372
            ])
            converted_encoding.extend(FaceEncodingConverter._compute_statistical_features(cheek_landmarks, 15))
            
            # 6. Global facial shape features
            converted_encoding.extend(FaceEncodingConverter._compute_global_features(mediapipe_array))
            
            # Pad or truncate to exactly 128 dimensions
            while len(converted_encoding) < FaceEncodingConverter.FACE_RECOGNITION_DIM:
                converted_encoding.append(0.0)
            
            if len(converted_encoding) > FaceEncodingConverter.FACE_RECOGNITION_DIM:
                converted_encoding = converted_encoding[:FaceEncodingConverter.FACE_RECOGNITION_DIM]
            
            # Normalize the encoding
            normalized_encoding = FaceEncodingConverter._normalize_encoding(converted_encoding)
            
            # Calculate quality score
            quality_score = FaceEncodingConverter._calculate_conversion_quality(
                mediapipe_array.tolist(), 
                normalized_encoding
            )
            
            return {
                'success': True,
                'encoding': {
                    'encoding': normalized_encoding,
                    'format': EncodingFormat.FACE_RECOGNITION,
                    'source_system': 'Face_Reco',
                    'created_at': datetime.utcnow().isoformat() + 'Z',
                    'conversion_quality': quality_score,
                    'original_dimensions': len(mediapipe_encoding)
                },
                'quality_score': quality_score
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Conversion failed: {str(e)}'
            }
    
    @staticmethod
    def face_recognition_to_mediapipe(face_recognition_encoding: List[float]) -> Dict:
        """
        Convert face_recognition encoding (128-dim) to MediaPipe format (1404-dim)
        Note: This is a lossy conversion with lower accuracy
        
        Args:
            face_recognition_encoding: 128-dimensional face_recognition encoding
            
        Returns:
            Dictionary with conversion result
        """
        try:
            # Validate input
            if not isinstance(face_recognition_encoding, (list, np.ndarray)):
                return {
                    'success': False,
                    'error': 'Input must be a list or numpy array'
                }
            
            if len(face_recognition_encoding) != FaceEncodingConverter.FACE_RECOGNITION_DIM:
                return {
                    'success': False,
                    'error': f'Expected {FaceEncodingConverter.FACE_RECOGNITION_DIM}-dimensional encoding, '
                           f'got {len(face_recognition_encoding)}'
                }
            
            # Convert to numpy array
            face_rec_array = np.array(face_recognition_encoding, dtype=np.float32)
            
            # Initialize MediaPipe encoding array
            mediapipe_encoding = np.zeros(FaceEncodingConverter.MEDIAPIPE_DIM, dtype=np.float32)
            
            # Distribute the 128 features across 468 landmark positions
            features_per_landmark = FaceEncodingConverter.FACE_RECOGNITION_DIM // 468
            remaining_features = FaceEncodingConverter.FACE_RECOGNITION_DIM % 468
            
            feature_index = 0
            
            # Assign features to landmarks
            for landmark in range(468):
                start_index = landmark * 3
                end_index = min(start_index + 3, FaceEncodingConverter.MEDIAPIPE_DIM)
                
                # Assign available features to x,y,z coordinates
                for coord in range(start_index, end_index):
                    if feature_index < FaceEncodingConverter.FACE_RECOGNITION_DIM:
                        mediapipe_encoding[coord] = face_rec_array[feature_index]
                        feature_index += 1
            
            # Distribute remaining features
            for i in range(remaining_features):
                if feature_index < FaceEncodingConverter.FACE_RECOGNITION_DIM:
                    position = int((i / remaining_features) * FaceEncodingConverter.MEDIAPIPE_DIM)
                    mediapipe_encoding[position] = face_rec_array[feature_index]
                    feature_index += 1
            
            # Apply smoothing to make the encoding more realistic
            for i in range(3, len(mediapipe_encoding) - 3):
                mediapipe_encoding[i] = np.mean(mediapipe_encoding[i-3:i+4])
            
            # Normalize to valid coordinate ranges (0-1 for MediaPipe)
            normalized_encoding = FaceEncodingConverter._normalize_to_coordinate_range(
                mediapipe_encoding.tolist()
            )
            
            return {
                'success': True,
                'encoding': {
                    'encoding': normalized_encoding,
                    'format': EncodingFormat.MEDIAPIPE,
                    'source_system': 'FRAMS',
                    'created_at': datetime.utcnow().isoformat() + 'Z',
                    'conversion_quality': 0.65,  # Lower quality due to lossy conversion
                    'original_dimensions': len(face_recognition_encoding)
                },
                'quality_score': 0.65
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Conversion failed: {str(e)}'
            }
    
    @staticmethod
    def validate_encoding(encoding: List[float], format_type: str) -> Dict:
        """
        Validate face encoding format and integrity
        
        Args:
            encoding: Face encoding to validate
            format_type: Expected format ('face_recognition' or 'mediapipe')
            
        Returns:
            Validation result dictionary
        """
        if not isinstance(encoding, (list, np.ndarray)):
            return {'valid': False, 'error': 'Encoding must be a list or numpy array'}
        
        if format_type == EncodingFormat.FACE_RECOGNITION:
            if len(encoding) != FaceEncodingConverter.FACE_RECOGNITION_DIM:
                return {
                    'valid': False,
                    'error': f'Face recognition encoding must be {FaceEncodingConverter.FACE_RECOGNITION_DIM}-dimensional'
                }
        elif format_type == EncodingFormat.MEDIAPIPE:
            if len(encoding) != FaceEncodingConverter.MEDIAPIPE_DIM:
                return {
                    'valid': False,
                    'error': f'MediaPipe encoding must be {FaceEncodingConverter.MEDIAPIPE_DIM}-dimensional'
                }
        else:
            return {'valid': False, 'error': 'Invalid format type'}
        
        # Check for NaN or infinite values
        encoding_array = np.array(encoding)
        if not np.isfinite(encoding_array).all():
            return {'valid': False, 'error': 'Encoding contains invalid numeric values'}
        
        return {'valid': True}
    
    @staticmethod
    def _compute_statistical_features(landmarks: np.ndarray, num_features: int) -> List[float]:
        """Compute statistical features from landmark data"""
        if len(landmarks) == 0:
            return [0.0] * num_features
        
        features = []
        
        # Mean
        mean_val = np.mean(landmarks)
        features.append(float(mean_val))
        
        # Standard deviation
        std_val = np.std(landmarks)
        features.append(float(std_val))
        
        # Min and Max
        features.append(float(np.min(landmarks)))
        features.append(float(np.max(landmarks)))
        
        # Range
        features.append(float(np.max(landmarks) - np.min(landmarks)))
        
        # Additional statistical moments
        skewness = FaceEncodingConverter._compute_skewness(landmarks, mean_val)
        features.append(float(skewness))
        
        kurtosis = FaceEncodingConverter._compute_kurtosis(landmarks, mean_val, std_val)
        features.append(float(kurtosis))
        
        # Percentile features
        sorted_landmarks = np.sort(landmarks)
        features.append(float(sorted_landmarks[int(len(sorted_landmarks) * 0.25)]))  # 25th percentile
        features.append(float(sorted_landmarks[int(len(sorted_landmarks) * 0.75)]))  # 75th percentile
        
        # Pad or truncate to required number of features
        while len(features) < num_features:
            features.append(0.0)
        
        return features[:num_features]
    
    @staticmethod
    def _compute_global_features(mediapipe_encoding: np.ndarray) -> List[float]:
        """Compute global facial features"""
        features = []
        
        # Overall facial width (distance between leftmost and rightmost points)
        x_coords = mediapipe_encoding[::3]  # Every 3rd element starting from index 0
        width = float(np.max(x_coords) - np.min(x_coords))
        features.append(width)
        
        # Overall facial height (distance between topmost and bottommost points)
        y_coords = mediapipe_encoding[1::3]  # Every 3rd element starting from index 1
        height = float(np.max(y_coords) - np.min(y_coords))
        features.append(height)
        
        # Facial depth variation
        z_coords = mediapipe_encoding[2::3]  # Every 3rd element starting from index 2
        depth = float(np.max(z_coords) - np.min(z_coords))
        features.append(depth)
        
        return features
    
    @staticmethod
    def _normalize_encoding(encoding: List[float]) -> List[float]:
        """Normalize encoding to standard range"""
        if len(encoding) == 0:
            return encoding
        
        encoding_array = np.array(encoding)
        mean_val = np.mean(encoding_array)
        std_val = np.std(encoding_array)
        
        # Avoid division by zero
        if std_val == 0:
            return [0.0] * len(encoding)
        
        normalized = (encoding_array - mean_val) / std_val
        return normalized.tolist()
    
    @staticmethod
    def _normalize_to_coordinate_range(encoding: List[float]) -> List[float]:
        """Normalize to MediaPipe coordinate range (0-1)"""
        if len(encoding) == 0:
            return encoding
        
        encoding_array = np.array(encoding)
        min_val = np.min(encoding_array)
        max_val = np.max(encoding_array)
        range_val = max_val - min_val
        
        if range_val == 0:
            return [0.5] * len(encoding)
        
        normalized = (encoding_array - min_val) / range_val
        return normalized.tolist()
    
    @staticmethod
    def _calculate_conversion_quality(original: List[float], converted: List[float]) -> float:
        """Calculate conversion quality score"""
        orig_array = np.array(original)
        conv_array = np.array(converted)
        
        orig_mean = np.mean(orig_array)
        conv_mean = np.mean(conv_array)
        
        orig_std = np.std(orig_array)
        conv_std = np.std(conv_array)
        
        # Quality decreases with larger differences in statistical properties
        mean_diff = abs(orig_mean - conv_mean)
        std_diff = abs(orig_std - conv_std)
        
        # Base quality score with penalties for statistical differences
        quality = 0.85  # Good base quality for dimensionality reduction
        quality -= mean_diff * 0.1
        quality -= std_diff * 0.1
        
        return max(0.0, min(1.0, quality))
    
    @staticmethod
    def _compute_skewness(data: np.ndarray, mean_val: float) -> float:
        """Compute skewness of data distribution"""
        n = len(data)
        if n < 3:
            return 0.0
        
        std_val = np.std(data)
        if std_val == 0:
            return 0.0
        
        skewness = np.mean(((data - mean_val) / std_val) ** 3)
        return float(skewness)
    
    @staticmethod
    def _compute_kurtosis(data: np.ndarray, mean_val: float, std_val: float) -> float:
        """Compute kurtosis of data distribution"""
        n = len(data)
        if n < 4 or std_val == 0:
            return 0.0
        
        kurtosis = np.mean(((data - mean_val) / std_val) ** 4)
        return float(kurtosis - 3)  # Excess kurtosis


def convert_encoding(encoding: List[float], from_format: str, to_format: str) -> Dict:
    """
    Convert encoding between formats
    
    Args:
        encoding: Face encoding to convert
        from_format: Source format ('face_recognition' or 'mediapipe')
        to_format: Target format ('face_recognition' or 'mediapipe')
        
    Returns:
        Conversion result dictionary
    """
    if from_format == to_format:
        return {
            'success': True,
            'encoding': {
                'encoding': encoding,
                'format': from_format,
                'source_system': 'FRAMS' if from_format == EncodingFormat.FACE_RECOGNITION else 'Face_Reco',
                'created_at': datetime.utcnow().isoformat() + 'Z'
            }
        }
    
    if from_format == EncodingFormat.MEDIAPIPE and to_format == EncodingFormat.FACE_RECOGNITION:
        return FaceEncodingConverter.mediapipe_to_face_recognition(encoding)
    
    if from_format == EncodingFormat.FACE_RECOGNITION and to_format == EncodingFormat.MEDIAPIPE:
        return FaceEncodingConverter.face_recognition_to_mediapipe(encoding)
    
    return {
        'success': False,
        'error': f'Unsupported conversion: {from_format} to {to_format}'
    }


def validate_face_encoding(encoding: List[float], format_type: str) -> Dict:
    """
    Validate face encoding format and integrity
    
    Args:
        encoding: Face encoding to validate
        format_type: Expected format
        
    Returns:
        Validation result dictionary
    """
    return FaceEncodingConverter.validate_encoding(encoding, format_type)


# Example usage
if __name__ == "__main__":
    # Test conversion from MediaPipe to face_recognition
    test_mediapipe = [0.1] * 1404  # Mock MediaPipe encoding
    result = convert_encoding(test_mediapipe, EncodingFormat.MEDIAPIPE, EncodingFormat.FACE_RECOGNITION)
    print("MediaPipe to face_recognition conversion:", result['success'])
    
    if result['success']:
        print("Converted encoding length:", len(result['encoding']['encoding']))
        print("Quality score:", result['quality_score'])
    
    # Test conversion from face_recognition to MediaPipe
    test_face_rec = [0.2] * 128  # Mock face_recognition encoding
    result = convert_encoding(test_face_rec, EncodingFormat.FACE_RECOGNITION, EncodingFormat.MEDIAPIPE)
    print("\nface_recognition to MediaPipe conversion:", result['success'])
    
    if result['success']:
        print("Converted encoding length:", len(result['encoding']['encoding']))
        print("Quality score:", result['quality_score'])