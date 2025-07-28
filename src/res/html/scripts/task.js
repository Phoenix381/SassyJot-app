
// ============================================================================
// web channel init
// ============================================================================

var projectController;

var task;
var proj;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    projectController = channel.objects.project_controller;

    // selected task
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');



    task = projectController.get_task(id).then(t => {
        task = JSON.parse(t);
        taskName.value = task.name;

        proj = projectController.get_project(task.project.id).then(project => {
            proj = JSON.parse(project);
        });
    });

    // setting callbacks here
    modalActions();
});

// ============================================================================
// page elements
// ============================================================================

const addColumnButton = document.getElementById("add-column-button");
const columnNameInput = document.getElementById("column-name");
const addColumnModalElement = document.getElementById("addColumnModal");
const addColumnModal = new bootstrap.Modal(addColumnModalElement);

const taskName = document.getElementById("task-name");

// ============================================================================
// modal actions
// ============================================================================

function modalActions() {
    addColumnButton.addEventListener("click", () => {
        projectController.create_column(task.id, columnNameInput.value).then(() => {
            // reload

        });

        addColumnModal.hide();
    });
}

