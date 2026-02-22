"""
Dashboard Widget
Main navigation hub for the application
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLabel, QFrame
)
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont
from .styles import Colors, Styles


class DashboardWidget(QWidget):
    """Dashboard with navigation options"""
    
    recognition_requested = Signal()
    registration_requested = Signal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self._init_ui()
    
    def _init_ui(self):
        """Initialize UI components"""
        self.setStyleSheet(Styles.GLOBAL_STYLE)
        layout = QVBoxLayout(self)
        layout.setSpacing(30)
        layout.setContentsMargins(50, 50, 50, 50)
        
        # Title
        title = QLabel("Face Recognition Attendance System")
        title.setObjectName("Title")
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)
        
        # Subtitle
        subtitle = QLabel("Select an operation to continue")
        subtitle.setObjectName("Subtitle")
        subtitle.setAlignment(Qt.AlignCenter)
        layout.addWidget(subtitle)
        
        layout.addStretch()
        
        # Button container
        button_container = QHBoxLayout()
        button_container.setSpacing(30)
        
        # Recognition button
        self.recognition_btn = self._create_action_button(
            "📸 Attendance session",
            "Mark attendance using face recognition",
            Colors.SUCCESS
        )
        self.recognition_btn.clicked.connect(self.recognition_requested.emit)
        button_container.addWidget(self.recognition_btn)
        
        # Registration button
        self.registration_btn = self._create_action_button(
            "👤 Student Registration",
            "Add new student with face enrollment",
            Colors.ACCENT
        )
        self.registration_btn.setEnabled(True)
        self.registration_btn.clicked.connect(self.registration_requested.emit)
        button_container.addWidget(self.registration_btn)
        
        layout.addLayout(button_container)
        layout.addStretch()
        
        # Footer
        footer = QLabel("FRAMS v1.1 • Premium Dark Edition")
        footer.setAlignment(Qt.AlignCenter)
        footer.setStyleSheet(f"color: {Colors.TEXT_DIM}; font-size: 11px;")
        layout.addWidget(footer)
    
    def _create_action_button(self, title: str, description: str, color: str) -> QPushButton:
        """Create a styled action button card"""
        button = QPushButton()
        button.setStyleSheet(f"""
            QPushButton {{
                background-color: {Colors.BG_CARD};
                border: 2px solid {Colors.BORDER_BRIGHT};
                border-radius: 20px;
                padding: 30px;
                text-align: center;
            }}
            QPushButton:hover {{
                background-color: {Colors.BG_INPUT};
                border-color: {color};
            }}
        """)
        button.setMinimumSize(300, 200)
        button.setCursor(Qt.PointingHandCursor)
        
        layout = QVBoxLayout(button)
        layout.setAlignment(Qt.AlignCenter)
        
        # Title
        title_label = QLabel(title)
        title_label.setObjectName("Header")
        title_label.setAlignment(Qt.AlignCenter)
        title_label.setStyleSheet(f"color: {color}; background: transparent; border: none;")
        layout.addWidget(title_label)
        
        # Description
        desc_label = QLabel(description)
        desc_label.setAlignment(Qt.AlignCenter)
        desc_label.setWordWrap(True)
        desc_label.setStyleSheet(f"color: {Colors.TEXT_SUB}; background: transparent; border: none;")
        layout.addWidget(desc_label)
        
        return button
