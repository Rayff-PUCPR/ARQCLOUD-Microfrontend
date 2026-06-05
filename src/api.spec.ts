import { describe, expect, it } from 'vitest';
import type { AggregatedData } from './api';

describe('AggregatedData contract', () => {
  it('supports route map stops for Google Maps rendering', () => {
    const route: AggregatedData['routes'][number] = {
      id: 'route-1',
      region: 'Centro',
      origin: 'Base',
      destination: 'Centro',
      status: 'AVAILABLE',
      stops: 1,
      completedStops: 0,
      estimatedDistanceKm: 1,
      estimatedDurationMinutes: 10,
      score: 90,
      mapStops: [
        {
          orderId: 'order-1',
          customerName: 'Cliente',
          address: 'Rua',
          sequence: 1,
          status: 'PENDING',
          latitude: -25,
          longitude: -49
        }
      ]
    };

    expect(route.mapStops[0].sequence).toBe(1);
  });
});
