
#ifndef CONTROLLERS_H
#define CONTROLLERS_H

#include "app_window.h"

#include <QPoint>
#include <QSize>
#include <QWebEngineProfile>

#include <vector>

// forward declarations
class AppWindow;

// =============================================================================
// js caller object
// =============================================================================

class jsCaller {
public:
    QWebEngineView* controls;

    jsCaller(QWebEngineView *controls) {  
        this->controls = controls;
    }

    // creating new tab
    void createTab() { controls->page()->runJavaScript("newTab()"); }
    void updateTabTitle(int index, QString title) { 
        controls->page()->runJavaScript(QString("updateTabTitle(%1, '%2')").arg(index).arg(title));
    }
    void updateTabIcon(int index, QString icon) {
        controls->page()->runJavaScript(QString("updateTabIcon(%1, '%2')").arg(index).arg(icon));   
    }
};

// =============================================================================
// window controller
// =============================================================================

class WindowController : public QObject {
    Q_OBJECT
public:
    WindowController(AppWindow *app);

    // moving window
    bool dragging = false;
    QPoint localPos;
    // resizing window
    QSize lastSize;
    bool maximized = false;

    jsCaller *js;
private:
    AppWindow *app;
public slots:
    void closeWindow();
    void minWindow();
    void maxWindow();

    void windowMove();
};

// =============================================================================
// tab controller
// =============================================================================

// class Tab : public QWebEngineView {
//     Q_OBJECT
// public:
//     Tab(AppWindow *app);
//     // TODO dev, aux
// private:
//     AppWindow *app;
// };

class TabController : public QObject {
    Q_OBJECT
public:
    TabController(AppWindow *app);

    // tabs
    // TODO keeping track of current tab
    // int currentTab = 0;
    // QWebEngineView *current_page;
private:
    AppWindow *app;
    QWebEngineProfile *profile;
public slots:
    void createTab(QString url);
    void selectTab(int index);
    void closeTab(int index);

    void pageBack();
    void pageForward();
    void pageReload();
    void pageChangeUrl(QString url);
};

#endif