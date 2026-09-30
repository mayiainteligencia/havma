// Auto-chequeo del asistente: que conozca la plataforma y navegue bien.
// Los imports de la app son sin extensión (los resuelve Vite), así que se empaqueta antes:
//   npx esbuild scripts/asistente.check.ts --bundle --platform=node --format=esm --outfile=/tmp/ck.mjs && node /tmp/ck.mjs
import assert from 'node:assert/strict';
import { responder, SECCIONES } from '../src/data/asistente.ts';
import { MODULOS_CEREBRO } from '../src/data/plataforma.ts';

const r = (q: string) => responder(q);

// Navegación
assert.equal(r('ve a alertas').navigateTo, 'alertas');
assert.equal(r('llévame a testigos').navigateTo, 'testigos');
assert.equal(r('muéstrame el journey').navigateTo, 'journey');
assert.equal(r('abre studio creativo').navigateTo, 'studio');

// Conoce el mapa: menciona todas las secciones al preguntarle por ellas
const mapa = r('¿qué secciones hay?').text;
for (const s of SECCIONES) {
  assert.ok(mapa.includes(s.titulo), `el mapa no menciona ${s.titulo}`);
}
assert.equal(r('¿qué secciones hay?').navigateTo, undefined, 'listar no debe navegar');

// Explica una sección concreta sin navegar
const journey = r('¿qué es journey intelligence?');
assert.ok(/etapa/i.test(journey.text), 'no explica Journey Intelligence');
assert.equal(journey.navigateTo, undefined);

// Conoce los módulos del Cerebro Orquestador
const ops = r('¿cuáles son los operadores?').text;
for (const m of MODULOS_CEREBRO.filter(m => m.tag === 'Operador')) {
  assert.ok(ops.includes(m.titulo), `faltó ${m.titulo}`);
}
assert.ok(r('háblame del modelo de elasticidad de precio').text.includes('Elasticidad'));
assert.ok(/Testigos/.test(r('¿qué está conectado en vivo?').text), 'no identifica lo que corre en vivo');

// Datos de la cuenta
assert.ok(/plazas/i.test(r('¿cómo vamos en plazas?').text));
assert.ok(/\$/.test(r('¿cuánto invertimos?').text));
assert.ok(/cartera|cuentas/i.test(r('¿qué clientes tenemos?').text));
assert.ok(/alertas/i.test(r('¿qué alertas hay?').text));

// Fallback útil
assert.ok(r('kdjfhg').text.length > 40, 'el fallback debe orientar');

console.log('asistente OK ·',
  `${SECCIONES.length} secciones · ${MODULOS_CEREBRO.length} módulos · navegación y explicaciones verificadas`);
