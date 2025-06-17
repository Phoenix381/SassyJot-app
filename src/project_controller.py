
from PySide6.QtCore import QObject, Slot
from playhouse.shortcuts import model_to_dict
# from peewee import prefetch
# from .db_controller import Project, Task
import json

class ProjectController(QObject):
    def __init__(self, app):
        super().__init__()
        self.app = app

        self.current_task = self.app.db.get_setting('current')
        task = self.app.db.get_task(self.current_task)
        self.current_project = task.project_id

        if not self.current_task:
            print('No current project option in db')

    def select_task(self, id):
        self.current_task = id
        self.app.db.set_setting('current', id)
        # TODO reopen tabs

    def create_project(self, name, color, description):
        project = self.app.db.create_project(name, color, description)
        # TODO top level task?
        task = self.app.db.create_task(name, project.id)
        self.select_task(tasks.id)
        return id

    @Slot(result=str)
    def get_projects_tasks(self):
        try:
            result = []

            # get projects
            projects = self.app.db.get_projects()

            # get tasks
            for project in projects:
                tasks = [task.get_all_dict() for task in project.tasks if task.parent_id is None]
                p = model_to_dict(project)
                p['children'] = tasks
                result.append(p)
                
            return json.dumps(result)

        except Exception as e:
            print(e)
            print('Error getting tasks')
            return json.dumps([])