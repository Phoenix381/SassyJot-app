
#include "include/app_window.h"

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QSplitter>
#include <QLabel>
#include <QUrl>

#include <QMouseEvent>
#include <QContextMenuEvent>
#include <QApplication>

#include <QTabBar>

#include <QWebChannel>

// =============================================================================
// app window initialization
// =============================================================================

AppWindow::AppWindow() {
    // creating main layout parts
    QWidget *window = new QWidget();

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
    controls->setContextMenuPolicy(Qt::PreventContextMenu);
    controls->page()->setBackgroundColor(Qt::transparent);
    controls->load(QUrl("qrc:/html/controls.html"));

    // main app layout
    app_layout->addWidget(controls);
    app_layout->addStretch();

    // content views
    dev_view = new QWebEngineView();
    sidebar = new QWebEngineView();
    sidebar->setVisible(false);

    // Tab widget
    tab_widget = new QTabWidget();
    tab_widget->tabBar()->setVisible(false);
    tab_widget->setMinimumHeight(340);

    // minimus size for aux views
    dev_view->setMinimumHeight(200);
    dev_view->setFixedHeight(200);
    sidebar->setMinimumWidth(200);

    // splitters between content views
    QSplitter *side_spliter = new QSplitter(Qt::Horizontal);
    QSplitter *dev_splitter = new QSplitter(Qt::Vertical);
    dev_splitter->setHandleWidth(2);
    dev_splitter->setStyleSheet("QSplitter { background-color: red; }");

    // setting up content layout
    dev_splitter->addWidget(tab_widget);
    dev_splitter->addWidget(dev_view);

    side_spliter->addWidget(dev_splitter);
    side_spliter->addWidget(sidebar);

    QVBoxLayout *overlapping_layout = new QVBoxLayout();
    overlapping_layout->setContentsMargins(0, 0, 0, 0);

    overlapping_widget->setLayout(overlapping_layout);
    overlapping_layout->addWidget(side_spliter);

    // creating controllers
    db = new DBController();
    project_controller = new ProjectController(this);
    window_controller = new WindowController(this);
    tab_controller = new TabController(this);
    project_controller = new ProjectController(this);

    // setting up web channel for controls
    QWebChannel *controls_channel = new QWebChannel(controls);
    controls_channel->registerObject("window_controller", window_controller);
    controls_channel->registerObject("tab_controller", tab_controller);
    controls->page()->setWebChannel(controls_channel);

    // init content views
    sidebar->load(QUrl("qrc:/html/sidepanel.html"));
    controls->page()->setDevToolsPage(dev_view->page());

    // init app geometery
    overlapping_widget->setGeometry(0, 84, width(), height() - 84);
    this->setCentralWidget(window);

    // install event filter
    QCoreApplication::instance()->installEventFilter(this);

    // init after controls loaded
    connect(controls, &QWebEngineView::loadFinished, this, 
        [this](){
            // TODO init from session
            tab_controller->createTab("qrc:/html/dashboard.html");
            window_controller->js->createTab();
        }
    );
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

// =============================================================================
// passing events
// =============================================================================

bool AppWindow::eventFilter(QObject *obj, QEvent *e) {
    if (obj == controls->focusProxy()) {
        // passing mouse move through controls
        if(e->type() == QEvent::MouseMove) {
            QMouseEvent *mouseEvent = static_cast<QMouseEvent*>(e);
            if (mouseEvent->position().y() > 84) {
                auto pos = mouseEvent->position();
                pos.setY(pos.y() - 84);
                
                QMouseEvent newEvent(mouseEvent->type(), 
                                    pos,
                                    mouseEvent->scenePosition(),
                                    mouseEvent->globalPosition(),
                                    mouseEvent->button(),
                                    mouseEvent->buttons(),
                                    mouseEvent->modifiers());

                QWebEngineView *webView = qobject_cast<QWebEngineView *>(tab_widget->currentWidget());
                QCoreApplication::sendEvent(webView->focusProxy(), &newEvent);
            }
        }
        // passing mouse press and release through controls
        else if (e->type() == QEvent::MouseButtonPress || e->type() == QEvent::MouseButtonRelease) {
            QMouseEvent *mouseEvent = static_cast<QMouseEvent*>(e);
            if (mouseEvent->position().y() > 84) {
                auto pos = mouseEvent->position();
                pos.setY(pos.y() - 84);
                
                QMouseEvent newEvent(mouseEvent->type(), 
                                    pos,
                                    mouseEvent->scenePosition(),
                                    mouseEvent->globalPosition(),
                                    mouseEvent->button(),
                                    mouseEvent->buttons(),
                                    mouseEvent->modifiers());

                QWebEngineView *webView = qobject_cast<QWebEngineView *>(tab_widget->currentWidget());
                QCoreApplication::sendEvent(webView->focusProxy(), &newEvent);

                // also focus
                webView->setFocus();
            }
        }
        // disabling context menu for controls
        else if (e->type() == QEvent::ContextMenu) {
            return true; 
        }
    }

    return false;
}