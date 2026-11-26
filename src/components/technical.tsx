import { Image } from 'expo-image';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

// From the files, not the barrel: the barrel reaches the tab bar through `Screen`.
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DetailSizing, Palette, Radius, Sizing, Spacing } from '@/constants/theme';
import type { DataRow, StoryLine } from '@/lib/technical';

/**
 * HaynesPro's manuals and specifications, drawn natively — the app's version
 * of the CRM's `components/haynespro/technical-panels.tsx`.
 */

/** A manual's picture, at its own shape once it has loaded. */
function StoryImage({ uri }: { uri: string }) {
  const [ratio, setRatio] = useState<number | null>(null);
  return (
    <Image
      source={{ uri }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
      onLoad={({ source }) => {
        if (source.width > 0 && source.height > 0) setRatio(source.width / source.height);
      }}
      style={[styles.image, { aspectRatio: ratio ?? Sizing.technicalImageRatio }]}
    />
  );
}

export function StoryLines({ lines, depth = 0 }: { lines: readonly StoryLine[]; depth?: number }) {
  return (
    <View style={[styles.lines, depth > 0 && styles.nested]}>
      {lines.map((line, index) => {
        const heading = line.lines.length > 0;
        return (
          <View key={index} style={styles.line}>
            {!!line.name && (
              <Text
                variant="bodySm"
                color={heading ? 'textPrimary' : 'textSecondary'}
                style={heading && styles.strong}
              >
                {line.name}
              </Text>
            )}
            {!!line.text && (
              <Text variant="bodySm" color="textSecondary">
                {line.text}
              </Text>
            )}
            {!!line.remark && (
              <Text variant="caption" color="textMuted" style={styles.remark}>
                {line.remark}
              </Text>
            )}
            {!!line.imageUrl && <StoryImage uri={line.imageUrl} />}
            {heading && <StoryLines lines={line.lines} depth={depth + 1} />}
          </View>
        );
      })}
    </View>
  );
}

/** Name on the left, value and unit on the right; a row with rows is a heading. */
export function DataRows({ rows, depth = 0 }: { rows: readonly DataRow[]; depth?: number }) {
  return (
    <View style={depth > 0 && styles.nestedRows}>
      {rows.map((row, index) => (
        <View key={index} style={styles.row}>
          {row.rows.length > 0 ? (
            <>
              <Text variant="bodySm" style={styles.strong}>
                {row.name}
              </Text>
              <DataRows rows={row.rows} depth={depth + 1} />
            </>
          ) : (
            <View style={styles.pair}>
              <Text variant="bodySm" color="textSecondary" style={styles.name}>
                {row.name}
              </Text>
              <Text variant="bodySm" style={styles.value}>
                {row.value ?? 'Not given'}
                {row.value != null && row.unit ? ` ${row.unit}` : ''}
              </Text>
            </View>
          )}
          {!!row.remark && (
            <Text variant="caption" color="textMuted" style={styles.remark}>
              {row.remark}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

/** One adjustments group, closed until tapped — there can be dozens. */
export function DataGroup({ group }: { group: DataRow }) {
  const [open, setOpen] = useState(false);
  return (
    <Card padded={false}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.groupHead, pressed && styles.pressed]}
      >
        <Text variant="bodySm" style={[styles.strong, styles.name]}>
          {group.name}
        </Text>
        <Icon
          icon={open ? ChevronDown : ChevronRight}
          size={DetailSizing.rowIcon}
          strokeWidth={2}
          color={Palette.textMuted}
        />
      </Pressable>
      {open && (
        <View style={styles.groupBody}>
          <DataRows rows={group.rows} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  lines: { gap: Spacing[3] },
  nested: {
    marginLeft: Spacing[1],
    paddingLeft: Spacing[3],
    borderLeftWidth: 1,
    borderLeftColor: Palette.borderSubtle,
  },
  line: { gap: Spacing[1] },
  remark: { fontStyle: 'italic' },
  image: {
    width: '100%',
    marginTop: Spacing[1],
    borderRadius: Radius.tile,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    backgroundColor: Palette.surfaceCard,
  },
  nestedRows: { marginLeft: Spacing[3] },
  row: { paddingVertical: Spacing[1] },
  pair: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing[4] },
  name: { flex: 1 },
  value: { flexShrink: 0, fontWeight: '600', textAlign: 'right' },
  strong: { fontWeight: '700' },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Sizing.compactPadding,
  },
  pressed: { backgroundColor: Palette.surface },
  groupBody: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Sizing.compactPadding,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
  },
});
