
from peewee import *
from playhouse.shortcuts import model_to_dict
from playhouse.sqlite_ext import *
from datetime import datetime

db = SqliteDatabase("jot.db")

# MODELS
class BaseModel(Model):
    class Meta:
        database = db

class Setting(BaseModel):
    key = CharField(unique=True, primary_key=True)
    value = CharField()

class History(BaseModel):
    url = CharField()
    title = CharField()
    timestamp = DateTimeField()

class Fav(BaseModel):
    url = CharField()
    title = CharField()
    # TODO description etc
    # TODO icon

class Task(BaseModel):
    color = CharField(default="#b8bb26")
    name = CharField()
    parent = ForeignKeyField('self', backref='children', to_field="id", null=True)
    column = DeferredForeignKey('KanbanColumn', backref='tasks', to_field="id", null=True, default=None)
    order = IntegerField(default=0)

    is_completed = BooleanField(default=False)
    completed_at = DateTimeField(null=True, default=None)

    planned = IntegerField(default=0)
    priority = IntegerField(default=1)
    energy = IntegerField(default=1)
    type = IntegerField(default=1)

    # type specific data
    deadline = DateTimeField(null=True, default=None)
    repeat_type = IntegerField(null=True, default=1)
    repeat_value = IntegerField(null=True, default=1)
    repeat_days = JSONField(null=True, default=None)

    # only active tasks
    def get_all_dict(self):
        data = model_to_dict(self)
        children = []
        for child in sorted(self.children, key=lambda x: x.order):
            if child.is_completed:
                continue
            children.append(child.get_all_dict())
        data['children'] = children
        return data

class Spent(BaseModel):
    task = ForeignKeyField(Task, backref='spent', to_field="id")
    date = DateTimeField(default=datetime.now())
    amount = IntegerField()

class KanbanColumn(BaseModel):
    name = CharField()
    order = IntegerField()
    task = ForeignKeyField(Task, backref='columns', to_field="id")
    # visible = BooleanField(default=True)

# tab attached to task
class OpenedLink(BaseModel):
    url = CharField()
    order = IntegerField()
    task = ForeignKeyField(Task, backref='links', to_field="id")

    class Meta:
        primary_key = CompositeKey('task', 'order')

# both for dashboard and task
class StickyNote(BaseModel):
    text = TextField()
    task = ForeignKeyField(Task, backref='notes', to_field="id")

class Note(BaseModel):
    name = CharField(max_length=128)
    text = TextField(default="")
    status = IntegerField()
    # TODO type

class Card(BaseModel):
    header = TextField()
    body = TextField()
    note = ForeignKeyField(Note, backref='cards', to_field="id", null=True, default=None)

# tags here
class Tag(BaseModel):
    name = CharField()
    color = CharField(default="#b8bb26")

# task
class TaskTag(BaseModel):
    task = ForeignKeyField(Task, backref='tags', to_field="id")
    tag = ForeignKeyField(Tag, backref='tasks', to_field="id")

    class Meta:
        primary_key = CompositeKey('task', 'tag')

# note
class NoteTag(BaseModel):
    note = ForeignKeyField(Note, backref='tags', to_field="id")
    tag = ForeignKeyField(Tag, backref='notes', to_field="id")

    class Meta:
        primary_key = CompositeKey('note', 'tag')

# TODO tags sfor files annd maybe cards

# CONTROLLER
class DBController:
    def __init__(self):
        self.db = db

        # init db and tables
        db.connect()
        db.create_tables([
            Setting, History, Fav, 
            Task, KanbanColumn, Spent,
            OpenedLink, StickyNote,
            Note, Card,
            Tag, TaskTag, NoteTag,
        ])

        # check if first run
        try:
            Setting.get(Setting.key == "current")
        except Setting.DoesNotExist:
            # making first project
            print("DB is empty, initializing...")

            # default task
            task = self.create_task({
                'color': "#b8bb26",
                'name': "Default task",
                'parent': None,
            })

            setting = Setting.create(
                key="current",
                value=task.id
            )

    # ====================================================================
    # SETTING
    # ====================================================================

    def get_setting(self, key):
        try:
            return Setting.get(Setting.key == key).value
        except Setting.DoesNotExist:
            print("Setting does not exist: " + key)
            return None

    def set_setting(self, key, value):
        setting = Setting.replace(key=key, value=value).execute()
        # setting.save()

    # ====================================================================
    # TASK
    # ====================================================================

    # using json as input
    def create_task(self, task):
        try:
            task = Task.create(**task)
        except Exception as e:
            print(f"Could not create task: {e = }")
            return None

        # TODO redesign?
        self.create_column("Todo", 0, task.id)
        self.create_column("In progress", 1, task.id)
        self.create_column("Done", 2, task.id)

        return task

    def get_task(self, task_id):
        try:
            return Task.get(Task.id == task_id)
        except Task.DoesNotExist:
            print(f"There is no tasks with {task_id = } in db")
            return None

    def get_top_tasks(self):
        try:
            return list( Task.select().where(
                (Task.parent == None) &
                (Task.is_completed == False)
            ) )
        except Task.DoesNotExist:
            print("There is no tasks in db")
            return None

    def get_column_tasks(self, column_id):
        try:
            return list( Task.select().where(
                (Task.column == column_id) &
                (Task.is_completed == False)
            )
            .order_by(Task.order) )
        except Task.DoesNotExist:
            print(f"There is no tasks in db for {column_id = }")
            return []

    # move task in or between columns
    def move_task(self, task_id, new_column_id, new_order):
        try:
            with self.db.atomic():
                task = Task.get(Task.id == task_id)
                order = task.order
                column_id = task.column_id

                # shift order to remove from list
                query = Task.update(order=Task.order - 1).where(
                    (Task.column == column_id) &
                    (Task.order > order)
                )
                query.execute()

                # shift order to add to list
                query = Task.update(order=Task.order + 1).where(
                    (Task.column == new_column_id) &
                    (Task.order >= new_order)
                )
                query.execute()

                task.column = new_column_id
                task.order = new_order
                task.save()
        except Task.DoesNotExist:
            print(f"Error moving task: {task_id = }")

    # finish task
    # TODO will probably break order
    def finish_task(self, task_id):
        try:
            task = Task.get(Task.id == task_id)
            task.is_completed = True
            task.completed_at = datetime.now()
            task.save()
        except Task.DoesNotExist:
            print(f"Error finishing task: {task_id = }")

    # ====================================================================
    # SPENT
    # ====================================================================
    
    # add record for completed pomodoro
    def spent_time(self, task_id, amount):
        spent = Spent.create(
            task=task_id,
            amount=amount
        )

        return spent

    # get all records for today
    def get_spent_today(self):
        try:
            return list( Spent.select().where(Spent.date >= datetime.now().date()) )
        except Spent.DoesNotExist:
            print("There is no spent in db")
            return []

    # ====================================================================
    # KANBAN COLUMN
    # ====================================================================

    def create_column(self, name, order, task_id):
        column = KanbanColumn.create(
            name=name,
            order=order,
            task=task_id
        )

        return column

    def get_columns(self, task_id):
        try:
            return list( KanbanColumn.select().where(KanbanColumn.task == task_id).order_by(KanbanColumn.order) )
        except KanbanColumn.DoesNotExist:
            print(f"There is no columns in db for {task_id = }")
            return []

    # update column
    def update_column(self, name, order, column_id):
        try:
            column = KanbanColumn.get(KanbanColumn.id == column_id)
            column.name = name
            column.order = order
            column.save()
        except KanbanColumn.DoesNotExist:
            print(f"Trying to update not existing column: {column_id = }")

    # move column to new position
    def move_column(self, column_id, new_order):
        try:
            with self.db.atomic():
                column = KanbanColumn.get(KanbanColumn.id == column_id)

                # shift order to remove from list
                query = KanbanColumn.update(order=KanbanColumn.order - 1).where(
                    (KanbanColumn.task == column.task_id) & 
                    (KanbanColumn.order > column.order)
                )
                query.execute()

                # shift order to add to list
                query = KanbanColumn.update(order=KanbanColumn.order + 1).where(
                    (KanbanColumn.task == column.task_id) &
                    (KanbanColumn.order >= new_order)
                )
                query.execute()

                column.order = new_order
                column.save()
        except KanbanColumn.DoesNotExist:
            print(f"Error moving column: {column_id = }")

    # ====================================================================
    # FAVORITE
    # ====================================================================

    def create_fav(self, url, title):
        fav = Fav.create(
            url=url,
            title=title
        )

    def delete_fav(self, url):
        try:
            fav = Fav.get(Fav.url == url)
            fav.delete_instance()
        except Fav.DoesNotExist:
            print(f"Try to delete not existing fav: {url}")

    # TODO update fav

    def check_fav(self, url):
        try:
            fav = Fav.get(Fav.url == url)
            return 1
        except Fav.DoesNotExist:
            return 0

    # ====================================================================
    # HISTORY
    # ====================================================================

    # TODO

    # ====================================================================
    # OPENED LINK
    # ====================================================================

    # save one link to position
    def save_link(self, url, order, task_id):
        try:
            link = OpenedLink.get(
                (OpenedLink.task == task_id) & 
                (OpenedLink.order == order)
            )
            link.url = url
            link.save()
        except:
            try:
                link = OpenedLink.create(
                    url=url,
                    order=order,
                    task=task_id
                )
                link.save()
            except:
                print(f"Failed to save link {url} to task {task_id}")

    # delete on position for task
    def delete_link(self, order, task_id):
        try:
            with self.db.atomic():
                link = OpenedLink.get(
                    (OpenedLink.task == task_id) & 
                    (OpenedLink.order == order)
                )
                link.delete_instance()

                # shift with order higher than deleted
                query = OpenedLink.update(order=OpenedLink.order - 1).where(
                    (OpenedLink.task == task_id) & 
                    (OpenedLink.order > order)
                )
                shift_count = query.execute()
        except OpenedLink.DoesNotExist:
            print(f"Trying to delete not existing link: {task_id = } and {order = }")

    # get all tabs for task
    def get_links(self, task_id):
        try:
            return list( OpenedLink.select().where(OpenedLink.task == task_id) )
        except OpenedLink.DoesNotExist:
            print(f"There is no links in db for {task_id = }")
            return []

    # ====================================================================
    # STICKY NOTE
    # ====================================================================

    # initial load
    def get_sticky_note(self, task_id):
        try:
            note = StickyNote.get(StickyNote.task == task_id)
            return note.text
        except StickyNote.DoesNotExist:
            try:
                note = StickyNote.create(
                    text="",
                    task=task_id
                )

                return ""
            except:
                print(f"There is no note in db for {task_id = }")
                return ""

    # save changes
    def update_note(self, text, task_id):
        try:
            note = StickyNote.get(StickyNote.task == task_id)
            note.text = text
            note.save()
        except StickyNote.DoesNotExist:
            print(f"Failed to save note {text} to task {task_id}")

    # ====================================================================
    # NOTE
    # ====================================================================

    def create_note(self, name, status):
        try:
            note = Note.create(
                name=name,
                status=status
            )

            return note
        except:
            print(f"Failed to save note {name}")
            return None

    def get_notes(self):
        try:
            return list( Note.select() )
        except Note.DoesNotExist:
            print("There is no notes in db")
            return None

    def get_note(self, note_id):
        try:
            return Note.get(Note.id == note_id)
        except Note.DoesNotExist:
            print(f"Failed to get note id {note_id}")
            return None

    # can`t merge because of editor callback
    def update_note_text(self, text, note_id):
        try:
            note = Note.get(Note.id == note_id)
            note.text = text
            note.save()
            return note
        except StickyNote.DoesNotExist:
            print(f"Failed to update note id {note_id}")
            return None

    def update_note_status(self, status, note_id):
        try:
            note = Note.get(Note.id == note_id)
            note.status = status
            note.save()
            return note
        except StickyNote.DoesNotExist:
            print(f"Failed to update note id {note_id}")
            return None

    def update_note_name(self, name, note_id):
        try:
            note = Note.get(Note.id == note_id)
            note.name = name
            note.save()
            return note
        except StickyNote.DoesNotExist:
            print(f"Failed to update note id {note_id}")
            return None

    def search_notes(self, query):
        try:
            return list( Note.select().where(Note.name.contains(query)) )
        except Note.DoesNotExist:
            print("There is no notes in db")
            return None

    # ====================================================================
    # CARD
    # ====================================================================

    # get card by id
    def get_card(self, card_id):
        try:
            return Card.get(Card.id == card_id)
        except Card.DoesNotExist:
            print("There is no card in db")
            return None

    # get all cards
    def get_all_cards(self):
        try:
            return list( Card.select() )
        except Card.DoesNotExist:
            print("There is no cards in db")
            return None

    # get cards for note
    def get_cards(self, note_id):
        try:
            return list( Card.select().where(Card.note == note_id) )
        except Card.DoesNotExist:
            print("There is no cards in db")
            return None

    # TODO get filtered by tags

    # create card
    def create_card(self, header, body, note_id):
        if note_id == 0:
            note_id = None

        try:
            card = Card.create(
                header=header,
                body=body,
                note=note_id
            )
            card.save()
            return card
        except:
            print(f"Failed to save card {name}")
            return None

    # can`t merge because of editor callback
    # update card header
    def update_card_header(self, header, card_id):
        try:
            card = Card.get(Card.id == card_id)
            card.header = header
            card.save()
            return card
        except Card.DoesNotExist:
            print(f"Failed to update card id {card_id}")
            return None

    # update card body
    def update_card_body(self, body, card_id):
        try:
            card = Card.get(Card.id == card_id)
            card.body = body
            card.save()
            return card
        except Card.DoesNotExist:
            print(f"Failed to update card id {card_id}")
            return None

    # ====================================================================
    # TAG
    # ====================================================================

    # create tag
    def create_tag(self, name, color):
        try:
            tag = Tag.create(
                name=name,
                color=color
            )

            return tag
        except:
            print(f"Failed to save tag {name}")
            return None

    # get all tags
    def get_tags(self):
        try:
            return list( Tag.select() )
        except Tag.DoesNotExist:
            print("There is no tags in db")
            return None

    # get tag by id
    # TODO remove?
    def get_tag(self, tag_id):
        try:
            return Tag.get(Tag.id == tag_id)
        except Tag.DoesNotExist:
            print("There is no tag in db")
            return None

    # update tag by id
    def update_tag(self, name, color, tag_id):
        try:
            tag = Tag.get(Tag.id == tag_id)
            tag.name = name
            tag.color = color
            tag.save()
            return tag
        except Tag.DoesNotExist:
            print(f"Failed to update tag id {tag_id}")
            return None

    # ====================================================================
    # TASK TAG
    # ====================================================================

    def create_task_tag(self, task_id, tag_id):
        try:
            task_tag = TaskTag.create(
                task=task_id,
                tag=tag_id
            )

            return task_tag
        except:
            print(f"Failed to save task tag: {task_id=} and {tag_id=}")
            return None

    def get_task_tags(self, task_id):
        try:
            return list( TaskTag.select().where(TaskTag.task == task_id) )
        except TaskTag.DoesNotExist:
            print(f"There is no tags for task {task_id}")
            return None

    def delete_task_tag(self, task_id, tag_id):
        try:
            task_tag = TaskTag.get((TaskTag.task == task_id) & (TaskTag.tag == tag_id))
            task_tag.delete_instance()
        except TaskTag.DoesNotExist:
            print(f"Try to delete not existing task tag: {task_id = } and {tag_id = }")

    # ====================================================================
    # NOTE TAG
    # ====================================================================