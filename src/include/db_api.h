
#ifndef DB_API_H
#define DB_API_H

#include "sqlite_orm.h"
using namespace sqlite_orm;

#include <QVector>
#include <vector>

#include <QJsonObject>
#include <QJsonArray>
#include <QJsonDocument>

// =============================================================================
// db objects
// =============================================================================

// base
class DbObject {
public:  
    virtual QString toString() = 0;
    virtual void fromString(QString str) = 0;
};

// project
class Project : public DbObject {
public: 
    int id;
    std::string name;
    std::string color;

    Project() : id(-1), name(""), color("") {}
    Project(std::string name, std::string color) 
        : name(name), color(color) { id = -1;}

    QString toString() {    
        QJsonObject obj;

        obj["id"] = id;
        obj["name"] = QString::fromStdString(name);
        obj["color"] = QString::fromStdString(color);

        QJsonDocument doc(obj);
        return doc.toJson(QJsonDocument::Indented);
    }

    void fromString(QString str) {
        QJsonDocument doc = QJsonDocument::fromJson(str.toUtf8());
        QJsonObject obj = doc.object();

        id = obj["id"].toInt();
        name = obj["name"].toString().toStdString();
        color = obj["color"].toString().toStdString();
    }
};

// =============================================================================
// subclasses
// =============================================================================

class DBController;

class ProjectAPI : public QObject {
    Q_OBJECT
public:
    ProjectAPI(DBController* db) : db(db) {}
private:
    DBController* db;
public slots:
    // CRUD
    int create(QString name, QString color);
    Project read(int id);
    std::vector<Project> ReadAll();
    void update(int id, QString name, QString color);
    void remove(int id);
};

// =============================================================================
// main db api class
// =============================================================================

class DBController {
public:
    inline static auto storage =  make_storage("db.sqlite",
        // create tables
        make_table("projects",
            make_column("id", &Project::id, primary_key().autoincrement()),
            make_column("name", &Project::name),
            make_column("color", &Project::color)
        )
    );

    ProjectAPI* projects;
    
    DBController() {
        storage.sync_schema();

        projects = new ProjectAPI(this);

        // complex init logic here
    }
};

#endif // DB_API_H