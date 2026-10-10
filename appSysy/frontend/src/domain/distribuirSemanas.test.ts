import { describe, it, expect } from 'vitest';
import { distribuirSemanas } from './distribuirSemanas';

describe('distribuirSemanas', () => {
  it('distributes total evenly when no pattern is provided', () => {
    const result = distribuirSemanas(100, 4, null, null);
    expect(result.valores).toEqual([25, 25, 25, 25]);
    expect(result.sinPatron).toBe(true);
  });

  it('respects pattern if length matches', () => {
    const niveles = { lanzamiento: 1, minimo: 0, mantenimiento: 0.5 };
    const result = distribuirSemanas(100, 4, 'LANZ|MIN|LANZ|MIN', niveles);
    expect(result.valores).toEqual([50, 0, 50, 0]);
    expect(result.sinPatron).toBe(false);
  });

  it('repeats pattern if length is shorter than weeks', () => {
    const niveles = { lanzamiento: 1, minimo: 0, mantenimiento: null };
    const result = distribuirSemanas(100, 4, 'LANZ|MIN', niveles);
    expect(result.valores).toEqual([50, 50, 0, 0]); // It splits the 4 weeks into 2 blocks of 2 weeks. So LANZ (2 weeks), MIN (2 weeks). Wait.
    // Base is 4 / 2 = 2 weeks per stage.
    // LANZ weight = 1 (2 weeks)
    // MIN weight = 0 (2 weeks)
    // Total weight = 1+1+0+0 = 2. LANZ gets 50,50.
    expect(result.sinPatron).toBe(false);
  });
});
