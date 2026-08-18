export function speechLang(lang: string): string {
  return lang.toLowerCase().startsWith('en') ? 'en-GB' : 'fr-FR';
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (!canSpeak()) return null;
  const prefix = speechLang(lang).slice(0, 2).toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix) && voice.localService) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

/** Lit un texte à voix haute. Renvoie une fonction d’arrêt. */
export function speakText(text: string, lang: string, onEnd?: () => void): () => void {
  if (!canSpeak()) {
    onEnd?.();
    return () => undefined;
  }

  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/\s+/g, ' ').trim().slice(0, 4000));
  utterance.lang = speechLang(lang);
  utterance.rate = 0.92;
  utterance.pitch = 1;
  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  synth.speak(utterance);
  return () => {
    synth.cancel();
  };
}

interface VoiceRecognitionResult {
  0: { transcript: string };
  isFinal: boolean;
  length: number;
}

interface VoiceRecognitionEvent {
  results: { [index: number]: VoiceRecognitionResult; length: number };
}

export interface VoiceRecognition {
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

export function voiceRecognitionConstructor(): VoiceRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as {
    SpeechRecognition?: VoiceRecognitionConstructor;
    webkitSpeechRecognition?: VoiceRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function canListen(): boolean {
  return voiceRecognitionConstructor() !== null;
}
