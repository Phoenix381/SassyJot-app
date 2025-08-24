
// ============================================================================
// web channel init
// ============================================================================

var noteController;

// data arrays
var nodes_initial = [];
var links_initial = [];

// currently selected node
var selected_note_id = null;

// editors
var noteEditor = null;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    noteController = channel.objects.note_controller;

    noteController.get_notes().then(result => {
        nodes_initial = JSON.parse(result);

        noteController.get_links().then(result => {
            links_initial = JSON.parse(result);

            drawGraph();
        });
    });

    // setting callbacks here
    initNoteControls();
});

// ============================================================================
// page elements
// ============================================================================

const graph = document.getElementById("graph-container");
const controlledElements = document.getElementsByClassName("controls-visibility");

// add note
const newNoteModal = new bootstrap.Modal(document.getElementById("newNoteModal"));
const newSelectedStatus = document.getElementById("new-selected-status");
const noteNameInput = document.getElementById("note-name-input");
const addNoteButton = document.getElementById("add-note-button");

const renameButton = document.getElementById("rename-button");
const renameOkButton = document.getElementById("rename-ok-button");
const renameCancelButton = document.getElementById("rename-cancel-button");

const noteText = document.getElementById("note-text");
const noteName = document.getElementById("note-name");
const selectedStatus = document.getElementById("selected-status");

// edit cards

// ============================================================================
// note controls
// ============================================================================

function addNote(name, status) {
    // TODO redraw graph
}

function initNoteControls() {
    addNoteButton.addEventListener("click", () => {
        let status = newSelectedStatus.value; 
        let name = noteNameInput.value;

        noteController.create_note(name, status).then(result => {
            let note = JSON.parse(result);
            addNote(note.name, note.status);

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

    // TODO color selection
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