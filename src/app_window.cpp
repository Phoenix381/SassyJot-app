
#include <QVBoxLayout>
#include <QHBoxLayout>

#include <QUrl>

#include "include/app_window.h"

// =============================================================================
// app window initialization
// =============================================================================

AppWindow::AppWindow() {
    //  setting up window
    setWindowFlags(Qt::FramelessWindowHint);
    showMaximized();

    // init web views
    main_page = new QWebEngineView();
    dev_view = new QWebEngineView();
    sidebar = new QWebEngineView();
    controls = new QWebEngineView();
    
    // layouts
    QVBoxLayout *main_layout = new QVBoxLayout();
    QHBoxLayout *sidepanel_layout = new QHBoxLayout();
    QVBoxLayout *page_layout = new QVBoxLayout();

    // space between widgets
    main_layout->setContentsMargins(0,0,0,0);
    main_layout->setSpacing(2);
    dev_view->setStyleSheet("background-color: lightblue;");

    // init content
    main_page->load(QUrl("https://google.com"));

    // laying out widgets
    page_layout->addWidget(main_page);
    page_layout->addWidget(dev_view);

    sidepanel_layout->addLayout(page_layout);
    sidepanel_layout->addWidget(sidebar);

    main_layout->addWidget(controls);
    main_layout->addLayout(sidepanel_layout);

    // setting up size
    controls->setFixedHeight(84);
    controls->setSizePolicy(QSizePolicy::Preferred, QSizePolicy::Fixed);

    sidebar->setFixedWidth(650);
    sidebar->setSizePolicy(QSizePolicy::Fixed, QSizePolicy::Preferred);

    // app window
    QWidget *window = new QWidget();

    setStyleSheet(
        "QWidget { padding: 0px; margin: 0px; }"
        "QWidget { background-color: #282828; }"

    );

    window->setLayout(main_layout);
    this->setCentralWidget(window);
}