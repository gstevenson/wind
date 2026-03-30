# Runway / Wind Calculator

A browser-based aviation tool that visualises wind conditions against your configured runways and calculates headwind and crosswind components in real time.

## What it does

- Draws an animated compass rose showing your runways
- Animates wind particles flowing from the reported wind direction
- Highlights the ideal runway for current conditions with a landing-direction airplane silhouette
- Displays headwind/tailwind and crosswind (left/right) components

Useful for any GA pilot who wants a quick sanity check before departure or when listening to the ATIS.

## Usage

Enter the reported wind direction (degrees) and wind speed (knots). The rose updates live:

| Field | Description |
|---|---|
| Wind Direction | Meteorological FROM direction, 0–359° |
| Wind Speed | Knots |

Use the **−** / **+** stepper buttons to nudge direction by 10° or speed by 1 kt — handy on mobile.

Runways are stored in `localStorage` so your configuration persists between visits. Hit **Reconfigure runways** to change them or **Reset** to restore defaults.

### Runway input format

Runways are entered as a comma-separated list of runway numbers (not headings):

```
09, 27
09,27
09, 27, 14, 32
```

## Development

```bash
npm ci           # install dependencies
npm start        # webpack dev server at http://localhost:8080 (live reload)
npm test         # run unit tests (vitest)
npm run build    # production build → ./dist
```

Requires **Node 22+**.

## Project structure

```
├── index.html                  # app shell
├── js/
│   ├── app.js                  # canvas rendering and DOM interaction
│   ├── wind-calc.js            # pure calculation functions
│   └── wind-calc.test.js       # unit tests
├── css/
│   └── style.css
├── webpack.common.js
├── webpack.config.dev.js
├── webpack.config.prod.js
└── .github/workflows/
    └── deploy.yml              # CI/CD pipeline
```

## CI/CD

The GitHub Actions workflow in `.github/workflows/deploy.yml` runs on every push to `main` and on pull requests:

1. **Install** — `npm ci` for a clean, reproducible install
2. **Build** — `npm run build` compiles and minifies to `./dist`
3. **Test** — `npm test` runs the vitest unit test suite
4. **Deploy** — on push to `main` only, the `./dist` directory is published to GitHub Pages

Pull request runs execute steps 1–3 only (no deploy), so every PR is validated before merge.

## How the maths works

Wind components are calculated using vector decomposition:

- **Headwind** = `windSpeed × cos(angle between wind and runway heading)`
- **Crosswind** = `windSpeed × sin(angle between wind and runway heading)`

A positive headwind value means a true headwind; negative means a tailwind. Crosswind direction (left/right) is determined by the sign of the cross product.

The ideal runway is whichever heading in your configured set minimises crosswind for the current wind direction.
