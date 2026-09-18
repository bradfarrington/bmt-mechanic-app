import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  CalendarX,
  ChevronDown,
  ChevronRight,
  Crown,
  Landmark,
  LifeBuoy,
  Mail,
  Package,
  ScrollText,
  Search,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Card, Icon, IconTile, Input, Overline, Screen, Text } from '@/components/ui';
import { Palette, Sizing, Spacing } from '@/constants/theme';
import { Env } from '@/lib/env';

/**
 * Help centre — mockup frame 8. Static answers and the ways to reach the
 * team, the customer app's pattern. Every answer is checked against the CRM
 * rather than taken from the mockup: instant per-job payouts (owner decision
 * 2026-07-01), the dispute cores, parts sourcing and the cancellation code.
 * Change these alongside the CRM.
 *
 * TODO(data): the mockup also offers Chat ("5 min") and Phone ("Mon–Sat
 * 8–6"). The CRM has no support chat, phone number or opening hours anywhere,
 * so they stay out until real ones exist — add them here.
 */

/** The address the CRM's help page, error pages and emails all give. */
const SUPPORT_EMAIL = 'support@bookmytech.co.uk';

interface Article {
  id: string;
  icon: LucideIcon;
  title: string;
  summary: string;
  body?: string;
  links?: readonly { label: string; path: string }[];
}

const ARTICLES: readonly Article[] = [
  {
    id: 'paid',
    icon: Landmark,
    title: 'When am I paid?',
    summary: 'Per job, on completion, via Stripe',
    body:
      'You are paid for each job the moment you complete it and the customer is charged: your ' +
      'share goes straight to the bank account on your Stripe Express account. There is no ' +
      'weekly run to wait for. Earnings shows every transfer, and your Stripe dashboard ' +
      'itemises them. If a refund is later agreed on a job, Book My Tech fronts it and recovers ' +
      'it from your next payouts — Earnings shows that as a balance being recovered.',
  },
  {
    id: 'disputes',
    icon: ShieldAlert,
    title: 'Disputes explained',
    summary: 'Who decides, and what you can do',
    body:
      'A customer can raise a dispute about a job, and so can you. Both of you can reply, ' +
      'attach photos and ask Book My Tech to step in; if neither side has, BMT steps in on its ' +
      'own after a set time. Only Book My Tech decides the outcome and whether any money ' +
      'moves. A dispute you raised yourself can be withdrawn while it is still open. Anything ' +
      'between you and BMT alone — a payout query, a no-show — is a case under Get help, which ' +
      'customers never see.',
  },
  {
    id: 'parts',
    icon: Package,
    title: 'Parts & who sources them',
    summary: 'BMT-supplied or yours',
    body:
      'Each part on a job is marked as sourced by Book My Tech or by you. Mark BMT parts ' +
      'ordered, delivered and used from the job page so everyone can see where they are. If the ' +
      'car needs something different once you are there, change what is being done from the job ' +
      'page: the customer gets the new price to approve before you go ahead, and you can end ' +
      'the visit on site if they decline.',
  },
  {
    id: 'cancel',
    icon: CalendarX,
    title: 'Cancelling a job',
    summary: 'Running late, moving a job, no-shows',
    body:
      'Running late? Move the job from the job page or push all of today’s remaining jobs at ' +
      'once from Today — the customer is asked to agree the new time. If you have to cancel, do ' +
      'it from the job page as early as you can: a job you drop is re-offered to other ' +
      'mechanics, and repeated late cancellations count against you. A customer who is not there ' +
      'when you arrive is a case for Get help, not a cancellation.',
  },
  {
    id: 'pro',
    icon: Crown,
    title: 'Pro tier & how to keep it',
    summary: 'Lower commission, first look at offers',
    body:
      'Pro mechanics pay a lower commission and see offers first. Go Pro on your Account ' +
      'shows how far along you are, what Pro gives and the standards that keep it. Book My ' +
      'Tech sets the tier for now.',
  },
  {
    id: 'legal',
    icon: ScrollText,
    title: 'Terms & privacy',
    summary: 'Legal bits',
    links: [
      { label: 'Terms & Conditions', path: '/terms' },
      { label: 'Privacy Policy', path: '/privacy' },
    ],
  },
];

function matches(article: Article, query: string) {
  return [article.title, article.summary, article.body ?? '', ...(article.links ?? []).map((l) => l.label)]
    .join(' ')
    .toLowerCase()
    .includes(query);
}

export default function HelpScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const trimmed = query.trim().toLowerCase();
  const articles = trimmed ? ARTICLES.filter((article) => matches(article, trimmed)) : ARTICLES;

  return (
    <Screen title="Help centre" avoidKeyboard>
      <View style={styles.intro}>
        <Text variant="h1">How can we help?</Text>
        <Text color="textSecondary">Answers, guides and a line to the ops team.</Text>
      </View>

      <Input
        iconLeft={Search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search articles…"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search articles"
      />

      <View style={styles.section}>
        <Overline>Talk to someone</Overline>
        <View style={styles.contacts}>
          <ContactCard
            icon={Mail}
            title="Email"
            detail={SUPPORT_EMAIL}
            onPress={() =>
              Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() =>
                Alert.alert("Couldn't open that", `You can reach us at ${SUPPORT_EMAIL}.`),
              )
            }
          />
          <ContactCard
            icon={LifeBuoy}
            title="Raise a case"
            detail="Payouts, no-shows, safety"
            onPress={() => router.push('/cases')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Overline>{trimmed ? 'Matching articles' : 'Popular'}</Overline>
        {articles.length ? (
          <Card padded={false}>
            {articles.map((article, index) => (
              <ArticleRow
                key={article.id}
                article={article}
                open={openId === article.id}
                divided={index > 0}
                onToggle={() => setOpenId((current) => (current === article.id ? null : article.id))}
              />
            ))}
          </Card>
        ) : (
          <Text variant="bodySm" color="textMuted">
            Nothing matches &ldquo;{query.trim()}&rdquo;. Try another word, or email us.
          </Text>
        )}
      </View>
    </Screen>
  );
}

function ContactCard({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${detail}`}
      style={({ pressed }) => [styles.contact, pressed && styles.pressed]}
    >
      <Card style={styles.contactCard}>
        <IconTile icon={icon} style={styles.contactTile} />
        <Text variant="bodySm" style={[styles.strong, styles.centre]}>
          {title}
        </Text>
        <Text variant="caption" color="textMuted" style={styles.centre} numberOfLines={2}>
          {detail}
        </Text>
      </Card>
    </Pressable>
  );
}

function ArticleRow({
  article,
  open,
  divided,
  onToggle,
}: {
  article: Article;
  open: boolean;
  divided: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={divided && styles.divided}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <IconTile icon={article.icon} size="sm" />
        <View style={styles.rowText}>
          <Text variant="bodySm" style={styles.strong}>
            {article.title}
          </Text>
          <Text variant="caption" color="textMuted">
            {article.summary}
          </Text>
        </View>
        <Icon icon={open ? ChevronDown : ChevronRight} size={Sizing.rowChevron} strokeWidth={2} color={Palette.textMuted} />
      </Pressable>

      {open && (
        <View style={styles.answer}>
          {!!article.body && (
            <Text variant="bodySm" color="textSecondary">
              {article.body}
            </Text>
          )}
          {article.links?.map((link) => (
            <Text
              key={link.path}
              variant="bodySm"
              color="blue"
              style={styles.strong}
              accessibilityRole="link"
              // The CRM deployment behind the API is the website too.
              onPress={() => void WebBrowser.openBrowserAsync(`${Env.apiBaseUrl}${link.path}`)}
            >
              {link.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  section: { gap: Spacing[2] },
  pressed: { opacity: 0.7 },
  strong: { fontWeight: '700' },
  centre: { textAlign: 'center' },

  contacts: { flexDirection: 'row', gap: Spacing[2] },
  contact: { flex: 1 },
  contactCard: { alignItems: 'center', gap: Spacing[1], padding: Sizing.compactPadding },
  contactTile: { marginBottom: Spacing[1] },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Sizing.compactPadding,
  },
  divided: { borderTopWidth: 1, borderTopColor: Palette.borderSubtle },
  rowText: { flex: 1, gap: Spacing[1] },
  answer: {
    gap: Spacing[2],
    paddingBottom: Spacing[3],
    paddingLeft: Sizing.compactPadding + Sizing.iconTile.sm.box + Spacing[3],
    paddingRight: Sizing.compactPadding,
  },
});
