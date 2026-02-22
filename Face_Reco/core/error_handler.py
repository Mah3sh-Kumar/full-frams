"""
Error Handler Module
Comprehensive error handling for camera failures and other system errors
"""
from typing import Dict, Any, Optional, Callable, List
from enum import Enum
from datetime import datetime
import traceback
import logging
import json
import time
import threading
from functools import wraps


class ErrorSeverity(Enum):
    """Error severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ErrorType(Enum):
    """Types of errors that can occur"""
    CAMERA_ERROR = "camera_error"
    RECOGNITION_ERROR = "recognition_error"
    DATABASE_ERROR = "database_error"
    NETWORK_ERROR = "network_error"
    PERMISSION_ERROR = "permission_error"
    VALIDATION_ERROR = "validation_error"
    SYSTEM_ERROR = "system_error"


class ErrorHandler:
    """
    Comprehensive error handling system for the Face Recognition Attendance Management System
    """
    
    def __init__(self, log_file: str = "error_log.json", max_log_entries: int = 1000):
        """
        Initialize the error handler
        
        Args:
            log_file: Path to the error log file
            max_log_entries: Maximum number of entries to keep in memory
        """
        self.log_file = log_file
        self.max_log_entries = max_log_entries
        self.error_log: List[Dict[str, Any]] = []
        self.error_counts: Dict[str, int] = {}
        self.retry_attempts: Dict[str, int] = {}
        self.lock = threading.Lock()
        
        # Set up logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('face_reco_app.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def log_error(
        self, 
        error_type: ErrorType, 
        severity: ErrorSeverity, 
        message: str, 
        context: Optional[Dict[str, Any]] = None,
        exception: Optional[Exception] = None
    ) -> str:
        """
        Log an error with comprehensive details
        
        Args:
            error_type: Type of error
            severity: Severity level
            message: Error message
            context: Additional context information
            exception: Exception object if available
            
        Returns:
            Error ID for reference
        """
        error_id = f"ERR_{int(time.time())}_{hash(message) % 10000}"
        
        error_entry = {
            'id': error_id,
            'timestamp': datetime.utcnow().isoformat(),
            'type': error_type.value,
            'severity': severity.value,
            'message': message,
            'context': context or {},
            'traceback': traceback.format_exc() if exception else None,
            'thread_id': threading.current_thread().ident
        }
        
        with self.lock:
            self.error_log.append(error_entry)
            
            # Maintain log size limit
            if len(self.error_log) > self.max_log_entries:
                self.error_log = self.error_log[-self.max_log_entries:]
            
            # Update error counts
            error_key = f"{error_type.value}_{message[:50]}"
            self.error_counts[error_key] = self.error_counts.get(error_key, 0) + 1
        
        # Log to file
        self._write_to_log_file(error_entry)
        
        # Log to standard logger
        if severity == ErrorSeverity.CRITICAL:
            self.logger.critical(f"[{error_id}] {message}", extra={'context': context})
        elif severity == ErrorSeverity.ERROR:
            self.logger.error(f"[{error_id}] {message}", extra={'context': context})
        elif severity == ErrorSeverity.WARNING:
            self.logger.warning(f"[{error_id}] {message}", extra={'context': context})
        else:
            self.logger.info(f"[{error_id}] {message}", extra={'context': context})
        
        return error_id
    
    def _write_to_log_file(self, error_entry: Dict[str, Any]):
        """
        Write error entry to log file
        
        Args:
            error_entry: Error entry to write
        """
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(error_entry) + '\n')
        except Exception as e:
            print(f"Failed to write to error log file: {e}")
    
    def handle_camera_error(self, exception: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Handle camera-related errors with specific remediation steps
        
        Args:
            exception: The camera error exception
            context: Additional context information
            
        Returns:
            Remediation response
        """
        error_msg = str(exception)
        
        # Determine error type and suggest remediation
        remediation_steps = []
        
        if "device busy" in error_msg.lower() or "already in use" in error_msg.lower():
            remediation_steps = [
                "Camera device is already in use by another process",
                "Close other applications using the camera",
                "Restart the camera service",
                "Try using a different camera device"
            ]
        elif "device not found" in error_msg.lower() or "no backend" in error_msg.lower():
            remediation_steps = [
                "Camera device not found",
                "Check if camera is physically connected",
                "Verify camera permissions",
                "Try reconnecting the camera",
                "Check camera drivers"
            ]
        elif "timeout" in error_msg.lower():
            remediation_steps = [
                "Camera response timeout",
                "Check camera hardware connection",
                "Reduce camera resolution/frame rate",
                "Ensure adequate lighting conditions"
            ]
        elif "permission denied" in error_msg.lower():
            remediation_steps = [
                "Insufficient permissions to access camera",
                "Grant camera access permissions to the application",
                "Run application with elevated privileges",
                "Check system privacy settings"
            ]
        else:
            remediation_steps = [
                "Unknown camera error occurred",
                "Check camera hardware and connections",
                "Verify camera permissions",
                "Restart the application",
                "Consult system administrator"
            ]
        
        # Log the error
        error_id = self.log_error(
            error_type=ErrorType.CAMERA_ERROR,
            severity=ErrorSeverity.ERROR,
            message=error_msg,
            context=context,
            exception=exception
        )
        
        return {
            'error_id': error_id,
            'handled': True,
            'remediation_steps': remediation_steps,
            'can_continue': len([step for step in remediation_steps if "restart" in step.lower() or "reconnect" in step.lower()]) > 0,
            'suggested_action': remediation_steps[0] if remediation_steps else "Unknown error"
        }
    
    def handle_recognition_error(self, exception: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Handle face recognition errors with specific remediation steps
        
        Args:
            exception: The recognition error exception
            context: Additional context information
            
        Returns:
            Remediation response
        """
        error_msg = str(exception)
        
        remediation_steps = []
        
        if "no faces detected" in error_msg.lower():
            remediation_steps = [
                "No faces detected in frame",
                "Ensure person is positioned correctly in frame",
                "Check lighting conditions",
                "Maintain proper distance from camera",
                "Remove obstructions like masks or sunglasses"
            ]
        elif "multiple faces" in error_msg.lower():
            remediation_steps = [
                "Multiple faces detected, unable to identify",
                "Position only one face in the frame",
                "Maintain distance between multiple people",
                "Use single-person recognition mode"
            ]
        elif "low confidence" in error_msg.lower():
            remediation_steps = [
                "Face recognition confidence too low",
                "Ensure clear view of face",
                "Improve lighting conditions",
                "Update face encoding in system",
                "Check if person is in the database"
            ]
        else:
            remediation_steps = [
                "Face recognition error occurred",
                "Check face positioning in frame",
                "Verify face is in the system database",
                "Improve lighting conditions",
                "Clean camera lens if necessary"
            ]
        
        # Log the error
        error_id = self.log_error(
            error_type=ErrorType.RECOGNITION_ERROR,
            severity=ErrorSeverity.WARNING,
            message=error_msg,
            context=context,
            exception=exception
        )
        
        return {
            'error_id': error_id,
            'handled': True,
            'remediation_steps': remediation_steps,
            'can_continue': True,  # Recognition errors usually don't stop the system
            'suggested_action': remediation_steps[0] if remediation_steps else "Unknown error"
        }
    
    def handle_database_error(self, exception: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Handle database-related errors with specific remediation steps
        
        Args:
            exception: The database error exception
            context: Additional context information
            
        Returns:
            Remediation response
        """
        error_msg = str(exception)
        
        remediation_steps = []
        
        if "connection refused" in error_msg.lower() or "could not connect" in error_msg.lower():
            remediation_steps = [
                "Database connection failed",
                "Check network connectivity",
                "Verify database server is running",
                "Confirm database credentials",
                "Check firewall settings"
            ]
        elif "timeout" in error_msg.lower():
            remediation_steps = [
                "Database operation timed out",
                "Check network connectivity",
                "Verify database server performance",
                "Optimize query performance",
                "Increase timeout settings"
            ]
        elif "constraint violation" in error_msg.lower() or "duplicate key" in error_msg.lower():
            remediation_steps = [
                "Database constraint violation",
                "Check for duplicate entries",
                "Verify data integrity",
                "Update existing records instead of creating new ones",
                "Clean up duplicate data"
            ]
        else:
            remediation_steps = [
                "Database error occurred",
                "Check database connectivity",
                "Verify database credentials",
                "Review database permissions",
                "Contact system administrator"
            ]
        
        # Log the error
        error_id = self.log_error(
            error_type=ErrorType.DATABASE_ERROR,
            severity=ErrorSeverity.ERROR,
            message=error_msg,
            context=context,
            exception=exception
        )
        
        return {
            'error_id': error_id,
            'handled': True,
            'remediation_steps': remediation_steps,
            'can_continue': "connection" not in error_msg.lower(),  # Can continue if not connection error
            'suggested_action': remediation_steps[0] if remediation_steps else "Unknown error"
        }
    
    def retry_on_failure(
        self, 
        func: Callable, 
        max_retries: int = 3, 
        delay: float = 1.0, 
        backoff: float = 2.0,
        retry_on_exceptions: tuple = (Exception,)
    ) -> Callable:
        """
        Decorator to retry function on failure
        
        Args:
            func: Function to decorate
            max_retries: Maximum number of retries
            delay: Initial delay between retries
            backoff: Multiplier for delay after each retry
            retry_on_exceptions: Tuple of exceptions to retry on
            
        Returns:
            Decorated function
        """
        def wrapper(*args, **kwargs):
            current_delay = delay
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retry_on_exceptions as e:
                    last_exception = e
                    
                    if attempt < max_retries:
                        self.logger.warning(f"Attempt {attempt + 1} failed: {str(e)}. Retrying in {current_delay}s...")
                        time.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        self.logger.error(f"All {max_retries + 1} attempts failed: {str(e)}")
                        
                        # Log the final error
                        self.log_error(
                            error_type=ErrorType.SYSTEM_ERROR,
                            severity=ErrorSeverity.ERROR,
                            message=f"Function {func.__name__} failed after {max_retries + 1} attempts",
                            context={
                                'function': func.__name__,
                                'attempts': max_retries + 1,
                                'final_error': str(e),
                                'args': str(args)[:200],  # Limit length
                                'kwargs': str(kwargs)[:200]  # Limit length
                            },
                            exception=e
                        )
            
            # If we get here, all retries failed
            raise last_exception
        
        return wrapper
    
    def get_error_statistics(self) -> Dict[str, Any]:
        """
        Get error statistics and trends
        
        Returns:
            Error statistics dictionary
        """
        with self.lock:
            total_errors = len(self.error_log)
            error_by_type = {}
            error_by_severity = {}
            
            for error in self.error_log:
                # Count by type
                err_type = error['type']
                error_by_type[err_type] = error_by_type.get(err_type, 0) + 1
                
                # Count by severity
                severity = error['severity']
                error_by_severity[severity] = error_by_severity.get(severity, 0) + 1
            
            return {
                'total_errors': total_errors,
                'recent_errors': len(self.error_log[-50:]),  # Last 50 errors
                'errors_by_type': error_by_type,
                'errors_by_severity': error_by_severity,
                'top_errors': dict(list(self.error_counts.items())[:10]),  # Top 10 recurring errors
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def get_recent_errors(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent errors
        
        Args:
            limit: Number of recent errors to return
            
        Returns:
            List of recent error entries
        """
        with self.lock:
            return self.error_log[-limit:] if self.error_log else []


# Global error handler instance
error_handler = ErrorHandler()


def get_error_handler() -> ErrorHandler:
    """
    Get the global error handler instance
    
    Returns:
        ErrorHandler instance
    """
    return error_handler


# Specific error handlers for different subsystems
class CameraErrorHandler:
    """Error handler specifically for camera operations"""
    
    def __init__(self, handler: ErrorHandler = None):
        self.handler = handler or get_error_handler()
    
    def handle_camera_initialization_error(self, exception: Exception, camera_index: int = 0) -> Dict[str, Any]:
        """Handle errors during camera initialization"""
        context = {'camera_index': camera_index, 'operation': 'initialization'}
        return self.handler.handle_camera_error(exception, context)
    
    def handle_camera_read_error(self, exception: Exception, camera_index: int = 0) -> Dict[str, Any]:
        """Handle errors during camera frame reading"""
        context = {'camera_index': camera_index, 'operation': 'frame_read'}
        return self.handler.handle_camera_error(exception, context)
    
    def handle_camera_disconnection_error(self, exception: Exception, camera_index: int = 0) -> Dict[str, Any]:
        """Handle errors during camera disconnection"""
        context = {'camera_index': camera_index, 'operation': 'disconnection'}
        return self.handler.handle_camera_error(exception, context)


class RecognitionErrorHandler:
    """Error handler specifically for recognition operations"""
    
    def __init__(self, handler: ErrorHandler = None):
        self.handler = handler or get_error_handler()
    
    def handle_face_detection_error(self, exception: Exception, image_shape: tuple = None) -> Dict[str, Any]:
        """Handle errors during face detection"""
        context = {'operation': 'face_detection', 'image_shape': image_shape}
        return self.handler.handle_recognition_error(exception, context)
    
    def handle_face_matching_error(self, exception: Exception, num_known_faces: int = 0) -> Dict[str, Any]:
        """Handle errors during face matching"""
        context = {'operation': 'face_matching', 'known_faces_count': num_known_faces}
        return self.handler.handle_recognition_error(exception, context)


class DatabaseErrorHandler:
    """Error handler specifically for database operations"""
    
    def __init__(self, handler: ErrorHandler = None):
        self.handler = handler or get_error_handler()
    
    def handle_connection_error(self, exception: Exception, db_url: str = None) -> Dict[str, Any]:
        """Handle database connection errors"""
        context = {'operation': 'connection', 'db_url_masked': db_url.split('@')[-1] if db_url else None}
        return self.handler.handle_database_error(exception, context)
    
    def handle_query_error(self, exception: Exception, query_preview: str = None) -> Dict[str, Any]:
        """Handle database query errors"""
        context = {'operation': 'query', 'query_preview': query_preview[:100] if query_preview else None}
        return self.handler.handle_database_error(exception, context)
    
    def handle_transaction_error(self, exception: Exception) -> Dict[str, Any]:
        """Handle database transaction errors"""
        context = {'operation': 'transaction'}
        return self.handler.handle_database_error(exception, context)