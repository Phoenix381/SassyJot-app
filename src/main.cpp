
#include <QApplication>

#include "include/app_window.h"

int main(int argc, char *argv[]) {
    QApplication app(argc, argv);
    QMainWindow window;
    window.show();
    return app.exec();
}