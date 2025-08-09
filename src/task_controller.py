
from PySide6.QtCore import QObject, Slot
from playhouse.shortcuts import model_to_dict
# from peewee import prefetch
# from .db_controller import Project, Task
import json

class TaskController(QObject):
    def __init__(self, app):
        super().__init__()
        self.app = app

        self.current = self.app.db.get_setting('current')
        self.current = self.app.db.get_task(self.current)

        if not self.current:
            print('No current task option in db')

    @Slot(int)
    def select_task(self, task_id):
        task = self.app.db.get_task(task_id)
        self.current = task
        self.app.db.set_setting('current', task.id)
        # TODO reopen tabs

    @Slot(result=str)
    def get_current_task(self):
        current = self.app.db.get_setting('current')
        current = self.app.db.get_task(current)
        return json.dumps(model_to_dict(current))

    @Slot(str, str, int, result=int)
    def create_task(self, name, color, parent_id):
        if parent_id == 0:
            parent_id = None
        task = self.app.db.create_task(name, color, parent_id)
        self.select_task(task)
        return task.id

    @Slot(int, str)
    def create_column(self, task_id, name):
        # create_column(self, name, order, task):
        order = len(self.app.db.get_columns(task_id))
        self.app.db.create_column(order, name, task_id)

    @Slot(int, result=str)
    def get_columns(self, task_id):
        return json.dumps([model_to_dict(c) for c in self.app.db.get_columns(task_id)])

    @Slot(result=str)
    def get_task_tree(self):
        try:
            # get top level tasks
            tasks = self.app.db.get_top_tasks()
            result = []

            # construct task tree
            for task in tasks:
                all_tasks = task.get_all_dict()
                result.append(all_tasks)

            return json.dumps(result)

        except Exception as e:
            print(e)
            print('Error getting tasks')
            return json.dumps([])

    @Slot(int, result=str)
    def get_task(self, id):
        return json.dumps(model_to_dict(self.app.db.get_task(id)))
