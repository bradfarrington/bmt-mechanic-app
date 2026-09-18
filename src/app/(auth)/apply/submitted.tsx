import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck, KeyRound, Mail } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, Card, IconTile, Notice, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';

/**
 * Sent. The web's `/mechanics/apply/submitted`, plus what happens next in the
 * app: approval comes by email with a link to set a password on the website,
 * and that email and password are what they sign in here with.
 */
export default function ApplySubmittedScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <Screen
      title="Application sent"
      back={false}
      footer={
        <Button fullWidth size="xl" onPress={() => router.replace('/login')}>
          Back to sign in
        </Button>
      }
    >
      <Card elevated style={styles.card}>
        <IconTile icon={CircleCheck} tone="success" size="xl" />
        <Text variant="h2">Application received.</Text>
        <Text color="textSecondary">
          Thanks for applying to join Book My Tech. We&rsquo;ve emailed a confirmation
          {email ? ` to ${email}` : ''}, and our team will review your application within a few
          working days.
        </Text>
      </Card>

      <View style={styles.steps}>
        <Notice icon={Mail} title="If we need anything else">
          We&rsquo;ll email you a secure link to send it.
        </Notice>
        <Notice icon={KeyRound} title="Once you're approved">
          Your welcome email has a link to set a password. Then sign in here with that email and
          password.
        </Notice>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing[3] },
  steps: { gap: Spacing[3] },
});
