import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConciergeLang } from '@idea-chartrons/shared';
import { Badge, Button, Card } from './ui';
import { CONCIERGE_LANG_OPTIONS, type ConciergeLangChoice } from '../lib/concierge';
import { ConciergeBeretLoader } from './ConciergeBeretLoader';
import { useConciergePanel } from '../context/ConciergePanelContext';

interface VoiceRecognitionResult {
  0: { transcript: string };
  isFinal: boolean;
  length: number;
}

interface VoiceRecognitionEvent {
  results: { [index: number]: VoiceRecognitionResult; length: number };
}

interface VoiceRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: VoiceRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type VoiceRecognitionConstructor = new () => VoiceRecognition;

const SPEECH_LOCALES: Record<ConciergeLang, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  nl: 'nl-NL',
};

function voiceRecognitionConstructor(): VoiceRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as {
    SpeechRecognition?: VoiceRecognitionConstructor;
    webkitSpeechRecognition?: VoiceRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function AIConcierge() {
  const { t, i18n } = useTranslation();
  const uiLang = i18n.language;
  const {
    messages,
    pending,
    replyLang,
    setReplyLang,
    lastAssistant,
    ask,
    openPanel,
    clear,
    collapsed,
    open,
  } = useConciergePanel();
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<VoiceRecognition | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const voiceSupported = useMemo(() => voiceRecognitionConstructor() !== null, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, pending]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    [],
  );

  const submitQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || pending) return;
      setInput('');
      await ask(trimmed);
    },
    [ask, pending],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitQuestion(input);
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Recognition = voiceRecognitionConstructor();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = SPEECH_LOCALES[replyLang === 'auto' ? (uiLang.startsWith('en') ? 'en' : 'fr') : replyLang];
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index][0].transcript)
        .join(' ')
        .trim();
      if (transcript) setInput((current) => (current ? `${current} ${transcript}` : transcript));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const suggestions = useMemo(
    () => [
      t('conciergerie.ai.suggestions.dinner'),
      t('conciergerie.ai.suggestions.wine'),
      t('conciergerie.ai.suggestions.history'),
      t('conciergerie.ai.suggestions.gift'),
    ],
    [t],
  );

  const hasRich =
    Boolean(lastAssistant?.recommendations?.length) || Boolean(lastAssistant?.heritage?.length);

  return (
    <section className="space-y-4">
      <Card className="!p-4 space-y-3 bg-gradient-to-br from-chartrons-green/8 to-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-chartrons-bordeaux">{t('conciergerie.ai.title')}</h3>
            <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">
              {t('conciergerie.ai.subtitle')}
            </p>
          </div>
          <span aria-hidden className="text-2xl">
            🧭
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="green" icon="🌍">
            {t('conciergerie.ai.multilingual')}
          </Badge>
          <Badge variant="brass" icon="🏛️">
            {t('conciergerie.ai.heritageBadge')}
          </Badge>
          <Badge variant="local" icon="🛍️">
            {t('conciergerie.ai.topBadge')}
          </Badge>
        </div>
      </Card>

      <Card className="!p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[160px] space-y-1.5">
            <span className="block text-xs font-semibold uppercase tracking-wide text-chartrons-olive-dark">
              {t('conciergerie.ai.langLabel')}
            </span>
            <select
              value={replyLang}
              onChange={(event) => setReplyLang(event.target.value as ConciergeLangChoice)}
              className="w-full px-4 py-3 rounded-xl border border-chartrons-beige bg-white text-base text-chartrons-olive-dark focus:outline-none focus:ring-2 focus:ring-chartrons-bordeaux/25 min-h-[48px] cursor-pointer"
            >
              {CONCIERGE_LANG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value === 'auto' ? t('conciergerie.ai.langAuto') : option.label}
                </option>
              ))}
            </select>
          </label>
          {messages.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              {t('conciergerie.ai.clear')}
            </Button>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-chartrons-beige bg-chartrons-stone/60 p-4">
            <p className="text-sm text-chartrons-olive-dark leading-relaxed">{t('conciergerie.ai.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-chartrons-green text-white rounded-br-md'
                      : 'bg-chartrons-stone text-chartrons-olive-dark rounded-bl-md'
                  }`}
                >
                  {message.content}
                  {message.role === 'assistant' && message.source && (
                    <span className="block mt-2">
                      <Badge variant={message.source === 'openai' ? 'green' : 'stone'} icon={message.source === 'openai' ? '✨' : '📴'}>
                        {message.source === 'openai' ? t('conciergerie.ai.badgeAi') : t('conciergerie.ai.badgeLocal')}
                      </Badge>
                    </span>
                  )}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-chartrons-stone px-4 py-3">
                  <ConciergeBeretLoader size="md" label={t('conciergerie.ai.thinking')} />
                </div>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>
        )}

        {hasRich && (!open || collapsed) && (
          <Button type="button" variant="secondary" className="w-full" onClick={openPanel}>
            {t('conciergePanel.expand')}
          </Button>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            placeholder={t('conciergerie.ai.placeholder')}
            aria-label={t('conciergerie.ai.title')}
            className="w-full px-4 py-3 rounded-xl border border-chartrons-beige bg-white text-base text-chartrons-olive-dark placeholder:text-chartrons-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-chartrons-bordeaux/25 resize-none min-h-[88px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="bordeaux" className="flex-1 min-w-[140px]" disabled={pending || !input.trim()}>
              {pending ? t('conciergerie.ai.sending') : t('conciergerie.ai.send')}
            </Button>
            {voiceSupported && (
              <Button
                type="button"
                variant={listening ? 'gold' : 'secondary'}
                onClick={toggleVoice}
                aria-pressed={listening}
              >
                {listening ? `🔴 ${t('conciergerie.ai.voiceStop')}` : `🎙️ ${t('conciergerie.ai.voiceStart')}`}
              </Button>
            )}
          </div>
          {!voiceSupported && (
            <p className="text-xs text-chartrons-warm-gray">{t('conciergerie.ai.voiceUnsupported')}</p>
          )}
        </form>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-chartrons-brass">
            {t('conciergerie.ai.suggestionsTitle')}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void submitQuestion(suggestion)}
                disabled={pending}
                className="px-3 py-2 rounded-full border border-chartrons-beige bg-white text-xs font-medium text-chartrons-olive-dark hover:bg-chartrons-stone disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <p className="text-xs text-chartrons-warm-gray leading-relaxed">{t('conciergerie.ai.disclaimer')}</p>
    </section>
  );
}
