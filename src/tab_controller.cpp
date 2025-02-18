
#include "include/controllers.h"

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