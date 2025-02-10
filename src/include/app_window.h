
#ifndef APP_WINDOW_H
#define APP_WINDOW_H

#include <QMainWindow>
#include <QWebEngineView>
#include <QTabWidget>

#include "controllers.h"
// forward declarations for controllers
class WindowController;
class TabController;

// =============================================================================
// app window class
// =============================================================================

class AppWindow : public QMainWindow {
    Q_OBJECT
public:
    AppWindow();

    // app web views
    QWebEngineView* controls;
    QWebEngineView* dev_view;
    QWebEngineView* sidebar;

    // main page container
    QTabWidget *tab_widget;
    
    // main content widget
    QWidget* overlapping_widget;

    // controllers
    WindowController* window_controller;
    TabController* tab_controller;
protected:
    // handling window drag anad drop
    void mouseMoveEvent(QMouseEvent *event) override;
    void mouseReleaseEvent(QMouseEvent *event) override;
    // hadlinig window resize
    void resizeEvent(QResizeEvent *event) override;
    // redirecting events from controls
    bool eventFilter(QObject *obj, QEvent *e) override;
public slots:

};

#endif