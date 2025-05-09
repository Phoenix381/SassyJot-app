
import sys
import src.res.sassy_rc
from src.app_window import AppWindow
from PySide6.QtWidgets import QApplication

if __name__ == '__main__':
    app = QApplication(sys.argv)

    window = AppWindow()
    window.showMaximized()
    
    sys.exit(app.exec())