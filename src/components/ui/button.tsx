import type { LucideIcon } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text, type TextVariant } from '@/components/ui/text';
import { Palette, Radius, Shadows, Sizing, Spacing } from '@/constants/theme';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'dark'
  | 'success'
  | 'destructive'
  | 'onDark';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * The 7 variants from the proposal, matching the CRM's `buttonVariants`, plus
 * `onDark` — a white button for the deep gradient.
 */
const VARIANTS: Record<
  ButtonVariant,
  { bg: string; fg: string; border?: string; pressedBg: string }
> = {
  primary: { bg: Palette.blue, fg: Palette.textInverse, pressedBg: Palette.blueDark },
  secondary: {
    bg: Palette.surfaceCard,
    fg: Palette.blue,
    border: Palette.blue,
    pressedBg: Palette.blueTint,
  },
  tertiary: { bg: 'transparent', fg: Palette.blue, pressedBg: Palette.blueTint },
  ghost: { bg: 'transparent', fg: Palette.textSecondary, pressedBg: Palette.borderSubtle },
  dark: { bg: Palette.surfaceDark, fg: Palette.textInverse, pressedBg: '#1E293B' },
  success: { bg: Palette.success, fg: Palette.textInverse, pressedBg: '#16A34A' },
  destructive: { bg: Palette.danger, fg: Palette.textInverse, pressedBg: '#DC2626' },
  onDark: { bg: Palette.surfaceCard, fg: Palette.blueDark, pressedBg: Palette.blueTint },
};

const LABELS: Record<ButtonSize, TextVariant> = {
  sm: 'bodySm',
  md: 'body',
  lg: 'button',
  xl: 'button',
};

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  /** Swaps the label for a spinner and blocks presses. */
  loading?: boolean;
  /**
   * Square and label-less: only `iconLeft` shows, and `children` becomes the
   * accessibility label — a Message button beside Call, a send button.
   */
  iconOnly?: boolean;
  /** Fully rounded ends — with `iconOnly`, a circle. */
  round?: boolean;
  style?: ViewStyle;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconLeft,
  iconRight,
  loading = false,
  iconOnly = false,
  round = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const v = VARIANTS[variant];
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      accessibilityLabel={iconOnly ? children : undefined}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: Sizing.buttonHeight[size],
          paddingHorizontal: iconOnly ? 0 : size === 'sm' ? 12 : size === 'md' ? 16 : 22,
          backgroundColor: pressed && !isDisabled ? v.pressedBg : v.bg,
          borderColor: v.border ?? 'transparent',
          width: iconOnly ? Sizing.buttonHeight[size] : fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.5 : 1,
        },
        round && styles.round,
        variant === 'primary' && !isDisabled && Shadows.button,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {iconLeft && <Icon icon={iconLeft} size={iconSize} strokeWidth={2} color={v.fg} />}
          {!iconOnly && (
            <Text variant={LABELS[size]} color={v.fg} style={styles.label}>
              {children}
            </Text>
          )}
          {!iconOnly && iconRight && (
            <Icon icon={iconRight} size={iconSize} strokeWidth={2} color={v.fg} />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    borderRadius: Radius.button,
    borderWidth: 1,
  },
  round: { borderRadius: Radius.pill },
  label: { fontWeight: '700' },
});
