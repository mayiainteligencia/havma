import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

let genAI;
let model;

export function initGeminiClient() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Usar gemini-2.5-flash que SÍ está en tu lista de modelos disponibles
    model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
    });

    console.log('Cliente de Google Gemini inicializado (gemini-2.5-flash)');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando Gemini:', error.message);
    throw error;
  }
}

export function getModel() {
  if (!model) {
    throw new Error('Gemini client no ha sido inicializado');
  }
  return model;
}

export default {
  initGeminiClient,
  getModel
};
