
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
    adressBarCallback();
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

const addressBar = document.getElementById('address-input');
const addressFormElement = document.getElementById('address-form');

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

tabList = [];

// tab callbacks
function tabControls() {
    // new tab
    createTab.addEventListener('click', function() {
        newTab();
        tabController.createTab("https://duckduckgo.com/");
    });
}

// TODO min and max scrolls values
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

// updating tab title from qt
function updateTabTitle(i, title) {
    tabs[i].getElementsByClassName('tab-title')[0].innerHTML = title;
}

// updating icon from qt
function updateTabIcon(i, icon) {
    if(icon)
        tabs[i].getElementsByClassName('tab-icon')[0].src = "data:image/png;base64," + icon;
}

// tab selection
function selectTab(i) {
    for (let tab of tabs) {    
        tab.classList.remove('selected');
    }
    tabs[i].classList.add('selected');
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

    let icon = document.createElement('img');
    icon.classList.add('tab-icon');
    icon.src = 'img/globe_small.png';

    let text = document.createElement('div');
    text.classList.add('tab-title');
    // 'verylongtabnamegooesonandon'
    text.innerHTML = 'tab' + (tabs.length + 1);


    // adding content to tab
    content.appendChild(icon);
    content.appendChild(text);
    newTab.appendChild(content);

    // keeping tab in list
    tabList.push(newTab);

    // tab selection
    newTab.addEventListener('click', function(e) {
        let i = tabList.indexOf(e.currentTarget);
        tabController.selectTab(i);
        selectTab(i);
    });

    // tab closing
    newTab.addEventListener('auxclick', function(e) {
        if(tabList.length == 1) {
            return;
        }

        // calculating indexes
        let i = tabList.indexOf(e.currentTarget);
        newIndex = i == tabList.length - 1 ? i - 1 : i;

        // closing backend
        tabController.closeTab(i);

        // closing frontend
        tabList[i].remove();
        tabList[newIndex].click();
        tabList.splice(i, 1);

        // recalculating width
        checkOverflow();
    });

    tabContainer.appendChild(newTab);
    newTab.click();
    addressBar.focus();

    checkOverflow();
}

// ============================================================================
// address input
// ============================================================================

function adressBarCallback() {
    addressFormElement.addEventListener('submit', function(event) {
        tabController.pageChangeUrl(addressBar.value);

        addressBar.blur();
        event.preventDefault();
    });
}