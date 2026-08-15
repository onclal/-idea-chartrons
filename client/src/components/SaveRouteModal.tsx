import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal } from './ui';

interface SaveRouteModalProps {
  open: boolean;
  onClose: () => void;
  defaultName: string;
  isUpdate: boolean;
  onConfirm: (name: string) => void;
}

export function SaveRouteModal({ open, onClose, defaultName, isUpdate, onConfirm }: SaveRouteModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);

  return (
    <Modal open={open} onClose={onClose} title={isUpdate ? t('routes.updateTitle') : t('routes.saveTitle')}>
      <div className="space-y-4">
        <p className="text-sm text-chartrons-warm-gray">{t('routes.saveHint')}</p>
        <Input
          label={t('routes.nameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
        />
        <Button
          type="button"
          variant="bordeaux"
          className="w-full"
          onClick={() => {
            onConfirm(name.trim() || defaultName);
            onClose();
          }}
        >
          {isUpdate ? t('routes.update') : t('routes.save')}
        </Button>
      </div>
    </Modal>
  );
}
