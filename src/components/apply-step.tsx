import { ArrowRight, CircleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Notice, Screen, Stepper, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { APPLY_STEPS } from '@/lib/application';

export interface ApplyStepProps {
  /** 1-based, as `APPLY_STEPS`. */
  step: number;
  heading: string;
  intro: string;
  error: string | null;
  onContinue: () => void;
  continueLabel?: string;
  loading?: boolean;
  children: ReactNode;
}

/** One step of the application: stepper, heading, fields, the error, and Continue. */
export function ApplyStep({
  step,
  heading,
  intro,
  error,
  onContinue,
  continueLabel = 'Continue',
  loading = false,
  children,
}: ApplyStepProps) {
  return (
    <Screen
      title="Apply to join"
      avoidKeyboard
      belowHeader={
        <Stepper step={step} total={APPLY_STEPS.length} label={APPLY_STEPS[step - 1] ?? ''} />
      }
      footer={
        <Button fullWidth size="xl" iconRight={ArrowRight} loading={loading} onPress={onContinue}>
          {continueLabel}
        </Button>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">{heading}</Text>
        <Text color="textSecondary">{intro}</Text>
      </View>

      {children}

      {!!error && (
        <Notice icon={CircleAlert} tone="danger" title="Check this">
          {error}
        </Notice>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
});
