# Design tokens — mechanic app

Everything the customer app uses (Inter Tight, BMT blues, deep gradient,
float shadow, etc.) applies here. This file lists the **additions** that
the mechanic app needs on top.

Copy `src/constants/theme.ts` from the customer app verbatim as the
starting point, then merge these in.

## Online-status gradient

The tab-bar centre FAB isn't a plus button — it's a stateful pill. The
Online state uses a dedicated green gradient with a halo pulse so it reads
as the app's north-star signal.

```ts
export const OnlineGradient = ['#16A34A', '#22C55E'] as const;

export const Shadows = {
  // …existing card, hero, float shadows carry over
  /** Online FAB halo — the pulsing green ring around the status button. */
  onlineHalo: Platform.select({
    ios: {
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.42,
      shadowRadius: 28,
    },
    android: { elevation: 10 },
    web: {
      boxShadow:
        '0 12px 28px rgba(34,197,94,0.42), 0 0 0 5px #fff, 0 0 0 10px rgba(34,197,94,0.20)',
    },
    default: {},
  }),
} as const;
```

## Urgency halos

The mechanic app has two urgency signals the customer app never surfaces —
new job offers and disputes with a countdown.

```ts
export const Halo = {
  /** Red halo around a fresh offer tile — subtle pulse via Reanimated. */
  urgentRed: 'rgba(239, 68, 68, 0.20)',
  /** Blue halo around the "On a job" FAB. */
  onJobBlue: 'rgba(37, 99, 235, 0.14)',
  /** Green halo around the Online FAB. */
  onlineGreen: 'rgba(34, 197, 94, 0.20)',
} as const;
```

Use as `boxShadow: `0 0 0 4px ${Halo.urgentRed}`` on the offer card, and
run a `withRepeat(withTiming(...))` on its scale for the pulse.

## Gold — Pro tier

Pro-tier mechanics get lower commission and a small visual reward. The
gold gradient shows up on the Pro-progress card and the Pro badge on
their profile.

```ts
export const GoldGradient = ['#78350F', '#B45309', '#F59E0B'] as const;
```

Never use gold for primary CTAs — only for the Pro card + badge chip.

## Monospace for identifiers

Reg plates, job IDs (`BMT-A1B2`), account numbers (`Barclays •• 4831`) and
Stripe transfer IDs use **JetBrains Mono**. It gives them the "this is a
value" tone-of-voice that the CRM uses across desktop.

```ts
import {
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter_400Regular',
    display: 'InterTight_800ExtraBold',
    mono: 'JetBrainsMono_700Bold',
  },
  // …
});
```

## Signature pad — Caveat

Customer signatures are rendered on the completed-job card and the
signature-pad review view. Use the **Caveat** handwriting face — it reads
as a real signature rather than a system-italic stand-in.

```ts
import { Caveat_500Medium, Caveat_700Bold } from '@expo-google-fonts/caveat';
```

Only used for signature rendering — never for UI copy.

## Status-strip token group

The full-width strip above the body on a job detail screen swaps colour by
state. Define once, reference from every job-detail variant.

```ts
export const StatusStrip = {
  active:      { bg: '#EFF6FF',            fg: '#1E3A8A' }, // confirmed
  enRoute:     { bg: BrandGradient,        fg: '#FFFFFF' },
  inProgress:  { bg: '#FEF3C7',            fg: '#78350F' },
  completed:   { bg: '#DCFCE7',            fg: '#14532D' },
  cancelled:   { bg: '#FEE2E2',            fg: '#7F1D1D' },
} as const;
```

## Tab bar (mechanic variant)

Same footprint as the customer app (82pt tall, 4 tabs + centre FAB), with
these swaps:

```
Tabs (in order):
  Today   — icon: sun,             route: (tabs)/index
  Jobs    — icon: wrench,          route: (tabs)/jobs
  [Status FAB — Online/Offline/On a job — three visual states]
  Inbox   — icon: message-circle,  route: (tabs)/inbox
  Account — icon: user,            route: (tabs)/account

Status FAB (60×60, radius 30):
  Online:    OnlineGradient fill, "power" icon, "Online" label (green)
             Halo: Shadows.onlineHalo (pulses at 2s)
  Offline:   White fill, "power" icon, "Offline" label (muted)
             Ring: 5pt white + 6pt border
  On a job:  BrandGradient fill, "wrench" icon, "On a job" label (blue)
             Locked — tap goes nowhere until the job ends
```

The FAB colour cascades down into the little label under it — the user
should be able to tell state from four feet away.

## KPI card

Not on the customer app — small numeric summary tiles used on Today and
Earnings.

```
Width:       1fr (equal columns in a row)
Padding:     10 × 12
Radius:      12
Background:  Palette.surfaceCard
Border:      1px Palette.border
Label:       9.5pt Inter, weight 700, letter-spacing 0.8px, uppercase, Palette.textMuted
Value:       18pt Inter Tight, weight 800, letter-spacing -0.3px
Gap between: 6pt
```

Rows of KPIs never scroll horizontally — three or four across, max.

## Chart

Earnings dashboard chart is an area chart with the brand-blue fill,
stroked in blue on top. No axis labels, no gridlines — just three
dates below the chart. This is a "vibe" chart, not an analytics tool;
the numeric detail lives in the KPI row above it.

```
Height:      120pt
Background:  linear-gradient(180deg, rgba(37,99,235,0.15), transparent)
Radius:      10
Stroke:      Palette.blue, width 2, round caps
Fill:        rgba(37, 99, 235, 0.20)
Period tabs: 30d (default), 7d, Yr, All-time — as small dark pills
```
