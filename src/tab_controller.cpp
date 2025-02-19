
#include "include/controllers.h"

#include <QBuffer>

// =============================================================================
// tab class
// =============================================================================

// Tab::Tab(AppWindow *app) {
// 	this->app = app;
// }

// =============================================================================
// tab controller
// =============================================================================

TabController::TabController(AppWindow *app) {
	this->app = app;
}

// creating new tab backend
void TabController::createTab(QString url) {
	// tab view
	// TODO use Tab subclass
	QWebEngineView *newTab = new QWebEngineView();

	// TODO web channels etc

	// adding to tab widget
	int index = app->tab_widget->addTab(newTab, "New tab");
	app->tab_widget->setCurrentIndex(index);

	// TODO maybe move events init to subclass

	// tab events here

    // updating tab titles on page event
    connect(newTab->page(), &QWebEnginePage::titleChanged, this, [this, newTab](const QString &title) {
        int index = app->tab_widget->indexOf(newTab);
        if (index != -1) {
            // sending to js
            this->app->window_controller->js->updateTabTitle(index, title);
        }
    });

    // updating tab icons on page event
    connect(newTab->page(), &QWebEnginePage::iconChanged, this, [this, newTab](const QIcon &icon) {
        int index = app->tab_widget->indexOf(newTab);
        if (index != -1) {
            // converting icon to pixmap (resizing and converting to base64 later)
            auto pixmap = icon.pixmap(16, 16);
            QByteArray pixels;
            QBuffer buffer(&pixels);
            buffer.open(QIODevice::WriteOnly);
            pixmap.save(&buffer, "PNG");

            // sending to js
            this->app->window_controller->js->updateTabIcon(index, pixels.toBase64());
        }
    });

	// loading url if needed
    if (!url.isEmpty())
        newTab->load(QUrl(url));
    else
        newTab->load(QUrl("qrc:/html/dashboard.html"));
}



// go back in history
void TabController::pageBack() {
    QWebEngineView *webView = qobject_cast<QWebEngineView *>(app->tab_widget->currentWidget());
    if (webView)
        webView->back();
}

// go forward in history
void TabController::pageForward() {
    QWebEngineView *webView = qobject_cast<QWebEngineView *>(app->tab_widget->currentWidget());
    if (webView)
        webView->forward();
}

// reload current page
void TabController::pageReload() {
    QWebEngineView *webView = qobject_cast<QWebEngineView *>(app->tab_widget->currentWidget());
    if (webView)
        webView->reload();
}

// change url
void TabController::pageChangeUrl(QString url) {
    // TODO url validation
}

// selecting tab by index and handling changes
void TabController::selectTab(int index) {
    app->tab_widget->setCurrentIndex(index);

    // TODO fav checking here prob
}

// closing tab by index
// FIX next index double calculation
void TabController::closeTab(int index) {
    // calculating new index
    int nextIndex;
    if (index == app->tab_widget->count() - 1)
        nextIndex = index;
    else
        nextIndex = index+1;

    // removing tab
    app->tab_widget->removeTab(index-1);
}