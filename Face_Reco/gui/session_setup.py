"""
Session Setup Widget
Configure attendance session before starting recognition
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QFormLayout,
    QLabel, QPushButton, QComboBox, QDateEdit, QMessageBox,
    QGroupBox, QFrame
)
from PySide6.QtCore import Qt, Signal, QDate
from PySide6.QtGui import QFont
from .styles import Colors, Styles
from database import SupabaseClient
from datetime import datetime


class SessionSetupWidget(QWidget):
    """Session setup screen for configuring attendance parameters"""
    
    session_started = Signal(dict)
    back_requested = Signal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet(Styles.GLOBAL_STYLE)
        self.db = SupabaseClient()
        self._init_ui()
    
    def _init_ui(self):
        """Initialize UI components"""
        layout = QVBoxLayout(self)
        layout.setSpacing(20)
        layout.setContentsMargins(50, 30, 50, 30)
        
        # Header
        header_layout = QHBoxLayout()
        
        # Back button
        self.back_btn = QPushButton("← Back")
        self.back_btn.setMaximumWidth(100)
        self.back_btn.clicked.connect(self.back_requested.emit)
        header_layout.addWidget(self.back_btn)
        
        header_layout.addStretch()
        
        # Title
        title = QLabel("Session Configuration")
        title.setObjectName("Header")
        header_layout.addWidget(title)
        
        header_layout.addStretch()
        header_layout.addWidget(QLabel(""))  # Spacer for symmetry
        
        layout.addLayout(header_layout)
        
        # Form container
        form_container = QFrame()
        form_container.setObjectName("Card")
        form_layout = QVBoxLayout(form_container)
        form_layout.setContentsMargins(40, 40, 40, 40)
        
        # Session details group
        session_group = QGroupBox("Session Details")
        session_group.setStyleSheet("QGroupBox { font-weight: bold; font-size: 14px; }")
        session_form = QFormLayout()
        session_form.setSpacing(15)
        
        # Class selection
        self.class_combo = QComboBox()
        self.class_combo.setMinimumHeight(35)
        self.class_combo.currentIndexChanged.connect(self._on_class_changed)
        session_form.addRow("Class:", self.class_combo)
        
        # Subject selection
        self.subject_combo = QComboBox()
        self.subject_combo.setMinimumHeight(35)
        session_form.addRow("Subject:", self.subject_combo)
        
        # Date selection
        self.date_edit = QDateEdit()
        self.date_edit.setCalendarPopup(True)
        self.date_edit.setDate(QDate.currentDate())
        session_form.addRow("Session Date:", self.date_edit)
        
        session_group.setLayout(session_form)
        form_layout.addWidget(session_group)
        
        layout.addWidget(form_container)
        layout.addStretch()
        
        # Action buttons
        button_layout = QHBoxLayout()
        button_layout.addStretch()
        
        self.start_btn = QPushButton("Initialize Recognition")
        self.start_btn.setObjectName("PrimaryButton")
        self.start_btn.setMinimumSize(250, 55)
        self.start_btn.clicked.connect(self._start_session)
        button_layout.addWidget(self.start_btn)
        
        button_layout.addStretch()
        layout.addLayout(button_layout)
    
    def load_data(self):
        """Load classes and subjects from database"""
        try:
            # Load classes
            classes = self.db.get_all_classes()
            self.class_combo.clear()
            
            if not classes:
                # No classes found
                self.class_combo.addItem("⚠️ No classes found in database", None)
                self.subject_combo.clear()
                self.subject_combo.addItem("⚠️ Please add classes first", None)
                self.start_btn.setEnabled(False)
                
                QMessageBox.warning(
                    self,
                    "No Data Found",
                    "No classes found in the database.\n\n"
                    "Please add classes and subjects to your Supabase database first.\n\n"
                    "You can use the sample data script or add them manually."
                )
                return
            
            self.class_data = {}
            for cls in classes:
                display_name = f"{cls['name']} ({cls['academic_year']})"
                self.class_combo.addItem(display_name, cls['id'])
                self.class_data[cls['id']] = cls
            
            # Load subjects for first class
            if classes:
                self._on_class_changed(0)
            
            self.start_btn.setEnabled(True)
        
        except Exception as e:
            QMessageBox.critical(
                self,
                "Error",
                f"Failed to load data from database:\n{str(e)}\n\n"
                f"Please check your Supabase connection."
            )
            self.start_btn.setEnabled(False)
    
    def _on_class_changed(self, index: int):
        """Handle class selection change"""
        if index < 0:
            return
        
        class_id = self.class_combo.currentData()
        if not class_id:
            return
        
        try:
            # Load subjects for selected class
            subjects = self.db.get_subjects_by_class(class_id)
            self.subject_combo.clear()
            
            if not subjects:
                self.subject_combo.addItem("⚠️ No subjects for this class", None)
                self.start_btn.setEnabled(False)
                return
            
            for subject in subjects:
                display_name = f"{subject['name']} ({subject['code']})"
                self.subject_combo.addItem(display_name, subject['id'])
            
            self.start_btn.setEnabled(True)
        
        except Exception as e:
            QMessageBox.warning(
                self,
                "Warning",
                f"Failed to load subjects: {str(e)}"
            )
            self.start_btn.setEnabled(False)
    
    def _start_session(self):
        """Validate and start recognition session"""
        # Validate selections
        if self.class_combo.currentIndex() < 0:
            QMessageBox.warning(self, "Validation Error", "Please select a class")
            return
        
        if self.subject_combo.currentIndex() < 0:
            QMessageBox.warning(self, "Validation Error", "Please select a subject")
            return
        
        # Prepare session data
        session_data = {
            'class_id': self.class_combo.currentData(),
            'class_name': self.class_combo.currentText(),
            'subject_id': self.subject_combo.currentData(),
            'subject_name': self.subject_combo.currentText(),
            'date': self.date_edit.date().toString("yyyy-MM-dd"),
            'timestamp': datetime.now().isoformat()
        }
        
        # Emit signal to start recognition
        self.session_started.emit(session_data)
