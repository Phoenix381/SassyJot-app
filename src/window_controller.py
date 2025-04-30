
from PySide6.QtCore import QObject

class WindowController(QObject):
    def __init__(self, app):
        super().__init__()
        self.app = app