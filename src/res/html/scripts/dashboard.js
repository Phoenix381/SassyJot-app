
// ============================================================================
// web channel init
// ============================================================================

var projectController;

var proj_id;
var task_id;

var task;
var proj;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    projectController = channel.objects.project_controller;

    // selected task
    const urlParams = new URLSearchParams(window.location.search);
    proj_id = urlParams.get('proj_id');
    task_id = urlParams.get('task_id');

    proj = projectController.get_project(proj_id).then(project => {
        proj = JSON.parse(project);
        projName.innerHTML = proj.name;
    });

    task = projectController.get_task(task_id).then(t => {
        task = JSON.parse(t);
        taskName.innerHTML = task.name;
    });

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

const projName = document.getElementById("projectName");
const taskName = document.getElementById("taskName");

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
    task_container.style = "padding-left: " + level * 20 + "px";

    task_link = document.createElement("a");
    task_link.setAttribute("href", "task.html?id="+tasks.id);
    if (tasks.id == proj_id) {
        task_link.classList.add("selected");
        task_link.classList.add("selected-task");
    }
    task_link.innerHTML = tasks.name;
    task_container.appendChild(task_link);

    target.appendChild(task_container);

    if (tasks.children) {
        tasks.children.forEach(task => {
            addTasks(target, task, level + 1);
        });
    }
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

            project_link = document.createElement("a");
            project_link.setAttribute("href", "project.html?id="+project.id);
            if (project.id == proj_id)
                project_link.classList.add("selected");
            project_link.innerHTML = project.name;
            proj_container.appendChild(project_link);

            // fill with tasks
            project.children.forEach(task => {
               addTasks(proj_container, task, 1);
            });

            tasks.appendChild(proj_container);
        });
    });
}