# BMT Mechanic App

Expo (React Native) mobile app — the **mechanic-facing** app for BMT. The
customer app is its sibling repo, `bmt-customer-app`; this one is built on the
same scaffold and the same design tokens, and shares its Supabase backend with
the CRM (`bookmytech`). Keep this codebase mechanic-only.

When something here has an equivalent in the customer app — a primitive, a
lib helper, a config choice — copy that rather than inventing a second way.

## Stack

- **Expo SDK 57**, React Native 0.86, React 19.2 — New Architecture enabled.
- **Expo Router** (file-based routing) under `src/app/`, typed routes on.
- **React Compiler** enabled (`experiments.reactCompiler`).
- TypeScript strict. Path alias `@/*` → `src/*`, `@/assets/*` → `assets/*`.
- Native iOS/Android folders are **not committed** — generated on demand via
  Continuous Native Generation (`npx expo prebuild`) / EAS Build. `.gitignore`
  excludes `/ios` and `/android`.

> Expo changes fast. Check the versioned docs at
> https://docs.expo.dev/versions/v57.0.0/ before writing native/config code.

## Layout

- `src/app/` — routes (screens). `_layout.tsx` is the root layout.
  - `(app)/(tabs)/` — the four hubs: Today · Jobs · Inbox · Account.
  - Everything pushed from a hub lives beside `(tabs)` in `(app)`, so it covers
    the tab bar.
- `src/components/` — shared components (`ui/` for primitives, copied from the
  customer app). `tab-bar.tsx` is the tab bar and its centre status button.
- `src/constants/theme.ts` — theme tokens: the customer app's file plus the
  mechanic additions from `design/TOKENS.md`, each marked "Mechanic app".
- `src/lib/status.tsx` — Online / Offline / On a job / Locked. In memory until
  the data layer lands.
- `design/` — the target mockups, the screen → route map and the token additions.

## Building screens

Read `design/README.md` first for the per-screen file map (mockup frame ↔
`src/app/*.tsx`) and the build order, and `design/TOKENS.md` for the tokens.
Any colour, radius, spacing or type value should resolve to `Palette.*`,
`Spacing.*`, `Radius.*` or `Typography.*` in `src/constants/theme.ts` — never a
raw hex or pixel; add the token first if it doesn't exist. Reg plates, job IDs
and account numbers use the `mono` text variant (JetBrains Mono). British
English throughout; no emoji in app copy.

Don't touch backend logic: all data comes from the existing Supabase schema. If
a screen needs a field that doesn't exist, the migration goes in the CRM repo.

## Commands

```bash
npm run ios        # build the native app and launch it on the iOS simulator
npm run android    # same for Android
npm run start      # Metro only, against an already-installed dev build
npm run web        # web target
npm run lint       # expo lint
npx tsc --noEmit   # typecheck (keep clean)
npx expo export --platform ios   # verify the iOS bundle builds
```

Re-run `npx expo prebuild --platform ios` after touching `app.json` plugins or
adding a native dependency. It regenerates `ios/` from scratch, so never hand-
edit anything in there — the folder is git-ignored and disposable.

The customer app's `expo-modules-jsi` patch is **not** needed here: this repo
resolves 57.1.0, where upstream already made the same fix.
