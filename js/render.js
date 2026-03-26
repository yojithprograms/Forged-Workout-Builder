/**
 * js/render.js — DOM Rendering Functions
 *
 * All functions that touch the DOM live here.
 * Reads from APP state and engine outputs; never mutates state directly.
 */

/* ============================================================
   PLAN OUTPUT
   ============================================================ */

/** Renders the full generated plan into #weekGrid + #planHeaderBar */
function renderPlan() {
  const p    = APP.profile;
  const plan = APP.plan;

  const goalLabel = {
    strength:    'Strength',
    hypertrophy: 'Hypertrophy',
    endurance:   'Endurance',
    general:     'General Fitness',
  }[p.goal] || p.goal;

  const splitNames = {
    1: 'Full Body',
    2: 'Full Body A/B',
    3: p.recovery >= 3 ? 'Push / Pull / Legs' : 'Full Body',
    4: 'Upper / Lower',
    5: 'PPL + Upper/Lower',
    6: 'PPL × 2',
    7: 'PPL + Rest Day',
  };
  const splitName = splitNames[p.days] || `${p.days}-Day Split`;

  // ── Header bar ───────────────────────────────────────────────
  document.getElementById('planHeaderBar').innerHTML = `
    <div>
      <div class="plan-main-title">${p.days}-DAY ${splitName.toUpperCase()} PLAN</div>
      <div class="plan-meta-chips">
        <div class="meta-chip">Goal: ${goalLabel}</div>
        <div class="meta-chip">${p.duration} min/session</div>
        <div class="meta-chip">${p.level}</div>
        <div class="meta-chip">${p.equipment}</div>
        ${p.trainToFailure ? '<div class="meta-chip">Train to Failure</div>' : ''}
      </div>
    </div>
    <div class="plan-actions">
      <button class="plan-btn plan-btn-dark" onclick="resetGenerate()">Rebuild</button>
    </div>`;

  // ── Day cards ────────────────────────────────────────────────
  document.getElementById('weekGrid').innerHTML = plan.map((day, di) => {
    const exercises = day.exercises || [];
    const totalSets = exercises.reduce((s, e) => s + (e.sets || 0), 0);

    const exRows = exercises.map((ex, ei) => `
      <tr>
        <td class="td-idx">${String(ei + 1).padStart(2, '0')}</td>
        <td class="td-name">
          ${ex.name}
          <div class="ex-sub">
            ${ex.type === 'compound'
              ? '<span class="ex-tag compound">Compound</span>'
              : '<span class="ex-tag">Isolation</span>'}
            ${ex.prPossible  ? '<span class="ex-tag pr">⚡ PR Possible</span>'      : ''}
            ${ex.fatWarn     ? '<span class="ex-tag fatigue-warn">⚠ High Fatigue</span>' : ''}
            <span class="ex-tag">${ex.muscles[0]}</span>
          </div>
        </td>
        <td class="td-sets">${ex.sets}</td>
        <td class="td-reps">${ex.reps}</td>
        <td class="td-rest">${ex.rest}</td>
      </tr>`).join('');

    return `
      <div class="day-card">
        <div class="day-header" onclick="toggleDay(${di})">
          <div class="day-left">
            <div class="day-number">${String(di + 1).padStart(2, '0')}</div>
            <div class="day-info">
              <div class="day-name">${day.name}</div>
              <div class="day-focus">${day.focus}${!day.rest ? ` · ${totalSets} total sets` : ''}</div>
            </div>
          </div>
          <div class="day-right">
            ${day.rest
              ? '<span class="day-badge badge-rest">Rest</span>'
              : `<span class="day-badge badge-work">${exercises.length} exercises</span>`}
            ${!day.rest ? `<div class="day-chevron" id="chev-${di}">▼</div>` : ''}
          </div>
        </div>
        ${!day.rest ? `
        <div class="day-exercises" id="dayex-${di}">
          <div class="exercises-inner">
            <table class="ex-table">
              <thead>
                <tr>
                  <th style="width:28px"></th>
                  <th>Exercise</th>
                  <th style="text-align:center">Sets</th>
                  <th style="text-align:center">Reps</th>
                  <th>Rest</th>
                </tr>
              </thead>
              <tbody>${exRows}</tbody>
            </table>
          </div>
        </div>` : ''}
      </div>`;
  }).join('');

  renderFatigue();
}

/** Toggles a day card open/closed */
function toggleDay(di) {
  APP.openDays[di] = !APP.openDays[di];
  const panel = document.getElementById(`dayex-${di}`);
  const chev  = document.getElementById(`chev-${di}`);
  if (panel) panel.classList.toggle('open', APP.openDays[di]);
  if (chev)  chev.classList.toggle('open',  APP.openDays[di]);
}

/** Renders the fatigue grid */
function renderFatigue() {
  document.getElementById('fatigueGrid').innerHTML =
    Object.entries(APP.fatigue).map(([m, v]) => {
      const pct = Math.round(v);
      const cls = pct > 75 ? 'danger' : pct > 50 ? 'warn' : '';
      return `
        <div class="fatigue-card">
          <div class="fatigue-name">${m}</div>
          <div class="fatigue-bar-bg">
            <div class="fatigue-bar-fill ${cls}" style="width:${pct}%"></div>
          </div>
          <div class="fatigue-pct">${pct}% fatigue</div>
        </div>`;
    }).join('');
}

/* ============================================================
   DAILY PAGE
   ============================================================ */

/** Renders the full daily page including date, streak and today's workout */
function renderDaily() {
  const today   = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  document.getElementById('dailyDateLabel').textContent = dateStr.toUpperCase();
  document.getElementById('streakNum').textContent = APP.streak;

  // Streak dots (last 7 days)
  document.getElementById('streakDays').innerHTML =
    APP.streakHistory.slice(0, 7)
      .map(d => `<div class="streak-day ${d ? 'done' : ''}"></div>`)
      .join('');

  // Generate today's workout seeded by date (same for everyone)
  const seed        = today.getFullYear() * 100000 + (today.getMonth() + 1) * 1000 + today.getDate();
  const dailyProfile = {
    days: 6, duration: 60, level: 'intermediate',
    equipment: 'full gym', goal: 'hypertrophy',
    trainToFailure: false, intensity: 3, recovery: 2,
  };

  const allDays  = buildSplit(dailyProfile).filter(d => !d.rest);
  const dayIndex = seed % allDays.length;
  const day      = allDays[dayIndex];
  const rawExs   = pickExercises(day.muscles, dailyProfile, 7, seed);
  const exercises = rawExs.map(ex => ({ ...ex, ...getSetsReps(dailyProfile, ex) }));

  const exRows = exercises.map((ex, i) => `
    <tr>
      <td class="td-idx">${String(i + 1).padStart(2, '0')}</td>
      <td class="td-name">
        ${ex.name}
        <div class="ex-sub">
          ${ex.type === 'compound'
            ? '<span class="ex-tag compound">Compound</span>'
            : '<span class="ex-tag">Isolation</span>'}
          <span class="ex-tag">${ex.muscles[0]}</span>
        </div>
      </td>
      <td class="td-sets">${ex.sets}</td>
      <td class="td-reps">${ex.reps}</td>
      <td class="td-rest">${ex.rest}</td>
    </tr>`).join('');

  document.getElementById('dailyCard').innerHTML = `
    <div class="daily-card-header">
      <div>
        <div class="daily-workout-name">${day.name} — ${day.focus}</div>
        <div class="daily-workout-sub">
          ${exercises.length} exercises · Seeded by today's date · Same for everyone
        </div>
      </div>
      <button
        class="daily-complete-btn ${APP.completedToday ? 'done' : ''}"
        id="completeBtn"
        onclick="completeDaily()"
        ${APP.completedToday ? 'disabled' : ''}>
        ${APP.completedToday ? '✓ Completed' : 'Mark Complete'}
      </button>
    </div>
    <div style="padding: 0 24px 24px;">
      <table class="ex-table" style="margin-top:8px">
        <thead>
          <tr>
            <th style="width:28px"></th>
            <th>Exercise</th>
            <th style="text-align:center">Sets</th>
            <th style="text-align:center">Reps</th>
            <th>Rest</th>
          </tr>
        </thead>
        <tbody>${exRows}</tbody>
      </table>
    </div>`;
}

/* ============================================================
   HISTORY PAGE
   ============================================================ */

/** Renders the workout history list */
function renderHistory() {
  const el = document.getElementById('histList');

  if (!APP.workoutHistory.length) {
    el.innerHTML = `
      <div class="hist-empty">
        <div class="hist-empty-icon">📋</div>
        <div class="hist-empty-text">
          No workouts logged yet.<br>Generate a plan and start training!
        </div>
      </div>`;
    return;
  }

  el.innerHTML = `<div class="hist-list">` +
    [...APP.workoutHistory].reverse().map(h => `
      <div class="hist-item">
        <div>
          <div class="hist-date">${h.date}</div>
          <div class="hist-name">${h.name}</div>
          <div class="hist-stats">${h.focus}</div>
        </div>
        <div class="hist-right">
          <div class="hist-sets">${h.totalSets || '—'}</div>
          <div class="hist-sets-label">sets</div>
        </div>
      </div>`).join('') +
    `</div>`;
}

/* ============================================================
   SIDEBAR PROFILE PANEL
   ============================================================ */

/** Updates a single sidebar value label */
function updateSidebarVal(key, val) {
  const idMap = {
    days:      'sv-days',
    duration:  'sv-duration',
    level:     'sv-level',
    equipment: 'sv-equipment',
    intensity: 'sv-intensity',
    goal:      'sv-goal',
  };
  const el = idMap[key] ? document.getElementById(idMap[key]) : null;
  if (el) el.textContent = String(val).toUpperCase();
  renderProfilePanel();
}

/** Renders the full profile summary in the sidebar */
function renderProfilePanel() {
  const p = APP.profile;
  const rows = Object.entries({
    'Days':       p.days      ? `${p.days}/week` : null,
    'Duration':   p.duration  ? `${p.duration} min` : null,
    'Level':      p.level,
    'Equipment':  p.equipment,
    'Intensity':  ['', 'Light', 'Moderate', 'Intense', 'Maximum'][p.intensity],
    'Recovery':   ['', 'Poor',  'Average',  'Good',   'Excellent'][p.recovery],
    'To Failure': p.trainToFailure ? 'Yes' : null,
    'Goal':       p.goal,
  }).filter(([, v]) => v);

  if (!rows.length) return;

  document.getElementById('sidebarProfile').style.display = '';
  document.getElementById('profileItems').innerHTML = rows.map(([k, v]) => `
    <div class="profile-item">
      <span class="profile-item-key">${k}</span>
      <span class="profile-item-val">${v.toUpperCase()}</span>
    </div>`).join('');
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */

/**
 * Shows a brief toast message.
 * @param {string} msg
 */
function showToast(msg) {
  const wrap = document.getElementById('toastWrap');
  const t    = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity 0.3s';
    t.style.opacity    = '0';
    setTimeout(() => t.remove(), 300);
  }, 2500);
}
