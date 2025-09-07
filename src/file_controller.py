
from peewee import *
from PySide6.QtCore import QObject, Slot
from playhouse.shortcuts import model_to_dict
import json
import base64

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

    # saving base64 image
    @Slot(str, result=str)
    def save_image(self, data):
        if data.startswith('data:image/webp;base64,'):
            converted_data = data.replace('data:image/webp;base64,', '')
        else:
            return json.dumps({'error': 'Invalid base64 data'})

        # convert base64 to blob
        try:
            converted_data = base64.b64decode(converted_data)
        except Exception as e:
            raise ValueError(f"Invalid base64 data: {e}")
            return json.dumps({'error': 'Invalid base64 data'})

        # save image
        image = Image(data=converted_data)
        image.save()

        return json.dumps({'id': image.id, 'base64': data})

    # get base64 image by id
    @Slot(int, result=str)
    def load_image(self, id):
        image = Image.get(id=id)

        # convert blob to base64
        try:
            data = base64.b64encode(image.blob_data).decode('utf-8')
            mime_type = f"image/{image_format.lower()}"
            data_url = f"data:{mime_type};base64,{data}"
        except Exception as e:
            raise ValueError(f"Invalid base64 data: {e}")
            return json.dumps({'error': 'Invalid base64 data'})

        return json.dumps({'id': id, 'base64': data_url})