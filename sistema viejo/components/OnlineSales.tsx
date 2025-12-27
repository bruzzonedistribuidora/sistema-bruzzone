
import React, { useState, useEffect } from 'react';
import { 
    Globe, ShoppingBag, Truck, Package, Printer, FileText, CheckCircle, X, 
    ExternalLink, MapPin, User, Search, Filter, AlertCircle, RefreshCw, 
    Settings, Link2, Zap, ShieldCheck, Database, Layout, ArrowRight, Save,
    ShoppingCart, Key, Lock, Terminal, Radio, Info, DollarSign, Smartphone
} from 'lucide-react';
import { OnlineOrder, OnlinePlatform, OnlineOrderStatus, Product, InvoiceItem } from '../types';

// Interfaces para configuración de sincronización
interface PlatformSyncConfig {
    enabled: boolean;
    autoSyncStock: boolean;
    autoSyncPrices: boolean;
    autoSyncOrders: boolean;
    lastSync: string;
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    apiKey?: string;
    appId?: string;
}

const createMockItem = (desc: string, qty: number, price: number): InvoiceItem => ({
    product: { 
        id: '1', internalCode: 'SKU-001', name: desc,
        brand: 'Generico', provider: 'Proveedor Demo', category: 'General', description: '',
        measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
        vatRate: 21, listCost: price * 0.6, discounts: [0, 0, 0, 0], costAfterDiscounts: price * 0.6, profitMargin: 40,
        priceNeto: price / 1.21, priceFinal: price, stock: 10, stockDetails: [], minStock: 10, desiredStock: 20, reorderPoint: 5,
        location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
    } as Product,
    quantity: qty,
    subtotal: qty * price,
    appliedPrice: price
});

const OnlineSales: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'READY_TO_SHIP' | 'HISTORY' | 'CONFIG'>('PENDING');
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modales de Configuración
  const [configModal, setConfigModal] = useState<OnlinePlatform | null>(null);

  // --- STATE PERSISTENTE ---
  const [meliConfig, setMeliConfig] = useState<PlatformSyncConfig>(() => {
      const s = localStorage.getItem('sync_meli');
      return s ? JSON.parse(s) : { enabled: true, autoSyncStock: true, autoSyncPrices: false, autoSyncOrders: true, lastSync: 'Hoy 10:45', status: 'CONNECTED', appId: '123456789' };
  });

  const [nubeConfig, setNubeConfig] = useState<PlatformSyncConfig>(() => {
      const s = localStorage.getItem('sync_nube');
      return s ? JSON.parse(s) : { enabled: true, autoSyncStock: true, autoSyncPrices: true, autoSyncOrders: true, lastSync: 'Hoy 11:00', status: 'CONNECTED', apiKey: 'shpat_xxxx' };
  });

  const [webConfig, setWebConfig] = useState<PlatformSyncConfig & { endpoint: string, secret: string }>(() => {
      const s = localStorage.getItem('sync_web');
      return s ? JSON.parse(s) : { enabled: false, autoSyncStock: false, autoSyncPrices: false, autoSyncOrders: false, lastSync: '-', status: 'DISCONNECTED', endpoint: 'https://bruzzone.com.ar/api/v1', secret: '' };
  });

  useEffect(() => {
      localStorage.setItem('sync_meli', JSON.stringify(meliConfig));
      localStorage.setItem('sync_nube', JSON.stringify(nubeConfig));
      localStorage.setItem('sync_web', JSON.stringify(webConfig));
  }, [meliConfig, nubeConfig, webConfig]);

  const [orders, setOrders] = useState<OnlineOrder[]>([
      {
          id: '1', platformId: '2000005544', platform: 'MERCADOLIBRE', date: '2023-10-27 10:30',
          customer: { name: 'Mario Rossi', nickname: 'SUPERMARIO88', address: 'Av. Corrientes 1234, 5A', city: 'CABA', zipCode: '1040', phone: '1155556666', dni: '30112233' },
          items: [ createMockItem('Taladro Percutor Bosch', 1, 85000) ],
          total: 85000, shippingCost: 0, shippingMethod: 'MERCADOENVIOS', status: 'NEW', labelPrinted: false, invoiced: false, trackingCode: '2774883922'
      },
      {
          id: '2', platformId: '#9942', platform: 'TIENDANUBE', date: '2023-10-27 11:15',
          customer: { name: 'Laura Gomez', address: 'Calle Falsa 123', city: 'Rosario', zipCode: '2000', phone: '3415555555', dni: '28999888' },
          items: [ createMockItem('Lija al agua 180', 10, 450), createMockItem('Rodillo Pintor', 2, 2500) ],
          total: 9500, shippingCost: 1500, shippingMethod: 'CORREO', status: 'PACKING', labelPrinted: true, invoiced: true, trackingCode: ''
      }
  ]);

  const handleManualSync = () => {
      setIsSyncing(true);
      setTimeout(() => {
          setIsSyncing(false);
          const now = new Date().toLocaleTimeString().slice(0, 5);
          if(meliConfig.enabled) setMeliConfig(prev => ({...prev, lastSync: `Hoy ${now}`}));
          if(nubeConfig.enabled) setNubeConfig(prev => ({...prev, lastSync: `Hoy ${now}`}));
          alert('Sincronización completa: Los stocks de los 140.000 artículos han sido actualizados en la nube.');
      }, 2000);
  };

  const updateStatus = (orderId: string, newStatus: OnlineOrderStatus) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
  };

  const getStatusBadge = (status: OnlineOrderStatus) => {
      switch(status) {
          case 'NEW': return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase">Nuevo</span>;
          case 'PACKING': return <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold uppercase">Preparando</span>;
          case 'READY_TO_SHIP': return <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Listo</span>;
          case 'SHIPPED': return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">En Camino</span>;
          default: return <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-bold uppercase">{status}</span>;
      }
  };

  const filteredOrders = orders.filter(o => {
      if (activeTab === 'CONFIG') return false;
      const matchTab = activeTab === 'PENDING' ? ['NEW', 'PACKING'].includes(o.status) 
                     : activeTab === 'READY_TO_SHIP' ? o.status === 'READY_TO_SHIP'
                     : ['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(o.status);
      return matchTab;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Globe className="text-blue-500"/> Ventas Online y Omnicanalidad
          </h2>
          <p className="text-gray-500 text-sm font-medium">Panel de gestión centralizada para tus tiendas virtuales.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleManualSync}
                disabled={isSyncing}
                className="bg-white border-2 border-gray-100 text-gray-700 px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm text-sm font-black uppercase tracking-tighter">
                <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Sincronizando...' : 'Sincronizar Stock Global'}
            </button>
        </div>
      </div>

      <div className="flex bg-white rounded-2xl p-1.5 border border-gray-200 shadow-sm w-full mb-8">
            <button onClick={() => setActiveTab('PENDING')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'PENDING' ? 'bg-slate-900 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}>Pendientes ({orders.filter(o => ['NEW', 'PACKING'].includes(o.status)).length})</button>
            <button onClick={() => setActiveTab('READY_TO_SHIP')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'READY_TO_SHIP' ? 'bg-slate-900 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}>Para Despacho ({orders.filter(o => o.status === 'READY_TO_SHIP').length})</button>
            <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'HISTORY' ? 'bg-slate-900 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}>Historial</button>
            <button onClick={() => setActiveTab('CONFIG')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'CONFIG' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-indigo-400 hover:bg-indigo-50'}`}>
                <div className="flex items-center justify-center gap-2"><Settings size={16}/> Configurar Canales</div>
            </button>
      </div>

      {activeTab === 'CONFIG' ? (
          <div className="flex-1 space-y-8 animate-fade-in pb-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* Mercado Libre Card */}
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-xl hover:translate-y-[-4px]">
                      <div className="p-8 bg-[#FFF159] flex justify-between items-center">
                          <div className="flex items-center gap-4">
                              <div className="bg-white p-3 rounded-2xl shadow-sm"><ShoppingCart className="text-gray-800" size={28}/></div>
                              <h3 className="font-black text-gray-800 text-xl tracking-tighter uppercase">Mercado Libre</h3>
                          </div>
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${meliConfig.status === 'CONNECTED' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                              <Radio size={10} className={meliConfig.status === 'CONNECTED' ? 'animate-pulse' : ''}/>
                              {meliConfig.status === 'CONNECTED' ? 'En Línea' : 'Offline'}
                          </div>
                      </div>
                      <div className="p-8 space-y-6 flex-1 bg-gradient-to-b from-yellow-50/20 to-white">
                          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                              <span>Sincronización</span>
                              <span>Última: {meliConfig.lastSync}</span>
                          </div>
                          <div className="space-y-3">
                                <button onClick={() => setMeliConfig({...meliConfig, autoSyncStock: !meliConfig.autoSyncStock})} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${meliConfig.autoSyncStock ? 'border-indigo-100 bg-indigo-50/30 text-indigo-700 font-bold' : 'border-gray-50 text-gray-400'}`}>
                                    <div className="flex items-center gap-3"><Package size={18}/> Stock en Tiempo Real</div>
                                    <div className={`w-10 h-5 rounded-full relative transition-all ${meliConfig.autoSyncStock ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${meliConfig.autoSyncStock ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </button>
                                {/* Fix: DollarSign is now imported */}
                                <button onClick={() => setMeliConfig({...meliConfig, autoSyncPrices: !meliConfig.autoSyncPrices})} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${meliConfig.autoSyncPrices ? 'border-indigo-100 bg-indigo-50/30 text-indigo-700 font-bold' : 'border-gray-50 text-gray-400'}`}>
                                    <div className="flex items-center gap-3"><DollarSign size={18}/> Actualizar Precios</div>
                                    <div className={`w-10 h-5 rounded-full relative transition-all ${meliConfig.autoSyncPrices ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${meliConfig.autoSyncPrices ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </button>
                          </div>
                          <div className="pt-4 mt-auto border-t border-gray-100">
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest flex items-center gap-2"><Info size={12}/> Cuenta Vinculada</p>
                              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs">FB</div>
                                      <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">BRUZZONE_FERRE</span>
                                  </div>
                                  <button onClick={() => setConfigModal('MERCADOLIBRE')} className="text-indigo-600 hover:text-indigo-800"><Settings size={18}/></button>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setConfigModal('MERCADOLIBRE')} className="w-full bg-slate-900 text-white py-4 text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">VINCULAR OTRA CUENTA</button>
                  </div>

                  {/* Tienda Nube Card */}
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-xl hover:translate-y-[-4px]">
                      <div className="p-8 bg-[#00AEEF] flex justify-between items-center text-white">
                          <div className="flex items-center gap-4">
                              <div className="bg-white/20 p-3 rounded-2xl"><Globe size={28}/></div>
                              <h3 className="font-black text-xl tracking-tighter uppercase">Tienda Nube</h3>
                          </div>
                          <div className="px-3 py-1 rounded-full text-[10px] font-black bg-white text-[#00AEEF] uppercase tracking-widest">
                              Conectado
                          </div>
                      </div>
                      <div className="p-8 space-y-6 flex-1 bg-gradient-to-b from-blue-50/20 to-white">
                          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                              <span>Sincronización</span>
                              <span>Última: {nubeConfig.lastSync}</span>
                          </div>
                          <div className="space-y-3">
                                <button onClick={() => setNubeConfig({...nubeConfig, autoSyncStock: !nubeConfig.autoSyncStock})} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${nubeConfig.autoSyncStock ? 'border-blue-100 bg-blue-50/30 text-blue-700 font-bold' : 'border-gray-50 text-gray-400'}`}>
                                    <div className="flex items-center gap-3"><Package size={18}/> Sincronizar Stock</div>
                                    <div className={`w-10 h-5 rounded-full relative transition-all ${nubeConfig.autoSyncStock ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${nubeConfig.autoSyncStock ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </button>
                                {/* Fix: DollarSign is now imported */}
                                <button onClick={() => setNubeConfig({...nubeConfig, autoSyncPrices: !nubeConfig.autoSyncPrices})} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${nubeConfig.autoSyncPrices ? 'border-blue-100 bg-blue-50/30 text-blue-700 font-bold' : 'border-gray-50 text-gray-400'}`}>
                                    <div className="flex items-center gap-3"><DollarSign size={18}/> Sincronizar Precios</div>
                                    <div className={`w-10 h-5 rounded-full relative transition-all ${nubeConfig.autoSyncPrices ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${nubeConfig.autoSyncPrices ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </button>
                          </div>
                          <div className="pt-4 mt-auto border-t border-gray-100">
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Token API v2</p>
                              <div className="font-mono text-[10px] bg-slate-50 p-4 rounded-2xl break-all text-slate-500 border border-slate-100">
                                  shpat_0a1b2c3d4e5f6g7h8i9j...
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setConfigModal('TIENDANUBE')} className="w-full bg-slate-900 text-white py-4 text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">EDITAR CREDENCIALES</button>
                  </div>

                  {/* Web API Config */}
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-xl hover:translate-y-[-4px]">
                      <div className="p-8 bg-indigo-600 flex justify-between items-center text-white">
                          <div className="flex items-center gap-4">
                              <div className="bg-white/20 p-3 rounded-2xl"><Layout size={28}/></div>
                              <h3 className="font-black text-xl tracking-tighter uppercase">Web API</h3>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${webConfig.enabled ? 'bg-green-400 text-white' : 'bg-white/20 text-white'}`}>
                              {webConfig.enabled ? 'Activo' : 'Pausado'}
                          </div>
                      </div>
                      <div className="p-8 space-y-6 flex-1 bg-gradient-to-b from-indigo-50/20 to-white">
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">API Endpoint Principal</label>
                              <div className="flex gap-2">
                                  <input readOnly type="text" className="flex-1 text-xs p-3 bg-white border border-gray-200 rounded-xl font-mono text-indigo-600" value={webConfig.endpoint} />
                                  <button className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-colors"><Link2 size={18}/></button>
                              </div>
                          </div>
                          <div className="bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100 flex gap-4 items-start">
                              <Zap size={20} className="text-indigo-600 shrink-0 mt-1"/>
                              <p className="text-[11px] text-indigo-900 font-medium leading-relaxed">
                                  Usa Webhooks para recibir órdenes de venta en tiempo real desde tu sistema personalizado. 
                                  <a href="#" className="block mt-2 font-black underline uppercase">Ver Docs API</a>
                              </p>
                          </div>
                          <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronización Custom</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-lg font-bold text-gray-600">GET /products</span>
                                    <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-lg font-bold text-gray-600">POST /orders</span>
                                </div>
                          </div>
                      </div>
                      <button onClick={() => setWebConfig({...webConfig, enabled: !webConfig.enabled})} className={`w-full py-4 text-xs font-black uppercase tracking-widest transition-colors ${webConfig.enabled ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                          {webConfig.enabled ? 'DESACTIVAR API' : 'HABILITAR API WEB'}
                      </button>
                  </div>
              </div>

              {/* Botón de guardado global */}
              <div className="flex justify-end p-8 bg-slate-50 rounded-[3rem] border border-gray-100">
                  <button className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black flex items-center gap-3 shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95">
                      <Save size={24}/> GUARDAR TODOS LOS CAMBIOS
                  </button>
              </div>
          </div>
      ) : (
          <div className="flex gap-8 h-full overflow-hidden animate-fade-in">
              <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                      {filteredOrders.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-300">
                              <ShoppingBag size={80} strokeWidth={1} className="mb-4 opacity-20"/>
                              <p className="text-xl font-black uppercase tracking-tighter">Bandeja de Entrada Vacía</p>
                              <p className="text-sm">No hay pedidos pendientes de sincronización.</p>
                          </div>
                      ) : (
                          filteredOrders.map(order => (
                              <div key={order.id} onClick={() => setSelectedOrder(order)} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all hover:shadow-xl flex justify-between items-center bg-white ${selectedOrder?.id === order.id ? 'border-ferre-orange ring-8 ring-orange-50' : 'border-transparent'}`}>
                                  <div className="flex items-start gap-6">
                                      <div className="mt-1">
                                          {order.platform === 'MERCADOLIBRE' ? (
                                              <div className="bg-[#FFF159] p-3 rounded-2xl shadow-sm border border-yellow-400">
                                                  <ShoppingCart className="text-gray-800" size={20}/>
                                              </div>
                                          ) : (
                                              <div className="bg-blue-500 p-3 rounded-2xl shadow-sm border border-blue-600 text-white">
                                                  <Globe size={20}/>
                                              </div>
                                          )}
                                      </div>
                                      <div>
                                          <h4 className="font-black text-gray-800 text-lg uppercase tracking-tight leading-none mb-2">{order.customer.name}</h4>
                                          <div className="flex items-center gap-3">
                                              <p className="text-xs text-gray-400 font-mono">#{order.platformId}</p>
                                              <span className="text-[10px] text-gray-300">•</span>
                                              <p className="text-xs text-gray-400 font-bold uppercase">{order.date}</p>
                                          </div>
                                          <div className="flex items-center gap-2 mt-4">{getStatusBadge(order.status)}</div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-2xl font-black text-gray-900 tracking-tighter">${order.total.toLocaleString('es-AR')}</p>
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{order.items.length} ARTÍCULOS</p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>

              <div className="w-[450px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-in-right">
                  {selectedOrder ? (
                      <>
                        <div className="p-8 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Gestión de Orden</span>
                                    <span className="w-1 h-1 bg-indigo-400 rounded-full"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{selectedOrder.platform}</span>
                                </div>
                                <h3 className="font-black text-3xl tracking-tighter uppercase leading-none">#{selectedOrder.platformId}</h3>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><User size={14} className="text-ferre-orange"/> Datos de Entrega</h4>
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <p className="font-black text-slate-800 text-lg uppercase tracking-tight mb-2">{selectedOrder.customer.name}</p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-600 flex items-center gap-2 font-medium">
                                            <MapPin size={16} className="text-slate-400"/>
                                            {selectedOrder.customer.address}, {selectedOrder.customer.city}
                                        </p>
                                        {/* Fix: Smartphone is now imported */}
                                        <p className="text-sm text-slate-600 flex items-center gap-2 font-medium">
                                            <Smartphone size={16} className="text-slate-400"/>
                                            {selectedOrder.customer.phone}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => alert('Imprimiendo Etiqueta...')} className="flex flex-col items-center justify-center gap-3 py-6 rounded-[2rem] border-2 border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all group">
                                    <Printer size={24} className="group-hover:scale-110 transition-transform"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Etiqueta Envío</span>
                                </button>
                                <button onClick={() => alert('Facturando...')} disabled={selectedOrder.invoiced} className="flex flex-col items-center justify-center gap-3 py-6 rounded-[2rem] border-2 border-green-100 bg-green-50 text-green-700 hover:bg-green-100 transition-all group disabled:opacity-30">
                                    <FileText size={24} className="group-hover:scale-110 transition-transform"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{selectedOrder.invoiced ? 'Facturado' : 'Generar Factura'}</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumen de Productos</h4>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.product.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{item.quantity} Unidad/es</p>
                                            </div>
                                            <span className="font-black text-slate-900">${item.subtotal.toLocaleString('es-AR')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 bg-white">
                            {selectedOrder.status === 'NEW' && (
                                <button onClick={() => updateStatus(selectedOrder.id, 'PACKING')} className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                                    COMENZAR PREPARACIÓN <ArrowRight size={20}/>
                                </button>
                            )}
                            {selectedOrder.status === 'PACKING' && (
                                <button onClick={() => updateStatus(selectedOrder.id, 'READY_TO_SHIP')} className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                                    LISTO PARA DESPACHO <Package size={20}/>
                                </button>
                            )}
                            {selectedOrder.status === 'READY_TO_SHIP' && (
                                <button onClick={() => updateStatus(selectedOrder.id, 'SHIPPED')} className="w-full bg-green-600 text-white font-black py-5 rounded-[2rem] hover:bg-green-700 transition-all shadow-2xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                                    DESPACHAR PEDIDO <Truck size={20}/>
                                </button>
                            )}
                        </div>
                      </>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 text-center">
                          <div className="p-8 bg-slate-50 rounded-full mb-6">
                            <ShoppingCart size={64} strokeWidth={1} className="opacity-20"/>
                          </div>
                          <h4 className="text-xl font-black uppercase tracking-tighter text-slate-300">Detalles de la Venta</h4>
                          <p className="text-sm font-medium mt-2">Selecciona una orden de la lista para ver el desglose y procesar el envío.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- MODAL DE CONFIGURACIÓN DE CREDENCIALES --- */}
      {configModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
                  <div className={`p-8 flex justify-between items-center text-white ${configModal === 'MERCADOLIBRE' ? 'bg-[#FFF159] text-gray-800' : configModal === 'TIENDANUBE' ? 'bg-[#00AEEF]' : 'bg-indigo-600'}`}>
                      <div className="flex items-center gap-4">
                          {configModal === 'MERCADOLIBRE' ? <ShoppingCart size={32}/> : configModal === 'TIENDANUBE' ? <Globe size={32}/> : <Terminal size={32}/>}
                          <div>
                              <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">Conectar {configModal.replace('MERCADOLIBRE', 'MeLi').replace('TIENDANUBE', 'Tienda Nube')}</h3>
                              <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Configuración de Credenciales</p>
                          </div>
                      </div>
                      <button onClick={() => setConfigModal(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X size={28}/></button>
                  </div>

                  <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                      {configModal === 'MERCADOLIBRE' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="bg-blue-50 border border-blue-100 p-5 rounded-3xl flex gap-4 items-start">
                                  <Info className="text-blue-600 shrink-0" size={20}/>
                                  <p className="text-xs text-blue-800 font-medium leading-relaxed">Debes crear una aplicación en el portal de Mercado Libre Developers para obtener estos datos.</p>
                              </div>
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">App ID (Client ID)</label>
                                      <div className="relative group">
                                          <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-yellow-500" size={18}/>
                                          <input type="text" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#FFF159] outline-none font-bold" value={meliConfig.appId} onChange={e => setMeliConfig({...meliConfig, appId: e.target.value})} />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Client Secret</label>
                                      <div className="relative group">
                                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-yellow-500" size={18}/>
                                          <input type="password" placeholder="••••••••••••••••" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#FFF159] outline-none font-bold" />
                                      </div>
                                  </div>
                              </div>
                              <div className="pt-4 space-y-4">
                                  <button className="w-full bg-[#FFF159] text-gray-800 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:shadow-yellow-200 transition-all active:scale-95">Autorizar con mi Cuenta</button>
                                  <p className="text-[10px] text-center text-gray-400 font-bold">Bruzzone Cloud utiliza el flujo OAuth 2.0 seguro de Mercado Libre.</p>
                              </div>
                          </div>
                      )}

                      {configModal === 'TIENDANUBE' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Access Token (Administrador)</label>
                                      <div className="relative group">
                                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500" size={18}/>
                                          <input type="password" placeholder="shpat_xxxx..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#00AEEF] outline-none font-mono font-bold" />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Store ID</label>
                                      <div className="relative group">
                                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500" size={18}/>
                                          <input type="text" placeholder="ID de tu tienda" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#00AEEF] outline-none font-bold" />
                                      </div>
                                  </div>
                              </div>
                              <div className="pt-4">
                                  <button onClick={() => setConfigModal(null)} className="w-full bg-[#00AEEF] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-[#0092c9] transition-all">CONECTAR TIENDANUBE</button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default OnlineSales;
