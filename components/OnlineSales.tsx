import React, { useState, useEffect } from 'react';
import { 
    Globe, ShoppingBag, Truck, Package, Printer, FileText, CheckCircle, X, 
    ExternalLink, MapPin, User, Search, Filter, AlertCircle, RefreshCw, 
    Settings, Link2, Zap, ShieldCheck, Database, Layout, ArrowRight, Save,
    ShoppingCart, Key, Lock, Radio, Info, DollarSign, Smartphone, ChevronRight, Eye,
    Activity, Tag, Receipt, Link, Globe2, Code2, Server, Terminal,
    // Add missing Hash import
    Hash
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
    clientSecret?: string;
    storeId?: string;
    accessToken?: string;
    endpoint?: string;
    secret?: string;
}

const createMockItem = (desc: string, qty: number, price: number): InvoiceItem => ({
    product: { 
        id: '1', internalCodes: ['SKU-001'], barcodes: ['SKU-001'], providerCodes: [], name: desc,
        brand: 'Generico', provider: 'Proveedor Demo', category: 'General', description: '',
        measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
        vatRate: 21, listCost: price * 0.6, discounts: [0, 0, 0, 0], costAfterDiscounts: price * 0.6, profitMargin: 40,
        priceNeto: price / 1.21, priceFinal: price, stock: 10, stockDetails: [], minStock: 10, desiredStock: 20, reorderPoint: 5,
        location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false },
        isCombo: false,
        comboItems: []
    } as Product,
    quantity: qty,
    subtotal: qty * price,
    appliedPrice: price
});

const OnlineSales: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'READY_TO_SHIP' | 'HISTORY' | 'CONFIG'>('PENDING');
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [configModal, setConfigModal] = useState<OnlinePlatform | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);

  // --- CONFIGURACIONES DE PLATAFORMAS ---
  const [meliConfig, setMeliConfig] = useState<PlatformSyncConfig>(() => {
      const s = localStorage.getItem('sync_meli');
      return s ? JSON.parse(s) : { enabled: true, autoSyncStock: true, autoSyncPrices: false, autoSyncOrders: true, lastSync: 'Hoy 10:45', status: 'CONNECTED', appId: '', clientSecret: '' };
  });

  const [nubeConfig, setNubeConfig] = useState<PlatformSyncConfig>(() => {
      const s = localStorage.getItem('sync_nube');
      return s ? JSON.parse(s) : { enabled: true, autoSyncStock: true, autoSyncPrices: true, autoSyncOrders: true, lastSync: 'Hoy 11:00', status: 'CONNECTED', storeId: '', accessToken: '' };
  });

  const [webConfig, setWebConfig] = useState<PlatformSyncConfig>(() => {
      const s = localStorage.getItem('sync_web');
      return s ? JSON.parse(s) : { enabled: false, autoSyncStock: false, autoSyncPrices: false, autoSyncOrders: false, lastSync: '-', status: 'DISCONNECTED', endpoint: '', secret: '' };
  });

  useEffect(() => {
      localStorage.setItem('sync_meli', JSON.stringify(meliConfig));
      localStorage.setItem('sync_nube', JSON.stringify(nubeConfig));
      localStorage.setItem('sync_web', JSON.stringify(webConfig));
  }, [meliConfig, nubeConfig, webConfig]);

  const [orders, setOrders] = useState<OnlineOrder[]>([
      {
          id: '1', platformId: '2000005544', platform: 'MERCADOLIBRE', date: '2024-10-27 10:30',
          customer: { name: 'Mario Rossi', nickname: 'SUPERMARIO88', address: 'Av. Corrientes 1234, 5A', city: 'CABA', zipCode: '1040', phone: '1155556666', dni: '30112233' },
          items: [ createMockItem('Taladro Percutor Bosch', 1, 85000) ],
          total: 85000, shippingCost: 0, shippingMethod: 'MERCADOENVIOS', status: 'NEW', labelPrinted: false, invoiced: false, trackingCode: '2774883922'
      },
      {
          id: '2', platformId: '#9942', platform: 'TIENDANUBE', date: '2024-10-27 11:15',
          customer: { name: 'Laura Gomez', address: 'Calle Falsa 123', city: 'Rosario', zipCode: '2000', phone: '3415555555', dni: '28999888' },
          items: [ createMockItem('Lija al agua 180', 10, 450), createMockItem('Rodillo Pintor', 2, 2500) ],
          total: 9500, shippingCost: 1500, shippingMethod: 'CORREO', status: 'PACKING', labelPrinted: true, invoiced: true, trackingCode: ''
      }
  ]);

  const handleManualSync = () => {
      setIsSyncing(true);
      setTimeout(() => {
          setIsSyncing(false);
          alert('Sincronización completa: Los stocks del catálogo han sido actualizados en todos los canales.');
      }, 2000);
  };

  const handleSavePlatformConfig = (platform: OnlinePlatform, data: any) => {
      if (platform === 'MERCADOLIBRE') setMeliConfig({ ...meliConfig, ...data, status: 'CONNECTED' });
      if (platform === 'TIENDANUBE') setNubeConfig({ ...nubeConfig, ...data, status: 'CONNECTED' });
      if (platform === 'WEB_PROPIA') setWebConfig({ ...webConfig, ...data, status: 'CONNECTED', enabled: true });
      setConfigModal(null);
      alert(`Credenciales de ${platform} vinculadas con éxito.`);
  };

  const testConnection = () => {
      setIsTestingConn(true);
      setTimeout(() => {
          setIsTestingConn(false);
          alert("Conexión exitosa con el servidor. API funcional.");
      }, 1500);
  };

  // Add missing updateStatus function to handle order status updates
  const updateStatus = (id: string, status: OnlineOrderStatus) => {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const getStatusBadge = (status: OnlineOrderStatus) => {
      switch(status) {
          case 'NEW': return <span className="text-[10px] bg-red-100 text-red-700 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-red-200">Nuevo</span>;
          case 'PACKING': return <span className="text-[10px] bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-orange-200">Preparando</span>;
          case 'READY_TO_SHIP': return <span className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-blue-200">Listo</span>;
          case 'SHIPPED': return <span className="text-[10px] bg-green-100 text-green-700 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-green-200">Enviado</span>;
          default: return <span className="text-[10px] bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-gray-200">{status}</span>;
      }
  };

  const filteredOrders = orders.filter(o => {
      if (activeTab === 'CONFIG') return false;
      if (activeTab === 'PENDING') return ['NEW', 'PACKING'].includes(o.status);
      if (activeTab === 'READY_TO_SHIP') return o.status === 'READY_TO_SHIP';
      return ['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(o.status);
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 font-sans bg-slate-50 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm shrink-0 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter leading-none">
              <Globe className="text-indigo-600" size={32}/> Central de Ventas Online
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
              <Activity size={14} className="text-green-500 animate-pulse"/> Sincronización activa con la nube
          </p>
        </div>
        <button 
            onClick={handleManualSync}
            disabled={isSyncing}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50">
            {isSyncing ? <RefreshCw className="animate-spin" size={18}/> : <RefreshCw size={18}/>} 
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Stock Global'}
        </button>
      </div>

      <div className="flex bg-white rounded-[1.8rem] p-1.5 border border-slate-200 shadow-sm w-full shrink-0">
            <button onClick={() => setActiveTab('PENDING')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'PENDING' ? 'bg-slate-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}>
                Entrantes ({orders.filter(o => ['NEW', 'PACKING'].includes(o.status)).length})
            </button>
            <button onClick={() => setActiveTab('READY_TO_SHIP')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'READY_TO_SHIP' ? 'bg-slate-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}>
                Por Despachar ({orders.filter(o => o.status === 'READY_TO_SHIP').length})
            </button>
            <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'HISTORY' ? 'bg-slate-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}>Historial</button>
            <button onClick={() => setActiveTab('CONFIG')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'CONFIG' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-indigo-400 hover:bg-indigo-50'}`}>
                <div className="flex items-center justify-center gap-2"><Settings size={14}/> Configuración API</div>
            </button>
      </div>

      {activeTab === 'CONFIG' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
                  
                  {/* CARD: MERCADO LIBRE */}
                  <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all">
                      <div className="p-10 bg-[#FFF159] flex justify-between items-center relative overflow-hidden">
                          <ShoppingCart className="absolute -right-4 -bottom-4 text-white/20" size={120}/>
                          <div className="relative z-10 flex items-center gap-4">
                              <div className="bg-white p-3 rounded-2xl shadow-sm text-gray-800"><ShoppingCart size={28}/></div>
                              <h3 className="font-black text-gray-800 text-xl tracking-tighter uppercase">Mercado Libre</h3>
                          </div>
                          <div className={`relative z-10 flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${meliConfig.status === 'CONNECTED' ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                              {meliConfig.status === 'CONNECTED' ? 'Online' : 'Desconectado'}
                          </div>
                      </div>
                      <div className="p-10 space-y-8 flex-1">
                          <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizar Stock</span>
                                  <div onClick={() => setMeliConfig({...meliConfig, autoSyncStock: !meliConfig.autoSyncStock})} className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${meliConfig.autoSyncStock ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${meliConfig.autoSyncStock ? 'right-1' : 'left-1'}`}></div>
                                  </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Traer Pedidos</span>
                                  <div onClick={() => setMeliConfig({...meliConfig, autoSyncOrders: !meliConfig.autoSyncOrders})} className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${meliConfig.autoSyncOrders ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${meliConfig.autoSyncOrders ? 'right-1' : 'left-1'}`}></div>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setConfigModal('MERCADOLIBRE')} className="w-full bg-slate-900 text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors">Vincular Credenciales</button>
                  </div>

                  {/* CARD: TIENDA NUBE */}
                  <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all">
                      <div className="p-10 bg-[#00AEEF] flex justify-between items-center relative overflow-hidden text-white">
                          <Globe2 className="absolute -right-4 -bottom-4 text-white/10" size={120}/>
                          <div className="relative z-10 flex items-center gap-4">
                              <div className="bg-white/20 p-3 rounded-2xl shadow-sm"><Globe size={28}/></div>
                              <h3 className="font-black text-xl tracking-tighter uppercase">Tienda Nube</h3>
                          </div>
                          <div className={`relative z-10 flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${nubeConfig.status === 'CONNECTED' ? 'bg-white text-[#00AEEF]' : 'bg-white/20 text-white'}`}>
                              {nubeConfig.status === 'CONNECTED' ? 'Online' : 'Desconectado'}
                          </div>
                      </div>
                      <div className="p-10 space-y-8 flex-1">
                          <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizar Precios</span>
                                  <div onClick={() => setNubeConfig({...nubeConfig, autoSyncPrices: !nubeConfig.autoSyncPrices})} className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${nubeConfig.autoSyncPrices ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${nubeConfig.autoSyncPrices ? 'right-1' : 'left-1'}`}></div>
                                  </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizar Stock</span>
                                  <div onClick={() => setNubeConfig({...nubeConfig, autoSyncStock: !nubeConfig.autoSyncStock})} className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${nubeConfig.autoSyncStock ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${nubeConfig.autoSyncStock ? 'right-1' : 'left-1'}`}></div>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setConfigModal('TIENDANUBE')} className="w-full bg-slate-900 text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors">Configurar API Token</button>
                  </div>

                  {/* CARD: WEB PROPIA */}
                  <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all">
                      <div className="p-10 bg-indigo-900 flex justify-between items-center relative overflow-hidden text-white">
                          <Code2 className="absolute -right-4 -bottom-4 text-white/5" size={120}/>
                          <div className="relative z-10 flex items-center gap-4">
                              <div className="bg-white/10 p-3 rounded-2xl shadow-sm"><Zap size={28}/></div>
                              <h3 className="font-black text-xl tracking-tighter uppercase">Web Propia</h3>
                          </div>
                          <div className={`relative z-10 flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${webConfig.status === 'CONNECTED' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/50'}`}>
                              {webConfig.status === 'CONNECTED' ? 'API Activa' : 'Sin Link'}
                          </div>
                      </div>
                      <div className="p-10 space-y-8 flex-1">
                          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Endpoint API</p>
                              <p className="text-xs font-mono font-bold text-slate-600 truncate">{webConfig.endpoint || 'No configurado'}</p>
                          </div>
                      </div>
                      <button onClick={() => setConfigModal('WEB_PROPIA')} className="w-full bg-slate-900 text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors">Conectar Servidor</button>
                  </div>

              </div>
          </div>
      ) : (
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 animate-fade-in">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                  <div className="relative max-w-md w-full group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18}/>
                      <input type="text" placeholder="Buscar por cliente o ID de orden..." className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold text-sm transition-all uppercase shadow-inner" />
                  </div>
                  <div className="flex gap-2">
                      <button className="bg-white border border-slate-200 p-3 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"><Filter size={18}/></button>
                      <button className="bg-white border border-slate-200 p-3 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"><Printer size={18}/></button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-900 text-[10px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                          <tr>
                              <th className="px-8 py-5">Canal / ID Transacción</th>
                              <th className="px-8 py-5">Cliente / Comprador</th>
                              <th className="px-8 py-5 text-right">Total Cobrado</th>
                              <th className="px-8 py-5 text-center">Estado Logística</th>
                              <th className="px-8 py-5 text-center">Acciones</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {filteredOrders.length === 0 ? (
                              <tr>
                                  <td colSpan={5} className="py-40 text-center text-slate-300">
                                      <ShoppingBag size={64} className="mx-auto mb-4 opacity-10"/>
                                      <p className="font-black uppercase tracking-widest text-[11px]">No se encontraron pedidos en esta categoría</p>
                                  </td>
                              </tr>
                          ) : filteredOrders.map(order => (
                              <tr key={order.id} className="hover:bg-indigo-50/20 transition-colors group">
                                  <td className="px-8 py-6">
                                      <div className="flex items-center gap-4">
                                          <div className={`p-3 rounded-2xl shadow-sm ${order.platform === 'MERCADOLIBRE' ? 'bg-[#FFF159] text-gray-800' : 'bg-[#00AEEF] text-white'}`}>
                                              {order.platform === 'MERCADOLIBRE' ? <ShoppingCart size={20}/> : <Globe size={20}/>}
                                          </div>
                                          <div>
                                              <p className="font-black text-slate-800 uppercase tracking-tight text-sm leading-none mb-1.5">{order.platform}</p>
                                              <p className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-tighter">REF: {order.platformId}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6">
                                      <p className="font-black text-slate-700 text-sm leading-none mb-1.5 uppercase">{order.customer.name}</p>
                                      <div className="flex items-center gap-2">
                                          <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">{order.customer.nickname || 'Usuario Web'}</p>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                      <p className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-1">${order.total.toLocaleString('es-AR')}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Saldo Percibido</p>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                      {getStatusBadge(order.status)}
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                      <div className="flex justify-center gap-2">
                                          <button onClick={() => setSelectedOrder(order)} className="p-3 bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl rounded-2xl transition-all active:scale-90 border border-slate-100">
                                              <Eye size={18}/>
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* MODAL: VINCULAR CREDENCIALES (API CONFIG) */}
      {configModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl shadow-lg ${configModal === 'MERCADOLIBRE' ? 'bg-[#FFF159] text-gray-800' : configModal === 'TIENDANUBE' ? 'bg-[#00AEEF] text-white' : 'bg-indigo-600 text-white'}`}>
                              {configModal === 'MERCADOLIBRE' ? <ShoppingCart size={24}/> : configModal === 'TIENDANUBE' ? <Globe size={24}/> : <Terminal size={24}/>}
                          </div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Vinculación {configModal}</h3>
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Configuración Segura de API</p>
                          </div>
                      </div>
                      <button onClick={() => setConfigModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>

                  <div className="p-10 space-y-8 bg-slate-50/50">
                      {configModal === 'MERCADOLIBRE' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Application ID</label>
                                  <div className="relative group">
                                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                      <input 
                                        type="text" 
                                        className="w-full pl-12 p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-[#FFF159]" 
                                        placeholder="Ingrese el App ID de su cuenta ML"
                                        defaultValue={meliConfig.appId}
                                        id="appId"
                                      />
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Client Secret Key</label>
                                  <div className="relative group">
                                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                      <input 
                                        type="password" 
                                        className="w-full pl-12 p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-[#FFF159]" 
                                        placeholder="••••••••••••••••"
                                        defaultValue={meliConfig.clientSecret}
                                        id="clientSecret"
                                      />
                                  </div>
                              </div>
                          </div>
                      )}

                      {configModal === 'TIENDANUBE' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Store ID</label>
                                  <div className="relative group">
                                      {/* Fixed: Added Hash icon component from lucide-react */}
                                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                      <input 
                                        type="text" 
                                        className="w-full pl-12 p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-[#00AEEF]" 
                                        placeholder="Ej: 1234567"
                                        defaultValue={nubeConfig.storeId}
                                        id="storeId"
                                      />
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Access Token</label>
                                  <div className="relative group">
                                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                      <input 
                                        type="password" 
                                        className="w-full pl-12 p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-[#00AEEF]" 
                                        placeholder="shpat_••••••••••••"
                                        defaultValue={nubeConfig.accessToken}
                                        id="accessToken"
                                      />
                                  </div>
                              </div>
                          </div>
                      )}

                      {configModal === 'WEB_PROPIA' && (
                          <div className="space-y-6 animate-fade-in">
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Endpoint de Sincronización (URL)</label>
                                  <div className="relative group">
                                      <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                      <input 
                                        type="text" 
                                        className="w-full pl-12 p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-600" 
                                        placeholder="https://api.tuferreteria.com/v1"
                                        defaultValue={webConfig.endpoint}
                                        id="endpoint"
                                      />
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Secret Auth Token</label>
                                  <div className="relative group">
                                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                                      <input 
                                        type="password" 
                                        className="w-full pl-12 p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-600" 
                                        placeholder="Bearer ••••••••••••"
                                        defaultValue={webConfig.secret}
                                        id="secret"
                                      />
                                  </div>
                              </div>
                          </div>
                      )}

                      <div className="pt-4 space-y-3">
                          <button 
                            onClick={testConnection}
                            disabled={isTestingConn}
                            className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                              {isTestingConn ? <RefreshCw className="animate-spin" size={16}/> : <Activity size={16}/>}
                              Test de Conexión
                          </button>
                          <button 
                            onClick={() => {
                                const inputs = document.querySelectorAll('input');
                                const data: any = {};
                                inputs.forEach(i => { if(i.id) data[i.id] = i.value; });
                                handleSavePlatformConfig(configModal, data);
                            }}
                            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                              <Save size={18}/> Guardar y Activar Canal
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* DETALLE DE ORDEN (EXISTENTE) */}
      {selectedOrder && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-start shrink-0 bg-slate-900 text-white">
                      <div className="flex items-center gap-6">
                           <div className={`p-4 rounded-3xl shadow-lg ${selectedOrder.platform === 'MERCADOLIBRE' ? 'bg-[#FFF159] text-gray-800' : 'bg-[#00AEEF] text-white'}`}>
                               {selectedOrder.platform === 'MERCADOLIBRE' ? <ShoppingCart size={32}/> : <Globe size={32}/>}
                           </div>
                           <div>
                               <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Orden {selectedOrder.platformId}</h3>
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Ingresada: {selectedOrder.date}</p>
                           </div>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2 border-b pb-4"><User size={14} className="text-indigo-500"/> Comprador</h4>
                              <p className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">{selectedOrder.customer.name}</p>
                              <div className="space-y-4 pt-2">
                                  <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                                      <Smartphone size={16} className="text-slate-300"/> {selectedOrder.customer.phone}
                                  </div>
                                  <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                                      <MapPin size={16} className="text-slate-300"/> {selectedOrder.customer.address}, {selectedOrder.customer.city}
                                  </div>
                              </div>
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2 border-b pb-4"><Truck size={14} className="text-indigo-500"/> Envío</h4>
                              <div className="space-y-4">
                                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                      <span className="text-[10px] font-black text-indigo-600 uppercase">{selectedOrder.shippingMethod}</span>
                                      <span className="text-xs font-bold text-slate-600">Coste: $0.00</span>
                                  </div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Seguimiento</p>
                                  <p className="text-lg font-mono font-black text-slate-800">{selectedOrder.trackingCode || 'Pendiente'}</p>
                              </div>
                          </div>
                      </div>
                      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50/50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b">
                                  <tr>
                                      <th className="px-8 py-4">Descripción del Artículo</th>
                                      <th className="px-8 py-4 text-center">Cant.</th>
                                      <th className="px-8 py-4 text-right">Unitario</th>
                                      <th className="px-8 py-4 text-right">Subtotal</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                  {selectedOrder.items.map((item, idx) => (
                                      <tr key={idx}>
                                          <td className="px-8 py-5">
                                              <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1.5">{item.product.name}</p>
                                              <p className="text-[9px] text-indigo-500 font-mono font-bold uppercase">SKU: {item.product.internalCodes[0]}</p>
                                          </td>
                                          <td className="px-8 py-5 text-center font-black text-slate-600">{item.quantity}</td>
                                          <td className="px-8 py-5 text-right font-bold text-slate-400">${item.appliedPrice.toLocaleString('es-AR')}</td>
                                          <td className="px-8 py-5 text-right font-black text-slate-900 text-lg tracking-tighter">${item.subtotal.toLocaleString('es-AR')}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
                  
                  <div className="p-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center shrink-0 gap-6">
                        <div className="flex gap-2">
                             <button className="p-4 bg-slate-50 text-slate-400 border border-slate-200 rounded-2xl hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95" title="Imprimir Etiqueta"><Tag size={20}/></button>
                             <button className="p-4 bg-slate-50 text-slate-400 border border-slate-200 rounded-2xl hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-95" title="Ver Factura Asociada"><Receipt size={20}/></button>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total de Orden</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">${selectedOrder.total.toLocaleString('es-AR')}</p>
                            </div>
                            <button 
                                // Fixed: Now using defined updateStatus function
                                onClick={() => { updateStatus(selectedOrder.id, 'READY_TO_SHIP'); setSelectedOrder(null); }}
                                className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3">
                                <CheckCircle size={20}/> Marcar Listo para Despacho
                            </button>
                        </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default OnlineSales;
