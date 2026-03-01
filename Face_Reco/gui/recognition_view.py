"""
Recognition Widget
Live camera feed with face recognition and attendance marking
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QHeaderView, QMessageBox,
    QFrame, QGroupBox, QSplitter
)
from PySide6.QtCore import Qt, Signal, QTimer, Slot
from PySide6.QtGui import QImage, QPixmap, QFont
from .styles import Colors, Styles
from core import FaceDetector, FaceRecognizer
from database import SupabaseClient
import cv2
import numpy as np
from datetime import datetime
from config.config import Config


class RecognitionWidget(QWidget):
    """Live recognition interface with camera feed and attendance logging"""
    
    session_ended = Signal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet(Styles.GLOBAL_STYLE)
        self.db = SupabaseClient()
        self.face_detector = FaceDetector()
        self.face_recognizer = FaceRecognizer()
        
        self.camera = None
        self.timer = QTimer()
        self.timer.timeout.connect(self._update_frame)
        
        self.session_data = None
        self.attendance_records = {}  # student_id -> timestamp
        
        self._init_ui()
    
    def _init_ui(self):
        """Initialize UI components"""
        layout = QVBoxLayout(self)
        layout.setSpacing(15)
        layout.setContentsMargins(20, 20, 20, 20)
        
        # Header
        header_layout = QHBoxLayout()
        
        self.session_label = QLabel("Session: Awaiting Data")
        self.session_label.setObjectName("Header")
        header_layout.addWidget(self.session_label)
        
        header_layout.addStretch()
        
        self.stop_btn = QPushButton("Terminate Session")
        self.stop_btn.setObjectName("DangerButton")
        self.stop_btn.setMinimumSize(180, 45)
        self.stop_btn.clicked.connect(self._stop_session)
        header_layout.addWidget(self.stop_btn)
        
        layout.addLayout(header_layout)
        
        # Main content splitter
        splitter = QSplitter(Qt.Horizontal)
        
        # Left: Camera feed
        camera_container = QFrame()
        camera_container.setObjectName("Card")
        camera_layout = QVBoxLayout(camera_container)
        
        self.camera_label = QLabel()
        self.camera_label.setAlignment(Qt.AlignCenter)
        self.camera_label.setMinimumSize(640, 480)
        self.camera_label.setStyleSheet(f"background-color: {Colors.BG_MAIN}; border-radius: 12px;")
        self.camera_label.setText("Camera Initializing...")
        camera_layout.addWidget(self.camera_label)
        
        # Capture controls
        capture_layout = QHBoxLayout()
        
        self.capture_btn = QPushButton("📸 Capture Frame")
        self.capture_btn.setObjectName("PrimaryButton")
        self.capture_btn.setMinimumSize(150, 40)
        self.capture_btn.clicked.connect(self._capture_frame)
        capture_layout.addWidget(self.capture_btn)
        
        capture_layout.addStretch()
        
        self.status_label = QLabel("Status: Idle")
        self.status_label.setStyleSheet("font-size: 13px; padding: 5px;")
        capture_layout.addWidget(self.status_label)
        
        capture_layout.addStretch()
        
        self.faces_label = QLabel("Faces Detected: 0")
        self.faces_label.setStyleSheet("font-size: 13px; padding: 5px;")
        capture_layout.addWidget(self.faces_label)
        
        camera_layout.addLayout(capture_layout)
        
        # Capture preview area
        self.preview_label = QLabel()
        self.preview_label.setAlignment(Qt.AlignCenter)
        self.preview_label.setMinimumSize(320, 240)
        self.preview_label.setMaximumHeight(240)
        self.preview_label.setStyleSheet(f"background-color: {Colors.BG_CARD}; border: 2px dashed {Colors.BORDER}; border-radius: 8px; margin: 10px;")
        self.preview_label.setText("Captured frame will appear here")
        self.preview_label.hide()  # Hide initially
        camera_layout.addWidget(self.preview_label)
        
        splitter.addWidget(camera_container)
        
        # Right: Attendance log
        log_container = QFrame()
        log_container.setObjectName("Card")
        log_layout = QVBoxLayout(log_container)
        
        log_title = QLabel("Attendance Log")
        log_title_font = QFont()
        log_title_font.setPointSize(14)
        log_title_font.setBold(True)
        log_title.setFont(log_title_font)
        log_layout.addWidget(log_title)
        
        self.attendance_table = QTableWidget()
        self.attendance_table.setColumnCount(4)
        self.attendance_table.setHorizontalHeaderLabels([
            "Time", "Name", "Enrollment", "Confidence"
        ])
        self.attendance_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.attendance_table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.attendance_table.setAlternatingRowColors(True)
        log_layout.addWidget(self.attendance_table)
        
        self.count_label = QLabel("Total Identified: 0")
        self.count_label.setStyleSheet(f"color: {Colors.SUCCESS}; font-weight: bold; font-size: 15px; padding: 10px;")
        log_layout.addWidget(self.count_label)
        
        splitter.addWidget(log_container)
        
        # Set splitter sizes (60% camera, 40% log)
        splitter.setSizes([600, 400])
        
        layout.addWidget(splitter)
    
    def _capture_frame(self):
        """Capture current frame and display in preview area"""
        if not self.camera or self.current_frame is None:
            self.status_label.setText("Status: No camera feed available")
            return
        
        # Capture the current frame
        ret, frame = self.camera.read()
        if not ret:
            self.status_label.setText("Status: Failed to capture frame")
            return
        
        # Process the captured frame (detect faces)
        faces = self.face_detector.detect_faces(frame)
        
        # Draw detections on captured frame
        if faces:
            labels = [f"Face {i+1}" for i in range(len(faces))]
            annotated_frame = self.face_detector.draw_detections(frame, faces, labels, (255, 0, 0))  # Blue color for captured frames
            self.status_label.setText(f"Status: Captured {len(faces)} face(s)")
        else:
            annotated_frame = frame
            self.status_label.setText("Status: Captured frame (no faces detected)")
        
        # Display in preview area
        self._display_preview(annotated_frame)
        self.preview_label.show()
        
        # Update capture button text
        self.capture_btn.setText("📸 Recapture Frame")
    
    def _display_preview(self, frame):
        """Display captured frame in preview area"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb_frame.shape
        bytes_per_line = ch * w
        
        qt_image = QImage(rgb_frame.data, w, h, bytes_per_line, QImage.Format_RGB888)
        pixmap = QPixmap.fromImage(qt_image)
        
        # Scale to fit preview area while maintaining aspect ratio
        scaled_pixmap = pixmap.scaled(
            self.preview_label.size(), 
            Qt.KeepAspectRatio, 
            Qt.SmoothTransformation
        )
        self.preview_label.setPixmap(scaled_pixmap)
        self.preview_label.setText("")
    
    def start_session(self, session_data: dict):
        """Start recognition session"""
        self.session_data = session_data
        self.attendance_records.clear()
        self.attendance_table.setRowCount(0)
        
        # Update session label
        self.session_label.setText(
            f"Session: {session_data['subject_name']} | {session_data['date']}"
        )
        
        # Load known faces from database
        self.status_label.setText("Status: Loading known faces...")
        try:
            students = self.db.get_students_with_face_encodings()
            loaded_count = self.face_recognizer.load_known_faces(students)
            
            if loaded_count == 0:
                QMessageBox.warning(
                    self,
                    "Warning",
                    "No students with face encodings found in database.\n"
                    "Please register students first."
                )
                self.session_ended.emit()
                return
            
            self.status_label.setText(f"Status: Loaded {loaded_count} known faces")
        
        except Exception as e:
            QMessageBox.critical(
                self,
                "Error",
                f"Failed to load known faces: {str(e)}"
            )
            self.session_ended.emit()
            return
        
        # Initialize camera
        self._init_camera()
    
    def _init_camera(self):
        """Initialize camera capture"""
        try:
            self.camera = cv2.VideoCapture(Config.CAMERA_INDEX)
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, Config.CAMERA_WIDTH)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, Config.CAMERA_HEIGHT)
            
            if not self.camera.isOpened():
                raise RuntimeError("Failed to open camera")
            
            # Start timer for frame updates (30 FPS)
            self.timer.start(33)
            self.status_label.setText("Status: Recognition Active")
            
            # Enable capture button
            self.capture_btn.setEnabled(True)
        
        except Exception as e:
            QMessageBox.critical(
                self,
                "Camera Error",
                f"Failed to initialize camera: {str(e)}"
            )
            self.session_ended.emit()
    
    @Slot()
    def _update_frame(self):
        """Update camera frame and perform recognition"""
        if not self.camera or not self.camera.isOpened():
            return
        
        ret, frame = self.camera.read()
        if not ret:
            return
        
        # Detect faces
        faces = self.face_detector.detect_faces(frame)
        
        # Update faces count
        self.faces_label.setText(f"Faces Detected: {len(faces)}")
        
        # Show warning for too many faces (might affect accuracy)
        if len(faces) > 3:
            self.faces_label.setStyleSheet(f"color: {Colors.INFO}; font-weight: bold;")
            self.status_label.setText("Status: Multiple faces detected (may affect accuracy)")
        elif len(faces) > 0:
            self.faces_label.setStyleSheet(f"color: {Colors.SUCCESS}; font-weight: bold;")
            self.status_label.setText("Status: Recognition Active")
        else:
            self.faces_label.setStyleSheet(f"color: {Colors.TEXT_SUB}; font-weight: normal;")
            self.status_label.setText("Status: No faces detected")
        
        labels = []
        
        # Process each detected face
        for bbox in faces:
            # Extract face region
            face_region = self.face_detector.extract_face_region(frame, bbox)
            
            if face_region is None:
                labels.append("Unknown")
                continue
            
            # Generate embedding
            embedding = self.face_recognizer.generate_embedding(face_region)
            
            if embedding is None:
                labels.append("Unknown")
                continue
            
            # Recognize face
            result = self.face_recognizer.recognize_face(embedding)
            
            if result:
                student_id, confidence, student_info = result
                name = student_info.get('name', 'Unknown')
                labels.append(f"{name} ({confidence:.2f})")
                
                # Mark attendance (only once per session)
                if student_id not in self.attendance_records:
                    self._mark_attendance(student_id, student_info, confidence)
            else:
                labels.append("Unknown")
        
        # Draw detections
        annotated_frame = self.face_detector.draw_detections(frame, faces, labels)
        
        # Display frame
        self._display_frame(annotated_frame)
    
    def _mark_attendance(self, student_id: str, student_info: dict, confidence: float):
        """Mark attendance for recognized student"""
        timestamp = datetime.now()
        
        # Save to database
        result = self.db.mark_attendance(
            student_id=student_id,
            subject_id=self.session_data['subject_id'],
            date=self.session_data['date'],
            status='present'
        )
        
        if result.get('success', False):
            # Add to local records
            self.attendance_records[student_id] = timestamp
            
            # Add to table
            row = self.attendance_table.rowCount()
            self.attendance_table.insertRow(row)
            
            self.attendance_table.setItem(row, 0, QTableWidgetItem(
                timestamp.strftime("%H:%M:%S")
            ))
            self.attendance_table.setItem(row, 1, QTableWidgetItem(
                student_info.get('name', 'Unknown')
            ))
            self.attendance_table.setItem(row, 2, QTableWidgetItem(
                student_info.get('enrollment_number', 'N/A')
            ))
            self.attendance_table.setItem(row, 3, QTableWidgetItem(
                f"{confidence:.2%}"
            ))
            
            # Update count
            self.count_label.setText(f"Total Present: {len(self.attendance_records)}")
    
    def _display_frame(self, frame: np.ndarray):
        """Display frame in QLabel"""
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        h, w, ch = rgb_frame.shape
        bytes_per_line = ch * w
        
        qt_image = QImage(
            rgb_frame.data,
            w, h,
            bytes_per_line,
            QImage.Format_RGB888
        )
        
        # Scale to fit label
        pixmap = QPixmap.fromImage(qt_image)
        scaled_pixmap = pixmap.scaled(
            self.camera_label.size(),
            Qt.KeepAspectRatio,
            Qt.SmoothTransformation
        )
        
        self.camera_label.setPixmap(scaled_pixmap)
    
    def _stop_session(self):
        """Stop recognition and save attendance"""
        self.stop_recognition()
        
        QMessageBox.information(
            self,
            "Session Ended",
            f"Attendance saved successfully!\n\n"
            f"Total students marked present: {len(self.attendance_records)}"
        )
        
        self.session_ended.emit()
    
    def stop_recognition(self):
        """Stop camera and timer"""
        print("Stopping recognition process...")
        
        # Stop timer first
        if self.timer and self.timer.isActive():
            self.timer.stop()
            print("Timer stopped")
        
        # Release camera
        if self.camera:
            try:
                self.camera.release()
                print("Camera released")
            except Exception as e:
                print(f"Error releasing camera: {e}")
            finally:
                self.camera = None
        
        # Update UI
        if hasattr(self, 'camera_label'):
            self.camera_label.setText("Camera Stopped")
        if hasattr(self, 'status_label'):
            self.status_label.setText("Status: Idle")
        if hasattr(self, 'capture_btn'):
            self.capture_btn.setText("📸 Capture Frame")
            self.capture_btn.setEnabled(False)
        if hasattr(self, 'preview_label'):
            self.preview_label.hide()
            self.preview_label.setText("Captured frame will appear here")
        
        print("Recognition process stopped")
