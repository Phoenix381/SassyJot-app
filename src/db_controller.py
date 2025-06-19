
from peewee import *
from playhouse.shortcuts import model_to_dict

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

class Task(BaseModel):
    name = CharField()
    parent_id = ForeignKeyField('self', backref='children', to_field="id", null=True)
    project_id = ForeignKeyField(Project, backref='tasks', to_field="id")

    def get_all_dict(self):
        data = model_to_dict(self)
        data['children'] = [child.get_all_dict() for child in self.children]
        return data

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
        db.create_tables([Setting, Visited, Project, Task, OpenedLink])

        # check if first run
        try:
            Setting.get(Setting.key == "current")
        except Setting.DoesNotExist:
            # making first project
            print("DB is empty, initializing...")

            project = Project.create(
                name="Default project", 
                color="#000000", 
                description="Default project"
            )
            project.save()

            task = Task.create(
                name="Default task",
                parent_id=None,
                project_id=project,
            )
            # task.save()


            # TODO remove test structure or move to separate tests
            task2 = Task.create(
                name="Default task 2",
                parent_id=task,
                project_id=project,
            )

            task3 = Task.create(
                name="Default task 3",
                parent_id=task,
                project_id=project,
            )

            task4 = Task.create(
                name="Default task 4",
                parent_id=task3,
                project_id=project,
            )

            task5 = Task.create(
                name="Default task 5",
                parent_id=None,
                project_id=project,
            )

            project2 = Project.create(
                name="Default project 2", 
                color="#000000", 
                description="Default project"
            )
            
            task6 = Task.create(
                name="Default task 6",
                parent_id=None,
                project_id=project2,
            )



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
            return Project.select()
            # return list( Project.select().where(Project.active == True).get() )
        except Project.DoesNotExist:
            print("There is no projects in db")
            return None

    # TASK
    def create_task(self, name, project_id):
        task = Task.create(
            name=name,
            project_id=project_id
        )
        task.save()
        return task

    def get_task(self, task_id):
        try:
            return Task.get(Task.id == task_id)
        except Task.DoesNotExist:
            print(f"There is no tasks with {task_id = } in db")
            return None

    def get_task_children(self, task_id):
        try:
            return list( Task.select().where(Task.parent_id == task_id) )
        except Task.DoesNotExist:
            print("There is no tasks in db")
            return None

    def get_project_tasks(self, project_id):
        try:
            return list( Task.select().where(Task.project == project_id) )
        except Task.DoesNotExist:
            print("There is no tasks in db")
            return None

    # VISITED

    # OPENED LINK