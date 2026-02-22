"""GUI module for PySide6 interface"""
from .main_window import MainWindow
from .dashboard import DashboardWidget
from .session_setup import SessionSetupWidget
from .recognition_view import RecognitionWidget

__all__ = ['MainWindow', 'DashboardWidget', 'SessionSetupWidget', 'RecognitionWidget']
