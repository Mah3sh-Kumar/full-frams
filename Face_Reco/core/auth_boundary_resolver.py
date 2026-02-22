"""
Authentication Boundary Resolver
Handles authentication differences between FRAMS and Face_Reco systems
"""
from typing import Dict, Any, Optional
import jwt
from datetime import datetime, timedelta
import hashlib
import secrets
from config.config import Config


class AuthBoundaryResolver:
    """
    Service to resolve authentication boundary issues between FRAMS and Face_Reco systems
    Handles token management, device authentication, and permission mapping
    """
    
    def __init__(self):
        """Initialize the auth boundary resolver"""
        self.supabase_url = Config.SUPABASE_URL
        self.service_role_key = Config.SUPABASE_KEY
        
    def __init__(self):
        """Initialize the auth boundary resolver"""
        self.supabase_url = Config.SUPABASE_URL
        self.service_role_key = Config.SUPABASE_KEY
        
    def _get_token_expiry(self, token: str) -> str:
        """
        Extract expiry time from JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            ISO format expiry timestamp
        """
        try:
            decoded = jwt.decode(token, self.service_role_key, algorithms=['HS256'], options={"verify_signature": False})
            exp_timestamp = decoded.get('exp')
            if exp_timestamp:
                return datetime.utcfromtimestamp(exp_timestamp).isoformat()
        except:
            pass
        
        # Default expiry if token is malformed
        return (datetime.utcnow() + timedelta(hours=24)).isoformat()
    
    def map_permissions_between_systems(
        self, 
        user_role_in_source: str, 
        source_system: str, 
        target_system: str
    ) -> Dict[str, Any]:
        """
        Map user permissions from one system to another
        
        Args:
            user_role_in_source: User role in the source system
            source_system: Source system name
            target_system: Target system name
            
        Returns:
            Mapped permissions and roles for target system
        """
        # Define role mappings between systems
        role_mappings = {
            'FRAMS': {
                'admin': {
                    'Face_Reco': ['admin', 'super_user'],
                    'permissions': ['all_access', 'attendance_override']
                },
                'teacher': {
                    'Face_Reco': ['teacher', 'moderator'],
                    'permissions': ['attendance_marking', 'student_view', 'report_generation']
                },
                'student': {
                    'Face_Reco': ['student', 'viewer'],
                    'permissions': ['own_data_view']
                }
            },
            'Face_Reco': {
                'admin': {
                    'FRAMS': ['admin', 'super_user'],
                    'permissions': ['all_access', 'user_management', 'attendance_override']
                },
                'teacher': {
                    'FRAMS': ['teacher', 'moderator'],
                    'permissions': ['attendance_view', 'grade_input', 'report_generation']
                },
                'student': {
                    'FRAMS': ['student', 'viewer'],
                    'permissions': ['own_attendance_view', 'assignment_submission']
                }
            }
        }
        
        try:
            if source_system in role_mappings and user_role_in_source in role_mappings[source_system]:
                if target_system in role_mappings[source_system][user_role_in_source]:
                    mapped_data = role_mappings[source_system][user_role_in_source][target_system]
                    permissions = role_mappings[source_system][user_role_in_source]['permissions']
                    
                    return {
                        'success': True,
                        'mapped_roles': mapped_data if isinstance(mapped_data, list) else [mapped_data],
                        'permissions': permissions,
                        'mapping_path': f'{source_system}.{user_role_in_source} -> {target_system}'
                    }
            
            # If no specific mapping found, return default mapping
            return {
                'success': True,
                'mapped_roles': [user_role_in_source],  # Keep same role if no mapping
                'permissions': ['basic_access'],  # Default permissions
                'mapping_path': f'{source_system}.{user_role_in_source} -> {target_system} (default)'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Permission mapping failed: {str(e)}',
                'mapped_roles': [],
                'permissions': []
            }
    
    def create_cross_system_session(
        self, 
        user_id: str, 
        source_system: str, 
        target_system: str,
        additional_permissions: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Create a session token that works across both systems
        
        Args:
            user_id: User identifier
            source_system: System where user authenticated
            target_system: System where user wants access
            additional_permissions: Extra permissions to grant
            
        Returns:
            Cross-system session token
        """
        try:
            # Determine appropriate permissions for cross-system access
            permission_mapping = self.map_permissions_between_systems(
                user_role_in_source=self._get_user_role(user_id, source_system),
                source_system=source_system,
                target_system=target_system
            )
            
            if not permission_mapping['success']:
                return {
                    'success': False,
                    'error': f'Cannot establish cross-system session: {permission_mapping["error"]}'
                }
            
            # Combine mapped permissions with any additional permissions
            all_permissions = permission_mapping['permissions']
            if additional_permissions:
                all_permissions.extend(additional_permissions)
            
            # Create cross-system token
            cross_token_payload = {
                'sub': user_id,
                'iat': datetime.utcnow(),
                'exp': datetime.utcnow() + timedelta(hours=8),  # 8 hour expiry for cross-system
                'type': 'cross_system_session',
                'source_system': source_system,
                'target_system': target_system,
                'permissions': list(set(all_permissions)),  # Remove duplicates
                'session_id': secrets.token_urlsafe(32)
            }
            
            cross_token = jwt.encode(
                cross_token_payload, 
                self.service_role_key, 
                algorithm='HS256'
            )
            
            return {
                'success': True,
                'token': cross_token,
                'expires_at': self._get_token_expiry(cross_token),
                'permissions': all_permissions,
                'session_id': cross_token_payload['session_id']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Cross-system session creation failed: {str(e)}'
            }
    
    def _get_user_role(self, user_id: str, system: str) -> str:
        """
        Get user role in a specific system (placeholder implementation)
        
        Args:
            user_id: User identifier
            system: System name
            
        Returns:
            User role string
        """
        # This would normally query the database for user role
        # Placeholder implementation
        return 'admin'  # Default to admin for demo purposes
    
    def validate_cross_system_token(self, token: str) -> Dict[str, Any]:
        """
        Validate a cross-system authentication token
        
        Args:
            token: JWT token to validate
            
        Returns:
            Validation result
        """
        try:
            payload = jwt.decode(token, self.service_role_key, algorithms=['HS256'])
            
            # Check if token is expired
            exp = payload.get('exp')
            if exp and datetime.utcnow() > datetime.utcfromtimestamp(exp):
                return {
                    'valid': False,
                    'error': 'Token expired'
                }
            
            # Check if it's a cross-system token
            token_type = payload.get('type')
            if token_type != 'cross_system_session':
                return {
                    'valid': False,
                    'error': 'Not a cross-system token'
                }
            
            return {
                'valid': True,
                'payload': payload,
                'user_id': payload.get('sub'),
                'source_system': payload.get('source_system'),
                'target_system': payload.get('target_system'),
                'permissions': payload.get('permissions', []),
                'session_id': payload.get('session_id')
            }
            
        except jwt.ExpiredSignatureError:
            return {
                'valid': False,
                'error': 'Token expired'
            }
        except jwt.InvalidTokenError:
            return {
                'valid': False,
                'error': 'Invalid token'
            }
        except Exception as e:
            return {
                'valid': False,
                'error': f'Token validation failed: {str(e)}'
            }
    
    def synchronize_authentication_state(
        self, 
        frams_auth_state: Dict[str, Any], 
        face_reco_auth_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synchronize authentication states between systems
        
        Args:
            frams_auth_state: Authentication state from FRAMS
            face_reco_auth_state: Authentication state from Face_Reco
            
        Returns:
            Synchronized authentication state
        """
        try:
            # Identify discrepancies between systems
            discrepancies = []
            
            # Compare user sessions
            frams_users = set(frams_auth_state.get('active_users', []))
            face_reco_users = set(face_reco_auth_state.get('active_users', []))
            
            # Users in FRAMS but not in Face_Reco
            frams_only = frams_users - face_reco_users
            if frams_only:
                discrepancies.append({
                    'type': 'user_discrepancy',
                    'direction': 'frams_to_face_reco',
                    'users': list(frams_only)
                })
            
            # Users in Face_Reco but not in FRAMS
            face_reco_only = face_reco_users - frams_users
            if face_reco_only:
                discrepancies.append({
                    'type': 'user_discrepancy',
                    'direction': 'face_reco_to_frams',
                    'users': list(face_reco_only)
                })
            
            # Merge the states
            merged_state = {
                'active_users': list(frams_users.union(face_reco_users)),
                'last_sync': datetime.utcnow().isoformat(),
                'discrepancies_found': len(discrepancies) > 0,
                'discrepancies': discrepancies,
                'sync_strategy': 'merge_and_notify'  # Strategy for handling discrepancies
            }
            
            return {
                'success': True,
                'synchronized_state': merged_state,
                'actions_taken': self._recommend_actions_for_discrepancies(discrepancies)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Authentication state synchronization failed: {str(e)}'
            }
    
    def _recommend_actions_for_discrepancies(self, discrepancies: list) -> list:
        """
        Recommend actions for handling authentication discrepancies
        
        Args:
            discrepancies: List of discrepancies found
            
        Returns:
            List of recommended actions
        """
        actions = []
        
        for discrepancy in discrepancies:
            if discrepancy['type'] == 'user_discrepancy':
                if discrepancy['direction'] == 'frams_to_face_reco':
                    actions.append({
                        'action': 'propagate_sessions',
                        'target_system': 'Face_Reco',
                        'users': discrepancy['users'],
                        'reason': 'Users active in FRAMS should have equivalent access in Face_Reco'
                    })
                elif discrepancy['direction'] == 'face_reco_to_frams':
                    actions.append({
                        'action': 'propagate_sessions',
                        'target_system': 'FRAMS',
                        'users': discrepancy['users'],
                        'reason': 'Users active in Face_Reco should have equivalent access in FRAMS'
                    })
        
        return actions


# Singleton instance
auth_boundary_resolver = AuthBoundaryResolver()


def get_auth_boundary_resolver() -> AuthBoundaryResolver:
    """Get the singleton auth boundary resolver instance"""
    return auth_boundary_resolver