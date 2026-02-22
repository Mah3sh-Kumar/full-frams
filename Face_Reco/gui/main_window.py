"""
Main Application Window
Central hub for navigation between different modules
"""
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QStackedWidget,
    QStatusBar, QMessageBox
)
from PySide6.QtCore import Qt, QSize
from PySide6.QtGui import QIcon
from config.config import Config
from .dashboard import DashboardWidget
from .session_setup import SessionSetupWidget
from .recognition_view import RecognitionWidget
from .registration_view import RegistrationWidget
from .login_view import LoginWidget
from .styles import Styles


class MainWindow(QMainWindow):
    """Main application window"""
    
    def __init__(self):
        super().__init__()
        self.setStyleSheet(Styles.GLOBAL_STYLE)
        self.setWindowTitle(Config.APP_NAME)
        self.setMinimumSize(QSize(1200, 800))
        
        # Central widget with stacked layout
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        
        self.layout = QVBoxLayout(self.central_widget)
        self.layout.setContentsMargins(0, 0, 0, 0)
        
        # Stacked widget for different screens
        self.stacked_widget = QStackedWidget()
        self.layout.addWidget(self.stacked_widget)
        
        # Initialize screens
        self._init_screens()
        
        # Status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Awaiting authentication...")
        
        # Show login screen by default
        self.show_login()
    
    def _init_screens(self):
        """Initialize all application screens"""
        # Dashboard
        self.dashboard = DashboardWidget(self)
        self.dashboard.recognition_requested.connect(self.show_session_setup)
        self.dashboard.registration_requested.connect(self.show_registration)
        self.stacked_widget.addWidget(self.dashboard)
        
        # Session Setup
        self.session_setup = SessionSetupWidget(self)
        self.session_setup.session_started.connect(self.show_recognition)
        self.session_setup.back_requested.connect(self.show_dashboard)
        self.stacked_widget.addWidget(self.session_setup)
        
        # Recognition View
        self.recognition_view = RecognitionWidget(self)
        self.recognition_view.session_ended.connect(self.show_dashboard)
        self.stacked_widget.addWidget(self.recognition_view)
        
        # Registration View
        self.registration_view = RegistrationWidget(self)
        self.registration_view.back_requested.connect(self.show_dashboard)
        self.registration_view.registration_complete.connect(self.show_dashboard)
        self.stacked_widget.addWidget(self.registration_view)

        # Login View
        self.login_view = LoginWidget(self)
        self.login_view.login_successful.connect(self._on_login_success)
        self.stacked_widget.addWidget(self.login_view)

    def show_login(self):
        """Show login screen"""
        self.stacked_widget.setCurrentWidget(self.login_view)
        self.status_bar.showMessage("Protected Access - Please Login")
        
    def _on_login_success(self, profile: dict):
        """Handle successful login"""
        self.current_user = profile
        self.show_dashboard()
        self.status_bar.showMessage(f"Logged in as: {profile['full_name']} ({profile['role']})")
    
    def show_dashboard(self):
        """Show dashboard screen"""
        self.stacked_widget.setCurrentWidget(self.dashboard)
        self.status_bar.showMessage("Dashboard")
    
    def show_session_setup(self):
        """Show session setup screen"""
        self.session_setup.load_data()
        self.stacked_widget.setCurrentWidget(self.session_setup)
        self.status_bar.showMessage("Session Setup")
        
    def show_registration(self):
        """Show registration screen"""
        self.registration_view.load_data()
        self.stacked_widget.setCurrentWidget(self.registration_view)
        self.status_bar.showMessage("Student Registration")
    
    def show_recognition(self, session_data: dict):
        """
        Show recognition screen with session data
        
        Args:
            session_data: Dictionary with subject_id, date, etc.
        """
        self.recognition_view.start_session(session_data)
        self.stacked_widget.setCurrentWidget(self.recognition_view)
        self.status_bar.showMessage("Recognition Active")
    
    def closeEvent(self, event):
        """Handle window close event"""
        print("Closing application...")
        
        # Stop recognition or registration if active
        try:
            if hasattr(self.recognition_view, 'stop_recognition'):
                print("Stopping recognition...")
                self.recognition_view.stop_recognition()
        except Exception as e:
            print(f"Error stopping recognition: {e}")
            
        try:
            if hasattr(self.registration_view, '_stop_camera'):
                print("Stopping camera...")
                self.registration_view._stop_camera()
        except Exception as e:
            print(f"Error stopping camera: {e}")
        
        # Stop any remaining timers
        try:
            if hasattr(self, 'dashboard') and hasattr(self.dashboard, 'timer'):
                self.dashboard.timer.stop()
        except Exception as e:
            print(f"Error stopping dashboard timer: {e}")
        
        # Force cleanup of any remaining resources
        try:
            # Clear references to prevent circular references
            if hasattr(self, 'recognition_view'):
                self.recognition_view.deleteLater()
            if hasattr(self, 'registration_view'):
                self.registration_view.deleteLater()
            if hasattr(self, 'dashboard'):
                self.dashboard.deleteLater()
        except Exception as e:
            print(f"Error during final cleanup: {e}")
            
        event.accept()
        print("Application closed successfully")
