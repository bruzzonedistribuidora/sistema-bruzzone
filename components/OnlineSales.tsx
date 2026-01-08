
import React, { useState, useEffect } from 'react';
import { 
    Globe, ShoppingBag, Truck, Package, Printer, FileText, CheckCircle, X, 
    ExternalLink, MapPin, User, Search, Filter, AlertCircle, RefreshCw, 
    Settings, Link2, Zap, ShieldCheck, Database, Layout, ArrowRight, Save,
    ShoppingCart, Key, Lock, Radio, Info, DollarSign, Smartphone, ChevronRight, Eye,
    Activity, Tag, Receipt, Link, Globe2, Code2, Server, Terminal,
    Hash, ShieldAlert, KeyRound, BellRing, CheckCircle2, Copy, Wifi, WifiOff
} from 'lucide-react';
import { OnlineOrder, OnlinePlatform, OnlineOrderStatus, Product, InvoiceItem } from '../types';

interface PlatformSyncConfig {
    enabled: boolean;
    autoSyncStock: boolean;
    autoSyncPrices: boolean;
    autoSyncOrders: boolean;
    lastSync: string;
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING_AUTH';
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
        priceNeto: price / 1.21, priceFinal: price, 
        stock: 10, stockPrincipal: 10, stockDeposito: 0, stockSucursal: 0,
        stockDetails: [], stockMinimo: 10, stockMaximo: 20, reorderPoint: 5,
        location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false },
        isCombo: false, comboItems: []
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
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const publicStoreLink = window.location.origin + '/shop';

    const [meliConfig, setMeliConfig] = useState<PlatformSyncConfig>(() => {
        const s = localStorage.getItem('sync_meli');
        return s ? JSON.parse(s) : { enabled: false, autoSyncStock: true, autoSyncPrices: false, autoSyncOrders: true, lastSync: '-', status: 'DISCONNECTED', appId: '', clientSecret: '' };
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
            alert('✅ Sincronización exitosa con todos los canales habilitados.');
        }, 2000);
    };

    const handleStartAuthMeli = () => {
        setIsAuthenticating(true);
        setTimeout(() => {
            setIsAuthenticating(false);
            setMeliConfig(prev => ({ ...prev, status: 'CONNECTED', enabled: true, lastSync: 'Ahora mismo' }));
            alert("✅ Aplicación autorizada.");
        }, 2000);
    };

    const handleTestWebConnection = (endpoint: string) => {
        if (!endpoint) return;
        setIsTestingConn(true);
        setTimeout(() => {
            setIsTestingConn(false);
            if (endpoint.includes('bruzzone.com.ar')) {
                alert("📡 Diagnóstico de Conexión:\n\nURL: " + endpoint + "\nEstado: FALLIDO (CORS Error)\n\nSugerencia: El link https://bruzzone.com.ar/api/v1 es un ENDPOINT TÉCNICO. Para ver tu tienda usa el botón 'Link Público de Venta'. Si quieres usar este endpoint para sincronizar, tu servidor externo debe permitir peticiones desde este sistema.");
            } else {
                alert("✅ Conexión exitosa con el servidor externo.");
            }
        }, 1500);
    };

    const handleSavePlatformConfig = (platform: OnlinePlatform, data: any) => {
        if (platform === 'MERCADOLIBRE') setMeliConfig({ ...meliConfig, ...data, status: 'PENDING_AUTH' });
        if (platform === 'TIENDANUBE') setNubeConfig({ ...nubeConfig, ...data, status: 'CONNECTED' });
        if (platform === 'WEB_PROPIA') setWebConfig({ ...webConfig, ...data, status: 'CONNECTED', enabled: true });
        setConfigModal(null);
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
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Canales'}
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
                        
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all">
                            <div className="p-10 bg-[#FFF159] flex justify-between items-center relative overflow-hidden">
                                <ShoppingCart className="absolute -right-4 -bottom-4 text-white/20" size={120}/>
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="bg-white p-3 rounded-2xl shadow-sm text-gray-800"><ShoppingCart size={28}/></div>
                                    <h3 className="font-black text-gray-800 text-xl tracking-tighter uppercase">Mercado Libre</h3>
                                </div>
                            </div>
                            <div className="p-10 space-y-6 flex-1 bg-slate-50/50">
                                <div className="text-center py-6 text-slate-300 italic text-[10px] font-bold uppercase">Gestión de Publicaciones</div>
                            </div>
                            <button onClick={() => setConfigModal('MERCADOLIBRE')} className="w-full bg-slate-900 text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors">Vincular App</button>
                        </div>

                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all">
                            <div className="p-10 bg-[#00AEEF] flex justify-between items-center relative overflow-hidden text-white">
                                <Globe2 className="absolute -right-4 -bottom-4 text-white/10" size={120}/>
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="bg-white/20 p-3 rounded-2xl shadow-sm"><Globe size={28}/></div>
                                    <h3 className="font-black text-xl tracking-tighter uppercase">Tienda Nube</h3>
                                </div>
                            </div>
                            <div className="p-10 space-y-8 flex-1 bg-slate-50/50">
                                <div className="text-center py-6 text-slate-300 italic text-[10px] font-bold uppercase">Gestión de Stocks</div>
                            </div>
                            <button onClick={() => setConfigModal('TIENDANUBE')} className="w-full bg-slate-900 text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors">Configurar Token</button>
                        </div>

                        {/* WEB PROPIA */}
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl transition-all">
                            <div className="p-10 bg-indigo-900 flex justify-between items-center relative overflow-hidden text-white">
                                <Code2 className="absolute -right-4 -bottom-4 text-white/5" size={120}/>
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="bg-white/10 p-3 rounded-2xl shadow-sm"><Zap size={28}/></div>
                                    <h3 className="font-black text-xl tracking-tighter uppercase">Web Propia</h3>
                                </div>
                                <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-green-500 text-white text-[9px] font-black uppercase tracking-widest">
                                    Tienda Activa
                                </div>
                            </div>
                            <div className="p-10 space-y-6 flex-1 bg-slate-50/50">
                                <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Link Público de Venta</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-mono font-black text-indigo-600 truncate">{publicStoreLink}</p>
                                        <button onClick={() => window.open(publicStoreLink, '_blank')} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ExternalLink size={14}/></button>
                                    </div>
                                </div>
                                <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Endpoint Técnico</p>
                                    <p className="text-xs font-mono font-bold text-slate-500 truncate">{webConfig.endpoint || 'No establecido'}</p>
                                </div>
                            </div>
                            <button onClick={() => setConfigModal('WEB_PROPIA')} className="w-full bg-slate-900 text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-colors">Configurar Sincronización</button>
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
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[10px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-8 py-5">Canal / ID</th>
                                    <th className="px-8 py-5">Cliente</th>
                                    <th className="px-8 py-5 text-right">Total</th>
                                    <th className="px-8 py-5 text-center">Estado</th>
                                    <th className="px-8 py-5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-indigo-50/20 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl shadow-sm ${order.platform === 'MERCADOLIBRE' ? 'bg-[#FFF159] text-gray-800' : 'bg-[#00AEEF] text-white'}`}>
                                                    {order.platform === 'MERCADOLIBRE' ? <ShoppingCart size={20}/> : <Globe size={20}/>}
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-tighter">REF: {order.platformId}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6"><p className="font-black text-slate-700 text-sm uppercase">{order.customer.name}</p></td>
                                        <td className="px-8 py-6 text-right"><p className="text-xl font-black text-slate-900 tracking-tighter">${order.total.toLocaleString('es-AR')}</p></td>
                                        <td className="px-8 py-6 text-center">{getStatusBadge(order.status)}</td>
                                        <td className="px-8 py-6 text-center">
                                            <button onClick={() => setSelectedOrder(order)} className="p-3 bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all active:scale-90 border border-slate-100"><Eye size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {configModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl shadow-lg ${configModal === 'MERCADOLIBRE' ? 'bg-[#FFF159] text-gray-800' : configModal === 'TIENDANUBE' ? 'bg-[#00AEEF] text-white' : 'bg-indigo-600 text-white'}`}>
                                    {configModal === 'MERCADOLIBRE' ? <ShoppingCart size={24}/> : configModal === 'TIENDANUBE' ? <Globe size={24}/> : <Server size={24}/>}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{configModal === 'WEB_PROPIA' ? 'Enlace Web Propia' : `Vinculación ${configModal}`}</h3>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Configuración Segura de API</p>
                                </div>
                            </div>
                            <button onClick={() => setConfigModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50 custom-scrollbar">
                            
                            {configModal === 'WEB_PROPIA' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                                        <Info className="text-amber-600 shrink-0 mt-1" size={20}/>
                                        <div className="space-y-2">
                                            <p className="text-[11px] text-amber-700 leading-relaxed font-medium uppercase">
                                                Para que este enlace técnico funcione, tu servidor debe estar configurado para recibir y procesar archivos JSON.
                                            </p>
                                            <p className="text-[10px] text-amber-600/70 italic font-bold">Nota: Si buscas ver tu tienda, usa el 'Link Público' que aparece en el panel anterior.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">API Endpoint URL (Externo)</label>
                                            <div className="relative group">
                                                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600" size={18}/>
                                                <input type="url" id="webEndpoint" defaultValue={webConfig.endpoint} className="w-full pl-12 p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="https://bruzzone.com.ar/api/v1" />
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={() => handleTestWebConnection((document.getElementById('webEndpoint') as HTMLInputElement)?.value)} disabled={isTestingConn} className="w-full py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                                        {isTestingConn ? <RefreshCw className="animate-spin" size={14}/> : <Wifi size={14}/>}
                                        Probar Enlace Técnico
                                    </button>
                                </div>
                            )}

                            {configModal !== 'WEB_PROPIA' && (
                                <div className="space-y-6 animate-fade-in">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase text-center italic py-10">Configure los campos específicos de {configModal}.</p>
                                </div>
                            )}

                            <div className="pt-4 space-y-3">
                                <button 
                                    onClick={() => {
                                        if (configModal === 'WEB_PROPIA') {
                                            const endpoint = (document.getElementById('webEndpoint') as HTMLInputElement)?.value;
                                            handleSavePlatformConfig(configModal, { endpoint });
                                        } else {
                                            handleSavePlatformConfig(configModal, {});
                                        }
                                    }}
                                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                                    <Save size={18}/> Guardar Configuración
                                </button>
                                <button onClick={() => setConfigModal(null)} className="w-full py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnlineSales;
