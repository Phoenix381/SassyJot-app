include(FetchContent)

FetchContent_Declare(sqliteOrm
  GIT_REPOSITORY https://github.com/fnc12/sqlite_orm
  GIT_TAG        v1.9
)

add_subdirectory(sqlite_orm)