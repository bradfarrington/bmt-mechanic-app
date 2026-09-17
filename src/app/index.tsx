import { Redirect } from 'expo-router';

/**
 * Entry router. Everyone lands on Today for now; once the auth stack exists
 * this sends a signed-out mechanic to sign-in and an unfinished one to
 * onboarding.
 */
export default function Index() {
  return <Redirect href="/today" />;
}
