import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { canSpeak, speakText } from '../lib/webSpeech';

interface AudioReaderProps {
  text: string;
  className?: string;
}

export function AudioReader({ text, className = '' }: AudioReaderProps) {
  const { t, i18n } = useTranslation();
  const [speaking, setSpeaking] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const spoken = text.replace(/\s+/g, ' ').trim();

  useEffect(
    () => () => {
      stopRef.current?.();
    },
    [],
  );

  if (!spoken || !canSpeak()) return null;

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setSpeaking(false);
  };

  const toggle = () => {
    if (speaking) {
      stop();
      return;
    }
    setSpeaking(true);
    stopRef.current = speakText(spoken, i18n.language, () => {
      stopRef.current = null;
      setSpeaking(false);
    });
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        toggle();
      }}
      aria-pressed={speaking}
      className={`audio-reader inline-flex items-center justify-center gap-2 min-h-[60px] px-4 rounded-2xl bg-white text-chartrons-olive-dark border-2 border-chartrons-olive text-base font-bold touch-target ${className}`}
    >
      {speaking ? t('confort.stop') : t('confort.listen')}
    </button>
  );
}
