import { describe, it, expect } from 'vitest';
import { interpolarEscenario, touchpointQueMasPierdeAlcance } from './interpolate';
import type { Escenario } from '../data/types';

const escenariosMock: Escenario[] = [
  { factor_presupuesto: 0.8, presupuesto_total: 80, por_touchpoint: [{ touchpoint: 'A', inversion: 80, grps: 80, impactos_miles: 80, alcance: 40 }], totales: { grps: 80, impactos_miles: 80, alcance: 40 } },
  { factor_presupuesto: 1.0, presupuesto_total: 100, por_touchpoint: [{ touchpoint: 'A', inversion: 100, grps: 100, impactos_miles: 100, alcance: 50 }], totales: { grps: 100, impactos_miles: 100, alcance: 50 } },
  { factor_presupuesto: 1.2, presupuesto_total: 120, por_touchpoint: [{ touchpoint: 'A', inversion: 120, grps: 120, impactos_miles: 120, alcance: 60 }], totales: { grps: 120, impactos_miles: 120, alcance: 60 } }
];

describe('interpolate', () => {
  it('interpolates correctly for exact factor', () => {
    const res = interpolarEscenario(escenariosMock, 1.0);
    expect(res.presupuesto_total).toBe(100);
    expect(res.totales.alcance).toBe(50);
  });

  it('interpolates correctly between factors', () => {
    const res = interpolarEscenario(escenariosMock, 0.9);
    expect(res.presupuesto_total).toBe(90);
    expect(res.totales.alcance).toBe(45);
  });

  it('touchpointQueMasPierdeAlcance identifies correctly', () => {
    const base = { factor_presupuesto: 1.0, presupuesto_total: 100, por_touchpoint: [{ touchpoint: 'A', inversion: 100, grps: 100, impactos_miles: 100, alcance: 50 }], totales: { grps: 100, impactos_miles: 100, alcance: 50 } };
    const nuevo = { factor_presupuesto: 0.8, presupuesto_total: 80, por_touchpoint: [{ touchpoint: 'A', inversion: 80, grps: 80, impactos_miles: 80, alcance: 30 }], totales: { grps: 80, impactos_miles: 80, alcance: 30 } };
    const res = touchpointQueMasPierdeAlcance(base, nuevo);
    expect(res?.touchpoint).toBe('A');
    expect(res?.delta).toBe(-20);
  });
});
