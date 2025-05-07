
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
});

// ============================================================================
// page elements
// ============================================================================

const addProjectButton = document.getElementById("add-project-button");

const addProjectModalElement = document.getElementById("addProjectModal");
const addProjectModal = new bootstrap.Modal(addProjectModalElement);
const projectColorInput = document.getElementById("project-color");
const projectNameInput = document.getElementById("project-name");


// ============================================================================
// modal actions
// ============================================================================

function modalActions() {
    addProjectButton.addEventListener("click", () => {   
         addProjectModal.hide();
    });
}
