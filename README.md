# yabutaka.github.io

Personal site for Takashi Yabuta. Plain HTML, CSS and JavaScript served by GitHub Pages, with no build step.

The home page is an interactive three.js desk whose CRT shows the site content. three.js loads from a CDN.

- `index.html`, `scene.js`: the ski cabin on a snowy day (the home page)
- `night/`: rainy Vancouver night (standalone `room.js`)
- `harbour/`: sunny modern studio over the water
- `trailhead/`: summer log cabin above an alpine lake
- `kit/`: shared engine (`core.js`), props (`objects.js`), scenery (`outside.js`), room shells (`rooms.js`), click animations (`fun.js`) and HUD styles
- `plain/`: the plain HTML version of the page, with `assets/style.css` and `assets/field.js` (the animated ASCII background)
- `assets/`: shared images, styles and scripts

Postcards on each room's wall switch between rooms; the "plain" button goes to `plain/`.

Preview locally with `python3 -m http.server` and open http://localhost:8000.
