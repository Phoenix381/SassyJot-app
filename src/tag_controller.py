
from PySide6.QtCore import QObject, Slot
from playhouse.shortcuts import model_to_dict
import json

class TagController(QObject):
    def __init__(self, app):
        super().__init__()
        self.app = app

    # create tag
    @Slot(str, str, result=str)
    def create_tag(self, name, color):
        tag = self.app.db.create_tag(name, color)
        return json.dumps(model_to_dict(tag))

    # get all tags
    @Slot(result=str)
    def get_tags(self):
        tags = self.app.db.get_tags()
        return json.dumps([model_to_dict(tag) for tag in tags])

    # get tag by id
    def get_tag(self, tag_id):
        tag = self.app.db.get_tag(tag_id)
        return json.dumps(model_to_dict(tag))

    # update tag by id
    @Slot(str, str, int)
    def update_tag(self, name, color, tag_id):
        self.app.db.update_tag(name, color, tag_id)
