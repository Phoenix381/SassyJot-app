
from PySide6.QtCore import QObject

class TabController(QObject):
    def __init__(self, app):
        super().__init__()
        self.app = app