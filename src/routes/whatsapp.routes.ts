import { Router } from 'express';
import { getQrJson, getQrPage } from '../controllers/whatsapp.controller';

const router = Router();

// JSON API — returns { status, connected, qrDataUrl }
router.get('/qr', getQrJson);

// Browser page — shows the styled QR code UI
router.get('/qr-page', getQrPage);

export default router;
