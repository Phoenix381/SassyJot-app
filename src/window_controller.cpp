
#include "include/controllers.h"

// =============================================================================
// app window controller
// =============================================================================

// constructor
WindowController::WindowController(AppWindow *window) {
    this->window = window;
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