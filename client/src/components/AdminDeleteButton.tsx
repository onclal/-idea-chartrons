import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';
import { useAdmin } from '../context/AdminContext';

interface AdminDeleteButtonProps {
  label: string;
  confirmMessage: string;
  onDelete: () => Promise<void>;
  className?: string;
}

export function AdminDeleteButton({
  label,
  confirmMessage,
  onDelete,
  className = '',
}: AdminDeleteButtonProps) {
  const { t } = useTranslation();
  const { isAdminMode } = useAdmin();
  const [loading, setLoading] = useState(false);

  if (!isAdminMode) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={loading}
      onClick={handleClick}
      className={`w-full border-chartrons-brick/30 text-chartrons-brick hover:bg-chartrons-brick/5 ${className}`}
    >
      {loading ? t('common.loading') : `🗑 ${label}`}
    </Button>
  );
}
