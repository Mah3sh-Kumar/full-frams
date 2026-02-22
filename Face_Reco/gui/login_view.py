"""
Login Widget
Secure entry point for Teachers and Admins
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLabel, QLineEdit, QFrame, QMessageBox, QGraphicsDropShadowEffect
)
from PySide6.QtCore import Qt, Signal, Property, QPropertyAnimation, QEasingCurve
from PySide6.QtGui import QColor, QFont
from .styles import Colors, Styles
from database import SupabaseClient


class LoginWidget(QWidget):
    """Login interface for verified staff"""
    
    login_successful = Signal(dict) # Emits user profile on success
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.db = SupabaseClient()
        self._init_ui()
        
    def _init_ui(self):
        """Initialize UI components with rich aesthetics"""
        self.setStyleSheet(Styles.GLOBAL_STYLE)
        
        # Main layout
        main_layout = QVBoxLayout(self)
        main_layout.setAlignment(Qt.AlignCenter)
        main_layout.setContentsMargins(0, 0, 0, 0)
        
        # Background container (could be a gradient or image)
        bg_frame = QFrame()
        bg_frame.setStyleSheet(f"background-color: {Colors.BG_MAIN};")
        main_layout.addWidget(bg_frame)
        
        bg_layout = QVBoxLayout(bg_frame)
        bg_layout.setAlignment(Qt.AlignCenter)
        
        # Login Card
        self.card = QFrame()
        self.card.setObjectName("Card")
        self.card.setFixedSize(450, 550)
        
        # Add shadow to card
        shadow = QGraphicsDropShadowEffect(self)
        shadow.setBlurRadius(40)
        shadow.setXOffset(0)
        shadow.setYOffset(10)
        shadow.setColor(QColor(0, 0, 0, 150))
        self.card.setGraphicsEffect(shadow)
        
        card_layout = QVBoxLayout(self.card)
        card_layout.setContentsMargins(40, 50, 40, 50)
        card_layout.setSpacing(25)
        
        # Logo/Icon placeholder
        icon_label = QLabel("✨")
        icon_label.setStyleSheet("font-size: 48px; background: transparent;")
        icon_label.setAlignment(Qt.AlignCenter)
        card_layout.addWidget(icon_label)
        
        # Title
        title = QLabel("Welcome Back")
        title.setObjectName("Header")
        title.setAlignment(Qt.AlignCenter)
        card_layout.addWidget(title)
        
        # Subtitle
        subtitle = QLabel("Sign in to your staff account")
        subtitle.setStyleSheet(f"color: {Colors.TEXT_SUB}; font-size: 13px; background: transparent;")
        subtitle.setAlignment(Qt.AlignCenter)
        card_layout.addWidget(subtitle)
        
        card_layout.addSpacing(10)
        
        # Email Input
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("Email Address")
        self.email_input.setMinimumHeight(50)
        card_layout.addWidget(self.email_input)
        
        # Password Input
        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("Password")
        self.password_input.setEchoMode(QLineEdit.Password)
        self.password_input.setMinimumHeight(50)
        card_layout.addWidget(self.password_input)
        
        # Login Button
        self.login_btn = QPushButton("Sign In")
        self.login_btn.setObjectName("PrimaryButton")
        self.login_btn.setMinimumHeight(55)
        self.login_btn.setCursor(Qt.PointingHandCursor)
        self.login_btn.clicked.connect(self._handle_login)
        card_layout.addWidget(self.login_btn)
        
        # Footer
        footer = QLabel("Restricted Access • Authorized Personnel Only")
        footer.setAlignment(Qt.AlignCenter)
        footer.setStyleSheet(f"color: {Colors.TEXT_DIM}; font-size: 11px; background: transparent;")
        card_layout.addWidget(footer)
        
        bg_layout.addWidget(self.card)
        
        # Allow pressing Enter to login
        self.password_input.returnPressed.connect(self._handle_login)
        self.email_input.returnPressed.connect(self._handle_login)

    def _handle_login(self):
        """Perform login via Supabase"""
        email = self.email_input.text().strip()
        password = self.password_input.text()
        
        if not email or not password:
            QMessageBox.warning(self, "Login Error", "Please provide both email and password.")
            return
            
        self.login_btn.setEnabled(False)
        self.login_btn.setText("Authenticating...")
        
        # Attempt login
        try:
            result = self.db.sign_in(email, password)
            
            if result['success']:
                # Success! Emit profile and transition
                self.login_successful.emit(result['profile'])
            else:
                # Failure
                QMessageBox.critical(self, "Access Denied", result.get('error', 'Authentication failed'))
                self.login_btn.setEnabled(True)
                self.login_btn.setText("Sign In")
                
        except Exception as e:
            QMessageBox.critical(self, "System Error", f"An unexpected error occurred: {str(e)}")
            self.login_btn.setEnabled(True)
            self.login_btn.setText("Sign In")

    def showEvent(self, event):
        """Fade in effect when shown"""
        super().showEvent(event)
        self.card.setGraphicsEffect(None) # Reset for animation
        # Re-apply shadow after a tiny delay or just use opacity
        # (Simplified for now)
        pass
