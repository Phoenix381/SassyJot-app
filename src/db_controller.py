
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
    active = BooleanField(default=True)

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
            print("DB is empty, initializing...")

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

    # SETTING
    def get_setting(self, key):
        try:
            return Setting.get(Setting.key == key).value
        except Setting.DoesNotExist:
            print("Setting does not exist: " + key)
            return None

    def set_setting(self, key, value):
        setting = Setting.replace(key=key, value=value)
        setting.save()

    # PROJECT
    def create_project(self, name, color, description):
        project = Project.create(
            name=name, 
            color=color, 
            description=description
        )
        project.save()
        return project

    def get_projects(self):
        try:
            return Project.select().where(Project.active == True)
        except Project.DoesNotExist:
            print("There is no projects in db")
            return None

    # VISITED

    # OPENED LINK