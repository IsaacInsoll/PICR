# Frontend Styling

## Mantine-first approach

For frontend UI work, prefer Mantine-idiomatic styling:

- Use Mantine components/props (`Paper`, `Overlay`, `Container`, spacing/radius/shadow props) before adding custom wrapper styles.
- Use theme tokens/helpers (`useMantineTheme`, `alpha`, color scales, `primaryColor`) instead of hardcoded hex/RGBA values.
- Keep inline styles for runtime-only values (for example transforms and computed dimensions).

## Typed CSS modules

PICR uses typed CSS modules in `frontend/src/**/*.module.css`.

- Generator: `typed-css-modules` (`tcm`)
- Generated files: `*.module.css.d.ts`
- These generated files are committed

### Commands

Run from `frontend/`:

```bash
npm run css:types        # generate/update .module.css.d.ts files
npm run css:types:check  # fail if generated files are out of date
npm run css:types:watch  # watch mode
```

### Dot notation preference

Use dot notation for classes:

```ts
styles.bannerHeader;
```

Avoid bracket notation unless truly necessary.

To keep dot notation ergonomic:

- Use **camelCase** class names in CSS modules (for example `.bannerHeader`, not `.banner-header`).
- Regenerate CSS module types after class changes.

### CI and local workflow integration

- `cd frontend && npm run lint` automatically runs `css:types:check` first.
- Root `npm start` automatically runs `start:css:types` (`css:types:watch`) so declarations stay updated during dev.

### Prettier note

Generated CSS module declarations are excluded in `.prettierignore` to avoid formatting drift from `typed-css-modules` output.
