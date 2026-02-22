"""
Face Encoding Service
Manages face encoding operations including format conversion, validation, and storage
"""
from typing import Dict, List, Optional, Tuple, Any
import json
import numpy as np
from datetime import datetime
from .face_encoding_converter import FaceEncodingConverter, convert_encoding, validate_face_encoding


class FaceEncodingService:
    """
    Service layer for face encoding operations
    Handles format conversion, validation, and storage between systems
    """
    
    def __init__(self):
        """Initialize the face encoding service"""
        self.converter = FaceEncodingConverter()
        
    def save_face_encoding_to_database(self, db_client, student_id: str, encoding_data: Dict[str, Any]):
        """
        Save face encoding to the database using the proper format
        
        Args:
            db_client: Database client instance
            student_id: ID of the student
            encoding_data: Encoding data with metadata
            
        Returns:
            Result of the database operation
        """
        try:
            # Normalize the encoding data for storage
            normalized_encoding = self.normalize_encoding_for_storage(encoding_data)
            
            # Update the student record with the face encoding
            result = db_client.enroll_student_face(
                student_id=student_id,
                face_encoding=normalized_encoding['encoding'],
                # Pass other required fields as needed
            )
            
            return result
        
        except Exception as e:
            print(f"Error saving face encoding to database: {e}")
            return {"success": False, "error": str(e)}
    
    def get_face_encoding_from_database(self, db_client, student_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve face encoding from the database
        
        Args:
            db_client: Database client instance
            student_id: ID of the student
            
        Returns:
            Face encoding data with metadata or None
        """
        try:
            student_data = db_client.get_student_by_id(student_id)
            if not student_data or not student_data.get('face_encoding'):
                return None
            
            face_encoding = student_data['face_encoding']
            
            # Ensure the encoding has proper metadata structure
            if isinstance(face_encoding, str):
                import json
                face_encoding = json.loads(face_encoding)
            
            # If it's just an array of numbers, convert to the proper format
            if isinstance(face_encoding, list):
                face_encoding = {
                    'encoding': face_encoding,
                    'format': 'face_recognition',  # Default assumption
                    'source_system': 'FRAMS',  # Default assumption
                    'created_at': datetime.utcnow().isoformat() + 'Z',
                    'conversion_quality': 1.0,
                    'original_dimensions': len(face_encoding)
                }
            
            return face_encoding
        
        except Exception as e:
            print(f"Error retrieving face encoding from database: {e}")
            return None
        
    def process_face_encoding(
        self, 
        encoding: List[float], 
        source_format: str,
        source_system: str,
        target_format: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a face encoding by validating, converting if needed, and preparing for storage
        
        Args:
            encoding: Raw face encoding
            source_format: Format of the input encoding ('face_recognition' or 'mediapipe')
            source_system: System that generated the encoding ('FRAMS' or 'Face_Reco')
            target_format: Desired output format (if None, uses source_format)
            
        Returns:
            Dictionary with processed encoding and metadata
        """
        # Validate the source encoding
        validation_result = validate_face_encoding(encoding, source_format)
        if not validation_result['valid']:
            return {
                'success': False,
                'error': f'Source encoding validation failed: {validation_result["error"]}'
            }
        
        # Determine target format
        if target_format is None:
            target_format = source_format
            
        # Convert if needed
        if source_format != target_format:
            conversion_result = convert_encoding(
                encoding=encoding,
                from_format=source_format,
                to_format=target_format
            )
            if not conversion_result['success']:
                return {
                    'success': False,
                    'error': f'Encoding conversion failed: {conversion_result["error"]}'
                }
            processed_encoding = conversion_result['encoding']
        else:
            # No conversion needed, just wrap in metadata
            processed_encoding = {
                'encoding': encoding,
                'format': source_format,
                'source_system': source_system,
                'created_at': datetime.utcnow().isoformat() + 'Z',
                'conversion_quality': 1.0,  # No conversion performed
                'original_dimensions': len(encoding)
            }
        
        return {
            'success': True,
            'encoding': processed_encoding
        }
    
    def normalize_encoding_for_storage(self, encoding_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize encoding data for consistent storage in database
        
        Args:
            encoding_data: Raw encoding data from either system
            
        Returns:
            Normalized encoding data ready for database storage
        """
        # Ensure all required fields are present
        required_fields = ['encoding', 'format', 'source_system', 'created_at']
        
        # Add missing fields with defaults
        for field in required_fields:
            if field not in encoding_data:
                if field == 'encoding':
                    encoding_data[field] = []
                elif field == 'format':
                    encoding_data[field] = 'face_recognition'
                elif field == 'source_system':
                    encoding_data[field] = 'FRAMS'
                elif field == 'created_at':
                    encoding_data[field] = datetime.utcnow().isoformat() + 'Z'
        
        # Validate encoding format
        if not isinstance(encoding_data['encoding'], list):
            raise ValueError("Encoding must be a list of floats")
        
        # Validate format
        if encoding_data['format'] not in ['face_recognition', 'mediapipe']:
            raise ValueError("Format must be 'face_recognition' or 'mediapipe'")
        
        # Validate source system
        if encoding_data['source_system'] not in ['FRAMS', 'Face_Reco']:
            raise ValueError("Source system must be 'FRAMS' or 'Face_Reco'")
        
        # Add computed fields if not present
        if 'original_dimensions' not in encoding_data:
            encoding_data['original_dimensions'] = len(encoding_data['encoding'])
        
        if 'conversion_quality' not in encoding_data:
            encoding_data['conversion_quality'] = 1.0  # Default quality
        
        # Add validation timestamp
        if 'validated_at' not in encoding_data:
            encoding_data['validated_at'] = datetime.utcnow().isoformat() + 'Z'
        
        return encoding_data
    
    def validate_encoding_before_storage(self, encoding_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform comprehensive validation of encoding data before storing in database
        
        Args:
            encoding_data: Encoding data to validate
            
        Returns:
            Validation result with success/failure and error details
        """
        try:
            # Check if encoding data has required structure
            if not isinstance(encoding_data, dict):
                return {
                    'valid': False,
                    'error': 'Encoding data must be a dictionary',
                    'details': 'Root level must be an object with encoding metadata'
                }
            
            # Validate presence of required fields
            required_fields = ['encoding', 'format', 'source_system']
            missing_fields = [field for field in required_fields if field not in encoding_data]
            
            if missing_fields:
                return {
                    'valid': False,
                    'error': f'Missing required fields: {missing_fields}',
                    'details': 'All encoding data must include encoding array, format, and source system'
                }
            
            # Validate encoding array
            encoding_array = encoding_data['encoding']
            if not isinstance(encoding_array, list):
                return {
                    'valid': False,
                    'error': 'Encoding must be a list of numeric values',
                    'details': 'The encoding field must contain an array of numbers'
                }
            
            # Validate format
            valid_formats = ['face_recognition', 'mediapipe']
            if encoding_data['format'] not in valid_formats:
                return {
                    'valid': False,
                    'error': f'Invalid format: {encoding_data["format"]}',
                    'details': f'Format must be one of {valid_formats}'
                }
            
            # Validate source system
            valid_systems = ['FRAMS', 'Face_Reco']
            if encoding_data['source_system'] not in valid_systems:
                return {
                    'valid': False,
                    'error': f'Invalid source system: {encoding_data["source_system"]}',
                    'details': f'Source system must be one of {valid_systems}'
                }
            
            # Validate encoding dimensions based on format
            expected_dim = 128 if encoding_data['format'] == 'face_recognition' else 1404
            actual_dim = len(encoding_array)
            
            if actual_dim != expected_dim:
                # Allow some flexibility for converted encodings
                tolerance = 5  # Allow up to 5 dimension difference
                if abs(actual_dim - expected_dim) > tolerance:
                    return {
                        'valid': False,
                        'error': f'Incorrect dimensions for {encoding_data["format"]}: expected {expected_dim}, got {actual_dim}',
                        'details': f'Encoding for {encoding_data["format"]} should have {expected_dim} dimensions but has {actual_dim}'
                    }
            
            # Validate all values in encoding are finite numbers
            for i, val in enumerate(encoding_array):
                if not isinstance(val, (int, float)):
                    return {
                        'valid': False,
                        'error': f'Non-numeric value at index {i}: {val}',
                        'details': 'All encoding values must be numbers (int or float)'
                    }
                if not np.isfinite(val):
                    return {
                        'valid': False,
                        'error': f'Non-finite value at index {i}: {val}',
                        'details': 'All encoding values must be finite (not NaN or infinity)'
                    }
            
            # Validate optional fields if present
            if 'created_at' in encoding_data:
                try:
                    # Try to parse the timestamp
                    import dateutil.parser
                    parsed_time = dateutil.parser.parse(encoding_data['created_at'])
                except:
                    return {
                        'valid': False,
                        'error': f'Invalid timestamp format: {encoding_data["created_at"]}',
                        'details': 'created_at must be a valid ISO 8601 timestamp'
                    }
            
            # If we got here, everything is valid
            return {
                'valid': True,
                'error': None,
                'details': 'Encoding data passed all validation checks',
                'encoding_stats': {
                    'dimensions': len(encoding_array),
                    'format': encoding_data['format'],
                    'source_system': encoding_data['source_system'],
                    'min_value': float(min(encoding_array)) if encoding_array else 0,
                    'max_value': float(max(encoding_array)) if encoding_array else 0,
                    'mean_value': float(np.mean(encoding_array)) if encoding_array else 0
                }
            }
            
        except Exception as e:
            return {
                'valid': False,
                'error': f'Validation failed with exception: {str(e)}',
                'details': 'An unexpected error occurred during validation'
            }
    
    def get_optimal_encoding_format(self, target_system: str) -> str:
        """
        Determine the optimal encoding format based on target system
        
        Args:
            target_system: The system that will consume the encoding
            
        Returns:
            Optimal encoding format for the target system
        """
        # For Face_Reco system, prefer mediapipe format
        if target_system.lower() == 'face_reco':
            return 'mediapipe'
        # For FRAMS system, prefer face_recognition format
        elif target_system.lower() == 'frams':
            return 'face_recognition'
        else:
            # Default to face_recognition as it's more compact
            return 'face_recognition'
    
    def calculate_encoding_compatibility_score(
        self, 
        source_encoding: Dict[str, Any], 
        target_encoding: Dict[str, Any]
    ) -> float:
        """
        Calculate compatibility score between two encodings
        
        Args:
            source_encoding: Source encoding metadata
            target_encoding: Target encoding metadata
            
        Returns:
            Compatibility score (0.0 to 1.0)
        """
        # Factors affecting compatibility:
        # 1. Same source system (higher compatibility)
        system_compatibility = 1.0 if source_encoding.get('source_system') == target_encoding.get('source_system') else 0.7
        
        # 2. Conversion quality (if applicable)
        source_quality = source_encoding.get('conversion_quality', 1.0)
        target_quality = target_encoding.get('conversion_quality', 1.0)
        avg_quality = (source_quality + target_quality) / 2
        
        # 3. Original dimensions (should match expectations)
        expected_dims = 128 if source_encoding.get('format') == 'face_recognition' else 1404
        dims_match = 1.0 if source_encoding.get('original_dimensions', 0) == expected_dims else 0.8
        
        # Combine factors
        compatibility_score = (system_compatibility * 0.4 + avg_quality * 0.4 + dims_match * 0.2)
        
        return min(1.0, max(0.0, compatibility_score))
    
    def prepare_encoding_for_cross_system_use(
        self,
        source_encoding: Dict[str, Any],
        target_system: str
    ) -> Dict[str, Any]:
        """
        Prepare an encoding for use in a different system by converting if needed
        
        Args:
            source_encoding: The source encoding to adapt
            target_system: The system that will consume the encoding
            
        Returns:
            Prepared encoding for the target system
        """
        # Determine target format
        target_format = self.get_optimal_encoding_format(target_system)
        
        # If already in correct format and system, return as-is
        if (source_encoding.get('format') == target_format and 
            source_encoding.get('source_system') == target_system):
            return source_encoding
        
        # Convert the encoding
        conversion_result = convert_encoding(
            encoding=source_encoding['encoding'],
            from_format=source_encoding['format'],
            to_format=target_format
        )
        
        if not conversion_result['success']:
            raise Exception(f"Failed to convert encoding: {conversion_result.get('error', 'Unknown error')}")
        
        # Return the converted encoding with updated metadata
        converted_encoding = conversion_result['encoding']
        converted_encoding['source_system'] = target_system
        converted_encoding['created_at'] = datetime.utcnow().isoformat() + 'Z'
        
        return converted_encoding


# Singleton instance
face_encoding_service = FaceEncodingService()


def get_face_encoding_service() -> FaceEncodingService:
    """Get the singleton face encoding service instance"""
    return face_encoding_service