
// ============================================================================
// web channel init
// ============================================================================

var taskController;
var tagController;
var fileController;

var task;
var selected;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    taskController = channel.objects.task_controller;
    tagController = channel.objects.tag_controller;
    fileController = channel.objects.file_controller;

    // selected task
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    task = taskController.get_task(id).then(t => {
        task = JSON.parse(t);

        // init task data
        currentTaskName.value = task.name;
        currentTaskColor.value = task.color;
        currentPlannedTime.value = task.planned;

        currentPriority.value = task.priority;
        currentEnergyLevel.value = task.energy;
        currentTaskType.value = task.type;
        currentTaskType.dispatchEvent(new Event('change'));

        currentDeadline.value = task.deadline;
        currentRepeatType.value = task.repeat_type;
        currentRepeatValue.value = task.repeat_value;

        // TODO days

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
        initTagInput();
    });

    // setting callbacks here
    taskActions();
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

// TODO add task tag input

// edit task
const currentTaskColor = document.getElementById("current-task-color");
const currentTaskName = document.getElementById("current-task-name");
const currentPlannedTime = document.getElementById("current-planned-time");
const currentPriority = document.getElementById("current-priority");
const currentEnergyLevel = document.getElementById("current-energy-level");
const currentTaskType = document.getElementById("current-task-type");
const currentDeadline = document.getElementById("current-deadline");
const currentRepeatType = document.getElementById("current-repeat-type");
const currentRepeatValue = document.getElementById("current-repeat-value");
// TODO days checkboxes

const deadlineSpecific = document.getElementById("deadline-specific");
const repeatingSpecific = document.getElementById("repeating-specific");

const settingsButton = document.getElementById("settings-button");
const editConfirmation = document.getElementById("edit-confirmation");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");

const finishButton = document.getElementById("finish-button");
const selectButton = document.getElementById("select-button");

// current task tag input
const tagInputContainer = document.getElementById("tag-input-container");
const tagsContainer = document.getElementById("tags-container");
const tagInput = document.getElementById("tag-input");
const tagSuggestions = document.getElementById("tag-suggestions");

const stickyArea = document.getElementById("sticky");

// ============================================================================
// task header actions
// ============================================================================

// editing status
let editing = false;

function taskActions() {
    // init datepicker
    new AirDatepicker('#current-deadline', {
        timepicker: true,
        timeFormat: 'HH:MM'
    });

    // enter edit mode
    settingsButton.addEventListener("click", () => {
        editing = true;

        settingsButton.style.display = "none";
        editConfirmation.style.display = "flex";

        // enable elements
        let controls = document.getElementsByClassName("task-value");
        for (let el of controls) {
            el.removeAttribute("disabled");
        }

        // enable tag removal
        let tags = document.getElementsByClassName("tag-remove");
        for (let el of tags) {
            el.style.display = "flex";
        }

        tagInput.style.display = "block";
    });

    // cancel edit mode
    cancelButton.addEventListener("click", () => {
        editing = false;

        settingsButton.style.display = "flex";
        editConfirmation.style.display = "none";

        // disable elements
        let controls = document.getElementsByClassName("task-value");
        for (let el of controls) {
            el.setAttribute("disabled", true);
        }

        // disable tag removal
        let tags = document.getElementsByClassName("tag-remove");
        for (let el of tags) {
            el.style.display = "none";
        }

        // TODO undo tag changes?

        tagInput.style.display = "none";
        tagInput.value = "";
    });

    // save edit mode
    saveButton.addEventListener("click", () => {
        editing = false;

        settingsButton.style.display = "flex";
        editConfirmation.style.display = "none";

        // save changes
        updateTask();

        // disable elements
        let controls = document.getElementsByClassName("task-value");
        for (let el of controls) {
            el.setAttribute("disabled", true);
        }

        // disable tag removal
        let tags = document.getElementsByClassName("tag-remove");
        for (let el of tags) {
            el.style.display = "none";
        }

        tagInput.style.display = "none";
        tagInput.value = "";
    });

    // updating task type
    currentTaskType.addEventListener("change", (e) => {
        switch (e.target.value) {
            case "1":
                deadlineSpecific.style.display = "none";
                repeatingSpecific.style.display = "none";
                break;
            case "2":
                deadlineSpecific.style.display = "flex";
                repeatingSpecific.style.display = "none";
                break;
            case "3":
                deadlineSpecific.style.display = "none";
                repeatingSpecific.style.display = "flex";
                break;
        }
    });

    // task update function
    function updateTask() {
        if(currentTaskType.value == '3') {
            // TODO convert repeat days to array
            days = [];
        }

        let updated = {
            id: task.id,
            color: currentTaskColor.value,
            name: currentTaskName.value,
            planned: currentPlannedTime.value,
            priority: currentPriority.value,
            energy: currentEnergyLevel.value,
            type: currentTaskType.value,
            // tags?
            deadline: currentTaskType.value == '2' ? currentDeadline.value : null,
            repeat_type: currentTaskType.value == '3' ? currentRepeatType.value : null,
            repeat_value: currentTaskType.value == '3' ? currentRepeatValue.value : null,
            repeat_days: currentTaskType.value == '3' ? days : null
        };

        let payload = JSON.stringify(updated);
        taskController.update_task(payload).then(() => {
           task = updated;
        });
    }
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
        makeEditor(stickyArea, text, taskController.update_sticky, task.id, fileController);
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

// ============================================================================
// tag input
// ============================================================================

var tagList = [];
var selectedTags = [];

function initTagInput() {
    tagController.get_tags().then(result => {
        tagList = JSON.parse(result);
    });

    // init selected
    tagController.get_task_tags(task.id).then(result => {
        taskTags = JSON.parse(result);

        taskTags.forEach(tag => {
            selectedTags.push(tag.tag);
        });

        renderTags();
    });

    // tag input
    tagInput.addEventListener("input", () => {
        const val = tagInput.value.toLowerCase().trim();
        tagSuggestions.innerHTML = "";

        if (val === "") {
            tagSuggestions.style.display = "none";
            return;
        }

        // searching for tag in list
        const filteredTags = tagList.filter(tag => 
            tag.name.toLowerCase().includes(val) &&
            !selectedTags.some(t => t.id == tag.id)
        );

        if (filteredTags.length === 0) {
            tagSuggestions.style.display = "none";
            return;
        }

        // adding to results
        filteredTags.forEach(tag => {
            let row = document.createElement("div");
            row.className = "search-result";
            row.innerHTML = `
                <span class="tag-preview" style="background: ${tag.color}"></span>
                ${tag.name}
            `;

            // add tag logic
            row.addEventListener("click", () => {
                addTag(tag);
                tagInput.value = "";
                tagSuggestions.style.display = "none";
            });

            tagSuggestions.appendChild(row);
        });

        // if found
        tagSuggestions.style.display = "block";
    });

    renderTags();
}

function addTag(tag) {
    if (selectedTags.some(t => t.id == tag.id)) {   
        return;
    }

    // saving to db
    tagController.add_tag_to_task(task.id, tag.id);

    // adding to list
    selectedTags.push(tag);
    renderTags();
}

function removeTag(id) {
    // removing from db
    tagController.remove_tag_from_task(task.id, id);

    // removing from list
    selectedTags = selectedTags.filter(t => t.id != id);   
    renderTags();
}

function renderTags() {
    tagsContainer.innerHTML = "";

    // adding selected tags to container
    selectedTags.forEach(tag => {
        const tagElement = document.createElement("div");
        tagElement.className = "tag";
        tagElement.style.backgroundColor = tag.color;
        tagElement.innerHTML = `
            ${tag.name}
            <span 
                class="tag-remove" data-id="${tag.id}"
                ${editing ? "" : "style=display:none"}
            >×</span>
        `;

        tagsContainer.appendChild(tagElement);
    });

    // remove tag events
    tagsContainer.querySelectorAll(".tag-remove").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id"); 
            removeTag(id);
        });
    });

    // empty tags
    if (selectedTags.length == 0) {
        tagsContainer.innerHTML = "No tags";
    }
}