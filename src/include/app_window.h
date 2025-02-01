
#ifndef APP_WINDOW_H
#define APP_WINDOW_H

#include <QMainWindow>
#include <QWebEngineView>

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
public slots:

};

#endif