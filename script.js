
/* Welcome splash removed — it fired once per browser session, which as a
   desktop background meant a 3-second overlay on every login. */

/* =============================================================
   CLOCK
   ============================================================= */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const elHours = document.getElementById('clock-hours');
const elMinutes = document.getElementById('clock-minutes');
const elDate = document.getElementById('clock-date');
const elAmPm = document.getElementById('clock-ampm');

let use24h = false; // default to 12-hour

function updateClock() {
    const now = new Date();
    let h = now.getHours();

    if (!use24h) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        elAmPm.textContent = ampm;
    }

    elHours.textContent = String(h).padStart(2, '0');
    elMinutes.textContent = String(now.getMinutes()).padStart(2, '0');
    elDate.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
}

updateClock();
setInterval(updateClock, 1000);

/* =============================================================
   12/24 HOUR FORMAT TOGGLE
   ============================================================= */
const format12 = document.getElementById('format-12');
const format24 = document.getElementById('format-24');
const formatSlider = document.getElementById('format-slider');

function setClockFormat(is24) {
    use24h = is24;

    // Update active label
    format12.classList.toggle('active', !is24);
    format24.classList.toggle('active', is24);

    // Slide the indicator
    formatSlider.classList.toggle('right', is24);

    // Show/hide AM-PM
    elAmPm.classList.toggle('hidden-ampm', is24);

    // Smooth transition on the clock digits
    const clockContainer = document.getElementById('clock-container');
    clockContainer.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    clockContainer.style.opacity = '0.6';
    clockContainer.style.transform = 'scale(0.97)';
    setTimeout(() => {
        updateClock();
        clockContainer.style.opacity = '1';
        clockContainer.style.transform = 'scale(1)';
    }, 150);
}

format12.addEventListener('click', () => setClockFormat(false));
format24.addEventListener('click', () => setClockFormat(true));

/* =============================================================
   THEME TOGGLE
   ============================================================= */
const THEMES = ['sunset', 'night', 'evening', 'abstract-mountains', 'black-sunset', 'campo-santo', 'forest-green', 'forest-night', 'pencil', 'cabin-view', 'lakeside-sunrise', 'lakeside-sunset', 'minimal-sunrise', 'valley', 'boat-sea-red', 'hollow-forest', 'hollow-colosseum', 'hollow-greenpath', 'hollow-abyss', 'hollow-radiance'];
let themeIndex = 0;

document.getElementById('btn-theme').addEventListener('click', () => {
    themeIndex = (themeIndex + 1) % THEMES.length;
    document.body.setAttribute('data-theme', THEMES[themeIndex]);
});

/* =============================================================
   CLOCK POSITION TOGGLE
   ============================================================= */
const POSITIONS = ['center', 'top', 'bottom-left'];
let posIndex = 0;
const dashboard = document.getElementById('dashboard');

document.getElementById('btn-clock-pos').addEventListener('click', () => {
    posIndex = (posIndex + 1) % POSITIONS.length;
    dashboard.setAttribute('data-clock-pos', POSITIONS[posIndex]);

    // Reset any manual drag when switching presets
    const clockEl = document.getElementById('clock-container');
    clockEl.classList.remove('clock-dragging');
    clockEl.style.left = '';
    clockEl.style.top = '';
});

/* =============================================================
   CLOCK DRAG — freely reposition the clock anywhere
   ============================================================= */
(function () {
    const clockEl = document.getElementById('clock-container');
    let isDragging = false;
    let startX, startY, origLeft, origTop;
    const DEAD_ZONE = 5; // px — prevents accidental drag on simple click
    let dragStarted = false;

    function pointerDown(e) {
        // Ignore if clicking inside a button / interactive child
        if (e.target.closest('button, input, a')) return;

        const evt = e.touches ? e.touches[0] : e;
        isDragging = true;
        dragStarted = false;

        // If already dragging-state, use current position; otherwise compute from bounding rect
        const rect = clockEl.getBoundingClientRect();
        origLeft = rect.left;
        origTop = rect.top;
        startX = evt.clientX;
        startY = evt.clientY;

        e.preventDefault();
    }

    function pointerMove(e) {
        if (!isDragging) return;
        const evt = e.touches ? e.touches[0] : e;
        const dx = evt.clientX - startX;
        const dy = evt.clientY - startY;

        // Only start actual drag after exceeding dead-zone
        if (!dragStarted) {
            if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) return;
            dragStarted = true;
            clockEl.classList.add('clock-dragging');
        }

        clockEl.style.left = `${origLeft + dx}px`;
        clockEl.style.top = `${origTop + dy}px`;
    }

    function pointerUp() {
        isDragging = false;
        dragStarted = false;
    }

    // Mouse events
    clockEl.addEventListener('mousedown', pointerDown);
    window.addEventListener('mousemove', pointerMove);
    window.addEventListener('mouseup', pointerUp);

    // Touch events
    clockEl.addEventListener('touchstart', pointerDown, { passive: false });
    window.addEventListener('touchmove', pointerMove, { passive: false });
    window.addEventListener('touchend', pointerUp);
})();

/* =============================================================
   PANEL TOGGLE LOGIC
   ============================================================= */
const panels = {
    pomodoro: document.getElementById('pomodoro-panel'),
    stopwatch: document.getElementById('stopwatch-panel'),
    music: document.getElementById('music-panel'),
};

/* Persistent panels are deliberately NOT in `panels` — each may stay open
   alongside the mutually-exclusive panels above, and alongside each other.
   Desktop gives them their own slots: focus bottom-left, tasks bottom-right,
   briefing top-right. `sheetOnMobile` marks the ones that fall back to a
   bottom sheet on phones, where three panels cannot coexist. */
const persistentPanels = {
    focus: { el: document.getElementById('focus-panel'), btn: document.getElementById('btn-focus'), sheetOnMobile: false },
    tasks: { el: document.getElementById('tasks-panel'), btn: document.getElementById('btn-tasks'), sheetOnMobile: true },
    briefing: { el: document.getElementById('briefing-panel'), btn: document.getElementById('btn-briefing'), sheetOnMobile: true },
};

function closeAllPanels() {
    Object.values(panels).forEach(p => p.classList.remove('visible'));
    document.querySelectorAll('.toolbar-btn:not(.persistent-toggle)').forEach(b => b.classList.remove('active'));
    document.body.classList.remove('panel-open');
}

function setPersistentPanel(name, visible) {
    const p = persistentPanels[name];
    if (!p) return;
    p.el.classList.toggle('visible', visible);
    p.btn.classList.toggle('active', visible);
}

function togglePersistentPanel(name, force) {
    const p = persistentPanels[name];
    if (!p) return;
    const visible = typeof force === 'boolean' ? force : !p.el.classList.contains('visible');
    setPersistentPanel(name, visible);

    // Below the tablet breakpoint these render as full-width sheets, so only
    // one may be open at a time (see the max-width 768px rules in style.css)
    if (visible && p.sheetOnMobile && window.innerWidth <= 768) {
        Object.keys(persistentPanels).forEach(other => {
            if (other !== name && persistentPanels[other].sheetOnMobile) setPersistentPanel(other, false);
        });
    }
}

function togglePanel(name) {
    const panel = panels[name];
    const btn = document.getElementById(`btn-${name === 'music' ? 'music' : name}`);
    const isVisible = panel.classList.contains('visible');

    // Close all panels
    closeAllPanels();

    if (!isVisible) {
        panel.classList.add('visible');
        btn.classList.add('active');
        document.body.classList.add('panel-open');
    }
}

document.getElementById('btn-pomodoro').addEventListener('click', () => togglePanel('pomodoro'));
document.getElementById('btn-stopwatch').addEventListener('click', () => togglePanel('stopwatch'));
document.getElementById('btn-music').addEventListener('click', () => togglePanel('music'));
Object.keys(persistentPanels).forEach(name => {
    persistentPanels[name].btn.addEventListener('click', () => togglePersistentPanel(name));
});

/* --- Close panels on tap outside / tap overlay --- */
document.addEventListener('click', (e) => {
    // Don't close if the click was inside a panel, toolbar, or bottom-right controls
    if (e.target.closest('.panel') || e.target.closest('.toolbar-btn') ||
        e.target.closest('.toolbar') || e.target.closest('.bottom-right-controls')) return;
    closeAllPanels();
});

/* =============================================================
   SWIPE-DOWN-TO-DISMISS (mobile bottom-sheet panels)
   ============================================================= */
(function () {
    let startY = 0;
    let currentY = 0;
    let panelEl = null;
    let isDragging = false;
    const THRESHOLD = 80; // px to trigger dismiss

    /* Several sheets can be visible at once, so pick the one actually under the
       finger — last in DOM order wins, matching the stacking order. The focus
       panel is a top-anchored card on mobile and is never swipe-dismissed. */
    function getPanelUnder(touch) {
        const candidates = [...document.querySelectorAll('.panel.visible:not(.focus-panel)')].reverse();
        return candidates.find(p => {
            const r = p.getBoundingClientRect();
            return touch.clientX >= r.left && touch.clientX <= r.right &&
                   touch.clientY >= r.top && touch.clientY <= r.bottom;
        }) || null;
    }

    document.addEventListener('touchstart', (e) => {
        // Only on mobile-width screens
        if (window.innerWidth > 480) return;

        // Only start drag if touch is on the panel itself (not on interactive children deep inside)
        const touch = e.touches[0];
        const target = e.target;

        // Touches on the focus panel must never drag a sheet underneath it
        if (target.closest('.focus-panel')) return;

        const panel = getPanelUnder(touch);
        if (!panel) return;

        // Allow drag from the panel drag-handle area (top ~40px) or panel background
        const panelRect = panel.getBoundingClientRect();
        const touchYInPanel = touch.clientY - panelRect.top;

        // Only initiate swipe from the top handle region or non-interactive areas
        if (touchYInPanel <= 40 || (!target.closest('button, input, a, .ost-progress-bar, .volume-slider'))) {
            startY = touch.clientY;
            currentY = startY;
            panelEl = panel;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!panelEl) return;
        const touch = e.touches[0];
        currentY = touch.clientY;
        const dy = currentY - startY;

        // Only allow downward drag
        if (dy > 5) {
            if (!isDragging) {
                isDragging = true;
                panelEl.classList.add('swiping');
            }
            // Translate the panel down, with slight resistance
            const dampened = dy * 0.85;
            panelEl.style.transform = `translateY(${dampened}px)`;
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        if (!panelEl) return;
        const dy = currentY - startY;

        panelEl.classList.remove('swiping');

        if (isDragging && dy > THRESHOLD) {
            // Dismiss — animate out then close. Persistent panels survive
            // closeAllPanels(), so hide the swiped one explicitly.
            const swiped = panelEl;
            const persistentName = Object.keys(persistentPanels)
                .find(n => persistentPanels[n].el === swiped);
            swiped.style.transition = 'transform 0.3s cubic-bezier(.4,0,.2,1)';
            swiped.style.transform = 'translateY(100%)';
            setTimeout(() => {
                if (persistentName) togglePersistentPanel(persistentName, false);
                else closeAllPanels();
                swiped.style.transition = '';
                swiped.style.transform = '';
                panelEl = null;
            }, 300);
        } else {
            // Snap back
            panelEl.style.transition = 'transform 0.25s cubic-bezier(.4,0,.2,1)';
            panelEl.style.transform = '';
            setTimeout(() => {
                if (panelEl) {
                    panelEl.style.transition = '';
                    panelEl = null;
                }
            }, 250);
        }

        isDragging = false;
        startY = 0;
        currentY = 0;
    })
})();

/* =============================================================
   POMODORO TIMER
   ============================================================= */
let POMO_FOCUS = 25 * 60;
let POMO_BREAK = 5 * 60;
let POMO_LONG_BREAK = 15 * 60;
let pomoTime = POMO_FOCUS;
let pomoRunning = false;
let pomoInterval = null;
let pomoIsFocus = true;
let pomoSessions = 0;
let pomoSoundOn = true;
const pomoDisplay = document.getElementById('pomo-display');
const pomoLabel = document.getElementById('pomo-label');
const pomoRing = document.getElementById('pomo-ring-fill');
const pomoCircumference = 2 * Math.PI * 42;

pomoRing.style.strokeDasharray = pomoCircumference;

/* --- Web Audio chime (no external file needed) --- */
function playPomoChime() {
    if (!pomoSoundOn) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — major chord
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
            gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.18 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.18);
            osc.stop(ctx.currentTime + i * 0.18 + 0.8);
        });
        // Cleanup after sound finishes
        setTimeout(() => ctx.close(), 2000);
    } catch (e) {
        console.warn('Audio chime error:', e);
    }
}

/* --- Sound toggle --- */
const pomoSoundBtn = document.getElementById('pomo-sound-toggle');
const SOUND_ON_SVG = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />';
const SOUND_OFF_SVG = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />';

pomoSoundBtn.addEventListener('click', () => {
    pomoSoundOn = !pomoSoundOn;
    pomoSoundBtn.querySelector('svg').innerHTML = pomoSoundOn ? SOUND_ON_SVG : SOUND_OFF_SVG;
    pomoSoundBtn.title = pomoSoundOn ? 'Sound On' : 'Sound Off';
    pomoSoundBtn.classList.toggle('muted', !pomoSoundOn);
});

/* --- Settings panel toggle --- */
const pomoSettingsToggle = document.getElementById('pomo-settings-toggle');
const pomoCustomSettings = document.getElementById('pomo-custom-settings');
let pomoSettingsOpen = false;

pomoSettingsToggle.addEventListener('click', () => {
    pomoSettingsOpen = !pomoSettingsOpen;
    pomoCustomSettings.classList.toggle('open', pomoSettingsOpen);
    pomoSettingsToggle.classList.toggle('active', pomoSettingsOpen);
});

/* --- Stepper buttons (+/-) --- */
document.querySelectorAll('.pomo-stepper').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        const dir = parseInt(btn.dataset.dir);
        let val = parseInt(input.value) + dir;
        val = Math.max(parseInt(input.min), Math.min(parseInt(input.max), val));
        input.value = val;
    });
});

/* --- Presets --- */
function applyPomoTimes(focusMin, shortMin, longMin) {
    if (pomoRunning) return; // don't change while running
    POMO_FOCUS = focusMin * 60;
    POMO_BREAK = shortMin * 60;
    POMO_LONG_BREAK = longMin * 60;
    pomoIsFocus = true;
    pomoTime = POMO_FOCUS;
    pomoSessions = 0;
    pomoLabel.textContent = 'Focus Session';
    document.getElementById('pomo-start').textContent = 'Start';
    updatePomoDisplay();
    updatePomoDots();
    // Update custom inputs to reflect preset values
    document.getElementById('pomo-custom-focus').value = focusMin;
    document.getElementById('pomo-custom-short').value = shortMin;
    document.getElementById('pomo-custom-long').value = longMin;
}

document.querySelectorAll('.pomo-preset').forEach(btn => {
    btn.addEventListener('click', () => {
        if (pomoRunning) return;
        document.querySelectorAll('.pomo-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyPomoTimes(
            parseInt(btn.dataset.focus),
            parseInt(btn.dataset.short),
            parseInt(btn.dataset.long)
        );
    });
});

/* --- Apply custom --- */
document.getElementById('pomo-apply-custom').addEventListener('click', () => {
    if (pomoRunning) return;
    const focusMin = parseInt(document.getElementById('pomo-custom-focus').value) || 25;
    const shortMin = parseInt(document.getElementById('pomo-custom-short').value) || 5;
    const longMin = parseInt(document.getElementById('pomo-custom-long').value) || 15;
    // Deselect presets
    document.querySelectorAll('.pomo-preset').forEach(b => b.classList.remove('active'));
    applyPomoTimes(focusMin, shortMin, longMin);
    // Close settings
    pomoSettingsOpen = false;
    pomoCustomSettings.classList.remove('open');
    pomoSettingsToggle.classList.remove('active');
});

/* --- Display update --- */
function updatePomoDisplay() {
    const m = Math.floor(pomoTime / 60);
    const s = pomoTime % 60;
    pomoDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const total = pomoIsFocus ? POMO_FOCUS : (pomoSessions % 4 === 0 && pomoSessions > 0 ? POMO_LONG_BREAK : POMO_BREAK);
    const progress = 1 - (pomoTime / total);
    pomoRing.style.strokeDashoffset = pomoCircumference * (1 - progress);
}

updatePomoDisplay();

/* --- Start / Pause --- */
document.getElementById('pomo-start').addEventListener('click', function () {
    if (pomoRunning) {
        clearInterval(pomoInterval);
        pomoRunning = false;
        this.textContent = 'Resume';
    } else {
        pomoRunning = true;
        this.textContent = 'Pause';
        pomoInterval = setInterval(() => {
            pomoTime--;
            if (pomoTime < 0) {
                clearInterval(pomoInterval);
                pomoRunning = false;
                playPomoChime();

                // Flash the ring for visual feedback
                pomoRing.style.stroke = '#fff';
                setTimeout(() => { pomoRing.style.stroke = ''; }, 600);

                if (pomoIsFocus) {
                    pomoSessions++;
                    updatePomoDots();
                    pomoIsFocus = false;
                    pomoTime = (pomoSessions % 4 === 0) ? POMO_LONG_BREAK : POMO_BREAK;
                    pomoLabel.textContent = (pomoSessions % 4 === 0) ? 'Long Break' : 'Short Break';
                } else {
                    pomoIsFocus = true;
                    pomoTime = POMO_FOCUS;
                    pomoLabel.textContent = 'Focus Session';
                }
                document.getElementById('pomo-start').textContent = 'Start';
            }
            updatePomoDisplay();
        }, 1000);
    }
});

/* --- Reset --- */
document.getElementById('pomo-reset').addEventListener('click', () => {
    clearInterval(pomoInterval);
    pomoRunning = false;
    pomoIsFocus = true;
    pomoTime = POMO_FOCUS;
    pomoSessions = 0;
    pomoLabel.textContent = 'Focus Session';
    document.getElementById('pomo-start').textContent = 'Start';
    updatePomoDisplay();
    updatePomoDots();
});

function updatePomoDots() {
    const dots = document.querySelectorAll('.pomo-dot');
    dots.forEach((d, i) => {
        d.classList.toggle('filled', i < (pomoSessions % 5));
    });
}


/* =============================================================
   STOPWATCH
   ============================================================= */
let swTime = 0;
let swRunning = false;
let swInterval = null;
let swLaps = [];
const swDisplay = document.getElementById('sw-display');
const swLapsList = document.getElementById('sw-laps');

function formatSW(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}<span style="font-size:1.4rem;opacity:0.5">.${String(cs).padStart(2, '0')}</span>`;
}

function updateSWDisplay() {
    swDisplay.innerHTML = formatSW(swTime);
}

document.getElementById('sw-start').addEventListener('click', function () {
    if (swRunning) {
        clearInterval(swInterval);
        swRunning = false;
        this.textContent = 'Resume';
    } else {
        swRunning = true;
        this.textContent = 'Pause';
        const startAt = Date.now() - swTime;
        swInterval = setInterval(() => {
            swTime = Date.now() - startAt;
            updateSWDisplay();
        }, 30);
    }
});

document.getElementById('sw-lap').addEventListener('click', () => {
    if (swTime > 0) {
        swLaps.push(swTime);
        const lapEl = document.createElement('div');
        lapEl.style.padding = '0.15rem 0';
        lapEl.style.borderBottom = '1px solid var(--widget-border)';
        lapEl.textContent = `Lap ${swLaps.length}: ${String(Math.floor(swTime / 60000)).padStart(2, '0')}:${String(Math.floor((swTime % 60000) / 1000)).padStart(2, '0')}.${String(Math.floor((swTime % 1000) / 10)).padStart(2, '0')}`;
        swLapsList.prepend(lapEl);
    }
});

document.getElementById('sw-reset').addEventListener('click', () => {
    clearInterval(swInterval);
    swRunning = false;
    swTime = 0;
    swLaps = [];
    swLapsList.innerHTML = '';
    document.getElementById('sw-start').textContent = 'Start';
    updateSWDisplay();
});

/* =============================================================
   FIREWATCH OST PLAYER
   ============================================================= */
const OST_TRACKS = [
    { file: 'ost/Firewatch/01. Prologue.mp3', title: 'Prologue' },
    { file: 'ost/Firewatch/02. Stay in Your Tower and Watch.mp3', title: 'Stay in Your Tower and Watch' },
    { file: 'ost/Firewatch/03. Something\'s Wrong.mp3', title: "Something's Wrong" },
    { file: 'ost/Firewatch/04. Beartooth Point.mp3', title: 'Beartooth Point' },
    { file: 'ost/Firewatch/05. North Backcountry.mp3', title: 'North Backcountry' },
    { file: 'ost/Firewatch/06. Camp Approach.mp3', title: 'Camp Approach' },
    { file: 'ost/Firewatch/07. Canyon Sunset.mp3', title: 'Canyon Sunset' },
    { file: 'ost/Firewatch/08. Calm After the Storm.mp3', title: 'Calm After the Storm' },
    { file: 'ost/Firewatch/09. Conversation, Interrupted.mp3', title: 'Conversation, Interrupted' },
    { file: 'ost/Firewatch/10. Cottonwood Hike.mp3', title: 'Cottonwood Hike' },
    { file: 'ost/Firewatch/11. New Equipment.mp3', title: 'New Equipment' },
    { file: 'ost/Firewatch/12. Infiltration.mp3', title: 'Infiltration' },
    { file: 'ost/Firewatch/13. Exfiltration.mp3', title: 'Exfiltration' },
    { file: 'ost/Firewatch/14. Hidden Away.mp3', title: 'Hidden Away' },
    { file: 'ost/Firewatch/15. An Unfortunate Discovery.mp3', title: 'An Unfortunate Discovery' },
    { file: 'ost/Firewatch/16. Shoshone Overlook.mp3', title: 'Shoshone Overlook' },
    { file: 'ost/Firewatch/17. Thorofare Hike.mp3', title: 'Thorofare Hike' },
    { file: 'ost/Firewatch/18. Catching Up.mp3', title: 'Catching Up' },
    { file: 'ost/Firewatch/19. Ol\' Shoshone.mp3', title: "Ol' Shoshone" },
    { file: 'ost/Firewatch/Firewatch (2016) End Credits - I\'d Rather Go Blind by Etta James.mp3', title: "I'd Rather Go Blind — Etta James" },
];

const HK_TRACKS = [
    { file: 'ost/Hollow Knight/01. Enter Hallownest.mp3', title: 'Enter Hallownest' },
    { file: 'ost/Hollow Knight/02. Dirtmouth.mp3', title: 'Dirtmouth' },
    { file: 'ost/Hollow Knight/03. Crossroads.mp3', title: 'Crossroads' },
    { file: 'ost/Hollow Knight/04. False Knight.mp3', title: 'False Knight' },
    { file: 'ost/Hollow Knight/05. Greenpath.mp3', title: 'Greenpath' },
    { file: 'ost/Hollow Knight/06. Hornet.mp3', title: 'Hornet' },
    { file: 'ost/Hollow Knight/07. Reflection.mp3', title: 'Reflection' },
    { file: 'ost/Hollow Knight/08. Mantis Lords.mp3', title: 'Mantis Lords' },
    { file: 'ost/Hollow Knight/09. City of Tears.mp3', title: 'City of Tears' },
    { file: 'ost/Hollow Knight/10. Dung Defender.mp3', title: 'Dung Defender' },
    { file: 'ost/Hollow Knight/11. Crystal Peak.mp3', title: 'Crystal Peak' },
    { file: 'ost/Hollow Knight/12. Fungal Wastes.mp3', title: 'Fungal Wastes' },
    { file: 'ost/Hollow Knight/13. Decisive Battle.mp3', title: 'Decisive Battle' },
    { file: 'ost/Hollow Knight/14. Soul Sanctum.mp3', title: 'Soul Sanctum' },
    { file: 'ost/Hollow Knight/15. Resting Grounds.mp3', title: 'Resting Grounds' },
    { file: 'ost/Hollow Knight/16. Queen\'s Gardens.mp3', title: "Queen's Gardens" },
    { file: 'ost/Hollow Knight/17. The White Lady.mp3', title: 'The White Lady' },
    { file: 'ost/Hollow Knight/18. Broken Vessel.mp3', title: 'Broken Vessel' },
    { file: 'ost/Hollow Knight/19. Kingdom\'s Edge.mp3', title: "Kingdom's Edge" },
    { file: 'ost/Hollow Knight/20. Nosk.mp3', title: 'Nosk' },
    { file: 'ost/Hollow Knight/21. Dream.mp3', title: 'Dream' },
    { file: 'ost/Hollow Knight/22. Dream Battle.mp3', title: 'Dream Battle' },
    { file: 'ost/Hollow Knight/23. White Palace.mp3', title: 'White Palace' },
    { file: 'ost/Hollow Knight/24. Sealed Vessel.mp3', title: 'Sealed Vessel' },
    { file: 'ost/Hollow Knight/25. Radiance.mp3', title: 'Radiance' },
    { file: 'ost/Hollow Knight/26. Hollow Knight.mp3', title: 'Hollow Knight' },
];

const ostAudio = new Audio();
let ostCurrentIndex = 0;
let ostIsPlaying = false;
let ostShuffleOn = false;
let ostRepeatMode = 0; // 0 = off, 1 = all, 2 = one
let ostShuffleQueue = [];
let ostShufflePos = -1;

// DOM refs
const ostPlayBtn = document.getElementById('ost-play');
const ostPlayIcon = document.getElementById('ost-play-icon');
const ostPrevBtn = document.getElementById('ost-prev');
const ostNextBtn = document.getElementById('ost-next');
const ostShuffleBtn = document.getElementById('ost-shuffle');
const ostRepeatBtn = document.getElementById('ost-repeat');
const ostTrackName = document.getElementById('ost-track-name');
const ostTrackNumber = document.getElementById('ost-track-number');
const ostTimeCurrent = document.getElementById('ost-time-current');
const ostTimeTotal = document.getElementById('ost-time-total');
const ostProgressBar = document.getElementById('ost-progress-bar');
const ostProgressFill = document.getElementById('ost-progress-fill');
const ostProgressThumb = document.getElementById('ost-progress-thumb');
const ostVisualizer = document.getElementById('ost-visualizer');
const volumeSlider = document.getElementById('volume-slider');
const ostMusicBars = ostVisualizer.querySelectorAll('.music-bar');
const ostTracklistToggle = document.getElementById('ost-tracklist-toggle');
const tracklistToggleText = document.getElementById('tracklist-toggle-text');
const ostTracklist = document.getElementById('ost-tracklist');
const lofiTracklist = document.getElementById('lofi-tracklist');
const hkTracklist = document.getElementById('hk-tracklist');

const PLAY_SVG = '<polygon points="6,3 20,12 6,21" />';
const PAUSE_SVG = '<rect x="5" y="3" width="5" height="18" rx="1" /><rect x="14" y="3" width="5" height="18" rx="1" />';

// --- Build track list UI ---
OST_TRACKS.forEach((track, idx) => {
    const item = document.createElement('div');
    item.className = 'ost-tracklist-item';
    item.dataset.index = idx;
    item.innerHTML = `<span class="ost-tl-num">${String(idx + 1).padStart(2, '0')}</span><span class="ost-tl-title">${track.title}</span>`;
    item.addEventListener('click', () => { loadTrack(idx); playTrack(); });
    ostTracklist.appendChild(item);
});

// --- Tracklist toggle ---
let tracklistOpen = false;
ostTracklistToggle.addEventListener('click', () => {
    tracklistOpen = !tracklistOpen;
    ostTracklist.classList.toggle('open', tracklistOpen);
    lofiTracklist.classList.toggle('open', tracklistOpen);
    hkTracklist.classList.toggle('open', tracklistOpen);
    ostTracklistToggle.classList.toggle('open', tracklistOpen);
});

// --- Helpers ---
function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

function highlightTracklistItem() {
    ostTracklist.querySelectorAll('.ost-tracklist-item').forEach((el, i) => {
        el.classList.toggle('active', i === ostCurrentIndex);
    });
}

function generateShuffleQueue() {
    ostShuffleQueue = [...Array(OST_TRACKS.length).keys()];
    // Fisher-Yates shuffle
    for (let i = ostShuffleQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ostShuffleQueue[i], ostShuffleQueue[j]] = [ostShuffleQueue[j], ostShuffleQueue[i]];
    }
    // Place current track at front
    const curIdx = ostShuffleQueue.indexOf(ostCurrentIndex);
    if (curIdx > 0) {
        [ostShuffleQueue[0], ostShuffleQueue[curIdx]] = [ostShuffleQueue[curIdx], ostShuffleQueue[0]];
    }
    ostShufflePos = 0;
}

// --- HK Track List UI ---
let hkCurrentIndex = 0;

HK_TRACKS.forEach((track, idx) => {
    const item = document.createElement('div');
    item.className = 'ost-tracklist-item';
    item.dataset.index = idx;
    item.innerHTML = `<span class="ost-tl-num">${String(idx + 1).padStart(2, '0')}</span><span class="ost-tl-title">${track.title}</span>`;
    item.addEventListener('click', () => {
        if (musicMode !== 'hollow-knight') return;
        loadHKTrack(idx);
        playTrack();
    });
    hkTracklist.appendChild(item);
});

function highlightHKTracklistItem() {
    hkTracklist.querySelectorAll('.ost-tracklist-item').forEach((el, i) => {
        el.classList.toggle('active', i === hkCurrentIndex);
    });
}

function loadHKTrack(index) {
    hkCurrentIndex = index;
    const track = HK_TRACKS[index];
    ostAudio.src = track.file;
    ostTrackName.textContent = track.title;
    ostTrackNumber.textContent = `${index + 1} / ${HK_TRACKS.length}`;
    highlightHKTracklistItem();

    if (musicMode === 'hollow-knight') {
        lofiStatusText.textContent = "Now Playing";
        updateTrackNameDisplay(track.title);
    }
}

// --- Load & Play ---
function loadTrack(index) {
    ostCurrentIndex = index;
    const track = OST_TRACKS[index];
    ostAudio.src = track.file;
    ostTrackName.textContent = track.title;
    ostTrackNumber.textContent = `${index + 1} / ${OST_TRACKS.length}`;
    highlightTracklistItem();

    // Sync top-left widget if in OST mode
    if (musicMode === 'ost') {
        lofiStatusText.textContent = "Now Playing";
        updateTrackNameDisplay(track.title);
    }
}

function playTrack() {
    ostAudio.play().then(() => {
        ostIsPlaying = true;
        ostPlayIcon.innerHTML = PAUSE_SVG;
        ostMusicBars.forEach(b => b.classList.add('playing'));

        // Sync top-left widget
        if (musicMode === 'ost' || musicMode === 'hollow-knight') {
            lofiStatusText.textContent = "Now Playing";
            lofiWidget.classList.add('playing');
        }
    }).catch(e => console.warn('Audio play error:', e));
}

function pauseTrack() {
    ostAudio.pause();
    ostIsPlaying = false;
    ostPlayIcon.innerHTML = PLAY_SVG;
    ostMusicBars.forEach(b => b.classList.remove('playing'));

    // Sync top-left widget
    if (musicMode === 'ost' || musicMode === 'hollow-knight') {
        lofiStatusText.textContent = "Paused";
        lofiWidget.classList.remove('playing');
    }
}

function nextTrack() {
    if (musicMode === 'lofi') {
        let nextIdx = lofiCurrentIndex + 1;
        if (nextIdx >= LOFI_STATIONS.length) nextIdx = 0;
        loadLofiStation(nextIdx);
        if (lofiIsPlaying) playLofi();
        return;
    }

    if (musicMode === 'hollow-knight') {
        let nextIdx = hkCurrentIndex + 1;
        if (nextIdx >= HK_TRACKS.length) {
            if (ostRepeatMode >= 1) nextIdx = 0;
            else { pauseTrack(); return; }
        }
        loadHKTrack(nextIdx);
        playTrack();
        return;
    }

    let nextIdx;
    if (ostShuffleOn) {
        ostShufflePos++;
        if (ostShufflePos >= ostShuffleQueue.length) {
            if (ostRepeatMode >= 1) {
                generateShuffleQueue();
                ostShufflePos = 0;
            } else {
                pauseTrack();
                return;
            }
        }
        nextIdx = ostShuffleQueue[ostShufflePos];
    } else {
        nextIdx = ostCurrentIndex + 1;
        if (nextIdx >= OST_TRACKS.length) {
            if (ostRepeatMode >= 1) {
                nextIdx = 0;
            } else {
                pauseTrack();
                return;
            }
        }
    }
    loadTrack(nextIdx);
    playTrack();
}

function prevTrack() {
    if (musicMode === 'lofi') {
        let prevIdx = lofiCurrentIndex - 1;
        if (prevIdx < 0) prevIdx = LOFI_STATIONS.length - 1;
        loadLofiStation(prevIdx);
        if (lofiIsPlaying) playLofi();
        return;
    }

    if (musicMode === 'hollow-knight') {
        if (ostAudio.currentTime > 3) {
            ostAudio.currentTime = 0;
            return;
        }
        let prevIdx = hkCurrentIndex - 1;
        if (prevIdx < 0) prevIdx = HK_TRACKS.length - 1;
        loadHKTrack(prevIdx);
        playTrack();
        return;
    }

    // If more than 3 seconds in, restart current track
    if (ostAudio.currentTime > 3) {
        ostAudio.currentTime = 0;
        return;
    }
    let prevIdx;
    if (ostShuffleOn) {
        ostShufflePos--;
        if (ostShufflePos < 0) ostShufflePos = 0;
        prevIdx = ostShuffleQueue[ostShufflePos];
    } else {
        prevIdx = ostCurrentIndex - 1;
        if (prevIdx < 0) prevIdx = OST_TRACKS.length - 1;
    }
    loadTrack(prevIdx);
    playTrack();
}

// --- Event Listeners ---
// ostPlayBtn listener moved to dual-mode handler below

ostNextBtn.addEventListener('click', nextTrack);
ostPrevBtn.addEventListener('click', prevTrack);

// Shuffle toggle
ostShuffleBtn.addEventListener('click', () => {
    ostShuffleOn = !ostShuffleOn;
    ostShuffleBtn.classList.toggle('active', ostShuffleOn);
    if (ostShuffleOn) generateShuffleQueue();
});

// Repeat toggle: off → all → one → off
ostRepeatBtn.addEventListener('click', () => {
    ostRepeatMode = (ostRepeatMode + 1) % 3;
    ostRepeatBtn.classList.toggle('active', ostRepeatMode > 0);
    ostRepeatBtn.classList.toggle('repeat-one', ostRepeatMode === 2);
    // Visual feedback
    if (ostRepeatMode === 0) ostRepeatBtn.title = 'Repeat: Off';
    else if (ostRepeatMode === 1) ostRepeatBtn.title = 'Repeat: All';
    else ostRepeatBtn.title = 'Repeat: One';
});

// Track ended — auto-advance
ostAudio.addEventListener('ended', () => {
    if (ostRepeatMode === 2) {
        ostAudio.currentTime = 0;
        playTrack();
    } else {
        nextTrack();
    }
});

// Progress update
ostAudio.addEventListener('timeupdate', () => {
    if (!ostAudio.duration) return;
    const pct = (ostAudio.currentTime / ostAudio.duration) * 100;
    ostProgressFill.style.width = `${pct}%`;
    ostProgressThumb.style.left = `${pct}%`;
    ostTimeCurrent.textContent = formatTime(ostAudio.currentTime);
});

ostAudio.addEventListener('loadedmetadata', () => {
    ostTimeTotal.textContent = formatTime(ostAudio.duration);
});

// Seeking via progress bar
let ostSeeking = false;
function seekFromEvent(e) {
    const rect = ostProgressBar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (ostAudio.duration) {
        ostAudio.currentTime = pct * ostAudio.duration;
    }
}
ostProgressBar.addEventListener('mousedown', (e) => {
    ostSeeking = true;
    seekFromEvent(e);
});
window.addEventListener('mousemove', (e) => { if (ostSeeking) seekFromEvent(e); });
window.addEventListener('mouseup', () => { ostSeeking = false; });

// Volume — applied to both players so switching modes doesn't jump in loudness
function applyVolume() {
    const vol = parseInt(volumeSlider.value) / 100;
    ostAudio.volume = vol;
    lofiAudio.volume = vol;
}
volumeSlider.addEventListener('input', applyVolume);

// A missing or unreadable track shouldn't fail silently
ostAudio.addEventListener('error', () => {
    if (!ostAudio.getAttribute('src')) return;   // ignore the empty-src case
    console.warn('Track failed to load:', ostAudio.src);
    ostTrackName.textContent = 'Track unavailable';
    ostIsPlaying = false;
    ostPlayIcon.innerHTML = PLAY_SVG;
    ostMusicBars.forEach(b => b.classList.remove('playing'));
    lofiWidget.classList.remove('playing');
});

/* =============================================================
   LOFI RADIO (Direct HTML5 Audio Stream)
   ============================================================= */
const LOFI_STATIONS = [
    { title: "Lofi Girl (Community Relay)", file: "https://play.streamafrica.net/lofiradio" },
    { title: "Laut.FM | Lofi 24/7", file: "https://lofi.stream.laut.fm/lofi" },
    { title: "Zeno FM | Study Lofi", file: "https://stream.zeno.fm/f3wvbbqmdg8uv" },
    { title: "Zeno FM | Chill Beats", file: "https://stream.zeno.fm/0r0xa792kwzuv" },
    { title: "Fastcast4u | Chill Lofi", file: "http://usa9.fastcast4u.com/proxy/jamz?mp=/1" },
    { title: "FluxFM | Chillhop", file: "https://channels.fluxfm.de/chillhop/externalembedflxhp/stream.mp3" },
    { title: "Nightride FM | Chillsynth (Hi-Res AAC)", file: "https://stream.nightride.fm/chillsynth.m4a" },
    { title: "SomaFM | Secret Agent", file: "https://ice1.somafm.com/secretagent-128-aac" },
    { title: "SomaFM | Deep Space One (Deep Ambient)", file: "https://ice1.somafm.com/deepspaceone-128-aac" },
    { title: "SomaFM | Groove Salad", file: "https://ice1.somafm.com/groovesalad-256-mp3" },
    { title: "SomaFM | Drone Zone", file: "https://ice1.somafm.com/dronezone-256-mp3" },
    { title: "SomaFM | DEF CON Radio", file: "https://ice1.somafm.com/defcon-128-aac" },
    { title: "SomaFM | Space Station", file: "https://ice1.somafm.com/spacestation-128-aac" },
    { title: "SomaFM | Vaporwaves", file: "https://ice1.somafm.com/vaporwaves-128-aac" },
    { title: "SomaFM | Synphaera", file: "https://ice1.somafm.com/synphaera-128-aac" },
    { title: "Intense Radio | Chillout (Lossless OGG)", file: "http://secure.live-streams.nl/flac.ogg" },
    { title: "Radio Paradise | Mellow Mix (FLAC Lossless)", file: "http://stream.radioparadise.com/mellow-flac" }
];

let lofiCurrentIndex = 0;
const lofiAudio = new Audio(LOFI_STATIONS[lofiCurrentIndex].file);
/* No crossOrigin: it is only needed to read samples via Web Audio, which this
   player never does (the visualiser is CSS). Setting it made the browser
   require Access-Control-Allow-Origin, which most Icecast/Shoutcast radio
   servers do not send — so the stream simply failed to load. */
lofiAudio.preload = 'none';   // don't open a connection until asked to play
let lofiIsPlaying = false;
let musicMode = 'ost'; // 'ost', 'lofi', or 'hollow-knight'

// DOM Elements
const modeOstBtn = document.getElementById('mode-ost');
const modeLofiBtn = document.getElementById('mode-lofi');
const modeHKBtn = document.getElementById('mode-hk');
const lofiWidget = document.getElementById('lofi-widget');
const lofiStatusText = document.getElementById('lofi-status');
const lofiTrackName = document.getElementById('lofi-track-name');
const lofiTrackNameDup = document.getElementById('lofi-track-name-dup'); // The duplicate span for looping
const musicPanelTitle = document.getElementById('music-panel-title');

// Both players start at the slider's value — otherwise the radio played at
// 100% while the OST was at 60%, a jump every time you switched modes.
applyVolume();

// Helper to update both spans for the seamless marquee
function updateTrackNameDisplay(text) {
    if (lofiTrackName) lofiTrackName.textContent = text;
    if (lofiTrackNameDup) lofiTrackNameDup.textContent = text;
}

/* A radio stream can 404 up front or simply die mid-play. Without this the UI
   sat on "Live Now" forever with silence. Report it, and offer the next one. */
lofiAudio.addEventListener('error', () => {
    if (!lofiAudio.getAttribute('src')) return;
    console.warn('Lofi stream failed:', lofiAudio.src);
    lofiIsPlaying = false;
    lofiWidget.classList.remove('playing');
    ostMusicBars.forEach(b => b.classList.remove('playing'));
    if (musicMode === 'lofi') {
        ostPlayIcon.innerHTML = PLAY_SVG;
        lofiStatusText.textContent = 'Stream Offline';
        updateTrackNameDisplay(`${LOFI_STATIONS[lofiCurrentIndex].title} is unavailable — try another station`);
    }
});

// Dropped connection mid-listen: the element stalls rather than erroring
lofiAudio.addEventListener('stalled', () => {
    if (musicMode === 'lofi' && lofiIsPlaying) lofiStatusText.textContent = 'Reconnecting…';
});
lofiAudio.addEventListener('playing', () => {
    if (musicMode === 'lofi') lofiStatusText.textContent = 'Live Now';
});

// --- Build Lofi track list UI ---
LOFI_STATIONS.forEach((station, idx) => {
    const item = document.createElement('div');
    item.className = 'ost-tracklist-item'; // Reuse class for styling
    item.dataset.index = idx;
    item.innerHTML = `<span class="ost-tl-num">${String(idx + 1).padStart(2, '0')}</span><span class="ost-tl-title">${station.title}</span>`;
    item.addEventListener('click', () => {
        if (musicMode !== 'lofi') return;
        loadLofiStation(idx);
        playLofi();
    });
    lofiTracklist.appendChild(item);
});

function highlightLofiItem() {
    lofiTracklist.querySelectorAll('.ost-tracklist-item').forEach((el, i) => {
        el.classList.toggle('active', i === lofiCurrentIndex);
    });
}
// Init highlight
highlightLofiItem();

function loadLofiStation(index) {
    lofiCurrentIndex = index;
    const station = LOFI_STATIONS[index];
    lofiAudio.src = station.file;
    highlightLofiItem();

    if (musicMode === 'lofi') {
        lofiStatusText.textContent = lofiIsPlaying ? "Live Now" : "Radio Ready";
        updateTrackNameDisplay(station.title);
    }
}

function playLofi() {
    lofiStatusText.textContent = "Connecting...";
    lofiAudio.play().then(() => {
        lofiIsPlaying = true;
        lofiStatusText.textContent = "Live Now";
        lofiWidget.classList.add('playing');
        ostPlayIcon.innerHTML = PAUSE_SVG;
        ostMusicBars.forEach(b => b.classList.add('playing'));
    }).catch(e => {
        console.warn("Lofi Stream Error: ", e);
        lofiStatusText.textContent = "Stream Offline";
        updateTrackNameDisplay("Connection failed. Please try again later.");
    });
}

function pauseLofi() {
    lofiAudio.pause();
    lofiIsPlaying = false;
    lofiStatusText.textContent = "Paused";
    lofiWidget.classList.remove('playing');
    ostPlayIcon.innerHTML = PLAY_SVG;
    ostMusicBars.forEach(b => b.classList.remove('playing'));
}

// Mode Switching Logic
modeOstBtn.addEventListener('click', () => {
    if (musicMode === 'ost') return;
    const wasHK = musicMode === 'hollow-knight';
    musicMode = 'ost';
    modeOstBtn.classList.add('active');
    modeLofiBtn.classList.remove('active');
    modeHKBtn.classList.remove('active');
    musicPanelTitle.textContent = "Firewatch OST";
    document.getElementById('music-panel').classList.remove('lofi-mode');
    document.getElementById('music-panel').classList.remove('hk-mode');

    // Update Tracklist Toggle Button
    if (tracklistToggleText) {
        tracklistToggleText.textContent = "Track List";
    }

    // Stop Lofi if playing
    if (lofiIsPlaying) {
        pauseLofi();
    }

    // Coming from HK mode: pause and restore OST audio src
    if (wasHK) {
        if (ostIsPlaying) pauseTrack();
        if (OST_TRACKS[ostCurrentIndex]) {
            ostAudio.src = OST_TRACKS[ostCurrentIndex].file;
            ostTrackName.textContent = OST_TRACKS[ostCurrentIndex].title;
            ostTrackNumber.textContent = `${ostCurrentIndex + 1} / ${OST_TRACKS.length}`;
            highlightTracklistItem();
        }
        ostIsPlaying = false;
    }

    // Sync UI based on OST state
    ostPlayIcon.innerHTML = ostIsPlaying ? PAUSE_SVG : PLAY_SVG;
    ostMusicBars.forEach(b => b.classList.toggle('playing', ostIsPlaying));

    // Update top-left widget
    lofiStatusText.textContent = ostIsPlaying ? "Now Playing" : "Paused";
    if (OST_TRACKS[ostCurrentIndex]) {
        updateTrackNameDisplay(OST_TRACKS[ostCurrentIndex].title);
    }
    lofiWidget.classList.toggle('playing', ostIsPlaying);
});

modeLofiBtn.addEventListener('click', () => {
    if (musicMode === 'lofi') return;
    musicMode = 'lofi';
    modeLofiBtn.classList.add('active');
    modeOstBtn.classList.remove('active');
    modeHKBtn.classList.remove('active');
    musicPanelTitle.textContent = "Lofi Live Radio";
    document.getElementById('music-panel').classList.add('lofi-mode');
    document.getElementById('music-panel').classList.remove('hk-mode');

    // Update Tracklist Toggle Button
    if (tracklistToggleText) {
        tracklistToggleText.textContent = "Station List";
    }

    // Stop OST or HK if playing
    if (ostIsPlaying) {
        pauseTrack();
    }

    // Sync UI based on Lofi state
    ostPlayIcon.innerHTML = lofiIsPlaying ? PAUSE_SVG : PLAY_SVG;
    ostMusicBars.forEach(b => b.classList.toggle('playing', lofiIsPlaying));

    // Update top-left widget
    lofiStatusText.textContent = lofiIsPlaying ? "Live Now" : "Radio Ready";
    updateTrackNameDisplay(LOFI_STATIONS[lofiCurrentIndex].title);
    lofiWidget.classList.toggle('playing', lofiIsPlaying);
});

modeHKBtn.addEventListener('click', () => {
    if (musicMode === 'hollow-knight') return;
    musicMode = 'hollow-knight';
    modeHKBtn.classList.add('active');
    modeOstBtn.classList.remove('active');
    modeLofiBtn.classList.remove('active');
    musicPanelTitle.textContent = "Hollow Knight OST";
    document.getElementById('music-panel').classList.remove('lofi-mode');
    document.getElementById('music-panel').classList.add('hk-mode');

    // Update Tracklist Toggle Button
    if (tracklistToggleText) {
        tracklistToggleText.textContent = "Track List";
    }

    // Stop OST or Lofi if playing
    if (ostIsPlaying) pauseTrack();
    if (lofiIsPlaying) pauseLofi();
    ostIsPlaying = false;

    // Load the current HK track into the audio element and update UI
    if (HK_TRACKS[hkCurrentIndex]) {
        ostAudio.src = HK_TRACKS[hkCurrentIndex].file;
        ostTrackName.textContent = HK_TRACKS[hkCurrentIndex].title;
        ostTrackNumber.textContent = `${hkCurrentIndex + 1} / ${HK_TRACKS.length}`;
        highlightHKTracklistItem();
    } else {
        ostTrackName.textContent = "No track selected";
        ostTrackNumber.textContent = "— / —";
    }

    ostPlayIcon.innerHTML = PLAY_SVG;
    ostMusicBars.forEach(b => b.classList.remove('playing'));

    // Update top-left widget
    lofiStatusText.textContent = "Hollow Knight";
    updateTrackNameDisplay(HK_TRACKS[hkCurrentIndex] ? HK_TRACKS[hkCurrentIndex].title : "Select a track");
    lofiWidget.classList.remove('playing');
});

// Overriding main play button for multi-mode
ostPlayBtn.addEventListener('click', () => {
    if (musicMode === 'ost') {
        // Handle OST Play/Pause
        if (!ostAudio.src || ostAudio.src === window.location.href) {
            loadTrack(0);
            if (ostShuffleOn) generateShuffleQueue();
            playTrack();
        } else if (ostIsPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    } else if (musicMode === 'hollow-knight') {
        // Handle HK Play/Pause
        if (!ostAudio.src || ostAudio.src === window.location.href) {
            loadHKTrack(0);
            playTrack();
        } else if (ostIsPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    } else {
        // Handle Lofi Play/Pause (Direct Audio)
        if (lofiIsPlaying) {
            pauseLofi();
        } else {
            playLofi();
        }
    }
});

/* =============================================================
   FIREFLY PARTICLE SYSTEM
   ============================================================= */
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Firefly {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 1;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = 0;
        this.targetOpacity = Math.random() * 0.6 + 0.2;
        this.fadeSpeed = Math.random() * 0.008 + 0.003;
        this.fadingIn = true;
        this.life = Math.random() * 400 + 200;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.fadingIn) {
            this.opacity += this.fadeSpeed;
            if (this.opacity >= this.targetOpacity) this.fadingIn = false;
        } else {
            this.life--;
            if (this.life <= 0) {
                this.opacity -= this.fadeSpeed * 2;
                if (this.opacity <= 0) this.reset();
            }
        }
    }

    draw() {
        const cs = getComputedStyle(document.documentElement);
        const color = cs.getPropertyValue('--particle-color').trim() || 'rgba(255,180,100,0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(/[\d.]+\)$/, `${this.opacity})`);
        ctx.shadowBlur = this.size * 6;
        ctx.shadowColor = color.replace(/[\d.]+\)$/, `${this.opacity * 0.8})`);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

for (let i = 0; i < 35; i++) {
    particles.push(new Firefly());
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
}
animateParticles();

/* Keyboard shortcuts removed — as a desktop background this page never holds
   keyboard focus, so every binding was dead code. Use the toolbar instead. */

/* =============================================================
   FULLSCREEN TOGGLE
   ============================================================= */
const fullscreenBtn = document.getElementById('btn-fullscreen');
const fullscreenIcon = document.getElementById('fullscreen-icon');

const FS_EXPAND_SVG = '<polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />';
const FS_CONTRACT_SVG = '<polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />';

function updateFullscreenIcon() {
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    fullscreenIcon.innerHTML = isFS ? FS_CONTRACT_SVG : FS_EXPAND_SVG;
    fullscreenBtn.title = isFS ? 'Exit Fullscreen' : 'Fullscreen';
}

fullscreenBtn.addEventListener('click', () => {
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    if (!isFS) {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
});

document.addEventListener('fullscreenchange', updateFullscreenIcon);
document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
document.addEventListener('MSFullscreenChange', updateFullscreenIcon);

/* =============================================================
   FOCUS TRACKER
   Records deep-focus sessions independently of the Pomodoro, with
   momentary-interruption markers. Persisted to localStorage so the
   log survives refreshes and can be exported later.
   ============================================================= */
const FOCUS_KEY = 'fw-focus-log-v1';
const FOCUS_STALE_MS = 6 * 60 * 60 * 1000;  // a session left open longer than this is abandoned
const FOCUS_CHART_DAYS = 14;
const FOCUS_CHART_MAX_H = 46;               // px — chart box is 52px tall

const focusPanel = document.getElementById('focus-panel');
const btnFocus = document.getElementById('btn-focus');
const focusDisplayEl = document.getElementById('focus-display');
const focusStateEl = document.getElementById('focus-state');
const focusLabelInput = document.getElementById('focus-label-input');
const focusStartBtn = document.getElementById('focus-start');
const focusStopBtn = document.getElementById('focus-stop');
const focusInterruptBtn = document.getElementById('focus-interrupt');
const focusChartEl = document.getElementById('focus-chart');
const focusPeakEl = document.getElementById('focus-chart-peak');
const focusClearBtn = document.getElementById('focus-clear');

let focusStore = { version: 1, lastLabel: '', sessions: [] };
let focusStorageOK = true;
let focusTick = null;
let focusTickCount = 0;

/* --- Persistence --- */
function loadFocusStore() {
    try {
        const raw = localStorage.getItem(FOCUS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.sessions)) {
            focusStore = {
                version: 1,
                lastLabel: typeof parsed.lastLabel === 'string' ? parsed.lastLabel : '',
                sessions: parsed.sessions
                    .filter(s => s && typeof s.start === 'number')
                    .map(s => ({
                        id: s.id || s.start,
                        start: s.start,
                        end: typeof s.end === 'number' ? s.end : null,
                        label: typeof s.label === 'string' ? s.label : '',
                        interruptions: Array.isArray(s.interruptions) ? s.interruptions : [],
                        abandoned: !!s.abandoned,
                    }))
                    .sort((a, b) => a.start - b.start),
            };
        }
    } catch (e) {
        // Private mode / disabled storage — fall back to in-memory only
        console.warn('Focus log unavailable, running in memory:', e);
        focusStorageOK = false;
    }
}

function saveFocusStore() {
    if (!focusStorageOK) return;
    try {
        localStorage.setItem(FOCUS_KEY, JSON.stringify(focusStore));
    } catch (e) {
        console.warn('Focus log could not be saved:', e);
        focusStorageOK = false;
    }
}

/* --- Helpers --- */
function activeFocusSession() {
    const last = focusStore.sessions[focusStore.sessions.length - 1];
    return (last && last.end === null && !last.abandoned) ? last : null;
}

function focusDuration(s, now) {
    if (s.abandoned) return 0;
    const end = s.end === null ? (now || Date.now()) : s.end;
    return Math.max(0, end - s.start);
}

function fmtFocusClock(ms) {
    const t = Math.floor(Math.max(0, ms) / 1000);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtFocusDuration(ms) {
    const mins = Math.round(Math.max(0, ms) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function focusStartOfDay(ts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function fmtFocusDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtFocusTime(d) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

/* --- Actions --- */
function startFocus() {
    if (activeFocusSession()) return;
    const now = Date.now();
    const label = focusLabelInput.value.trim();
    focusStore.lastLabel = label;
    focusStore.sessions.push({
        id: now, start: now, end: null,
        label, interruptions: [], abandoned: false,
    });
    saveFocusStore();
    startFocusTick();
    syncFocusUI();
}

function stopFocus() {
    const s = activeFocusSession();
    if (!s) return;
    s.end = Date.now();
    saveFocusStore();
    stopFocusTick();
    syncFocusUI();
}

function markInterruption() {
    const s = activeFocusSession();
    if (!s) return;
    s.interruptions.push(Date.now());
    saveFocusStore();
    renderFocusLive();
    // Brief visual confirmation — the button is tapped in a hurry
    focusInterruptBtn.classList.add('logged');
    setTimeout(() => focusInterruptBtn.classList.remove('logged'), 350);
}

function startFocusTick() {
    if (focusTick) return;
    focusTickCount = 0;
    focusTick = setInterval(() => {
        renderFocusLive();
        renderFocusStats();
        // Chart only needs the occasional refresh while a session runs
        if (++focusTickCount % 60 === 0) renderFocusChart();
    }, 1000);
}

function stopFocusTick() {
    clearInterval(focusTick);
    focusTick = null;
}

/* --- Stats --- */
function computeFocusStats() {
    const now = Date.now();
    const todayStart = focusStartOfDay(now);
    const weekStart = focusStartOfDay(now - 6 * 86400000);

    let todayMs = 0, weekMs = 0, todaySessions = 0, todayIntr = 0;
    focusStore.sessions.forEach(s => {
        if (s.abandoned) return;
        const dur = focusDuration(s, now);
        if (s.start >= weekStart) weekMs += dur;
        if (s.start >= todayStart) {
            todayMs += dur;
            todaySessions++;
            todayIntr += s.interruptions.length;
        }
    });

    return {
        todayMs, weekMs, todaySessions, todayIntr,
        avgMs: todaySessions ? todayMs / todaySessions : 0,
        rate: todayMs > 0 ? todayIntr / (todayMs / 3600000) : 0,
    };
}

function focusDailyTotals(days) {
    const now = Date.now();
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        buckets.push({ start: d.getTime(), end: next.getTime(), date: new Date(d), ms: 0 });
    }
    // A session counts toward the day it started on
    focusStore.sessions.forEach(s => {
        if (s.abandoned) return;
        const b = buckets.find(b => s.start >= b.start && s.start < b.end);
        if (b) b.ms += focusDuration(s, now);
    });
    return buckets;
}

/* --- Rendering --- */
function focusIdleStateText() {
    for (let i = focusStore.sessions.length - 1; i >= 0; i--) {
        const s = focusStore.sessions[i];
        if (s.abandoned || s.end === null) continue;
        const n = s.interruptions.length;
        return `Last: ${fmtFocusDuration(s.end - s.start)}` +
            (n ? ` · ${n} interruption${n === 1 ? '' : 's'}` : ' · uninterrupted');
    }
    return 'Ready';
}

function renderFocusLive() {
    const s = activeFocusSession();
    if (!s) return;
    const n = s.interruptions.length;
    focusDisplayEl.textContent = fmtFocusClock(focusDuration(s));
    focusStateEl.textContent = n
        ? `Recording · ${n} interruption${n === 1 ? '' : 's'}`
        : 'Recording';
}

function renderFocusStats() {
    const st = computeFocusStats();
    document.getElementById('focus-stat-today').textContent = fmtFocusDuration(st.todayMs);
    document.getElementById('focus-stat-week').textContent = fmtFocusDuration(st.weekMs);
    document.getElementById('focus-stat-sessions').textContent = String(st.todaySessions);
    document.getElementById('focus-stat-avg').textContent = st.todaySessions ? fmtFocusDuration(st.avgMs) : '—';

    const intrEl = document.getElementById('focus-stat-intr');
    if (!st.todaySessions) {
        intrEl.textContent = 'No focus sessions logged today';
    } else if (st.todayIntr === 0) {
        intrEl.textContent = 'No interruptions today — clean run';
    } else {
        intrEl.textContent = `${st.todayIntr} interruption${st.todayIntr === 1 ? '' : 's'} today · ${st.rate.toFixed(1)}/hr`;
    }
}

function renderFocusChart() {
    const buckets = focusDailyTotals(FOCUS_CHART_DAYS);
    const max = buckets.reduce((m, b) => Math.max(m, b.ms), 0);

    focusChartEl.innerHTML = '';
    buckets.forEach((b, i) => {
        const bar = document.createElement('div');
        bar.className = 'focus-chart-bar';
        if (i === buckets.length - 1) bar.classList.add('today');
        if (b.ms <= 0) {
            bar.classList.add('empty');
            bar.style.height = '2px';
        } else {
            bar.style.height = `${Math.max(3, Math.round((b.ms / max) * FOCUS_CHART_MAX_H))}px`;
        }
        const day = b.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
        bar.title = `${day} · ${b.ms > 0 ? fmtFocusDuration(b.ms) : 'no focus'}`;
        focusChartEl.appendChild(bar);
    });

    focusPeakEl.textContent = max > 0 ? `peak ${fmtFocusDuration(max)}` : 'no data yet';
}

function syncFocusUI() {
    const running = !!activeFocusSession();

    focusStartBtn.disabled = running;
    focusStopBtn.disabled = !running;
    focusInterruptBtn.disabled = !running;
    focusLabelInput.disabled = running;
    focusStateEl.classList.toggle('recording', running);
    btnFocus.classList.toggle('running', running);

    if (running) {
        renderFocusLive();
    } else {
        focusDisplayEl.textContent = '00:00:00';
        focusStateEl.textContent = focusIdleStateText();
    }

    renderFocusStats();
    renderFocusChart();
}

/* --- Export --- */
function focusCsvCell(v) {
    const s = String(v == null ? '' : v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadFocusFile(text, filename, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportFocusCSV() {
    const head = ['session_id', 'date', 'start_time', 'end_time', 'duration_minutes',
        'label', 'interruption_count', 'interruption_offsets_minutes', 'abandoned'];

    const rows = focusStore.sessions.map(s => {
        const startDate = new Date(s.start);
        const offsets = s.interruptions
            .map(t => ((t - s.start) / 60000).toFixed(1))
            .join(' ');
        return [
            s.id,
            fmtFocusDate(startDate),
            fmtFocusTime(startDate),
            s.end === null ? '' : fmtFocusTime(new Date(s.end)),
            s.end === null ? '' : ((s.end - s.start) / 60000).toFixed(2),
            s.label,
            s.interruptions.length,
            offsets,
            s.abandoned ? 'yes' : 'no',
        ].map(focusCsvCell).join(',');
    });

    // BOM so Excel reads UTF-8 labels correctly
    downloadFocusFile('﻿' + [head.join(','), ...rows].join('\r\n'),
        `focus-log-${fmtFocusDate(new Date())}.csv`, 'text/csv;charset=utf-8;');
}

function exportFocusJSON() {
    downloadFocusFile(JSON.stringify(focusStore, null, 2),
        `focus-log-${fmtFocusDate(new Date())}.json`, 'application/json');
}

/* --- Clear (two-step, no browser dialog) --- */
let focusClearArmed = null;

function clearFocusHistory() {
    if (!focusClearArmed) {
        focusClearArmed = setTimeout(() => {
            focusClearArmed = null;
            focusClearBtn.textContent = 'Clear';
            focusClearBtn.classList.remove('armed');
        }, 3000);
        focusClearBtn.textContent = 'Sure?';
        focusClearBtn.classList.add('armed');
        return;
    }

    clearTimeout(focusClearArmed);
    focusClearArmed = null;
    focusClearBtn.textContent = 'Clear';
    focusClearBtn.classList.remove('armed');

    stopFocusTick();
    focusStore.sessions = [];
    saveFocusStore();
    syncFocusUI();
}

/* Panel visibility is handled by the shared persistent-panel registry above */
document.getElementById('focus-close').addEventListener('click', () => togglePersistentPanel('focus', false));
focusStartBtn.addEventListener('click', startFocus);
focusStopBtn.addEventListener('click', stopFocus);
focusInterruptBtn.addEventListener('click', markInterruption);
document.getElementById('focus-export-csv').addEventListener('click', exportFocusCSV);
document.getElementById('focus-export-json').addEventListener('click', exportFocusJSON);
focusClearBtn.addEventListener('click', clearFocusHistory);

// Enter in the label field starts the session
focusLabelInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); startFocus(); }
});

/* =============================================================
   TASKS
   Nested one level deep: a task owns subtasks. Ticking a parent
   ticks its subtasks; a parent auto-completes when they all are.
   ============================================================= */
const TASKS_KEY = 'fw-tasks-v1';

const taskListEl = document.getElementById('task-list');
const taskEmptyEl = document.getElementById('task-empty');
const taskInput = document.getElementById('task-input');
const taskCountEl = document.getElementById('task-count');
const taskClearDoneBtn = document.getElementById('task-clear-done');

let taskStore = { version: 1, tasks: [] };
let taskStorageOK = true;
let taskEditingId = null;   // id of the task/subtask currently being renamed

const CHECK_SVG = '<svg viewBox="0 0 24 24"><polyline points="4 12 9 17 20 6"/></svg>';
const PLUS_SVG = '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
const CROSS_SVG = '<svg viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>';

function loadTaskStore() {
    try {
        const raw = localStorage.getItem(TASKS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.tasks)) {
            taskStore = {
                version: 1,
                tasks: parsed.tasks.filter(t => t && typeof t.text === 'string').map(t => ({
                    id: t.id || `t${Math.floor(t.created || 0)}`,
                    text: t.text,
                    done: !!t.done,
                    created: t.created || 0,
                    completedAt: typeof t.completedAt === 'number' ? t.completedAt : null,
                    subtasks: (Array.isArray(t.subtasks) ? t.subtasks : [])
                        .filter(s => s && typeof s.text === 'string')
                        .map(s => ({
                            id: s.id || `s${Math.floor(s.created || 0)}`,
                            text: s.text,
                            done: !!s.done,
                            created: s.created || 0,
                            completedAt: typeof s.completedAt === 'number' ? s.completedAt : null,
                        })),
                })),
            };
        }
    } catch (e) {
        console.warn('Task list unavailable, running in memory:', e);
        taskStorageOK = false;
    }
}

function saveTaskStore() {
    if (!taskStorageOK) return;
    try {
        localStorage.setItem(TASKS_KEY, JSON.stringify(taskStore));
    } catch (e) {
        console.warn('Task list could not be saved:', e);
        taskStorageOK = false;
    }
}

let taskIdCounter = 0;
function newTaskId(prefix) {
    return `${prefix}${Date.now().toString(36)}${(taskIdCounter++).toString(36)}`;
}

/* --- Lookup --- */
function findTask(id) {
    for (const t of taskStore.tasks) {
        if (t.id === id) return { task: t, parent: null };
        const sub = t.subtasks.find(s => s.id === id);
        if (sub) return { task: sub, parent: t };
    }
    return null;
}

/* --- Mutations --- */
function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    taskStore.tasks.push({
        id: newTaskId('t'), text: trimmed, done: false,
        created: Date.now(), completedAt: null, subtasks: [],
    });
    saveTaskStore();
    renderTasks();
}

function addSubtask(parentId, text) {
    const hit = findTask(parentId);
    if (!hit || hit.parent) return;   // only one level of nesting
    const trimmed = (text || '').trim();
    hit.task.subtasks.push({
        id: newTaskId('s'), text: trimmed || 'New subtask', done: false,
        created: Date.now(), completedAt: null,
    });
    // Adding work to a finished task reopens it
    if (hit.task.done) { hit.task.done = false; hit.task.completedAt = null; }
    saveTaskStore();
    renderTasks();
}

function toggleTaskDone(id) {
    const hit = findTask(id);
    if (!hit) return;
    const now = Date.now();
    const next = !hit.task.done;
    hit.task.done = next;
    hit.task.completedAt = next ? now : null;

    if (!hit.parent) {
        // Ticking a parent ticks everything under it
        hit.task.subtasks.forEach(s => { s.done = next; s.completedAt = next ? now : null; });
    } else {
        // A parent completes exactly when all its subtasks are done
        const p = hit.parent;
        const all = p.subtasks.length > 0 && p.subtasks.every(s => s.done);
        p.done = all;
        p.completedAt = all ? now : null;
    }
    saveTaskStore();
    renderTasks();
}

function deleteTask(id) {
    const hit = findTask(id);
    if (!hit) return;
    if (hit.parent) hit.parent.subtasks = hit.parent.subtasks.filter(s => s.id !== id);
    else taskStore.tasks = taskStore.tasks.filter(t => t.id !== id);
    saveTaskStore();
    renderTasks();
}

function renameTask(id, text) {
    const hit = findTask(id);
    if (!hit) return;
    const trimmed = text.trim();
    if (trimmed) hit.task.text = trimmed;   // empty edit reverts rather than blanking
    saveTaskStore();
}

function clearDoneTasks() {
    taskStore.tasks.forEach(t => { t.subtasks = t.subtasks.filter(s => !s.done); });
    taskStore.tasks = taskStore.tasks.filter(t => !t.done);
    saveTaskStore();
    renderTasks();
}

/* --- Render --- */
function taskRow(item, isSub) {
    const row = document.createElement('div');
    row.className = 'task-item' + (isSub ? ' task-sub' : '') + (item.done ? ' done' : '');
    row.dataset.id = item.id;

    const check = document.createElement('button');
    check.className = 'task-check';
    check.type = 'button';
    check.innerHTML = CHECK_SVG;
    check.setAttribute('aria-label', item.done ? 'Mark as not done' : 'Mark as done');
    check.setAttribute('aria-pressed', String(item.done));
    check.addEventListener('click', () => toggleTaskDone(item.id));
    row.appendChild(check);

    if (taskEditingId === item.id) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-edit-input';
        input.value = item.text;
        input.maxLength = 200;
        let committed = false;
        const commit = (save) => {
            if (committed) return;
            committed = true;
            if (save) renameTask(item.id, input.value);
            taskEditingId = null;
            renderTasks();
        };
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(true); }
            if (e.key === 'Escape') { e.preventDefault(); commit(false); }
        });
        input.addEventListener('blur', () => commit(true));
        row.appendChild(input);
        // focus after it is in the document
        requestAnimationFrame(() => { input.focus(); input.select(); });
    } else {
        const text = document.createElement('span');
        text.className = 'task-text';
        text.textContent = item.text;
        text.title = 'Click to edit';
        text.addEventListener('click', () => { taskEditingId = item.id; renderTasks(); });
        row.appendChild(text);

        if (!isSub && item.subtasks.length) {
            const prog = document.createElement('span');
            prog.className = 'task-progress';
            prog.textContent = `${item.subtasks.filter(s => s.done).length}/${item.subtasks.length}`;
            row.appendChild(prog);
        }
    }

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    if (!isSub) {
        const addSub = document.createElement('button');
        addSub.className = 'task-btn';
        addSub.type = 'button';
        addSub.innerHTML = PLUS_SVG;
        addSub.title = 'Add subtask';
        addSub.setAttribute('aria-label', 'Add subtask');
        addSub.addEventListener('click', () => {
            addSubtask(item.id, '');
            const last = item.subtasks[item.subtasks.length - 1];
            if (last) { taskEditingId = last.id; renderTasks(); }
        });
        actions.appendChild(addSub);
    }
    const del = document.createElement('button');
    del.className = 'task-btn task-del';
    del.type = 'button';
    del.innerHTML = CROSS_SVG;
    del.title = isSub ? 'Delete subtask' : 'Delete task';
    del.setAttribute('aria-label', isSub ? 'Delete subtask' : 'Delete task');
    del.addEventListener('click', () => deleteTask(item.id));
    actions.appendChild(del);
    row.appendChild(actions);

    return row;
}

function renderTasks() {
    taskListEl.innerHTML = '';

    taskStore.tasks.forEach(t => {
        taskListEl.appendChild(taskRow(t, false));
        if (t.subtasks.length) {
            const wrap = document.createElement('div');
            wrap.className = 'task-subs';
            t.subtasks.forEach(s => wrap.appendChild(taskRow(s, true)));
            taskListEl.appendChild(wrap);
        }
    });

    const hasTasks = taskStore.tasks.length > 0;
    taskEmptyEl.style.display = hasTasks ? 'none' : '';
    taskListEl.style.display = hasTasks ? '' : 'none';

    // Count every leaf: standalone tasks plus all subtasks
    let total = 0, done = 0;
    taskStore.tasks.forEach(t => {
        if (t.subtasks.length) {
            total += t.subtasks.length;
            done += t.subtasks.filter(s => s.done).length;
        } else {
            total++;
            if (t.done) done++;
        }
    });
    taskCountEl.textContent = total ? `${done} of ${total} done` : 'No tasks';

    const anyDone = taskStore.tasks.some(t => t.done || t.subtasks.some(s => s.done));
    taskClearDoneBtn.disabled = !anyDone;
    taskClearDoneBtn.style.opacity = anyDone ? '' : '0.35';
}

function exportTasks() {
    downloadFocusFile(JSON.stringify(taskStore, null, 2),
        `tasks-${fmtFocusDate(new Date())}.json`, 'application/json');
}

document.getElementById('task-add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = '';
    taskInput.focus();
});
document.getElementById('tasks-close').addEventListener('click', () => togglePersistentPanel('tasks', false));
taskClearDoneBtn.addEventListener('click', clearDoneTasks);
document.getElementById('task-export').addEventListener('click', exportTasks);

/* =============================================================
   DAILY BRIEFING
   A single rolling note: what you write today becomes tomorrow's
   briefing, which is then shown to you and cleared from the box.
   ============================================================= */
const BRIEFING_KEY = 'fw-briefing-v1';
const BRIEFING_SAVE_DELAY = 500;

const briefingInput = document.getElementById('briefing-input');
const briefingTodayEl = document.getElementById('briefing-today');
const briefingTodayLabel = document.getElementById('briefing-today-label');
const briefingTodayBody = document.getElementById('briefing-today-body');
const briefingWrittenEl = document.getElementById('briefing-written');
const briefingForLabel = document.getElementById('briefing-for-label');
const briefingStatusEl = document.getElementById('briefing-status');

let briefingStore = { version: 1, current: null, pending: null };
let briefingStorageOK = true;
let briefingSaveTimer = null;
let briefingStatusTimer = null;

function dayKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tomorrowKey() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return dayKey(d);
}

function prettyDay(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined,
        { weekday: 'short', day: 'numeric', month: 'short' });
}

function loadBriefingStore() {
    try {
        const raw = localStorage.getItem(BRIEFING_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            const clean = (n) => (n && typeof n.text === 'string' && typeof n.forDate === 'string')
                ? { text: n.text, forDate: n.forDate, writtenOn: n.writtenOn || n.forDate }
                : null;
            briefingStore = { version: 1, current: clean(parsed.current), pending: clean(parsed.pending) };
        }
    } catch (e) {
        console.warn('Briefing unavailable, running in memory:', e);
        briefingStorageOK = false;
    }
}

function saveBriefingStore() {
    if (!briefingStorageOK) return;
    try {
        localStorage.setItem(BRIEFING_KEY, JSON.stringify(briefingStore));
    } catch (e) {
        console.warn('Briefing could not be saved:', e);
        briefingStorageOK = false;
    }
}

/* Promote a pending note once its date arrives. Returns true if anything moved,
   so the caller can re-render. Runs on load and on a timer, because the
   dashboard is typically left open across midnight. */
function promoteBriefingIfDue() {
    const today = dayKey(new Date());
    const p = briefingStore.pending;
    if (p && p.forDate <= today) {
        briefingStore.current = p;
        briefingStore.pending = null;
        saveBriefingStore();
        return true;
    }
    return false;
}

function renderBriefing() {
    const today = dayKey(new Date());
    const cur = briefingStore.current;

    if (cur && cur.text.trim()) {
        briefingTodayEl.classList.remove('empty');
        briefingTodayLabel.textContent = cur.forDate === today
            ? `Today · ${prettyDay(today)}`
            : `From ${prettyDay(cur.forDate)}`;
        briefingWrittenEl.textContent = `written ${prettyDay(cur.writtenOn)}`;
        briefingTodayBody.textContent = cur.text;
    } else {
        briefingTodayEl.classList.add('empty');
        briefingTodayLabel.textContent = `Today · ${prettyDay(today)}`;
        briefingWrittenEl.textContent = '';
        briefingTodayBody.textContent = 'No briefing waiting for you today. Write one below and it will be here tomorrow.';
    }

    const forDate = briefingStore.pending ? briefingStore.pending.forDate : tomorrowKey();
    briefingForLabel.textContent = prettyDay(forDate);

    // Don't clobber what is being typed
    if (document.activeElement !== briefingInput) {
        briefingInput.value = briefingStore.pending ? briefingStore.pending.text : '';
    }
}

function showBriefingStatus(text) {
    briefingStatusEl.textContent = text;
    briefingStatusEl.classList.add('show');
    clearTimeout(briefingStatusTimer);
    briefingStatusTimer = setTimeout(() => briefingStatusEl.classList.remove('show'), 1600);
}

function commitBriefingDraft() {
    const text = briefingInput.value;
    if (text.trim()) {
        briefingStore.pending = { text, forDate: tomorrowKey(), writtenOn: dayKey(new Date()) };
    } else {
        briefingStore.pending = null;
    }
    saveBriefingStore();
    showBriefingStatus('Saved');
    briefingForLabel.textContent = prettyDay(tomorrowKey());
}

briefingInput.addEventListener('input', () => {
    clearTimeout(briefingSaveTimer);
    briefingSaveTimer = setTimeout(commitBriefingDraft, BRIEFING_SAVE_DELAY);
});
briefingInput.addEventListener('blur', () => {
    clearTimeout(briefingSaveTimer);
    commitBriefingDraft();
});
document.getElementById('briefing-close').addEventListener('click', () => togglePersistentPanel('briefing', false));
document.getElementById('briefing-clear').addEventListener('click', () => {
    briefingStore.current = null;
    briefingStore.pending = null;
    briefingInput.value = '';
    saveBriefingStore();
    renderBriefing();
    showBriefingStatus('Cleared');
});

/* --- Boot --- */
(function initFocusTracker() {
    loadFocusStore();
    focusLabelInput.value = focusStore.lastLabel || '';

    // Recover a session left running by a refresh or crash
    const last = focusStore.sessions[focusStore.sessions.length - 1];
    if (last && last.end === null && !last.abandoned) {
        if (Date.now() - last.start > FOCUS_STALE_MS) {
            // Too old to trust — flag it rather than inventing an end time
            last.abandoned = true;
            saveFocusStore();
        } else {
            startFocusTick();
        }
    }

    syncFocusUI();
})();

(function initTasks() {
    loadTaskStore();
    renderTasks();
})();

(function initBriefing() {
    loadBriefingStore();
    promoteBriefingIfDue();
    renderBriefing();

    // The dashboard is often left running overnight — pick up the day turn
    setInterval(() => {
        if (promoteBriefingIfDue()) renderBriefing();
    }, 60000);
})();
