
#ifndef CONTROLLERS_H
#define CONTROLLERS_H

#include "app_window.h"

// forward declarations
class AppWindow;

// =============================================================================
// window controller
// =============================================================================

class WindowController : public QObject {
    Q_OBJECT
public:
    WindowController(AppWindow *window);

private:
    AppWindow *window;
public slots:
};

#endif