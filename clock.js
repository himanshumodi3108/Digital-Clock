document.addEventListener('DOMContentLoaded', () => {
    initializeClock();
});

function initializeClock() {
const container = document.querySelector(".container");
const dateText = document.querySelector('.container .date');
const timeText = document.querySelector('.container .time');
const toggleBtn = document.querySelector(".container .toggle-btn");
const formatBtn = document.querySelector(".format-btn");
const secondsBtn = document.querySelector(".seconds-btn");
const alarmBtn = document.querySelector(".alarm-btn");
const timerModeBtn = document.querySelector(".timer-mode-btn");
const settingsBtn = document.querySelector(".settings-btn");
const fullscreenBtn = document.querySelector(".fullscreen-btn");
const settingsModal = document.getElementById("settingsModal");
const timezoneModal = document.getElementById("timezoneModal");

if (!container || !dateText || !timeText) {
    console.error('Essential DOM elements not found!');
    return;
}

const weeks = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

let is24HourFormat = false;
let showSeconds = true;
let currentMode = 'clock';
let alarms = [];
let timezones = [];
let activeAlarm = null;
let alarmSoundInterval = null;
let triggeredAlarms = new Set();
let snoozedAlarms = new Map();

let stopwatchInterval = null;
let stopwatchTime = 0;
let stopwatchRunning = false;
let laps = [];

let timerInterval = null;
let timerTime = 0;
let timerRunning = false;

const initTimer = () => {
    const hours = parseInt(document.getElementById('timerHours').value) || 0;
    const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
    const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
    timerTime = hours * 3600 + minutes * 60 + seconds;
    updateTimerDisplay();
};

let pomodoroInterval = null;
let pomodoroTime = 25 * 60;
let pomodoroRunning = false;
let pomodoroSession = 1;
let isBreak = false;
let pomoWorkTime = 25;
let pomoBreakTime = 5;

const savedTheme = localStorage.getItem('clockTheme') || 'light';
const savedFormat = localStorage.getItem('clockFormat');
const savedSeconds = localStorage.getItem('clockSeconds');
const savedAlarms = localStorage.getItem('alarms');
const savedTimezones = localStorage.getItem('timezones');
const savedPomoWork = localStorage.getItem('pomoWork');
const savedPomoBreak = localStorage.getItem('pomoBreak');

if (savedTheme === 'dark') {
    container.classList.add("dark");
    toggleBtn.innerHTML = '<i class="fa-regular fa-sun"></i>';
    toggleBtn.style.background = "#fff";
    toggleBtn.style.color = "#272e38";
} else if (savedTheme !== 'light') {
    container.classList.add(`theme-${savedTheme}`);
}

if (savedFormat === '24') {
    is24HourFormat = true;
}

if (savedSeconds === 'hide') {
    showSeconds = false;
}

const updateAlarmList = () => {
    const alarmList = document.getElementById('alarmList');
    if (!alarmList) return;
    alarmList.innerHTML = '';
    alarms.forEach((alarm, index) => {
        const item = document.createElement('div');
        item.className = 'alarm-item';
        item.innerHTML = `
            <span>${alarm.time}</span>
            <button class="delete-alarm" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
        `;
        alarmList.appendChild(item);
    });
    
    document.querySelectorAll('.delete-alarm').forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.target.closest('.delete-alarm').dataset.index);
            alarms.splice(index, 1);
            localStorage.setItem('alarms', JSON.stringify(alarms));
            updateAlarmList();
        });
    });
};

const updateTimezoneList = () => {
    const timezoneList = document.getElementById('timezoneList');
    if (!timezoneList) return;
    timezoneList.innerHTML = '';
    timezones.forEach((tz, index) => {
        const item = document.createElement('div');
        item.className = 'timezone-item';
        const now = new Date();
        const tzTime = new Date(now.toLocaleString("en-US", {timeZone: tz}));
        const tzName = tz.split('/').pop().replace('_', ' ');
        item.innerHTML = `
            <span>${tzName}</span>
            <span>${tzTime.toLocaleTimeString('en-US', {hour12: !is24HourFormat, hour: '2-digit', minute: '2-digit', second: showSeconds ? '2-digit' : undefined})}</span>
            <button class="delete-alarm" data-index="${index}" data-type="timezone"><i class="fa-solid fa-trash"></i></button>
        `;
        timezoneList.appendChild(item);
    });
    
    document.querySelectorAll('.delete-alarm[data-type="timezone"]').forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.target.closest('.delete-alarm').dataset.index);
            timezones.splice(index, 1);
            localStorage.setItem('timezones', JSON.stringify(timezones));
            updateTimezoneList();
        });
    });
    
    if (timezones.length > 0) {
        setInterval(() => {
            timezones.forEach((tz, index) => {
                const items = document.querySelectorAll('.timezone-item');
                if (items[index]) {
                    const now = new Date();
                    const tzTime = new Date(now.toLocaleString("en-US", {timeZone: tz}));
                    const timeSpan = items[index].querySelectorAll('span')[1];
                    if (timeSpan) {
                        timeSpan.textContent = tzTime.toLocaleTimeString('en-US', {hour12: !is24HourFormat, hour: '2-digit', minute: '2-digit', second: showSeconds ? '2-digit' : undefined});
                    }
                }
            });
        }, 1000);
    }
};

if (savedAlarms) {
    alarms = JSON.parse(savedAlarms);
    updateAlarmList();
}

if (savedTimezones) {
    timezones = JSON.parse(savedTimezones);
    updateTimezoneList();
}

if (savedPomoWork) {
    pomoWorkTime = parseInt(savedPomoWork);
    document.getElementById('pomoWork').value = pomoWorkTime;
}

if (savedPomoBreak) {
    pomoBreakTime = parseInt(savedPomoBreak);
    document.getElementById('pomoBreak').value = pomoBreakTime;
}

const formatTime = (hours, minutes, seconds) => {
    let displayHours = hours;
    let amPm = "AM";
    
    if (is24HourFormat) {
        displayHours = hours < 10 ? "0" + hours : hours;
    } else {
        if (hours === 0) {
            displayHours = 12;
            amPm = "AM";
        } else if (hours === 12) {
            displayHours = 12;
            amPm = "PM";
        } else if (hours > 12) {
            displayHours = hours - 12;
            amPm = "PM";
        } else {
            displayHours = hours;
            amPm = "AM";
        }
        displayHours = displayHours < 10 ? "0" + displayHours : displayHours;
    }
    
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    
    if (is24HourFormat) {
        return showSeconds 
            ? `${displayHours} : ${formattedMinutes} : ${formattedSeconds}`
            : `${displayHours} : ${formattedMinutes}`;
    } else {
        return showSeconds 
            ? `${displayHours} : ${formattedMinutes} : ${formattedSeconds} <span class="am-pm">${amPm}</span>`
            : `${displayHours} : ${formattedMinutes} <span class="am-pm">${amPm}</span>`;
    }
};

const formatDisplayTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatPomodoroTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getTime = () => {
    const d = new Date();
    const day = d.getDay();
    const year = d.getFullYear();
    const date = d.getDate();
    const month = d.getMonth();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();
    
    dateText.textContent = `${weeks[day]}, ${months[month]} ${date}, ${year}`;
    timeText.innerHTML = formatTime(hours, minutes, seconds);
    checkAlarms(hours, minutes);
};

const checkAlarms = (hours, minutes) => {
    const currentTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    snoozedAlarms.forEach((snoozeTime, alarmTime) => {
        if (currentTime === snoozeTime) {
            const alarm = alarms.find(a => a.time === alarmTime);
            if (alarm && alarm.enabled) {
                snoozedAlarms.delete(alarmTime);
                triggerAlarm(alarm, alarms.indexOf(alarm));
            }
        }
    });
    
    alarms.forEach((alarm, index) => {
        const alarmKey = `${alarm.time}-${index}`;
        if (alarm.time === currentTime && alarm.enabled && !triggeredAlarms.has(alarmKey)) {
            triggerAlarm(alarm, index);
            triggeredAlarms.add(alarmKey);
        }
    });
    
    if (minutes === 0) {
        triggeredAlarms.clear();
    }
};

const triggerAlarm = (alarm, index) => {
    if (activeAlarm !== null) return;
    
    activeAlarm = { alarm, index };
    alarmBtn.classList.add('active');
    
    const alarmModal = document.getElementById('alarmAlertModal');
    const alarmTimeDisplay = document.getElementById('alarmTimeDisplay');
    alarmTimeDisplay.textContent = alarm.time;
    alarmModal.classList.add('show');
    
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Alarm!', { 
                        body: `Alarm: ${alarm.time}`,
                        icon: '/favicon.ico',
                        tag: 'alarm'
                    });
                }
            });
        } else if (Notification.permission === 'granted') {
            new Notification('Alarm!', { 
                body: `Alarm: ${alarm.time}`,
                icon: '/favicon.ico',
                tag: 'alarm'
            });
        }
    }
    
    startAlarmSound();
};

const startAlarmSound = () => {
    if (alarmSoundInterval) return;
    
    playAlarmSound();
    alarmSoundInterval = setInterval(() => {
        if (activeAlarm !== null) {
            playAlarmSound();
        }
    }, 2000);
};

const stopAlarmSound = () => {
    if (alarmSoundInterval) {
        clearInterval(alarmSoundInterval);
        alarmSoundInterval = null;
    }
};

const playAlarmSound = () => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.5);
    } catch (e) {
        console.error('Error playing alarm sound:', e);
    }
};

const stopAlarm = () => {
    if (activeAlarm === null) return;
    
    stopAlarmSound();
    alarmBtn.classList.remove('active');
    const alarmModal = document.getElementById('alarmAlertModal');
    alarmModal.classList.remove('show');
    activeAlarm = null;
};

const snoozeAlarm = () => {
    if (activeAlarm === null) return;
    
    const alarm = activeAlarm.alarm;
    const now = new Date();
    const snoozeTime = new Date(now);
    snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
    
    const snoozeTimeStr = `${String(snoozeTime.getHours()).padStart(2, '0')}:${String(snoozeTime.getMinutes()).padStart(2, '0')}`;
    snoozedAlarms.set(alarm.time, snoozeTimeStr);
    
    stopAlarm();
    
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Alarm Snoozed', { 
            body: `Alarm will ring again at ${snoozeTimeStr}`,
            tag: 'alarm-snooze'
        });
    }
};

getTime();
setInterval(getTime, 1000);

toggleBtn.addEventListener("click", () => {
    const isDark = container.classList.contains("dark");
    const currentTheme = container.className.match(/theme-\w+/);
    
    container.classList.remove("dark", "theme-blue", "theme-green", "theme-purple");
    
    if (isDark || currentTheme) {
        container.classList.remove("dark");
        toggleBtn.innerHTML = '<i class="fa-regular fa-moon"></i>';
        toggleBtn.style.background = "#272e38";
        toggleBtn.style.color = "#fff";
        localStorage.setItem('clockTheme', 'light');
    } else {
        container.classList.add("dark");
        toggleBtn.innerHTML = '<i class="fa-regular fa-sun"></i>';
        toggleBtn.style.background = "#fff";
        toggleBtn.style.color = "#272e38";
        localStorage.setItem('clockTheme', 'dark');
    }
});

formatBtn.addEventListener("click", () => {
    is24HourFormat = !is24HourFormat;
    localStorage.setItem('clockFormat', is24HourFormat ? '24' : '12');
    getTime();
});

secondsBtn.addEventListener("click", () => {
    showSeconds = !showSeconds;
    localStorage.setItem('clockSeconds', showSeconds ? 'show' : 'hide');
    getTime();
});

timerModeBtn.addEventListener("click", () => {
    switchMode('timer');
});

settingsBtn.addEventListener("click", () => {
    settingsModal.classList.add('show');
});

fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen:', err);
        });
        fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
    } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
    }
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.target.closest('.modal').classList.remove('show');
    });
});

window.addEventListener("click", (e) => {
    if (e.target.classList.contains('modal') && !e.target.classList.contains('alarm-alert-modal')) {
        e.target.classList.remove('show');
    }
});

const alarmStopBtn = document.querySelector('.alarm-stop-btn');
const alarmSnoozeBtn = document.querySelector('.alarm-snooze-btn');

if (alarmStopBtn) {
    alarmStopBtn.addEventListener("click", () => {
        stopAlarm();
    });
}

if (alarmSnoozeBtn) {
    alarmSnoozeBtn.addEventListener("click", () => {
        snoozeAlarm();
    });
}

document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener("click", () => {
        const theme = btn.dataset.theme;
        container.classList.remove("dark", "theme-blue", "theme-green", "theme-purple");
        if (theme !== 'light') {
            container.classList.add(theme === 'dark' ? 'dark' : `theme-${theme}`);
        }
        localStorage.setItem('clockTheme', theme);
        
        if (theme === 'dark') {
            toggleBtn.innerHTML = '<i class="fa-regular fa-sun"></i>';
            toggleBtn.style.background = "#fff";
            toggleBtn.style.color = "#272e38";
        } else {
            toggleBtn.innerHTML = '<i class="fa-regular fa-moon"></i>';
            toggleBtn.style.background = "#272e38";
            toggleBtn.style.color = "#fff";
        }
    });
});

const setAlarmBtn = document.querySelector('.set-alarm-btn');
if (setAlarmBtn) {
    setAlarmBtn.addEventListener("click", () => {
        const alarmTime = document.getElementById('alarmTime');
        if (alarmTime && alarmTime.value) {
            alarms.push({ time: alarmTime.value, enabled: true });
            localStorage.setItem('alarms', JSON.stringify(alarms));
            updateAlarmList();
            alarmTime.value = '';
            
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    });
}

document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener("click", () => {
        const mode = tab.dataset.mode;
        switchMode(mode);
    });
});

const switchMode = (mode) => {
    currentMode = mode;
    
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`[data-mode="${mode}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    const timezonePanel = document.getElementById('timezonePanel');
    if (timezonePanel) {
        timezonePanel.style.display = 'none';
    }
    
    if (mode === 'stopwatch') {
        const panel = document.getElementById('stopwatchPanel');
        if (panel) panel.style.display = 'block';
    } else if (mode === 'timer') {
        const panel = document.getElementById('timerPanel');
        if (panel) panel.style.display = 'block';
    } else if (mode === 'pomodoro') {
        const panel = document.getElementById('pomodoroPanel');
        if (panel) panel.style.display = 'block';
    } else if (mode === 'timezone') {
        if (timezonePanel) {
            timezonePanel.style.display = 'block';
            updateTimezoneList();
        }
    }
};

let stopwatchStartBtn = document.querySelector('.stopwatch-panel .start-btn');
let stopwatchPauseBtn = document.querySelector('.stopwatch-panel .pause-btn');
let stopwatchResetBtn = document.querySelector('.stopwatch-panel .reset-btn');
let stopwatchDisplay = document.querySelector('.stopwatch-display');

stopwatchStartBtn.addEventListener("click", () => {
    if (!stopwatchRunning) {
        stopwatchRunning = true;
        stopwatchStartBtn.style.display = 'none';
        stopwatchPauseBtn.style.display = 'inline-flex';
        stopwatchPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        const startTime = Date.now() - stopwatchTime * 1000;
        stopwatchInterval = setInterval(() => {
            stopwatchTime = Math.floor((Date.now() - startTime) / 1000);
            stopwatchDisplay.textContent = formatDisplayTime(stopwatchTime);
        }, 100);
    }
});

stopwatchPauseBtn.addEventListener("click", () => {
    if (stopwatchRunning) {
        stopwatchRunning = false;
        clearInterval(stopwatchInterval);
        stopwatchPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
    } else {
        stopwatchRunning = true;
        const startTime = Date.now() - stopwatchTime * 1000;
        stopwatchInterval = setInterval(() => {
            stopwatchTime = Math.floor((Date.now() - startTime) / 1000);
            stopwatchDisplay.textContent = formatDisplayTime(stopwatchTime);
        }, 100);
        stopwatchPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    }
});

stopwatchResetBtn.addEventListener("click", () => {
    stopwatchRunning = false;
    clearInterval(stopwatchInterval);
    stopwatchTime = 0;
    stopwatchDisplay.textContent = formatDisplayTime(0);
    laps = [];
    document.getElementById('lapList').innerHTML = '';
    stopwatchStartBtn.style.display = 'inline-flex';
    stopwatchPauseBtn.style.display = 'none';
});

let timerStartBtn = document.querySelector('.timer-btn-start');
let timerPauseBtn = document.querySelector('.timer-btn-pause');
let timerResetBtn = document.querySelector('.timer-btn-reset');
let timerDisplay = document.querySelector('.timer-display');

const updateTimerDisplay = () => {
    timerDisplay.textContent = formatDisplayTime(timerTime);
};

timerStartBtn.addEventListener("click", () => {
    if (!timerRunning && timerTime > 0) {
        timerRunning = true;
        timerStartBtn.style.display = 'none';
        timerPauseBtn.style.display = 'inline-flex';
        timerPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        timerInterval = setInterval(() => {
            if (timerTime > 0) {
                timerTime--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerRunning = false;
                playAlarmSound();
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Timer Complete!');
                }
                timerStartBtn.style.display = 'inline-flex';
                timerPauseBtn.style.display = 'none';
            }
        }, 1000);
    }
});

timerPauseBtn.addEventListener("click", () => {
    if (timerRunning) {
        timerRunning = false;
        clearInterval(timerInterval);
        timerPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
    } else {
        timerRunning = true;
        timerPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        timerInterval = setInterval(() => {
            if (timerTime > 0) {
                timerTime--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerRunning = false;
                playAlarmSound();
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Timer Complete!');
                }
                timerStartBtn.style.display = 'inline-flex';
                timerPauseBtn.style.display = 'none';
            }
        }, 1000);
    }
});

timerResetBtn.addEventListener("click", () => {
    timerRunning = false;
    clearInterval(timerInterval);
    const hours = parseInt(document.getElementById('timerHours').value) || 0;
    const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
    const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
    timerTime = hours * 3600 + minutes * 60 + seconds;
    updateTimerDisplay();
    timerStartBtn.style.display = 'inline-flex';
    timerPauseBtn.style.display = 'none';
});

document.getElementById('timerHours').addEventListener("input", () => {
    if (!timerRunning) {
        const hours = parseInt(document.getElementById('timerHours').value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
        timerTime = hours * 3600 + minutes * 60 + seconds;
        updateTimerDisplay();
    }
});

document.getElementById('timerMinutes').addEventListener("input", () => {
    if (!timerRunning) {
        const hours = parseInt(document.getElementById('timerHours').value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
        timerTime = hours * 3600 + minutes * 60 + seconds;
        updateTimerDisplay();
    }
});

document.getElementById('timerSeconds').addEventListener("input", () => {
    if (!timerRunning) {
        const hours = parseInt(document.getElementById('timerHours').value) || 0;
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
        timerTime = hours * 3600 + minutes * 60 + seconds;
        updateTimerDisplay();
    }
});

let pomoStartBtn = document.querySelector('.pomodoro-panel .start-btn');
let pomoPauseBtn = document.querySelector('.pomodoro-panel .pause-btn');
let pomoResetBtn = document.querySelector('.pomodoro-panel .reset-btn');
let pomodoroDisplay = document.querySelector('.pomodoro-display');
let pomodoroSessionEl = document.querySelector('.pomodoro-session');

const updatePomodoroDisplay = () => {
    pomodoroDisplay.textContent = formatPomodoroTime(pomodoroTime);
    pomodoroSessionEl.textContent = isBreak ? `Break ${pomodoroSession}` : `Session ${pomodoroSession}`;
};

pomoStartBtn.addEventListener("click", () => {
    if (!pomodoroRunning) {
        pomodoroRunning = true;
        pomoStartBtn.style.display = 'none';
        pomoPauseBtn.style.display = 'inline-flex';
        pomoPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        pomodoroInterval = setInterval(() => {
            if (pomodoroTime > 0) {
                pomodoroTime--;
                updatePomodoroDisplay();
            } else {
                clearInterval(pomodoroInterval);
                pomodoroRunning = false;
                playAlarmSound();
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(isBreak ? 'Break Complete!' : 'Work Session Complete!');
                }
                // Switch to break or next session
                if (isBreak) {
                    isBreak = false;
                    pomodoroSession++;
                    pomodoroTime = pomoWorkTime * 60;
                } else {
                    isBreak = true;
                    pomodoroTime = pomoBreakTime * 60;
                }
                updatePomodoroDisplay();
                pomoStartBtn.style.display = 'inline-flex';
                pomoPauseBtn.style.display = 'none';
            }
        }, 1000);
    }
});

pomoPauseBtn.addEventListener("click", () => {
    if (pomodoroRunning) {
        pomodoroRunning = false;
        clearInterval(pomodoroInterval);
        pomoPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
    } else {
        pomodoroRunning = true;
        pomoPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        pomodoroInterval = setInterval(() => {
            if (pomodoroTime > 0) {
                pomodoroTime--;
                updatePomodoroDisplay();
            } else {
                clearInterval(pomodoroInterval);
                pomodoroRunning = false;
                playAlarmSound();
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(isBreak ? 'Break Complete!' : 'Work Session Complete!');
                }
                // Switch to break or next session
                if (isBreak) {
                    isBreak = false;
                    pomodoroSession++;
                    pomodoroTime = pomoWorkTime * 60;
                } else {
                    isBreak = true;
                    pomodoroTime = pomoBreakTime * 60;
                }
                updatePomodoroDisplay();
                pomoStartBtn.style.display = 'inline-flex';
                pomoPauseBtn.style.display = 'none';
            }
        }, 1000);
    }
});

pomoResetBtn.addEventListener("click", () => {
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
    isBreak = false;
    pomodoroSession = 1;
    pomodoroTime = pomoWorkTime * 60;
    updatePomodoroDisplay();
    pomoStartBtn.style.display = 'inline-flex';
    pomoPauseBtn.style.display = 'none';
});

document.getElementById('pomoWork').addEventListener("input", (e) => {
    pomoWorkTime = parseInt(e.target.value) || 25;
    if (!pomodoroRunning) {
        pomodoroTime = pomoWorkTime * 60;
        updatePomodoroDisplay();
    }
    localStorage.setItem('pomoWork', pomoWorkTime);
});

document.getElementById('pomoBreak').addEventListener("input", (e) => {
    pomoBreakTime = parseInt(e.target.value) || 5;
    localStorage.setItem('pomoBreak', pomoBreakTime);
});

pomodoroTime = pomoWorkTime * 60;
updatePomodoroDisplay();

initTimer();

document.querySelector('.add-timezone-btn').addEventListener("click", () => {
    timezoneModal.classList.add('show');
});

document.querySelector('.add-timezone-confirm').addEventListener("click", () => {
    const timezone = document.getElementById('timezoneSelect').value;
    if (!timezones.includes(timezone)) {
        timezones.push(timezone);
        localStorage.setItem('timezones', JSON.stringify(timezones));
        updateTimezoneList();
        timezoneModal.classList.remove('show');
    }
});

document.addEventListener("keydown", (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    switch(e.key.toLowerCase()) {
        case 'd':
            toggleBtn.click();
            break;
        case 's':
            settingsBtn.click();
            break;
        case 'f':
            fullscreenBtn.click();
            break;
        case '1':
            switchMode('clock');
            break;
        case '2':
            switchMode('stopwatch');
            break;
        case '3':
            switchMode('timer');
            break;
        case '4':
            switchMode('pomodoro');
            break;
        case '5':
            switchMode('timezone');
            break;
        case 'escape':
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
            break;
    }
});

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        container.classList.add('fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
        }
    } else {
        container.classList.remove('fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
    }
});

}
