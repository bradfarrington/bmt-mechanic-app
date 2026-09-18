import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Check, Landmark, Upload, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { ApplyStep } from '@/components/apply-step';
import { Card, Icon, IconTile, Input, Overline, Text } from '@/components/ui';
import { Palette, Sizing, Spacing } from '@/constants/theme';
import {
  APP_DOCS,
  checkDocuments,
  uploadApplicationDoc,
  type AppDocDef,
  type Reference,
} from '@/lib/application';
import { useApplicationDraft } from '@/lib/application-draft';
import type { PickedFile } from '@/lib/uploads';

type Picked = PickedFile & { size?: number | null };

/**
 * Step 4 — documents, bank and references. The web's `step-documents.tsx`:
 * every document is optional now (approval can come with 28 days to supply
 * the rest), each uploads the moment it is picked, and the bank details are
 * required.
 */
export default function ApplyDocumentsScreen() {
  const router = useRouter();
  const { draft, update } = useApplicationDraft();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const docs = APP_DOCS.filter((def) => !def.vatOnly || draft.vatRegistered);

  function choose(def: AppDocDef) {
    Alert.alert(def.label, 'Snap it, pick a photo, or choose a PDF.', [
      { text: 'Take a photo', onPress: () => void pickImage(def, 'camera') },
      { text: 'Choose a photo', onPress: () => void pickImage(def, 'library') },
      { text: 'Choose a file', onPress: () => void pickFile(def) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function pickImage(def: AppDocDef, source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        source === 'camera' ? 'Camera is off' : 'Photos are off',
        'Allow it for Book My Tech in Settings to add a document.',
      );
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.85 };
    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return;
    await send(def, { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName, size: asset.fileSize });
  }

  async function pickFile(def: AppDocDef) {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return;
    await send(def, { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.name, size: asset.size });
  }

  async function send(def: AppDocDef, file: Picked) {
    setUploading(def.type);
    const result = await uploadApplicationDoc(draft.draftId, def.type, file);
    setUploading(null);
    if (!result.ok) {
      Alert.alert("That didn't upload", result.error);
      return;
    }
    update({
      docs: { ...draft.docs, [def.type]: { path: result.path, fileName: file.fileName ?? def.label } },
    });
  }

  function remove(def: AppDocDef) {
    const next = { ...draft.docs };
    delete next[def.type];
    update({ docs: next });
  }

  function setReference(index: 0 | 1, change: Partial<Reference>) {
    const references = [...draft.references] as [Reference, Reference];
    references[index] = { ...references[index], ...change };
    update({ references });
  }

  function onContinue() {
    const problem = checkDocuments(draft);
    setError(problem);
    if (!problem) router.push('/apply/review');
  }

  return (
    <ApplyStep
      step={4}
      heading="Documents & bank."
      intro="Upload whatever paperwork you have to hand. If some isn't ready, you'll have 28 days after approval to add it. Files are only seen by our verification team."
      error={error}
      onContinue={onContinue}
      loading={uploading !== null}
    >
      <View style={styles.section}>
        <Overline>Documents · optional for now</Overline>
        <Card padded={false}>
          {docs.map((def, index) => {
            const done = draft.docs[def.type];
            const busy = uploading === def.type;
            return (
              <View key={def.type} style={[styles.row, index > 0 && styles.divided]}>
                <IconTile icon={done ? Check : def.icon} tone={done ? 'success' : 'accent'} />
                <Pressable
                  style={styles.rowText}
                  disabled={uploading !== null}
                  onPress={() => choose(def)}
                  accessibilityRole="button"
                  accessibilityLabel={done ? `Replace ${def.label}` : `Upload ${def.label}`}
                >
                  <Text variant="bodySm" style={styles.strong}>
                    {def.label}
                  </Text>
                  <Text variant="caption" color={done ? 'successText' : 'textMuted'} numberOfLines={1}>
                    {done ? `Added · tap to replace` : def.hint}
                  </Text>
                </Pressable>
                {busy ? (
                  <ActivityIndicator color={Palette.blue} />
                ) : done ? (
                  <Pressable
                    onPress={() => remove(def)}
                    hitSlop={Spacing[2]}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${def.label}`}
                  >
                    <Icon icon={X} size={Sizing.rowChevron} strokeWidth={2} color={Palette.textMuted} />
                  </Pressable>
                ) : (
                  <Icon icon={Upload} size={Sizing.rowChevron} strokeWidth={2} color={Palette.blue} />
                )}
              </View>
            );
          })}
        </Card>
      </View>

      <View style={styles.section}>
        <Overline>Bank account</Overline>
        <Text variant="caption" color="textMuted">
          For your payouts. Encrypted when stored, never kept in plain text.
        </Text>
        <View style={styles.pair}>
          <Input
            containerStyle={styles.grow}
            label="Sort code"
            iconLeft={Landmark}
            value={draft.bankSortCode}
            onChangeText={(bankSortCode) => update({ bankSortCode })}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={8}
          />
          <Input
            containerStyle={styles.grow}
            label="Account number"
            value={draft.bankAccountNumber}
            onChangeText={(bankAccountNumber) => update({ bankAccountNumber })}
            placeholder="12345678"
            keyboardType="number-pad"
            maxLength={8}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Overline>References · optional</Overline>
        <Text variant="caption" color="textMuted">
          Two people who can vouch for your work. They help us verify you faster.
        </Text>
        {([0, 1] as const).map((index) => (
          <Card key={index} style={styles.reference}>
            <Text variant="bodySm" style={styles.strong}>
              Reference {index + 1}
            </Text>
            <Input
              label="Full name"
              value={draft.references[index].name}
              onChangeText={(name) => setReference(index, { name })}
              autoCapitalize="words"
            />
            <Input
              label="Relationship"
              placeholder="e.g. former employer"
              value={draft.references[index].relationship}
              onChangeText={(relationship) => setReference(index, { relationship })}
            />
            <Input
              label="Email"
              value={draft.references[index].email}
              onChangeText={(email) => setReference(index, { email })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Phone"
              value={draft.references[index].phone}
              onChangeText={(phone) => setReference(index, { phone })}
              keyboardType="phone-pad"
            />
          </Card>
        ))}
      </View>
    </ApplyStep>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing[2] },
  strong: { fontWeight: '700' },
  grow: { flex: 1 },
  pair: { flexDirection: 'row', gap: Spacing[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Sizing.compactPadding,
  },
  divided: { borderTopWidth: 1, borderTopColor: Palette.borderSubtle },
  rowText: { flex: 1, gap: Spacing[1] },
  reference: { gap: Spacing[3] },
});
