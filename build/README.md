# build — bundles the real og-components chart into the artifact

`skills/get-well-production/assets/preview.html` is the self-contained production
artifact. Its chart is the **real `@aai-agency/og-components` `LineChart`** (React
+ uPlot) bundled inline, so the file renders offline with no CDN, no build, and
no token on the user's side. That file is **generated** — don't hand-edit it.

## Regenerate

```bash
cd build
pnpm install        # just esbuild
pnpm build          # writes ../skills/get-well-production/assets/preview.html
```

The commited artifact is the output; users of the plugin never run this.

## How it works

- `src/entry.jsx` — mounts the real `LineChart` from the well's `TimeSeries[]`,
  exposed as `window.OGChart.render(el, chartData)`.
- `build.mjs` — esbuild bundles the component **from source**
  (`line-chart.tsx`, via a generated barrel) so only its true deps (React,
  uPlot) come along — importing the package index would drag in the
  deck.gl/mapbox `Map`. It then inlines the bundle + the library's `styles.css`
  into `template.skeleton.html`, leaving `{{TITLE}}` and `{{CHART_DATA_JSON}}`
  for the skill to fill at render time.
- `template.skeleton.html` — the card shell (header, KPIs, activity) with the
  chart mount.

## Source of the library

`@aai-agency/og-components` 0.4.1 is not on npm yet, so the build resolves it from
the local workspace at `~/Documents/aai-agency/os/aai-og-components/...`. Override
with `OG_COMPONENTS_DIR`. When 0.4.1 publishes, this can switch to an npm install.
