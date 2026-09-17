import { Text, type TextProps } from '@/components/ui/text';

/** Small uppercase eyebrow above a section heading. Muted slate by default. */
export function Overline({ color = 'textMuted', ...rest }: Omit<TextProps, 'variant'>) {
  return <Text variant="overline" color={color} {...rest} />;
}
