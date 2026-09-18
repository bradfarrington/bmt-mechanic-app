import { Send } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Chat, Palette, Spacing } from '@/constants/theme';

export interface ChatBubbleProps {
  /** The text. Empty is allowed when there is an attachment — no bubble is drawn. */
  children: string;
  /** Sent by the customer — blue, on the right. */
  mine?: boolean;
  /** The line under the bubble — "You · 09:14". */
  meta?: string;
  /** Photos and the like, between the bubble and the meta line. */
  attachment?: ReactNode;
}

/** One message in a thread — `.chat-mine` / `.chat-theirs` in the mockups. */
export function ChatBubble({ children, mine = false, meta, attachment }: ChatBubbleProps) {
  return (
    <View style={[styles.wrap, mine && styles.wrapMine]}>
      {!!children.trim() && (
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text variant="bodySm" color={mine ? 'textInverse' : 'textPrimary'}>
            {children}
          </Text>
        </View>
      )}
      {attachment}
      {!!meta && (
        <Text variant="caption" color="textFaint" style={styles.meta}>
          {meta}
        </Text>
      )}
    </View>
  );
}

export interface ChatComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder: string;
  /** Spinner on the send button, and the field locked, while a message goes. */
  sending?: boolean;
  /** Whether what's typed can go — false while it's empty or over a length cap. */
  canSend: boolean;
  maxLength?: number;
}

/**
 * The reply bar under a thread: a field and a round send button. Goes in
 * `Screen`'s `footer`; the mockup puts that bar on white, via `footerStyle`.
 */
export function ChatComposer({
  value,
  onChangeText,
  onSend,
  placeholder,
  sending = false,
  canSend,
  maxLength,
}: ChatComposerProps) {
  return (
    <View style={styles.composer}>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        rows={2}
        containerStyle={styles.field}
        editable={!sending}
        maxLength={maxLength}
      />
      <Button
        iconOnly
        round
        size="lg"
        iconLeft={Send}
        loading={sending}
        disabled={!canSend}
        onPress={onSend}
      >
        Send message
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    gap: Spacing[1],
    maxWidth: Chat.bubbleMaxWidth,
  },
  wrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: Chat.bubbleRadius,
  },
  bubbleTheirs: {
    borderBottomLeftRadius: Chat.tailRadius,
    backgroundColor: Palette.surfaceCard,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  bubbleMine: {
    borderBottomRightRadius: Chat.tailRadius,
    backgroundColor: Palette.blue,
  },
  meta: { paddingHorizontal: Spacing[1] },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing[2] },
  field: { flex: 1 },
});
