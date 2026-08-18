import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { PostAnnonce } from '@idea-chartrons/shared';
import {
  askConcierge,
  type ConciergeLangChoice,
  type ConciergeMessage,
} from '../lib/concierge';
import {
  extractChecklist,
  filterMatchingPosts,
  hasRichConciergeContent,
  isPostQuery,
  isRecipeQuery,
} from '../lib/conciergeRich';
import { api } from '../lib/api';

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
  ask: (question: string) => Promise<void>;
  openPanel: () => void;
  closePanel: () => void;
  toggleCollapsed: () => void;
  clear: () => void;
}

const ConciergePanelContext = createContext<ConciergePanelContextValue | null>(null);

export function ConciergePanelProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
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

  const checklist = useMemo(() => {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    if (!lastUser || !isRecipeQuery(lastUser.content) || !lastAssistant) return [];
    return extractChecklist(lastAssistant.content);
  }, [lastAssistant, messages]);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || pending) return;

      const history = messages;
      setMessages((current) => [...current, createMessage('user', trimmed)]);
      setPending(true);
      setOpen(true);
      setCollapsed(false);

      let posts: PostAnnonce[] = [];
      if (isPostQuery(trimmed) || isRecipeQuery(trimmed)) {
        try {
          posts = filterMatchingPosts(await api.getPosts(), trimmed);
        } catch {
          posts = [];
        }
      }
      setMatchingPosts(posts);

      try {
        const answer = await askConcierge({
          message: trimmed,
          history,
          lang: replyLang,
          uiLang: i18n.language,
        });
        const next = createMessage('assistant', answer.reply, {
          source: answer.source,
          lang: answer.lang,
          recommendations: answer.recommendations,
          heritage: answer.heritage,
        });
        setMessages((current) => [...current, next]);
        if (
          hasRichConciergeContent({
            recommendations: answer.recommendations,
            heritageCount: answer.heritage.length,
            checklist: isRecipeQuery(trimmed) ? extractChecklist(answer.reply) : [],
            posts,
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
    [i18n.language, messages, pending, replyLang, t],
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
    [ask, checklist, collapsed, lastAssistant, matchingPosts, messages, open, pending, replyLang],
  );

  return <ConciergePanelContext.Provider value={value}>{children}</ConciergePanelContext.Provider>;
}

export function useConciergePanel() {
  const ctx = useContext(ConciergePanelContext);
  if (!ctx) throw new Error('useConciergePanel must be used within ConciergePanelProvider');
  return ctx;
}
