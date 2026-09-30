import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initGeminiClient } from './config/gemini.js';
import chatRoutes from './routes/chatRoutes.js';
// El monitoreo de radio corre aparte, como servicio Python (monitorsol, uvicorn :8001).

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'DELETE'],  // ← agregamos DELETE
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend del asistente en linea' });
});

async function startServer() {
  try {
    console.log('Iniciando servidor...\n');

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    initGeminiClient();

    app.listen(PORT, () => {
      console.log(`\nServidor corriendo en http://localhost:${PORT}`);
      console.log(`API disponible en http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
}

startServer();