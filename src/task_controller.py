
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

    # select by id
    @Slot(int)
    def select_task(self, task_id):
        task = self.app.db.get_task(task_id)
        self.current = task
        self.app.db.set_setting('current', task.id)

        # reopen tabs
        self.close_tabs()
        self.open_tabs()

    # get currently selected
    @Slot(result=str)
    def get_current_task(self):
        current = self.app.db.get_setting('current')
        current = self.app.db.get_task(current)
        return json.dumps(model_to_dict(current))

    # create
    @Slot(str, str, int, result=int)
    def create_task(self, name, color, parent_id):
        if parent_id == 0:
            parent_id = None
        task = self.app.db.create_task(name, color, parent_id)
        self.select_task(task)
        return task.id

    # rename task
    @Slot(int, str)
    def rename_task(self, task_id, name):
        task = self.app.db.get_task(task_id)
        task.name = name
        task.save()

    @Slot(int, str)
    def create_column(self, task_id, name):
        # create_column(self, name, order, task):
        order = len(self.app.db.get_columns(task_id))
        self.app.db.create_column(order, name, task_id)

    @Slot(int, result=str)
    def get_columns(self, task_id):
        return json.dumps([model_to_dict(c) for c in self.app.db.get_columns(task_id)])

    # get full tree
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

    # get task by id
    # TODO check if used
    @Slot(int, result=str)
    def get_task(self, id):
        return json.dumps(model_to_dict(self.app.db.get_task(id)))

    # save tab to current task
    def save_tab(self, url, order):
        self.app.db.save_link(url, order, self.current.id)

    # delete tab
    def delete_tab(self, order):
        self.app.db.delete_link(order, self.current.id)

    # close task tabs
    def close_tabs(self):
        self.app.window_controller.js.closeAllTabs()

        total = self.app.tab_widget.count()
        for i in range(total):
            # removing tab
            web_view = self.app.tab_widget.widget(0)
            self.app.tab_widget.removeTab(0)
            if web_view:
                web_view.deleteLater()

        # self.app.tab_widget.clear()

    # open task tabs
    def open_tabs(self):
        task = self.current
        links = self.app.db.get_links(task.id)
        if links:
            for link in links:
                self.app.tab_controller.createBrowserTab(link.url)
        else:
            self.app.tab_controller.createBrowserTab()

        # TODO load selected position
        # self.app.tab_widget.setCurrentIndex(0)
        # self.app.window_controller.js.selectTab(0)