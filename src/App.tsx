import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bike,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  MapPinned,
  PackagePlus,
  Plus,
  RefreshCcw,
  Route,
  ShieldCheck,
  Trash2,
  Truck,
  UserPlus,
  Users
} from 'lucide-react';
import {
  AggregatedData,
  acceptRoute,
  calculateRoute,
  createDriver,
  CreateDriverInput,
  createOrder,
  CreateOrderInput,
  finishRoute,
  getAggregatedData,
  resetDatabase
} from './api';

type TabId = 'overview' | 'orders' | 'routes' | 'drivers';

const initialOrder: CreateOrderInput = {
  customerName: '',
  customerPhone: '',
  deliveryAddress: {
    street: '',
    number: '',
    district: '',
    city: 'Curitiba',
    state: 'PR',
    zipCode: '',
    latitude: -25.4515,
    longitude: -49.2525
  },
  priority: 'MEDIUM',
  notes: ''
};

const initialDriver: CreateDriverInput = {
  name: '',
  vehicle: 'Moto',
  region: '',
  status: 'AVAILABLE'
};

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: 'overview', label: 'Visao geral', icon: <LayoutDashboard size={18} /> },
  { id: 'orders', label: 'Pedidos', icon: <PackagePlus size={18} /> },
  { id: 'routes', label: 'Rotas', icon: <MapPinned size={18} /> },
  { id: 'drivers', label: 'Motoristas', icon: <Users size={18} /> }
];

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [data, setData] = useState<AggregatedData | null>(null);
  const [orderForm, setOrderForm] = useState<CreateOrderInput>(initialOrder);
  const [driverForm, setDriverForm] = useState<CreateDriverInput>(initialDriver);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const availableDrivers = useMemo(
    () => data?.drivers.filter((driver) => driver.status === 'AVAILABLE') ?? [],
    [data?.drivers]
  );

  const selectedDriverIsAvailable = availableDrivers.some((driver) => driver.id === selectedDriver);
  const selectedRoute = useMemo(() => {
    return data?.routes.find((route) => route.id === selectedRouteId) ?? data?.routes[0];
  }, [data?.routes, selectedRouteId]);

  async function load() {
    setBusy(true);
    setMessage('');
    try {
      const nextData = await getAggregatedData();
      setData(nextData);

      const nextAvailableDrivers = nextData.drivers.filter((driver) => driver.status === 'AVAILABLE');
      if (!nextAvailableDrivers.some((driver) => driver.id === selectedDriver)) {
        setSelectedDriver(nextAvailableDrivers[0]?.id ?? '');
      }

      if (!nextData.routes.some((route) => route.id === selectedRouteId)) {
        setSelectedRouteId(nextData.routes[0]?.id ?? '');
      }
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createOrder(orderForm);
      setOrderForm(initialOrder);
      setMessage('Pedido cadastrado.');
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitDriver(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const driver = await createDriver(driverForm);
      setDriverForm(initialDriver);
      setSelectedDriver(driver.id);
      setMessage('Motorista cadastrado.');
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCalculateRoute() {
    setBusy(true);
    try {
      const route = await calculateRoute();
      setSelectedRouteId(route.id);
      setActiveTab('routes');
      setMessage('Rota calculada.');
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAcceptRoute(routeId: string) {
    if (!selectedDriver) {
      setMessage('Cadastre ou selecione um motorista antes de aceitar a rota.');
      return;
    }

    const driver = data?.drivers.find((item) => item.id === selectedDriver);
    setBusy(true);
    try {
      await acceptRoute(routeId, selectedDriver);
      setMessage(driver ? `Rota aceita por ${driver.name}.` : 'Rota aceita.');
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFinishRoute(routeId: string) {
    const route = data?.routes.find((item) => item.id === routeId);
    const confirmed = window.confirm(`Finalizar a rota ${route?.region ?? ''}?`);
    if (!confirmed) {
      return;
    }

    setBusy(true);
    try {
      await finishRoute(routeId);
      setMessage('Rota finalizada. Motorista liberado para novas entregas.');
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetDatabase() {
    const confirmed = window.confirm('Apagar todos os pedidos, rotas e motoristas cadastrados?');
    if (!confirmed) {
      return;
    }

    setBusy(true);
    try {
      await resetDatabase();
      setOrderForm(initialOrder);
      setDriverForm(initialDriver);
      setSelectedDriver('');
      setSelectedRouteId('');
      setMessage('Base resetada. Todos os dados foram apagados.');
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-icon">
              <Route size={22} aria-hidden="true" />
            </span>
            <div>
              <h1>RotaCerta</h1>
              <p>Operacao de entregas</p>
            </div>
          </div>

          <nav className="side-nav" aria-label="Menu principal">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? 'side-nav-item side-nav-active' : 'side-nav-item'}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-actions">
            <button className="secondary-button w-full justify-center" onClick={load} disabled={busy} type="button">
              <RefreshCcw size={18} aria-hidden="true" />
              Atualizar
            </button>
            <button className="danger-button w-full justify-center" onClick={handleResetDatabase} disabled={busy} type="button">
              <Trash2 size={18} aria-hidden="true" />
              Resetar base
            </button>
          </div>
        </aside>

        <section className="content-area">
          <header className="content-header">
            <div>
              <p className="section-kicker">{tabs.find((tab) => tab.id === activeTab)?.label}</p>
              <h2>{pageTitle(activeTab)}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="secondary-button" onClick={() => setActiveTab('drivers')} disabled={busy} type="button">
                <UserPlus size={18} aria-hidden="true" />
                Motorista
              </button>
              <button className="primary-button" onClick={handleCalculateRoute} disabled={busy} type="button">
                <MapPinned size={18} aria-hidden="true" />
                Calcular rota
              </button>
            </div>
          </header>

          <section className="metrics-grid">
            <Metric icon={<PackagePlus size={18} />} label="Pedidos" value={data?.summary.totalOrders ?? 0} />
            <Metric icon={<Clock3 size={18} />} label="Pendentes" value={data?.summary.pendingOrders ?? 0} />
            <Metric icon={<Truck size={18} />} label="Rotas ativas" value={data?.summary.activeRoutes ?? 0} />
            <Metric icon={<Users size={18} />} label="Motoristas livres" value={data?.summary.availableDrivers ?? 0} />
            <Metric icon={<ShieldCheck size={18} />} label="Score medio" value={data?.summary.averageRouteScore ?? 0} />
          </section>

          {(message || data?.warnings.length) && (
            <div className="notice">
              {message || data?.warnings.join(' ')}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Fila da operacao" icon={<Activity size={20} />}>
                <div className="grid gap-3 md:grid-cols-2">
                  <SummaryLine label="Pedidos pendentes" value={data?.summary.pendingOrders ?? 0} />
                  <SummaryLine label="Motoristas disponiveis" value={availableDrivers.length} />
                  <SummaryLine label="Rotas registradas" value={data?.routes.length ?? 0} />
                  <SummaryLine label="Ultima atualizacao" value={data ? new Date(data.generatedAt).toLocaleTimeString() : '-'} />
                </div>
              </Panel>

              <Panel title="Acoes rapidas" icon={<CheckCircle2 size={20} />}>
                <div className="action-grid">
                  <button className="action-button" onClick={() => setActiveTab('orders')} type="button">
                    <PackagePlus size={20} aria-hidden="true" />
                    Novo pedido
                  </button>
                  <button className="action-button" onClick={handleCalculateRoute} disabled={busy} type="button">
                    <MapPinned size={20} aria-hidden="true" />
                    Calcular rota
                  </button>
                  <button className="action-button" onClick={() => setActiveTab('drivers')} type="button">
                    <UserPlus size={20} aria-hidden="true" />
                    Novo motorista
                  </button>
                </div>
              </Panel>

              <Panel title="Pedidos recentes" icon={<PackagePlus size={20} />}>
                <OrderList orders={data?.orders ?? []} />
              </Panel>

              <Panel title="Rotas recentes" icon={<MapPinned size={20} />}>
                <RouteList
                  routes={data?.routes ?? []}
                  drivers={data?.drivers ?? []}
                  busy={busy}
                  selectedDriver={selectedDriver}
                  selectedDriverExists={selectedDriverIsAvailable}
                  onAccept={handleAcceptRoute}
                  onFinish={handleFinishRoute}
                  onSelectRoute={setSelectedRouteId}
                  selectedRouteId={selectedRoute?.id ?? ''}
                />
              </Panel>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
              <Panel title="Novo pedido" icon={<PackagePlus size={20} />}>
                <OrderForm form={orderForm} busy={busy} onSubmit={submitOrder} onChange={setOrderForm} />
              </Panel>

              <Panel title="Pedidos cadastrados" icon={<Activity size={20} />}>
                <OrderList orders={data?.orders ?? []} />
              </Panel>
            </div>
          )}

          {activeTab === 'routes' && (
            <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
              <Panel title="Planejamento" icon={<MapPinned size={20} />}>
                <div className="space-y-4">
                  <label className="field">
                    <span>Motorista</span>
                    <select value={selectedDriver} onChange={(event) => setSelectedDriver(event.target.value)}>
                      <option value="">Selecione</option>
                      {availableDrivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.vehicle}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="primary-button w-full justify-center" onClick={handleCalculateRoute} disabled={busy} type="button">
                    <MapPinned size={18} aria-hidden="true" />
                    Calcular rota
                  </button>
                </div>
              </Panel>

              <Panel title="Mapa da rota" icon={<MapPinned size={20} />}>
                <GoogleRouteMap route={selectedRoute} apiKey={googleMapsApiKey} />
              </Panel>

              <div className="xl:col-span-2">
              <Panel title="Rotas" icon={<Route size={20} />}>
                <RouteList
                  routes={data?.routes ?? []}
                  drivers={data?.drivers ?? []}
                  busy={busy}
                  selectedDriver={selectedDriver}
                  selectedDriverExists={selectedDriverIsAvailable}
                  onAccept={handleAcceptRoute}
                  onFinish={handleFinishRoute}
                  onSelectRoute={setSelectedRouteId}
                  selectedRouteId={selectedRoute?.id ?? ''}
                />
              </Panel>
              </div>
            </div>
          )}

          {activeTab === 'drivers' && (
            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <Panel title="Novo motorista" icon={<UserPlus size={20} />}>
                <DriverForm form={driverForm} busy={busy} onSubmit={submitDriver} onChange={setDriverForm} />
              </Panel>

              <Panel title="Motoristas" icon={<Users size={20} />}>
                <DriverList drivers={data?.drivers ?? []} />
              </Panel>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function pageTitle(tab: TabId) {
  const titles: Record<TabId, string> = {
    overview: 'Painel da operacao',
    orders: 'Cadastro e acompanhamento de pedidos',
    routes: 'Planejamento e aceite de rotas',
    drivers: 'Cadastro e disponibilidade de motoristas'
  };

  return titles[tab];
}

function OrderForm({
  form,
  busy,
  onSubmit,
  onChange
}: {
  form: CreateOrderInput;
  busy: boolean;
  onSubmit: (event: FormEvent) => void;
  onChange: (form: CreateOrderInput) => void;
}) {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <Input label="Cliente" value={form.customerName} onChange={(value) => onChange({ ...form, customerName: value })} />
      <Input label="Telefone" value={form.customerPhone} onChange={(value) => onChange({ ...form, customerPhone: value })} />
      <div className="grid grid-cols-[1fr_92px] gap-2">
        <Input
          label="Rua"
          value={form.deliveryAddress.street}
          onChange={(value) => onChange({ ...form, deliveryAddress: { ...form.deliveryAddress, street: value } })}
        />
        <Input
          label="Numero"
          value={form.deliveryAddress.number}
          onChange={(value) => onChange({ ...form, deliveryAddress: { ...form.deliveryAddress, number: value } })}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          label="Bairro"
          value={form.deliveryAddress.district}
          onChange={(value) => onChange({ ...form, deliveryAddress: { ...form.deliveryAddress, district: value } })}
        />
        <Input
          label="CEP"
          value={form.deliveryAddress.zipCode}
          onChange={(value) => onChange({ ...form, deliveryAddress: { ...form.deliveryAddress, zipCode: value } })}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <NumberInput
          label="Latitude"
          value={form.deliveryAddress.latitude ?? 0}
          onChange={(value) => onChange({ ...form, deliveryAddress: { ...form.deliveryAddress, latitude: value } })}
        />
        <NumberInput
          label="Longitude"
          value={form.deliveryAddress.longitude ?? 0}
          onChange={(value) => onChange({ ...form, deliveryAddress: { ...form.deliveryAddress, longitude: value } })}
        />
      </div>
      <label className="field">
        <span>Prioridade</span>
        <select value={form.priority} onChange={(event) => onChange({ ...form, priority: event.target.value })}>
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>
      </label>
      <label className="field">
        <span>Observacoes</span>
        <textarea rows={3} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
      </label>
      <button className="primary-button w-full justify-center" disabled={busy}>
        <CheckCircle2 size={18} aria-hidden="true" />
        Cadastrar pedido
      </button>
    </form>
  );
}

function DriverForm({
  form,
  busy,
  onSubmit,
  onChange
}: {
  form: CreateDriverInput;
  busy: boolean;
  onSubmit: (event: FormEvent) => void;
  onChange: (form: CreateDriverInput) => void;
}) {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <Input label="Nome" value={form.name} onChange={(value) => onChange({ ...form, name: value })} />
      <label className="field">
        <span>Tipo de motorista</span>
        <select value={form.vehicle} onChange={(event) => onChange({ ...form, vehicle: event.target.value })}>
          <option value="Moto">Moto</option>
          <option value="Van">Van</option>
          <option value="Carro">Carro</option>
          <option value="Bicicleta">Bicicleta</option>
          <option value="Caminhao">Caminhao</option>
        </select>
      </label>
      <Input label="Regiao" value={form.region} onChange={(value) => onChange({ ...form, region: value })} />
      <label className="field">
        <span>Status</span>
        <select
          value={form.status}
          onChange={(event) => onChange({ ...form, status: event.target.value as CreateDriverInput['status'] })}
        >
          <option value="AVAILABLE">Disponivel</option>
          <option value="ON_ROUTE">Em rota</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </label>
      <button className="primary-button w-full justify-center" disabled={busy}>
        <Plus size={18} aria-hidden="true" />
        Cadastrar motorista
      </button>
    </form>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="metric">
      <div className="flex items-center justify-between gap-3">
        <span className="text-slate-500">{icon}</span>
        <strong className="text-2xl font-semibold">{value}</strong>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="mb-4 flex items-center gap-2 text-slate-900">
        <span className="text-blue-700">{icon}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SummaryLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="summary-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OrderList({ orders }: { orders: AggregatedData['orders'] }) {
  if (orders.length === 0) {
    return <div className="empty-state">Nenhum pedido cadastrado.</div>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <article key={order.id} className="list-card">
          <div className="min-w-0">
            <h3>{order.customerName}</h3>
            <p>{order.district || 'Sem bairro'} - {statusLabel(order.priority)}</p>
          </div>
          <StatusBadge status={order.status} />
        </article>
      ))}
    </div>
  );
}

function RouteList({
  routes,
  drivers,
  busy,
  selectedDriver,
  selectedDriverExists,
  onAccept,
  onFinish,
  onSelectRoute,
  selectedRouteId
}: {
  routes: AggregatedData['routes'];
  drivers: AggregatedData['drivers'];
  busy: boolean;
  selectedDriver: string;
  selectedDriverExists: boolean;
  onAccept: (routeId: string) => void;
  onFinish: (routeId: string) => void;
  onSelectRoute: (routeId: string) => void;
  selectedRouteId: string;
}) {
  if (routes.length === 0) {
    return <div className="empty-state">Nenhuma rota cadastrada.</div>;
  }

  return (
    <div className="space-y-3">
      {routes.map((route) => {
        const driver = drivers.find((item) => item.id === route.driverId);

        return (
          <article key={route.id} className={route.id === selectedRouteId ? 'list-card selected-card' : 'list-card'}>
            <div className="min-w-0">
              <h3>{route.region}</h3>
              <p>
                {route.completedStops}/{route.stops} paradas - {route.estimatedDistanceKm} km - {route.estimatedDurationMinutes} min
              </p>
              <p className="font-medium text-slate-700">
                Motorista: {driver ? `${driver.name} - ${driver.vehicle}` : 'Aguardando aceite'}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <StatusBadge status={route.status} />
              {route.status === 'AVAILABLE' && (
                <button
                  className="small-button"
                  onClick={() => onAccept(route.id)}
                  disabled={busy || !selectedDriver || !selectedDriverExists}
                  type="button"
                >
                  Aceitar
                </button>
              )}
              {route.status === 'IN_PROGRESS' && (
                <button className="small-button" onClick={() => onFinish(route.id)} disabled={busy} type="button">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  Finalizar
                </button>
              )}
              <button className="outline-small-button" onClick={() => onSelectRoute(route.id)} type="button">
                Ver mapa
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function GoogleRouteMap({
  route,
  apiKey
}: {
  route?: AggregatedData['routes'][number];
  apiKey?: string;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    if (!apiKey || !route || route.mapStops.length === 0 || !mapRef.current) {
      return;
    }

    const currentApiKey = apiKey;
    const currentRoute = route;
    let canceled = false;

    async function renderMap() {
      try {
        setMapError('');
        await loadGoogleMaps(currentApiKey);

        if (canceled || !mapRef.current) {
          return;
        }

        const googleMaps = (window as any).google.maps;
        const points = currentRoute.mapStops.map((stop) => ({
          lat: stop.latitude,
          lng: stop.longitude
        }));

        const map =
          mapInstanceRef.current ??
          new googleMaps.Map(mapRef.current, {
            center: points[0],
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
          });

        mapInstanceRef.current = map;
        overlaysRef.current.forEach((overlay) => overlay.setMap(null));
        overlaysRef.current = [];

        const bounds = new googleMaps.LatLngBounds();
        points.forEach((point) => bounds.extend(point));

        if (points.length > 1) {
          const directionsService = new googleMaps.DirectionsService();
          const directionsRenderer = new googleMaps.DirectionsRenderer({
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: '#059669',
              strokeOpacity: 0.95,
              strokeWeight: 5
            }
          });

          directionsRenderer.setMap(map);
          overlaysRef.current.push(directionsRenderer);

          directionsService.route(
            {
              origin: points[0],
              destination: points[points.length - 1],
              waypoints: points.slice(1, -1).map((point) => ({ location: point, stopover: true })),
              travelMode: googleMaps.TravelMode.DRIVING,
              optimizeWaypoints: false
            },
            (result: unknown, status: string) => {
              if (status === googleMaps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
                return;
              }

              const polyline = new googleMaps.Polyline({
                path: points,
                geodesic: true,
                strokeColor: '#059669',
                strokeOpacity: 0.95,
                strokeWeight: 5,
                map
              });
              overlaysRef.current.push(polyline);
            }
          );
        }

        currentRoute.mapStops.forEach((stop, index) => {
          const marker = new googleMaps.Marker({
            position: { lat: stop.latitude, lng: stop.longitude },
            map,
            label: String(index + 1),
            title: `${stop.sequence}. ${stop.customerName}`
          });
          overlaysRef.current.push(marker);
        });

        map.fitBounds(bounds, 72);
      } catch (error) {
        setMapError((error as Error).message);
      }
    }

    void renderMap();

    return () => {
      canceled = true;
    };
  }, [apiKey, route]);

  if (!route) {
    return <div className="map-empty">Calcule uma rota para visualizar o trajeto no mapa.</div>;
  }

  if (route.mapStops.length === 0) {
    return <div className="map-empty">Esta rota nao possui coordenadas para exibicao no mapa.</div>;
  }

  if (!apiKey) {
    return (
      <div className="map-empty">
        Informe `VITE_GOOGLE_MAPS_API_KEY` no `.env` do Microfrontend para carregar o Google Maps.
      </div>
    );
  }

  return (
    <div className="map-shell">
      <div className="map-canvas" ref={mapRef} />
      {mapError && <div className="map-error">{mapError}</div>}
      <div className="map-route-summary">
        <strong>{route.region}</strong>
        <span>
          {route.stops} paradas - {route.estimatedDistanceKm} km - {route.estimatedDurationMinutes} min
        </span>
      </div>
    </div>
  );
}

function DriverList({ drivers }: { drivers: AggregatedData['drivers'] }) {
  if (drivers.length === 0) {
    return <div className="empty-state">Nenhum motorista cadastrado.</div>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {drivers.map((driver) => (
        <article key={driver.id} className="driver-card">
          <div className="flex items-center gap-3">
            <span className="driver-icon">
              {driver.vehicle === 'Moto' ? <Bike size={18} /> : <Truck size={18} />}
            </span>
            <div className="min-w-0">
              <h3>{driver.name}</h3>
              <p>{driver.vehicle} - {driver.region}</p>
            </div>
          </div>
          <StatusBadge status={driver.status} />
        </article>
      ))}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} required />
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        step="0.000001"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        required
      />
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return <span className={`status-badge ${tone}`}>{statusLabel(status)}</span>;
}

function loadGoogleMaps(apiKey: string) {
  const existingGoogle = (window as any).google?.maps;
  if (existingGoogle) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]');
  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Nao foi possivel carregar o Google Maps.')), {
        once: true
      });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.dataset.googleMaps = 'true';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Nao foi possivel carregar o Google Maps.'));
    document.head.appendChild(script);
  });
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    AWAITING_ROUTE: 'Aguardando rota',
    IN_ROUTE: 'Em entrega',
    DELIVERED: 'Entregue',
    CANCELED: 'Cancelado',
    AVAILABLE: 'Disponivel',
    IN_PROGRESS: 'Em andamento',
    FINISHED: 'Finalizada',
    ON_ROUTE: 'Em rota',
    OFFLINE: 'Offline',
    COMPLETED: 'Concluida',
    FAILED: 'Falhou',
    LOW: 'Baixa',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    URGENT: 'Urgente'
  };

  return labels[status] ?? status;
}

function statusTone(status: string) {
  if (status.includes('PENDING') || status.includes('AVAILABLE')) {
    return 'bg-amber-100 text-amber-800';
  }
  if (status.includes('IN_ROUTE') || status.includes('IN_PROGRESS') || status.includes('ON_ROUTE')) {
    return 'bg-blue-100 text-blue-800';
  }
  if (status.includes('DELIVERED') || status.includes('FINISHED')) {
    return 'bg-emerald-100 text-emerald-800';
  }
  return 'bg-slate-200 text-slate-700';
}
