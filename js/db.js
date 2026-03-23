/**
 * js/db.js — Exercise Database & Equipment Map
 *
 * Each exercise entry:
 *   name     {string}   Display name
 *   muscles  {string[]} Primary muscle group(s)
 *   sec      {string[]} Secondary / stabiliser muscles
 *   eq       {string[]} Required equipment tags
 *   pattern  {string}   Movement pattern: push | pull | hinge | squat | iso
 *   type     {string}   'compound' or 'isolation'
 *   diff     {number}   Difficulty 1–3
 *   fat      {number}   Fatigue score (how taxing per set, 1–10)
 */

/* eslint-disable */
const DB = [
  // ── CHEST ─────────────────────────────────────────────────────────────────
  { name: 'Barbell Bench Press',    muscles: ['chest'],      sec: ['triceps','front delt'], eq: ['barbell'],    pattern: 'push',  type: 'compound',  diff: 2, fat: 8 },
  { name: 'Incline Dumbbell Press', muscles: ['chest'],      sec: ['triceps','front delt'], eq: ['dumbbell'],   pattern: 'push',  type: 'compound',  diff: 2, fat: 7 },
  { name: 'Decline Barbell Press',  muscles: ['chest'],      sec: ['triceps'],              eq: ['barbell'],    pattern: 'push',  type: 'compound',  diff: 2, fat: 7 },
  { name: 'Dumbbell Fly',           muscles: ['chest'],      sec: [],                       eq: ['dumbbell'],   pattern: 'push',  type: 'isolation', diff: 1, fat: 4 },
  { name: 'Push-Up',                muscles: ['chest'],      sec: ['triceps','front delt'], eq: ['bodyweight'], pattern: 'push',  type: 'compound',  diff: 1, fat: 5 },
  { name: 'Cable Crossover',        muscles: ['chest'],      sec: [],                       eq: ['machine'],    pattern: 'push',  type: 'isolation', diff: 1, fat: 4 },
  { name: 'Dumbbell Pullover',      muscles: ['chest'],      sec: ['lats'],                 eq: ['dumbbell'],   pattern: 'push',  type: 'isolation', diff: 1, fat: 4 },

  // ── BACK ──────────────────────────────────────────────────────────────────
  { name: 'Barbell Deadlift',       muscles: ['back'],       sec: ['glutes','hamstrings'],  eq: ['barbell'],    pattern: 'hinge', type: 'compound',  diff: 3, fat: 10 },
  { name: 'Pull-Up',                muscles: ['back'],       sec: ['biceps'],               eq: ['bodyweight'], pattern: 'pull',  type: 'compound',  diff: 2, fat: 7  },
  { name: 'Barbell Row',            muscles: ['back'],       sec: ['biceps','rear delt'],   eq: ['barbell'],    pattern: 'pull',  type: 'compound',  diff: 2, fat: 8  },
  { name: 'Dumbbell Row',           muscles: ['back'],       sec: ['biceps'],               eq: ['dumbbell'],   pattern: 'pull',  type: 'compound',  diff: 1, fat: 6  },
  { name: 'Lat Pulldown',           muscles: ['back'],       sec: ['biceps'],               eq: ['machine'],    pattern: 'pull',  type: 'compound',  diff: 1, fat: 6  },
  { name: 'Seated Cable Row',       muscles: ['back'],       sec: ['biceps'],               eq: ['machine'],    pattern: 'pull',  type: 'compound',  diff: 1, fat: 6  },
  { name: 'Face Pull',              muscles: ['back'],       sec: ['rear delt'],            eq: ['machine'],    pattern: 'pull',  type: 'isolation', diff: 1, fat: 3  },
  { name: 'T-Bar Row',              muscles: ['back'],       sec: ['biceps'],               eq: ['barbell'],    pattern: 'pull',  type: 'compound',  diff: 2, fat: 8  },
  { name: 'Chest-Supported Row',    muscles: ['back'],       sec: ['biceps'],               eq: ['dumbbell'],   pattern: 'pull',  type: 'compound',  diff: 1, fat: 6  },

  // ── SHOULDERS ─────────────────────────────────────────────────────────────
  { name: 'Overhead Press',          muscles: ['shoulders'], sec: ['triceps'],              eq: ['barbell'],    pattern: 'push',  type: 'compound',  diff: 2, fat: 8 },
  { name: 'Dumbbell Shoulder Press', muscles: ['shoulders'], sec: ['triceps'],              eq: ['dumbbell'],   pattern: 'push',  type: 'compound',  diff: 2, fat: 7 },
  { name: 'Arnold Press',            muscles: ['shoulders'], sec: ['triceps'],              eq: ['dumbbell'],   pattern: 'push',  type: 'compound',  diff: 2, fat: 6 },
  { name: 'Lateral Raise',           muscles: ['shoulders'], sec: [],                       eq: ['dumbbell'],   pattern: 'push',  type: 'isolation', diff: 1, fat: 3 },
  { name: 'Front Raise',             muscles: ['shoulders'], sec: [],                       eq: ['dumbbell'],   pattern: 'push',  type: 'isolation', diff: 1, fat: 3 },
  { name: 'Rear Delt Fly',           muscles: ['shoulders'], sec: ['back'],                 eq: ['dumbbell'],   pattern: 'pull',  type: 'isolation', diff: 1, fat: 3 },

  // ── LEGS ──────────────────────────────────────────────────────────────────
  { name: 'Barbell Squat',          muscles: ['quads'],      sec: ['glutes','hamstrings'],  eq: ['barbell'],    pattern: 'squat', type: 'compound',  diff: 3, fat: 9 },
  { name: 'Leg Press',              muscles: ['quads'],      sec: ['glutes'],               eq: ['machine'],    pattern: 'squat', type: 'compound',  diff: 1, fat: 7 },
  { name: 'Romanian Deadlift',      muscles: ['hamstrings'], sec: ['glutes','back'],        eq: ['barbell'],    pattern: 'hinge', type: 'compound',  diff: 2, fat: 8 },
  { name: 'Leg Curl',               muscles: ['hamstrings'], sec: [],                       eq: ['machine'],    pattern: 'hinge', type: 'isolation', diff: 1, fat: 4 },
  { name: 'Bulgarian Split Squat',  muscles: ['quads'],      sec: ['glutes','hamstrings'],  eq: ['dumbbell'],   pattern: 'squat', type: 'compound',  diff: 2, fat: 8 },
  { name: 'Goblet Squat',           muscles: ['quads'],      sec: ['glutes'],               eq: ['dumbbell'],   pattern: 'squat', type: 'compound',  diff: 1, fat: 6 },
  { name: 'Leg Extension',          muscles: ['quads'],      sec: [],                       eq: ['machine'],    pattern: 'squat', type: 'isolation', diff: 1, fat: 4 },
  { name: 'Hip Thrust',             muscles: ['glutes'],     sec: ['hamstrings'],           eq: ['barbell'],    pattern: 'hinge', type: 'compound',  diff: 2, fat: 7 },
  { name: 'Walking Lunge',          muscles: ['quads'],      sec: ['glutes','hamstrings'],  eq: ['dumbbell'],   pattern: 'squat', type: 'compound',  diff: 1, fat: 6 },
  { name: 'Calf Raise',             muscles: ['calves'],     sec: [],                       eq: ['machine'],    pattern: 'squat', type: 'isolation', diff: 1, fat: 3 },
  { name: 'Sumo Deadlift',          muscles: ['glutes'],     sec: ['hamstrings','quads'],   eq: ['barbell'],    pattern: 'hinge', type: 'compound',  diff: 2, fat: 9 },

  // ── BICEPS ────────────────────────────────────────────────────────────────
  { name: 'Barbell Curl',          muscles: ['biceps'],      sec: ['forearms'],             eq: ['barbell'],    pattern: 'pull',  type: 'isolation', diff: 1, fat: 4 },
  { name: 'Dumbbell Curl',         muscles: ['biceps'],      sec: [],                       eq: ['dumbbell'],   pattern: 'pull',  type: 'isolation', diff: 1, fat: 3 },
  { name: 'Hammer Curl',           muscles: ['biceps'],      sec: ['forearms'],             eq: ['dumbbell'],   pattern: 'pull',  type: 'isolation', diff: 1, fat: 3 },
  { name: 'Preacher Curl',         muscles: ['biceps'],      sec: [],                       eq: ['machine'],    pattern: 'pull',  type: 'isolation', diff: 1, fat: 4 },
  { name: 'Incline Dumbbell Curl', muscles: ['biceps'],      sec: [],                       eq: ['dumbbell'],   pattern: 'pull',  type: 'isolation', diff: 1, fat: 3 },

  // ── TRICEPS ───────────────────────────────────────────────────────────────
  { name: 'Tricep Pushdown',       muscles: ['triceps'],     sec: [],                       eq: ['machine'],    pattern: 'push',  type: 'isolation', diff: 1, fat: 3 },
  { name: 'Skull Crusher',         muscles: ['triceps'],     sec: [],                       eq: ['barbell'],    pattern: 'push',  type: 'isolation', diff: 1, fat: 5 },
  { name: 'Overhead Tricep Ext.',  muscles: ['triceps'],     sec: [],                       eq: ['dumbbell'],   pattern: 'push',  type: 'isolation', diff: 1, fat: 4 },
  { name: 'Diamond Push-Up',       muscles: ['triceps'],     sec: ['chest'],                eq: ['bodyweight'], pattern: 'push',  type: 'compound',  diff: 1, fat: 5 },
  { name: 'Dips',                  muscles: ['triceps'],     sec: ['chest'],                eq: ['bodyweight'], pattern: 'push',  type: 'compound',  diff: 2, fat: 6 },

  // ── CORE ──────────────────────────────────────────────────────────────────
  { name: 'Plank',                 muscles: ['core'],        sec: [],                       eq: ['bodyweight'], pattern: 'iso',   type: 'isolation', diff: 1, fat: 3 },
  { name: 'Hanging Leg Raise',     muscles: ['core'],        sec: [],                       eq: ['bodyweight'], pattern: 'iso',   type: 'isolation', diff: 2, fat: 4 },
  { name: 'Cable Crunch',          muscles: ['core'],        sec: [],                       eq: ['machine'],    pattern: 'iso',   type: 'isolation', diff: 1, fat: 3 },
  { name: 'Ab Rollout',            muscles: ['core'],        sec: ['lats'],                 eq: ['bodyweight'], pattern: 'iso',   type: 'compound',  diff: 2, fat: 5 },
  { name: 'Russian Twist',         muscles: ['core'],        sec: [],                       eq: ['bodyweight'], pattern: 'iso',   type: 'isolation', diff: 1, fat: 3 },
];

/**
 * Maps equipment tier to all allowed equipment tags.
 * Each tier is cumulative — a barbell gym also has dumbbells, etc.
 */
const EQ_ALLOWED = {
  bodyweight: ['bodyweight'],
  dumbbell:   ['dumbbell', 'bodyweight'],
  barbell:    ['barbell',  'dumbbell', 'bodyweight'],
  'full gym': ['barbell',  'dumbbell', 'machine', 'bodyweight'],
};
