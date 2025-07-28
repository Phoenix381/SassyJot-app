
// ============================================================================
// web channel init
// ============================================================================

var projectController;

var task_id;
var task;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    projectController = channel.objects.project_controller;

    // selected task
    const urlParams = new URLSearchParams(window.location.search);
    task_id = urlParams.get('task_id');

    task = projectController.get_current_task().then(t => {
        task = JSON.parse(t);
        taskName.innerHTML = task.name;
        task_id = task.id;
    });

    // setting callbacks here
    modalActions();
    loadTasks();
});

// ============================================================================
// page elements
// ============================================================================

const addTaskButton = document.getElementById("add-task-button");

const addTaskModalElement = document.getElementById("addTaskModal");
const addTaskModal = new bootstrap.Modal(addTaskModalElement);
const taskColorInput = document.getElementById("task-color");
const taskNameInput = document.getElementById("task-name");

const tasks = document.getElementById("tasks");

const taskName = document.getElementById("taskName");

// ============================================================================
// modal actions
// ============================================================================

function modalActions() {
    addTaskButton.addEventListener("click", () => {
        projectController.create_task(taskNameInput.value, taskColorInput.value, 0).then(id => {
            taskName.innerHTML = taskNameInput.value;
            task_id = id;

            task = projectController.get_task(id).then(t => {
                task = JSON.parse(t);
                taskName.innerHTML = task.name;
            });

            loadTasks();
            addTaskModal.hide();
        });


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

        task_link = document.createElement("a");
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
    projectController.get_task_tree().then(projects => {
        tasks.innerHTML = "";
        let data = JSON.parse(projects);

        addTasks(tasks, data, 0);
    });
}