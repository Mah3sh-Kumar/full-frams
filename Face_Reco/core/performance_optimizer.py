"""
Performance Optimizer Module
Optimizes face recognition speed for real-time processing
"""
import cv2
import numpy as np
import time
import threading
from typing import List, Dict, Any, Optional, Tuple
from collections import deque
import multiprocessing as mp
from concurrent.futures import ThreadPoolExecutor, as_completed
from .face_encoding_cache import CachedFaceRecognizer
from .face_recognizer import FaceRecognizer


class PerformanceOptimizer:
    """
    Optimizes various aspects of face recognition performance
    """
    
    def __init__(self, face_recognizer: FaceRecognizer):
        """
        Initialize the performance optimizer
        
        Args:
            face_recognizer: The face recognizer instance to optimize
        """
        self.face_recognizer = face_recognizer
        self.frame_processing_queue = deque(maxlen=10)  # Store last 10 frame processing times
        self.detection_quality_queue = deque(maxlen=10)  # Store last 10 detection qualities
        self.optimization_params = {
            'resize_factor': 0.5,  # Factor to resize frames for faster processing
            'skip_frames': 2,      # Process every Nth frame
            'roi_enlargement': 1.2, # Enlarge face ROI for better detection
            'confidence_threshold': 0.7,
            'max_faces_to_process': 5,
            'thread_pool_size': 4
        }
        self.current_frame_count = 0
        self.executor = ThreadPoolExecutor(max_workers=self.optimization_params['thread_pool_size'])
        
    def optimize_frame_processing(self, frame: np.ndarray) -> np.ndarray:
        """
        Optimize frame for faster processing
        
        Args:
            frame: Input frame
            
        Returns:
            Optimized frame for processing
        """
        # Resize frame to reduce computation
        height, width = frame.shape[:2]
        new_width = int(width * self.optimization_params['resize_factor'])
        new_height = int(height * self.optimization_params['resize_factor'])
        
        resized_frame = cv2.resize(frame, (new_width, new_height), interpolation=cv2.INTER_LINEAR)
        
        return resized_frame
    
    def adaptive_frame_skip(self, fps_target: float = 15.0) -> bool:
        """
        Determine if frame should be skipped based on performance
        
        Args:
            fps_target: Target FPS for real-time processing
            
        Returns:
            True if frame should be skipped, False otherwise
        """
        if len(self.frame_processing_queue) == 0:
            return False
        
        avg_processing_time = sum(self.frame_processing_queue) / len(self.frame_processing_queue)
        estimated_fps = 1.0 / avg_processing_time if avg_processing_time > 0 else float('inf')
        
        # Skip frames if we're falling behind the target FPS
        return estimated_fps > fps_target
    
    def optimize_detection_parameters(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Adjust detection parameters based on frame characteristics
        
        Args:
            frame: Input frame to analyze
            
        Returns:
            Optimized detection parameters
        """
        # Analyze frame characteristics
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        contrast = np.std(gray)
        
        params = {}
        
        # Adjust parameters based on brightness
        if brightness < 50:  # Dark frame
            params['min_detection_confidence'] = 0.3  # Lower threshold for dark scenes
        elif brightness > 200:  # Bright frame
            params['min_detection_confidence'] = 0.6  # Higher threshold for bright scenes
        else:
            params['min_detection_confidence'] = 0.5
        
        # Adjust based on contrast
        if contrast < 20:  # Low contrast
            params['roi_enlargement'] = 1.5  # Enlarge ROI to capture more features
        else:
            params['roi_enlargement'] = 1.2
        
        return params
    
    def process_frame_batch(self, frames: List[np.ndarray]) -> List[Any]:
        """
        Process multiple frames in parallel
        
        Args:
            frames: List of frames to process
            
        Returns:
            List of processing results
        """
        results = []
        
        # Submit tasks to thread pool
        futures = []
        for frame in frames:
            future = self.executor.submit(self._process_single_frame, frame)
            futures.append(future)
        
        # Collect results
        for future in as_completed(futures):
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                print(f"Error processing frame: {e}")
                results.append(None)
        
        return results
    
    def _process_single_frame(self, frame: np.ndarray):
        """
        Process a single frame (helper method for parallel processing)
        """
        # Apply optimizations
        optimized_frame = self.optimize_frame_processing(frame)
        
        # Generate embedding
        embedding = self.face_recognizer.generate_embedding(optimized_frame)
        
        if embedding is not None:
            # Recognize face
            recognition_result = self.face_recognizer.recognize_face(embedding)
            return recognition_result
        
        return None
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """
        Get current performance metrics
        
        Returns:
            Dictionary with performance metrics
        """
        if len(self.frame_processing_queue) > 0:
            avg_processing_time = sum(self.frame_processing_queue) / len(self.frame_processing_queue)
            avg_fps = 1.0 / avg_processing_time if avg_processing_time > 0 else 0
        else:
            avg_processing_time = 0
            avg_fps = 0
        
        if len(self.detection_quality_queue) > 0:
            avg_quality = sum(self.detection_quality_queue) / len(self.detection_quality_queue)
        else:
            avg_quality = 0
        
        return {
            'average_processing_time': avg_processing_time,
            'average_fps': avg_fps,
            'average_detection_quality': avg_quality,
            'frames_processed': len(self.frame_processing_queue),
            'optimization_params': self.optimization_params.copy()
        }
    
    def update_performance_stats(self, processing_time: float, detection_quality: float = 1.0):
        """
        Update performance statistics
        
        Args:
            processing_time: Time taken to process a frame
            detection_quality: Quality metric for the detection (0-1)
        """
        self.frame_processing_queue.append(processing_time)
        self.detection_quality_queue.append(detection_quality)
    
    def auto_tune_parameters(self) -> Dict[str, Any]:
        """
        Automatically tune parameters based on performance
        
        Returns:
            Updated optimization parameters
        """
        metrics = self.get_performance_metrics()
        
        # Adjust resize factor based on performance
        if metrics['average_fps'] < 10:  # Too slow
            self.optimization_params['resize_factor'] = max(0.3, self.optimization_params['resize_factor'] * 0.9)
        elif metrics['average_fps'] > 30:  # Too fast, can afford better quality
            self.optimization_params['resize_factor'] = min(1.0, self.optimization_params['resize_factor'] * 1.1)
        
        # Adjust frame skipping based on performance
        if metrics['average_fps'] < 15:
            self.optimization_params['skip_frames'] = min(5, self.optimization_params['skip_frames'] + 1)
        elif metrics['average_fps'] > 25:
            self.optimization_params['skip_frames'] = max(1, self.optimization_params['skip_frames'] - 1)
        
        # Adjust confidence threshold based on detection quality
        if metrics['average_detection_quality'] < 0.7:
            self.optimization_params['confidence_threshold'] = max(0.5, 
                self.optimization_params['confidence_threshold'] * 0.95)
        elif metrics['average_detection_quality'] > 0.9:
            self.optimization_params['confidence_threshold'] = min(0.9, 
                self.optimization_params['confidence_threshold'] * 1.05)
        
        return self.optimization_params.copy()


class FastFaceRecognizer:
    """
    High-performance face recognizer with multiple optimization strategies
    """
    
    def __init__(self, face_recognizer: FaceRecognizer, use_gpu: bool = False):
        """
        Initialize the fast face recognizer
        
        Args:
            face_recognizer: Base face recognizer instance
            use_gpu: Whether to attempt GPU acceleration
        """
        self.base_recognizer = face_recognizer
        self.use_gpu = use_gpu
        self.optimizer = PerformanceOptimizer(face_recognizer)
        self.face_locations_cache = {}  # Cache face locations between frames
        self.processing_lock = threading.Lock()
        self.last_frame_with_faces = None
        self.tracking_roi = None  # Region of interest for face tracking
        
        # Initialize CUDA if requested and available
        if self.use_gpu:
            self.gpu_available = self._check_gpu_availability()
        else:
            self.gpu_available = False
    
    def _check_gpu_availability(self) -> bool:
        """
        Check if GPU acceleration is available
        
        Returns:
            True if GPU is available, False otherwise
        """
        try:
            # Check for OpenCV CUDA availability
            return cv2.cuda.getCudaEnabledDeviceCount() > 0
        except:
            return False
    
    def fast_detect_faces(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Fast face detection using optimized techniques
        
        Args:
            frame: Input frame
            
        Returns:
            List of face bounding boxes (x, y, w, h)
        """
        start_time = time.time()
        
        # Use tracking ROI if available to limit search area
        if self.tracking_roi is not None:
            x, y, w, h = self.tracking_roi
            # Expand slightly to ensure face is captured
            margin_x = int(w * 0.1)
            margin_y = int(h * 0.1)
            
            roi = frame[max(0, y-margin_y):min(frame.shape[0], y+h+margin_y),
                       max(0, x-margin_x):min(frame.shape[1], x+w+margin_x)]
            
            # Temporarily store original dimensions
            orig_h, orig_w = frame.shape[:2]
            roi_h, roi_w = roi.shape[:2]
            
            # Process ROI at original or reduced scale
            if roi_h > 100 and roi_w > 100:  # Only optimize if ROI is reasonably large
                optimized_roi = self.optimizer.optimize_frame_processing(roi)
                # Run face detection on optimized ROI
                temp_result = self.base_recognizer.generate_embedding(optimized_roi)
                # Note: This is a simplified approach - in reality, you'd need to map 
                # the detected face coordinates back to the original frame
            else:
                # Use original ROI
                temp_result = self.base_recognizer.generate_embedding(roi)
        else:
            # Use full frame optimization
            optimized_frame = self.optimizer.optimize_frame_processing(frame)
            temp_result = self.base_recognizer.generate_embedding(optimized_frame)
        
        # For this implementation, we'll use the base recognizer's face detection
        # In a real optimized version, you might use a faster detector like Haar cascades
        # for initial detection and then the more accurate detector for recognition
        
        processing_time = time.time() - start_time
        self.optimizer.update_performance_stats(processing_time)
        
        # Return dummy face locations for now (in a real implementation, this would come from detection)
        # This is a placeholder since the base recognizer doesn't expose face detection separately
        return []
    
    def recognize_in_frame(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Recognize faces in a frame with performance optimizations
        
        Args:
            frame: Input frame
            
        Returns:
            List of recognition results
        """
        # Check if we should skip this frame based on optimization
        if self.optimizer.adaptive_frame_skip():
            # Still return cached results if available
            if self.last_frame_with_faces is not None:
                return self.last_frame_with_faces
            else:
                return []
        
        start_time = time.time()
        
        with self.processing_lock:
            # Apply frame optimization
            optimized_frame = self.optimizer.optimize_frame_processing(frame)
            
            # Generate embedding from optimized frame
            embedding = self.base_recognizer.generate_embedding(optimized_frame)
            
            results = []
            if embedding is not None:
                # Perform recognition
                recognition_result = self.base_recognizer.recognize_face(embedding)
                
                if recognition_result is not None:
                    student_id, confidence, student_info = recognition_result
                    results.append({
                        'student_id': student_id,
                        'confidence': confidence,
                        'student_info': student_info,
                        'embedding': embedding
                    })
                    
                    # Update tracking ROI for next frame
                    # In a real implementation, you'd extract the face location from the embedding
                    # For now, we'll just keep the result for potential reuse
                    self.last_frame_with_faces = results
            
            # Update performance metrics
            processing_time = time.time() - start_time
            detection_quality = 1.0 if results else 0.5  # Quality depends on whether we found faces
            self.optimizer.update_performance_stats(processing_time, detection_quality)
            
            # Auto-tune parameters based on performance
            self.optimizer.auto_tune_parameters()
            
            return results
    
    def batch_recognize(self, frames: List[np.ndarray]) -> List[List[Dict[str, Any]]]:
        """
        Recognize faces in multiple frames efficiently
        
        Args:
            frames: List of input frames
            
        Returns:
            List of recognition results for each frame
        """
        # Use the performance optimizer's batch processing
        return self.optimizer.process_frame_batch(frames)
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """
        Get current performance statistics
        
        Returns:
            Dictionary with performance statistics
        """
        return self.optimizer.get_performance_metrics()


class RealTimeFaceRecognitionPipeline:
    """
    Complete pipeline for real-time face recognition with all optimizations
    """
    
    def __init__(self, face_recognizer: FaceRecognizer):
        """
        Initialize the real-time pipeline
        
        Args:
            face_recognizer: Base face recognizer instance
        """
        self.fast_recognizer = FastFaceRecognizer(face_recognizer)
        self.is_running = False
        self.capture_thread = None
        self.results_callback = None
        self.fps_limit = 15  # Target FPS for real-time processing
    
    def start_real_time_recognition(self, camera_index: int = 0, callback: callable = None):
        """
        Start real-time face recognition from camera
        
        Args:
            camera_index: Index of camera to use
            callback: Callback function to receive recognition results
        """
        self.results_callback = callback
        self.is_running = True
        
        # Start capture thread
        self.capture_thread = threading.Thread(target=self._capture_loop, args=(camera_index,))
        self.capture_thread.daemon = True
        self.capture_thread.start()
    
    def _capture_loop(self, camera_index: int):
        """
        Internal loop for capturing and processing frames
        
        Args:
            camera_index: Index of camera to capture from
        """
        cap = cv2.VideoCapture(camera_index)
        
        # Set buffer size to 1 to reduce latency
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
        # Set camera properties for better performance
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        frame_time = 1.0 / self.fps_limit  # Time per frame to achieve target FPS
        
        while self.is_running:
            ret, frame = cap.read()
            if not ret:
                continue
            
            start_time = time.time()
            
            # Perform recognition
            results = self.fast_recognizer.recognize_in_frame(frame)
            
            # Execute callback if provided
            if self.results_callback and results:
                self.results_callback(results)
            
            # Maintain target FPS by sleeping if processing was too fast
            elapsed = time.time() - start_time
            sleep_time = frame_time - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)
        
        cap.release()
    
    def stop_real_time_recognition(self):
        """Stop real-time recognition"""
        self.is_running = False
        if self.capture_thread:
            self.capture_thread.join(timeout=2.0)  # Wait up to 2 seconds for thread to finish
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """
        Get performance statistics from the recognizer
        
        Returns:
            Dictionary with performance statistics
        """
        return self.fast_recognizer.get_performance_stats()


def optimize_face_recognition_system(face_recognizer: FaceRecognizer) -> FastFaceRecognizer:
    """
    Apply all optimizations to a face recognition system
    
    Args:
        face_recognizer: Base face recognizer to optimize
        
    Returns:
        Optimized face recognizer instance
    """
    return FastFaceRecognizer(face_recognizer)