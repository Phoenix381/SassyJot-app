
// ============================================================================
// web channel init
// ============================================================================

var projectController;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    projectController = channel.objects.project_controller;

    // setting callbacks here
    modalActions();
    loadTasks();
});

// ============================================================================
// page elements
// ============================================================================

const addProjectButton = document.getElementById("add-project-button");

const addProjectModalElement = document.getElementById("addProjectModal");
const addProjectModal = new bootstrap.Modal(addProjectModalElement);
const projectColorInput = document.getElementById("project-color");
const projectNameInput = document.getElementById("project-name");

const tasks = document.getElementById("tasks");

// ============================================================================
// modal actions
// ============================================================================

function modalActions() {
    addProjectButton.addEventListener("click", () => {   
         addProjectModal.hide();
    });
}

// ============================================================================
// tasks
// ============================================================================

// recursively add tasks
function addTasks(target, tasks, level) {
    let task_container = document.createElement("div");
    task_container.classList.add("task-container");
    task_container.style = "padding-left: " + level * 10 + "px";
    task_container.innerHTML = tasks.name;

    if (tasks.children) {
        tasks.children.forEach(task => {
            addTasks(task_container, task, level + 1);
        });
    }

    target.appendChild(task_container);
}

// load tasks to dashboard left pane
function loadTasks() {
    projectController.get_projects_tasks().then(projects => {
        tasks.innerHTML = "";
        let data = JSON.parse(projects);

        // create projects
        data.forEach(project => {
            let proj_container = document.createElement("div");
            proj_container.classList.add("project-container");
            proj_container.innerHTML = project.name;

            // fill with tasks
            project.children.forEach(task => {
               addTasks(proj_container, task, 1);
            });

            tasks.appendChild(proj_container);
        });
    });
}