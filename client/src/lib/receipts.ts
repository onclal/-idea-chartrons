import { DEMO_DEVICE_ID } from '@idea-chartrons/shared';
import { writeLocalStorage } from './storage';

export const RECEIPTS_STORAGE_KEY = 'idea-chartrons-receipts';

export type ReceiptFulfillment = 'pickup' | 'delivery' | 'in_store' | 'online';
export type ReceiptPaymentStatus = 'paid' | 'pending';
export type ReceiptSource = 'concierge' | 'in_store' | 'anti_gaspi' | 'post';

export interface ReceiptLine {
  name: string;
  quantity?: string;
  price: number;
}

export interface ResidentReceipt {
  id: string;
  orderId: string;
  createdAt: string;
  shopName: string;
  shopId?: string;
  source: ReceiptSource;
  fulfillment: ReceiptFulfillment;
  paymentStatus: ReceiptPaymentStatus;
  total: number;
  lines: ReceiptLine[];
  qrValue: string;
  deliveryAddress?: string;
  walkingMeters?: number;
}

function currentDeviceId(): string {
  try {
    return localStorage.getItem('idea-chartrons-carnet-device')?.trim() || DEMO_DEVICE_ID;
  } catch {
    return DEMO_DEVICE_ID;
  }
}

const MAX_RECEIPTS = 80;

function isReceipt(value: unknown): value is ResidentReceipt {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ResidentReceipt>;
  return (
    typeof item.id === 'string' &&
    typeof item.orderId === 'string' &&
    typeof item.shopName === 'string' &&
    typeof item.total === 'number' &&
    Array.isArray(item.lines)
  );
}

function ticketQr(orderId: string, fulfillment: ReceiptFulfillment, shopId?: string) {
  return `IDEA-CHARTRONS|${orderId}|${fulfillment}|${shopId ?? 'local'}`;
}

function demoReceipts(): ResidentReceipt[] {
  const now = Date.now();
  return [
    {
      id: 'receipt-demo-pickup',
      orderId: 'CMD-CHARTRONS-1842',
      createdAt: new Date(now - 36 * 3600_000).toISOString(),
      shopName: 'Boulangerie Notre-Dame',
      shopId: 'demo-boulangerie',
      source: 'concierge',
      fulfillment: 'pickup',
      paymentStatus: 'paid',
      total: 8.5,
      lines: [
        { name: 'Sandwich du jour', quantity: '1', price: 7.5 },
        { name: 'Frais de service', price: 1 },
      ],
      qrValue: ticketQr('CMD-CHARTRONS-1842', 'pickup', 'demo-boulangerie'),
      walkingMeters: 344,
    },
    {
      id: 'receipt-demo-delivery',
      orderId: 'CMD-CHARTRONS-2091',
      createdAt: new Date(now - 5 * 3600_000).toISOString(),
      shopName: 'Épicerie des Chartrons',
      shopId: 'demo-epicerie',
      source: 'in_store',
      fulfillment: 'delivery',
      paymentStatus: 'paid',
      total: 24.2,
      lines: [
        { name: 'Panier local', quantity: '1', price: 23.2 },
        { name: 'Frais de service', price: 1 },
      ],
      qrValue: ticketQr('CMD-CHARTRONS-2091', 'delivery', 'demo-epicerie'),
      deliveryAddress: '12 rue Notre-Dame, 33000 Bordeaux',
    },
  ];
}

export function loadReceipts(): ResidentReceipt[] {
  try {
    const raw = localStorage.getItem(RECEIPTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(isReceipt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    }
  } catch {
    // private mode
  }

  if (currentDeviceId() === DEMO_DEVICE_ID) {
    const seeded = demoReceipts();
    persistReceipts(seeded);
    return seeded;
  }
  return [];
}

function persistReceipts(receipts: ResidentReceipt[]): void {
  writeLocalStorage(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts.slice(0, MAX_RECEIPTS)));
}

export function saveReceipt(
  input: Omit<ResidentReceipt, 'id' | 'createdAt' | 'qrValue'> & {
    id?: string;
    createdAt?: string;
    qrValue?: string;
  },
): ResidentReceipt {
  const receipt: ResidentReceipt = {
    ...input,
    id: input.id ?? `receipt-${input.orderId}`,
    createdAt: input.createdAt ?? new Date().toISOString(),
    qrValue: input.qrValue || ticketQr(input.orderId, input.fulfillment, input.shopId),
  };
  const next = [receipt, ...loadReceipts().filter((item) => item.id !== receipt.id && item.orderId !== receipt.orderId)];
  persistReceipts(next);
  return receipt;
}

export function clearReceipts(): void {
  try {
    localStorage.removeItem(RECEIPTS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function rememberCheckoutReceipt(
  item: {
    id: string;
    title: string;
    price: number;
    sellerName?: string | null;
    kind?: 'post' | 'booking' | 'membership' | 'anti_gaspi';
  },
  total: number,
  orderId: string,
): void {
  if (item.kind === 'membership') return;
  const source: ReceiptSource =
    item.kind === 'anti_gaspi' ? 'anti_gaspi' : item.kind === 'booking' ? 'in_store' : 'post';
  const fulfillment: ReceiptFulfillment = item.kind === 'post' ? 'online' : 'pickup';
  saveReceipt({
    orderId,
    shopName: item.sellerName?.trim() || item.title,
    shopId: item.id,
    source,
    fulfillment,
    paymentStatus: 'paid',
    total,
    lines: [{ name: item.title, price: item.price }],
  });
}
