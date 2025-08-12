
// ============================================================================
// web channel init
// ============================================================================

var taskController;

var task_id;
var task;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    taskController = channel.objects.task_controller;

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
});

// ============================================================================
// page elements
// ============================================================================

const addTaskButton = document.getElementById("add-task-button");

const addTaskModalElement = document.getElementById("addTaskModal");
const addTaskModal = new bootstrap.Modal(addTaskModalElement);
const taskColorInput = document.getElementById("task-color");
const taskNameInput = document.getElementById("task-name-input");

const tasksContainer = document.getElementById("tasks");

const taskName = document.getElementById("task-name");

const stickyArea = document.getElementById("sticky");

// ============================================================================
// modal actions
// ============================================================================

function modalActions() {
    addTaskButton.addEventListener("click", () => {
        taskController.create_task(taskNameInput.value, taskColorInput.value, 0).then(id => {
            taskName.innerHTML = taskNameInput.value;
            task_id = id;

            task = taskController.get_task(id).then(t => {
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
        console.log(text);
        stickyArea.value = text;
    });

    // debounce function
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // updating sticky
    const handleInput = debounce(function(value) {
        taskController.update_sticky(value, 0);
    }, 2000);

    // processing input
    stickyArea.addEventListener('input', function() {
        handleInput(this.value);
    });

    // losing focus
    stickyArea.addEventListener('blur', function() {
        taskController.update_sticky(this.value, 0);
    });
}