
// ============================================================================
// web channel init
// ============================================================================

var taskController;
var tagController;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    taskController = channel.objects.task_controller;
    tagController = channel.objects.tag_controller;

    // setting callbacks here
    initTags();
    initModalActionss();
});

// ============================================================================
// page elements
// ============================================================================

// modals
const newTagModal = new bootstrap.Modal(document.getElementById("newTagModal"));
const editTagModal = new bootstrap.Modal(document.getElementById("editTagModal"));
const editTagModalElement = document.getElementById("editTagModal");

// table elements
const tagTableHead = document.getElementById("tag-table-head");
const tagRows = document.getElementById("tag-rows");

// new tag modal
const newTagColor = document.getElementById("new-tag-color");
const newTagName = document.getElementById("new-tag-name-input");
const addTagButton = document.getElementById("add-tag-button");

// edit tag modal
const tagColor = document.getElementById("tag-color");
const tagName = document.getElementById("tag-name-input");
const saveTagButton = document.getElementById("save-tag-button");

// ============================================================================
// tag page logic
// ============================================================================

function initTags() {
    tagController.get_tags().then(function(result) {
        let tags = JSON.parse(result);
        for (let el of tags) {
            addTagRow(el);   
        }

        if (tags.length == 0) {
            tagTableHead.setAttribute("hidden", true);
        }
    });
}

function addTagRow(tag) {
    let row = document.createElement("tr");   
    row.setAttribute("tag-id", tag.id);

    let nameContainer = document.createElement("div");
    nameContainer.classList.add("tag-name");

    let color = document.createElement("div");
    color.classList.add("circle");
    color.style.backgroundColor = tag.color;
    let name = document.createElement("div");
    name.innerHTML = tag.name;

    nameContainer.appendChild(color);
    nameContainer.appendChild(name);

    let nameCol = document.createElement("td");
    nameCol.appendChild(nameContainer);

    let statCol = document.createElement("td");
    statCol.innerHTML = "0";

    let actionsCol = document.createElement("td");
    actionsCol.innerHTML = "...";

    row.appendChild(nameCol);
    row.appendChild(statCol);
    row.appendChild(actionsCol);

    tagRows.prepend(row);
}

// ============================================================================
// modals
// ============================================================================

var selected_tag;

function initModalActionss() {
    addTagButton.addEventListener("click", function() {
        tagController.create_tag(newTagName.value, newTagColor.value).then(function(result) {
            let tag = JSON.parse(result);
            addTagRow(tag);

            tagTableHead.removeAttribute("hidden");

            newTagModal.hide();
        });
    });

    editTagModalElement.addEventListener("show.bs.modal", function(event) {
        tagController.get_tag(selected_tag).then(function(result) {
            let tag = JSON.parse(result);
            tagName.value = tag.name;
            tagColor.value = tag.color;
        });
    });

    saveTagButton.onclick = function() {
        
    };
}