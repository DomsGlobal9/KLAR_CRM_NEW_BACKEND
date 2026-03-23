import { Request, Response } from 'express';
import whatsappService from '../services/whatsapp.service';

export const getQrJson = async (_req: Request, res: Response) => {
  const status = whatsappService.getConnectionStatus();
  const qrDataUrl = await whatsappService.getQrDataUrl();

  res.json({
    status,
    connected: status === 'ready',
    qrDataUrl: qrDataUrl ?? null
  });
};

export const getQrPage = async (_req: Request, res: Response) => {
  const status = whatsappService.getConnectionStatus();
  const qrDataUrl = await whatsappService.getQrDataUrl();

  const brandColor = '#aa4545';
  const brandColorLight = '#c99494';

  const statusMessages: Record<string, { icon: string; title: string; subtitle: string; color: string }> = {
    initializing: {
      icon: '⚙️',
      title: 'Starting up…',
      subtitle: 'WhatsApp is initializing. Please wait a moment.',
      color: '#64748b'
    },
    waiting_qr: {
      icon: '📱',
      title: 'Scan to Connect',
      subtitle: 'Open WhatsApp on your phone → Menu → Linked devices → Link a device',
      color: brandColor
    },
    ready: {
      icon: '✅',
      title: 'WhatsApp Connected',
      subtitle: 'Your WhatsApp account is linked and ready to send messages.',
      color: '#10b981'
    },
    disconnected: {
      icon: '❌',
      title: 'Disconnected',
      subtitle: 'WhatsApp was disconnected. Reload this page to get a fresh QR code.',
      color: '#ef4444'
    }
  };

  const info = statusMessages[status] ?? statusMessages['initializing'];

  const qrBlock = qrDataUrl
    ? `<div class="qr-wrapper">
               <img src="${qrDataUrl}" alt="WhatsApp QR Code" id="qr-img" />
           </div>`
    : status === 'ready'
      ? `<div class="connected-icon">✅</div>`
      : `<div class="spinner"></div><p class="scan-hint">Waiting for QR code…</p>`;

  const shouldAutoRefresh = status === 'waiting_qr' || status === 'initializing';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Klar CRM — WhatsApp Setup</title>
  ${shouldAutoRefresh ? '<meta http-equiv="refresh" content="4" />' : ''}
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #334155;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 440px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 32px;
    }

    .logo-icon {
      width: 42px;
      height: 42px;
      background: ${brandColor};
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }

    .logo-text {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
    }

    .status-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 32px;
      padding: 0 10px;
    }

    .qr-wrapper {
      background: #fff;
      border-radius: 16px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      display: inline-block;
      margin-bottom: 20px;
    }

    .qr-wrapper img {
      display: block;
      border-radius: 8px;
    }

    .scan-hint {
      font-size: 13px;
      color: #64748b;
      margin-top: 12px;
    }

    .connected-icon {
      font-size: 80px;
      margin: 16px 0;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #16a34a;
      font-size: 13px;
      font-weight: 500;
      padding: 6px 16px;
      border-radius: 999px;
      margin-top: 16px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #16a34a;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    .spinner {
      width: 56px;
      height: 56px;
      border: 4px solid #f1f5f9;
      border-top-color: ${brandColor};
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .refresh-btn {
      display: inline-block;
      margin-top: 24px;
      padding: 10px 24px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }

    .refresh-btn:hover { 
      background: #f1f5f9; 
    }

    .footer {
      margin-top: 32px;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">K</div>
      <span class="logo-text">Klar CRM</span>
    </div>

    <div class="status-icon">${info.icon}</div>
    <h1>${info.title}</h1>
    <p class="subtitle">${info.subtitle}</p>

    ${qrBlock}

    ${status === 'ready'
      ? `<div class="status-badge"><div class="status-dot"></div>WhatsApp is active</div>`
      : `<br><a href="" class="refresh-btn">🔄 Refresh Page</a>`
    }

    <p class="footer">
      ${shouldAutoRefresh ? 'Refreshes automatically every 4 seconds.' : ''}
      &nbsp;
    </p>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
