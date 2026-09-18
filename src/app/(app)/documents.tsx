import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Camera, CalendarDays, ClockAlert, Upload } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { AccountRow } from '@/components/account-row';
import { Button, Card, Input, Notice, Overline, Pill, Screen, Sheet, Text } from '@/components/ui';
import { Palette, Spacing, type Tone } from '@/constants/theme';
import {
  currentByType,
  DOC_STATUS,
  DOC_TYPES,
  documentsAlert,
  documentUrl,
  expiryState,
  fetchDocuments,
  formatExpiry,
  uploadDocument,
  type DocType,
  type DocTypeDef,
  type DocumentRow,
} from '@/lib/documents';
import { formatDay } from '@/lib/london-time';
import type { PickedFile } from '@/lib/uploads';

/**
 * Documents — mockup frame 4. The list is the mechanic's own rows under RLS;
 * the newest per type is the current one. Uploads go to the CRM, which owns
 * the private bucket, and a document is viewed through a signed link it
 * mints. A photo comes from the camera or the library, a PDF from Files.
 */

type Picked = PickedFile & { size?: number | null };

export default function DocumentsScreen() {
  const [rows, setRows] = useState<DocumentRow[] | null>(null);
  const [choosingType, setChoosingType] = useState(false);
  const [pending, setPending] = useState<{ def: DocTypeDef; file: Picked } | null>(null);
  const [expiry, setExpiry] = useState('');
  const [expiryError, setExpiryError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRows(await fetchDocuments());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const current = rows ? currentByType(rows) : new Map<string, DocumentRow>();
  const alert = rows ? documentsAlert(rows) : null;

  /** Step 2: where the file comes from. */
  function chooseSource(def: DocTypeDef) {
    Alert.alert(def.label, 'Snap it, pick a photo, or choose a PDF.', [
      { text: 'Take a photo', onPress: () => void pickImage(def, 'camera') },
      { text: 'Choose a photo', onPress: () => void pickImage(def, 'library') },
      { text: 'Choose a file', onPress: () => void pickFile(def) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function pickImage(def: DocTypeDef, source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        source === 'camera' ? 'Camera is off' : 'Photos are off',
        'Allow it for Book My Tech in Settings to upload a document.',
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
    ready(def, { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName, size: asset.fileSize });
  }

  async function pickFile(def: DocTypeDef) {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return;
    ready(def, { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.name, size: asset.size });
  }

  /** Step 3: an expiry date where BMT expects one, then the upload. */
  function ready(def: DocTypeDef, file: Picked) {
    if (def.expires) {
      setExpiry('');
      setExpiryError(null);
      setPending({ def, file });
    } else {
      void send(def.type, file, null);
    }
  }

  async function send(docType: DocType, file: Picked, expiresAt: string | null) {
    setBusy(true);
    const result = await uploadDocument({ docType, file, expiresAt });
    setBusy(false);
    setPending(null);
    if (result.ok) {
      await load();
      Alert.alert('Sent for review', 'Approvals usually land within a working day.');
    } else {
      Alert.alert("That didn't upload", result.error);
    }
  }

  function onConfirmExpiry() {
    if (!pending) return;
    const iso = parseUkDate(expiry);
    if (!iso) {
      setExpiryError('Enter the expiry as DD/MM/YYYY.');
      return;
    }
    void send(pending.def.type, pending.file, iso);
  }

  async function view(row: DocumentRow) {
    setBusy(true);
    const result = await documentUrl(row.id);
    setBusy(false);
    if (result.ok) await WebBrowser.openBrowserAsync(result.url);
    else Alert.alert("Couldn't open that", result.error);
  }

  function onRow(def: DocTypeDef, row: DocumentRow | undefined) {
    if (!row) {
      chooseSource(def);
      return;
    }
    Alert.alert(def.label, describe(row), [
      { text: 'View', onPress: () => void view(row) },
      { text: 'Upload a new copy', onPress: () => chooseSource(def) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const required = DOC_TYPES.filter((def) => def.required);
  const optional = DOC_TYPES.filter((def) => !def.required);

  return (
    <Screen
      title="Documents"
      footer={
        <Button fullWidth size="xl" iconLeft={Camera} loading={busy} onPress={() => setChoosingType(true)}>
          Snap or upload a document
        </Button>
      }
    >
      {alert && (
        <Notice icon={ClockAlert} tone={alert.tone} title={alert.label}>
          {alert.detail}
        </Notice>
      )}

      {!rows && <ActivityIndicator color={Palette.blue} />}

      {rows && (
        <>
          <View style={styles.section}>
            <Overline>Required</Overline>
            <Card padded={false}>
              {required.map((def, index) => (
                <DocumentLine
                  key={def.type}
                  def={def}
                  row={current.get(def.type)}
                  divided={index > 0}
                  onPress={() => onRow(def, current.get(def.type))}
                />
              ))}
            </Card>
          </View>

          <View style={styles.section}>
            <Overline>Optional</Overline>
            <Card padded={false}>
              {optional.map((def, index) => (
                <DocumentLine
                  key={def.type}
                  def={def}
                  row={current.get(def.type)}
                  divided={index > 0}
                  onPress={() => onRow(def, current.get(def.type))}
                />
              ))}
            </Card>
          </View>

          <Text variant="caption" color="textMuted" style={styles.centre}>
            Approvals usually land within a working day. Insurance that lapses takes you offline
            until a fresh copy is approved.
          </Text>
        </>
      )}

      <Sheet visible={choosingType} onClose={() => setChoosingType(false)} title="Which document?">
        <Card padded={false}>
          {DOC_TYPES.map((def, index) => (
            <AccountRow
              key={def.type}
              icon={def.icon}
              title={def.label}
              subtitle={def.hint}
              divided={index > 0}
              onPress={() => {
                setChoosingType(false);
                chooseSource(def);
              }}
            />
          ))}
        </Card>
      </Sheet>

      <Sheet
        visible={!!pending}
        onClose={() => setPending(null)}
        title={pending ? `${pending.def.label} — when does it expire?` : 'Expiry'}
      >
        <View style={styles.expiry}>
          <Input
            label="Expiry date"
            iconLeft={CalendarDays}
            value={expiry}
            onChangeText={(next) => {
              setExpiry(next);
              setExpiryError(null);
            }}
            placeholder="DD/MM/YYYY"
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
            onSubmitEditing={onConfirmExpiry}
            autoCorrect={false}
            error={expiryError ?? undefined}
            helper="We remind you 30 days before, and again a week before."
          />
          <Button fullWidth size="xl" iconLeft={Upload} loading={busy} onPress={onConfirmExpiry}>
            Upload
          </Button>
        </View>
      </Sheet>

    </Screen>
  );
}

function DocumentLine({
  def,
  row,
  divided,
  onPress,
}: {
  def: DocTypeDef;
  row: DocumentRow | undefined;
  divided: boolean;
  onPress: () => void;
}) {
  if (!row) {
    return (
      <AccountRow
        icon={def.icon}
        tone={def.required ? 'pending' : 'accent'}
        title={def.label}
        subtitle={def.required ? `Not uploaded yet · ${def.hint}` : def.hint}
        divided={divided}
        onPress={onPress}
      />
    );
  }

  const status = DOC_STATUS[row.status] ?? { label: row.status, tone: 'neutral' as Tone };
  const state = expiryState(row.expires_at);
  const expiring = row.status === 'verified' && state === 'expiring_soon';
  const lapsed = row.status === 'expired' || (row.status === 'verified' && state === 'expired');
  const pill = lapsed ? DOC_STATUS.expired! : expiring ? { label: 'Expiring', tone: 'pending' as Tone } : status;
  const tone: Tone = lapsed || pill.tone === 'error' ? 'error' : expiring || pill.tone === 'pending' ? 'pending' : 'success';

  return (
    <AccountRow
      icon={def.icon}
      tone={tone}
      title={def.label}
      subtitle={describe(row)}
      divided={divided}
      onPress={onPress}
      trailing={<Pill tone={pill.tone}>{pill.label}</Pill>}
    />
  );
}

/** "Uploaded Mon 12 Aug · expires 29 Sep" */
function describe(row: DocumentRow) {
  const uploaded = `Uploaded ${formatDay(new Date(row.uploaded_at))}`;
  return row.expires_at ? `${uploaded} · expires ${formatExpiry(row.expires_at)}` : `${uploaded} · never expires`;
}

/** "29/09/2026" → "2026-09-29"; null for anything else or an impossible date. */
function parseUkDate(value: string): string | null {
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  section: { gap: Spacing[2] },
  centre: { textAlign: 'center' },
  expiry: { gap: Spacing[3], paddingBottom: Spacing[2] },
});
