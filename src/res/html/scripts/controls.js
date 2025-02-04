
// ============================================================================
// web channel init
// ============================================================================

var windowController;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    windowController = channel.objects.window_controller;

    // setting callbacks here
    windowControls();
});

// ============================================================================
// page elements
// ============================================================================


// ============================================================================
// window and page controls
// ============================================================================

// window callbacks
function windowControls() {
    // top close
    document.getElementById('closeButton').addEventListener('click', function() {
        windowController.closeWindow();
    });

    // top maximize
    document.getElementById('maxButton').addEventListener('click', function() {
        windowController.maxWindow();
    });

    // top minimize
    document.getElementById('minButton').addEventListener('click', function() {
        windowController.minWindow();
    });

    // drag window (passing event to qt)
    const dragElement = document.getElementById('space');

    dragElement.addEventListener('mousedown', function() {
        windowController.windowMove();
    });
}

