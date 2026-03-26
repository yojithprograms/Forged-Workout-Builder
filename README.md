# FORGED — Smart Workout Generator

A deterministic, fatigue-aware workout planner that generates perfectly balanced weekly training plans based on your exact inputs. No backend required — pure HTML, CSS, and vanilla JavaScript.

---

## Features

- **6-step onboarding form** — training days, session duration, experience level, equipment, intensity/recovery, and goal
- **Smart split algorithm** — maps your inputs to the right split: Full Body, Push/Pull/Legs, Upper/Lower, Bro Split, or hybrids
- **Exercise engine** — 40+ exercises filtered by equipment, prioritising compounds first with deterministic seeded selection
- **Goal-aware sets/reps/rest** — adapts to Strength, Hypertrophy, Endurance, or General Fitness
- **Fatigue tracker** — per-muscle rolling fatigue scores with visual progress bars; decays between sessions
- **Daily workout** — date-seeded global workout, same for everyone on a given day, with streak tracking
- **Workout history** — log your sessions and track total sets over time
- **Zero dependencies** — no frameworks, no bundlers, no npm. Just open `index.html`

---

## Project Structure

```
forged/
├── index.html          # Main HTML — markup only, no inline styles or scripts
├── css/
│   └── style.css       # All styles, design tokens, responsive rules
├── js/
│   ├── db.js           # Exercise database (47 exercises) + equipment map
│   ├── engine.js       # Split algorithm, exercise picker, sets/reps logic, fatigue
│   ├── render.js       # All DOM rendering functions
│   └── app.js          # App state, event handlers, page navigation, init
└── README.md
```

### Script Load Order

Scripts must be loaded in this order (as declared in `index.html`):

1. `js/db.js` — defines `DB` and `EQ_ALLOWED` constants
2. `js/engine.js` — uses `DB`, `EQ_ALLOWED`, references `APP`
3. `js/render.js` — uses engine functions, references `APP`
4. `js/app.js` — defines `APP`, wires everything together, runs `init()`

---

## How to Run

### Option A — Open directly in a browser

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/forged.git
cd forged

# Open in your browser
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

No build step needed. No server needed.

### Option B — Serve locally (avoids any browser file:// quirks)

```bash
# Python 3
python -m http.server 3000

# Node.js (if you have npx)
npx serve .
```

Then visit `http://localhost:3000`.

---

## How It Works

### Split Algorithm (`engine.js → buildSplit`)

Maps training days + recovery ability + goal to a weekly split:

| Days | Low Recovery       | High Recovery         | Hypertrophy Focus |
|------|--------------------|-----------------------|-------------------|
| 1–2  | Full Body          | Full Body             | Full Body         |
| 3    | Full Body ×3       | Push / Pull / Legs    | Push / Pull / Legs|
| 4    | Upper / Lower      | Upper / Lower         | Upper / Lower     |
| 5    | PPL + Upper/Lower  | PPL + Upper/Lower     | Bro Split         |
| 6    | PPL × 2            | PPL × 2               | PPL × 2           |
| 7    | PPL + Rest + Upper | PPL + Rest + Upper    | PPL + Rest + Upper|

### Exercise Selection (`engine.js → pickExercises`)

1. Filters `DB` by equipment tier (cumulative: `full gym` includes all)
2. Separates compounds and isolations; compounds sorted by fatigue score descending
3. Deprioritises recently used exercises (moves them to the end of the pool)
4. Uses a seeded deterministic pick — same inputs always produce the same plan
5. Targets ~45% compounds, remainder isolations

### Sets / Reps / Rest (`engine.js → getSetsReps`)

| Goal          | Compound          | Isolation         |
|---------------|-------------------|-------------------|
| Strength      | 5 × 3–5, 3–5 min  | 3 × 6–8, 2 min    |
| Hypertrophy   | 4 × 6–10, 2–3 min | 3 × 10–15, 90 sec |
| Endurance     | 3 × 15–20, 45 sec | 3 × 15–20, 45 sec |
| General       | 4 × 6–10, 2–3 min | 3 × 10–15, 90 sec |

Training-to-failure drops one set from each exercise.

### Fatigue Tracking (`engine.js → updateFatigue`)

- Each exercise adds `fatigue_score × sets × 1.5` to its primary muscle's total
- After logging, all muscles decay by 18% (× 0.82) to simulate recovery
- Visual: `< 50%` = lime, `50–75%` = orange, `> 75%` = red

### Daily Workout

Seeded by `year × 100000 + month × 1000 + day`. Every user who opens the app on the same date gets the same workout, making it a shared daily challenge.

---

## Extending the Exercise Database

Add entries to `js/db.js` following this shape:

```js
{
  name:    'Cable Fly',          // Display name
  muscles: ['chest'],            // Primary muscles (used for split matching)
  sec:     ['front delt'],       // Secondary muscles
  eq:      ['machine'],          // Equipment: bodyweight | dumbbell | barbell | machine
  pattern: 'push',               // Movement: push | pull | hinge | squat | iso
  type:    'isolation',          // 'compound' or 'isolation'
  diff:    1,                    // Difficulty 1–3
  fat:     4,                    // Fatigue per set (1–10)
}
```

---

## Deploying to GitHub Pages

1. Push the repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch → main → / (root)**
4. Your site will be live at `https://YOUR_USERNAME.github.io/forged`

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). No polyfills required.

---

## License

MIT — do whatever you want with it.
