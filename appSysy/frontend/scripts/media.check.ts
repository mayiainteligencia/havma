// Auto-chequeo de la capa de datos de medios.
// Correr: node --experimental-strip-types src/data/media.check.ts
import assert from 'node:assert/strict';
import { porPeriodo, PERIODOS, ULTIMO, MARCAS, PLAZAS, proyeccionSOV } from '../src/data/media.ts';

for (const periodo of PERIODOS) {
  const D = porPeriodo[periodo];
  assert.equal(D.totalPlazas, 32, `${periodo}: deben ser 32 plazas`);

  for (const p of D.plazas) {
    const suma = MARCAS.reduce((s, m) => s + p.sovPorMarca[m.id], 0);
    assert.equal(suma, 100, `${periodo} · ${p.nombre}: el SOV suma ${suma}, no 100`);
    assert.ok(p.sovPorMarca[MARCAS[0].id] > 0, `${periodo} · ${p.nombre}: SOV del cliente no positivo`);
    assert.ok(p.alcancePct > 0 && p.alcancePct <= 92, `${periodo} · ${p.nombre}: alcance fuera de rango`);
  }

  // Inversión y GRPs correlacionan: la plaza más cara también tiene más GRPs.
  const porInversion = [...D.plazas].sort((a, b) => b.inversionMXN - a.inversionMXN);
  const porGrps = [...D.plazas].sort((a, b) => b.grps - a.grps);
  assert.equal(porInversion[0].id, porGrps[0].id, `${periodo}: inversión y GRPs no correlacionan`);

  assert.equal(
    D.plazasLideradas + MARCAS.slice(1).reduce((s, m) => s + D.lideradas[m.id], 0),
    32,
    `${periodo}: las plazas lideradas no suman 32`,
  );
}

// La inversión crece periodo a periodo.
const inversiones = PERIODOS.map(p => porPeriodo[p].inversionTotal);
assert.deepEqual(inversiones, [...inversiones].sort((a, b) => a - b), 'la inversión debe crecer con el tiempo');

assert.ok(proyeccionSOV() > porPeriodo[ULTIMO].sovCliente, 'la proyección debe seguir la tendencia al alza');
assert.equal(PLAZAS.length, 32);

console.log('media.ts OK ·',
  `${PERIODOS.length} periodos · SOV cliente ${porPeriodo[ULTIMO].sovCliente}%`,
  `· ${porPeriodo[ULTIMO].plazasLideradas}/32 plazas lideradas`,
  `· proyección ${proyeccionSOV()}%`);
