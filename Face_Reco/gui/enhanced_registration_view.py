"""
Enhanced Registration Widget
Implements the complete hierarchical workflow for face encoding registration
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QFormLayout, QGridLayout,
    QLabel, QPushButton, QLineEdit, QComboBox, QMessageBox,
    QFrame, QProgressBar, QGroupBox, QStackedWidget, QScrollArea
)
from PySide6.QtCore import Qt, Signal, QTimer, Slot, QSize
from PySide6.QtGui import QImage, QPixmap, QFont, QIcon
import cv2
import numpy as np
from datetime import datetime
import json
import logging

from .styles import Colors, Styles
from core.face_registration_service import (
    FaceRegistrationService, 
    FaceQuality,
    RegistrationStatus
)
from database import SupabaseClient
from config.config import Config

logger = logging.getLogger(__name__)


class EnhancedRegistrationWidget(QWidget):
    """
    Enhanced registration interface implementing the complete workflow:
    1. Department → Branch → Academic Year → Class → Student selection
    2. Student verification check
    3. Multi-frame face capture with quality assessment
    4. Face encoding generation and storage
    """
    
    registration_complete = Signal(str)  # Emits student_id on success
    back_requested = Signal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet(Styles.GLOBAL_STYLE)
        
        # Services
        self.db = SupabaseClient()
        self.registration_service = FaceRegistrationService()
        
        # Camera
        self.camera = None
        self.timer = QTimer()
        self.timer.timeout.connect(self._update_camera_feed)
        
        # State
        self.current_frame = None
        self.capture_results = []
        self.current_student_id = None
        self.current_step = 0  # 0: Selection, 1: Verification, 2: Capture, 3: Review
        
        # Data
        self.departments = []
        self.branches = []
        self.academic_years = []
        self.classes = []
        self.students = []
        
        self._init_ui()
        self._load_initial_data()
    
    def _init_ui(self):
        """Initialize the enhanced UI"""
        layout = QVBoxLayout(self)
        layout.setSpacing(15)
        layout.setContentsMargins(20, 15, 20, 15)
        
        # Header
        header_layout = QHBoxLayout()
        
        self.back_btn = QPushButton("← Back to Dashboard")
        self.back_btn.setMaximumWidth(150)
        self.back_btn.clicked.connect(self._on_back)
        header_layout.addWidget(self.back_btn)
        
        header_layout.addStretch()
        
        self.title_label = QLabel("Face Encoding Registration")
        self.title_label.setObjectName("PageTitle")
        header_layout.addWidget(self.title_label)
        
        header_layout.addStretch()
        
        self.step_indicator = QLabel("Step 1/4: Student Selection")
        self.step_indicator.setObjectName("StepIndicator")
        header_layout.addWidget(self.step_indicator)
        
        layout.addLayout(header_layout)
        
        # Main content area with steps
        self.stacked_widget = QStackedWidget()
        
        # Step 1: Hierarchical Selection
        self.selection_widget = self._create_selection_widget()
        self.stacked_widget.addWidget(self.selection_widget)
        
        # Step 2: Verification
        self.verification_widget = self._create_verification_widget()
        self.stacked_widget.addWidget(self.verification_widget)
        
        # Step 3: Face Capture
        self.capture_widget = self._create_capture_widget()
        self.stacked_widget.addWidget(self.capture_widget)
        
        # Step 4: Review and Confirm
        self.review_widget = self._create_review_widget()
        self.stacked_widget.addWidget(self.review_widget)
        
        layout.addWidget(self.stacked_widget)
        
        # Navigation buttons
        nav_layout = QHBoxLayout()
        nav_layout.setSpacing(20)
        
        self.prev_btn = QPushButton("← Previous")
        self.prev_btn.setObjectName("SecondaryButton")
        self.prev_btn.setMinimumWidth(120)
        self.prev_btn.clicked.connect(self._go_previous)
        self.prev_btn.setEnabled(False)
        nav_layout.addWidget(self.prev_btn)
        
        nav_layout.addStretch()
        
        self.next_btn = QPushButton("Next →")
        self.next_btn.setObjectName("PrimaryButton")
        self.next_btn.setMinimumWidth(120)
        self.next_btn.clicked.connect(self._go_next)
        nav_layout.addWidget(self.next_btn)
        
        layout.addLayout(nav_layout)
    
    def _create_selection_widget(self) -> QWidget:
        """Create the hierarchical selection widget"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(20)
        
        # Instructions
        instructions = QLabel(
            "Select the student for face registration using the hierarchical filters below. "
            "Start by selecting the department, then branch, academic year, class, and finally the student."
        )
        instructions.setWordWrap(True)
        instructions.setStyleSheet(f"color: {Colors.TEXT_SUB}; padding: 10px;")
        layout.addWidget(instructions)
        
        # Selection grid
        grid = QGridLayout()
        grid.setSpacing(15)
        
        # Department
        grid.addWidget(QLabel("Department:"), 0, 0)
        self.dept_combo = QComboBox()
        self.dept_combo.setPlaceholderText("Select Department")
        self.dept_combo.currentIndexChanged.connect(self._on_department_selected)
        grid.addWidget(self.dept_combo, 0, 1)
        
        # Branch
        grid.addWidget(QLabel("Branch:"), 1, 0)
        self.branch_combo = QComboBox()
        self.branch_combo.setPlaceholderText("Select Branch")
        self.branch_combo.setEnabled(False)
        self.branch_combo.currentIndexChanged.connect(self._on_branch_selected)
        grid.addWidget(self.branch_combo, 1, 1)
        
        # Academic Year
        grid.addWidget(QLabel("Academic Year:"), 2, 0)
        self.year_combo = QComboBox()
        self.year_combo.setPlaceholderText("Select Academic Year")
        self.year_combo.setEnabled(False)
        self.year_combo.currentIndexChanged.connect(self._on_year_selected)
        grid.addWidget(self.year_combo, 2, 1)
        
        # Class
        grid.addWidget(QLabel("Class:"), 3, 0)
        self.class_combo = QComboBox()
        self.class_combo.setPlaceholderText("Select Class")
        self.class_combo.setEnabled(False)
        self.class_combo.currentIndexChanged.connect(self._on_class_selected)
        grid.addWidget(self.class_combo, 3, 1)
        
        # Student
        grid.addWidget(QLabel("Student:"), 4, 0)
        self.student_combo = QComboBox()
        self.student_combo.setPlaceholderText("Select Student")
        self.student_combo.setEnabled(False)
        self.student_combo.currentIndexChanged.connect(self._on_student_selected)
        grid.addWidget(self.student_combo, 4, 1)
        
        layout.addLayout(grid)
        layout.addStretch()
        
        return widget
    def _create_verification_widget(self) -> QWidget:
        """Create the student verification widget"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(20)
        
        # Student info card
        self.student_info_frame = QFrame()
        self.student_info_frame.setObjectName("Card")
        self.student_info_frame.setMinimumHeight(150)
        
        info_layout = QVBoxLayout(self.student_info_frame)
        info_layout.setContentsMargins(20, 20, 20, 20)
        
        self.student_name_label = QLabel("Student: Not Selected")
        self.student_name_label.setObjectName("StudentName")
        info_layout.addWidget(self.student_name_label)
        
        self.student_details_label = QLabel("Enrollment: -- | Class: -- | Branch: --")
        self.student_details_label.setStyleSheet(f"color: {Colors.TEXT_SUB};")
        info_layout.addWidget(self.student_details_label)
        
        self.verification_status_label = QLabel("Verification Status: Pending")
        self.verification_status_label.setStyleSheet(f"color: {Colors.WARNING}; font-weight: bold;")
        info_layout.addWidget(self.verification_status_label)
        
        self.verification_details_label = QLabel("")
        self.verification_details_label.setWordWrap(True)
        info_layout.addWidget(self.verification_details_label)
        
        layout.addWidget(self.student_info_frame)
        
        # Verification requirements
        requirements_group = QGroupBox("Verification Requirements")
        requirements_group.setStyleSheet(Styles.GROUP_BOX_STYLE)
        
        req_layout = QVBoxLayout(requirements_group)
        
        requirements = [
            "✓ Student must exist in FRAMS database",
            "✓ Student account must be verified by admin",
            "✓ Student account must be active (not deleted)",
            "✗ Student must not have existing face encoding"
        ]
        
        for req in requirements:
            label = QLabel(req)
            label.setStyleSheet(f"padding: 5px; color: {Colors.TEXT_SUB};")
            req_layout.addWidget(label)
        
        layout.addWidget(requirements_group)
        
        # Action buttons
        action_layout = QHBoxLayout()
        
        self.verify_btn = QPushButton("Verify Student")
        self.verify_btn.setObjectName("PrimaryButton")
        self.verify_btn.setMinimumHeight(45)
        self.verify_btn.clicked.connect(self._verify_student)
        action_layout.addWidget(self.verify_btn)
        
        self.retry_btn = QPushButton("Select Different Student")
        self.retry_btn.setObjectName("SecondaryButton")
        self.retry_btn.setMinimumHeight(45)
        self.retry_btn.clicked.connect(lambda: self._go_to_step(0))
        self.retry_btn.setVisible(False)
        action_layout.addWidget(self.retry_btn)
        
        layout.addLayout(action_layout)
        layout.addStretch()
        
        return widget
    
    def _create_capture_widget(self) -> QWidget:
        """Create the face capture widget"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(20)
        
        # Camera feed area
        camera_group = QGroupBox("Face Capture")
        camera_group.setStyleSheet(Styles.GROUP_BOX_STYLE)
        
        camera_layout = QVBoxLayout(camera_group)
        
        # Camera feed
        self.camera_label = QLabel()
        self.camera_label.setFixedSize(640, 480)
        self.camera_label.setAlignment(Qt.AlignCenter)
        self.camera_label.setStyleSheet(
            f"background-color: {Colors.BG_CARD}; "
            f"border-radius: 8px; "
            f"border: 2px solid {Colors.BORDER};"
        )
        camera_layout.addWidget(self.camera_label, 0, Qt.AlignCenter)
        
        # Capture controls
        controls_layout = QHBoxLayout()
        
        self.start_capture_btn = QPushButton("▶ Start Capture")
        self.start_capture_btn.setObjectName("PrimaryButton")
        self.start_capture_btn.setMinimumHeight(40)
        self.start_capture_btn.clicked.connect(self._start_capture)
        controls_layout.addWidget(self.start_capture_btn)
        
        self.stop_capture_btn = QPushButton("⏹ Stop Capture")
        self.stop_capture_btn.setObjectName("SecondaryButton")
        self.stop_capture_btn.setMinimumHeight(40)
        self.stop_capture_btn.clicked.connect(self._stop_capture)
        self.stop_capture_btn.setEnabled(False)
        controls_layout.addWidget(self.stop_capture_btn)
        
        camera_layout.addLayout(controls_layout)
        
        # Quality feedback
        self.quality_label = QLabel("Camera not active")
        self.quality_label.setAlignment(Qt.AlignCenter)
        self.quality_label.setStyleSheet(f"color: {Colors.TEXT_SUB}; font-weight: 500;")
        camera_layout.addWidget(self.quality_label)
        
        # Progress
        self.capture_progress = QProgressBar()
        self.capture_progress.setRange(0, 5)
        self.capture_progress.setValue(0)
        self.capture_progress.setFormat("Frames captured: %v/%m")
        self.capture_progress.setVisible(False)
        camera_layout.addWidget(self.capture_progress)
        
        layout.addWidget(camera_group)
        
        # Capture previews
        self.preview_container = QWidget()
        preview_layout = QHBoxLayout(self.preview_container)
        preview_layout.setSpacing(10)
        
        # Create 5 preview slots
        self.preview_labels = []
        for i in range(5):
            preview_label = QLabel(f"Frame {i+1}")
            preview_label.setFixedSize(120, 90)
            preview_label.setAlignment(Qt.AlignCenter)
            preview_label.setStyleSheet(
                f"background-color: {Colors.BG_CARD}; "
                f"border-radius: 6px; "
                f"border: 2px dashed {Colors.BORDER}; "
                f"color: {Colors.TEXT_DIM};"
            )
            self.preview_labels.append(preview_label)
            preview_layout.addWidget(preview_label)
        
        preview_layout.addStretch()
        self.preview_container.setVisible(False)
        layout.addWidget(self.preview_container)
        
        # Instructions
        instructions = QLabel(
            "Instructions:\n"
            "1. Ensure good lighting (face should be well-lit but not overexposed)\n"
            "2. Face the camera directly\n"
            "3. Remove glasses, masks, or hats if possible\n"
            "4. Maintain a neutral expression\n"
            "5. Stay still while capturing"
        )
        instructions.setStyleSheet(f"color: {Colors.TEXT_SUB}; padding: 10px; background-color: {Colors.BG_CARD}; border-radius: 8px;")
        instructions.setWordWrap(True)
        layout.addWidget(instructions)
        
        layout.addStretch()
        
        return widget
    
    def _create_review_widget(self) -> QWidget:
        """Create the review and confirmation widget"""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(20)
        
        # Summary card
        summary_group = QGroupBox("Registration Summary")
        summary_group.setStyleSheet(Styles.GROUP_BOX_STYLE)
        
        summary_layout = QVBoxLayout(summary_group)
        
        self.summary_student_label = QLabel("Student: --")
        self.summary_student_label.setObjectName("StudentName")
        summary_layout.addWidget(self.summary_student_label)
        
        self.summary_frames_label = QLabel("Frames captured: 0")
        summary_layout.addWidget(self.summary_frames_label)
        
        self.summary_quality_label = QLabel("Average quality: --")
        summary_layout.addWidget(self.summary_quality_label)
        
        self.summary_duplicate_label = QLabel("Duplicate check: Not performed")
        summary_layout.addWidget(self.summary_duplicate_label)
        
        layout.addWidget(summary_group)
        
        # Preview of best frame
        preview_group = QGroupBox("Best Quality Frame")
        preview_group.setStyleSheet(Styles.GROUP_BOX_STYLE)
        
        preview_layout = QVBoxLayout(preview_group)
        
        self.best_frame_label = QLabel("No frame selected")
        self.best_frame_label.setFixedSize(320, 240)
        self.best_frame_label.setAlignment(Qt.AlignCenter)
        self.best_frame_label.setStyleSheet(
            f"background-color: {Colors.BG_CARD}; "
            f"border-radius: 8px; "
            f"border: 2px solid {Colors.BORDER};"
        )
        preview_layout.addWidget(self.best_frame_label, 0, Qt.AlignCenter)
        
        layout.addWidget(preview_group)
        
        # Action buttons
        action_layout = QHBoxLayout()
        
        self.retry_capture_btn = QPushButton("↺ Retry Capture")
        self.retry_capture_btn.setObjectName("SecondaryButton")
        self.retry_capture_btn.setMinimumHeight(45)
        self.retry_capture_btn.clicked.connect(lambda: self._go_to_step(2))
        action_layout.addWidget(self.retry_capture_btn)
        
        self.complete_btn = QPushButton("✓ Complete Registration")
        self.complete_btn.setObjectName("SuccessButton")
        self.complete_btn.setMinimumHeight(45)
        self.complete_btn.clicked.connect(self._complete_registration)
        action_layout.addWidget(self.complete_btn)
        
        layout.addLayout(action_layout)
        
        # Progress for final registration
        self.final_progress = QProgressBar()
        self.final_progress.setRange(0, 0)  # Indeterminate
        self.final_progress.setVisible(False)
        layout.addWidget(self.final_progress)
        
        # Status message
        self.final_status_label = QLabel("")
        self.final_status_label.setWordWrap(True)
        self.final_status_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.final_status_label)
        
        layout.addStretch()
        
        return widget
    # ==================== DATA LOADING ====================
    
    def load_data(self):
        """Public method to reload data - called when view is shown"""
        self._load_initial_data()
    
    def _load_initial_data(self):
        """Load initial data for selection"""
        try:
            # Load departments
            self.departments = self.registration_service.get_departments()
            self.dept_combo.clear()
            self.dept_combo.addItem("Select Department", None)
            for dept in self.departments:
                self.dept_combo.addItem(dept['name'], dept['id'])
            print(f"Loaded {len(self.departments)} departments")
            
            # Load academic years
            self.academic_years = self.registration_service.get_academic_years()
            self.year_combo.clear()
            self.year_combo.addItem("Select Academic Year", None)
            for year in self.academic_years:
                display = f"{year['name']} ({'Current' if year.get('is_current') else 'Past'})"
                self.year_combo.addItem(display, year['id'])
            print(f"Loaded {len(self.academic_years)} academic years")
            
            print("Initial data loaded successfully")
            
        except Exception as e:
            print(f"Error loading initial data: {e}")
            import traceback
            traceback.print_exc()
            QMessageBox.warning(self, "Data Error", f"Failed to load initial data: {e}")
    def load_data(self):
        """Public method to reload data - called when view is shown"""
        self._load_initial_data()
    
    # ==================== SELECTION HANDLERS ====================
    
    def _on_department_selected(self, index):
        """Handle department selection"""
        print(f"Department selected: index={index}")
        if index <= 0:
            self.branch_combo.clear()
            self.branch_combo.addItem("Select Branch", None)
            self.branch_combo.setEnabled(False)
            return
        
        dept_id = self.dept_combo.currentData()
        dept_name = self.dept_combo.currentText()
        print(f"Department: {dept_name} (ID: {dept_id})")
        if not dept_id:
            return
        
        # Load branches filtered by department
        self.branches = self.registration_service.get_branches_by_department(dept_id)
        print(f"Loaded {len(self.branches)} branches for department {dept_name}")
        
        self.branch_combo.clear()
        self.branch_combo.addItem("Select Branch", None)
        self.branch_combo.setEnabled(True)
        
        for branch in self.branches:
            self.branch_combo.addItem(branch['name'], branch['id'])
            print(f"  - Branch: {branch['name']}")
        
        # Reset downstream selections
        self._reset_downstream_selections()
    
    def _on_branch_selected(self, index):
        """Handle branch selection"""
        if index <= 0:
            self.year_combo.setEnabled(False)
            self._reset_downstream_selections()
            return
        
        # Enable year selection
        self.year_combo.setEnabled(True)
        self._load_classes()
    
    def _on_year_selected(self, index):
        """Handle academic year selection"""
        if index <= 0:
            self._reset_downstream_selections()
            return
        
        self._load_classes()
    
    def _load_classes(self):
        """Load classes based on current filters"""
        dept_id = self.dept_combo.currentData() if self.dept_combo.currentIndex() > 0 and self.dept_combo.isVisible() else None
        branch_id = self.branch_combo.currentData() if self.branch_combo.currentIndex() > 0 and self.branch_combo.isVisible() else None
        year_id = self.year_combo.currentData() if self.year_combo.currentIndex() > 0 else None
        
        print(f"Loading classes with filters: dept_id={dept_id}, branch_id={branch_id}, year_id={year_id}")
        
        # Load classes (with or without filters)
        self.classes = self.registration_service.get_classes_by_filters(
            department_id=dept_id,
            branch_id=branch_id,
            academic_year_id=year_id
        )
        
        print(f"Loaded {len(self.classes)} classes")
        
        self.class_combo.clear()
        self.class_combo.addItem("Select Class", None)
        self.class_combo.setEnabled(True)
        
        for cls in self.classes:
            self.class_combo.addItem(cls['name'], cls['id'])
            print(f"  - Class: {cls['name']}")
        
        # Reset student selection
        self.student_combo.clear()
        self.student_combo.addItem("Select Student", None)
        self.student_combo.setEnabled(False)
    
    def _on_class_selected(self, index):
        """Handle class selection"""
        if index <= 0:
            self.student_combo.clear()
            self.student_combo.addItem("Select Student", None)
            self.student_combo.setEnabled(False)
            return
        
        class_id = self.class_combo.currentData()
        if not class_id:
            return
        
        # Load students for selected class
        self.students = self.registration_service.get_students_by_class(
            class_id, include_verified_only=True
        )
        
        self.student_combo.clear()
        self.student_combo.addItem("Select Student", None)
        self.student_combo.setEnabled(True)
        
        for student in self.students:
            user_data = student.get('users', {})
            label = f"{user_data.get('full_name', 'Unknown')} ({student.get('enrollment_number', 'N/A')})"
            self.student_combo.addItem(label, student['id'])
    
    def _on_student_selected(self, index):
        """Handle student selection"""
        if index <= 0:
            self.current_student_id = None
            self.next_btn.setEnabled(False)
            return
        
        self.current_student_id = self.student_combo.currentData()
        self.next_btn.setEnabled(True)
    
    def _reset_downstream_selections(self):
        """Reset all selections downstream of the current selection"""
        self.year_combo.setEnabled(False)
        
        self.class_combo.clear()
        self.class_combo.addItem("Select Class", None)
        self.class_combo.setEnabled(False)
        
        self.student_combo.clear()
        self.student_combo.addItem("Select Student", None)
        self.student_combo.setEnabled(False)
        
        self.current_student_id = None
        self.next_btn.setEnabled(False)
    
    # ==================== STEP NAVIGATION ====================
    
    def _go_next(self):
        """Navigate to next step"""
        if self.current_step == 0:
            # Validate student selection
            if not self.current_student_id:
                QMessageBox.warning(self, "Selection Required", "Please select a student first.")
                return
            
            # Load student data for verification step
            self._load_student_data()
            self._go_to_step(1)
            
        elif self.current_step == 1:
            # Move to capture step
            self._go_to_step(2)
            
        elif self.current_step == 2:
            # Validate capture results
            if len(self.capture_results) < 3:
                QMessageBox.warning(
                    self, 
                    "Insufficient Frames", 
                    f"Please capture at least 3 quality frames. Currently: {len(self.capture_results)}"
                )
                return
            
            # Move to review step
            self._update_review_summary()
            self._go_to_step(3)
            
        elif self.current_step == 3:
            # This should be handled by complete button
            pass
    
    def _go_previous(self):
        """Navigate to previous step"""
        if self.current_step > 0:
            self._go_to_step(self.current_step - 1)
    
    def _go_to_step(self, step: int):
        """Navigate to specific step"""
        self.current_step = step
        self.stacked_widget.setCurrentIndex(step)
        
        # Update step indicator
        step_names = ["Student Selection", "Verification", "Face Capture", "Review & Confirm"]
        self.step_indicator.setText(f"Step {step+1}/4: {step_names[step]}")
        
        # Update navigation buttons
        self.prev_btn.setEnabled(step > 0)
        
        if step == 0:
            self.next_btn.setText("Next →")
            self.next_btn.setEnabled(self.current_student_id is not None)
        elif step == 1:
            self.next_btn.setText("Next →")
            self.next_btn.setEnabled(True)
        elif step == 2:
            self.next_btn.setText("Review →")
            self.next_btn.setEnabled(len(self.capture_results) >= 3)
        elif step == 3:
            self.next_btn.setText("Complete")
            self.next_btn.setEnabled(False)
        
        # Step-specific setup
        if step == 2:
            self._setup_capture_step()
        elif step == 3:
            self._setup_review_step()
    
    # ==================== VERIFICATION STEP ====================
    
    def _load_student_data(self):
        """Load and display student data for verification"""
        if not self.current_student_id:
            return
        
        # Find student in loaded data
        student = None
        for s in self.students:
            if s['id'] == self.current_student_id:
                student = s
                break
        
        if not student:
            return
        
        user_data = student.get('users', {})
        
        # Update student info
        self.student_name_label.setText(f"Student: {user_data.get('full_name', 'Unknown')}")
        
        details = f"Enrollment: {student.get('enrollment_number', 'N/A')} | "
        details += f"Email: {user_data.get('email', 'N/A')}"
        self.student_details_label.setText(details)
        
        # Store for later use
        self.selected_student_data = student
    
    def _verify_student(self):
        """Verify the selected student"""
        if not self.current_student_id:
            QMessageBox.warning(self, "No Student", "Please select a student first.")
            return
        
        self.verify_btn.setEnabled(False)
        self.verification_status_label.setText("Verification Status: Checking...")
        self.verification_status_label.setStyleSheet(f"color: {Colors.INFO}; font-weight: bold;")
        
        # Perform verification
        result = self.registration_service.verify_student_for_registration(
            self.current_student_id
        )
        
        if result.valid:
            # Student is valid for registration
            self.verification_status_label.setText("✓ Verification Status: PASSED")
            self.verification_status_label.setStyleSheet(f"color: {Colors.SUCCESS}; font-weight: bold;")
            
            self.verification_details_label.setText(
                "Student is verified and eligible for face registration."
            )
            self.verification_details_label.setStyleSheet(f"color: {Colors.SUCCESS};")
            
            self.next_btn.setEnabled(True)
            self.retry_btn.setVisible(False)
            
        else:
            # Student verification failed
            self.verification_status_label.setText("✗ Verification Status: FAILED")
            self.verification_status_label.setStyleSheet(f"color: {Colors.DANGER}; font-weight: bold;")
            
            self.verification_details_label.setText(result.error)
            self.verification_details_label.setStyleSheet(f"color: {Colors.DANGER};")
            
            self.next_btn.setEnabled(False)
            self.retry_btn.setVisible(True)
            
            if result.requires_confirmation:
                # Ask for confirmation to overwrite
                reply = QMessageBox.question(
                    self,
                    "Existing Face Encoding",
                    "This student already has a face encoding. Do you want to overwrite it?",
                    QMessageBox.Yes | QMessageBox.No,
                    QMessageBox.No
                )
                
                if reply == QMessageBox.Yes:
                    self.next_btn.setEnabled(True)
                    self.verification_details_label.setText(
                        "Warning: Existing face encoding will be overwritten."
                    )
        
        self.verify_btn.setEnabled(True)
    # ==================== CAPTURE STEP ====================
    
    def _setup_capture_step(self):
        """Setup for capture step"""
        self.capture_results = []
        self.capture_progress.setValue(0)
        self.capture_progress.setVisible(False)
        
        # Clear previews
        for label in self.preview_labels:
            label.clear()
            label.setText(f"Frame {self.preview_labels.index(label) + 1}")
            label.setStyleSheet(
                f"background-color: {Colors.BG_CARD}; "
                f"border-radius: 6px; "
                f"border: 2px dashed {Colors.BORDER}; "
                f"color: {Colors.TEXT_DIM};"
            )
        
        self.preview_container.setVisible(False)
        self.quality_label.setText("Click 'Start Capture' to begin")
        
        # Start camera if not already running
        if self.camera is None:
            self._start_camera()
    
    def _start_camera(self):
        """Start camera feed"""
        if self.camera is not None:
            return
        
        self.camera = cv2.VideoCapture(Config.CAMERA_INDEX)
        self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        if self.camera.isOpened():
            self.timer.start(33)  # ~30 FPS
            self.quality_label.setText("Camera active - aligning face...")
        else:
            self.quality_label.setText("Failed to open camera")
            self.camera = None
    
    def _stop_camera(self):
        """Stop camera feed"""
        if self.timer.isActive():
            self.timer.stop()
        
        if self.camera:
            self.camera.release()
            self.camera = None
        
        self.camera_label.clear()
        self.quality_label.setText("Camera stopped")
    
    def _start_capture(self):
        """Start the capture process"""
        self.start_capture_btn.setEnabled(False)
        self.stop_capture_btn.setEnabled(True)
        self.capture_progress.setVisible(True)
        self.preview_container.setVisible(True)
        
        # Reset capture state
        self.capture_results = []
        self.capture_progress.setValue(0)
        
        self.quality_label.setText("Capturing frames...")
    
    def _stop_capture(self):
        """Stop the capture process"""
        self.start_capture_btn.setEnabled(True)
        self.stop_capture_btn.setEnabled(False)
        
        captured_count = len(self.capture_results)
        if captured_count > 0:
            self.quality_label.setText(f"Capture complete: {captured_count} frames captured")
            self.next_btn.setEnabled(captured_count >= 3)
        else:
            self.quality_label.setText("Capture stopped - no frames captured")
    
    @Slot()
    def _update_camera_feed(self):
        """Update camera feed with face detection"""
        if not self.camera or not self.camera.isOpened():
            return
        
        ret, frame = self.camera.read()
        if not ret:
            return
        
        self.current_frame = frame.copy()
        
        # Detect faces for feedback
        faces = self.registration_service.face_detector.detect_faces(frame)
        
        # Draw face detection
        if len(faces) == 1:
            # Single face detected - good for capture
            bbox = faces[0]
            x, y, w, h = bbox
            
            # Draw bounding box
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            # Add capture feedback if active
            if self.stop_capture_btn.isEnabled():
                # We're in capture mode
                result = self.registration_service.capture_face_frame(self.current_frame)
                
                if result.success and result.quality_level.value != "reject":
                    # Good frame - check if we should capture it
                    if (result.quality_score >= 0.7 and 
                        len(self.capture_results) < 5 and
                        self._should_capture_frame(result)):
                        
                        self.capture_results.append(result)
                        self.capture_progress.setValue(len(self.capture_results))
                        
                        # Update preview
                        self._update_preview(len(self.capture_results) - 1, result)
                        
                        # Update quality feedback
                        quality_color = {
                            "excellent": Colors.SUCCESS,
                            "good": Colors.SUCCESS,
                            "fair": Colors.WARNING,
                            "poor": Colors.DANGER
                        }.get(result.quality_level.value, Colors.TEXT_SUB)
                        
                        self.quality_label.setText(
                            f"Frame {len(self.capture_results)} captured: "
                            f"{result.quality_level.value} (score: {result.quality_score:.2f})"
                        )
                        self.quality_label.setStyleSheet(f"color: {quality_color}; font-weight: bold;")
                
                # Draw quality indicator
                quality_text = f"Quality: {result.quality_score:.2f}"
                cv2.putText(frame, quality_text, (x, y - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            else:
                # Just showing detection
                self.quality_label.setText("Ready for capture - face detected")
                self.quality_label.setStyleSheet(f"color: {Colors.SUCCESS}; font-weight: bold;")
        
        elif len(faces) > 1:
            # Multiple faces
            self.quality_label.setText("Multiple faces detected - please ensure only one person")
            self.quality_label.setStyleSheet(f"color: {Colors.DANGER}; font-weight: bold;")
            
            for bbox in faces:
                x, y, w, h = bbox
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
        
        else:
            # No faces
            self.quality_label.setText("No face detected - please position face in frame")
            self.quality_label.setStyleSheet(f"color: {Colors.WARNING}; font-weight: bold;")
        
        # Display the frame
        self._display_frame(frame)
    
    def _should_capture_frame(self, result: 'FaceCaptureResult') -> bool:
        """Determine if a frame should be captured"""
        # Don't capture if we have enough frames
        if len(self.capture_results) >= 5:
            return False
        
        # Don't capture poor quality frames
        if result.quality_level == FaceQuality.REJECT:
            return False
        
        # For the first 2 frames, accept good or better quality
        if len(self.capture_results) < 2:
            return result.quality_level.value in ["excellent", "good", "fair"]
        
        # For remaining frames, only accept good or excellent
        return result.quality_level.value in ["excellent", "good"]
    
    def _update_preview(self, index: int, result: 'FaceCaptureResult'):
        """Update preview label with captured frame"""
        if index >= len(self.preview_labels):
            return
        
        label = self.preview_labels[index]
        
        # Create preview image
        preview_frame = result.frame.copy()
        
        # Draw bounding box on preview
        if result.bounding_box:
            x, y, w, h = result.bounding_box
            cv2.rectangle(preview_frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        # Add quality indicator
        quality_color = {
            "excellent": (0, 255, 0),
            "good": (0, 200, 0),
            "fair": (0, 165, 255),
            "poor": (0, 0, 255)
        }.get(result.quality_level.value, (128, 128, 128))
        
        cv2.putText(preview_frame, f"Q:{result.quality_score:.2f}", (10, 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, quality_color, 1)
        
        # Display in label
        self._display_preview_frame(label, preview_frame)
        
        # Update label style based on quality
        quality_bg_color = {
            "excellent": Colors.SUCCESS_LIGHT,
            "good": Colors.SUCCESS_LIGHT,
            "fair": Colors.WARNING_LIGHT,
            "poor": Colors.DANGER_LIGHT
        }.get(result.quality_level.value, Colors.BG_CARD)
        
        label.setStyleSheet(
            f"background-color: {quality_bg_color}; "
            f"border-radius: 6px; "
            f"border: 2px solid {Colors.BORDER};"
        )
    
    def _display_frame(self, frame: np.ndarray):
        """Display OpenCV frame in QLabel"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb_frame.shape
        bytes_per_line = ch * w
        
        qt_image = QImage(rgb_frame.data, w, h, bytes_per_line, QImage.Format_RGB888)
        pixmap = QPixmap.fromImage(qt_image)
        self.camera_label.setPixmap(pixmap.scaled(
            self.camera_label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation
        ))
    
    def _display_preview_frame(self, label: QLabel, frame: np.ndarray):
        """Display frame in preview label"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb_frame.shape
        bytes_per_line = ch * w
        
        qt_image = QImage(rgb_frame.data, w, h, bytes_per_line, QImage.Format_RGB888)
        pixmap = QPixmap.fromImage(qt_image)
        label.setPixmap(pixmap.scaled(
            label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation
        ))
    
    # ==================== REVIEW STEP ====================
    
    def _setup_review_step(self):
        """Setup for review step"""
        # Update student info
        if hasattr(self, 'selected_student_data'):
            user_data = self.selected_student_data.get('users', {})
            self.summary_student_label.setText(
                f"Student: {user_data.get('full_name', 'Unknown')} "
                f"({self.selected_student_data.get('enrollment_number', 'N/A')})"
            )
        
        # Update capture summary
        self._update_review_summary()
    
    def _update_review_summary(self):
        """Update the review summary with capture results"""
        if not self.capture_results:
            return
        
        # Update frame count
        frame_count = len(self.capture_results)
        self.summary_frames_label.setText(f"Frames captured: {frame_count}")
        
        # Update quality
        avg_quality = np.mean([r.quality_score for r in self.capture_results])
        quality_level = "Excellent" if avg_quality >= 0.8 else "Good" if avg_quality >= 0.7 else "Fair"
        self.summary_quality_label.setText(
            f"Average quality: {quality_level} ({avg_quality:.2f})"
        )
        
        # Find and display best frame
        best_result = max(self.capture_results, key=lambda r: r.quality_score)
        if best_result.frame is not None:
            self._display_preview_frame(self.best_frame_label, best_result.frame)
            self.best_frame_label.setText("")
        
        # Perform duplicate check
        self._check_duplicates()
    
    def _check_duplicates(self):
        """Check for duplicate face encodings"""
        if not self.capture_results or not self.current_student_id:
            return
        
        # Generate encoding from captured frames
        face_regions = [r.face_region for r in self.capture_results if r.face_region is not None]
        face_encoding = self.registration_service.generate_face_encoding(face_regions)
        
        if face_encoding is None:
            self.summary_duplicate_label.setText("Duplicate check: Failed to generate encoding")
            self.summary_duplicate_label.setStyleSheet(f"color: {Colors.DANGER};")
            return
        
        # Check for duplicates
        is_duplicate, duplicate_id, similarity = self.registration_service.check_duplicate_encoding(
            face_encoding, self.current_student_id
        )
        
        if is_duplicate:
            self.summary_duplicate_label.setText(
                f"⚠️ WARNING: Possible duplicate with student {duplicate_id} "
                f"(similarity: {similarity:.3f})"
            )
            self.summary_duplicate_label.setStyleSheet(f"color: {Colors.DANGER}; font-weight: bold;")
            
            # Show warning dialog
            QMessageBox.warning(
                self,
                "Duplicate Detection",
                f"Face encoding matches existing student {duplicate_id} "
                f"with {similarity:.1%} similarity.\n\n"
                "Please verify this is the correct student before proceeding."
            )
        else:
            self.summary_duplicate_label.setText(
                f"✓ No duplicates found (max similarity: {similarity:.3f})"
            )
            self.summary_duplicate_label.setStyleSheet(f"color: {Colors.SUCCESS};")
    
    # ==================== FINAL REGISTRATION ====================
    
    def _complete_registration(self):
        """Complete the face registration process"""
        if not self.current_student_id or not self.capture_results:
            QMessageBox.warning(self, "Incomplete Data", "Please complete all steps first.")
            return
        
        # Confirm registration
        reply = QMessageBox.question(
            self,
            "Confirm Registration",
            "Are you sure you want to register this face encoding?\n\n"
            "This action cannot be undone.",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply != QMessageBox.Yes:
            return
        
        # Disable UI during registration
        self.complete_btn.setEnabled(False)
        self.retry_capture_btn.setEnabled(False)
        self.final_progress.setVisible(True)
        self.final_status_label.setText("Registering face encoding...")
        self.final_status_label.setStyleSheet(f"color: {Colors.INFO};")
        
        # Perform registration
        result = self.registration_service.register_student_face(
            self.current_student_id,
            camera_index=Config.CAMERA_INDEX
        )
        
        # Update UI based on result
        self.final_progress.setVisible(False)
        
        if result['success']:
            # Success
            self.final_status_label.setText("✓ Face registration completed successfully!")
            self.final_status_label.setStyleSheet(f"color: {Colors.SUCCESS}; font-weight: bold;")
            
            # Show success message
            QMessageBox.information(
                self,
                "Registration Successful",
                f"Face encoding registered successfully for student.\n\n"
                f"Frames captured: {result.get('frames_captured', 0)}\n"
                f"Average quality: {result.get('average_quality', 0):.2f}\n"
                f"Encoding dimensions: {result.get('encoding_dimensions', 0)}"
            )
            
            # Emit completion signal
            self.registration_complete.emit(self.current_student_id)
            
            # Return to dashboard after delay
            QTimer.singleShot(2000, self._on_back)
            
        else:
            # Failure
            error_msg = result.get('error', 'Unknown error')
            self.final_status_label.setText(f"✗ Registration failed: {error_msg}")
            self.final_status_label.setStyleSheet(f"color: {Colors.DANGER}; font-weight: bold;")
            
            # Show error message
            QMessageBox.critical(
                self,
                "Registration Failed",
                f"Face registration failed:\n\n{error_msg}"
            )
            
            # Re-enable buttons
            self.complete_btn.setEnabled(True)
            self.retry_capture_btn.setEnabled(True)
    
    # ==================== CLEANUP ====================
    
    def _on_back(self):
        """Handle back button click"""
        self._stop_camera()
        self.back_requested.emit()
    
    def closeEvent(self, event):
        """Handle window close event"""
        self._stop_camera()
        super().closeEvent(event)


# Import logger at the end to avoid circular import
import logging
logger = logging.getLogger(__name__)