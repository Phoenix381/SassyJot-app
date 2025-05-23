
from PySide6.QtWidgets import QMainWindow, QWidget, QSplitter, QTabWidget
from PySide6.QtWidgets import QVBoxLayout, QSizePolicy
from PySide6.QtWidgets import QApplication

from PySide6.QtCore import QUrl
from PySide6.QtCore import Qt

from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebChannel import QWebChannel

from src.db_controller import DBController
from src.tab_controller import TabController
from src.window_controller import WindowController

class AppWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("SassyJot")
        self.setWindowFlags(Qt.FramelessWindowHint)

        # tab widget (keeping web views separate)
        self.tab_widget = QTabWidget()
        self.tab_widget.tabBar().setVisible(False)
        self.tab_widget.setMinimumHeight(340)
        
        # central widget and layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        layout = QVBoxLayout(central_widget)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        
        # controls
        self.controls = QWebEngineView()
        self.controls.setFixedHeight(420)
        self.controls.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        self.controls.setContextMenuPolicy(Qt.PreventContextMenu)
        self.controls.page().setBackgroundColor(Qt.transparent)
        self.controls.load(QUrl("qrc:/html/controls.html"))
        
        # main view content
        self.dev_view = QWebEngineView()
        self.sidebar = QWebEngineView()

        self.dev_view.setMinimumHeight(400)
        self.dev_view.setFixedHeight(400)
        self.sidebar.setMinimumWidth(200)
        self.sidebar.setVisible(False)


        # splitters
        side_splitter = QSplitter(Qt.Horizontal)
        side_splitter.setHandleWidth(2)
        side_splitter.setStyleSheet("QSplitter { background-color: gray; }")
        dev_splitter = QSplitter(Qt.Vertical)
        dev_splitter.setHandleWidth(2)
        dev_splitter.setStyleSheet("QSplitter { background-color: red; }")

        # content into splitters
        dev_splitter.addWidget(self.tab_widget)
        dev_splitter.addWidget(self.dev_view)
        side_splitter.addWidget(dev_splitter)
        side_splitter.addWidget(self.sidebar)

        # overlapping layout below controls
        self.overlapping_widget = QWidget(central_widget)
        self.overlapping_widget.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        overlapping_layout = QVBoxLayout(self.overlapping_widget)
        overlapping_layout.setContentsMargins(0, 0, 0, 0)
        overlapping_layout.addWidget(side_splitter)

        # filling app layout
        layout.addWidget(self.controls)
        layout.addStretch()

        self.overlapping_widget.setGeometry(0, 84, self.width(), self.height() - 84)
        
        # init logic
        self.db = DBController()
        self.tab_controller = TabController(self)
        self.window_controller = WindowController(self)

        # waiting for app to load
        self.controls.loadFinished.connect(self.init_after_load)

        # connect dev view to controls
        self.controls.page().setDevToolsPage(self.dev_view.page())

        # Web channel setup
        controls_channel = QWebChannel(self.controls)
        controls_channel.registerObject("window_controller", self.window_controller)
        controls_channel.registerObject("tab_controller", self.tab_controller)
        self.controls.page().setWebChannel(controls_channel)

    def init_after_load(self):
        """A function that is called after the app has loaded."""
        self.tab_controller.createTab()
        self.window_controller.js.createTab()

    def resizeEvent(self, event):
        """Handling the resize event."""
        super().resizeEvent(event)
        self.overlapping_widget.resize(self.width(), self.height() - 84)

    # event handling
    def mouseMoveEvent(self, event):
        """Handling the mouse move event."""
        # TODO resizing, sticking to the sides, moving from fullscreen
        if self.window_controller.dragging:
            global_pos = event.globalPosition().toPoint()
            self.move(global_pos - self.window_controller.local_pos)
            
            screen = QApplication.screenAt(global_pos)
            if screen:
                screen_geometry = screen.geometry()
                
                if not self.isMaximized() and global_pos.y() <= screen_geometry.top():
                    self.window_controller.maximized = True
                    self.showMaximized()
                elif global_pos.y() > screen_geometry.top() and self.window_controller.maximized:
                    self.window_controller.maximized = False
                    self.showNormal()
                    if self.window_controller.last_size:
                        self.resize(self.window_controller.last_size)

    def mouseReleaseEvent(self, event):
        """Handling the mouse release event."""
        if event.button() == Qt.LeftButton and self.window_controller.dragging:
            self.window_controller.dragging = False
            self.releaseMouse()
