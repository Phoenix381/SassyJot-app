
#include "include/controllers.h"

// =============================================================================
// js caller object
// =============================================================================

class jsCaller {
public:
	AppWindow *window;

	jsCaller(AppWindow *window) {	
		this->window = window;
	}
};

// =============================================================================
// app window controller
// =============================================================================

// constructor
WindowController::WindowController(AppWindow *window) {
    this->window = window;
    this->js = new jsCaller(window);
}

// closing window
void WindowController::closeWindow() {
    window->close();   
}

// minimizing window
void WindowController::minWindow() {
    window->showMinimized();
}

// maximizing window
void WindowController::maxWindow() {
    if (window->isMaximized()) {
        window->showNormal();
    } else {
        window->showMaximized();
    }
}

// handling lmb press from js controls
void WindowController::windowMove() {
    dragging = true;
    window->grabMouse();
    localPos = window->mapFromGlobal(QCursor::pos());
}