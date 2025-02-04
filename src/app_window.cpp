
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QSplitter>

#include <QUrl>
#include <QMouseEvent>

#include <QWebChannel>

#include "include/app_window.h"

// =============================================================================
// app window initialization
// =============================================================================

AppWindow::AppWindow() {
    //  setting up window
    setWindowFlags(Qt::FramelessWindowHint);
    showMaximized();
    // qputenv("QTWEBENGINE_CHROMIUM_FLAGS", QByteArray("--force-dark-mode"));

    // creating controllers
    window_controller = new WindowController(this);

    // init web views
    main_page = new QWebEngineView();
    dev_view = new QWebEngineView();
    controls = new QWebEngineView();

    sidebar = new QWebEngineView();
    sidebar->setVisible(false);
    
    // setting up size
    controls->setFixedHeight(84);
    controls->setSizePolicy(QSizePolicy::Preferred, QSizePolicy::Fixed);

    // laying out app window
    QVBoxLayout *main_layout = new QVBoxLayout();
    QWidget *window = new QWidget();

    window->setLayout(main_layout);
    this->setCentralWidget(window);

    QSplitter *page_splitter = new QSplitter(Qt::Vertical);
    QSplitter *sidepanel_spliter = new QSplitter(Qt::Horizontal);

    // space between widgets
    main_layout->setContentsMargins(0,0,0,0);
    main_layout->setSpacing(2);

    // styling
    setStyleSheet(
        "QWidget { padding: 0px; margin: 0px; }"
        "QWidget { background-color: #282828; }"
    );

    page_splitter->setHandleWidth(2);
    page_splitter->setStyleSheet(
        "QSplitter { background-color: red; }"
    );

    // laying out widgets
    page_splitter->addWidget(main_page);
    page_splitter->addWidget(dev_view);

    sidepanel_spliter->addWidget(page_splitter);
    sidepanel_spliter->addWidget(sidebar);

    main_layout->addWidget(controls);
    main_layout->addWidget(sidepanel_spliter);

    // setting up web channel
    controls->load(QUrl("qrc:/html/controls.html"));
    QWebChannel *controls_channel = new QWebChannel(controls);
    controls_channel->registerObject("window_controller", window_controller);
    controls->page()->setWebChannel(controls_channel);

    // init content
    main_page->load(QUrl("https://google.com"));
    sidebar->load(QUrl("qrc:/html/sidepanel.html"));
    controls->page()->setDevToolsPage(dev_view->page());
}

// =============================================================================
// redefining mouse bahavior
// =============================================================================

// dragging window with mouse
void AppWindow::mouseMoveEvent(QMouseEvent *event) {
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