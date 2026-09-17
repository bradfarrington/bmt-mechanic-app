import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/lib/auth';
import { fetchInbox, type Inbox } from '@/lib/inbox';

/** Often enough for a badge; the Inbox tab itself refreshes on focus. */
const POLL_MS = 60_000;

interface InboxValue {
  inbox: Inbox | null;
  error: string | null;
  unreadCount: number;
  refresh: () => Promise<void>;
  /** For the read routes, which answer with the new count. */
  setUnreadCount: (count: number) => void;
  /** Mark rows read on screen before the CRM has confirmed it. */
  markLocally: (ids: readonly string[] | 'all') => void;
}

const InboxContext = createContext<InboxValue | null>(null);

/**
 * One copy of the feed for the Inbox tab and the tab bar's unread dot. Polled
 * gently while the app is in the foreground and someone is signed in.
 */
export function InboxProvider({ children }: { children: ReactNode }) {
  const { mechanic } = useAuth();
  const signedIn = !!mechanic;

  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A promise, not an async function: state is only written inside the
  // `.then`, so the effect below never sets state synchronously.
  const refresh = useCallback(
    (): Promise<void> =>
      fetchInbox().then((result) => {
        if (result.ok) {
          setInbox(result.inbox);
          setError(null);
        } else {
          setError(result.error);
        }
      }),
    [],
  );

  useEffect(() => {
    if (!signedIn) return;

    void refresh();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, POLL_MS);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });

    return () => {
      clearInterval(timer);
      foreground.remove();
    };
  }, [signedIn, refresh]);

  const value: InboxValue = {
    // Nothing of the last mechanic's is shown to the next one to sign in.
    inbox: signedIn ? inbox : null,
    error: signedIn ? error : null,
    unreadCount: signedIn ? (inbox?.unreadCount ?? 0) : 0,
    refresh,
    setUnreadCount: (unreadCount) =>
      setInbox((current) => current && { ...current, unreadCount }),
    markLocally: (ids) =>
      setInbox(
        (current) =>
          current && {
            ...current,
            items: current.items.map((item) =>
              // A thread is only read by opening it.
              !item.id.startsWith('thread:') && (ids === 'all' || ids.includes(item.id))
                ? { ...item, unread: false }
                : item,
            ),
          },
      ),
  };

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox(): InboxValue {
  const value = useContext(InboxContext);
  if (!value) throw new Error('useInbox must be used inside <InboxProvider>');
  return value;
}
