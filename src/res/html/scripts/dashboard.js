
// ============================================================================
// web channel init
// ============================================================================

var taskController;
var tagController;
var fileController;

var task_id;
var task;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    taskController = channel.objects.task_controller;
    tagController = channel.objects.tag_controller;
    fileController = channel.objects.file_controller;

    // selected task
    const urlParams = new URLSearchParams(window.location.search);
    task_id = urlParams.get('task_id');

    task = taskController.get_current_task().then(t => {
        task = JSON.parse(t);
        taskName.innerHTML = task.name;
        task_id = task.id;
    });

    // setting callbacks here
    modalActions();
    loadTasks();
    initSticky();
    initTagInput();
});

// ============================================================================
// page elements
// ============================================================================

const addTaskButton = document.getElementById("add-task-button");

const addTaskModalElement = document.getElementById("addTaskModal");
const addTaskModal = new bootstrap.Modal(addTaskModalElement);

// task input
const taskNameInput = document.getElementById("task-name-input");
const taskColor = document.getElementById("task-color");
const plannedInput = document.getElementById("planned-input");
// priority, energy, type radio got by selector
const taskNormal = document.getElementById("task-normal");
const taskDeadline = document.getElementById("task-deadline");
const taskRepeating = document.getElementById("task-repeating");
const deadlineInput = document.getElementById("deadline-input");
const repeatingSpecific = document.getElementById("repeating-specific");
const repeatType = document.getElementById("repeat-type");
const repeattValue = document.getElementById("repeat-value");
// TODO days

// dashboard top part
const taskName = document.getElementById("task-name");

const tasksContainer = document.getElementById("tasks");
const stickyArea = document.getElementById("sticky");

// tag input
const tagInputContainer = document.getElementById("tag-input-container");
const tagsContainer = document.getElementById("tags-container");
const tagInput = document.getElementById("tag-input");
const tagSuggestions = document.getElementById("tag-suggestions");

// ============================================================================
// modal actions
// ============================================================================

function modalActions() {
    new AirDatepicker('#deadline-input', {
        timepicker: true,
        timeFormat: 'HH:MM'
    });

    addTaskButton.addEventListener("click", () => {
        let tags = JSON.stringify(selectedTags);

        // get priority, energy, type from radio buttons
        let priority = document.querySelector('input[name=priority]:checked').value;
        let energy = document.querySelector('input[name=energy]:checked').value;
        let taskType = document.querySelector('input[name=type]:checked').value;

        if(taskType == '3') {
            // TODO convert repeat days to array
            days = [];
        }

        let updated = {
            color: taskColor.value,
            name: taskNameInput.value,
            planned: plannedInput.value,
            priority: priority,
            energy: energy,
            type: taskType,
            // tags?
            deadline: taskType == '2' ? deadlineInput.value : null,
            repeat_type: taskType == '3' ? repeatType.value : null,
            repeat_value: taskType == '3' ? repeatValue.value : null,
            repeat_days: taskType == '3' ? days : null
        };        

        // add task
        let payload = JSON.stringify(updated);
        taskController.create_task(payload).then(result => {
            console.log(result);
            if (result == '') {
                // TODO error check
                return;
            }

            let new_task = JSON.parse(result);

            taskName.innerHTML = new_task.value;
            task_id = new_task.id;

            loadTasks();
            addTaskModal.hide();

            // add tags to task
            for (let tag of selectedTags) {
                tagController.add_tag_to_task(task_id, tag.id);
            }
        });

    });

    taskNormal.addEventListener("change", (e) => {
        if (e.target.checked) {
            deadlineInput.style.display = "none";
            repeatingSpecific.style.display = "none";
        }
    });

    taskDeadline.addEventListener("change", (e) => {
        if (e.target.checked) { 
            deadlineInput.style.display = "flex";
            repeatingSpecific.style.display = "none";
        }
    });

    taskRepeating.addEventListener("change", (e) => {
        if (e.target.checked) { 
            deadlineInput.style.display = "none";
            repeatingSpecific.style.display = "flex";
        }
    });

    addTaskModalElement.addEventListener("hidden.bs.modal", () => {
        let defaultType = document.getElementById("task-normal").checked = true;
        deadlineInput.style.display = "none";
        repeatingSpecific.style.display = "none";
    });
}

// ============================================================================
// tasks
// ============================================================================

// recursively add tasks
function addTasks(target, tasks, level) {
    tasks.forEach(task => {
        // add to DOM
        let task_container = document.createElement("div");
        task_container.classList.add("task-container");
        task_container.style = "padding-left: " + level * 20 + "px";

        let task_color = document.createElement("div");
        task_color.classList.add("task-color");
        task_color.style.backgroundColor = task.color;
        task_container.appendChild(task_color);

        let task_link = document.createElement("a");
        task_link.setAttribute("href", "task.html?id="+task.id);
        if (task.id == task_id) {
            task_link.classList.add("selected");
            task_link.classList.add("selected-task");
        }
        task_link.innerHTML = task.name;
        task_container.appendChild(task_link);

        target.appendChild(task_container);

        // same for children
        if (task.children) {
            addTasks(target, task.children, level + 1);
        }
    });
}

// load tasks to dashboard left pane
function loadTasks() {
    taskController.get_task_tree().then(tasks => {
        tasksContainer.innerHTML = "";
        let data = JSON.parse(tasks);

        addTasks(tasksContainer, data, 0);
    });
}

// ============================================================================
// sticky
// ============================================================================

function initSticky() {
    taskController.get_sticky(0).then(text => {
        makeEditor(stickyArea, text, taskController.update_sticky, 0, fileController);
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
}

function addTag(tag) {
    if (selectedTags.some(t => t.id == tag.id)) {   
        return;
    }

    selectedTags.push(tag);
    renderTags();
}

function removeTag(id) {
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
            <span class="tag-remove" data-id="${tag.id}">×</span>
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
}