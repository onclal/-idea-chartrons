import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmergencySafety } from './EmergencySafety';
import { AudioReader } from './AudioReader';
import { CallButton } from './CallButton';
import { Card } from './ui';
import { useConciergePanel } from '../context/ConciergePanelContext';
import { confortCoolPois, confortDeliveryPois, poiListenText } from '../lib/confortPlaces';
import { canListen, speechLang, voiceRecognitionConstructor, type VoiceRecognition } from '../lib/webSpeech';
import { LOCAL_RELAIS_PHONE, type ChartronsPoi } from '@idea-chartrons/shared';
import { PhoneLink } from './PhoneLink';
import { GATHERING_POINTS } from '../data/securite';
import { loc } from '../lib/locale';

type ConfortView = 'home' | 'urgences' | 'livraison' | 'frais';

export function ConfortDashboard() {
  const { t, i18n } = useTranslation();
  const { ask, openPanel } = useConciergePanel();
  const [view, setView] = useState<ConfortView>('home');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<VoiceRecognition | null>(null);
  const delivery = useMemo(() => confortDeliveryPois(), []);
  const cool = useMemo(() => confortCoolPois(), []);
  const voiceSupported = canListen();

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    [],
  );

  const stopVoice = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  };

  const speakToConcierge = () => {
    if (listening) {
      stopVoice();
      return;
    }

    const Recognition = voiceRecognitionConstructor();
    if (!Recognition) {
      openPanel();
      return;
    }

    openPanel();
    const recognition = new Recognition();
    recognition.lang = speechLang(i18n.language);
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => event.results[index][0].transcript)
        .join(' ')
        .trim();
      if (transcript) void ask(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  if (view !== 'home') {
    return (
      <div className="space-y-4 animate-fade-in">
        <button
          type="button"
          onClick={() => setView('home')}
          className="w-full min-h-[60px] rounded-2xl border-2 border-current font-bold text-lg touch-target"
        >
          {t('confort.back')}
        </button>
        {view === 'urgences' && (
          <div className="space-y-4">
            <EmergencySafety />
            <Card className="!p-4 space-y-3">
              <p className="text-lg font-bold">{t('confort.tiles.relaisTitle')}</p>
              <p className="leading-relaxed">{t('confort.tiles.relaisHint')}</p>
              <PhoneLink phone={LOCAL_RELAIS_PHONE} />
              <Link
                to="/relais"
                className="flex items-center justify-center min-h-[60px] rounded-2xl border-2 border-current font-bold touch-target"
              >
                {t('confort.tiles.relaisCta')}
              </Link>
            </Card>
          </div>
        )}
        {view === 'livraison' && <ConfortPoiList pois={delivery} empty={t('confort.emptyDelivery')} />}
        {view === 'frais' && (
          <div className="space-y-3">
            {GATHERING_POINTS.map((place) => (
              <Card key={place.id} className="!p-4 space-y-3">
                <p className="text-xl font-bold leading-snug">{loc(i18n.language, place.name)}</p>
                <p className="leading-relaxed">{loc(i18n.language, place.hint)}</p>
                <p className="leading-relaxed">📍 {place.adresse}</p>
                <AudioReader
                  text={`${loc(i18n.language, place.name)}. ${place.adresse}. ${loc(i18n.language, place.hint)}`}
                  className="w-full"
                />
              </Card>
            ))}
            <ConfortPoiList pois={cool} empty={cool.length ? '' : t('confort.emptyCool')} extra={t('confort.coolHint')} />
          </div>
        )}
      </div>
    );
  }

  const tiles = [
    { id: 'urgences' as const, title: t('confort.tiles.urgences'), hint: t('confort.tiles.urgencesHint') },
    { id: 'livraison' as const, title: t('confort.tiles.livraison'), hint: t('confort.tiles.livraisonHint') },
    { id: 'frais' as const, title: t('confort.tiles.frais'), hint: t('confort.tiles.fraisHint') },
  ];

  return (
    <section className="space-y-4 animate-fade-in" aria-label={t('confort.welcome')}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('confort.welcome')}</h2>
        <p className="leading-relaxed">{t('confort.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            onClick={() => setView(tile.id)}
            className="confort-tile w-full min-h-[88px] rounded-3xl border-2 border-current px-4 py-4 text-left touch-target"
          >
            <span className="block text-xl font-bold leading-snug">{tile.title}</span>
            <span className="block mt-1 leading-snug opacity-90">{tile.hint}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={speakToConcierge}
          aria-pressed={listening}
          className="confort-tile confort-tile-voice w-full min-h-[88px] rounded-3xl border-2 border-current px-4 py-4 text-left touch-target"
        >
          <span className="block text-xl font-bold leading-snug">{t('confort.tiles.concierge')}</span>
          <span className="block mt-1 leading-snug opacity-90">
            {listening ? t('confort.listening') : voiceSupported ? t('confort.tiles.conciergeHint') : t('confort.voiceUnsupported')}
          </span>
        </button>
      </div>
    </section>
  );
}

function ConfortPoiList({ pois, empty, extra }: { pois: ChartronsPoi[]; empty: string; extra?: string }) {
  if (pois.length === 0) {
    return empty ? <Card className="!p-4 text-lg leading-relaxed">{empty}</Card> : null;
  }

  return (
    <div className="space-y-3">
      {extra && <p className="leading-relaxed">{extra}</p>}
      {pois.map((poi) => (
        <Card key={poi.id} className="!p-4 space-y-3">
          <p className="text-xl font-bold leading-snug">{poi.name}</p>
          <p className="leading-relaxed">{poi.specialty}</p>
          <p className="leading-relaxed">📍 {poi.address}</p>
          <div className="flex flex-col gap-2">
            {poi.phone && <CallButton phone={poi.phone} className="w-full min-h-[60px] text-base" />}
            <AudioReader text={poiListenText(poi)} className="w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}
