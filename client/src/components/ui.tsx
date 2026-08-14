import { ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-card border border-chartrons-beige/80 p-4 ${
        onClick
          ? 'cursor-pointer hover:shadow-card-hover transition-all duration-200 active:scale-[0.98]'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export type BadgeVariant =
  | 'olive'
  | 'bordeaux'
  | 'brick'
  | 'brass'
  | 'stone'
  | 'vip'
  | 'benevol'
  | 'local'
  | 'brocante'
  | 'green'
  | 'gold'
  | 'gray';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: string;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  olive: 'bg-chartrons-olive/12 text-chartrons-olive-dark ring-1 ring-chartrons-olive/20',
  bordeaux: 'bg-chartrons-bordeaux/10 text-chartrons-bordeaux ring-1 ring-chartrons-bordeaux/20',
  brick: 'bg-chartrons-brick/12 text-chartrons-brick ring-1 ring-chartrons-brick/25',
  brass: 'bg-chartrons-brass/15 text-chartrons-olive-dark ring-1 ring-chartrons-brass/30',
  stone: 'bg-chartrons-beige text-chartrons-warm-gray ring-1 ring-chartrons-sand/50',
  vip: 'bg-gradient-to-r from-chartrons-brass/25 to-chartrons-brick/15 text-chartrons-bordeaux ring-1 ring-chartrons-brass/40 font-semibold',
  benevol: 'bg-chartrons-bordeaux/10 text-chartrons-bordeaux ring-1 ring-chartrons-bordeaux/25',
  local: 'bg-chartrons-olive/15 text-chartrons-olive-dark ring-1 ring-chartrons-olive/30 font-semibold',
  brocante: 'bg-chartrons-brick/12 text-chartrons-brick ring-1 ring-chartrons-brick/30 font-semibold',
  green: 'bg-chartrons-green/12 text-chartrons-green ring-1 ring-chartrons-green/20',
  gold: 'bg-chartrons-brass/15 text-chartrons-olive-dark ring-1 ring-chartrons-brass/30',
  gray: 'bg-chartrons-beige text-chartrons-warm-gray ring-1 ring-chartrons-sand/40',
};

export function Badge({ children, variant = 'olive', icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium leading-none ${badgeStyles[variant]} ${className}`}
    >
      {icon && <span aria-hidden className="text-[10px]">{icon}</span>}
      {children}
    </span>
  );
}

interface LoadingProps {
  message?: string;
}

export function Loading({ message }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-3 border-chartrons-beige rounded-full" />
        <div className="absolute inset-0 border-3 border-chartrons-bordeaux/20 border-t-chartrons-bordeaux rounded-full animate-spin" />
      </div>
      {message && <p className="text-sm text-chartrons-warm-gray">{message}</p>}
    </div>
  );
}

interface EmptyStateProps {
  icon?: string;
  title?: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = '🏘️', title, message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6 animate-fade-in">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-chartrons-beige/60 mb-4 shadow-card">
        <span className="text-4xl" aria-hidden>{icon}</span>
      </div>
      {title && (
        <h3 className="text-lg font-bold text-chartrons-bordeaux mb-2">{title}</h3>
      )}
      <p className="text-sm text-chartrons-warm-gray leading-relaxed max-w-xs mx-auto">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 touch-target inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-chartrons-bordeaux text-white text-sm font-medium hover:bg-chartrons-bordeaux-light transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost' | 'bordeaux';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-chartrons-green text-white hover:bg-chartrons-green-light shadow-sm',
    bordeaux: 'bg-chartrons-bordeaux text-white hover:bg-chartrons-bordeaux-light shadow-sm',
    secondary: 'bg-white text-chartrons-olive-dark border border-chartrons-beige hover:bg-chartrons-stone shadow-sm',
    gold: 'bg-chartrons-brass text-chartrons-olive-dark hover:bg-chartrons-brass/90 shadow-sm',
    ghost: 'bg-transparent text-chartrons-olive hover:bg-chartrons-olive/5',
  };
  const sizes = {
    sm: 'px-3 py-2 text-xs min-h-[36px]',
    md: 'px-4 py-3 text-sm min-h-[44px]',
    lg: 'px-5 py-3.5 text-base min-h-[48px]',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-chartrons-warm-gray uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-xl border border-chartrons-beige bg-white text-base text-chartrons-olive-dark placeholder:text-chartrons-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-chartrons-bordeaux/25 focus:border-chartrons-bordeaux/30 min-h-[48px] ${className}`}
        {...props}
      />
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-chartrons-warm-gray uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`w-full px-4 py-3 rounded-xl border border-chartrons-beige bg-white text-base text-chartrons-olive-dark placeholder:text-chartrons-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-chartrons-bordeaux/25 focus:border-chartrons-bordeaux/30 resize-none min-h-[96px] ${className}`}
        {...props}
      />
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-chartrons-olive-dark/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-chartrons-stone rounded-t-3xl sm:rounded-3xl shadow-card-hover mx-auto animate-slide-down">
        <div className="sticky top-0 bg-chartrons-stone/95 backdrop-blur-md px-5 py-4 border-b border-chartrons-beige flex items-center justify-between">
          <h3 className="text-lg font-bold text-chartrons-bordeaux">{title}</h3>
          <button
            onClick={onClose}
            className="touch-target w-10 h-10 rounded-full bg-chartrons-beige flex items-center justify-center text-chartrons-warm-gray hover:bg-chartrons-sand transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-5 pb-8">{children}</div>
      </div>
    </div>
  );
}
