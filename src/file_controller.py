
from peewee import *
from PySide6.QtCore import QObject, Slot
from playhouse.shortcuts import model_to_dict
import json

db = SqliteDatabase("files.db")

# MODELS
class BaseModel(Model):
    class Meta:
        database = db

class Image(BaseModel):
    data = BlobField()

# CONTROLLER
class FileController(QObject):
    def __init__(self, app):
        super().__init__()
        self.app = app

        self.db = db

        # init db and tables
        db.connect()
        db.create_tables([
            Image,
        ])

    # ====================================================================
    # IMAGE
    # ====================================================================

    # TODO pass callbacks to editor

    # saving base64 image
    @Slot(str)
    def save_image(self, data):
        # convert base64 to blob
        pass

        # save image
        image = Image(data=data)
        image.save()

    # get base64 image by id
    @Slot(int, result=str)
    def load_image(self, id):
        image = Image.get(id=id)

        # convert blob to base64
        pass

        return json.dumps(model_to_dict(image))