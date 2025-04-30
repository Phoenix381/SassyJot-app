
from PySide6.QtWidgets import QMainWindow, QWidget, QSplitter, QTabWidget
from PySide6.QtWidgets import QVBoxLayout, QSizePolicy

from PySide6.QtCore import QUrl
from PySide6.QtCore import Qt

from PySide6.QtWebEngineWidgets import QWebEngineView

from src.db_controller import DBController

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
        # self.controls.load(QUrl("qrc:/html/controls.html"))
        self.controls.load(QUrl("https://www.duckduckgo.com"))
        
        # main view content
        self.dev_view = QWebEngineView()
        self.sidebar = QWebEngineView()

        self.dev_view.setMinimumHeight(200)
        # self.dev_view.setFixedHeight(200)
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

        # Add web view to layout
        # self.web_view = QWebEngineView()
        # self.web_view.setUrl(QUrl("https://www.google.com"))        
        # layout.addWidget(self.web_view)

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self.overlapping_widget.resize(self.width(), self.height() - 84)
