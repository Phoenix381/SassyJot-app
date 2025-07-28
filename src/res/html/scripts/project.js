

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

    proj = projectController.get_project(id).then(project => {
        proj = JSON.parse(project);
        projName.value = proj.name;
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

const projName = document.getElementById("project-name");

// ============================================================================
// modal actions
// ============================================================================

function modalActions() {
    addColumnButton.addEventListener("click", () => {
        projectController.create_proj_column(proj.id, columnNameInput.value).then(() => {
            // reload

        });

        addColumnModal.hide();
    });
}

