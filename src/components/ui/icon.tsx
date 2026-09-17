import type { LucideIcon, LucideProps } from 'lucide-react-native';

import { Palette } from '@/constants/theme';

/**
 * Mirrors `components/ui/icon.tsx` in the CRM: takes `icon` (a Lucide component
 * reference) rather than a string name, so icons tree-shake. Call sites do
 * `import { Zap } from 'lucide-react-native'` then `<Icon icon={Zap} />`.
 */
export interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon;
}

export function Icon({
  icon: IconComponent,
  size = 18,
  strokeWidth = 1.5,
  color = Palette.textPrimary,
  ...rest
}: IconProps) {
  return (
    <IconComponent size={size} strokeWidth={strokeWidth} color={color} {...rest} />
  );
}
