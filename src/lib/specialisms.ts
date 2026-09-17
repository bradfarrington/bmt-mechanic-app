import {
  BatteryCharging,
  ClipboardCheck,
  Disc3,
  Droplets,
  Gauge,
  Snowflake,
  Stethoscope,
  Timer,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';

export interface Specialism {
  slug: string;
  name: string;
  icon: LucideIcon;
}

/**
 * Mirrors `lib/specialisms.ts` in the CRM — same slugs, same names, so what a
 * mechanic picks here reads identically on their web profile. Informational
 * only: dispatch does not filter on specialisms.
 */
export const SPECIALISMS: readonly Specialism[] = [
  { slug: 'full-service', name: 'Full Service', icon: Droplets },
  { slug: 'interim-service', name: 'Interim Service', icon: Gauge },
  { slug: 'diagnostic', name: 'Diagnostic', icon: Stethoscope },
  { slug: 'front-brake-pads', name: 'Front Brake Pads', icon: Wrench },
  { slug: 'front-brake-discs-pads', name: 'Front Brake Discs & Pads', icon: Disc3 },
  { slug: 'battery-replacement', name: 'Battery Replacement', icon: BatteryCharging },
  { slug: 'clutch-replacement', name: 'Clutch Replacement', icon: Disc3 },
  { slug: 'cambelt-replacement', name: 'Cambelt Replacement', icon: Timer },
  { slug: 'mot-precheck', name: 'MOT Pre-check', icon: ClipboardCheck },
  { slug: 'air-con-regas', name: 'Air-Con Regas', icon: Snowflake },
];
