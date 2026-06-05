import { describe, expect, it } from 'vitest';
import { getAggregatedData } from './api';

describe('architecture', () => {
  it('keeps the SPA integrated only with the BFF', () => {
    const apiSource = String(getAggregatedData);

    expect(apiSource).toMatch(/aggregated-data/);
    expect(apiSource).not.toMatch(/localhost:3001|localhost:3002|localhost:7071/);
    expect(apiSource).not.toMatch(/ORDERS_SERVICE_URL|ROUTES_SERVICE_URL|CALCULATION_FUNCTION_URL/);
  });
});
