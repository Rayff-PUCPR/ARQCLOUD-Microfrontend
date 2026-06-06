const BFF_URL = import.meta.env.VITE_BFF_URL ?? 'http://localhost:3000';

export interface AggregatedData {
  generatedAt: string;
  summary: {
    totalOrders: number;
    pendingOrders: number;
    activeRoutes: number;
    availableDrivers: number;
    averageRouteScore: number;
  };
  orders: Array<{
    id: string;
    customerName: string;
    status: string;
    priority: string;
    district: string;
    routeId?: string;
  }>;
  routes: Array<{
    id: string;
    region: string;
    origin: string;
    destination: string;
    status: string;
    driverId?: string;
    stops: number;
    completedStops: number;
    estimatedDistanceKm: number;
    estimatedDurationMinutes: number;
    score: number;
    mapStops: Array<{
      orderId: string;
      customerName: string;
      address: string;
      sequence: number;
      status: string;
      latitude: number;
      longitude: number;
    }>;
  }>;
  drivers: Array<{
    id: string;
    name: string;
    vehicle: string;
    status: string;
    region: string;
  }>;
  warnings: string[];
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
  };
  priority: string;
  notes?: string;
}

export interface CreateDriverInput {
  name: string;
  vehicle: string;
  region: string;
  status?: 'AVAILABLE' | 'ON_ROUTE' | 'OFFLINE';
}

export async function getAggregatedData() {
  return request<AggregatedData>('/aggregated-data');
}

export async function createOrder(input: CreateOrderInput) {
  return request('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function createDriver(input: CreateDriverInput) {
  return request<AggregatedData['drivers'][number]>('/api/v1/drivers', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function resetDatabase() {
  return request<{ reset: boolean }>('/api/v1/system/reset', { method: 'POST' });
}

export async function calculateRoute() {
  return request<{ id: string }>('/api/v1/routes/calculate', { method: 'POST' });
}

export async function acceptRoute(routeId: string, driverId: string) {
  return request(`/api/v1/routes/${routeId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ driverId })
  });
}

export async function finishRoute(routeId: string) {
  return request(`/api/v1/routes/${routeId}/finish`, {
    method: 'POST'
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BFF_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-user-role': 'OPERATOR',
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(payload.message ?? 'Falha na comunicacao com o BFF');
  }

  return response.json() as Promise<T>;
}
