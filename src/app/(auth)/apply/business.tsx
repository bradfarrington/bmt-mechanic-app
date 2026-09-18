import { useRouter } from 'expo-router';
import { Building2, Hash } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApplyStep } from '@/components/apply-step';
import { Card, Input, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { BUSINESS_TYPES, checkBusiness } from '@/lib/application';
import { useApplicationDraft } from '@/lib/application-draft';

/** Step 2 — your business. The web's `step-business.tsx`. */
export default function ApplyBusinessScreen() {
  const router = useRouter();
  const { draft, update } = useApplicationDraft();
  const [error, setError] = useState<string | null>(null);

  function onContinue() {
    const problem = checkBusiness(draft);
    setError(problem);
    if (!problem) router.push('/apply/work');
  }

  const limited = draft.businessType === 'limited_company';

  return (
    <ApplyStep
      step={2}
      heading="Your business."
      intro="So we can check you're a registered, trading professional."
      error={error}
      onContinue={onContinue}
    >
      <View style={styles.field}>
        <Text variant="label" color="textSecondary">
          How do you operate?
        </Text>
        <Segmented
          options={BUSINESS_TYPES.map((type) => ({ key: type.value, label: type.label }))}
          value={draft.businessType}
          onChange={(value) => update({ businessType: value as typeof draft.businessType })}
        />
      </View>

      <Input
        label="Business name"
        iconLeft={Building2}
        value={draft.businessName}
        onChangeText={(businessName) => update({ businessName })}
        placeholder="e.g. Wilson Mobile Mechanics"
        autoCapitalize="words"
      />

      {draft.businessType && (
        <Input
          label={limited ? 'Company number' : 'UTR (Unique Taxpayer Reference)'}
          helper={limited ? 'Your 8-digit Companies House number.' : 'Your 10-digit Self Assessment reference.'}
          iconLeft={Hash}
          value={draft.businessNumber}
          onChangeText={(businessNumber) => update({ businessNumber })}
          placeholder={limited ? 'e.g. 09876543' : 'e.g. 1234567890'}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      )}

      <View style={styles.field}>
        <Text variant="label" color="textSecondary">
          Are you VAT registered?
        </Text>
        <Segmented
          options={[
            { key: 'no', label: 'No' },
            { key: 'yes', label: 'Yes' },
          ]}
          value={draft.vatRegistered ? 'yes' : 'no'}
          onChange={(value) => update({ vatRegistered: value === 'yes' })}
        />
        <Text variant="caption" color="textMuted">
          {draft.vatRegistered
            ? "You'll be asked for your VAT registration document."
            : 'You can skip the VAT document.'}
        </Text>
      </View>
    </ApplyStep>
  );
}

/** Two or three side-by-side choices, one of them picked. */
function Segmented({
  options,
  value,
  onChange,
}: {
  options: readonly { key: string; label: string }[];
  value: string | null;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((option) => {
        const on = option.key === value;
        return (
          <Pressable
            key={option.key}
            style={styles.segment}
            onPress={() => onChange(option.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={option.label}
          >
            <Card selected={on} style={styles.segmentCard}>
              <Text variant="bodySm" color={on ? 'blueDark' : 'textSecondary'} style={styles.segmentLabel}>
                {option.label}
              </Text>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing[2] },
  segmented: { flexDirection: 'row', gap: Spacing[2] },
  segment: { flex: 1 },
  segmentCard: { alignItems: 'center', paddingVertical: Spacing[3] },
  segmentLabel: { fontWeight: '700' },
});
