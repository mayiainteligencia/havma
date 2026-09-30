import express from 'express';
import { enviarMensaje } from '../controllers/chatController.js';

const router = express.Router();

// POST /api/chat/message
router.post('/message', enviarMensaje);

export default router;
