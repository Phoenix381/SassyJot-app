
// ============================================================================
// web channel init
// ============================================================================

var taskController;
var aiController;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    taskController = channel.objects.task_controller;
    aiController = channel.objects.aiController;
});