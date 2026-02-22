"""
Registration Widget
Student details input and face enrollment
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QFormLayout,
    QLabel, QPushButton, QLineEdit, QComboBox, 
    QMessageBox, QFrame, QProgressBar
)
from PySide6.QtCore import Qt, Signal, QTimer, Slot
from PySide6.QtGui import QImage, QPixmap, QFont
from .styles import Colors, Styles
from core import FaceDetector, FaceRecognizer
from core.face_encoding_converter import convert_encoding, EncodingFormat
from database import SupabaseClient
import cv2
import numpy as np
from config.config import Config
from datetime import datetime


class RegistrationWidget(QWidget):
    """Registration interface for new students with face enrollment"""
    
    registration_complete = Signal()
    back_requested = Signal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet(Styles.GLOBAL_STYLE)
        self.db = SupabaseClient()
        self.face_detector = FaceDetector()
        self.face_recognizer = FaceRecognizer()
        
        self.camera = None
        self.timer = QTimer()
        self.timer.timeout.connect(self._update_frame)
        
        self.current_frame = None
        self.last_embedding = None
        self.captured_frame = None
        
        self._init_ui()
    
    def _init_ui(self):
        """Initialize UI components"""
        layout = QVBoxLayout(self)
        layout.setSpacing(20)
        layout.setContentsMargins(30, 20, 30, 20)
        
        # Header
        header_layout = QHBoxLayout()
        self.back_btn = QPushButton("← Back")
        self.back_btn.setMaximumWidth(100)
        self.back_btn.clicked.connect(self._on_back)
        header_layout.addWidget(self.back_btn)
        
        header_layout.addStretch()
        title = QLabel("Student Onboarding")
        title.setObjectName("Header")
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        layout.addLayout(header_layout)
        
        # Main content area
        content_layout = QHBoxLayout()
        content_layout.setSpacing(30)
        
        # Left: Form
        form_frame = QFrame()
        form_frame.setObjectName("Card")
        form_layout = QFormLayout(form_frame)
        form_layout.setContentsMargins(30, 30, 30, 30)
        form_layout.setSpacing(15)
        
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("Full Name")
        form_layout.addRow("Full Name:", self.name_input)
        
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("email@example.com")
        form_layout.addRow("Email:", self.email_input)
        
        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("Enter secure password")
        self.password_input.setEchoMode(QLineEdit.Password)
        form_layout.addRow("Password:", self.password_input)
        
        self.enrollment_input = QLineEdit()
        self.enrollment_input.setPlaceholderText("Enrollment Number")
        form_layout.addRow("Enrollment:", self.enrollment_input)
        
        self.class_combo = QComboBox()
        self.class_combo.setPlaceholderText("Select Class")
        form_layout.addRow("Class:", self.class_combo)
        
        self.branch_input = QLineEdit()
        self.branch_input.setPlaceholderText("Branch (e.g. CS, IT)")
        form_layout.addRow("Branch:", self.branch_input)
        
        # Student selection (for existing users)
        form_layout.addRow(QLabel("<hr>"))
        self.student_select = QComboBox()
        self.student_select.setPlaceholderText("Select Student to Enroll")
        self.student_select.currentIndexChanged.connect(self._on_student_selected)
        form_layout.addRow("Existing Student:", self.student_select)
        
        self.register_btn = QPushButton("Complete Enrollment")
        self.register_btn.setObjectName("PrimaryButton")
        self.register_btn.setMinimumHeight(55)
        self.register_btn.clicked.connect(self._register_student)
        form_layout.addRow("", self.register_btn)
        
        content_layout.addWidget(form_frame, 1)
        
        # Right: Camera/Face Enrollment
        camera_frame = QFrame()
        camera_frame.setObjectName("Card")
        camera_layout = QVBoxLayout(camera_frame)
        camera_layout.setContentsMargins(20, 20, 20, 20)
        
        # Camera feed area
        self.camera_label = QLabel()
        self.camera_label.setFixedSize(480, 360)
        self.camera_label.setAlignment(Qt.AlignCenter)
        self.camera_label.setStyleSheet(f"background-color: {Colors.BG_CARD}; border-radius: 12px; border: 2px solid {Colors.BORDER};")
        camera_layout.addWidget(self.camera_label)
        
        # Capture button
        self.capture_btn = QPushButton("📸 Capture Frame")
        self.capture_btn.setObjectName("PrimaryButton")
        self.capture_btn.setMinimumHeight(45)
        self.capture_btn.clicked.connect(self._capture_frame)
        camera_layout.addWidget(self.capture_btn)
        
        # Preview area for captured frame
        self.preview_label = QLabel("Captured frame will appear here")
        self.preview_label.setFixedSize(480, 240)
        self.preview_label.setAlignment(Qt.AlignCenter)
        self.preview_label.setStyleSheet(f"background-color: {Colors.BG_CARD}; border-radius: 12px; border: 2px dashed {Colors.BORDER};")
        self.preview_label.setVisible(False)  # Hide initially
        camera_layout.addWidget(self.preview_label)
        
        self.info_label = QLabel("Align your face within the guide")
        self.info_label.setAlignment(Qt.AlignCenter)
        self.info_label.setStyleSheet(f"color: {Colors.TEXT_SUB}; font-weight: 500;")
        camera_layout.addWidget(self.info_label)
        
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        camera_layout.addWidget(self.progress_bar)
        
        content_layout.addWidget(camera_frame, 1)
        
        layout.addLayout(content_layout)
        layout.addStretch()
    
    def load_data(self):
        """Load classes and start camera"""
        try:
            classes = self.db.get_all_classes()
            self.class_combo.clear()
            for cls in classes:
                self.class_combo.addItem(cls['name'], cls['id'])
            
            # Load unregistered students
            self.unregistered_students = self.db.get_unregistered_students()
            self.student_select.clear()
            self.student_select.addItem("-- Create New or Select Below --", None)
            for s in self.unregistered_students:
                label = f"{s['users']['full_name']} ({s['enrollment_number']})"
                self.student_select.addItem(label, s)
            
            self._start_camera()
        except Exception as e:
            print(f"Error loading registration data: {e}")
    
    def _start_camera(self):
        """Start camera feed"""
        if self.camera is not None:
            return
            
        self.camera = cv2.VideoCapture(Config.CAMERA_INDEX)
        self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        if self.camera.isOpened():
            self.timer.start(33)
        else:
            self.camera_label.setText("Failed to open camera")
    
    def _capture_frame(self):
        """Capture current frame and display in preview area"""
        if self.current_frame is None:
            QMessageBox.warning(self, "Error", "No camera feed available")
            return
        
        # Store the captured frame
        self.captured_frame = self.current_frame.copy()
        
        # Detect faces in captured frame for preview
        faces = self.face_detector.detect_faces(self.captured_frame)
        
        # Create annotated preview
        if faces:
            # Draw face detection on captured frame
            annotated_frame = self.captured_frame.copy()
            annotated_frame = self.face_detector.draw_detections(
                annotated_frame, 
                faces, 
                labels=[f"Face {i+1}" for i in range(len(faces))],
                color=(0, 255, 0)
            )
            
            # Add capture info
            cv2.putText(annotated_frame, "CAPTURED FRAME", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(annotated_frame, f"Faces: {len(faces)}", (10, 70), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        else:
            annotated_frame = self.captured_frame.copy()
            cv2.putText(annotated_frame, "NO FACES DETECTED", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        # Display in preview area
        self._display_preview(annotated_frame)
        
        # Update UI
        self.preview_label.setVisible(True)
        self.capture_btn.setText("📸 Recapture Frame")
        
        # Show feedback
        if len(faces) == 1:
            self.info_label.setText("Frame captured! Perfect for enrollment.")
            self.info_label.setStyleSheet(f"color: {Colors.SUCCESS}; font-weight: bold;")
        elif len(faces) > 1:
            self.info_label.setText("Frame captured with multiple faces. Recapture for best results.")
            self.info_label.setStyleSheet(f"color: {Colors.INFO}; font-weight: bold;")
            # Show warning popup
            QMessageBox.warning(
                self, 
                "Multiple Faces Detected", 
                "Multiple faces were detected in the captured frame. "
                "For best enrollment results, please ensure only one face is visible "
                "and recapture the frame."
            )
        else:
            self.info_label.setText("Frame captured but no faces detected. Please recapture.")
            self.info_label.setStyleSheet(f"color: {Colors.DANGER}; font-weight: bold;")
    
    def _display_preview(self, frame):
        """Display frame in preview area"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb_frame.shape
        bytes_per_line = ch * w
        
        qt_image = QImage(rgb_frame.data, w, h, bytes_per_line, QImage.Format_RGB888)
        pixmap = QPixmap.fromImage(qt_image)
        self.preview_label.setPixmap(pixmap.scaled(
            self.preview_label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation
        ))
    
    def _stop_camera(self):
        """Stop camera feed"""
        print("Stopping camera in registration view...")
        
        # Stop timer
        if self.timer and self.timer.isActive():
            self.timer.stop()
            print("Registration timer stopped")
        
        # Release camera
        if self.camera:
            try:
                self.camera.release()
                print("Registration camera released")
            except Exception as e:
                print(f"Error releasing registration camera: {e}")
            finally:
                self.camera = None
        
        # Clear UI
        if hasattr(self, 'camera_label'):
            self.camera_label.clear()
        
        print("Camera stopped in registration view")
    
    @Slot()
    def _update_frame(self):
        """Update frame with face detection feedback"""
        if not self.camera:
            return
            
        ret, frame = self.camera.read()
        if not ret:
            return
            
        self.current_frame = frame.copy()
        
        # Detect faces for feedback with improved parameters
        faces = self.face_detector.detect_faces(frame)
        
        # Filter faces to ensure we get the primary face
        if len(faces) > 1:
            # Sort by size (area) and take the largest face
            faces = sorted(faces, key=lambda bbox: bbox[2] * bbox[3], reverse=True)[:1]
        
        # Draw feedback (e.g. green box if valid face detected)
        if len(faces) == 1:
            bbox = faces[0]
            self.info_label.setText("Ready to capture")
            self.info_label.setStyleSheet(f"color: {Colors.SUCCESS}; font-weight: bold;")
            self.register_btn.setEnabled(True)
            
            # Draw box - fix: bbox format is (x, y, width, height)
            x, y, w, h = bbox
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            # Add face area indicator
            face_area = w * h
            frame_h, frame_w = frame.shape[:2]
            min_face_area = (frame_w * frame_h) * 0.05  # 5% of frame
            max_face_area = (frame_w * frame_h) * 0.4   # 40% of frame
            
            if face_area < min_face_area:
                cv2.putText(frame, "MOVE CLOSER", (x, y - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            elif face_area > max_face_area:
                cv2.putText(frame, "MOVE BACK", (x, y - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
            else:
                cv2.putText(frame, "PERFECT DISTANCE", (x, y - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        elif len(faces) > 1:
            self.info_label.setText("Multiple faces detected! Please stay alone.")
            self.info_label.setStyleSheet(f"color: {Colors.DANGER}; font-weight: bold;")
            self.register_btn.setEnabled(False)
        else:
            self.info_label.setText("No face detected")
            self.info_label.setStyleSheet(f"color: {Colors.TEXT_DIM}; font-weight: bold;")
            self.register_btn.setEnabled(False)
            
        self._display_frame(frame)
    
    def _display_frame(self, frame):
        """Display OpenCV frame in QLabel"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb_frame.shape
        bytes_per_line = ch * w
        
        qt_image = QImage(rgb_frame.data, w, h, bytes_per_line, QImage.Format_RGB888)
        pixmap = QPixmap.fromImage(qt_image)
        self.camera_label.setPixmap(pixmap.scaled(
            self.camera_label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation
        ))
    
    def _register_student(self):
        """Capture enrollment and register student"""
        name = self.name_input.text().strip()
        email = self.email_input.text().strip()
        enrollment = self.enrollment_input.text().strip()
        class_id = self.class_combo.currentData()
        class_name = self.class_combo.currentText()
        branch = self.branch_input.text().strip()
        
        # Check if we are enrolling an existing student
        selected_student = self.student_select.currentData()
        
        if selected_student:
            if not selected_student.get('id'):
                QMessageBox.warning(self, "Error", "Invalid student selection")
                return
        elif not all([name, email, enrollment, class_id]):
            QMessageBox.warning(self, "Validation Error", "Please fill all required fields or select an existing student")
            return
            
        # Use captured frame if available, otherwise use current frame
        frame_to_use = self.captured_frame if self.captured_frame is not None else self.current_frame
        
        if frame_to_use is None:
            QMessageBox.warning(self, "Error", "No frame available for registration")
            return
            
        # 1. Capture face and generate embedding
        self.info_label.setText("Capturing face...")
        self.register_btn.setEnabled(False)
        
        faces = self.face_detector.detect_faces(frame_to_use)
        if len(faces) != 1:
            QMessageBox.warning(self, "Error", "Precisely one face must be visible")
            self.register_btn.setEnabled(True)
            return
            
        face_region = self.face_detector.extract_face_region(frame_to_use, faces[0])
        mediapipe_embedding = self.face_recognizer.generate_embedding(face_region)
        
        if mediapipe_embedding is None:
            QMessageBox.warning(self, "Error", "Failed to generate face embedding")
            self.register_btn.setEnabled(True)
            return
            
        # Convert to enhanced format with metadata
        conversion_result = convert_encoding(
            mediapipe_embedding.tolist(), 
            EncodingFormat.MEDIAPIPE, 
            EncodingFormat.MEDIAPIPE
        )
        
        if not conversion_result['success']:
            QMessageBox.warning(self, "Error", f"Encoding conversion failed: {conversion_result.get('error')}")
            self.register_btn.setEnabled(True)
            return
            
        enhanced_encoding = conversion_result['encoding']
            
        # 2. Register in Database
        self.progress_bar.setVisible(True)
        self.progress_bar.setRange(0, 0) # Indeterminate
        
        if selected_student:
            # Face Enrollment Flow
            result = self.db.enroll_student_face(
                student_id=selected_student['id'],
                face_encoding=enhanced_encoding
            )
        else:
            # Registration Flow (if allowed)
            result = self.db.register_student(
                email=email,
                full_name=name,
                enrollment_number=enrollment,
                class_id=class_id,
                class_level=class_name,
                branch=branch,
                face_encoding=enhanced_encoding
            )
        
        self.progress_bar.setVisible(False)
        
        if result['success']:
            msg = f"Student {name or selected_student['users']['full_name']} enrolled successfully!"
            QMessageBox.information(self, "Success", msg)
            self._reset_form()
            self.registration_complete.emit()
            self._on_back()
        else:
            QMessageBox.critical(self, "Error", f"Operation failed: {result.get('error')}")
            self.register_btn.setEnabled(True)

    def _on_student_selected(self, index):
        """Pre-fill form if existing student is selected"""
        data = self.student_select.currentData()
        if data:
            self.name_input.setText(data['users']['full_name'])
            self.email_input.setText(data['users']['email'])
            self.enrollment_input.setText(data['enrollment_number'])
            self.branch_input.setText(data.get('branch', ''))
            # Find and set class if possible
            # (Simplified: just pre-fill strings for now)
            self.name_input.setReadOnly(True)
            self.email_input.setReadOnly(True)
            self.enrollment_input.setReadOnly(True)
        else:
            self._reset_form()
            self.name_input.setReadOnly(False)
            self.email_input.setReadOnly(False)
            self.enrollment_input.setReadOnly(False)
            
    def _reset_form(self):
        """Clear form fields"""
        self.name_input.clear()
        self.email_input.clear()
        self.enrollment_input.clear()
        self.branch_input.clear()
    
    def _reset_capture(self):
        """Reset capture state"""
        self.captured_frame = None
        self.preview_label.clear()
        self.preview_label.setText("Captured frame will appear here")
        self.preview_label.setVisible(False)
        self.capture_btn.setText("📸 Capture Frame")
        self.info_label.setText("Align your face within the guide")
        self.info_label.setStyleSheet(f"color: {Colors.TEXT_SUB}; font-weight: 500;")
        
    def _on_back(self):
        """Stop camera and return"""
        self._stop_camera()
        self.back_requested.emit()
