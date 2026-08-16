import { useTranslation } from 'react-i18next';
import { isReadyForPickup, LocalRelaisRetraitStatus, RelaisCreneauType } from '@idea-chartrons/shared';
import type { LocalRelais, PostAnnonce } from '@idea-chartrons/shared';
import { useState } from 'react';
import { Badge, Button, Card } from './ui';
import { QrCodeDisplay } from './QrCodeDisplay';
import { RelaisSlotPicker } from './RelaisSlotPicker';
import { RelaisFeeBreakdown } from './RelaisFeeBreakdown';

export const LOCAL_RELAIS_ADDRESS = '26 place Jean Jaques Rabaud';

interface LocalRelaisCardProps {
  relaisList: LocalRelais[];
  posts: PostAnnonce[];
  selectedQr?: string | null;
  onSelectQr?: (code: string | null) => void;
  onReserverRetrait?: (relaisId: string, creneauId: string) => void;
  onAvancerStatut?: (relaisId: string) => void;
  isAdmin?: boolean;
}

export function LocalRelaisCard({
  relaisList,
  posts,
  selectedQr,
  onSelectQr,
  onReserverRetrait,
  onAvancerStatut,
  isAdmin = false,
}: LocalRelaisCardProps) {
  const { t } = useTranslation();
  const [retraitCreneau, setRetraitCreneau] = useState<string | null>(null);
  const [expandedRetrait, setExpandedRetrait] = useState<string | null>(null);

  const getPost = (postId: string) => posts.find((p) => p.id === postId);

  const statusVariant = (statut: LocalRelaisRetraitStatus) => {
    if (statut === LocalRelaisRetraitStatus.DisponibleAuLocal) return 'green';
    if (statut === LocalRelaisRetraitStatus.Recupere) return 'gray';
    return 'gold';
  };

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="bg-gradient-to-br from-chartrons-bordeaux to-chartrons-olive-dark p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-2xl shrink-0">
            📦
          </div>
          <div>
            <h3 className="font-bold text-lg">{t('relais.title')}</h3>
            <p className="text-xs text-white/70 mt-0.5">{t('relais.subtitle')}</p>
            <p className="text-sm mt-2 flex items-center gap-1">
              <span aria-hidden>📍</span>
              {LOCAL_RELAIS_ADDRESS}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-chartrons-green-dark mb-2">
            {t('relais.depotsStatus')}
          </h4>
          {relaisList.length === 0 ? (
            <p className="text-sm text-chartrons-warm-gray">{t('relais.noDepots')}</p>
          ) : (
            <div className="space-y-2">
              {relaisList.map((relais) => {
                const ready = isReadyForPickup(relais);
                const post = getPost(relais.postId);
                return (
                  <div
                    key={relais.id}
                    className={`rounded-xl border transition-colors ${
                      ready
                        ? 'border-chartrons-gold bg-chartrons-gold/10 ring-2 ring-chartrons-gold/30'
                        : selectedQr === relais.codeQrValidation
                          ? 'border-chartrons-green bg-chartrons-green/5'
                          : 'border-chartrons-gold/15'
                    }`}
                  >
                    <button
                      onClick={() =>
                        onSelectQr?.(
                          selectedQr === relais.codeQrValidation ? null : relais.codeQrValidation,
                        )
                      }
                      className="w-full text-left p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-chartrons-green-dark truncate">
                          {ready && <span className="mr-1">🔔</span>}
                          {post?.titre ?? relais.postId}
                        </p>
                        <Badge variant={statusVariant(relais.statutRetrait) === 'green' ? 'local' : statusVariant(relais.statutRetrait) === 'gold' ? 'brass' : 'stone'}>
                          {t(`relais.status.${relais.statutRetrait}`)}
                        </Badge>
                      </div>
                      <p className="text-xs text-chartrons-warm-gray mt-1">
                        {t('relais.depositedOn')}{' '}
                        {new Date(relais.dateDepot).toLocaleDateString()}
                      </p>
                      {ready && (
                        <p className="text-xs font-medium text-chartrons-green mt-1">
                          {t('relais.readyForPickup')}
                        </p>
                      )}
                    </button>

                    <div className="px-3 pb-3">
                      <RelaisFeeBreakdown prix={post?.prix ?? null} compact />
                    </div>

                    {ready && !relais.creneauRetraitId && (
                      <div className="px-3 pb-3 border-t border-chartrons-gold/20 pt-2">
                        <button
                          onClick={() =>
                            setExpandedRetrait(expandedRetrait === relais.id ? null : relais.id)
                          }
                          className="text-xs font-medium text-chartrons-green underline"
                        >
                          {expandedRetrait === relais.id
                            ? t('relais.hideSlots')
                            : t('relais.bookRetrait')}
                        </button>
                        {expandedRetrait === relais.id && (
                          <div className="mt-2 space-y-2">
                            <RelaisSlotPicker
                              type={RelaisCreneauType.Retrait}
                              selectedId={retraitCreneau}
                              onSelect={setRetraitCreneau}
                            />
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={!retraitCreneau}
                              onClick={() => {
                                if (retraitCreneau) {
                                  onReserverRetrait?.(relais.id, retraitCreneau);
                                  setRetraitCreneau(null);
                                  setExpandedRetrait(null);
                                }
                              }}
                            >
                              {t('relais.confirmBooking')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {isAdmin && relais.statutRetrait !== LocalRelaisRetraitStatus.Recupere && (
                      <div className="px-3 pb-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full text-xs"
                          onClick={() => onAvancerStatut?.(relais.id)}
                        >
                          {t('relais.advanceStatus')} →
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-chartrons-gold/10 pt-4">
          <h4 className="text-sm font-semibold text-chartrons-green-dark mb-3 text-center">
            {t('relais.qrGenerator')}
          </h4>
          {selectedQr ? (
            <div className="flex flex-col items-center gap-3">
              <QrCodeDisplay value={selectedQr} label={selectedQr} size={160} />
              <p className="text-xs text-chartrons-warm-gray text-center">{t('relais.qrHint')}</p>
            </div>
          ) : (
            <p className="text-sm text-chartrons-warm-gray text-center">{t('relais.selectDepot')}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
