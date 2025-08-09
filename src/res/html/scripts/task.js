
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
    });

    // setting callbacks here
    renameActions();
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

const selectButton = document.getElementById("select-button");
const renameButton = document.getElementById("rename-button");
const renameOkButton = document.getElementById("rename-ok-button");
const renameCancelButton = document.getElementById("rename-cancel-button");

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
    addColumnButton.addEventListener("click", () => {
        taskController.create_column(task.id, columnNameInput.value).then(() => {
            // reload

        });

        addColumnModal.hide();
    });
}

