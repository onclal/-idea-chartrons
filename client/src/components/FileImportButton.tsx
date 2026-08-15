import { useRef } from 'react';
import { Button } from './ui';

interface FileImportButtonProps {
  accept: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost' | 'bordeaux';
  onText: (content: string, filename: string) => void | Promise<void>;
}

export function FileImportButton({ accept, label, variant = 'secondary', onText }: FileImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          const content = await file.text();
          await onText(content, file.name);
        }}
      />
      <Button type="button" size="sm" variant={variant} className="flex-1" onClick={() => inputRef.current?.click()}>
        {label}
      </Button>
    </>
  );
}
