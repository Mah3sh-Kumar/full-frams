"""
Face Encoding Cache
Caches face encodings to optimize performance and reduce database load
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import threading
import time
import hashlib
import pickle
from functools import wraps


class FaceEncodingCache:
    """
    In-memory cache for face encodings with TTL and size management
    """
    
    def __init__(self, max_size: int = 1000, ttl_minutes: int = 30):
        """
        Initialize the face encoding cache
        
        Args:
            max_size: Maximum number of entries in cache
            ttl_minutes: Time-to-live for cached entries in minutes
        """
        self.max_size = max_size
        self.ttl_delta = timedelta(minutes=ttl_minutes)
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.access_times: Dict[str, datetime] = {}
        self.lock = threading.RLock()  # Reentrant lock for thread safety
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0,
            'insertions': 0
        }
    
    def _make_key(self, student_id: str, encoding_type: str = 'face_encoding') -> str:
        """
        Create a cache key for a student's face encoding
        
        Args:
            student_id: Unique identifier for the student
            encoding_type: Type of encoding (face_encoding, thumbnail, etc.)
            
        Returns:
            Cache key string
        """
        return f"{student_id}:{encoding_type}"
    
    def _is_expired(self, key: str) -> bool:
        """
        Check if a cache entry has expired
        
        Args:
            key: Cache key to check
            
        Returns:
            True if expired, False otherwise
        """
        if key not in self.access_times:
            return True
        
        return datetime.now() - self.access_times[key] > self.ttl_delta
    
    def _evict_lru(self):
        """
        Evict least recently used entries when cache is full
        """
        if len(self.cache) < self.max_size:
            return
        
        # Sort by access time (oldest first)
        sorted_items = sorted(self.access_times.items(), key=lambda x: x[1])
        
        # Remove oldest entries until we're under the limit
        removed_count = 0
        while len(self.cache) >= self.max_size and sorted_items:
            oldest_key, _ = sorted_items.pop(0)
            
            if oldest_key in self.cache:
                del self.cache[oldest_key]
            if oldest_key in self.access_times:
                del self.access_times[oldest_key]
            
            removed_count += 1
        
        self.stats['evictions'] += removed_count
    
    def get(self, student_id: str, encoding_type: str = 'face_encoding') -> Optional[Dict[str, Any]]:
        """
        Retrieve face encoding from cache
        
        Args:
            student_id: Student ID to look up
            encoding_type: Type of encoding to retrieve
            
        Returns:
            Face encoding data if found and not expired, None otherwise
        """
        key = self._make_key(student_id, encoding_type)
        
        with self.lock:
            # Check if key exists and is not expired
            if key in self.cache and not self._is_expired(key):
                self.access_times[key] = datetime.now()  # Update access time
                self.stats['hits'] += 1
                return self.cache[key]
            else:
                # Remove expired entry if it exists
                if key in self.cache:
                    del self.cache[key]
                    del self.access_times[key]
                
                self.stats['misses'] += 1
                return None
    
    def set(self, student_id: str, encoding_data: Dict[str, Any], encoding_type: str = 'face_encoding'):
        """
        Store face encoding in cache
        
        Args:
            student_id: Student ID
            encoding_data: Face encoding data to cache
            encoding_type: Type of encoding being stored
        """
        key = self._make_key(student_id, encoding_type)
        
        with self.lock:
            # Evict LRU entries if necessary
            self._evict_lru()
            
            # Store the data
            self.cache[key] = encoding_data
            self.access_times[key] = datetime.now()
            
            self.stats['insertions'] += 1
    
    def delete(self, student_id: str, encoding_type: str = 'face_encoding'):
        """
        Remove a specific entry from cache
        
        Args:
            student_id: Student ID to remove
            encoding_type: Type of encoding to remove
        """
        key = self._make_key(student_id, encoding_type)
        
        with self.lock:
            if key in self.cache:
                del self.cache[key]
            if key in self.access_times:
                del self.access_times[key]
    
    def clear(self):
        """
        Clear all entries from cache
        """
        with self.lock:
            self.cache.clear()
            self.access_times.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache statistics
        """
        with self.lock:
            total_requests = self.stats['hits'] + self.stats['misses']
            hit_rate = (self.stats['hits'] / total_requests * 100) if total_requests > 0 else 0
            
            return {
                'size': len(self.cache),
                'max_size': self.max_size,
                'ttl_minutes': self.ttl_delta.total_seconds() / 60,
                'hits': self.stats['hits'],
                'misses': self.stats['misses'],
                'evictions': self.stats['evictions'],
                'insertions': self.stats['insertions'],
                'hit_rate_percent': round(hit_rate, 2),
                'cache_keys': list(self.cache.keys())
            }
    
    def cleanup_expired(self):
        """
        Remove all expired entries from cache
        """
        with self.lock:
            expired_keys = [
                key for key, access_time in self.access_times.items()
                if self._is_expired(key)
            ]
            
            for key in expired_keys:
                if key in self.cache:
                    del self.cache[key]
                if key in self.access_times:
                    del self.access_times[key]


class CachedFaceRecognizer:
    """
    Face recognizer with built-in caching functionality
    """
    
    def __init__(self, face_recognizer_instance, cache_enabled: bool = True, cache_ttl_minutes: int = 30):
        """
        Initialize the cached face recognizer
        
        Args:
            face_recognizer_instance: Instance of the actual face recognizer
            cache_enabled: Whether caching is enabled
            cache_ttl_minutes: Cache expiration time in minutes
        """
        self.face_recognizer = face_recognizer_instance
        self.cache_enabled = cache_enabled
        self.cache = FaceEncodingCache(max_size=500, ttl_minutes=cache_ttl_minutes) if cache_enabled else None
    
    def load_known_faces(self, students_data: List[Dict]) -> int:
        """
        Load known faces with caching support
        
        Args:
            students_data: List of student records with face encodings
            
        Returns:
            Number of faces loaded
        """
        loaded_count = 0
        
        for student in students_data:
            if not student.get('face_encoding'):
                continue
            
            try:
                # Store in cache for quick retrieval later
                if self.cache_enabled:
                    self.cache.set(
                        student['id'], 
                        student['face_encoding'], 
                        encoding_type='face_encoding'
                    )
                
                loaded_count += 1
                
            except Exception as e:
                print(f"Error caching face for student {student.get('id')}: {e}")
        
        # Load faces into the underlying recognizer
        return self.face_recognizer.load_known_faces(students_data)
    
    def recognize_face(self, face_embedding: List[float]):
        """
        Recognize a face using cached encodings when possible
        """
        # This method would delegate to the underlying recognizer
        # The cache primarily helps with loading known faces efficiently
        return self.face_recognizer.recognize_face(face_embedding)
    
    def get_cached_encoding(self, student_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a cached face encoding for a student
        
        Args:
            student_id: Student ID to look up
            
        Returns:
            Cached encoding data or None if not found/cached
        """
        if not self.cache_enabled:
            return None
        
        return self.cache.get(student_id, 'face_encoding')
    
    def cache_encoding(self, student_id: str, encoding_data: Dict[str, Any]):
        """
        Cache a face encoding for a student
        
        Args:
            student_id: Student ID
            encoding_data: Encoding data to cache
        """
        if self.cache_enabled:
            self.cache.set(student_id, encoding_data, 'face_encoding')
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Returns:
            Cache statistics dictionary
        """
        if not self.cache_enabled:
            return {'enabled': False}
        
        stats = self.cache.get_stats()
        stats['enabled'] = True
        return stats


# Global cache instance
face_encoding_cache = FaceEncodingCache(max_size=1000, ttl_minutes=60)


def get_face_encoding_cache() -> FaceEncodingCache:
    """
    Get the global face encoding cache instance
    
    Returns:
        Face encoding cache instance
    """
    return face_encoding_cache


def with_cache(cache_key_func=None):
    """
    Decorator to add caching to face recognition operations
    
    Args:
        cache_key_func: Function to generate cache key from function arguments
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if cache_key_func:
                cache_key = cache_key_func(*args, **kwargs)
            else:
                # Default key generation using function name and arguments
                key_data = str(args) + str(kwargs)
                cache_key = hashlib.md5(key_data.encode()).hexdigest()
            
            # Try to get from cache first
            cached_result = face_encoding_cache.get(cache_key, func.__name__)
            if cached_result is not None:
                return cached_result
            
            # Execute the function
            result = func(*args, **kwargs)
            
            # Store in cache
            face_encoding_cache.set(cache_key, result, func.__name__)
            
            return result
        return wrapper
    return decorator