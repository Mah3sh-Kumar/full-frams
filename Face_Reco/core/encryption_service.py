"""
Encryption Service Module
Provides encryption and decryption for face encodings at rest
"""
from typing import List, Dict, Any, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import base64
import os
import json
from datetime import datetime
import secrets
import hashlib


class FaceEncodingEncryption:
    """
    Service for encrypting and decrypting face encodings at rest
    Uses industry-standard encryption algorithms to protect sensitive biometric data
    """
    
    def __init__(self, encryption_key: Optional[bytes] = None):
        """
        Initialize the encryption service
        
        Args:
            encryption_key: Encryption key (if None, will generate a new one)
        """
        if encryption_key is None:
            self.key = self.generate_key()
        else:
            self.key = encryption_key
        
        # Initialize Fernet cipher for symmetric encryption
        self.cipher = Fernet(base64.urlsafe_b64encode(self.key.ljust(32)[:32]))
        
        # Initialize AES-GCM for additional security layer
        self.aes_gcm = AESGCM(self.key[:32] if len(self.key) >= 32 else self.key.ljust(32)[:32])
    
    @staticmethod
    def generate_key() -> bytes:
        """
        Generate a secure encryption key
        
        Returns:
            Randomly generated encryption key
        """
        return Fernet.generate_key()
    
    @staticmethod
    def derive_key_from_password(password: str, salt: bytes = None) -> bytes:
        """
        Derive an encryption key from a password using PBKDF2
        
        Args:
            password: Password to derive key from
            salt: Salt for key derivation (if None, generates a new one)
            
        Returns:
            Derived encryption key
        """
        if salt is None:
            salt = os.urandom(16)  # 16-byte salt
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(password.encode())
        
        # Return salt + key so we can recreate the key later
        return salt + key
    
    @staticmethod
    def recover_key_from_password(password: str, salt_and_key: bytes) -> bytes:
        """
        Recover an encryption key from a password and stored salt+key
        
        Args:
            password: Password to derive key from
            salt_and_key: Salt + derived key combination
            
        Returns:
            Recovered encryption key
        """
        salt = salt_and_key[:16]  # First 16 bytes are salt
        original_key = salt_and_key[16:]  # Remaining bytes are the key
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        kdf.verify(password.encode(), original_key)
        
        return original_key
    
    def encrypt_encoding(self, encoding: List[float], encoding_metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Encrypt a face encoding
        
        Args:
            encoding: Face encoding as a list of floats
            encoding_metadata: Additional metadata to store with the encoding
            
        Returns:
            Dictionary containing encrypted data and metadata
        """
        try:
            # Serialize the encoding to JSON string
            encoding_str = json.dumps(encoding)
            
            # Encrypt the encoding string
            encrypted_data = self.cipher.encrypt(encoding_str.encode('utf-8'))
            
            # Generate a random nonce for AES-GCM (if we want to use it as additional layer)
            nonce = os.urandom(12)  # 96-bit nonce for AES-GCM
            
            # Create encrypted payload
            payload = {
                'data': base64.b64encode(encrypted_data).decode('utf-8'),
                'algorithm': 'Fernet-AES256',
                'nonce': base64.b64encode(nonce).decode('utf-8'),
                'created_at': datetime.utcnow().isoformat(),
                'metadata': encoding_metadata or {}
            }
            
            # Apply additional AES-GCM encryption layer
            additional_data = json.dumps({
                'created_at': payload['created_at'],
                'algorithm': payload['algorithm']
            }).encode('utf-8')
            
            aes_encrypted = self.aes_gcm.encrypt(nonce, encrypted_data, additional_data)
            
            # Update payload with AES-GCM encrypted data
            payload['data'] = base64.b64encode(aes_encrypted).decode('utf-8')
            payload['encryption_layers'] = ['AES-GCM', 'Fernet']
            
            return {
                'success': True,
                'encrypted_encoding': payload,
                'encoding_hash': hashlib.sha256(str(encoding).encode()).hexdigest()[:16]  # Short hash for verification
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Encryption failed: {str(e)}'
            }
    
    def decrypt_encoding(self, encrypted_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Decrypt a face encoding
        
        Args:
            encrypted_payload: Encrypted payload containing the encoding
            
        Returns:
            Dictionary containing decrypted encoding and metadata
        """
        try:
            if not isinstance(encrypted_payload, dict):
                return {
                    'success': False,
                    'error': 'Encrypted payload must be a dictionary'
                }
            
            # Decode the encrypted data
            encrypted_data = base64.b64decode(encrypted_payload['data'])
            nonce = base64.b64decode(encrypted_payload.get('nonce', base64.b64encode(os.urandom(12)).decode('utf-8')))
            
            # Decrypt using AES-GCM first
            additional_data = json.dumps({
                'created_at': encrypted_payload.get('created_at', ''),
                'algorithm': encrypted_payload.get('algorithm', '')
            }).encode('utf-8')
            
            try:
                # Attempt AES-GCM decryption
                fernet_token = self.aes_gcm.decrypt(nonce, encrypted_data, additional_data)
            except:
                # If AES-GCM fails, try direct Fernet decryption (for backward compatibility)
                fernet_token = base64.b64decode(encrypted_payload['data'])
            
            # Decrypt using Fernet
            decrypted_bytes = self.cipher.decrypt(fernet_token)
            decrypted_str = decrypted_bytes.decode('utf-8')
            
            # Deserialize the encoding
            encoding = json.loads(decrypted_str)
            
            return {
                'success': True,
                'encoding': encoding,
                'metadata': encrypted_payload.get('metadata', {}),
                'created_at': encrypted_payload.get('created_at'),
                'algorithm': encrypted_payload.get('algorithm')
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Decryption failed: {str(e)}'
            }
    
    def encrypt_encoding_batch(self, encodings: List[List[float]], metadata_list: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Encrypt a batch of face encodings
        
        Args:
            encodings: List of face encodings to encrypt
            metadata_list: List of metadata corresponding to each encoding (optional)
            
        Returns:
            Dictionary containing encrypted encodings
        """
        encrypted_results = []
        errors = []
        
        for i, encoding in enumerate(encodings):
            metadata = metadata_list[i] if metadata_list and i < len(metadata_list) else {}
            
            result = self.encrypt_encoding(encoding, metadata)
            
            if result['success']:
                encrypted_results.append({
                    'index': i,
                    'encrypted_encoding': result['encrypted_encoding'],
                    'encoding_hash': result['encoding_hash']
                })
            else:
                errors.append({
                    'index': i,
                    'error': result['error']
                })
        
        return {
            'success': len(errors) == 0,
            'encrypted_encodings': encrypted_results,
            'errors': errors,
            'total_processed': len(encodings),
            'successful_encryptions': len(encrypted_results),
            'failed_encryptions': len(errors)
        }
    
    def decrypt_encoding_batch(self, encrypted_payloads: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Decrypt a batch of face encodings
        
        Args:
            encrypted_payloads: List of encrypted payloads to decrypt
            
        Returns:
            Dictionary containing decrypted encodings
        """
        decrypted_results = []
        errors = []
        
        for i, payload in enumerate(encrypted_payloads):
            result = self.decrypt_encoding(payload)
            
            if result['success']:
                decrypted_results.append({
                    'index': i,
                    'encoding': result['encoding'],
                    'metadata': result.get('metadata', {}),
                    'created_at': result.get('created_at')
                })
            else:
                errors.append({
                    'index': i,
                    'error': result['error']
                })
        
        return {
            'success': len(errors) == 0,
            'decrypted_encodings': decrypted_results,
            'errors': errors,
            'total_processed': len(encrypted_payloads),
            'successful_decryptions': len(decrypted_results),
            'failed_decryptions': len(errors)
        }
    
    def rotate_key(self, new_key: Optional[bytes] = None) -> bytes:
        """
        Rotate the encryption key
        
        Args:
            new_key: New encryption key (if None, generates a new one)
            
        Returns:
            New encryption key
        """
        if new_key is None:
            new_key = self.generate_key()
        
        self.key = new_key
        self.cipher = Fernet(base64.urlsafe_b64encode(self.key.ljust(32)[:32]))
        self.aes_gcm = AESGCM(self.key[:32] if len(self.key) >= 32 else self.key.ljust(32)[:32])
        
        return self.key


class SecureFaceEncodingStorage:
    """
    Secure storage wrapper that automatically encrypts/decrypts face encodings
    """
    
    def __init__(self, encryption_service: FaceEncodingEncryption, db_client=None):
        """
        Initialize secure storage wrapper
        
        Args:
            encryption_service: Encryption service instance
            db_client: Database client for storing/retrieving encodings
        """
        self.encryption_service = encryption_service
        self.db_client = db_client
    
    def store_encrypted_encoding(
        self, 
        student_id: str, 
        encoding: List[float], 
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Store an encrypted face encoding
        
        Args:
            student_id: ID of the student
            encoding: Face encoding to store
            metadata: Additional metadata to store with the encoding
            
        Returns:
            Storage result
        """
        try:
            # Encrypt the encoding
            encryption_result = self.encryption_service.encrypt_encoding(encoding, metadata)
            
            if not encryption_result['success']:
                return encryption_result
            
            encrypted_encoding = encryption_result['encrypted_encoding']
            encoding_hash = encryption_result['encoding_hash']
            
            # Store in database if available
            if self.db_client:
                result = self.db_client.enroll_student_face(
                    student_id=student_id,
                    face_encoding=encrypted_encoding,  # Store encrypted data
                    # Include hash for verification
                    encoding_verification_hash=encoding_hash
                )
                
                return {
                    'success': result.get('success', True),
                    'stored': True,
                    'encoding_hash': encoding_hash,
                    'encryption_metadata': encrypted_encoding,
                    'database_result': result
                }
            else:
                # Return encrypted data for manual storage
                return {
                    'success': True,
                    'stored': False,
                    'encoding_hash': encoding_hash,
                    'encrypted_encoding': encrypted_encoding
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Storage failed: {str(e)}'
            }
    
    def retrieve_and_decrypt_encoding(self, student_id: str) -> Dict[str, Any]:
        """
        Retrieve and decrypt a face encoding
        
        Args:
            student_id: ID of the student
            
        Returns:
            Dictionary containing decrypted encoding
        """
        try:
            # Retrieve from database if available
            if self.db_client:
                student_data = self.db_client.get_student_by_id(student_id)
                
                if not student_data or not student_data.get('face_encoding'):
                    return {
                        'success': False,
                        'error': 'No face encoding found for student'
                    }
                
                encrypted_encoding = student_data['face_encoding']
            else:
                # In a real implementation, this would fetch from storage
                return {
                    'success': False,
                    'error': 'No database client provided'
                }
            
            # If the stored data is not a dict, it might not be encrypted
            if not isinstance(encrypted_encoding, dict):
                return {
                    'success': False,
                    'error': 'Stored encoding is not in encrypted format'
                }
            
            # Decrypt the encoding
            decryption_result = self.encryption_service.decrypt_encoding(encrypted_encoding)
            
            return decryption_result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Retrieval and decryption failed: {str(e)}'
            }
    
    def update_encrypted_encoding(
        self, 
        student_id: str, 
        new_encoding: List[float], 
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Update an existing encrypted face encoding
        
        Args:
            student_id: ID of the student
            new_encoding: New face encoding to store
            metadata: Additional metadata to store with the encoding
            
        Returns:
            Update result
        """
        # For update, we can just use the same store method
        return self.store_encrypted_encoding(student_id, new_encoding, metadata)


# Global encryption service instance
def create_default_encryption_service() -> FaceEncodingEncryption:
    """
    Create a default encryption service instance
    
    Returns:
        FaceEncodingEncryption instance
    """
    return FaceEncodingEncryption()


# Utility functions for common operations
def encrypt_face_encoding(encoding: List[float], key: bytes = None) -> Dict[str, Any]:
    """
    Convenience function to encrypt a face encoding
    
    Args:
        encoding: Face encoding to encrypt
        key: Encryption key (if None, generates a new one)
        
    Returns:
        Encryption result
    """
    service = FaceEncodingEncryption(key)
    return service.encrypt_encoding(encoding)


def decrypt_face_encoding(encrypted_payload: Dict[str, Any], key: bytes) -> Dict[str, Any]:
    """
    Convenience function to decrypt a face encoding
    
    Args:
        encrypted_payload: Encrypted payload
        key: Encryption key
        
    Returns:
        Decryption result
    """
    service = FaceEncodingEncryption(key)
    return service.decrypt_encoding(encrypted_payload)


def encrypt_face_encoding_with_password(encoding: List[float], password: str) -> Dict[str, Any]:
    """
    Encrypt a face encoding using a password-derived key
    
    Args:
        encoding: Face encoding to encrypt
        password: Password to derive encryption key from
        
    Returns:
        Encryption result with key information
    """
    try:
        # Derive key from password
        salt_and_key = FaceEncodingEncryption.derive_key_from_password(password)
        key = salt_and_key[16:]  # Extract the actual key (after salt)
        
        # Create service with derived key
        service = FaceEncodingEncryption(key)
        
        # Encrypt the encoding
        result = service.encrypt_encoding(encoding)
        
        # Include the salt + key for later recovery
        if result['success']:
            result['salt_and_key'] = base64.b64encode(salt_and_key).decode('utf-8')
        
        return result
    except Exception as e:
        return {
            'success': False,
            'error': f'Password-based encryption failed: {str(e)}'
        }


def decrypt_face_encoding_with_password(
    encrypted_payload: Dict[str, Any], 
    password: str, 
    salt_and_key_b64: str
) -> Dict[str, Any]:
    """
    Decrypt a face encoding using a password
    
    Args:
        encrypted_payload: Encrypted payload
        password: Password used for encryption
        salt_and_key_b64: Base64-encoded salt + key combination
        
    Returns:
        Decryption result
    """
    try:
        # Decode the salt + key
        salt_and_key = base64.b64decode(salt_and_key_b64.encode('utf-8'))
        
        # Recover the key from password and stored salt+key
        key = FaceEncodingEncryption.recover_key_from_password(password, salt_and_key)
        
        # Create service with recovered key
        service = FaceEncodingEncryption(key)
        
        # Decrypt the payload
        return service.decrypt_encoding(encrypted_payload)
    except Exception as e:
        return {
            'success': False,
            'error': f'Password-based decryption failed: {str(e)}'
        }