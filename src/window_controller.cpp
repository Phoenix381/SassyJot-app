
#include "include/controllers.h"

// =============================================================================
// js caller object
// =============================================================================

class jsCaller {
public:
	AppWindow *app;

	jsCaller(AppWindow *app) {	
		this->app = app;
	}
};

// =============================================================================
// app window controller
// =============================================================================

// constructor
WindowController::WindowController(AppWindow *app) {
    this->app = app;
    this->js = new jsCaller(app);
}

// closing window
void WindowController::closeWindow() {
    app->close();   
}

// minimizing window
void WindowController::minWindow() {
    app->showMinimized();
}

// maximizing window
void WindowController::maxWindow() {
    if (app->isMaximized()) {
        app->showNormal();
    } else {
        app->showMaximized();
    }
}

// handling lmb press from js controls
void WindowController::windowMove() {
    dragging = true;
    app->grabMouse();
    localPos = app->mapFromGlobal(QCursor::pos());
}