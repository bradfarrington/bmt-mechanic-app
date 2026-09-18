import { useRouter, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApplyStep } from '@/components/apply-step';
import { Card, Text } from '@/components/ui';
import { Palette, Spacing } from '@/constants/theme';
import { APP_DOCS, BUSINESS_TYPES, firstProblem, submitApplication } from '@/lib/application';
import { useApplicationDraft } from '@/lib/application-draft';
import { Env } from '@/lib/env';
import { SPECIALISMS } from '@/lib/specialisms';

/** Step 5 — check and send. The web's `review-step.tsx`, down to its terms line. */
export default function ApplyReviewScreen() {
  const router = useRouter();
  const { draft, reset } = useApplicationDraft();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit() {
    const problem = firstProblem(draft);
    if (problem) {
      setError(problem.error);
      return;
    }
    setSending(true);
    setError(null);
    const result = await submitApplication(draft);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const email = draft.email.trim().toLowerCase();
    reset();
    router.replace({ pathname: '/apply/submitted', params: { email } });
  }

  const none = 'Not provided';
  const business = BUSINESS_TYPES.find((t) => t.value === draft.businessType)?.label ?? none;
  const specialisms = SPECIALISMS.filter((s) => draft.specialisms.includes(s.slug)).map((s) => s.name);
  const docs = APP_DOCS.filter((d) => draft.docs[d.type] && (!d.vatOnly || draft.vatRegistered)).map((d) => d.label);
  const refs = draft.references.filter((r) => r.name.trim()).map((r) => r.name.trim());

  return (
    <ApplyStep
      step={5}
      heading="Check and send."
      intro="Check everything looks right, then send it. Our team reviews applications within a few working days."
      error={error}
      onContinue={() => void onSubmit()}
      continueLabel="Submit application"
      loading={sending}
    >
      <Section title="About you" edit="/apply">
        <Line label="Name" value={draft.fullName.trim() || none} />
        <Line label="Email" value={draft.email.trim() || none} />
        <Line label="Phone" value={draft.phone.trim() || none} />
        <Line label="Postcode" value={draft.postcode.trim() || none} />
        <Line label="Experience" value={draft.yearsExperience ? `${draft.yearsExperience} years` : none} />
      </Section>

      <Section title="Your business" edit="/apply/business">
        <Line label="Operates as" value={business} />
        <Line label="Business name" value={draft.businessName.trim() || none} />
        <Line
          label={draft.businessType === 'limited_company' ? 'Company number' : 'UTR'}
          value={draft.businessNumber.trim() || none}
        />
        <Line label="VAT registered" value={draft.vatRegistered ? 'Yes' : 'No'} />
      </Section>

      <Section title="Your work" edit="/apply/work">
        <Line label="Specialisms" value={specialisms.length ? specialisms.join(', ') : none} />
        <Line label="Radius" value={`${draft.serviceRadiusMiles} miles`} />
      </Section>

      <Section title="Documents & bank" edit="/apply/documents">
        <Line label="Documents" value={docs.length ? docs.join(', ') : 'None yet (28 days after approval)'} />
        <Line label="Bank" value={draft.bankSortCode && draft.bankAccountNumber ? 'Provided (encrypted)' : 'Missing'} />
        <Line label="References" value={refs.length ? refs.join(', ') : none} />
      </Section>

      <Text variant="caption" color="textMuted" style={styles.centre}>
        By submitting you agree to the{' '}
        <Text
          variant="caption"
          color="blue"
          style={styles.strong}
          accessibilityRole="link"
          onPress={() => void WebBrowser.openBrowserAsync(`${Env.apiBaseUrl}/mechanic-agreement`)}
        >
          Mechanic Terms & Conditions
        </Text>{' '}
        and{' '}
        <Text
          variant="caption"
          color="blue"
          style={styles.strong}
          accessibilityRole="link"
          onPress={() => void WebBrowser.openBrowserAsync(`${Env.apiBaseUrl}/privacy`)}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </ApplyStep>
  );
}

function Section({ title, edit, children }: { title: string; edit: Href; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Text variant="bodySm" style={styles.strong}>
          {title}
        </Text>
        <Pressable onPress={() => router.push(edit)} hitSlop={Spacing[2]} accessibilityRole="button">
          <Text variant="caption" color="blue" style={styles.strong}>
            Edit
          </Text>
        </Pressable>
      </View>
      {children}
    </Card>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text variant="caption" color="textMuted" style={styles.lineLabel}>
        {label}
      </Text>
      <Text variant="caption" style={styles.lineValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strong: { fontWeight: '700' },
  centre: { textAlign: 'center' },
  card: { gap: Spacing[2] },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  line: { flexDirection: 'row', gap: Spacing[3] },
  lineLabel: { width: '34%' },
  lineValue: { flex: 1 },
});
