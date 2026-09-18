import { useRouter } from 'expo-router';
import { Mail, MapPin, Phone, UserRound, Wrench } from 'lucide-react-native';
import { useState } from 'react';

import { ApplyStep } from '@/components/apply-step';
import { Input } from '@/components/ui';
import { checkAbout } from '@/lib/application';
import { useApplicationDraft } from '@/lib/application-draft';

/** Step 1 — about you. The web's `step-about.tsx`. */
export default function ApplyAboutScreen() {
  const router = useRouter();
  const { draft, update } = useApplicationDraft();
  const [error, setError] = useState<string | null>(null);

  function onContinue() {
    const problem = checkAbout(draft);
    setError(problem);
    if (!problem) router.push('/apply/business');
  }

  return (
    <ApplyStep
      step={1}
      heading="Join Book My Tech."
      intro="Free to apply, and it takes about 10 minutes. Let's start with your contact details."
      error={error}
      onContinue={onContinue}
    >
      <Input
        label="Full name"
        iconLeft={UserRound}
        value={draft.fullName}
        onChangeText={(fullName) => update({ fullName })}
        placeholder="e.g. Mike Wilson"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />
      <Input
        label="Email"
        iconLeft={Mail}
        helper="We'll send your application updates here."
        value={draft.email}
        onChangeText={(email) => update({ email })}
        placeholder="mike@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Input
        label="Phone"
        iconLeft={Phone}
        value={draft.phone}
        onChangeText={(phone) => update({ phone })}
        placeholder="07700 900000"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <Input
        label="Postcode"
        iconLeft={MapPin}
        helper="Where you're based — it decides which jobs you're offered."
        value={draft.postcode}
        onChangeText={(postcode) => update({ postcode: postcode.toUpperCase() })}
        placeholder="SE15 5DT"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="postal-code"
        textContentType="postalCode"
        maxLength={8}
      />
      <Input
        label="Years of experience"
        optional
        iconLeft={Wrench}
        value={draft.yearsExperience}
        onChangeText={(yearsExperience) => update({ yearsExperience: yearsExperience.replace(/\D/g, '') })}
        placeholder="e.g. 8"
        keyboardType="number-pad"
        maxLength={2}
      />
    </ApplyStep>
  );
}
