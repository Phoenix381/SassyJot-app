
#ifndef CONTROLLERS_H
#define CONTROLLERS_H

#include <QPoint>
#include <QSize>

#include "app_window.h"

// forward declarations
class AppWindow;
class jsCaller;

// =============================================================================
// window controller
// =============================================================================

class WindowController : public QObject {
    Q_OBJECT
public:
    WindowController(AppWindow *window);

    // moving window
    bool dragging = false;
    QPoint localPos;
    // resizing window
    QSize lastSize;
    bool maximized = false;

    jsCaller *js;
private:
    AppWindow *window;
public slots:
    void closeWindow();
    void minWindow();
    void maxWindow();

    void windowMove();
};

#endif