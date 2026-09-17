import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { DetailSizing, JobPhotos, Palette, Radius, Scrim, Spacing } from '@/constants/theme';
import { MAX_EVIDENCE_PHOTOS, uploadEvidence } from '@/lib/uploads';

export interface EvidencePickerProps {
  /** Which upload route the photos go to. */
  kind: 'disputes' | 'cases';
  /** The uploaded photos' URLs, in order. */
  photos: readonly string[];
  onChange: (photos: string[]) => void;
}

/**
 * Evidence for a dispute, a dispute reply or a Get-help case: up to six photos,
 * each uploaded as it is picked so that what gets sent is a list of URLs.
 */
export function EvidencePicker({ kind, photos, onChange }: EvidencePickerProps) {
  const [uploading, setUploading] = useState(false);

  async function add(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        source === 'camera' ? 'Camera is off' : 'Photos are off',
        'Allow it for Book My Tech in Settings to attach photos.',
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return;

    setUploading(true);
    const result = await uploadEvidence(kind, asset);
    setUploading(false);

    if (result.ok) onChange([...photos, result.url]);
    else Alert.alert('That photo didn’t upload', result.error);
  }

  return (
    <View style={styles.row}>
      {photos.map((url) => (
        <View key={url}>
          <Image source={{ uri: url }} style={styles.photo} contentFit="cover" />
          <Pressable
            onPress={() => onChange(photos.filter((other) => other !== url))}
            accessibilityRole="button"
            accessibilityLabel="Remove this photo"
            hitSlop={Spacing[2]}
            style={styles.remove}
          >
            <Icon icon={X} size={DetailSizing.photoRemoveIcon} strokeWidth={3} color={Palette.textInverse} />
          </Pressable>
        </View>
      ))}

      {photos.length < MAX_EVIDENCE_PHOTOS && (
        <Pressable
          style={[styles.photo, styles.add]}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Attach a photo"
          onPress={() =>
            Alert.alert('Attach a photo', undefined, [
              { text: 'Take a photo', onPress: () => void add('camera') },
              { text: 'Choose from library', onPress: () => void add('library') },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
        >
          {uploading ? (
            <ActivityIndicator color={Palette.blue} />
          ) : (
            <>
              <Icon icon={Camera} size={DetailSizing.rowIcon} strokeWidth={2} color={Palette.blue} />
              <Text variant="caption" color="blue" style={styles.strong}>
                Add
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  photo: { width: JobPhotos.size, height: JobPhotos.size, borderRadius: Radius.tile },
  add: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    borderWidth: DetailSizing.addPhotoBorder,
    borderStyle: 'dashed',
    borderColor: Palette.blue,
    backgroundColor: Palette.blueTint,
  },
  remove: {
    position: 'absolute',
    top: Spacing[1],
    right: Spacing[1],
    width: DetailSizing.photoRemove,
    height: DetailSizing.photoRemove,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Scrim.control,
  },
  strong: { fontWeight: '700' },
});
