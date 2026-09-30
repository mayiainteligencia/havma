import { generarRespuestaIA } from '../services/geminiService.js';

export async function enviarMensaje(req, res) {
  try {
    const { mensaje, departamento } = req.body;
    console.log('BODY RECIBIDO:', req.body);
    if (!mensaje) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }

    console.log(`💬 Mensaje recibido: "${mensaje}"`);
    console.log(`📂 Departamento: ${departamento || 'general'}`);

    const respuesta = await generarRespuestaIA(mensaje, null, departamento);

    res.json({
      success: true,
      respuesta: respuesta,
      contexto: 'Respuesta general',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Error en chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el mensaje',
      details: error.message
    });
  }
}
