
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

    # create tab
    def createBrowserTab(self, url=""):
        self.createTab(url)
        self.app.window_controller.js.createTab()

    # close currently selected tab
    def closeCurrentTab(self):
        self.app.window_controller.js.closeCurrentTab()

    # select next tab
    def nextTab(self):
        current = self.app.tab_widget.currentIndex()
        total = self.app.tab_widget.count()
        new = (current + 1) % total

        self.selectTab(new)
        self.app.window_controller.js.selectTab(new)

    # select prev tab
    def prevTab(self):
        current = self.app.tab_widget.currentIndex()
        total = self.app.tab_widget.count()
        new = (current - 1) % total

        self.selectTab(new)
        self.app.window_controller.js.selectTab(new)

    # create backend only tab
    @Slot(str)
    def createTab(self, url=""):
        """Creating tab inside tab widget"""
        # Create new web view with profile
        new_tab = QWebEngineView(self.profile)
        
        # Setup web channel
        task_channel = QWebChannel(new_tab)
        task_channel.registerObject("task_controller", self.app.task_controller)
        new_tab.page().setWebChannel(task_channel)
        
        # Add to tab widget
        index = self.app.tab_widget.addTab(new_tab, "New tab")
        self.app.tab_widget.setCurrentIndex(index)
        
        # Connect title changed signal
        new_tab.page().titleChanged.connect( lambda title, view=new_tab: self._handle_title_change(view, title) )
        
        # Connect icon changed signal
        new_tab.page().iconChanged.connect( lambda icon, view=new_tab: self._handle_icon_change(view, icon) )
        
        # Connect url changed signal
        new_tab.urlChanged.connect( lambda url, view=new_tab: self._handle_url_change(view, url) )

        # Load URL
        if url:
            new_tab.load(QUrl(url))
        else:
            new_tab.load(QUrl("qrc:/html/dashboard.html"))

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

    def _handle_url_change(self, view, url):
        """Handle tab url change"""
        index = self.app.tab_widget.indexOf(view)
        current = self.app.tab_widget.currentIndex()

        if index != -1 and index == current:
            # update address bar
            self.app.window_controller.js.updateAddressBar(url.toString())

            # update fav status
            self.check_fav(url.toString())

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

    # select tab on backend
    @Slot(int)
    def selectTab(self, index):
        """Select tab"""
        self.app.tab_widget.setCurrentIndex(index)

        # set up dev view for current tab
        current = self._current_web_view()
        current.page().setDevToolsPage(self.app.dev_view.page())

        if index != -1:
            # update address bar
            self.app.window_controller.js.updateAddressBar(current.url().toString())

            # update fav status
            self.check_fav(current.url().toString())

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

    @Slot(result=str)
    def get_current_title(self):
        """Get current tab title"""
        if current := self._current_web_view():
            return current.title()
        return ""

    # create fav
    @Slot(str)
    def create_fav(self, title):
        """Save fav"""
        url = self._current_web_view().url().toString()
        self.app.db.create_fav(url, title)

    # delete fav
    @Slot()
    def delete_fav(self):
        """Delete fav"""
        url = self._current_web_view().url().toString()
        self.app.db.delete_fav(url)

    # check fav by url
    @Slot(str)
    def check_fav(self, url):
        """Check fav by url"""
        status = self.app.db.check_fav(url)
        self.app.window_controller.js.setFavStatus(status)
        