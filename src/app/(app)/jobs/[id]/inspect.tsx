import { useLocalSearchParams } from 'expo-router';
import { CircleCheck, MessageSquareText, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { Card, Input, Notice, Overline, Screen, Text } from '@/components/ui';
import {
  DetailSizing,
  Palette,
  Radius,
  Sizing,
  Spacing,
  Tones,
  type Tone,
} from '@/constants/theme';
import {
  fetchJobExtras,
  loadJob,
  saveChecklistAnswer,
  type Checklist,
  type ChecklistProgress,
} from '@/lib/job';

/** How each of the CRM's answers reads, and the colour it takes once chosen. */
const ANSWERS: Record<string, { label: string; tone: Tone }> = {
  checked: { label: 'Checked', tone: 'success' },
  na: { label: 'N/A', tone: 'neutral' },
  pass: { label: 'Pass', tone: 'success' },
  advisory: { label: 'Advisory', tone: 'pending' },
  fail: { label: 'Fail', tone: 'error' },
  not_checked: { label: 'Not checked', tone: 'neutral' },
};

/**
 * One of the job's checklists — a service schedule, or a pre-purchase
 * inspection of up to 173 items. Each answer saves as it is tapped; the
 * customer's report is built from them, and the job cannot be completed until
 * every item has one.
 */
export default function InspectScreen() {
  const { id, key } = useLocalSearchParams<{ id: string; key: string }>();

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [editable, setEditable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The item whose comment box is open, and the items with a save in flight. */
  const [commenting, setCommenting] = useState<string | null>(null);
  const [saving, setSaving] = useState<readonly string[]>([]);

  useEffect(() => {
    let active = true;

    Promise.all([fetchJobExtras(id), loadJob(id)]).then(([extras, job]) => {
      if (!active) return;
      if (!extras.ok) {
        setError(extras.error);
        return;
      }
      const found = extras.extras.checklists.find((candidate) => candidate.key === key);
      if (!found) {
        setError('That checklist isn’t on this job.');
        return;
      }
      setChecklist(found);
      setProgress(found.progress);
      // The CRM only takes answers while the job is in progress.
      setEditable(job.ok && job.job.booking.status === 'in_progress');
    });

    return () => {
      active = false;
    };
  }, [id, key]);

  function patchItem(itemId: string, change: { result?: string; comment?: string | null }) {
    setChecklist(
      (current) =>
        current && {
          ...current,
          sections: current.sections.map((section) => ({
            ...section,
            items: section.items.map((item) => (item.id === itemId ? { ...item, ...change } : item)),
          })),
        },
    );
  }

  async function save(
    itemId: string,
    change: { result?: string; comment?: string | null },
    previous: { result: string | null; comment: string | null },
  ) {
    // Shown at once — a mechanic works down these at speed — and put back if
    // the CRM says no.
    patchItem(itemId, change);
    setSaving((current) => [...current, itemId]);

    const result = await saveChecklistAnswer(id, { itemId, ...change });
    setSaving((current) => current.filter((other) => other !== itemId));

    if (result.ok) {
      setProgress(result.progress);
    } else {
      patchItem(itemId, { result: previous.result ?? undefined, comment: previous.comment });
      Alert.alert('That answer didn’t save', result.error);
    }
  }

  if (!checklist) {
    return (
      <Screen title="Checklist">
        {error ? (
          <Notice icon={TriangleAlert} tone="danger" title="That didn’t load">
            {error}
          </Notice>
        ) : (
          <ActivityIndicator color={Palette.blue} style={styles.loading} />
        )}
      </Screen>
    );
  }

  const left = progress ? progress.total - progress.answered : 0;

  return (
    <Screen
      title={checklist.name}
      avoidKeyboard
      belowHeader={
        progress && (
          <View style={styles.progress}>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${progress.total ? (progress.answered / progress.total) * 100 : 0}%` },
                ]}
              />
            </View>
            <View style={styles.between}>
              <Overline>{`${progress.answered} of ${progress.total} answered`}</Overline>
              <Overline>
                {[
                  progress.fails ? `${progress.fails} fail` : null,
                  progress.advisories ? `${progress.advisories} advisory` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Overline>
            </View>
          </View>
        )
      }
    >
      {!editable && (
        <Notice icon={TriangleAlert} title="Read only">
          Answers can be filled in once you’ve begun work on the job.
        </Notice>
      )}

      {editable && left === 0 && (
        <Notice icon={CircleCheck} tone="success" title="All answered">
          This goes on the customer’s report. You can still change an answer until the job is
          completed.
        </Notice>
      )}

      {checklist.sections.map((section) => (
        <View key={section.name} style={styles.section}>
          <Overline>{section.name}</Overline>
          <Card padded={false}>
            {section.items.map((item, index) => {
              const open = commenting === item.id;
              return (
                <View key={item.id} style={[styles.item, index > 0 && styles.divider]}>
                  <View style={styles.between}>
                    <Text variant="bodySm" style={styles.label}>
                      {item.label}
                    </Text>
                    {saving.includes(item.id) && <ActivityIndicator size="small" color={Palette.blue} />}
                  </View>

                  <View style={styles.answers}>
                    {checklist.answers.map((answer) => {
                      const look = ANSWERS[answer] ?? { label: answer, tone: 'neutral' as Tone };
                      const on = item.result === answer;
                      const tone = Tones[look.tone];
                      return (
                        <Pressable
                          key={answer}
                          disabled={!editable}
                          onPress={() =>
                            on ? undefined : void save(item.id, { result: answer }, item)
                          }
                          accessibilityRole="radio"
                          accessibilityState={{ checked: on, disabled: !editable }}
                          accessibilityLabel={`${item.label}: ${look.label}`}
                          style={[
                            styles.answer,
                            on && { backgroundColor: tone.bg, borderColor: tone.fg },
                          ]}
                        >
                          <Text
                            variant="caption"
                            color={on ? tone.fg : 'textSecondary'}
                            style={styles.strong}
                          >
                            {look.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {editable && !!item.result && (
                      <Pressable
                        onPress={() => setCommenting(open ? null : item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Comment on ${item.label}`}
                        accessibilityState={{ expanded: open }}
                        style={[styles.answer, styles.comment, !!item.comment && styles.commented]}
                      >
                        <MessageSquareText
                          size={DetailSizing.chipIcon}
                          strokeWidth={2}
                          color={item.comment ? Palette.blue : Palette.textMuted}
                        />
                      </Pressable>
                    )}
                  </View>

                  {open ? (
                    <Input
                      defaultValue={item.comment ?? ''}
                      placeholder="What did you find? The customer reads this."
                      rows={2}
                      maxLength={500}
                      autoFocus
                      onEndEditing={(event) => {
                        const comment = event.nativeEvent.text.trim() || null;
                        if (comment !== item.comment) void save(item.id, { comment }, item);
                        setCommenting(null);
                      }}
                    />
                  ) : (
                    !!item.comment && (
                      <Text variant="caption" color="textSecondary">
                        “{item.comment}”
                      </Text>
                    )
                  )}
                </View>
              );
            })}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing[6] },
  progress: {
    gap: Spacing[2],
    paddingHorizontal: Sizing.screenPadding,
    paddingBottom: Spacing[3],
    backgroundColor: Palette.surface,
  },
  track: {
    height: Sizing.stepperTrack,
    borderRadius: Radius.pill,
    backgroundColor: Palette.borderSubtle,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: Radius.pill, backgroundColor: Palette.blue },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing[2] },
  section: { gap: Spacing[2] },
  item: { gap: Spacing[2], paddingVertical: Spacing[3], paddingHorizontal: Sizing.compactPadding },
  divider: { borderTopWidth: 1, borderTopColor: Palette.borderSubtle },
  label: { flex: 1, fontWeight: '600' },
  answers: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  answer: {
    minHeight: Sizing.buttonHeight.sm,
    justifyContent: 'center',
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceCard,
  },
  comment: { paddingHorizontal: Spacing[2] },
  commented: { borderColor: Palette.blue, backgroundColor: Palette.blueTint },
  strong: { fontWeight: '700' },
});
