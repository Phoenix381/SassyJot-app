
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

    # get note by id
    @Slot(int, result=str)
    def get_note(self, note_id):
        note = self.app.db.get_note(note_id)
        return json.dumps(model_to_dict(note))

    # update note text
    @Slot(str, int)
    def update_note_text(self, text, note_id):
        self.app.db.update_note_text(text, note_id)

    # update note status
    @Slot(int, int)
    def update_note_status(self, status, note_id):
        self.app.db.update_note_status(status, note_id)

    # update note name
    @Slot(str, int)
    def update_note_name(self, text, name):
        self.app.db.update_note_name(text, name)

    # get links for notes
    # TODO tag filter
    @Slot(result=str)
    def get_links(self):
        # TODO
        return json.dumps([])

    # search notes
    @Slot(str, result=str)
    def search_notes(self, query):
        notes = self.app.db.search_notes(query)
        return json.dumps([model_to_dict(note) for note in notes])