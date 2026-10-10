import { describe, it, expect } from 'vitest';
import { parsearComando, validarPlan, generarPlanes } from './planesIA';
import type { Ejercicio } from '../data/types';

describe('planesIA', () => {
  const mockEjercicio: Partial<Ejercicio> = {
    exercise: { presupuesto: 100 } as any,
    totales: { inversion: 100 } as any,
    touchpoints: [{ nombre: 'TV', inversion: 100, share_inversion: 1, grps: 100, impactos_miles: 100, alcance: 50 }] as any,
    escenarios: [
      { factor_presupuesto: 1, presupuesto_total: 100, por_touchpoint: [{ touchpoint: 'TV', inversion: 100, grps: 100, impactos_miles: 100, alcance: 50 }], totales: { grps: 100, impactos_miles: 100, alcance: 50 } },
      { factor_presupuesto: 1.2, presupuesto_total: 120, por_touchpoint: [{ touchpoint: 'TV', inversion: 120, grps: 120, impactos_miles: 120, alcance: 60 }], totales: { grps: 120, impactos_miles: 120, alcance: 60 } }
    ]
  };

  it('parsearComando identifies basic terms', () => {
    const term = parsearComando('aumentar tv', mockEjercicio as Ejercicio);
    expect(term).not.toBeNull();
    if (term) {
      expect(term.descripcion).toContain('Sube TV');
      expect(term.asignaciones.find(a => a.touchpoint === 'TV')!.inversion).toBe(110); // 100 * 1.1 default 10%
    }
  });

  it('validarPlan returns no errors for valid plan', () => {
    const asignaciones = [{ touchpoint: 'TV', inversion: 100 }];
    const valid = validarPlan(mockEjercicio as Ejercicio, asignaciones);
    expect(valid.ok).toBe(true);
    expect(valid.avisos).toEqual([]);
  });

  it('generarPlanes outputs suggestions', () => {
    const planes = generarPlanes(mockEjercicio as Ejercicio, 'aumentar', 'TV', 20);
    expect(planes.length).toBeGreaterThan(0);
  });
});
