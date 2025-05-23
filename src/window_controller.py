
from PySide6.QtCore import QObject, Slot
from PySide6.QtGui import QCursor

class JSCaller(QObject):
    def __init__(self, controls):
        super().__init__()
        self.controls = controls

    def createTab(self):
        self.controls.page().runJavaScript("newTab()")

    def updateTabTitle(self, index, title):
        self.controls.page().runJavaScript(f"updateTabTitle({index}, '{title}')")

    def updateTabIcon(self, index, icon):
        self.controls.page().runJavaScript(f"updateTabIcon({index}, '{icon}')")

    def updateTabUrl(self, index, url):
        self.controls.page().runJavaScript(f"updateTabUrl({index}, '{url}')")

class WindowController(QObject):
    def __init__(self, app):
        super().__init__()
        self.app = app
        self.dragging = False
        self.local_pos = QCursor.pos()
        self.maximized = self.app.isMaximized()
        self.js = JSCaller(self.app.controls)

    @Slot()
    def closeWindow(self):
        """Close the application window"""
        self.app.close()

    @Slot()
    def minWindow(self):
        """Minimize the window"""
        self.app.showMinimized()

    @Slot()
    def maxWindow(self):
        """Toggle maximize/restore window state"""
        if self.app.isMaximized():
            self.app.showNormal()
            self.last_size = self.app.size()
        else:
            self.app.showMaximized()

    @Slot()
    def windowMove(self):
        """Start window movement"""
        self.dragging = True
        self.app.grabMouse()
        self.local_pos = self.app.mapFromGlobal(QCursor.pos())