/**
 * Book My Tech design tokens, ported to React Native.
 *
 * Copied from the customer app (`bmt-customer-app/src/constants/theme.ts`) so
 * the two apps stay visually identical — a shared token changes there first.
 * The mechanic-only additions from `design/TOKENS.md` are marked as such.
 *
 * Source of truth: `bookmytech/docs/03-design-system.md` and
 * `bookmytech/proposal/tokens.css`. Any token change should land in the CRM
 * first, then be mirrored here — the two apps must stay visually identical.
 *
 * The app is light-only by design (the CRM has no dark theme). `Colors` keeps a
 * `light`/`dark` shape so the Expo template's `useThemeColor` hooks keep
 * working, but both maps hold the same values.
 */

import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

export const Brand = {
  /** Primary CTA, active states, brand accents */
  blue: '#2563EB',
  /** Hero gradient start, headings on dark */
  blueDark: '#1E3A8A',
  /** Hero gradient end, hover accents */
  blueLight: '#3B82F6',
  /** Tinted brand surface — selected cards, icon tiles */
  blueTint: '#EFF6FF',
  /** Stronger brand tint — active pills, map fills */
  blueTintStrong: '#DBEAFE',
  /** Deep-gradient start — splash, welcome, "You're booked" */
  blueDeepest: '#0B1F52',
} as const;

export const Palette = {
  ...Brand,

  /** Page background */
  surface: '#F8FAFC',
  /** Card and panel background */
  surfaceCard: '#FFFFFF',
  /** Inverted surface — live-status bars, dark buttons */
  surfaceDark: '#0F172A',
  /** Deeper inverted surface — live-status strips, quote totals */
  surfaceDarkDeep: '#0B1220',

  /** Default border colour */
  border: '#E2E8F0',
  /** Internal dividers within cards */
  borderSubtle: '#F1F5F9',

  /** Body text, headings */
  textPrimary: '#0F172A',
  /** Supporting copy */
  textSecondary: '#475569',
  /** Captions, metadata */
  textMuted: '#64748B',
  /** Disabled, decorative numbers */
  textDisabled: '#CBD5E1',
  /** Faintest copy — legal footnotes under CTAs */
  textFaint: '#94A3B8',
  /** Text on brand/dark surfaces */
  textInverse: '#FFFFFF',

  /** Green check, "available" states */
  success: '#22C55E',
  /** Pending, surge, attention */
  warning: '#F59E0B',
  /** Errors, rejected */
  danger: '#EF4444',

  /** UK reg-plate background */
  plateYellow: '#FEF3C7',

  /** Title and copy on an amber `warn` callout */
  warningText: '#78350F',
  /** Mechanic app: title and copy on a green `success` callout */
  successText: '#14532D',
  /** A saved payment card that isn't the default one */
  paymentCard: '#334155',
} as const;

export type PaletteColor = keyof typeof Palette;

/**
 * White at reduced strength, for text and fills on the deep gradient and dark
 * strips — the `rgba(255,255,255,…)` values in the mockups.
 */
export const OnDark = {
  /** Hero tile behind a welcome illustration */
  tile: 'rgba(255, 255, 255, 0.10)',
  /** Supporting copy under a headline */
  textSecondary: 'rgba(255, 255, 255, 0.78)',
  /** "Skip" */
  link: 'rgba(255, 255, 255, 0.75)',
  /** Uppercase status line on a dark strip */
  textFaint: 'rgba(255, 255, 255, 0.65)',
  /** Footnote under a CTA */
  textMuted: 'rgba(255, 255, 255, 0.60)',
  /** Copy that has to hold up on a busy hero — the price card's job names */
  textStrong: 'rgba(255, 255, 255, 0.85)',
  /** Icon tile and pill on a dark card, and that card's outline */
  fill: 'rgba(255, 255, 255, 0.14)',
  /** The circle on "You're all booked." */
  fillStrong: 'rgba(255, 255, 255, 0.18)',
  /** Outline of a pill on the deep gradient */
  border: 'rgba(255, 255, 255, 0.20)',
  /** Brand, name and expiry on a saved payment card */
  cardText: 'rgba(255, 255, 255, 0.70)',
  /** Contactless mark on a saved payment card */
  cardIcon: 'rgba(255, 255, 255, 0.50)',
} as const;

/**
 * Tag/pill tints — background + foreground pairs. Mirrors `Pill` in
 * `bookmytech/proposal/primitives.jsx` and the `--color-tag-*` vars in
 * tokens.css.
 */
export const Tones = {
  active: { bg: '#DBEAFE', fg: '#1E3A8A' },
  success: { bg: '#DCFCE7', fg: '#15803D' },
  pending: { bg: '#FEF3C7', fg: '#B45309' },
  error: { bg: '#FEE2E2', fg: '#B91C1C' },
  neutral: { bg: '#F1F5F9', fg: '#334155' },
  info: { bg: '#E0E7FF', fg: '#3730A3' },
  accent: { bg: '#EFF6FF', fg: '#2563EB' },
  dark: { bg: '#0F172A', fg: '#FFFFFF' },
  outline: { bg: '#FFFFFF', fg: '#2563EB', border: '#2563EB' },
  /** Solid brand tile — the matched vehicle on the booking flow's first step */
  brand: { bg: '#2563EB', fg: '#FFFFFF' },
  /** On the deep gradient — "You're booked"'s booking-ID pill and icon tiles */
  onDark: {
    bg: 'rgba(255, 255, 255, 0.14)',
    fg: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.20)',
  },
} as const;

export type Tone = keyof typeof Tones;

/** Avatar background/foreground tints, cycled by index when stacked. */
export const AvatarTints = [
  { bg: '#DBEAFE', fg: '#1E3A8A' },
  { bg: '#DCFCE7', fg: '#15803D' },
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#FEE2E2', fg: '#B91C1C' },
  { bg: '#E0E7FF', fg: '#3730A3' },
  { bg: '#E2E8F0', fg: '#334155' },
] as const;

/** Hero / price-card gradient — `linear-gradient(135deg, ...)` in the CRM. */
export const BrandGradient = ['#1E3A8A', '#2563EB', '#3B82F6'] as const;

/**
 * Deep hero — splash, welcome carousel, "You're booked". Same 135° as
 * `BrandGradient`: `start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}`.
 */
export const BrandGradientDeep = ['#0B1F52', '#1E3A8A', '#2563EB'] as const;

/** Mechanic app: the Online status button's fill. Runs top-left to bottom-right. */
export const OnlineGradient = ['#16A34A', '#22C55E'] as const;

/**
 * Mechanic app: Pro tier — the Pro-progress card and the Pro badge only, never
 * a primary CTA.
 */
export const GoldGradient = ['#78350F', '#B45309', '#F59E0B'] as const;

/** Mechanic app: soft rings that signal urgency or the current status. */
export const Halo = {
  /** Around a fresh offer tile */
  urgentRed: 'rgba(239, 68, 68, 0.20)',
  /** Around the "On a job" status button */
  onJobBlue: 'rgba(37, 99, 235, 0.14)',
  /** Around the Online status button */
  onlineGreen: 'rgba(34, 197, 94, 0.20)',
} as const;

/**
 * Mechanic app: the full-width strip above a job's body, by booking status.
 * `enRoute` is a gradient, the rest are flat fills.
 */
export const StatusStrip = {
  active: { bg: '#EFF6FF', fg: '#1E3A8A' },
  enRoute: { bg: BrandGradient, fg: '#FFFFFF' },
  inProgress: { bg: '#FEF3C7', fg: '#78350F' },
  completed: { bg: '#DCFCE7', fg: '#14532D' },
  cancelled: { bg: '#FEE2E2', fg: '#7F1D1D' },
} as const;

/**
 * Strict spacing scale — 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. No arbitrary
 * values. Numeric keys read closer to the design doc than the Expo template's
 * `half/one/two` names.
 */
export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
} as const;

export const Radius = {
  input: 8,
  button: 10,
  /** Icon tiles and other inner elements */
  inner: 10,
  tile: 12,
  /** The largest icon tile (56pt) */
  tileXl: 14,
  card: 16,
  /** Welcome carousel hero tile */
  hero: 24,
  /** First-time empty-state illustration */
  emptyHero: 28,
  pill: 999,
  /** Saved payment card */
  paymentCard: 14,
} as const;

/**
 * Font families. On native each weight is its own file, registered by
 * `useFonts` in `app/_layout.tsx` under the name below — so the name *is* the
 * weight. Web takes a family stack and picks the face from `fontWeight`.
 *
 * Inter Tight is the display face (headings); Inter is the body face.
 * Mechanic app: JetBrains Mono sets reg plates, job IDs and account numbers.
 */
export const Fonts = Platform.select({
  ios: {
    sans: 'Inter_400Regular',
    sansBold: 'Inter_700Bold',
    display: 'InterTight_800ExtraBold',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'JetBrainsMono_700Bold',
  },
  android: {
    sans: 'Inter_400Regular',
    sansBold: 'Inter_700Bold',
    display: 'InterTight_800ExtraBold',
    serif: 'serif',
    rounded: 'normal',
    mono: 'JetBrainsMono_700Bold',
  },
  default: {
    sans: 'normal',
    sansBold: 'normal',
    display: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'Inter, system-ui, sans-serif',
    sansBold: 'Inter, system-ui, sans-serif',
    display: 'Inter Tight, Inter, sans-serif',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'JetBrains Mono, var(--font-mono)',
  },
});

export type FontFamily = 'sans' | 'display' | 'mono';

/** Every face `app/_layout.tsx` loads, by family and weight. */
const Faces: Record<FontFamily, Record<number, string>> = {
  sans: {
    400: 'Inter_400Regular',
    500: 'Inter_500Medium',
    600: 'Inter_600SemiBold',
    700: 'Inter_700Bold',
  },
  display: {
    600: 'InterTight_600SemiBold',
    700: 'InterTight_700Bold',
    800: 'InterTight_800ExtraBold',
    900: 'InterTight_900Black',
  },
  mono: {
    600: 'JetBrainsMono_600SemiBold',
    700: 'JetBrainsMono_700Bold',
  },
};

function numericWeight(weight: TextStyle['fontWeight']) {
  if (weight === 'bold') return 700;
  const value = Number(weight);
  return Number.isFinite(value) && value > 0 ? value : 400;
}

/**
 * A family at a weight. Native names the nearest loaded face and sets no
 * `fontWeight` — on top of a face that is already bold, Android would
 * synthesise bold again. Web takes the family stack and picks the face from
 * the weight.
 */
export function fontFace(
  family: FontFamily,
  weight: TextStyle['fontWeight'] = '400',
): TextStyle {
  if (Platform.OS === 'web') return { fontFamily: Fonts[family], fontWeight: weight };

  const target = numericWeight(weight);
  const nearest = Object.keys(Faces[family])
    .map(Number)
    .reduce((best, w) => (Math.abs(w - target) < Math.abs(best - target) ? w : best));
  return { fontFamily: Faces[family][nearest] };
}

/**
 * The family a native face belongs to, so a weight can be re-picked within it.
 * No face at all is body text; a face `fontFace` didn't hand out is null.
 */
export function familyOfFace(fontFamily: string | undefined): FontFamily | null {
  if (!fontFamily) return 'sans';
  if (fontFamily.startsWith('InterTight_')) return 'display';
  if (fontFamily.startsWith('Inter_')) return 'sans';
  if (fontFamily.startsWith('JetBrainsMono_')) return 'mono';
  return null;
}

/**
 * Type scale. Headings are Inter Tight, body copy Inter. RN takes letter
 * spacing in points, so the values are the mockups' pixel values as-is.
 */
export const Typography = {
  display: { fontSize: 40, ...fontFace('display', '800'), letterSpacing: -1, lineHeight: 46 },
  h1: { fontSize: 28, ...fontFace('display', '800'), letterSpacing: -0.7, lineHeight: 34 },
  h2: { fontSize: 24, ...fontFace('display', '800'), letterSpacing: -0.5, lineHeight: 30 },
  h3: { fontSize: 20, ...fontFace('display', '700'), letterSpacing: -0.4, lineHeight: 26 },
  h4: { fontSize: 18, ...fontFace('display', '700'), letterSpacing: -0.2, lineHeight: 24 },
  /** Welcome carousel headline. */
  hero: { fontSize: 34, ...fontFace('display', '800'), letterSpacing: -0.9, lineHeight: 38 },
  /** Screen header title. */
  headerTitle: { fontSize: 17, ...fontFace('display', '700'), letterSpacing: -0.3, lineHeight: 22 },
  bodyLg: { fontSize: 16, ...fontFace('sans', '400'), lineHeight: 24 },
  body: { fontSize: 14, ...fontFace('sans', '400'), lineHeight: 21 },
  bodySm: { fontSize: 13, ...fontFace('sans', '400'), lineHeight: 20 },
  caption: { fontSize: 12, ...fontFace('sans', '400'), lineHeight: 17 },
  /** Form field label. */
  label: { fontSize: 12, ...fontFace('sans', '600'), lineHeight: 17 },
  /** Label on a large (`lg`/`xl`) button. */
  button: { fontSize: 15, ...fontFace('sans', '700'), letterSpacing: -0.1, lineHeight: 20 },
  overline: {
    fontSize: 11,
    ...fontFace('sans', '700'),
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  /** Status pill. */
  pill: {
    fontSize: 10.5,
    ...fontFace('sans', '700'),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  /** Tab-bar label — 10pt Inter 700. */
  tabLabel: { fontSize: 10, ...fontFace('sans', '700'), letterSpacing: 0.1, lineHeight: 13 },
  /** A price set large — the price step's hero and the confirm step's total. */
  amount: { fontSize: 46, ...fontFace('display', '800'), letterSpacing: -1.2, lineHeight: 48 },
  /** UK number plate. */
  plate: { fontSize: 32, ...fontFace('display', '900'), letterSpacing: 2, lineHeight: 38 },
  /** Heading inside a selectable tile — an arrival window. */
  tileTitle: { fontSize: 15, ...fontFace('display', '700'), letterSpacing: -0.2, lineHeight: 20 },
  /** Sentence-case pill — a repair's price tag. */
  pillLg: { fontSize: 12.5, ...fontFace('sans', '700'), lineHeight: 16 },
  /** Masked number on a saved payment card — `•••• •••• •••• 4242`. */
  cardNumber: { fontSize: 16, ...fontFace('display', '700'), letterSpacing: 2, lineHeight: 22 },
  /** Mechanic app: an identifier — a job ID, a reg in a row, an account number. */
  mono: { fontSize: 13, ...fontFace('mono', '700'), lineHeight: 18 },
  /** Mechanic app: a reg inline in a caption. */
  monoSm: { fontSize: 12, ...fontFace('mono', '600'), lineHeight: 17 },
  /** Mechanic app: KPI tile label — 9.5pt Inter 700, uppercase. */
  kpiLabel: {
    fontSize: 9.5,
    ...fontFace('sans', '700'),
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    lineHeight: 13,
  },
  /** Mechanic app: "You earn" on the offer screen. */
  payout: { fontSize: 56, ...fontFace('display', '800'), letterSpacing: -1.5, lineHeight: 58 },
  /** Mechanic app: the figure in the middle of the goal ring. */
  ringValue: { fontSize: 24, ...fontFace('display', '800'), letterSpacing: -0.5, lineHeight: 28 },
  /** Mechanic app: a job's start time in a list row. */
  jobTime: { fontSize: 16, ...fontFace('display', '800'), letterSpacing: -0.3, lineHeight: 20 },
  /** Mechanic app: KPI tile value. */
  kpiValue: { fontSize: 18, ...fontFace('display', '800'), letterSpacing: -0.3, lineHeight: 24 },
} as const;

export const Weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/**
 * Shadows. RN needs the iOS/Android split, so each token carries both plus the
 * web `boxShadow` for the react-native-web target. The coloured ones are a
 * plain `boxShadow`, which the New Architecture draws on both platforms —
 * Android's `elevation` can only cast grey.
 */
export const Shadows = {
  /** Card: `0 4px 20px rgba(15,23,42,0.05)` */
  card: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 20,
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)' },
    default: {},
  }),
  /** Floating hero card: `0 20px 60px rgba(15,23,42,0.25)` */
  hero: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 60,
    },
    android: { elevation: 12 },
    web: { boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)' },
    default: {},
  }),
  /**
   * Elevated card — first-time empty states, "sent" cards, mechanic profile
   * hero: `0 12px 32px rgba(15,23,42,0.10)`
   */
  float: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 32,
    },
    android: { elevation: 6 },
    web: { boxShadow: '0 12px 32px rgba(15, 23, 42, 0.10)' },
    default: {},
  }),
  /** Book FAB glow: `0 12px 28px rgba(37,99,235,0.42)` */
  fab: Platform.select({
    ios: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.42,
      shadowRadius: 28,
    },
    android: { elevation: 8 },
    web: { boxShadow: '0 12px 28px rgba(37, 99, 235, 0.42)' },
    default: {},
  }),
  /**
   * Mechanic app: glow under the Online status button. Its white and green
   * rings are views in `components/tab-bar.tsx`, not shadows, so the green one
   * can pulse.
   */
  onlineHalo: Platform.select({
    ios: {
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.42,
      shadowRadius: 28,
    },
    android: { elevation: 10 },
    web: { boxShadow: '0 12px 28px rgba(34, 197, 94, 0.42)' },
    default: {},
  }),
  /**
   * Mechanic app: the Offline status button — a faint lift, and the grey
   * hairline round its white ring: `0 4px 12px rgba(15,23,42,0.10), 0 0 0 1px #E2E8F0`
   */
  fabOffline: {
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.10), 0 0 0 1px #E2E8F0',
  },
  /** Primary button lift: `0 4px 12px rgba(37,99,235,0.25)` */
  button: { boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' },
  /** Blue glow around a welcome hero tile — the mockup's radial halo. */
  halo: { boxShadow: '0 0 60px 4px rgba(59, 130, 246, 0.35)' },
  /** Focused text field: `0 0 0 4px rgba(37,99,235,0.10)` */
  focusRing: { boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.10)' },
  /** UK number plate lift: `0 4px 12px rgba(180,83,9,0.15)` */
  plate: { boxShadow: '0 4px 12px rgba(180, 83, 9, 0.15)' },
} as const;

/** Component sizing constants shared across primitives. */
export const Sizing = {
  inputHeight: 48,
  /** Inner horizontal padding of a text field */
  inputPaddingX: 14,
  /** Between a text field's icon, its text and the reveal toggle */
  inputGap: 10,
  /** Icons inside a text field */
  fieldIcon: 18,
  buttonHeight: { sm: 32, md: 40, lg: 48, xl: 52 },
  /** Mechanic app: KPI tile — padding and the gap between tiles in a row */
  kpi: { paddingY: 10, paddingX: 12, gap: 6 },
  /** Horizontal padding inside a mobile screen — 18px in the proposal mockups */
  screenPadding: 18,
  /** Inside a list card or row, and either side of a filter chip's label */
  compactPadding: 14,
  /** Screen header row, below the status bar */
  header: 56,
  /** Back button's tap target, and the chevron inside it */
  backButton: 32,
  backIcon: 22,
  /** The customer's initials in a hub screen's header */
  headerAvatar: 32,
  /** Status pill padding */
  pillPaddingY: 3,
  pillPaddingX: 10,
  /** Icon tiles — `.tile.sm`, `.tile`, `.tile.lg`, `.tile.xl` in the mockups — and each glyph */
  iconTile: {
    sm: { box: 32, glyph: 16 },
    md: { box: 40, glyph: 20 },
    lg: { box: 48, glyph: 24 },
    xl: { box: 56, glyph: 28 },
  },
  /** First-time empty-state illustration, and the icon inside it */
  emptyHero: { box: 96, glyph: 44 },
  /** Welcome carousel hero tile, and the illustration inside it */
  heroTile: 180,
  heroIcon: 96,
  /** Carousel page dots, unread dots and live pulses — idle, and the stretched current one */
  dot: 8,
  dotActive: 24,
  /** Password-strength segments */
  strengthBar: 4,
  /** Booking-flow progress track */
  stepperTrack: 4,
  /** Narrowest day chip on the booking flow's time step */
  dayChip: 56,
  /** The circle on "You're all booked.", and the tick inside it */
  checkHero: { box: 64, glyph: 32 },
  /** Sentence-case pill's vertical padding — a repair's price tag */
  pillLgPaddingY: 4,
  /** Trailing chevron on a tappable list row — settings, help articles */
  rowChevron: 18,
  /** Saved payment card — its least height, and the contactless mark in its corner */
  paymentCard: { minHeight: 110, icon: 22 },
} as const;

/**
 * Bottom tab bar (`components/tab-bar.tsx`). Same footprint as the customer
 * app; the centre button is the status button rather than Book. The mockup's 82pt bar is 10 top
 * padding + 42 content + the home-indicator inset; on device the inset is the
 * real safe area, floored at `minBottomInset` for phones without one.
 */
export const TabBar = {
  paddingTop: 10,
  contentHeight: 42,
  minBottomInset: 12,
  iconSize: 22,
  iconStroke: 2,
  iconStrokeActive: 2.4,
  labelGap: 3,
  /** Centre status button — a 60pt circle… */
  fabSize: 60,
  /** …inside a white ring this thick… */
  fabRing: 5,
  /** …whose circle rises this far above the bar's top edge. */
  fabLift: 20,
  fabIconSize: 26,
  fabIconStroke: 2.6,
  /** Mechanic app: the Inbox tab's unread dot. */
  unreadDot: 10,
  /** The Online state's green ring, outside the white one… */
  fabHalo: 5,
  /** …and how long it takes to fade out and back. */
  fabHaloCycleMs: 2000,
  /** The status label's offset from the bar's top edge, under the button. */
  fabLabelTop: 44,
} as const;

/**
 * Kept for the Expo template's themed primitives. Light-only: both maps are
 * identical, so `useColorScheme()` has no visual effect.
 */
const scheme = {
  text: Palette.textPrimary,
  textSecondary: Palette.textSecondary,
  background: Palette.surface,
  backgroundElement: Palette.surfaceCard,
  backgroundSelected: Palette.blueTint,
} as const;

export const Colors = { light: scheme, dark: scheme } as const;

export type ThemeColor = keyof typeof scheme;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/*
 * Booking detail (mockup 04) — the booking, its quotes and revisions, messages,
 * disputes and the mechanic profile.
 */

/**
 * Callouts that must not read as blue. (The amber one is `Card`'s `warn` tone
 * with `Palette.warningText`.)
 */
export const Callout = {
  /** The fee on "Cancel this booking?" — `.card.dngr-tint` */
  danger: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    /** Captions on the pink card */
    ink: '#7F1D1D',
    /** The fee itself */
    strong: Tones.error.fg,
  },
} as const;

/** Dark layers over a photo thumbnail. */
export const Scrim = {
  /** While the photo uploads */
  busy: 'rgba(15, 23, 42, 0.45)',
  /** A photo that failed to upload */
  error: 'rgba(239, 68, 68, 0.80)',
  /** The remove button in the thumbnail's corner */
  control: 'rgba(15, 23, 42, 0.70)',
} as const;

/** Message threads — `.chat-mine` / `.chat-theirs` in the mockup. */
export const Chat = {
  /** Bubble corners, and the sender's own corner pinched in */
  bubbleRadius: 14,
  tailRadius: 4,
  /** How far across the thread a bubble may stretch */
  bubbleMaxWidth: '75%',
  /** The avatar beside the name in a thread's header */
  headerAvatar: 36,
} as const;

/** Sizes the booking-detail screens share. */
export const DetailSizing = {
  /** The live map above the mechanic row */
  mapHeight: 150,
  /** Pins on that map, the glyph inside each, and their white ring */
  mapPin: 30,
  mapPinIcon: 14,
  mapPinRing: 3,
  /** Map padding kept clear of pins when framing both */
  mapFramePadding: 48,
  /** An icon inline in a row or callout, and a row's trailing chevron */
  rowIcon: 18,
  /** Stars beside a name, under the profile's name, and the row on "Leave a review" */
  starInline: 12,
  starProfile: 14,
  starRating: 34,
  /** Tap target around each of those big stars */
  starTarget: 38,
  /** The mechanic profile's avatar */
  profileAvatar: 72,
  /** A reschedule day chip's narrowest width */
  dayChip: 52,
  /** Dispute photo thumbnails, their remove button and its cross */
  photo: 60,
  photoRemove: 20,
  photoRemoveIcon: 12,
  /** The dashed border of the "Add" photo tile */
  addPhotoBorder: 2,
  /** The tick inside a selected review tag */
  chipIcon: 14,
} as const;

/** Mechanic app: photo thumbnails on a job. */
export const JobPhotos = { size: 72 } as const;

/** Mechanic app: `components/ui/sheet.tsx` — the handle at the top of a bottom sheet. */
export const Sheet = { grabberWidth: 36, grabberHeight: 4 } as const;

/** Mechanic app: `components/goal-ring.tsx` — today's earnings against the daily goal. */
export const GoalRing = {
  size: 120,
  stroke: 10,
  track: 'rgba(255, 255, 255, 0.16)',
  /** Amber on the way there, green once the goal is met */
  progress: '#F59E0B',
  met: '#22C55E',
} as const;

/** Mechanic app: `components/offer-card.tsx` — a live offer in the feed. */
export const OfferCard = {
  /** Map-pin and clock beside the where and when */
  metaIcon: 12,
  /** Width of the red halo round a fresh offer */
  halo: 4,
} as const;

/** Mechanic app: the offer screen — the payout set large on the brand gradient. */
export const OfferHero = {
  tile: 66,
  tileRadius: 18,
  glyph: 32,
  detailIcon: 16,
  acceptHeight: 60,
} as const;

/** Mechanic app: the green power button on "You're all set." and its halo. */
export const ReadyHero = { box: 72, glyph: 34, halo: 10 } as const;

/** Mechanic app: `components/ui/slider.tsx` — the service-radius slider. */
export const Slider = {
  track: 6,
  thumb: 22,
  thumbBorder: 3,
  /** Tall enough to grab with a thumb */
  hitHeight: 44,
} as const;

/** A live status's breathing dot — in a pill, or on a live strip. */
export const LivePulse = {
  /** Diameter inside a pill; a strip uses `Sizing.dot` */
  pillSize: 6,
  /** The lowest opacity the dot fades to */
  dimmed: 0.35,
  /** Each fade, out or in */
  halfCycleMs: 1000,
} as const;

/**
 * Mechanic app: `components/earnings-chart.tsx` — the "vibe" area chart on
 * Earnings, per `design/TOKENS.md` § Chart. No axes, no gridlines; the numbers
 * live in the KPI row above it.
 */
export const EarningsChart = {
  height: 120,
  stroke: 2,
  /** The area under the line */
  fill: 'rgba(37, 99, 235, 0.20)',
  /** The card's wash behind the chart, top to bottom */
  wash: ['rgba(37, 99, 235, 0.15)', 'rgba(37, 99, 235, 0)'] as const,
  /** Empty period: a flat line at the baseline in this colour */
  empty: 'rgba(37, 99, 235, 0.25)',
} as const;

/** Mechanic app: the Go Pro screen — its page wash, and the progress bar on the gold card. */
export const ProScreen = {
  /** `#FFFBF3` in the mockup: the page behind the gold card */
  background: '#FFFBF3',
  /** Title and back chevron on that page */
  ink: '#78350F',
  barTrack: 'rgba(255, 255, 255, 0.20)',
  barHeight: 8,
} as const;

/** Mechanic app: `components/stars.tsx` — a rating as five stars, on Reviews and the Account card. */
export const ReviewStars = { size: 14, sizeLg: 20, gap: 2 } as const;
