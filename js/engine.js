/**
 * js/engine.js — Workout Generation Engine
 *
 * Responsible for:
 *   buildSplit()        — maps user profile → weekly training split
 *   pickExercises()     — selects exercises for a given muscle group set
 *   getSetsReps()       — assigns sets / reps / rest based on goal
 *   getExCount()        — calculates max exercises to fit session duration
 *   buildWorkoutPlan()  — orchestrates the full plan generation
 *   updateFatigue()     — accumulates and decays per-muscle fatigue scores
 */

/* ============================================================
   SPLIT ALGORITHM
   Maps: days + recovery + intensity + goal → weekly split template
   ============================================================ */

/**
 * @param {object} p - User profile
 * @returns {Array<{name, focus, muscles, rest?}>}
 */
function buildSplit(p) {
  const { days, recovery, goal } = p;
  const highRec    = recovery >= 3;
  const isoFocus   = goal === 'hypertrophy';

  // ── 1–2 days: always full body ──────────────────────────────
  if (days <= 2) {
    return Array.from({ length: days }, (_, i) => ({
      name:    ['Full Body A', 'Full Body B'][i],
      focus:   'Full Body',
      muscles: ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'triceps', 'biceps'],
      rest:    false,
    }));
  }

  // ── 3 days: Full Body (low recovery) or Push/Pull/Legs ──────
  if (days === 3) {
    if (!highRec) return [
      { name: 'Full Body A', focus: 'Full Body',                                     muscles: ['chest','back','shoulders','quads','hamstrings','glutes'] },
      { name: 'Full Body B', focus: 'Full Body',                                     muscles: ['chest','back','shoulders','core'] },
      { name: 'Full Body C', focus: 'Full Body',                                     muscles: ['quads','hamstrings','glutes','biceps','triceps'] },
    ];
    return [
      { name: 'Push', focus: 'Push — Chest / Shoulders / Triceps',                  muscles: ['chest','shoulders','triceps'] },
      { name: 'Pull', focus: 'Pull — Back / Biceps',                                muscles: ['back','biceps'] },
      { name: 'Legs', focus: 'Legs — Quads / Hamstrings / Glutes',                  muscles: ['quads','hamstrings','glutes','calves'] },
    ];
  }

  // ── 4 days: Upper / Lower split ─────────────────────────────
  if (days === 4) return [
    { name: 'Upper A', focus: 'Upper Body — Push + Pull',                            muscles: ['chest','back','shoulders'] },
    { name: 'Lower A', focus: 'Lower Body — Quads / Hamstrings / Glutes',            muscles: ['quads','hamstrings','glutes','calves'] },
    { name: 'Upper B', focus: 'Upper Body — Arms Focus',                             muscles: ['chest','back','biceps','triceps'] },
    { name: 'Lower B', focus: 'Lower Body + Core',                                   muscles: ['quads','hamstrings','glutes','core'] },
  ];

  // ── 5 days: Bro split (hypertrophy) or PPL + Upper/Lower ────
  if (days === 5) {
    if (isoFocus) return [
      { name: 'Chest',     focus: 'Chest + Triceps',                                 muscles: ['chest','triceps'] },
      { name: 'Back',      focus: 'Back + Biceps',                                   muscles: ['back','biceps'] },
      { name: 'Legs',      focus: 'Quads + Hamstrings + Glutes',                     muscles: ['quads','hamstrings','glutes','calves'] },
      { name: 'Shoulders', focus: 'Shoulders',                                       muscles: ['shoulders'] },
      { name: 'Arms',      focus: 'Biceps + Triceps + Core',                         muscles: ['biceps','triceps','core'] },
    ];
    return [
      { name: 'Push',  focus: 'Push — Chest / Shoulders / Triceps',                  muscles: ['chest','shoulders','triceps'] },
      { name: 'Pull',  focus: 'Pull — Back / Biceps',                                muscles: ['back','biceps'] },
      { name: 'Legs',  focus: 'Legs — Full Lower Body',                              muscles: ['quads','hamstrings','glutes','calves'] },
      { name: 'Upper', focus: 'Upper Body Blend',                                    muscles: ['chest','back','shoulders'] },
      { name: 'Lower', focus: 'Lower Body + Core',                                   muscles: ['quads','hamstrings','core'] },
    ];
  }

  // ── 6 days: PPL × 2 ─────────────────────────────────────────
  if (days === 6) return [
    { name: 'Push A', focus: 'Push — Chest / Shoulders / Triceps',                   muscles: ['chest','shoulders','triceps'] },
    { name: 'Pull A', focus: 'Pull — Back / Biceps',                                 muscles: ['back','biceps'] },
    { name: 'Legs A', focus: 'Legs — Quad Dominant',                                 muscles: ['quads','glutes','calves'] },
    { name: 'Push B', focus: 'Push — Volume Day',                                    muscles: ['chest','shoulders','triceps'] },
    { name: 'Pull B', focus: 'Pull — Volume Day',                                    muscles: ['back','biceps','core'] },
    { name: 'Legs B', focus: 'Legs — Posterior Chain',                               muscles: ['hamstrings','glutes','calves','core'] },
  ];

  // ── 7 days: PPL + Upper/Lower + mandatory rest ───────────────
  return [
    { name: 'Push',   focus: 'Chest / Shoulders / Triceps',                          muscles: ['chest','shoulders','triceps'] },
    { name: 'Pull',   focus: 'Back / Biceps',                                        muscles: ['back','biceps'] },
    { name: 'Legs A', focus: 'Quad Dominant',                                        muscles: ['quads','glutes','calves'] },
    { name: 'REST',   focus: 'Active Recovery — walk, stretch, mobility',            muscles: [], rest: true },
    { name: 'Upper',  focus: 'Upper Body Blend',                                     muscles: ['chest','back','shoulders'] },
    { name: 'Legs B', focus: 'Posterior Chain',                                      muscles: ['hamstrings','glutes','core'] },
    { name: 'Core',   focus: 'Core & Mobility',                                      muscles: ['core'] },
  ];
}

/* ============================================================
   EXERCISE PICKER
   Filters DB by equipment + muscle match, then uses a
   deterministic seeded selection to avoid randomness.
   ============================================================ */

/**
 * Deterministic array pick using a simple hash-based seed.
 * @param {Array}  arr  - Source array
 * @param {number} n    - How many to pick
 * @param {number} s    - Seed integer
 * @returns {Array}
 */
function seededPick(arr, n, s) {
  if (!arr.length || n <= 0) return [];
  const result = [];
  const used   = new Set();

  for (let i = 0; i < n && result.length < arr.length; i++) {
    // Cheap but well-distributed hash
    let idx = ((s * 2654435761 + i * 40503) >>> 0) % arr.length;
    let tries = 0;
    while (used.has(idx) && tries++ < arr.length) idx = (idx + 1) % arr.length;
    if (!used.has(idx)) {
      used.add(idx);
      result.push(arr[idx]);
    }
  }
  return result;
}

/**
 * Pick exercises for a single training day.
 * ~45 % compounds, remainder isolations, filtered by equipment + muscles.
 *
 * @param {string[]} muscles - Target muscle groups for this day
 * @param {object}   profile - User profile (for equipment)
 * @param {number}   count   - Total exercises to return
 * @param {number}   seed    - Deterministic seed
 * @returns {Array}
 */
function pickExercises(muscles, profile, count, seed) {
  const allowed     = EQ_ALLOWED[profile.equipment] || ['bodyweight'];
  const recentNames = APP.workoutHistory
    .slice(-3)
    .flatMap(h => (h.exercises || []).map(e => e.name));

  // Filter: must match equipment AND hit at least one target muscle
  const pool = DB.filter(e =>
    e.eq.some(q => allowed.includes(q)) &&
    (
      muscles.some(m => e.muscles.includes(m)) ||
      muscles.some(m => e.sec.includes(m))
    )
  );

  // Deprioritise recently used exercises by moving them to the end
  const fresh  = pool.filter(e => !recentNames.includes(e.name));
  const stale  = pool.filter(e =>  recentNames.includes(e.name));
  const sorted = [...fresh, ...stale];

  const compounds  = sorted.filter(e => e.type === 'compound').sort((a, b) => b.fat - a.fat);
  const isolations = sorted.filter(e => e.type === 'isolation');

  const nCompound = Math.max(1, Math.floor(count * 0.45));
  const nIso      = count - nCompound;

  return [
    ...seededPick(compounds,  nCompound, seed),
    ...seededPick(isolations, nIso,      seed + 999),
  ].slice(0, count);
}

/* ============================================================
   SETS / REPS / REST
   ============================================================ */

/**
 * @param {object} profile - User profile
 * @param {object} ex      - Exercise entry from DB
 * @returns {{ sets: number, reps: string, rest: string }}
 */
function getSetsReps(profile, ex) {
  const { goal, trainToFailure, intensity } = profile;
  let sets, reps, rest;

  if (goal === 'strength') {
    if (ex.type === 'compound') { sets = 5; reps = '3–5';   rest = '3–5 min'; }
    else                        { sets = 3; reps = '6–8';   rest = '2 min';   }
  } else if (goal === 'endurance') {
    sets = 3; reps = '15–20'; rest = '45 sec';
  } else {
    // hypertrophy or general
    if (ex.type === 'compound') { sets = 4; reps = '6–10';  rest = '2–3 min';    }
    else                        { sets = 3; reps = '10–15'; rest = '60–90 sec';  }
  }

  // Train-to-failure: drop one set, maximise effort
  if (trainToFailure) sets = Math.max(2, sets - 1);

  // High intensity: extend rest slightly
  if (intensity >= 4 && rest.includes('90')) rest = '2–3 min';

  return { sets, reps, rest };
}

/* ============================================================
   EXERCISE COUNT
   Caps total exercises to fit within session duration.
   ============================================================ */

/**
 * @param {object} profile
 * @returns {number} - Exercises per session (4–9)
 */
function getExCount(profile) {
  const timePerEx = { beginner: 13, intermediate: 10, advanced: 8 }[profile.level] || 10;
  return Math.min(Math.max(Math.floor(profile.duration / timePerEx), 4), 9);
}

/* ============================================================
   FULL PLAN BUILDER
   ============================================================ */

/**
 * Generates the complete weekly plan for a user profile.
 * Named distinctly from the UI function `runGenerate()` to avoid collision.
 *
 * @param {object} profile
 * @returns {Array<DayPlan>}
 */
function buildWorkoutPlan(profile) {
  const split = buildSplit(profile);
  const count = getExCount(profile);
  const seed  = Date.now();

  return split.map((day, di) => {
    // Rest days carry no exercises
    if (day.rest) {
      return { name: day.name, focus: day.focus, muscles: [], rest: true, exercises: [] };
    }

    const exs = pickExercises(day.muscles, profile, count, seed + di * 7919);

    return {
      name:    day.name,
      focus:   day.focus,
      muscles: day.muscles,
      rest:    false,
      exercises: (exs || []).map(ex => {
        const sr       = getSetsReps(profile, ex);
        const fatWarn  = (APP.fatigue[ex.muscles[0]] || 0) > 65;
        const prPossible = !fatWarn && ex.fat >= 7 &&
                           Math.abs((seed + di + ex.name.length) % 4) === 0;
        return { ...ex, ...sr, fatWarn, prPossible };
      }),
    };
  });
}

/* ============================================================
   FATIGUE TRACKER
   ============================================================ */

/**
 * Adds fatigue for a completed set of exercises, then applies
 * a decay factor to all muscles to simulate recovery.
 *
 * @param {Array} exercises - Completed exercises with .sets and .muscles
 */
function updateFatigue(exercises) {
  // Accumulate
  exercises.forEach(ex => {
    ex.muscles.forEach(m => {
      if (APP.fatigue[m] !== undefined) {
        APP.fatigue[m] = Math.min(100, APP.fatigue[m] + ex.fat * ex.sets * 1.5);
      }
    });
  });

  // Decay all muscles (simulate recovery between sessions)
  Object.keys(APP.fatigue).forEach(m => {
    APP.fatigue[m] = Math.max(0, APP.fatigue[m] * 0.82);
  });
}
