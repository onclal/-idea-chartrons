import { useEffect, useRef } from 'react';

interface OtpPinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  labelledBy?: string;
}

export function OtpPinInput({ value, onChange, length = 4, labelledBy }: OtpPinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.replace(/\D/g, '').slice(0, length).split('');

  useEffect(() => {
    refs.current = refs.current.slice(0, length);
  }, [length]);

  const setDigit = (index: number, char: string) => {
    const next = Array.from({ length }, (_, i) => digits[i] ?? '');
    next[index] = char.replace(/\D/g, '').slice(-1);
    onChange(next.join(''));
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-2" role="group" aria-labelledby={labelledBy}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digits[index] ?? ''}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !digits[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            if (pasted) onChange(pasted);
          }}
          className="w-12 h-14 rounded-xl border border-chartrons-beige bg-white text-center text-xl font-bold text-chartrons-olive-dark focus:outline-none focus:ring-2 focus:ring-chartrons-green/30"
          aria-label={`${index + 1} / ${length}`}
        />
      ))}
    </div>
  );
}
