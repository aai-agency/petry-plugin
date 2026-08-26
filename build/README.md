# Reproducible artifact build

`skills/get-well-production/assets/preview.html` is a generated template for the
self-contained production profile. It bundles the real published
`@aai-agency/og-components` `DeclineCurve` (React + uPlot) and the component's
compiled Tailwind CSS, so rendered profiles work offline.

The build dependencies are exact-version pinned. It imports the package's
`/decline-curve` subpath to keep mapbox and deck.gl out of the artifact.

## Regenerate

```bash
pnpm --dir build install --frozen-lockfile
pnpm --dir build build
```

Commit the generated template. Plugin users never install these dependencies.

## Verify

```bash
pnpm --dir build check
```

The check rebuilds in memory and fails when the committed template differs,
when an internal bundle placeholder remains, or when map dependencies leak into
the chart-only bundle.

## Runtime filling

The committed file intentionally retains one `{{CHART_DATA_JSON}}` placeholder.
Do not replace it manually. `scripts/render-preview.mjs` safely serializes chart
data into the template and writes the user-facing HTML artifact.
