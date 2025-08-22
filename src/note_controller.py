
from PySide6.QtCore import QObject, Slot
from playhouse.shortcuts import model_to_dict
import json

class NoteController(QObject):
    def __init__(self, app):
        super().__init__()
        self.app = app

    # create note
    @Slot(str, int, result=str)
    def create_note(self, name, status):
        note = self.app.db.create_note(name, status)
        return json.dumps(model_to_dict(note))

    # get all notes
    # TODO tag filter
    @Slot(result=str)
    def get_notes(self):
        notes = self.app.db.get_notes()
        return json.dumps([model_to_dict(note) for note in notes])

    # get links for notes
    # TODO tag filter
    @Slot(result=str)
    def get_links(self):
        # TODO
        return json.dumps([])