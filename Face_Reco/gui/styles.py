"""
Centralized Styles and Color Constants for FRAMS
Provides a unified look and feel with a premium dark theme.
"""

class Colors:
    # Backgrounds - Deep Slate/Navy
    BG_MAIN = "#0b1120"      # Deep background
    BG_CARD = "#161f33"      # Card/Surface background
    BG_INPUT = "#1e293b"     # Input background
    
    # Text - High Contrast
    TEXT_MAIN = "#f1f5f9"    # Primary white
    TEXT_SUB = "#94a3b8"     # Secondary gray
    TEXT_DIM = "#64748b"     # Muted gray
    
    # Accents - Vibrant but professional
    ACCENT = "#8b5cf6"       # Violet/Purple
    ACCENT_HOVER = "#7c3aed"
    
    SUCCESS = "#10b981"      # Emerald
    SUCCESS_HOVER = "#059669"
    SUCCESS_LIGHT = "#d1fae5"  # Light emerald for backgrounds
    
    DANGER = "#ef4444"       # Red
    DANGER_HOVER = "#dc2626"
    DANGER_LIGHT = "#fee2e2"  # Light red for backgrounds
    
    INFO = "#3b82f6"         # Blue
    
    WARNING = "#f59e0b"      # Amber/Orange
    WARNING_HOVER = "#d97706"
    WARNING_LIGHT = "#fef3c7"  # Light amber for backgrounds
    
    # Borders
    BORDER = "#1e293b"
    BORDER_BRIGHT = "#334155"
    BORDER_ACCENT = "rgba(139, 92, 246, 0.3)"

    # Glass Effects
    GLASS_BG = "rgba(22, 31, 51, 0.85)"
    GLASS_BORDER = "rgba(255, 255, 255, 0.08)"

class Styles:
    # Global QSS for the whole application
    GLOBAL_STYLE = f"""
        QMainWindow, QWidget {{
            background-color: {Colors.BG_MAIN};
            color: {Colors.TEXT_MAIN};
            font-family: 'Inter', 'Segoe UI', sans-serif;
            font-size: 13px;
        }}
        
        QLabel#Title {{
            font-size: 32px;
            font-weight: 800;
            color: {Colors.TEXT_MAIN};
            margin-bottom: 5px;
        }}
        
        QLabel#Subtitle {{
            font-size: 15px;
            color: {Colors.TEXT_SUB};
        }}
        
        QLabel#Header {{
            font-size: 20px;
            font-weight: 700;
            color: {Colors.ACCENT};
        }}
        
        QLabel#PageTitle {{
            font-size: 24px;
            font-weight: 700;
            color: {Colors.TEXT_MAIN};
        }}
        
        QLabel#StepIndicator {{
            font-size: 14px;
            font-weight: 600;
            color: {Colors.TEXT_SUB};
            padding: 8px 16px;
            background-color: {Colors.BG_CARD};
            border-radius: 8px;
        }}
        
        QLabel#StudentName {{
            font-size: 18px;
            font-weight: 700;
            color: {Colors.TEXT_MAIN};
            margin-bottom: 8px;
        }}
        
        QLineEdit, QComboBox, QDateEdit {{
            background-color: {Colors.BG_INPUT};
            border: 1px solid {Colors.BORDER_BRIGHT};
            border-radius: 10px;
            padding: 10px 14px;
            color: {Colors.TEXT_MAIN};
            min-height: 40px;
        }}
        
        QLineEdit:focus, QComboBox:focus, QDateEdit:focus {{
            border: 2px solid {Colors.ACCENT};
            background-color: {Colors.BG_MAIN};
        }}
        
        QPushButton {{
            background-color: {Colors.BG_INPUT};
            border: 1px solid {Colors.BORDER_BRIGHT};
            border-radius: 8px;
            padding: 10px 20px;
            font-weight: 600;
            color: {Colors.TEXT_MAIN};
        }}
        
        QPushButton:hover {{
            background-color: {Colors.BORDER_BRIGHT};
        }}
        
        QPushButton#PrimaryButton {{
            background-color: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:1, stop:0 {Colors.ACCENT}, stop:1 #6366f1);
            color: white;
            border: none;
            border-radius: 10px;
        }}
        
        QPushButton#PrimaryButton:hover {{
            background-color: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:1, stop:0 {Colors.ACCENT_HOVER}, stop:1 {Colors.ACCENT});
        }}
        
        QPushButton#SecondaryButton {{
            background-color: {Colors.BG_INPUT};
            color: {Colors.TEXT_MAIN};
            border: 1px solid {Colors.BORDER_BRIGHT};
            border-radius: 10px;
        }}
        
        QPushButton#SecondaryButton:hover {{
            background-color: {Colors.BORDER_BRIGHT};
            border: 1px solid {Colors.ACCENT};
        }}
        
        QPushButton#SuccessButton {{
            background-color: {Colors.SUCCESS};
            border: none;
        }}
        
        QPushButton#SuccessButton:hover {{
            background-color: {Colors.SUCCESS_HOVER};
        }}
        
        QPushButton#DangerButton {{
            background-color: {Colors.DANGER};
            border: none;
        }}
        
        QPushButton#DangerButton:hover {{
            background-color: {Colors.DANGER_HOVER};
        }}
        
        QTableWidget {{
            background-color: {Colors.BG_CARD};
            alternate-background-color: {Colors.BG_MAIN};
            gridline-color: {Colors.BORDER};
            border: 1px solid {Colors.BORDER_BRIGHT};
            border-radius: 10px;
        }}
        
        QHeaderView::section {{
            background-color: {Colors.BG_INPUT};
            color: {Colors.TEXT_SUB};
            padding: 10px;
            border: none;
            font-weight: bold;
        }}
        
        QGroupBox {{
            font-weight: 800;
            border: 1px solid {Colors.GLASS_BORDER};
            border-radius: 16px;
            margin-top: 30px;
            padding-top: 25px;
            background-color: {Colors.GLASS_BG};
        }}
        
        QGroupBox::title {{
            subcontrol-origin: margin;
            subcontrol-position: top left;
            left: 20px;
            padding: 0 10px;
            color: {Colors.ACCENT};
            font-size: 14px;
        }}
        
        QProgressBar {{
            background-color: {Colors.BG_INPUT};
            border: none;
            border-radius: 6px;
            text-align: center;
            height: 12px;
        }}
        
        QProgressBar::chunk {{
            background-color: {Colors.ACCENT};
            border-radius: 6px;
        }}
        
        QScrollBar:vertical {{
            border: none;
            background: {Colors.BG_MAIN};
            width: 8px;
            margin: 0px;
        }}
        
        QScrollBar::handle:vertical {{
            background: {Colors.BORDER_BRIGHT};
            min-height: 30px;
            border-radius: 4px;
        }}
        
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
            height: 0px;
        }}
        
        QFrame#Card {{
            background-color: {Colors.GLASS_BG};
            border: 1px solid {Colors.GLASS_BORDER};
            border-radius: 24px;
        }}
    """
    
    DASHBOARD_CARD = f"""
        QPushButton {{
            background-color: {Colors.GLASS_BG};
            border: 1px solid {Colors.GLASS_BORDER};
            border-radius: 24px;
            padding: 40px;
        }}
        QPushButton:hover {{
            border: 2px solid {{accent_color}};
            background-color: rgba(255, 255, 255, 0.03);
        }}
    """
    
    GROUP_BOX_STYLE = f"""
        QGroupBox {{
            font-weight: 700;
            border: 1px solid {Colors.GLASS_BORDER};
            border-radius: 16px;
            margin-top: 20px;
            padding-top: 20px;
            background-color: {Colors.GLASS_BG};
            color: {Colors.TEXT_MAIN};
        }}
        
        QGroupBox::title {{
            subcontrol-origin: margin;
            subcontrol-position: top left;
            left: 15px;
            padding: 0 10px;
            color: {Colors.ACCENT};
            font-size: 14px;
            font-weight: 700;
        }}
    """
