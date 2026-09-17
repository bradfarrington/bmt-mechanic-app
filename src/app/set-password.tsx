import { PasswordLinkScreen } from '@/components/password-link-screen';

/**
 * A newly approved mechanic's first password — opened by the link in the
 * approval email. Finishing it leaves them signed in, and the entry router
 * carries them on into first-run setup.
 */
export default function SetPasswordScreen() {
  return <PasswordLinkScreen variant="welcome" />;
}
