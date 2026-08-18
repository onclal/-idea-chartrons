import { useTranslation } from 'react-i18next';
import { Input } from '../ui';
import type { ChangeEvent } from 'react';
import { isRetiredStockImage } from '@idea-chartrons/shared';
import { resolveMediaUrl } from '../../lib/media';

interface AdminPhotoFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

export function AdminPhotoField({ label, value, onChange }: AdminPhotoFieldProps) {
  const { t } = useTranslation();

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const preview = resolveMediaUrl(value);
  const urlValue = !value || value.startsWith('data:') || isRetiredStockImage(value) ? '' : value;

  return (
    <div className="space-y-2">
      <Input
        label={label}
        value={urlValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
      />
      <label className="flex flex-col items-center justify-center w-full min-h-[7.5rem] rounded-xl border-2 border-dashed border-chartrons-beige bg-white cursor-pointer hover:border-chartrons-bordeaux/40 transition-colors overflow-hidden">
        {preview ? (
          <img src={preview} alt="" className="w-full h-36 object-cover" />
        ) : (
          <div className="text-center p-4">
            <span className="text-2xl block mb-1" aria-hidden>
              📷
            </span>
            <span className="text-xs text-chartrons-warm-gray">{t('adminSpace.photoHint')}</span>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </label>
    </div>
  );
}
