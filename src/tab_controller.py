
from PySide6.QtWidgets import QTabWidget

from PySide6.QtCore import QObject, Slot
from PySide6.QtCore import QStandardPaths, QBuffer, QByteArray, QUrl

from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWebEngineCore import QWebEngineProfile
from PySide6.QtWebChannel import QWebChannel

from PySide6.QtGui import QPixmap

class TabController(QObject):
    def __init__(self, app):
        super().__init__()
        self.app = app

        # create web engine profile
        self.profile = QWebEngineProfile("web_profile")
        
        # set storage paths
        storage_path = QStandardPaths.writableLocation(QStandardPaths.AppDataLocation) + "/QtWebEngine/sassy_profile"
        self.profile.setPersistentStoragePath(storage_path)
        self.profile.setCachePath(storage_path)
        self.profile.setHttpCacheType(QWebEngineProfile.DiskHttpCache)
        self.profile.setPersistentCookiesPolicy(QWebEngineProfile.AllowPersistentCookies)

    @Slot(str)
    def createTab(self, url=""):
        """Creating tab inside tab widget"""
        # Create new web view with profile
        new_tab = QWebEngineView(self.profile)
        
        # Setup web channel
        project_channel = QWebChannel(new_tab)
        project_channel.registerObject("project_controller", self.app.project_controller)
        new_tab.page().setWebChannel(project_channel)
        
        # Add to tab widget
        index = self.app.tab_widget.addTab(new_tab, "New tab")
        self.app.tab_widget.setCurrentIndex(index)
        
        # Connect title changed signal
        new_tab.page().titleChanged.connect( lambda title, view=new_tab: self._handle_title_change(view, title) )
        
        # Connect icon changed signal
        new_tab.page().iconChanged.connect( lambda icon, view=new_tab: self._handle_icon_change(view, icon) )
        
        # Load URL
        if url:
            new_tab.load(QUrl(url))
        else:
            proj_id = self.app.project_controller.current.project_id
            task_id = self.app.project_controller.current.id
            new_tab.load(QUrl(f"qrc:/html/dashboard.html?proj_id={proj_id}&task_id={task_id}"))

        # set up dev view for current tab
        current = self._current_web_view()
        current.page().setDevToolsPage(self.app.dev_view.page())

    def _handle_title_change(self, view, title):
        """Handle tab title change"""
        index = self.app.tab_widget.indexOf(view)
        if index != -1:
            self.app.window_controller.js.updateTabTitle(index, title)

    def _handle_icon_change(self, view, icon):
        """Handle tab icon change"""
        index = self.app.tab_widget.indexOf(view)
        if index != -1:
            pixmap = icon.pixmap(16, 16)
            byte_array = QByteArray()
            buffer = QBuffer(byte_array)
            buffer.open(QBuffer.WriteOnly)
            pixmap.save(buffer, "PNG")
            self.app.window_controller.js.updateTabIcon(index, byte_array.toBase64().data().decode())

    # TODO inactive state
    @Slot()
    def pageBack(self):
        """Page back"""
        if current := self._current_web_view():
            current.back()

    @Slot()
    def pageForward(self):
        """Page forward"""
        if current := self._current_web_view():
            current.forward()

    @Slot()
    def pageReload(self):
        """Reload page"""
        if current := self._current_web_view():
            current.reload()

    @Slot(str)
    def pageChangeUrl(self, url):
        """Change page URL"""
        if not url.startswith(("http://", "https://")):
            url = "http://" + url
        
        if current := self._current_web_view():
            current.setUrl(QUrl(url))

    @Slot(int)
    def selectTab(self, index):
        """Select tab"""
        self.app.tab_widget.setCurrentIndex(index)

        # set up dev view for current tab
        current = self._current_web_view()
        current.page().setDevToolsPage(self.app.dev_view.page())

    @Slot(int)
    def closeTab(self, index):
        """Close tab"""
        count = self.app.tab_widget.count()
        if count <= 1:
            return
            
        next_index = index if index == count - 1 else index + 1
        self.app.tab_widget.removeTab(index)
        self.selectTab(next_index)

    def _current_web_view(self):
        """Get current web view"""
        return self.app.tab_widget.currentWidget()