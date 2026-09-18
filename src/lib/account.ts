import { api, unwrapAction } from '@/lib/api';

/**
 * Account-level actions — the things that change who the mechanic *is*,
 * rather than what they do. Both go through the CRM: the email change holds
 * its pending address in a service-role-only table, and deletion needs the
 * service role to remove the auth user and a policy about which records
 * survive (a completed job and its ledger line are financial records).
 *
 * The customer app has the same two against `/account/*`; those routes refuse
 * a staff token, so the mechanic ones sit under `/mechanic/account/*` — see
 * `docs/account-crm-prompt.md` §6. The password change stays with Supabase
 * Auth in `lib/auth.tsx`, where a fresh sign-in is itself the proof.
 */

export type EmailChangeField = 'new_email' | 'password';

export type EmailChangeResult =
  | { ok: true; sentTo: string }
  | { ok: false; error: string; field?: EmailChangeField };

/**
 * Start a change of the sign-in email. On `ok` the confirmation link is in
 * the **new** inbox and nothing has changed yet; the old address is told as
 * well. The link opens a Book My Tech web page, not the app.
 */
export async function requestEmailChange(
  newEmail: string,
  currentPassword: string,
): Promise<EmailChangeResult> {
  return unwrapAction(
    await api.post<EmailChangeResult>('/mechanic/account/email', {
      new_email: newEmail,
      current_password: currentPassword,
    }),
  );
}

/**
 * Why the CRM declined to delete the account, when it did. The sentence is
 * shown either way; the code is here so a screen could branch.
 */
export type DeletionRefusal = 'live_booking' | 'open_dispute' | 'open_case' | 'balance_owed';

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string; code?: DeletionRefusal | string };

/**
 * Ask the CRM to delete the signed-in mechanic's account. The caller has just
 * re-entered their password, so the token this carries is seconds old.
 * `confirm` is a tripwire: an empty body must never be enough.
 */
export async function requestAccountDeletion(): Promise<DeleteAccountResult> {
  return unwrapAction(
    await api.post<DeleteAccountResult>('/mechanic/account/delete', { confirm: true }),
  );
}
