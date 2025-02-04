
#ifndef APP_WINDOW_H
#define APP_WINDOW_H

#include <QMainWindow>
#include <QWebEngineView>

#include "controllers.h"
// forward declarations for controllers
class WindowController;

// =============================================================================
// app window class
// =============================================================================

class AppWindow : public QMainWindow {
    Q_OBJECT
public:
    AppWindow();

    // window parts
    QWebEngineView* controls;
    QWebEngineView* main_page;
    QWebEngineView* dev_view;
    QWebEngineView* sidebar;
    
    // modal
    QWebEngineView* modal;

    // controllers
    WindowController* window_controller;
public slots:

};

#endif