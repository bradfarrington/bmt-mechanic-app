import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, CircleAlert, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Stars } from '@/components/stars';
import { Avatar, Button, Card, Icon, Input, Notice, Screen, Text } from '@/components/ui';
import { Palette, Radius, Sizing, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { formatPostcode, postcodeDistrict } from '@/lib/postcode';
import { MAX_BIO_CHARS, MAX_NAME_CHARS, updateProfile, uploadAvatar } from '@/lib/profile';

/**
 * Profile — mockup frame 5. Name, phone and bio are written direct under RLS,
 * as the web's profile form does; the photo goes through the CRM. The base
 * postcode is BMT's to change and is shown locked, with the web's wording.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, mechanic, fullName, refreshMechanic } = useAuth();

  const [name, setName] = useState(profile?.full_name ?? fullName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [bio, setBio] = useState(mechanic?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState(profile?.avatar_url ?? null);
  /** Read once: the stat is years, and a re-render should not tick it. */
  const [now] = useState(() => Date.now());

  const dirty =
    name.trim() !== (profile?.full_name ?? '').trim() ||
    phone.trim() !== (profile?.phone ?? '').trim() ||
    bio.trim() !== (mechanic?.bio ?? '').trim();

  async function onSave() {
    if (!user) return;
    setSaving(true);
    setError(null);
    const result = await updateProfile(user.id, { fullName: name, phone, bio });
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }
    await refreshMechanic();
    setSaving(false);
    setSaved(true);
  }

  function changePhoto() {
    Alert.alert('Profile photo', 'Customers see it on their booking.', [
      { text: 'Take a photo', onPress: () => void pick('camera') },
      { text: 'Choose a photo', onPress: () => void pick('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function pick(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        source === 'camera' ? 'Camera is off' : 'Photos are off',
        'Allow it for Book My Tech in Settings to change your photo.',
      );
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };
    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return;

    setUploading(true);
    const result = await uploadAvatar({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      size: asset.fileSize,
    });
    setUploading(false);
    if (result.ok) {
      setAvatar(result.url);
      await refreshMechanic();
    } else {
      Alert.alert("That photo didn't upload", result.error);
    }
  }

  const rating = mechanic?.rating ?? 0;
  const since = mechanic?.approved_at ?? mechanic?.created_at ?? profile?.created_at;
  const years = since ? Math.floor((now - new Date(since).getTime()) / (365.25 * 86_400_000)) : 0;
  const postcode = formatPostcode(mechanic?.base_postcode);
  const area = postcodeDistrict(mechanic?.base_postcode);

  return (
    <Screen
      title="Profile"
      avoidKeyboard
      action={
        <Pressable
          onPress={() => void onSave()}
          disabled={!dirty || saving}
          accessibilityRole="button"
          hitSlop={Spacing[2]}
        >
          <Text color={dirty ? 'blue' : 'textDisabled'} style={styles.strong}>
            {saving ? 'Saving…' : saved && !dirty ? 'Saved' : 'Save'}
          </Text>
        </Pressable>
      }
    >
      <Card elevated style={styles.hero}>
        <Pressable
          onPress={changePhoto}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Change your profile photo"
          style={styles.avatarWrap}
        >
          <Avatar name={name || user?.email || 'BMT'} source={avatar} size={Sizing.emptyHero.box} rounded />
          <View style={styles.cameraBadge}>
            <Icon icon={Camera} size={Sizing.iconTile.sm.glyph} strokeWidth={2} color={Palette.textInverse} />
          </View>
        </Pressable>
        <Text variant="h3" style={styles.centre}>
          {name.trim() || 'Your name'}
        </Text>
        {!!area && (
          <Text variant="caption" color="textMuted">
            Based in {area}
          </Text>
        )}
        <View style={styles.stats}>
          <Stat value={rating ? rating.toFixed(1) : '—'} label="Rating" />
          <View style={styles.statRule} />
          <Stat value={String(mechanic?.job_count ?? 0)} label="Jobs" />
          <View style={styles.statRule} />
          <Stat value={years >= 1 ? `${years} yr${years === 1 ? '' : 's'}` : 'New'} label="On BMT" />
        </View>
        {rating > 0 && <Stars rating={rating} />}
        {uploading && (
          <Text variant="caption" color="textMuted">
            Uploading your photo…
          </Text>
        )}
      </Card>

      {!!error && (
        <Notice icon={CircleAlert} tone="danger" title="That didn’t save">
          {error}
        </Notice>
      )}

      <Input
        label="Full name"
        value={name}
        onChangeText={(next) => {
          setName(next);
          setSaved(false);
        }}
        placeholder="Your name"
        maxLength={MAX_NAME_CHARS}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />

      <Input
        label="Phone"
        helper="Customers can call you once a job is confirmed."
        value={phone}
        onChangeText={(next) => {
          setPhone(next);
          setSaved(false);
        }}
        placeholder="07700 900123"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />

      <Input
        label="Bio · shown to customers"
        helper={`${bio.trim().length}/${MAX_BIO_CHARS} · qualifications, years in the trade, what you like working on.`}
        value={bio}
        onChangeText={(next) => {
          setBio(next);
          setSaved(false);
        }}
        placeholder="City & Guilds Level 3 · 12 years in the trade · ex-main dealer."
        rows={4}
        maxLength={MAX_BIO_CHARS}
      />

      <Input
        label="Base postcode"
        iconLeft={Lock}
        value={postcode}
        editable={false}
        placeholder="Set by Book My Tech"
        helper="Your base postcode is locked. Contact support to request a change."
      />

      <Button fullWidth size="xl" loading={saving} disabled={!dirty} onPress={onSave}>
        {saved && !dirty ? 'Saved' : 'Save changes'}
      </Button>

      {router.canGoBack() && saved && !dirty && (
        <Button fullWidth variant="ghost" onPress={() => router.back()}>
          Back to account
        </Button>
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.strong}>{value}</Text>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strong: { fontWeight: '700' },
  centre: { textAlign: 'center' },

  hero: { alignItems: 'center', gap: Spacing[2] },
  avatarWrap: { marginBottom: Spacing[1] },
  cameraBadge: {
    position: 'absolute',
    right: -Spacing[1],
    bottom: -Spacing[1],
    width: Sizing.iconTile.sm.box,
    height: Sizing.iconTile.sm.box,
    borderRadius: Radius.input,
    backgroundColor: Palette.blue,
    borderWidth: 2,
    borderColor: Palette.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4], marginTop: Spacing[1] },
  stat: { alignItems: 'center', gap: Spacing[1] },
  statRule: { width: 1, height: Spacing[5], backgroundColor: Palette.borderSubtle },

});
