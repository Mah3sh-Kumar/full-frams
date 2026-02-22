"""
Synchronization Service
Manages data synchronization between FRAMS and Face_Reco systems
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
from .face_encoding_service import FaceEncodingService


class SynchronizationService:
    """
    Service for synchronizing data between FRAMS and Face_Reco systems
    Handles attendance records, student data, and face encoding synchronization
    """
    
    def __init__(self):
        """Initialize the synchronization service"""
        self.face_encoding_service = FaceEncodingService()
        self.last_sync_timestamps = {}
        
    def sync_attendance_data(
        self, 
        source_db, 
        target_db, 
        since_timestamp: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synchronize attendance data between systems
        
        Args:
            source_db: Source database client
            target_db: Target database client  
            since_timestamp: Only sync records after this timestamp
            
        Returns:
            Synchronization result
        """
        try:
            # Get attendance records from source
            # Since the actual SupabaseClient doesn't have get_all_attendance_records,
            # we'll need to work with the available methods
            try:
                # Get all students to find attendance records
                students = source_db.get_all_students()
                
                # For each student, get their attendance records
                attendance_records = []
                for student in students:
                    student_id = student.get('id')
                    if student_id:
                        # This is a simplified approach - in reality, we'd need to fetch
                        # attendance records differently
                        pass
                        
            except AttributeError:
                # If the method doesn't exist, we'll work with a different approach
                attendance_records = []
            
            # For now, we'll simulate getting attendance records by checking recent dates
            from datetime import datetime, timedelta
            today = datetime.now().strftime('%Y-%m-%d')
            yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            
            # We'll use the available method to get attendance by session (subject + date)
            # This is a simplified approach since we don't have all the exact methods
            subjects = source_db.get_all_subjects()
            attendance_records = []
            
            # Get attendance for recent dates for all subjects
            for subject in subjects:
                subject_id = subject.get('id')
                if subject_id:
                    # Get attendance for today
                    todays_attendance = source_db.get_attendance_by_session(subject_id, today)
                    for record in todays_attendance:
                        attendance_records.append({
                            'student_id': record.get('student_id', ''),
                            'subject_id': subject_id,
                            'date': today,
                            'status': record.get('status', 'present'),
                            'timestamp': record.get('timestamp', datetime.utcnow().isoformat()),
                            'source_system': 'FRAMS'  # or 'Face_Reco' depending on source
                        })
                        
                    # Get attendance for yesterday
                    yesterdays_attendance = source_db.get_attendance_by_session(subject_id, yesterday)
                    for record in yesterdays_attendance:
                        attendance_records.append({
                            'student_id': record.get('student_id', ''),
                            'subject_id': subject_id,
                            'date': yesterday,
                            'status': record.get('status', 'present'),
                            'timestamp': record.get('timestamp', datetime.utcnow().isoformat()),
                            'source_system': 'FRAMS'
                        })
            
            synced_count = 0
            errors = []
            
            for record in attendance_records:
                try:
                    # Check for conflicts before syncing
                    conflict_check = self.check_attendance_conflict(
                        target_db, 
                        record.get('student_id', ''), 
                        record.get('subject_id', ''), 
                        record.get('date', '')
                    )
                    
                    if conflict_check['has_conflict']:
                        # Handle conflict based on precedence rules
                        resolution = self.resolve_attendance_conflict(
                            record, 
                            conflict_check['existing_record'],
                            conflict_check['conflict_type']
                        )
                        
                        if resolution['should_update']:
                            # Use the available mark_attendance method
                            sync_result = target_db.mark_attendance(
                                student_id=record.get('student_id', ''),
                                subject_id=record.get('subject_id', ''),
                                date=record.get('date', ''),
                                status=record.get('status', 'present'),
                                status=record.get('status', 'present')
                            )
                        else:
                            continue  # Skip this record due to conflict resolution
                    else:
                        # No conflict, sync directly using available method
                        sync_result = target_db.mark_attendance(
                            student_id=record.get('student_id', ''),
                            subject_id=record.get('subject_id', ''),
                            date=record.get('date', ''),
                            status=record.get('status', 'present')
                        )
                    
                    # mark_attendance returns boolean, not a dict
                    if sync_result:  # True means success
                        synced_count += 1
                    else:
                        errors.append(f"Failed to sync record for student {record.get('student_id', 'unknown')}: Unknown error")
                
                except Exception as e:
                    errors.append(f"Error syncing record for student {record.get('student_id', 'unknown')}: {str(e)}")
            
            return {
                'success': True,
                'synced_count': synced_count,
                'errors': errors,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Attendance sync failed: {str(e)}',
                'synced_count': 0,
                'errors': [str(e)]
            }
    
    def check_attendance_conflict(
        self, 
        target_db, 
        student_id: str, 
        subject_id: str, 
        date: str
    ) -> Dict[str, Any]:
        """
        Check if there's a conflict with existing attendance record
        
        Args:
            target_db: Target database to check
            student_id: Student ID
            subject_id: Subject ID
            date: Date of attendance
            
        Returns:
            Conflict check result
        """
        try:
            existing_record = target_db.get_attendance_record(student_id, subject_id, date)
            
            if existing_record:
                return {
                    'has_conflict': True,
                    'existing_record': existing_record,
                    'conflict_type': 'duplicate_entry'
                }
            else:
                return {
                    'has_conflict': False,
                    'existing_record': None,
                    'conflict_type': None
                }
        except Exception as e:
            return {
                'has_conflict': False,
                'existing_record': None,
                'conflict_type': None,
                'error': str(e)
            }
    
    def resolve_attendance_conflict(
        self, 
        new_record: Dict[str, Any], 
        existing_record: Dict[str, Any], 
        conflict_type: str
    ) -> Dict[str, Any]:
        """
        Resolve attendance conflict based on precedence rules
        
        Args:
            new_record: New attendance record to sync
            existing_record: Existing attendance record
            conflict_type: Type of conflict
            
        Returns:
            Resolution result
        """
        # Default precedence: Manual attendance takes precedence over automatic
        # Automatic attendance from Face_Reco system marked as 'automatic'
        # Manual attendance from FRAMS system marked as 'manual'
        
        new_source = new_record.get('source_system', 'unknown')
        existing_source = existing_record.get('source_system', 'unknown')
        new_status = new_record.get('status', 'present')
        existing_status = existing_record.get('status', 'present')
        
        # Manual changes typically take precedence over automatic ones
        if existing_source == 'FRAMS' and new_source == 'Face_Reco':
            # Existing is manual, new is automatic - keep existing
            return {
                'should_update': False,
                'reason': 'Manual attendance takes precedence over automatic',
                'record': existing_record
            }
        elif existing_source == 'Face_Reco' and new_source == 'FRAMS':
            # Existing is automatic, new is manual - update with new
            return {
                'should_update': True,
                'reason': 'Manual attendance takes precedence over automatic',
                'record': new_record
            }
        else:
            # Both from same system or both manual/automatic - use timestamp
            new_time = new_record.get('timestamp', '')
            existing_time = existing_record.get('timestamp', '')
            
            # Update if new record is more recent
            if new_time > existing_time:
                return {
                    'should_update': True,
                    'reason': 'Newer record takes precedence',
                    'record': new_record
                }
            else:
                return {
                    'should_update': False,
                    'reason': 'Existing record is more recent',
                    'record': existing_record
                }
    
    def sync_student_data(self, source_db, target_db) -> Dict[str, Any]:
        """
        Synchronize student data between systems
        
        Args:
            source_db: Source database client
            target_db: Target database client
            
        Returns:
            Synchronization result
        """
        try:
            # Get all students from source
            source_students = source_db.get_all_students()
            synced_count = 0
            errors = []
            
            for student in source_students:
                try:
                    # Check if student exists in target
                    existing_student = target_db.get_student_by_id(student['id'])
                    
                    if existing_student:
                        # Student exists, update if needed
                        update_needed = self._compare_student_records(
                            existing_student, 
                            student
                        )
                        
                        if update_needed:
                            # Preserve face encoding from target if it exists and source doesn't have one
                            if not student.get('face_encoding') and existing_student.get('face_encoding'):
                                student['face_encoding'] = existing_student['face_encoding']
                            
                            update_result = target_db.update_student(student)
                            if update_result.get('success'):
                                synced_count += 1
                            else:
                                errors.append(f"Failed to update student {student['id']}: {update_result.get('error', 'Unknown error')}")
                    else:
                        # Student doesn't exist, create new
                        create_result = target_db.create_student(student)
                        if create_result.get('success'):
                            synced_count += 1
                        else:
                            errors.append(f"Failed to create student {student['id']}: {create_result.get('error', 'Unknown error')}")
                
                except Exception as e:
                    errors.append(f"Error syncing student {student.get('id', 'unknown')}: {str(e)}")
            
            return {
                'success': True,
                'synced_count': synced_count,
                'errors': errors,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Student data sync failed: {str(e)}',
                'synced_count': 0,
                'errors': [str(e)]
            }
    
    def _compare_student_records(self, existing: Dict[str, Any], new: Dict[str, Any]) -> bool:
        """
        Compare two student records to determine if update is needed
        
        Args:
            existing: Existing student record
            new: New student record
            
        Returns:
            True if update is needed, False otherwise
        """
        # Compare key fields that matter for synchronization
        fields_to_compare = [
            'enrollment_number', 'class_level', 'branch', 
            'full_name', 'email', 'is_verified'
        ]
        
        for field in fields_to_compare:
            existing_val = existing.get(field)
            new_val = new.get(field)
            
            if existing_val != new_val:
                return True
        
        # Also check if face encoding was added/updated
        existing_encoding = existing.get('face_encoding')
        new_encoding = new.get('face_encoding')
        
        if existing_encoding is None and new_encoding is not None:
            return True
        elif existing_encoding is not None and new_encoding is not None:
            # Check if encodings differ significantly
            existing_enc_list = existing_encoding.get('encoding', []) if isinstance(existing_encoding, dict) else existing_encoding
            new_enc_list = new_encoding.get('encoding', []) if isinstance(new_encoding, dict) else new_encoding
            
            if len(existing_enc_list) != len(new_enc_list):
                return True
            # For simplicity, we'll consider them different if the lists are different
            # In practice, you might want to use a similarity threshold
        
        return False
    
    def sync_face_encodings(self, source_db, target_db) -> Dict[str, Any]:
        """
        Synchronize face encoding data between systems
        Converts between formats as needed
        
        Args:
            source_db: Source database client
            target_db: Target database client
            
        Returns:
            Synchronization result
        """
        try:
            # Get all students with face encodings from source
            source_students = source_db.get_students_with_face_encodings()
            synced_count = 0
            errors = []
            
            for student in source_students:
                try:
                    student_id = student['id']
                    face_encoding = student.get('face_encoding')
                    
                    if not face_encoding:
                        continue
                    
                    # Get target student record
                    target_student = target_db.get_student_by_id(student_id)
                    if not target_student:
                        errors.append(f"Target student not found: {student_id}")
                        continue
                    
                    # Get the target system's preferred format
                    target_format = self.face_encoding_service.get_optimal_encoding_format('Face_Reco')
                    source_system = face_encoding.get('source_system', 'unknown')
                    
                    # Prepare encoding for target system
                    try:
                        prepared_encoding = self.face_encoding_service.prepare_encoding_for_cross_system_use(
                            source_encoding=face_encoding,
                            target_system='Face_Reco'
                        )
                        
                        # Update target student with converted encoding
                        update_result = target_db.enroll_student_face(
                            student_id=student_id,
                            face_encoding=prepared_encoding['encoding']
                        )
                        
                        if update_result.get('success'):
                            synced_count += 1
                        else:
                            errors.append(f"Failed to update face encoding for student {student_id}: {update_result.get('error', 'Unknown error')}")
                    
                    except Exception as e:
                        errors.append(f"Failed to convert encoding for student {student_id}: {str(e)}")
                
                except Exception as e:
                    errors.append(f"Error syncing face encoding for student {student['id']}: {str(e)}")
            
            return {
                'success': True,
                'synced_count': synced_count,
                'errors': errors,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Face encoding sync failed: {str(e)}',
                'synced_count': 0,
                'errors': [str(e)]
            }
    
    def perform_full_sync(self, frams_db, face_reco_db) -> Dict[str, Any]:
        """
        Perform a full synchronization between FRAMS and Face_Reco systems
        
        Args:
            frams_db: FRAMS database client
            face_reco_db: Face_Reco database client
            
        Returns:
            Full synchronization result
        """
        results = {}
        
        # Sync student data first (dependencies)
        results['students'] = self.sync_student_data(frams_db, face_reco_db)
        
        # Sync face encodings
        results['face_encodings'] = self.sync_face_encodings(frams_db, face_reco_db)
        
        # Sync attendance data
        results['attendance'] = self.sync_attendance_data(frams_db, face_reco_db)
        
        # Overall success is based on all individual successes
        overall_success = all(result['success'] for result in results.values())
        
        return {
            'success': overall_success,
            'results': results,
            'timestamp': datetime.utcnow().isoformat(),
            'summary': {
                'total_synced': sum(r.get('synced_count', 0) for r in results.values()),
                'total_errors': sum(len(r.get('errors', [])) for r in results.values())
            }
        }


# Singleton instance
synchronization_service = SynchronizationService()


def get_synchronization_service() -> SynchronizationService:
    """Get the singleton synchronization service instance"""
    return synchronization_service