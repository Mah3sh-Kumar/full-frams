"""
Login Widget
Secure entry point for Teachers and Admins
"""
from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLabel, QLineEdit, QFrame, QMessageBox, QGraphicsDropShadowEffect,
    QGraphicsOpacityEffect
)
from PySide6.QtCore import Qt, Signal, Property, QPropertyAnimation, QEasingCurve, QTimer
from PySide6.QtGui import QColor, QFont
from .styles import Colors, Styles
from database import SupabaseClient


class LoginWidget(QWidget):
    """Login interface for verified staff"""
    
    login_successful = Signal(dict) # Emits user profile on success
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.db = SupabaseClient()
        self._opacity = 1.0
        self._init_ui()
        self._setup_animations()
        
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
        
        # Install event filters after all widgets are created
        self.email_input.installEventFilter(self)
        self.password_input.installEventFilter(self)
        self.login_btn.installEventFilter(self)
    
    def _setup_animations(self):
        """Setup animations for the login card"""
        # Opacity effect for fade-in
        self.opacity_effect = QGraphicsOpacityEffect(self.card)
        self.card.setGraphicsEffect(self.opacity_effect)
        self.opacity_effect.setOpacity(0)
        
        # Fade-in animation
        self.fade_animation = QPropertyAnimation(self.opacity_effect, b"opacity")
        self.fade_animation.setDuration(800)
        self.fade_animation.setStartValue(0)
        self.fade_animation.setEndValue(1)
        self.fade_animation.setEasingCurve(QEasingCurve.OutCubic)
        
    def eventFilter(self, obj, event):
        """Handle button hover and input focus animations"""
        if obj == self.login_btn:
            if event.type() == event.Type.Enter:
                self._animate_button_hover(True)
            elif event.type() == event.Type.Leave:
                self._animate_button_hover(False)
        elif obj in (self.email_input, self.password_input):
            if event.type() == event.Type.FocusIn:
                self._animate_input_focus(obj, True)
            elif event.type() == event.Type.FocusOut:
                self._animate_input_focus(obj, False)
        return super().eventFilter(obj, event)
    
    def _animate_input_focus(self, input_field, focus_in):
        """Animate input field on focus"""
        if focus_in:
            input_field.setStyleSheet(f"""
                QLineEdit {{
                    background-color: {Colors.BG_CARD};
                    border: 2px solid #667eea;
                    border-radius: 10px;
                    padding: 12px 16px;
                    font-size: 14px;
                    color: {Colors.TEXT_MAIN};
                }}
            """)
        else:
            input_field.setStyleSheet("")  # Reset to default
    
    def _animate_button_hover(self, hover_in):
        """Animate button on hover"""
        # Create a subtle scale effect using stylesheet
        if hover_in:
            self.login_btn.setStyleSheet("""
                QPushButton#PrimaryButton {
                    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                        stop:0 #667eea, stop:1 #764ba2);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 600;
                    transform: scale(1.02);
                }
            """)
        else:
            self.login_btn.setStyleSheet("")  # Reset to default style

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
        # Trigger fade-in animation
        QTimer.singleShot(100, self.fade_animation.start)
        
        # Re-apply shadow after animation
        QTimer.singleShot(900, self._apply_shadow)
    
    def _apply_shadow(self):
        """Apply shadow effect after fade-in"""
        shadow = QGraphicsDropShadowEffect(self)
        shadow.setBlurRadius(40)
        shadow.setXOffset(0)
        shadow.setYOffset(10)
        shadow.setColor(QColor(0, 0, 0, 150))
        self.card.setGraphicsEffect(shadow)
