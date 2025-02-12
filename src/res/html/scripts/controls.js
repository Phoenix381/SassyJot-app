
// ============================================================================
// web channel init
// ============================================================================

var windowController;
var tabController;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    windowController = channel.objects.window_controller;
    tabController = channel.objects.tab_controller;

    // setting callbacks here
    windowControls();
    tabControls();
});

// ============================================================================
// page elements
// ============================================================================

const controls = document.getElementById('controls');

const createTab = document.getElementById('addButton');
const tabContainer = document.getElementById('tabs-container');
const scrollable = document.querySelector('.tabs-scrollable');
const leftScroll = document.getElementById('scroll-left');
const rightScroll = document.getElementById('scroll-right');
const tabs = document.getElementsByClassName('tab');

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

// ============================================================================
// tab controls
// ============================================================================

// tab callbacks
function tabControls() {
    // new tab
    createTab.addEventListener('click', function() {
        newTab();
        tabController.createTab("https://duckduckgo.com/");
    });
}

// scrolling tabs container
leftScroll.addEventListener('click', () => {
    scrollable.scrollBy(-100, 0);
});

rightScroll.addEventListener('click', () => {
    scrollable.scrollBy(100, 0);
});

scrollable.addEventListener('wheel', (e) => {
  e.preventDefault();
  scrollable.scrollLeft += e.deltaY;
});

// TODO set tab sizes or scroll visibility
function checkOverflow() {
    if (tabContainer.scrollWidth > tabContainer.clientWidth)
        console.log('overflow');
    else
        console.log('no overflow');
}

// new tab div
function newTab() {
    // tab element
    let newTab = document.createElement('div')
    newTab.classList.add('tab');
    // newTab.textContent = tabs.length + 1;

    // adding content
    let content = document.createElement('div');
    content.classList.add('tab-content');

    let icon = document.createElement('i');
    icon.classList.add('material-symbols');
    icon.innerHTML = 'globe';

    let text = document.createElement('div');
    text.classList.add('tab-title');
    // 'verylongtabnamegooesonandon'
    text.innerHTML = 'tab' + (tabs.length + 1);


    // adding content to tab
    content.appendChild(icon);
    content.appendChild(text);
    newTab.appendChild(content);

    // tab selection
    newTab.addEventListener('click', function(e) {
        for (let tab of tabs) { 
            tab.classList.remove('selected');
        }
        e.currentTarget.classList.add('selected');
    });

    // tab closing
    newTab.addEventListener('auxclick', function(e) {
        e.currentTarget.remove();
        checkOverflow();
    });

    tabContainer.appendChild(newTab);
    newTab.click();

    checkOverflow();
}