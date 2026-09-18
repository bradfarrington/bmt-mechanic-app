import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { newDraft, type ApplicationDraft } from '@/lib/application';

/**
 * The application in progress, shared by the wizard's screens. Held in memory
 * only — the web keeps it in session storage and never persists the bank
 * details at all; here nothing is written to the device. Leaving the wizard
 * and coming back starts a new draft.
 */
interface DraftContextValue {
  draft: ApplicationDraft;
  update: (change: Partial<ApplicationDraft>) => void;
  reset: () => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function ApplicationDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<ApplicationDraft>(newDraft);

  const update = useCallback((change: Partial<ApplicationDraft>) => {
    setDraft((current) => ({ ...current, ...change }));
  }, []);

  const reset = useCallback(() => setDraft(newDraft()), []);

  const value = useMemo(() => ({ draft, update, reset }), [draft, update, reset]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useApplicationDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error('useApplicationDraft must be used inside the apply layout');
  return context;
}
