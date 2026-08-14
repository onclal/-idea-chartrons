import { QRCodeSVG } from 'qrcode.react';

interface QrCodeDisplayProps {
  value: string;
  label?: string;
  size?: number;
}

export function QrCodeDisplay({ value, label, size = 128 }: QrCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-3 bg-white rounded-2xl border border-chartrons-gold/20 shadow-sm">
        <QRCodeSVG
          value={value}
          size={size}
          bgColor="#FFFFFF"
          fgColor="#2E5B44"
          level="M"
        />
      </div>
      {label && (
        <p className="text-[10px] font-mono text-chartrons-warm-gray text-center break-all max-w-[160px]">
          {label}
        </p>
      )}
    </div>
  );
}
