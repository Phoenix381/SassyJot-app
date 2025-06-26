

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

    proj = projectController.get_project(proj_id).then(project => {
        proj = JSON.parse(project);
        projName.innerHTML = proj.name;
    });

    // setting callbacks here

});

// ============================================================================
// page elements
// ============================================================================



// ============================================================================
// modal actions
// ============================================================================



