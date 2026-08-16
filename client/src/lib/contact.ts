import { writeLocalStorage } from './storage';

export const ADMIN_CONTACT_EMAIL = 'asso@idea-chartrons.fr';

export const CONTACT_STORAGE_KEY = 'idea-chartrons-contact-messages';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  context: string;
  createdAt: string;
}

export function loadContactMessages(): ContactMessage[] {
  try {
    const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ContactMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveContactMessage(
  data: Omit<ContactMessage, 'id' | 'createdAt'>,
): ContactMessage {
  const message: ContactMessage = {
    ...data,
    id: `msg-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [message, ...loadContactMessages()].slice(0, 50);
  writeLocalStorage(CONTACT_STORAGE_KEY, JSON.stringify(next));
  return message;
}
