
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

class Fav(BaseModel):
    url = CharField()
    title = CharField()
    # TODO description etc
    # TODO icon

class Task(BaseModel):
    name = CharField()
    color = CharField(default="#000000")
    parent = ForeignKeyField('self', backref='children', to_field="id", null=True)
    # TODO types

    def get_all_dict(self):
        data = model_to_dict(self)
        data['children'] = [child.get_all_dict() for child in self.children]
        return data

class KanbanColumn(BaseModel):
    name = CharField()
    order = IntegerField()
    visible = BooleanField(default=True)
    task = ForeignKeyField(Task, backref='columns', to_field="id")

class OpenedLink(BaseModel):
    url = CharField()
    order = IntegerField()
    task = ForeignKeyField(Task, backref='links', to_field="id")

    class Meta:
        primary_key = CompositeKey('task', 'order')
    

# CONTROLLER
class DBController:
    def __init__(self):
        self.db = db

        # init db and tables
        db.connect()
        db.create_tables([Setting, Visited, Fav, Task, OpenedLink])

        # check if first run
        try:
            Setting.get(Setting.key == "current")
        except Setting.DoesNotExist:
            # making first project
            print("DB is empty, initializing...")

            task = Task.create(
                name="Default task",
                parent=None,
            )

            # TODO remove test structure or move to separate tests
            task2 = Task.create(
                name="Default task 2",
                parent=task,
            )

            task6 = Task.create(
                name="Default task 6",
                parent=task,
            )

            task7 = Task.create(
                name="Project 2",
                parent=None,
            )

            task3 = Task.create(
                name="Default task 3",
                parent=task2,
            )

            task4 = Task.create(
                name="Default task 4",
                parent=task2,
            )

            task5 = Task.create(
                name="Default task 5",
                parent=task4,
            )

            task8 = Task.create(
                name="Default task 8",
                parent=task7,
            )

            fav = Fav.create(
                url="https://www.google.com",
                title="Google",
            )
            fav.save()

            link = OpenedLink.create(
                url="https://www.google.com",
                order=0,
                task=task
            )
            link.save()

            setting = Setting.create(
                key="current",
                value=task.id
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
        setting = Setting.replace(key=key, value=value).execute()
        # setting.save()

    # TASK
    def create_task(self, name, color, parent_id):
        task = Task.create(
            name=name,
            color=color,
            parent=parent_id
        )
        task.save()
        return task

    def get_task(self, task_id):
        try:
            return Task.get(Task.id == task_id)
        except Task.DoesNotExist:
            print(f"There is no tasks with {task_id = } in db")
            return None

    def get_top_tasks(self):
        try:
            return list( Task.select().where(Task.parent == None) )
        except Task.DoesNotExist:
            print("There is no tasks in db")
            return None

    # KANBAN COLUMN
    def create_column(self, name, order, task_id):
        column = KanbanColumn.create(
            name=name,
            order=order,
            task=task_id
        )
        column.save()
        return column

    def get_columns(self, task_id):
        try:
            return list( KanbanColumn.select().where(KanbanColumn.task == task_id) )
        except KanbanColumn.DoesNotExist:
            print(f"There is no columns in db for {task_id = }")
            return []

    def switch_places_column(self, task_id, source, target):
        try:
            column1 = KanbanColumn.get(task == task_id and order == source)
            column2 = KanbanColumn.get(task == task_id and order == target)

            column1.order = target
            column2.order = source

            column1.save()
            column2.save()
        except KanbanColumn.DoesNotExist:
            print(f"There is no column with {task_id = } and {order = } in db")

    def toggle_visibility_column(self, task_id, order, visible):
        try:
            column = KanbanColumn.get(task == task_id and order == order)
            column.visible = visible
            column.save()
        except KanbanColumn.DoesNotExist:
            print(f"There is no column with {task_id = } and {order = } in db")

    # FAVORITE
    def create_fav(self, url, title):
        fav = Fav.create(
            url=url,
            title=title
        )
        fav.save()

    def delete_fav(self, url):
        try:
            fav = Fav.get(Fav.url == url)
            fav.delete_instance()
        except Fav.DoesNotExist:
            print(f"Try to delete not existing fav: {url}")

    # TODO update fav

    def check_fav(self, url):
        try:
            fav = Fav.get(Fav.url == url)
            return 1
        except Fav.DoesNotExist:
            return 0

    # VISITED

    # OPENED LINK