/**
 * js/app.js — Application State, Event Handlers & Initialisation
 *
 * Loaded last so it can reference db.js, engine.js, render.js safely.
 */

/* ============================================================
   APPLICATION STATE
   Single source of truth for the entire app.
   ============================================================ */
const APP = {
  /** User-filled profile built across the 6-step form */
  profile: {
    days:           null,
    duration:       60,
    level:          null,
    equipment:      null,
    goal:           null,
    trainToFailure: false,
    intensity:      2,
    recovery:       2,
  },

  /** Index of the currently active step panel (0–5) */
  currentStep: 0,

  /** Generated plan — array of DayPlan objects, or null */
  plan: null,

  /** Tracks which day cards are expanded: { [dayIndex]: boolean } */
  openDays: {},

  /**
   * Rolling per-muscle fatigue scores (0–100).
   * Increases when workouts are logged, decays toward 0 over time.
   */
  fatigue: {
    chest:      0,
    back:       0,
    shoulders:  0,
    quads:      0,
    hamstrings: 0,
    glutes:     0,
    biceps:     0,
    triceps:    0,
    core:       0,
    calves:     0,
  },

  /** Current consecutive-day workout streak */
  streak: 3,

  /** Boolean per day for the last 7 days (1 = completed) */
  streakHistory: [1, 1, 1, 0, 0, 0, 0],

  /** Whether the user has completed today's daily workout */
  completedToday: false,

  /**
   * Logged workout history.
   * Each entry: { date, name, focus, exercises: [], totalSets }
   */
  workoutHistory: [],
};

/* ============================================================
   PAGE NAVIGATION
   ============================================================ */

/**
 * Switches the visible page and updates the nav tab state.
 * @param {string} name - 'home' | 'generate' | 'daily' | 'history'
 */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  document.getElementById('page-' + name).classList.add('active');

  const idx = ['home', 'generate', 'daily', 'history'].indexOf(name);
  const tab = document.querySelectorAll('.nav-tab')[idx];
  if (tab) tab.classList.add('active');

  window.scrollTo(0, 0);

  // Trigger lazy renders
  if (name === 'daily')   renderDaily();
  if (name === 'history') renderHistory();
}

/* ============================================================
   STEP NAVIGATION (6-step form)
   ============================================================ */

/**
 * Activates a step panel and updates sidebar step indicators.
 * @param {number} n - Step index (0–5)
 */
function showStep(n) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`step-${n}`);
  if (panel) panel.classList.add('active');

  document.querySelectorAll('.step-item').forEach((item, i) => {
    item.classList.remove('active', 'done', 'locked');
    if      (i === n) item.classList.add('active');
    else if (i <  n) item.classList.add('done');
    else             item.classList.add('locked');
  });

  APP.currentStep = n;
}

/**
 * Navigates to step n and refreshes any slider displays.
 * @param {number} n
 */
function nextStep(n) {
  showStep(n);

  // Sync slider display labels when entering those steps
  if (n === 1) {
    sliderChange('duration', document.getElementById('dur-slider').value,
      'dur-display', v => v + ' min');
  }
  if (n === 4) {
    sliderChange('intensity', document.getElementById('int-slider').value,
      'int-display', v => ['', 'Light', 'Moderate', 'Intense', 'Maximum'][v]);
    sliderChange('recovery', document.getElementById('rec-slider').value,
      'rec-display', v => ['', 'Poor', 'Average', 'Good', 'Excellent'][v]);
  }
}

/* ============================================================
   FORM INPUT HANDLERS
   ============================================================ */

/**
 * Selects an option card in a step, updates state, enables next button.
 * @param {number} step  - Step index (for finding the "Next" button)
 * @param {string} key   - Profile key to update
 * @param {*}      val   - Selected value
 * @param {Element} el   - Clicked card element
 */
function selectOpt(step, key, val, el) {
  // Deselect siblings within the same option group
  el.closest('.option-row, .card-row')
    .querySelectorAll('.opt, .card-opt')
    .forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');

  APP.profile[key] = val;
  updateSidebarVal(key, val);

  // Enable the "Next" button for this step
  const btn = document.getElementById(`btn-${step}`);
  if (btn) btn.disabled = false;
}

/**
 * Handles range slider changes — updates state and display label.
 * @param {string}   key       - Profile key
 * @param {*}        val       - Raw slider value
 * @param {string}   displayId - Element ID for the big display label
 * @param {Function} formatter - (val) => string
 */
function sliderChange(key, val, displayId, formatter) {
  APP.profile[key] = typeof val === 'string' ? parseInt(val, 10) : val;
  const disp = document.getElementById(displayId);
  if (disp) disp.textContent = formatter(val);
  updateSidebarVal(key, formatter(val));
}

/** Toggles the "train to failure" switch */
function toggleFailure() {
  APP.profile.trainToFailure = !APP.profile.trainToFailure;
  const sw = document.getElementById('failure-switch');
  if (sw) sw.classList.toggle('on', APP.profile.trainToFailure);
}

/* ============================================================
   GENERATE & RESET
   ============================================================ */

/** Validates profile, shows loading overlay, then builds and renders plan */
function runGenerate() {
  const p = APP.profile;

  if (!p.days || !p.level || !p.equipment || !p.goal) {
    showToast('Please complete all steps first');
    return;
  }

  // Loading overlay with cycling messages
  const msgs = [
    'ANALYZING YOUR PROFILE…',
    'BUILDING YOUR SPLIT…',
    'SELECTING EXERCISES…',
    'CALCULATING VOLUME…',
    'OPTIMIZING FATIGUE…',
  ];
  let mi = 0;
  const overlay = document.getElementById('loadingOverlay');
  const msgEl   = document.getElementById('loadingMsg');

  overlay.classList.add('show');
  msgEl.textContent = msgs[0];

  const interval = setInterval(() => {
    mi = (mi + 1) % msgs.length;
    msgEl.textContent = msgs[mi];
  }, 400);

  setTimeout(() => {
    clearInterval(interval);
    overlay.classList.remove('show');

    APP.plan     = buildWorkoutPlan(p);   // engine.js
    APP.openDays = {};

    document.getElementById('genContent').style.display  = 'none';
    document.getElementById('plan-output').style.display = 'block';

    renderPlan();  // render.js
    showToast(`✓ Plan generated — ${p.days} days`);
  }, 2000);
}

/** Resets the generator back to step 0 */
function resetGenerate() {
  APP.plan     = null;
  APP.openDays = {};
  document.getElementById('genContent').style.display  = '';
  document.getElementById('plan-output').style.display = 'none';
  showStep(0);
}

/**
 * Logs all training days from the current plan,
 * updates fatigue and history, increments streak.
 */
function logAllWorkouts() {
  if (!APP.plan) return;

  const allEx    = APP.plan.filter(d => !d.rest).flatMap(d => d.exercises);
  const totalSets = allEx.reduce((s, e) => s + (e.sets || 0), 0);

  updateFatigue(allEx);  // engine.js

  APP.workoutHistory.push({
    date:      new Date().toLocaleDateString(),
    name:      `${APP.profile.days}-Day Plan`,
    focus:     `${APP.profile.goal} / ${APP.profile.level}`,
    exercises: [],
    totalSets,
  });

  APP.streak++;
  APP.streakHistory.unshift(1);
  APP.streakHistory = APP.streakHistory.slice(0, 7);

  renderFatigue();
  renderHistory();
  showToast(`✓ ${totalSets} sets logged! Fatigue updated.`);
}

/* ============================================================
   DAILY PAGE ACTIONS
   ============================================================ */

/** Marks today's daily workout as complete and updates streak */
function completeDaily() {
  APP.completedToday = true;
  APP.streak++;
  APP.streakHistory.unshift(1);
  APP.streakHistory = APP.streakHistory.slice(0, 7);

  APP.workoutHistory.push({
    date:      new Date().toLocaleDateString(),
    name:      'Daily Workout',
    focus:     'Global Daily',
    exercises: [],
    totalSets: 0,
  });

  renderDaily();
  renderHistory();
  showToast('🔥 Workout complete! Streak: ' + APP.streak + ' days');
}

/* ============================================================
   INITIALISATION
   Runs once on page load.
   ============================================================ */
(function init() {
  // Ensure profile defaults are reflected in the sidebar
  document.getElementById('sv-duration').textContent = '60 MIN';

  // Seed history with a couple of example entries so the page isn't empty
  APP.workoutHistory.push({
    date:      new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
    name:      '5-Day Plan',
    focus:     'hypertrophy / intermediate',
    exercises: [],
    totalSets: 68,
  });
  APP.workoutHistory.push({
    date:      new Date(Date.now() - 86400000).toLocaleDateString(),
    name:      'Daily Workout',
    focus:     'Global Daily',
    exercises: [],
    totalSets: 24,
  });
})();
