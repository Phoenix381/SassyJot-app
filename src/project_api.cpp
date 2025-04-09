
#include "include/db_api.h"

// =============================================================================
// data layer CRUD
// =============================================================================

// create
int ProjectAPI::create(QString name, QString color) {
    try {
        return db->storage.insert(Project(name.toStdString(), color.toStdString()));
    } catch (std::system_error e) {
        qDebug() << e.what();  
    } catch (...){
        qDebug() << "unknown exeption when creating project";
    }

   return -1;
}

// read by id
Project ProjectAPI::read(int id) {
    try {
        return db->storage.get<Project>(id);
    } catch (std::system_error e) {
        qDebug() << e.what();  
    } catch (...){
        qDebug() << "unknown exeption when reading project by id";
    }

    return Project();
}

// read all
std::vector<Project> ProjectAPI::ReadAll() {
    try {
        return db->storage.get_all<Project>();
    } catch (std::system_error e) {
        qDebug() << e.what();  
    } catch (...){
        qDebug() << "unknown exeption when reading project by id";
    }

    return std::vector<Project>();
}

// update by id
void ProjectAPI::update(int id, QString name, QString color) {
    try {
        Project project;
        project.id = id;
        project.name = name.toStdString();
        project.color = color.toStdString();
        return db->storage.update(project);
    } catch (std::system_error e) {
        qDebug() << e.what();   
    } catch (...){
        qDebug() << "unknown exeption when updating project by id";
    }
}

// delete by id
void ProjectAPI::remove(int id) {
    try {
        return db->storage.remove<Project>(id);
    } catch (std::system_error e) {
        qDebug() << e.what();  
    } catch (...){
        qDebug() << "unknown exeption when deleting project by id";
    }
}