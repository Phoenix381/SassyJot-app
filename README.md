# SassyJot-app
SassyJot desktop app.

## Running
Depends on qt6: WebEngineWidgets WebChannel Widgets.
Using PySide6.

To rebuild resources (using arch linux):
```bash
/usr/lib/qt6/rcc sassy.qrc -g python -o sassy_rc.py
```