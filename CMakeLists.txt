
cmake_minimum_required(VERSION 3.16)

project(SassyJotProject VERSION 0.0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_AUTOMOC ON)

find_package(Qt6 REQUIRED COMPONENTS WebEngineWidgets WebChannel Widgets)
qt_standard_project_setup()

# src and headers
file(GLOB SOURCES "src/*.cpp")
file(GLOB HEADERS "src/include/*.h")

# resources
qt_add_resources(RESOURCES
    src/res/sassy.qrc
)

qt_add_executable(SassyJot
    ${SOURCES}
    ${RESOURCES}
    ${HEADERS}
)

# header path
target_include_directories(SassyJot PRIVATE
    src/include
)


# linking qt
target_link_libraries(SassyJot PRIVATE
    Qt6::WebEngineWidgets
    Qt6::WebChannel
    Qt6::Widgets
)

# linking sqlite orm
add_subdirectory(src/deps)
target_link_libraries(SassyJot PRIVATE sqlite_orm::sqlite_orm)
