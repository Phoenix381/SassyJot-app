
// ============================================================================
// web channel init
// ============================================================================

var taskController;

var task;
var selected;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    taskController = channel.objects.task_controller;

    // selected task
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    task = taskController.get_task(id).then(t => {
        task = JSON.parse(t);
        taskName.value = task.name;

        selected = taskController.get_current_task().then(t => {
            selected = JSON.parse(t);

            if (selected.id != task.id) {
                selectButton.removeAttribute("hidden");

                // select task click
                selectButton.addEventListener("click", () => {
                    taskController.select_task(task.id).then(() => {
                        selectButton.setAttribute("hidden", true);
                    });
                });
            }
        });

        // init after getting task id
        initSticky();
        initKanban();
    });

    // setting callbacks here
    renameActions();
    modalActions();
});

// ============================================================================
// page elements
// ============================================================================

// kanban
const addColumnButton = document.getElementById("add-column-button");
const columnNameInput = document.getElementById("column-name");
const addColumnModalElement = document.getElementById("addColumnModal");
const addColumnModal = new bootstrap.Modal(addColumnModalElement);
const kanbanContainer = document.getElementById("kanban-container");

// adding task
const taskModal = new bootstrap.Modal(document.getElementById("addTaskModal"));
const taskColor = document.getElementById("task-color");
const columnTaskName = document.getElementById("column-task-name");
const addTaskButton = document.getElementById("add-task-button");

// dashboard rename
const taskName = document.getElementById("task-name");
const selectButton = document.getElementById("select-button");
const renameButton = document.getElementById("rename-button");
const renameOkButton = document.getElementById("rename-ok-button");
const renameCancelButton = document.getElementById("rename-cancel-button");

const stickyArea = document.getElementById("sticky");

// ============================================================================
// rename actions
// ============================================================================
function renameActions() {
    renameButton.addEventListener("click", () => {
        renameButton.setAttribute("hidden", true);
        renameOkButton.removeAttribute("hidden");
        renameCancelButton.removeAttribute("hidden");
        taskName.removeAttribute("disabled");
        taskName.focus();
    });

    renameOkButton.addEventListener("click", () => {
        taskController.rename_task(task.id, taskName.value).then(() => {
            renameOkButton.setAttribute("hidden", true);  
            renameCancelButton.setAttribute("hidden", true);
            taskName.setAttribute("disabled", true);
            renameButton.removeAttribute("hidden");
        });
    });

    renameCancelButton.addEventListener("click", () => {
       renameOkButton.setAttribute("hidden", true); 
       renameCancelButton.setAttribute("hidden", true);
       taskName.value = task.name;
       taskName.setAttribute("disabled", true);
       renameButton.removeAttribute("hidden");
    });
}

// ============================================================================
// modal actions
// ============================================================================

function modalActions() {
    // add column to kanban
    addColumnButton.addEventListener("click", () => {
        let order = columns.length;
        let columnName = columnNameInput.value;
        taskController.create_kanban_column(columnName, order, task.id).then((id) => {
            makeColumn(columnNameInput.value, id);
        });

        addColumnModal.hide();
    });

    // add task to column
    addTaskButton.addEventListener("click", () => {
        // locate column by data-column-id
        let column = columns.find(c => c.getAttribute("data-column-id") == selected_column);
        let order = column.children[1].children.length;
        let name = columnTaskName.value;
        let color = taskColor.value;

        taskController.create_column_task(name, color, task.id, selected_column, order).then((id) => {
            makeTask(columnTaskName.value, selected_column, id);
        });

        taskModal.hide();
    });
}

// ============================================================================
// sticky
// ============================================================================

function initSticky() {
    taskController.get_sticky(task.id).then(text => {
        makeEditor(stickyArea, text, taskController.update_sticky, task.id);
    });
}

// ============================================================================
// kanban
// ============================================================================

// data
var columns = [];
var selected_column;

// predetermined blocks
// column
function makeColumn(name, id) {
    let column = document.createElement("div");
    column.classList.add("kanban-column");
    column.setAttribute("data-column-id", id);

    column_header = document.createElement("div");
    column_header.classList.add("kanban-column-header");

    column_name = document.createElement("div");
    column_name.classList.add("kanban-column-name");
    column_name.innerHTML = name;
    column_header.appendChild(column_name);

    // column actions
    column_menu = document.createElement("div");
    column_menu.classList.add("dropdown");
    menu_button = document.createElement("button");
    menu_button.classList.add("dropdown-toggle");
    menu_button.setAttribute("data-bs-toggle", "dropdown");
    button_icon = document.createElement("i");
    button_icon.classList.add("column-menu");
    button_icon.classList.add("material-symbols");
    button_icon.innerHTML = "menu";
    menu_items = document.createElement("div");
    menu_items.classList.add("dropdown-menu");
    add_task = document.createElement("button");
    add_task.classList.add("dropdown-item");
    add_task.innerHTML = "Add task";

    menu_button.appendChild(button_icon);
    column_menu.appendChild(menu_button);
    column_menu.appendChild(menu_items);
    menu_items.appendChild(add_task);
    column_header.appendChild(column_menu);

    // opening add task modal
    add_task.addEventListener("click", () => {
        selected_column = id;
        columnTaskName.value = "";
        taskModal.show();
    });

    // task containier
    task_container = document.createElement("div");
    task_container.classList.add("kanban-task-container");
    task_container.setAttribute("data-column-id", id);

    column.appendChild(column_header);
    column.appendChild(task_container);

    columns.push(column);
    kanbanContainer.appendChild(column);

    new Sortable(task_container, {
        group: 'shared-items',
        animation: 150,
        draggable: '.kanban-task',
        ghostClass: 'kanban-task-ghost',
        handle: '.kanban-task',
        onEnd: function(e) {
            let from = e.from.getAttribute("data-column-id");
            let to = e.to.getAttribute("data-column-id");
            let oldIndex = e.oldIndex;
            let newIndex = e.newIndex;
            let task_id = e.item.getAttribute("data-task-id");
            if(from != to || oldIndex != newIndex) {
                taskController.move_task(task_id, to, newIndex);
                // console.log("Moved task from", from, "to", to, "oldIndex", oldIndex, "newIndex", newIndex);
            }
            console.log(e);
        }
    });
}

// task inside column
function makeTask(name, column_id, id) {
    let task = document.createElement("div");   
    task.classList.add("kanban-task");
    task.innerHTML = name;
    task.setAttribute("data-task-id", id);

    // locate column by data-column-id
    let column = columns.find(c => c.getAttribute("data-column-id") == column_id);
    column.children[1].appendChild(task);
}

// init funuction
function initKanban() {
    kanbanContainer.innerHTML = "";

    taskController.get_kanban_columns(task.id).then(saved_columns => {
        saved_columns = JSON.parse(saved_columns);
        saved_columns.forEach(column => {
            makeColumn(column.name, column.id);
            
            taskController.get_column_tasks(column.id).then(tasks => {
                tasks = JSON.parse(tasks); 
                tasks.forEach(task => {
                    makeTask(task.name, column.id, task.id);
                });
            });
        });

        new Sortable(kanbanContainer, {
            animation: 150,
            handle: '.kanban-column-header',
            ghostClass: 'kanban-column-ghost',
            filter: '.kanban-task',
            preventOnFilter: false,
            onEnd: function(e) {
                let oldIndex = e.oldIndex;
                let newIndex = e.newIndex;
                let column_index = e.item.getAttribute("data-column-id");
                if(oldIndex != newIndex) {
                    taskController.move_kanban_column(column_index, newIndex);
                    // console.log("Moved column", column_index, "from", oldIndex, "to", newIndex);
                }
            }
        });
    });
}