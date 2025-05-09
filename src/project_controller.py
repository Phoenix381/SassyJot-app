
from PySide6.QtCore import QObject
from playhouse.shortcuts import model_to_dict

class ProjectController(QObject):
    def __init__(self, app):
        super().__init__()
        self.app = app

        self.current = self.app.db.get_setting('current')
        if not self.current:
            print('No current project option in db')

    def select_project(self, id):
        self.current = id
        self.app.db.set_setting('current', id)

    def create_project(self, name, color, description):
        project = self.app.db.create_project(name, color, description)
        self.select_project(project.id)
        # TODO top level task?
        return id

    def get_projects(self):
        try:
            projects = self.app.db.get_projects().get()
            return model_to_dict(projects)
        except:
            return []