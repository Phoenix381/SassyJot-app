
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

});

// ============================================================================
// page elements
// ============================================================================

let addProjectButton = document.getElementById("add-project-button");