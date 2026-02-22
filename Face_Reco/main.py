"""
FRAMS - Face Recognition Attendance Management System
Main application entry point
"""
import sys
from PySide6.QtWidgets import QApplication, QMessageBox
from PySide6.QtCore import Qt
from gui import MainWindow
from config.config import Config


def main():
    """Main application entry point"""
    # Create application
    app = QApplication(sys.argv)
    app.setApplicationName(Config.APP_NAME)
    
    # Set application style
    app.setStyle('Fusion')
    
    # Validate configuration
    try:
        Config.validate()
    except ValueError as e:
        QMessageBox.critical(
            None,
            "Configuration Error",
            f"{str(e)}\n\nPlease check your .env file."
        )
        return 1
    
    # Create and show main window
    try:
        print("Creating main window...")
        window = MainWindow()
        print("Showing window...")
        window.show()
        print("Window shown successfully")
    except Exception as e:
        print(f"Error creating window: {e}")
        import traceback
        traceback.print_exc()
        QMessageBox.critical(
            None,
            "Initialization Error",
            f"Failed to initialize application:\n{str(e)}"
        )
        return 1
    
    # Run application
    print("Application started. Close the window to exit.")
    exit_code = app.exec()
    print("Application exiting with code:", exit_code)
    
    # Force cleanup
    print("Cleaning up application...")
    app.quit()
    app.deleteLater()
    print("Cleanup completed")
    
    return exit_code


if __name__ == '__main__':
    sys.exit(main())
