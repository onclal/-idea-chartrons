import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { QRCodeCanvas } from 'qrcode.react';
import { appUrl } from './share';
import { merchantProfilePath } from './merchantProfile';

export const QR_FG = '#1F4D3A';
export const QR_BG = '#FFFFFF';
export const FLYER_CREAM = '#F5F0E8';
export const FLYER_BRASS = '#C4A35A';
export const FLYER_OLIVE = '#3D4A32';

/** A6 at 300 dpi — print-ready PNG. */
export const A6_WIDTH_PX = 1240;
export const A6_HEIGHT_PX = 1748;
export const QR_EXPORT_SIZE = 720;

export type QrDestination = 'shop' | 'pepites' | 'events' | 'concierge';
export type QrCtaTemplate = 'pepites' | 'concierge' | 'agenda';

export const QR_DESTINATIONS: QrDestination[] = ['shop', 'pepites', 'events', 'concierge'];
export const QR_CTA_TEMPLATES: QrCtaTemplate[] = ['pepites', 'concierge', 'agenda'];

export const QR_DESTINATION_PATH: Record<Exclude<QrDestination, 'shop'>, string> = {
  pepites: '/brocanteurs',
  events: '/events',
  concierge: '/conciergerie',
};

export function defaultCtaForDestination(destination: QrDestination): QrCtaTemplate {
  if (destination === 'concierge') return 'concierge';
  if (destination === 'events') return 'agenda';
  return 'pepites';
}

export function qrTargetPath(destination: QrDestination, shopId?: string): string {
  if (destination === 'shop' && shopId) return merchantProfilePath(shopId);
  if (destination === 'shop') return '/acteurs';
  return QR_DESTINATION_PATH[destination];
}

export function qrTargetUrl(destination: QrDestination, shopId?: string): string {
  return appUrl(qrTargetPath(destination, shopId));
}

export function slugFilename(value: string, fallback = 'vitrine'): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return slug || fallback;
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function waitFrames(count = 2): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(left - 1));
    };
    step(count);
  });
}

/** High-resolution QR PNG via a hidden canvas (error correction H). */
export async function renderQrPngDataUrl(value: string, size = QR_EXPORT_SIZE): Promise<string> {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;overflow:hidden';
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    root.render(
      createElement(QRCodeCanvas, {
        value,
        size,
        level: 'H',
        includeMargin: true,
        bgColor: QR_BG,
        fgColor: QR_FG,
      }),
    );
    await waitFrames(3);
    const canvas = host.querySelector('canvas');
    if (!canvas) throw new Error('QR canvas missing');
    return canvas.toDataURL('image/png');
  } finally {
    root.unmount();
    host.remove();
  }
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('QR image failed'));
    image.src = src;
  });
}

export interface QrFlyerPayload {
  qrValue: string;
  kicker: string;
  shopName: string;
  cta: string;
  footer: string;
  filename?: string;
}

/** Compose a print-ready A6 PNG of the framed flyer. */
export async function downloadQrFlyerPng(payload: QrFlyerPayload): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Canvas falls back to system fonts.
    }
  }

  const qrUrl = await renderQrPngDataUrl(payload.qrValue);
  const qrImage = await loadImage(qrUrl);
  const canvas = document.createElement('canvas');
  canvas.width = A6_WIDTH_PX;
  canvas.height = A6_HEIGHT_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  ctx.fillStyle = FLYER_CREAM;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const inset = 48;
  ctx.strokeStyle = QR_FG;
  ctx.lineWidth = 18;
  ctx.strokeRect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);

  ctx.strokeStyle = FLYER_BRASS;
  ctx.lineWidth = 4;
  ctx.strokeRect(inset + 22, inset + 22, canvas.width - (inset + 22) * 2, canvas.height - (inset + 22) * 2);

  const contentLeft = inset + 64;
  const contentWidth = canvas.width - contentLeft * 2;
  let y = inset + 120;

  ctx.fillStyle = FLYER_BRASS;
  ctx.font = '700 32px "DM Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(payload.kicker.toUpperCase(), canvas.width / 2, y);

  y += 90;
  ctx.fillStyle = QR_FG;
  ctx.font = '700 72px "Playfair Display", Georgia, serif';
  const nameLines = wrapCanvasText(ctx, payload.shopName, contentWidth);
  for (const line of nameLines.slice(0, 3)) {
    ctx.fillText(line, canvas.width / 2, y);
    y += 84;
  }

  y += 24;
  ctx.fillStyle = FLYER_OLIVE;
  ctx.font = '600 44px "DM Sans", system-ui, sans-serif';
  const ctaLines = wrapCanvasText(ctx, payload.cta, contentWidth);
  for (const line of ctaLines.slice(0, 4)) {
    ctx.fillText(line, canvas.width / 2, y);
    y += 58;
  }

  const qrSize = 640;
  const qrX = (canvas.width - qrSize) / 2;
  const qrY = Math.min(y + 48, canvas.height - qrSize - 220);
  ctx.fillStyle = QR_BG;
  ctx.fillRect(qrX - 18, qrY - 18, qrSize + 36, qrSize + 36);
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = FLYER_OLIVE;
  ctx.font = '500 22px "DM Sans", system-ui, sans-serif';
  const urlLines = wrapCanvasText(ctx, payload.qrValue.replace(/^https?:\/\//, ''), contentWidth);
  let urlY = qrY + qrSize + 56;
  for (const line of urlLines.slice(0, 2)) {
    ctx.fillText(line, canvas.width / 2, urlY);
    urlY += 30;
  }

  ctx.fillStyle = FLYER_BRASS;
  ctx.font = '700 26px "DM Sans", system-ui, sans-serif';
  ctx.fillText(payload.footer, canvas.width / 2, canvas.height - inset - 48);

  const name = payload.filename ?? `idea-chartrons-${slugFilename(payload.shopName)}-a6.png`;
  downloadDataUrl(canvas.toDataURL('image/png'), name);
}

export async function downloadQrOnlyPng(value: string, filename: string): Promise<void> {
  const dataUrl = await renderQrPngDataUrl(value);
  downloadDataUrl(dataUrl, filename);
}
