import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActeurLocal } from '@idea-chartrons/shared';
import { Badge, Button, Card } from './ui';
import { api, type FideliteScanResult } from '../lib/api';

interface FideliteScannerProps {
  acteurs: ActeurLocal[];
  userId?: string;
  userPoints?: number;
  onScanSuccess?: (result: FideliteScanResult) => void;
}

export function FideliteScanner({
  acteurs,
  userId = 'user-1',
  userPoints = 0,
  onScanSuccess,
}: FideliteScannerProps) {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [selectedActeur, setSelectedActeur] = useState<string | null>(null);
  const [result, setResult] = useState<FideliteScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayPoints, setDisplayPoints] = useState(userPoints);

  useEffect(() => {
    setDisplayPoints(userPoints);
  }, [userPoints]);

  const simulateScan = async () => {
    if (!selectedActeur) return;
    const acteur = acteurs.find((a) => a.id === selectedActeur);
    if (!acteur) return;

    setScanning(true);
    setError(null);
    setResult(null);

    await new Promise((r) => setTimeout(r, 1200));

    try {
      const response = await api.scanFidelite({
        userId,
        commerceId: acteur.id,
        qrCode: acteur.qrCodeVitrine,
      });
      setResult(response);
      setDisplayPoints(response.totalPoints);
      onScanSuccess?.(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="bg-chartrons-gold/15 p-4 border-b border-chartrons-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-chartrons-green-dark">{t('fidelite.title')}</h3>
            <p className="text-xs text-chartrons-warm-gray mt-0.5">{t('fidelite.subtitle')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-chartrons-warm-gray">{t('fidelite.yourPoints')}</p>
            <p className="text-2xl font-bold text-chartrons-gold">{displayPoints}</p>
            {result && (
              <Badge variant="gold">{t(`fidelite.levels.${result.niveau}`)}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div
          className={`relative aspect-video rounded-2xl border-2 overflow-hidden transition-colors ${
            scanning
              ? 'border-chartrons-green bg-chartrons-green/5'
              : 'border-chartrons-gold/30 bg-chartrons-green-dark/5'
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {scanning ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto border-4 border-chartrons-green/20 border-t-chartrons-green rounded-full animate-spin mb-3" />
                <p className="text-sm font-medium text-chartrons-green">{t('fidelite.scanning')}</p>
              </div>
            ) : (
              <div className="text-center p-4">
                <span className="text-4xl block mb-2">📱</span>
                <p className="text-sm text-chartrons-warm-gray">{t('fidelite.scanHint')}</p>
              </div>
            )}
          </div>
          {!scanning && (
            <>
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-chartrons-green rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-chartrons-green rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-chartrons-green rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-chartrons-green rounded-br-lg" />
              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-chartrons-green/40 animate-pulse" />
            </>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-chartrons-warm-gray">{t('fidelite.selectMerchant')}</p>
          <div className="flex flex-wrap gap-2">
            {acteurs.map((acteur) => (
              <button
                key={acteur.id}
                onClick={() => setSelectedActeur(acteur.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedActeur === acteur.id
                    ? 'bg-chartrons-green text-white border-chartrons-green'
                    : 'bg-white text-chartrons-green-dark border-chartrons-gold/20'
                }`}
              >
                {acteur.nomCommerce}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={simulateScan}
          disabled={!selectedActeur || scanning}
          className="w-full"
          variant="gold"
        >
          {scanning ? t('fidelite.scanning') : t('fidelite.scanButton')}
        </Button>

        {result && (
          <div className="p-3 rounded-xl bg-chartrons-green/10 border border-chartrons-green/20 space-y-2">
            <div className="text-center">
              <Badge variant="green">+{result.pointsGagnes} pts</Badge>
              <p className="text-sm font-medium text-chartrons-green-dark mt-2">
                {t('fidelite.success', { commerce: result.commerce, points: result.pointsGagnes })}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white/60">
                <p className="text-[10px] text-chartrons-warm-gray">{t('fidelite.breakdown.base')}</p>
                <p className="text-sm font-bold text-chartrons-green">+{result.breakdown.base}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/60">
                <p className="text-[10px] text-chartrons-warm-gray">{t('fidelite.breakdown.first')}</p>
                <p className="text-sm font-bold text-chartrons-green">+{result.breakdown.firstScanBonus}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/60">
                <p className="text-[10px] text-chartrons-warm-gray">{t('fidelite.breakdown.verified')}</p>
                <p className="text-sm font-bold text-chartrons-green">+{result.breakdown.verifiedBonus}</p>
              </div>
            </div>
            {result.vipUnlocked && (
              <div className="p-2 rounded-lg bg-chartrons-gold/20 text-center">
                <p className="text-xs font-medium text-chartrons-green-dark">
                  🎉 {t('fidelite.vipUnlocked', { offer: result.vipUnlocked })}
                </p>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs text-chartrons-green-dark text-center">{error}</p>}
      </div>
    </Card>
  );
}
