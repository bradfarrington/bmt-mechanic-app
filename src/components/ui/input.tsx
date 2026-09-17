import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  TextInput,
  type TextInputProps,
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  fontFace,
  Palette,
  Radius,
  Shadows,
  Sizing,
  Spacing,
  Typography,
} from '@/constants/theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Right-aligned on the label's line — e.g. "Forgotten your password?". */
  labelAction?: ReactNode;
  helper?: string;
  error?: string;
  /** Leading icon inside the field — e.g. a search magnifier. */
  iconLeft?: LucideIcon;
  containerStyle?: ViewStyle;
  /** Grows the field to `rows` lines and aligns text to the top. */
  rows?: number;
  /** Adds a faint "— optional" after the label. */
  optional?: boolean;
}

export function Input({
  label,
  labelAction,
  helper,
  error,
  iconLeft,
  containerStyle,
  rows,
  optional = false,
  secureTextEntry,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const multiline = !!rows && rows > 1;
  // A password is easy to mistype blind on a phone keyboard, so a secure field
  // can be shown once there is something in it to check.
  const canReveal = !!secureTextEntry && !!rest.value;

  return (
    <View style={[styles.container, containerStyle]}>
      {(label || labelAction) && (
        <View style={styles.labelRow}>
          {label && (
            <Text variant="label" color="textSecondary">
              {label}
              {optional && (
                <Text variant="label" color="textFaint" style={styles.optional}>
                  {' — optional'}
                </Text>
              )}
            </Text>
          )}
          {labelAction}
        </View>
      )}

      <View
        style={[
          styles.field,
          multiline && {
            // Line height plus the vertical padding the single-line field gets
            // implicitly from its fixed height.
            height: undefined,
            minHeight: rows! * 21 + Spacing[3] * 2,
            alignItems: 'flex-start',
            paddingVertical: Spacing[3],
          },
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {iconLeft && (
          <Icon
            icon={iconLeft}
            size={Sizing.fieldIcon}
            strokeWidth={2}
            color={Palette.textMuted}
          />
        )}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor={Palette.textFaint}
          secureTextEntry={!!secureTextEntry && !revealed}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {canReveal && (
          <Pressable
            onPress={() => setRevealed((shown) => !shown)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={Spacing[2]}
          >
            <Icon
              icon={revealed ? EyeOff : Eye}
              size={Sizing.fieldIcon}
              strokeWidth={2}
              color={Palette.textMuted}
            />
          </Pressable>
        )}
      </View>

      {(error || helper) && (
        <Text variant="caption" color={error ? 'danger' : 'textMuted'}>
          {error ?? helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sizing.inputGap,
    height: Sizing.inputHeight,
    paddingHorizontal: Sizing.inputPaddingX,
    backgroundColor: Palette.surfaceCard,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.input,
  },
  fieldFocused: { borderColor: Palette.blue, borderWidth: 1.5, ...Shadows.focusRing },
  fieldError: { borderColor: Palette.danger, borderWidth: 1.5 },
  input: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    ...fontFace('sans'),
    color: Palette.textPrimary,
    padding: 0,
  },
  inputMultiline: { lineHeight: 21 },
  optional: { fontWeight: '400' },
});
