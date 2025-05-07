
let calendar = document.getElementById('calendar');

        // alternating week colors
        let colors = ['#eeeeee', '#a89984'];
        let color = 0;

        // tracking month, day, week
        let currentDate = new Date();
        let currentDay = currentDate.getDate();
        let currentWeek = currentDate.getDay();
        let currentMonth = currentDate.getMonth();
        
        // for month divider
        let currentMonthRemainingDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() - currentDay;
        let nextMonthTotalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).getDate();

        // for month divider
        let monthDays = [nextMonthTotalDays, 30];
        let remainingDays = currentMonthRemainingDays+1;

        // day num to name
        function getDayName(day) {
            let dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return dayNames[day];
        }

        // month num to name
        function getMonthName(month) {
            let monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return monthNames[month];
        }

        // 30 days calendar
        for (var i = 1; i <= 30; i++) {
            // tracking current day name
            let dayName = getDayName(currentWeek%7);
            currentWeek++;

            // main container
            let dayContainer = document.createElement('div');
            dayContainer.classList.add('day-container');

            // adding month name for first day
            let monthNameContainer = document.createElement('div');
            monthNameContainer.classList.add('month-name');
            if (i === 1 || currentDay === 1) {
                monthNameContainer.innerHTML = getMonthName(currentMonth%12);
                currentMonth += 1;
            }
            dayContainer.appendChild(monthNameContainer);

            // adding week day name
            let dayNameContainer = document.createElement('div');
            dayNameContainer.classList.add('day-name');
            dayNameContainer.innerHTML = dayName;
            dayNameContainer.style.color = colors[color % colors.length];
            dayContainer.appendChild(dayNameContainer);

            // container for day and circles
            let day = document.createElement('div');
            day.classList.add('day');
            day.innerHTML = currentDay;

            // adding circles for each project/task
            // TODO get from api
            let numCircles = Math.floor(Math.random() * 9);

            if (numCircles > 0) {
                let circleContainer = document.createElement('div');
                circleContainer.classList.add('circle-container');


                for (var j = 0; j < numCircles; j++) {
                    let circle = document.createElement('div');
                    circle.classList.add('circle');
                    circleContainer.appendChild(circle);
                
                }
                day.appendChild(circleContainer);
            }

            dayContainer.appendChild(day);

            // tracking remaining days
            currentDay++;
            remainingDays--;

            // month divider
            if (remainingDays === 0) {
                remainingDays = monthDays.shift();
                currentDay = 1;
                dayContainer.style.marginRight = '5px';
                dayNameContainer.style.borderRight = '1px solid #7c6f64';
            }
            if (currentDay === 2) {
                dayNameContainer.style.borderLeft = '1px solid #7c6f64';
            }

            // appending to calendar
            calendar.appendChild(dayContainer);

            // alternating colors
            if (dayName === 'Sun')
                color++;
        }