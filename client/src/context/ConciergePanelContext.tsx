import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ConciergePersona, PostAnnonce } from '@idea-chartrons/shared';
import {
  askConcierge,
  type ConciergeLangChoice,
  type ConciergeMessage,
} from '../lib/concierge';
import { hasRichConciergeContent } from '../lib/conciergeRich';
import { useUserLocation } from './UserLocationContext';

function createMessage(
  role: ConciergeMessage['role'],
  content: string,
  extra: Partial<ConciergeMessage> = {},
): ConciergeMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

interface ConciergePanelContextValue {
  open: boolean;
  collapsed: boolean;
  pending: boolean;
  messages: ConciergeMessage[];
  replyLang: ConciergeLangChoice;
  setReplyLang: (lang: ConciergeLangChoice) => void;
  matchingPosts: PostAnnonce[];
  checklist: string[];
  lastAssistant: ConciergeMessage | undefined;
  persona: ConciergePersona;
  ask: (question: string) => Promise<void>;
  openPanel: () => void;
  closePanel: () => void;
  toggleCollapsed: () => void;
  clear: () => void;
}

const ConciergePanelContext = createContext<ConciergePanelContextValue | null>(null);

export function ConciergePanelProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const persona: ConciergePersona = location.pathname.startsWith('/brocanteurs') ? 'chineur' : 'default';
  const { origin, originSource } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [replyLang, setReplyLang] = useState<ConciergeLangChoice>('auto');
  const [matchingPosts, setMatchingPosts] = useState<PostAnnonce[]>([]);

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant'),
    [messages],
  );

  const checklist = lastAssistant?.checklist ?? [];

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || pending) return;

      const history = messages;
      setMessages((current) => [...current, createMessage('user', trimmed)]);
      setPending(true);
      setOpen(true);
      setCollapsed(false);

      setMatchingPosts([]);

      try {
        const answer = await askConcierge({
          message: trimmed,
          history,
          lang: replyLang,
          uiLang: i18n.language,
          origin,
          originSource,
          persona,
        });
        const next = createMessage('assistant', answer.reply, {
          source: answer.source,
          lang: answer.lang,
          recommendations: answer.recommendations,
          heritage: answer.heritage,
          posts: answer.posts,
          antiqueItems: answer.antiqueItems,
          basket: answer.basket,
          checklist: answer.checklist,
        });
        setMatchingPosts(answer.posts);
        setMessages((current) => [...current, next]);
        if (
          hasRichConciergeContent({
            recommendations: answer.recommendations,
            heritageCount: answer.heritage.length,
            checklist: answer.checklist,
            posts: answer.posts,
            basket: Boolean(answer.basket),
            antiqueItems: answer.antiqueItems.length,
          })
        ) {
          setOpen(true);
          setCollapsed(false);
        }
      } catch {
        setMessages((current) => [...current, createMessage('assistant', t('conciergerie.ai.error'))]);
      } finally {
        setPending(false);
      }
    },
    [i18n.language, messages, origin, originSource, pending, persona, replyLang, t],
  );

  const value = useMemo<ConciergePanelContextValue>(
    () => ({
      open,
      collapsed,
      pending,
      messages,
      replyLang,
      setReplyLang,
      matchingPosts,
      checklist,
      lastAssistant,
      persona,
      ask,
      openPanel: () => {
        setOpen(true);
        setCollapsed(false);
      },
      closePanel: () => setOpen(false),
      toggleCollapsed: () => setCollapsed((current) => !current),
      clear: () => {
        setMessages([]);
        setMatchingPosts([]);
      },
    }),
    [ask, checklist, collapsed, lastAssistant, matchingPosts, messages, open, pending, persona, replyLang],
  );

  return <ConciergePanelContext.Provider value={value}>{children}</ConciergePanelContext.Provider>;
}

export function useConciergePanel() {
  const ctx = useContext(ConciergePanelContext);
  if (!ctx) throw new Error('useConciergePanel must be used within ConciergePanelProvider');
  return ctx;
}
