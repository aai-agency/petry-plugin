# build — bundles the real og-components chart into the artifact

`skills/get-well-production/assets/preview.html` is the self-contained production
artifact. Its chart is the **real `@aai-agency/og-components` `Chart`**
(`kind="line"`, React + uPlot) bundled inline, so the file renders offline with no
CDN, no build, and no token on the user's side. That file is **generated** — don't
hand-edit it.

## Regenerate

```bash
cd build
pnpm install        # og-components (from npm) + react + esbuild + tailwind
pnpm build          # writes ../skills/get-well-production/assets/preview.html
```

The committed artifact is the output; users of the plugin never run this.

## How it works

- `src/entry.jsx` — mounts the real `Chart` (`kind="line"`) from the well's
  `TimeSeries[]`, with an opt-in decline-forecast layer on the oil series and the
  vault events as annotations, exposed as `window.OGChart.render(el, chartData)`.
- `build.mjs` — esbuild bundles the component via the focused
  `@aai-agency/og-components/chart` export so only its true deps (React, uPlot)
  come along — importing the package index would drag in the deck.gl/mapbox
  `Map`. It then compiles Tailwind against the library's shipped `dist` and
  inlines the bundle + CSS into `template.skeleton.html`, leaving `{{TITLE}}` and
  `{{CHART_DATA_JSON}}` for the skill to fill at render time.
- `template.skeleton.html` — the card shell (header, KPIs, activity) with the
  chart mount.

## Source of the library

The build resolves `@aai-agency/og-components` from **npm** — it's a normal
dependency of this build package (see `package.json`), so the artifact tracks the
published version. Bump the pinned version there to adopt a new release, then
`pnpm install && pnpm build`.
