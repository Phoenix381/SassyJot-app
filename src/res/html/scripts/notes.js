
// ============================================================================
// web channel init
// ============================================================================

var noteController;
var cardController;

// data arrays
var nodes_initial = [];
var links_initial = [];

// currently selected node
var selected_note_id = null;
var selected_card_id = null;

// editors
var noteEditor = null;

var cardHeadEditor = null;
var cardBodyEditor = null;
var newCardHeadEditor = null;
var newCardBodyEditor = null;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    noteController = channel.objects.note_controller;
    cardController = channel.objects.card_controller;

    noteController.get_notes().then(result => {
        nodes_initial = JSON.parse(result);

        noteController.get_links().then(result => {
            links_initial = JSON.parse(result);

            drawGraph();
        });
    });

    // setting callbacks here
    initNoteControls();
    initCardControls();
});

// ============================================================================
// page elements
// ============================================================================

const graph = document.getElementById("graph-container");
const controlledElements = document.getElementsByClassName("controls-visibility");

// modals
const newNoteModal = new bootstrap.Modal(document.getElementById("newNoteModal"));
const editCardsModal = new bootstrap.Modal(document.getElementById("editCardsModal"));
const editCardsModalElement = document.getElementById("editCardsModal");
const newCardModal = new bootstrap.Modal(document.getElementById("newCardModal"));
const newCardModalElement = document.getElementById("newCardModal");

// note controls
const newSelectedStatus = document.getElementById("new-selected-status");
const noteNameInput = document.getElementById("note-name-input");
const addNoteButton = document.getElementById("add-note-button");

const renameButton = document.getElementById("rename-button");
const renameOkButton = document.getElementById("rename-ok-button");
const renameCancelButton = document.getElementById("rename-cancel-button");

const noteText = document.getElementById("note-text");
const noteName = document.getElementById("note-name");
const selectedStatus = document.getElementById("selected-status");

// card controls
const closeEditorButton = document.getElementById("closeEditorButton");
const newCardHeader = document.getElementById("new-card-header");
const newCardBody = document.getElementById("new-card-body");
const newCardButton = document.getElementById("newCardButton");

const cardList = document.getElementById("card-list");


// ============================================================================
// note controls
// ============================================================================

function addNote(note) {
    // TODO redraw graph
}

function initNoteControls() {
    addNoteButton.addEventListener("click", () => {
        let status = newSelectedStatus.value; 
        let name = noteNameInput.value;

        noteController.create_note(name, status).then(result => {
            let note = JSON.parse(result);
            addNote(note);

            newNoteModal.hide();
        });
    });

    renameButton.addEventListener("click", () => {
        renameButton.setAttribute("hidden", true);
        renameOkButton.removeAttribute("hidden");
        renameCancelButton.removeAttribute("hidden");
        noteName.removeAttribute("disabled");
        noteName.focus();
    });

    renameOkButton.addEventListener("click", () => {
        noteController.update_note_name(noteName.value, selected_note_id).then(() => {
            renameOkButton.setAttribute("hidden", true);  
            renameCancelButton.setAttribute("hidden", true);
            noteName.setAttribute("disabled", true);
            renameButton.removeAttribute("hidden");
        });
    });

    renameCancelButton.addEventListener("click", () => {
        renameOkButton.setAttribute("hidden", true); 
        renameCancelButton.setAttribute("hidden", true);
        noteName.value = task.name;
        noteName.setAttribute("disabled", true);
        renameButton.removeAttribute("hidden");
    });

    selectedStatus.addEventListener("change", (e) => {
        noteController.update_note_status(e.target.value, selected_note_id).then(() => {
            // TODO recolor on graph
        });
    });
}

function selectNote(id, name, text, status) {
    for (const element of controlledElements) {
        element.style.display = 'flex'; 
    }

    selected_note_id = id;
    noteName.value = name;
    selectedStatus.value = status;

    if(!noteEditor) {
        noteEditor = makeEditor(noteText, text, noteController.update_note_text, id);
    }

    noteEditor.setSource(text);
    noteEditor.setId(id);
}

// ============================================================================
// card controls
// ============================================================================

function initCardControls() {
    newCardHeadEditor = makeEditor(newCardHeader, "", null, null);
    newCardBodyEditor = makeEditor(newCardBody, "", null, null);

    closeEditorButton.addEventListener("click", () => {
        editCardsModal.hide();
    });

    newCardModalElement.addEventListener("show.bs.modal", () => {
        editCardsModalElement.classList.add("darken-modal");
    });

    newCardModalElement.addEventListener("hide.bs.modal", () => {
        editCardsModalElement.classList.remove("darken-modal");
    });

    editCardsModalElement.addEventListener("show.bs.modal", () => {
        cardController.get_cards(selected_note_id).then(result => {
            let cards = JSON.parse(result);

            cardList.innerHTML = "";

            cards.forEach(card => {
                addCard(card.id, card.header);
            });
        });
    });

    newCardButton.addEventListener("click", () => {
        let header = newCardHeadEditor.getSource();
        let body = newCardBodyEditor.getSource();

        cardController.create_card(header, body, selected_note_id).then(result => {
            // TODO add to list etc
        });

        newCardModal.hide();
    });
}

function addCard(id, head) {
    let cardElement = document.createElement("div");
    cardElement.classList.add("card-element");
    cardElement.setAttribute("id", id);
    cardElement.innerHTML = head;

    cardList.appendChild(cardElement);
    cardElement.addEventListener("click", () => {
        selectCard(id);
    });
}

function selectCard(id) {
    console.log(id);
}

// ============================================================================
// graph
// ============================================================================

function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}

function drawGraph() {
    let width = graph.offsetWidth;
    let height = graph.offsetHeight;

    // reset canvas
    graph.innerHTML = "";

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const textColor = window.getComputedStyle(document.body).getPropertyValue('--text-secondary');

    // Copying for mutation
    const nodes = nodes_initial.map(d => ({...d}));
    const links = links_initial.map(d => ({...d}));

    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

    // Create an SVG element.
    const svg = d3.select("#graph-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
        }));

    // Create a container for all zoomable elements
    const container = svg.append("g");

    // Add a line for each link, and a circle for each node.
    const link = container.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 2)
        // .attr("stroke-width", d => Math.sqrt(d.value))
        .selectAll()
        .data(links)
        .join("line");

    // Create node groups.
    const node = container.append("g")
      // .attr("stroke", "#fff")
      // .attr("stroke-width", 1.5)
        .attr("class", "node")
        .selectAll("g")
        .data(nodes)
        .join("g");

    // Node palette
    let palette = {
        1 : "#D79921",
        2 : "#CC241D",
        3 : "#98971A",
    }

    // Add a circle for each node.
    node.append("circle")
        .attr("r", 8)
        .attr("fill", d => palette[d.status]);

    // Add id labels for each node.
    node.append("text")
        .attr("fill", textColor)
        .attr("dy", 24)
        .attr("text-anchor", "middle")
        .text(d => d.name);

    // Add drag behaviors to each node.
    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Set the position attributes of links and nodes each time the simulation ticks.
    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    }

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event) {
        event.subject.fx = clamp(event.x, 10, width - 10);
        event.subject.fy = clamp(event.y, 10, height - 10);
        simulation.alpha(1).restart();
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
    }

    // Selecting node
    node.on("click", click);

    function click(event, d) {
        // deselect all
        d3.selectAll(".selected").classed("selected", false);
        
        // add class to node circle
        d3.select(this).select("circle").classed("selected", true);
        d3.select(this).select("text").classed("selected", true);
        
        selectNote(d.id, d.name, d.text, d.status);
    }

    // When this cell is re-run, stop the previous simulation. (This doesn’t
    // really matter since the target alpha is zero and the simulation will
    // stop naturally, but it’s a good practice.)
    // invalidation.then(() => simulation.stop());
}