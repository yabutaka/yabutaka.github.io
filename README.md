# yabutaka.github.io

Personal site for Takashi Yabuta. Plain HTML, CSS and JavaScript served by GitHub Pages, with no build step.

- `index.html`: the page content
- `assets/style.css`: styles
- `assets/field.js`: the animated ASCII background
- `assets/profile.jpg`: profile photo

Preview locally with `python3 -m http.server` and open http://localhost:8000.

## 3D rooms (`room/`)

Interactive three.js versions of the page: a desk whose CRT shows the homepage content. three.js loads from a CDN; there is still no build step.

- `room/`: the ski cabin on a snowy day (the default room)
- `room/night/`: rainy Vancouver night (standalone `room.js`)
- `room/harbour/`: sunny modern studio over the water
- `room/trailhead/`: summer log cabin above an alpine lake
- `room/kit/`: shared engine (`core.js`), props (`objects.js`), scenery (`outside.js`), room shells (`rooms.js`), click animations (`fun.js`) and HUD styles

Postcards on each room's wall switch between rooms.
