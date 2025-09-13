
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

    # create task at dashboard
    @Slot(str, str, str, int, result=int)
    def create_task(self, name, color, tags, parent_id):
        if name == '' or color == '':
            print('Error creating task')
            return None

        if parent_id == 0:
            parent_id = None
        task = self.app.db.create_task(name, color, parent_id)
        self.select_task(task)

        tags = json.loads(tags)
        for tag in tags:
            self.app.db.create_task_tag(task.id, tag['id'])

        return task

    # create task at column
    # TODO maybe merge create func
    @Slot(str, str, int, int, int, result=int)
    def create_column_task(self, name, color, parent_id, column_id, order):
        task = self.app.db.create_task(name, color, parent_id, column_id, order)
        return task.id

    # rename task
    @Slot(int, str)
    def rename_task(self, task_id, name):
        task = self.app.db.get_task(task_id)
        task.name = name
        task.save()

    # recolor task
    @Slot(int, str)
    def recolor_task(self, task_id, color):
        task = self.app.db.get_task(task_id)
        task.color = color
        task.save()

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

    # get tasks for column
    @Slot(int, result=str)
    def get_column_tasks(self, column_id):
        tasks = self.app.db.get_column_tasks(column_id)
        return json.dumps([model_to_dict(t) for t in tasks])

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

    # get current task sticky
    @Slot(int, result=str)
    def get_sticky(self, task_id):
        return self.app.db.get_note(task_id)

    # update current task sticky
    @Slot(str, int)
    def update_sticky(self, text, task_id):
        self.app.db.update_note(text, task_id)

    # get kanban columns for task
    @Slot(int, result=str)
    def get_kanban_columns(self, task_id):
        columns = self.app.db.get_columns(task_id)
        return json.dumps([model_to_dict(c) for c in columns])
    
    # make column
    @Slot(str, int, int, result=int)
    def create_kanban_column(self, name, order, task_id):
        column = self.app.db.create_column(name, order, task_id)
        return column.id

    # move column to another position
    @Slot(int, int)
    def move_kanban_column(self, column_id, new_order):
        self.app.db.move_column(column_id, new_order)

    # move task in or between columns
    @Slot(int, int, int)
    def move_task(self, task_id, new_column_id, new_order):
        self.app.db.move_task(task_id, new_column_id, new_order)

    # save time spent
    @Slot(int, int)
    def spent_time(self, task_id, time):
        self.app.db.spent_time(task_id, time)

    # get completed for current day
    @Slot(result=str)
    def get_spent_today(self):
        pomodoros = self.app.db.get_spent_today()
        return json.dumps([{'task_id': p.task_id, 'amount': p.amount} for p in pomodoros])