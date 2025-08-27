
// ============================================================================
// web channel init
// ============================================================================

var windowController;
var tabController;
var taskController;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", channel.objects);

    windowController = channel.objects.window_controller;
    tabController = channel.objects.tab_controller;
    taskController = channel.objects.task_controller;

    // setting callbacks here
    windowControls();
    tabControls();
    adressBarCallback();
    favControls();
    pomodoroControls();
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

// address bar
const addressBar = document.getElementById('address-input');
const addressFormElement = document.getElementById('address-form');

// fav
const favTitle = document.getElementById('fav-title');
const favButton = document.getElementById('favButton');
const favRemoveButton = document.getElementById('fav-remove-button');
const favSaveButton = document.getElementById('fav-save-button');

// pomodoro
const pomodoroModalElement = document.getElementById('pomodoroModal');
const pomodoroRange = document.getElementById('pomodoro-range');
const pomodoroFocus = document.getElementById('pomodoro-focus');
const pomodoroTime = document.getElementById('pomodoro-time');
const playButton = document.getElementById('playButton');
const stopButton = document.getElementById('stopButton');
const pomodoroTaskSelect = document.getElementById('pomodoro-task-select');
const pomodoroBar = document.getElementById('pomodoro-bar');

// modals
const favModal = new bootstrap.Modal(document.getElementById('favModal'));
const pomodoroModal = new bootstrap.Modal(document.getElementById('pomodoroModal'));

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

    // history
    // TODO inactive state
    document.getElementById('backButton').addEventListener('click', function() {
       tabController.pageBack(); 
    });

    document.getElementById('forwardButton').addEventListener('click', function() {
       tabController.pageForward(); 
    });

    // refresh
    document.getElementById('refreshButton').addEventListener('click', function() {
       tabController.pageReload(); 
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
        tabController.createTab("");
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

// close currently selected
function closeCurrentTab() {
    if(tabList.length == 1) {
        return;
    }

    // calculating indexes
    let i = tabList.indexOf(document.getElementsByClassName('selected')[0]);
    newIndex = i == tabList.length - 1 ? i - 1 : i;

    // closing backend
    tabController.closeTab(i);

    // closing frontend
    tabList[i].remove();
    tabList[newIndex].click();
    tabList.splice(i, 1);

    // recalculating width
    checkOverflow();
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
    focusAddressBar();

    checkOverflow();
}

// closing all tabs on frontend
function closeAllTabs() {
    for (let i = 0; i < tabList.length; i++)
        tabList[i].remove();
    tabList = [];

    // recalculating width
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

function updateAddressBar(url) {
    addressBar.value = url;
}

// ============================================================================
// fav controls
// ============================================================================

function setFavStatus(status) {
    if(status)
        favButton.classList.add('faved');
    else
        favButton.classList.remove('faved');
}

function favControls() {
    favButton.addEventListener('click', function() {
        let status = favButton.classList.contains('faved');

        if(!status)
            tabController.get_current_title()
                .then(function(title) {
                    tabController.create_fav(title);
                    favTitle.value = title; 
                    setFavStatus(1);
                });
    });

    favRemoveButton.addEventListener('click', function() {
        tabController.delete_fav()
            .then(function() {
                setFavStatus(0);
            });
    });

    favSaveButton.addEventListener('click', function() {
        // TODO update fav data
    });
}

function openFavModal() {
    let status = favButton.classList.contains('faved');

    if(!status)
        tabController.get_current_title()
            .then(function(title) {
                tabController.create_fav(title);
                favTitle.value = title; 
                setFavStatus(1);
            });

    favModal.show();
}

// ============================================================================
// pomodoro controls
// ============================================================================

var selectedTime;
var currentTime;
var isRunning = false;
var isPaused = false;
var pomodoroTask = null;

function sec2time(t) {
    let m = Math.floor(t/60);
    let s = (t-m*60);

    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
}

function tick() {
    if (currentTime > 0) {
        currentTime--;
        pomodoroTime.innerHTML = sec2time(currentTime);

        let width = (currentTime / selectedTime) * 100;
        pomodoroBar.style.width = width + '%';
    } else {
        clearInterval(timerInterval);
        isRunning = false;
        
        // play sound
        const audio = new Audio('etc/ding.mp3');
        audio.play().catch(() => {});
        
        // timer done
        pomodoroTaskSelect.removeAttribute('disabled');
        pomodoroBar.style.width = '100%';
        playButton.children[0].innerHTML = 'play_arrow';
    }
}

function pomodoroControls() {
    pomodoroModalElement.addEventListener('show.bs.modal', function() {
        pomodoroTaskSelect.innerHTML = '';

        taskController.get_task_tree().then(tasks => {
            let taskList = JSON.parse(tasks);

            taskList.forEach(task => {
                let option = document.createElement('option');
                option.value = task.id;
                option.innerHTML = task.name;
                pomodoroTaskSelect.appendChild(option);
            });
        });

        taskController.get_current_task().then(t => {
            task = JSON.parse(t);
            pomodoroTask = task.id;
        });
    });

    pomodoroRange.addEventListener('input', function(val) {
        pomodoroFocus.innerHTML = pomodoroRange.value + ' min';

        if(!isRunning)
            pomodoroTime.innerHTML = sec2time(pomodoroRange.value * 60);
    });

    // play button
    playButton.addEventListener('click', function() {
        pomodoroTaskSelect.setAttribute('disabled', true);

        if (!isRunning && !isPaused) {
            currentTime = pomodoroRange.value * 60;
            selectedTime = pomodoroRange.value * 60;
            isRunning = true;
            playButton.children[0].innerHTML = 'pause';

            timerInterval = setInterval(tick, 1000);
        } else if (isRunning && !isPaused) {
            isRunning = false;
            isPaused = true;
            playButton.children[0].innerHTML = 'play_arrow';

            clearInterval(timerInterval);
        } else if (!isRunning && isPaused) {
            isRunning = true;
            isPaused = false;
            playButton.children[0].innerHTML = 'pause';

            timerInterval = setInterval(tick, 1000);
        }
    });

    // stop button
    stopButton.addEventListener('click', function() {
        clearInterval(timerInterval); 
        isRunning = false;
        isPaused = false;
        pomodoroTime.innerHTML = sec2time(pomodoroRange.value * 60);
        pomodoroBar.style.width = '100%';
    });
}

// ============================================================================
// focus
// ============================================================================

function focusAddressBar() {
    if(favModal._element.classList.contains('show'))
        favModal.hide();

    if(pomodoroModal._element.classList.contains('show'))
        pomodoroModal.hide();
    
    // TODO fix focus
    addressBar.focus();
}