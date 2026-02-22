"""
Conflict Resolution Service
Handles resolution of conflicts between manual and automatic attendance records
"""
from typing import Dict, Any, Optional
from datetime import datetime
import json


class ConflictResolutionService:
    """
    Service for resolving conflicts between manual and automatic attendance records
    Implements precedence rules and conflict detection
    """
    
    def __init__(self):
        """Initialize the conflict resolution service"""
        # Default precedence rules
        self.precedence_rules = {
            'manual_overrides_auto': True,  # Manual attendance takes precedence over automatic
            'latest_wins': False,           # When both are same type, latest wins
            'teacher_overrides_student': True,  # Teacher marking takes precedence over system
            'admin_overrides_all': True,        # Admin actions take highest precedence
        }
        
    def detect_attendance_conflict(
        self, 
        existing_record: Dict[str, Any], 
        new_record: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Detect conflicts between existing and new attendance records
        
        Args:
            existing_record: The existing attendance record
            new_record: The new attendance record to be added
            
        Returns:
            Conflict detection result
        """
        conflict_types = []
        
        # Check for basic conflicts
        if existing_record.get('student_id') != new_record.get('student_id'):
            # This shouldn't happen in normal operation but check anyway
            return {'has_conflict': False, 'conflicts': []}
        
        if existing_record.get('subject_id') != new_record.get('subject_id'):
            # Different subjects, no conflict
            return {'has_conflict': False, 'conflicts': []}
        
        if existing_record.get('date') != new_record.get('date'):
            # Different dates, no conflict
            return {'has_conflict': False, 'conflicts': []}
        
        # Same student, subject, and date - potential conflict
        existing_method = existing_record.get('source_method', 'unknown')  # 'manual', 'automatic', 'bulk'
        new_method = new_record.get('source_method', 'unknown')
        existing_status = existing_record.get('status', 'present')
        new_status = new_record.get('status', 'present')
        
        # Method-based conflict
        if existing_method != new_method:
            conflict_types.append({
                'type': 'method_conflict',
                'details': f'{existing_method} vs {new_method}',
                'existing_value': existing_method,
                'new_value': new_method
            })
        
        # Status-based conflict
        if existing_status != new_status:
            conflict_types.append({
                'type': 'status_conflict',
                'details': f'{existing_status} vs {new_status}',
                'existing_value': existing_status,
                'new_value': new_status
            })
        
        # Timestamp-based conflict (if both records are close in time)
        existing_time = existing_record.get('timestamp', '')
        new_time = new_record.get('timestamp', '')
        
        # If timestamps are different and close together, consider as conflict
        if existing_time and new_time and existing_time != new_time:
            # In a real implementation, we would parse and compare actual timestamps
            # For now, just note the difference
            conflict_types.append({
                'type': 'timestamp_conflict',
                'details': f'existing: {existing_time} vs new: {new_time}',
                'existing_value': existing_time,
                'new_value': new_time
            })
        
        return {
            'has_conflict': len(conflict_types) > 0,
            'conflicts': conflict_types,
            'existing_record': existing_record,
            'new_record': new_record
        }
    
    def resolve_attendance_conflict(
        self, 
        existing_record: Dict[str, Any], 
        new_record: Dict[str, Any],
        conflict_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Resolve attendance conflict based on precedence rules
        
        Args:
            existing_record: The existing attendance record
            new_record: The new attendance record to be added
            conflict_info: Pre-computed conflict information (optional)
            
        Returns:
            Resolution result with decision and reasoning
        """
        if conflict_info is None:
            conflict_info = self.detect_attendance_conflict(existing_record, new_record)
        
        if not conflict_info['has_conflict']:
            # No conflict to resolve
            return {
                'resolution': 'no_conflict',
                'action': 'accept_new',
                'record': new_record,
                'reason': 'No conflict detected'
            }
        
        # Determine which record takes precedence
        existing_precedence = self._calculate_precedence_score(existing_record)
        new_precedence = self._calculate_precedence_score(new_record)
        
        # Apply precedence rules
        if new_precedence > existing_precedence:
            # New record takes precedence
            return {
                'resolution': 'resolved',
                'action': 'accept_new',
                'record': new_record,
                'reason': f'New record has higher precedence ({new_precedence} vs {existing_precedence})',
                'precedence_scores': {
                    'existing': existing_precedence,
                    'new': new_precedence
                }
            }
        elif existing_precedence > new_precedence:
            # Existing record stands
            return {
                'resolution': 'resolved',
                'action': 'keep_existing',
                'record': existing_record,
                'reason': f'Existing record has higher precedence ({existing_precedence} vs {new_precedence})',
                'precedence_scores': {
                    'existing': existing_precedence,
                    'new': new_precedence
                }
            }
        else:
            # Equal precedence - use secondary rules
            return self._resolve_equal_precedence(existing_record, new_record)
    
    def _calculate_precedence_score(self, record: Dict[str, Any]) -> float:
        """
        Calculate precedence score for an attendance record
        
        Args:
            record: Attendance record
            
        Returns:
            Precedence score (higher means higher precedence)
        """
        score = 0.0
        
        # Method-based scoring (manual > automatic)
        method = record.get('source_method', 'automatic')
        if method == 'manual':
            score += 10.0  # Manual entries have high precedence
        elif method == 'admin_override':
            score += 15.0  # Admin overrides have highest precedence
        elif method == 'automatic':
            score += 5.0   # Automatic entries have medium precedence
        elif method == 'bulk_import':
            score += 3.0   # Bulk imports have lower precedence
        
        # Source system scoring (FRAMS manual > Face_Reco automatic)
        source_system = record.get('source_system', 'unknown')
        if source_system == 'FRAMS':
            score += 2.0  # FRAMS (manual) gets slight boost
        elif source_system == 'Face_Reco':
            score += 1.0  # Face_Reco (automatic) gets small boost for being primary system
        
        # Role-based scoring (if available)
        marker_role = record.get('marker_role', 'system')
        if marker_role == 'admin':
            score += 20.0  # Admin has highest precedence
        elif marker_role == 'teacher':
            score += 12.0  # Teacher has high precedence
        elif marker_role == 'student':
            score += 1.0   # Student has lowest precedence
        
        # Status confirmation scoring (confirmed statuses get boost)
        is_confirmed = record.get('is_confirmed', False)
        if is_confirmed:
            score += 5.0  # Confirmed records get precedence boost
        
        # Time-based decay for older records (more recent get slight boost)
        timestamp = record.get('timestamp', '')
        if timestamp:
            # In a real implementation, we would calculate time difference
            # For now, just give a small boost to newer records
            pass
        
        return score
    
    def _resolve_equal_precedence(
        self, 
        existing_record: Dict[str, Any], 
        new_record: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Resolve conflict when both records have equal precedence
        
        Args:
            existing_record: The existing attendance record
            new_record: The new attendance record to be added
            
        Returns:
            Resolution result
        """
        # When precedence is equal, use secondary rules
        # Typically, the more recent entry wins, or manual entry wins
        
        # Check if any manual entries exist
        existing_method = existing_record.get('source_method', 'automatic')
        new_method = new_record.get('source_method', 'automatic')
        
        if existing_method == 'manual' and new_method != 'manual':
            return {
                'resolution': 'resolved',
                'action': 'keep_existing',
                'record': existing_record,
                'reason': 'Manual record takes precedence over non-manual when scores equal',
                'precedence_scores': {'equal': True}
            }
        elif new_method == 'manual' and existing_method != 'manual':
            return {
                'resolution': 'resolved',
                'action': 'accept_new',
                'record': new_record,
                'reason': 'Manual record takes precedence over non-manual when scores equal',
                'precedence_scores': {'equal': True}
            }
        
        # If both are manual or both are automatic, use timestamp
        existing_time = existing_record.get('timestamp', '')
        new_time = new_record.get('timestamp', '')
        
        # In a real implementation, we would compare actual timestamps
        # For now, we'll favor the new record as it's likely intentional
        return {
            'resolution': 'resolved',
            'action': 'accept_new',
            'record': new_record,
            'reason': 'Equal precedence, accepting new record',
            'precedence_scores': {'equal': True}
        }
    
    def log_conflict_resolution(
        self, 
        existing_record: Dict[str, Any], 
        new_record: Dict[str, Any], 
        resolution_result: Dict[str, Any]
    ) -> None:
        """
        Log the conflict resolution for audit purposes
        
        Args:
            existing_record: The existing attendance record
            new_record: The new attendance record
            resolution_result: The resolution result
        """
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'conflict_type': 'attendance_conflict',
            'existing_record_id': existing_record.get('id'),
            'new_record_id': new_record.get('id'),
            'student_id': existing_record.get('student_id'),
            'subject_id': existing_record.get('subject_id'),
            'date': existing_record.get('date'),
            'existing_method': existing_record.get('source_method'),
            'new_method': new_record.get('source_method'),
            'existing_status': existing_record.get('status'),
            'new_status': new_record.get('status'),
            'resolution_action': resolution_result.get('action'),
            'resolution_reason': resolution_result.get('reason'),
            'precedence_scores': resolution_result.get('precedence_scores'),
            'resolver_version': '1.0'
        }
        
        # In a real implementation, this would be saved to an audit log table
        print(f"CONFLICT RESOLUTION LOG: {json.dumps(log_entry, indent=2)}")
    
    def get_conflict_summary(
        self, 
        student_id: str, 
        subject_id: str, 
        date: str, 
        db_client
    ) -> Dict[str, Any]:
        """
        Get conflict summary for a specific attendance record
        
        Args:
            student_id: Student ID
            subject_id: Subject ID
            date: Date of attendance
            db_client: Database client
            
        Returns:
            Conflict summary
        """
        try:
            # Get all records for this student, subject, and date
            records = db_client.get_attendance_for_student_date(
                student_id, subject_id, date
            )
            
            if len(records) <= 1:
                return {
                    'has_conflicts': False,
                    'records_count': len(records),
                    'conflicts': [],
                    'recommended_action': 'no_conflict'
                }
            
            # Check all pairs for conflicts
            conflicts = []
            for i in range(len(records)):
                for j in range(i + 1, len(records)):
                    conflict_info = self.detect_attendance_conflict(
                        records[i], records[j]
                    )
                    if conflict_info['has_conflict']:
                        conflicts.append({
                            'record_ids': [records[i].get('id'), records[j].get('id')],
                            'conflict_details': conflict_info['conflicts']
                        })
            
            return {
                'has_conflicts': len(conflicts) > 0,
                'records_count': len(records),
                'conflicts': conflicts,
                'recommended_action': 'review_required' if len(conflicts) > 0 else 'no_conflict'
            }
            
        except Exception as e:
            return {
                'has_conflicts': False,
                'records_count': 0,
                'conflicts': [],
                'recommended_action': 'error',
                'error': str(e)
            }


# Singleton instance
conflict_resolution_service = ConflictResolutionService()


def get_conflict_resolution_service() -> ConflictResolutionService:
    """Get the singleton conflict resolution service instance"""
    return conflict_resolution_service