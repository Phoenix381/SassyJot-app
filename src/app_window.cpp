
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QSplitter>
#include <QLabel>
#include <QUrl>
#include <QMouseEvent>

#include <QWebChannel>

#include "include/app_window.h"

#include <iostream>

// =============================================================================
// app window initialization
// =============================================================================

AppWindow::AppWindow() {
    // creating controllers
    window_controller = new WindowController(this);

    // creating main layout parts
    QWidget *window = new QWidget();
    this->setCentralWidget(window);

    overlapping_widget = new QWidget(window);
    overlapping_widget->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Expanding);
    
    QVBoxLayout *app_layout = new QVBoxLayout(window);
    app_layout->setContentsMargins(0, 0, 0, 0);
    app_layout->setSpacing(0);

    // setting up window
    setWindowFlags(Qt::FramelessWindowHint);
    showMaximized();

    // app controls view
    controls = new QWebEngineView();
    controls->setFixedHeight(420);
    controls->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Fixed);
    controls->page()->setBackgroundColor(Qt::transparent);
    controls->load(QUrl("qrc:/html/controls.html"));

    // main app layout
    app_layout->addWidget(controls);
    app_layout->addStretch();

    // content views
    main_page = new QWebEngineView();
    dev_view = new QWebEngineView();
    sidebar = new QWebEngineView();
    sidebar->setVisible(false);

    // minimus size for aux views
    dev_view->setMinimumHeight(200);
    sidebar->setMinimumWidth(200);

    // splitters between content views
    QSplitter *side_spliter = new QSplitter(Qt::Horizontal);
    QSplitter *dev_splitter = new QSplitter(Qt::Vertical);
    dev_splitter->setHandleWidth(2);
    dev_splitter->setStyleSheet("QSplitter { background-color: red; }");

    // setting up content layout
    dev_splitter->addWidget(main_page);
    dev_splitter->addWidget(dev_view);

    side_spliter->addWidget(dev_splitter);
    side_spliter->addWidget(sidebar);

    QVBoxLayout *overlapping_layout = new QVBoxLayout();
    overlapping_layout->setContentsMargins(0, 0, 0, 0);

    overlapping_widget->setLayout(overlapping_layout);
    overlapping_layout->addWidget(side_spliter);

    // setting up web channel for controls
    QWebChannel *controls_channel = new QWebChannel(controls);
    controls_channel->registerObject("window_controller", window_controller);
    controls->page()->setWebChannel(controls_channel);

    // init content views
    main_page->load(QUrl("https://google.ru"));
    sidebar->load(QUrl("qrc:/html/sidepanel.html"));
    controls->page()->setDevToolsPage(dev_view->page());

    // init app geometery
    overlapping_widget->setGeometry(0, 84, width(), height() - 84);
}

// =============================================================================
// redefining mouse bahavior
// =============================================================================

// dragging window with mouse
void AppWindow::mouseMoveEvent(QMouseEvent *event) {
    // TODO improve dragging
    if (window_controller->dragging) {   
        QPoint globalPos = event->globalPosition().toPoint();
        window()->move(globalPos.x() - window_controller->localPos.x(), globalPos.y() - window_controller->localPos.y());

        // Find the screen where the cursor is located
        QScreen *screen = QGuiApplication::screenAt(globalPos);
        if (screen) {
            QRect screenGeometry = screen->geometry();

            if (!this->isMaximized() && globalPos.y() <= screenGeometry.top()) {
                window_controller->maximized = true;
                this->showMaximized(); 
            } else if (globalPos.y() > screenGeometry.top()) {
                if(window_controller->maximized) {
                    window_controller->maximized = false;
                    this->showNormal();
                    this->resize(window_controller->lastSize);
                }
            }
        }
    }
}

// handling lmb release
void AppWindow::mouseReleaseEvent(QMouseEvent *event) {
    if (window_controller->dragging && event->button() == Qt::LeftButton) {
        window_controller->dragging = false;
        releaseMouse();
    }
}

// =============================================================================
// keeping layout sizes
// =============================================================================

void AppWindow::resizeEvent(QResizeEvent *event) {
    QMainWindow::resizeEvent(event);
    overlapping_widget->resize(width(), height() - 84);
}