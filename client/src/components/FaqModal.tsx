import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Modal } from './ui';
import { FaqComparisonTable } from './FaqComparisonTable';

interface FaqModalProps {
  open: boolean;
  onClose: () => void;
}

export function FaqModal({ open, onClose }: FaqModalProps) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={t('faq.comparisonTitle')} size="lg">
      <div className="space-y-4">
        <FaqComparisonTable />
        <Link
          to="/faq"
          onClick={onClose}
          className="inline-flex items-center justify-center w-full min-h-[44px] rounded-xl bg-chartrons-green text-white text-sm font-semibold"
        >
          {t('faq.openFull')}
        </Link>
      </div>
    </Modal>
  );
}
