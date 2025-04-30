
from peewee import *

db = SqliteDatabase("jot.db")

# MODELS
class BaseModel(Model):
    class Meta:
        database = db

class Setting(BaseModel):
    key = CharField(unique=True, primary_key=True)
    value = CharField()

class Visited(BaseModel):
    url = CharField()
    title = CharField()
    timestamp = DateTimeField()

class Project(BaseModel):
    name = CharField()
    color = CharField()
    description = TextField()

class OpenedLink(BaseModel):
    url = CharField()
    order = IntegerField()
    project = ForeignKeyField(Project, backref='links', to_field="id")

    class Meta:
        primary_key = CompositeKey('project', 'order')
    

# CONTROLLER
class DBController:
    def __init__(self):
        self.db = db

        db.connect()
        db.create_tables([Setting, Visited, Project, OpenedLink])

        # check if first run
        try:
            Setting.get(Setting.key == "current")
        except Setting.DoesNotExist:
            # making first project
            project = Project.create(
                name="Default", 
                color="#000000", 
                description="Default project"
            )
            project.save()

            link = OpenedLink.create(
                url="https://www.google.com",
                order=0,
                project_id=project
            )
            link.save()

            setting = Setting.create(
                key="current",
                value=project.id
            )
            setting.save()