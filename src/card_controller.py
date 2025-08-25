
from PySide6.QtCore import QObject, Slot
from playhouse.shortcuts import model_to_dict
import json

class CardController(QObject):
    def __init__(self, app):
        super().__init__()
        self.app = app

    # create card
    @Slot(str, str, int, result=str)
    def create_card(self, header, body, parent_id):
        card = self.app.db.create_card(header, body, parent_id)
        return json.dumps(model_to_dict(card))

    # TODO filter by tags

    # get all cards
    @Slot(result=str)
    def get_all_cards(self):
        cards = self.app.db.get_all_cards()
        return json.dumps([model_to_dict(card) for card in cards])

    # get cards for note
    @Slot(int, result=str)
    def get_cards(self, note_id):
        cards = self.app.db.get_cards(note_id)
        return json.dumps([model_to_dict(card) for card in cards])

    # update header by id
    @Slot(str, int)
    def update_card_header(self, header, card_id):
        self.app.db.update_card_header(header, card_id)

    # update body by id
    @Slot(str, int)
    def update_card_body(self, body, card_id):
        self.app.db.update_card_body(body, card_id)