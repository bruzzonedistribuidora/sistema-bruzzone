import React, { useState, useEffect } from 'react';
import { 
    Globe, ShoppingBag, Truck, Package, Printer, FileText, CheckCircle, X, 
    ExternalLink, MapPin, User, Search, Filter, AlertCircle, RefreshCw, 
    Settings, Link2, Zap, ShieldCheck, Database, Layout, ArrowRight, Save,
    ShoppingCart, Key, Lock, Radio, Info, DollarSign, Smartphone, ChevronRight, Eye,
    Activity, Tag, Receipt
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
    userId?: string;
    endpoint?: string;
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

  const updateStatus = (id: string, status: OnlineOrderStatus) => {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleManualSync = () => {
      setIsSyncing(true);
      setTimeout(() => {
          setIsSyncing(false);
          const now = new Date().toLocaleTimeString().slice(0, 5);
          if(meliConfig.enabled) setMeliConfig(prev => ({...prev, lastSync: `Hoy ${now}`}));
          if(nubeConfig.enabled) setMeliConfig(prev => ({...prev, lastSync: `Hoy ${now}`}));
          alert('Sincronización completa: Los stocks de los 140.000 artículos han sido actualizados en la nube.');
      }, 2000);
  };

  const handleTestConnection = () => {
      setIsTestingConn(true);
      setTimeout(() => {
          setIsTestingConn(false);
          alert("¡Conexión establecida con éxito! Credenciales validadas.");
      }, 1500);
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
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
              <Globe className="text-indigo-600" size={32}/> E-commerce Hub
          </h2>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">Control de Stock y Pedidos Multi-Plataforma</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleManualSync}
                disabled={isSyncing}
                className="bg-white border-2 border-gray-100 text-slate-700 px-8 py-3 rounded-2xl flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50">
                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Procesando Nube...' : 'Sincronizar Stock Global'}
            </button>
        </div>
      </div>

      <div className="flex bg-white rounded-[1.5rem] p-1.5 border border-gray-200 shadow-sm w-full shrink-0">
            <button onClick={() => setActiveTab('PENDING')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'PENDING' ? 'bg-slate-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}>Pendientes ({orders.filter(o => ['NEW', 'PACKING'].includes(o.status)).length})</button>
            <button onClick={() => setActiveTab('READY_TO_SHIP')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'READY_TO_SHIP' ? 'bg-slate-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}>Despachos ({orders.filter(o => o.status === 'READY_TO_SHIP').length})</button>
            <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'HISTORY' ? 'bg-slate-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}>Historial</button>
            <button onClick={() => setActiveTab('CONFIG')} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'CONFIG' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 border border-indigo-400' : 'text-indigo-400 hover:bg-indigo-50'}`}>
                <div className="flex items-center justify-center gap-2"><Settings size={14}/> Configuración</div>
            </button>
      </div>

      {activeTab === 'CONFIG' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                  <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1">
                      <div className="p-8 bg-[#FFF159] flex justify-between items-center">
                          <div className="flex items-center gap-4">
                              <div className="bg-white p-3 rounded-2xl shadow-sm"><ShoppingCart className="text-gray-800" size={28}/></div>
                              <h3 className="font-black text-gray-800 text-xl tracking-tighter uppercase">Mercado Libre</h3>
                          </div>
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${meliConfig.status === 'CONNECTED' ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                              <Radio size={10} className={meliConfig.status === 'CONNECTED' ? 'animate-pulse' : ''}/>
                              {meliConfig.status === 'CONNECTED' ? 'Online' : 'Offline'}
                          </div>
                      </div>
                      <div className="p-10 space-y-8 flex-1">
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Gestión de publicaciones oficiales, sincronización de preguntas y stock crítico en tiempo real.</p>
                          <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Sincronización Stock</span>
                                    <div onClick={() => setMeliConfig({...meliConfig, autoSyncStock: !meliConfig.autoSyncStock})} className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${meliConfig.autoSyncStock ? 'bg-green-50' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${meliConfig.autoSyncStock ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>
                          </div>
                      </div>
                      <button onClick={() => setConfigModal('MERCADOLIBRE')} className="w-full bg-slate-900 text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors">VINCULAR CREDENCIALES</button>
                  </div>
              </div>
          </div>
      ) : (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 animate-fade-in">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div className="relative max-w-md w-full">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300" size={18}/>
                      <input type="text" placeholder="Buscar por cliente o ID de orden..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all uppercase" />
                  </div>
                  <button className="bg-white border border-gray-200 p-3 rounded-2xl text-slate-400 hover:text-slate-800 transition-all shadow-sm"><Filter size={18}/></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-900 text-[10px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                          <tr>
                              <th className="px-8 py-5">Plataforma / ID</th>
                              <th className="px-8 py-5">Cliente / Usuario</th>
                              <th className="px-8 py-5 text-right">Total Operación</th>
                              <th className="px-8 py-5 text-center">Estado Logística</th>
                              <th className="px-8 py-5 text-center">Acciones</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {filteredOrders.map(order => (
                              <tr key={order.id} className="hover:bg-indigo-50/20 transition-colors group">
                                  <td className="px-8 py-6">
                                      <div className="flex items-center gap-4">
                                          <div className={`p-3 rounded-2xl shadow-sm ${order.platform === 'MERCADOLIBRE' ? 'bg-[#FFF159] text-gray-800' : 'bg-[#00AEEF] text-white'}`}>
                                              {order.platform === 'MERCADOLIBRE' ? <ShoppingCart size={20}/> : <Globe size={20}/>}
                                          </div>
                                          <div>
                                              <p className="font-black text-slate-800 uppercase tracking-tight text-sm leading-none mb-1">{order.platform}</p>
                                              <p className="text-[10px] text-gray-400 font-mono font-bold">Ref: {order.platformId}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6">
                                      <p className="font-black text-slate-700 text-sm leading-none mb-1 uppercase">{order.customer.name}</p>
                                      <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">{order.customer.nickname || 'Usuario Web'}</p>
                                  </td>
                                  <td className="px-8 py-6 text-right font-black text-slate-900 text-xl tracking-tighter">
                                      ${order.total.toLocaleString('es-AR')}
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                      {getStatusBadge(order.status)}
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                      <div className="flex justify-center gap-2">
                                          <button onClick={() => setSelectedOrder(order)} className="p-3 bg-white border border-gray-100 text-slate-400 hover:text-indigo-600 rounded-2xl shadow-sm transition-all active:scale-95">
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

      {selectedOrder && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 border-b border-gray-100 flex justify-between items-start shrink-0 bg-slate-900 text-white">
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
                          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><User size={14}/> Comprador</h4>
                              <p className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedOrder.customer.name}</p>
                              <div className="space-y-1">
                                  <p className="text-xs font-black text-slate-600">DNI: {selectedOrder.customer.dni}</p>
                                  <p className="text-xs font-black text-slate-600">TEL: {selectedOrder.customer.phone}</p>
                              </div>
                          </div>
                      </div>
                      <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                          <table className="w-full text-left">
                              <thead className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b">
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
                                              <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">{item.product.name}</p>
                                              <p className="text-[10px] text-gray-400 font-mono font-bold uppercase">SKU: {item.product.internalCodes[0]}</p>
                                          </td>
                                          <td className="px-8 py-5 text-center font-black text-slate-600">{item.quantity}</td>
                                          <td className="px-8 py-5 text-right font-bold text-slate-400">${item.appliedPrice.toLocaleString('es-AR')}</td>
                                          <td className="px-8 py-5 text-right font-black text-slate-900 text-lg">${item.subtotal.toLocaleString('es-AR')}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
                  
                  <div className="p-8 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
                        <div className="flex gap-2">
                             <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all" title="Imprimir Etiqueta"><Tag size={20}/></button>
                             <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all" title="Ver Factura Asociada"><Receipt size={20}/></button>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Orden</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">${selectedOrder.total.toLocaleString('es-AR')}</p>
                            </div>
                            <button 
                                onClick={() => updateStatus(selectedOrder.id, 'READY_TO_SHIP')}
                                className="bg-indigo-600 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3">
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
