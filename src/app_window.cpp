
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QSplitter>

#include <QUrl>

#include "include/app_window.h"

// =============================================================================
// app window initialization
// =============================================================================

AppWindow::AppWindow() {
    //  setting up window
    setWindowFlags(Qt::FramelessWindowHint);
    showMaximized();
    // qputenv("QTWEBENGINE_CHROMIUM_FLAGS", QByteArray("--force-dark-mode"));

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
        "QWidget { background-color: red; }"
    );

    // laying out widgets
    page_splitter->addWidget(main_page);
    page_splitter->addWidget(dev_view);

    sidepanel_spliter->addWidget(page_splitter);
    sidepanel_spliter->addWidget(sidebar);

    main_layout->addWidget(controls);
    main_layout->addWidget(sidepanel_spliter);

    // init content
    main_page->load(QUrl("https://google.com"));
    sidebar->load(QUrl("qrc:/html/sidepanel.html"));
    controls->load(QUrl("qrc:/html/controls.html"));
    controls->page()->setDevToolsPage(dev_view->page());

}