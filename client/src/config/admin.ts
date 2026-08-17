/**
 * Accès administrateur.
 *
 * Le mode invité intégral ne connaît aucun compte : la seule identité de la plateforme
 * est ce code d'accès, fourni au build par `VITE_ADMIN_PASSCODE` (voir `.env.example`).
 * La valeur de repli ne sert qu'à la démonstration locale.
 */
export const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE?.trim() || 'Chartrons2026';

export const ADMIN_SESSION_KEY = 'idea-chartrons-admin-session';
