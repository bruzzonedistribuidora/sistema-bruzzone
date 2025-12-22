
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Printer, CheckSquare, Square, RefreshCw, FileText, 
    CreditCard, User, ClipboardList, AlertCircle, X, Send, Mail, 
    Minus, Package, Trash2, History, Link, CheckCircle, Globe, 
    ChevronRight, ArrowRight, DollarSign, UserSearch, Filter,
    TrendingUp, Receipt, Pencil
} from 'lucide-react';
import { Product, Remito, RemitoItem, Client } from '../types';

// Helper to create valid Product objects compatible with the interface
const createMockProduct = (id: string, internalCode: string, name: string, priceFinal: number, stock: number, category: string, brand: string = 'Genérico'): Product => ({
  id,
  internalCode,
  barcodes: [internalCode],
  providerCodes: [],
  name,
  brand,
  provider: 'Proveedor Demo',
  description: '',
  category,
  measureUnitSale: 'Unidad',
  measureUnitPurchase: 'Unidad',
  conversionFactor: 1,
  purchaseCurrency: 'ARS',
  saleCurrency: 'ARS',
  vatRate: 21.0,
  listCost: priceFinal * 0.6,
  discounts: [0, 0, 0, 0],
  costAfterDiscounts: priceFinal * 0.6,
  profitMargin: 30,
  priceNeto: priceFinal / 1.21,
  priceFinal: priceFinal,
  stock,
  stockDetails: [],
  minStock: 10,
  desiredStock: 20,
  reorderPoint: 5,
  location: '',
  ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
});

const Remitos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [selectedClient, setSelectedClient] = useState('');
  const [cart, setCart] = useState<RemitoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Historial & Search State
  const [historyClientSearch, setHistoryClientSearch] = useState('');
  const [historySelectedClient, setHistorySelectedClient] = useState<string | null>(null);
  const [showHistoryClientResults, setShowHistoryClientResults] = useState(false);

  // Pending Remitos Management
  const [selectedRemitoIds, setSelectedRemitoIds] = useState<string[]>([]);
  const [showPrintModal, setShowPrintModal] = useState<Remito | null>(null);
  
  // Filter for history
  const [historyFilter, setHistoryFilter] = useState<'PENDING' | 'BILLED' | 'ALL'>('PENDING');

  // Load Clients for Search
  const [allClients] = useState<Client[]>(() => {
      const saved = localStorage.getItem('ferrecloud_clients');
      return saved ? JSON.parse(saved) : [];
  });

  // --- PERSISTENCIA REAL ---
  const [existingRemitos, setExistingRemitos] = useState<(Remito & { relatedInvoice?: string })[]>(() => {
      const saved = localStorage.getItem('ferrecloud_remitos');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_remitos', JSON.stringify(existingRemitos));
  }, [existingRemitos]);

  const filteredHistoryClients = useMemo(() => {
      const term = historyClientSearch.toLowerCase().trim();
      if (!term) return [];
      return allClients.filter(c => 
          c.name.toLowerCase().includes(term) || 
          c.cuit.includes(term)
      ).slice(0, 5);
  }, [historyClientSearch, allClients]);

  // Actions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, historicalPrice: product.priceFinal }];
    });
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => {
        if (item.product.id === productId) {
            return { ...item, quantity: newQuantity };
        }
        return item;
    }));
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCreateRemito = () => {
    if (!selectedClient || cart.length === 0) return;
    const newRemito: Remito = {
      id: `R-${Math.floor(Math.random() * 10000)}`,
      clientId: selectedClient,
      clientName: selectedClient,
      items: [...cart],
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING'
    };
    setExistingRemitos([newRemito, ...existingRemitos]);
    setCart([]);
    setShowPrintModal(newRemito);
  };

  const handleDeleteRemito = (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este remito? Esta acción es irreversible.')) {
        setExistingRemitos(prev => prev.filter(r => r.id !== id));
        setSelectedRemitoIds(prev => prev.filter(rid => rid !== id));
    }
  };

  const handleEditRemito = (remito: Remito) => {
    setSelectedClient(remito.clientName);
    setCart(remito.items);
    setActiveTab('NEW');
    // Eliminamos el viejo para que sea un "reemplazo" al guardar de nuevo
    setExistingRemitos(prev => prev.filter(r => r.id !== remito.id));
  };

  const toggleRemitoSelection = (id: string) => {
    setSelectedRemitoIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getBillingTotal = () => {
    const selectedRemitos = existingRemitos.filter(r => selectedRemitoIds.includes(r.id));
    return selectedRemitos.reduce((acc, remito) => {
        return acc + remito.items.reduce((a, i) => a + (i.historicalPrice * i.quantity), 0);
    }, 0);
  };

  const getCartTotal = () => cart.reduce((acc, item) => acc + (item.quantity * item.historicalPrice), 0);

  const handleBillHistory = (type: 'ARCA' | 'INTERNAL') => {
    const invoiceNumber = type === 'ARCA' ? `FC-A-${Date.now().toString().slice(-8)}` : `INT-${Date.now().toString().slice(-8)}`;
    setExistingRemitos(prev => prev.map(r => selectedRemitoIds.includes(r.id) ? { ...r, status: 'BILLED', relatedInvoice: invoiceNumber } : r));
    
    if (type === 'INTERNAL') {
        const amount = getBillingTotal();
        const tMovs = JSON.parse(localStorage.getItem('ferrecloud_treasury_movements') || '[]');
        const newT = {
            id: `T-${Date.now()}`,
            date: new Date().toLocaleString(),
            type: 'INCOME',
            subtype: 'VENTA',
            paymentMethod: 'EFECTIVO',
            amount,
            description: `Cobro Remitos: ${selectedRemitoIds.join(', ')}`,
            cashRegisterId: '1'
        };
        localStorage.setItem('ferrecloud_treasury_movements', JSON.stringify([newT, ...tMovs]));
    }

    setSelectedRemitoIds([]);
    alert(`Comprobante ${invoiceNumber} generado con éxito.`);
  };

  const filteredRemitos = existingRemitos.filter(r => {
      const matchStatus = historyFilter === 'ALL' || r.status === historyFilter;
      const matchClient = !historySelectedClient || r.clientId === historySelectedClient || r.clientName === historySelectedClient;
      return matchStatus && matchClient;
  });

  const clientsWithDebt = useMemo(() => {
      const debtClients = existingRemitos.filter(r => r.status === 'PENDING');
      const uniqueClients = Array.from(new Set(debtClients.map(r => r.clientName)));
      return uniqueClients.map(name => ({
          name,
          count: debtClients.filter(r => r.clientName === name).length,
          total: debtClients.filter(r => r.clientName === name).reduce((acc, r) => acc + r.items.reduce((a,i) => a + (i.quantity * i.historicalPrice), 0), 0)
      })).sort((a,b) => b.total - a.total);
  }, [existingRemitos]);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Módulo de Remitos</h2>
          <p className="text-gray-500 font-medium text-sm flex items-center gap-2 mt-1">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-widest">Gestión de Entregas y Cuentas Corrientes</span>
          </p>
        </div>
        <div className="flex bg-white rounded-2xl p-1.5 border border-gray-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('NEW')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${activeTab === 'NEW' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            Nuevo Remito
          </button>
          <button 
             onClick={() => setActiveTab('HISTORY')}
             className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-widest ${activeTab === 'HISTORY' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            Historial y Facturación
          </button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden animate-fade-in">
            <div className="p-8 bg-slate-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="relative">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Seleccionar Cliente</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20}/>
                        <select 
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 shadow-sm outline-none font-bold text-slate-700 transition-all appearance-none"
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        >
                        <option value="">-- Buscar cliente en base de datos --</option>
                        {allClients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" size={16}/>
                    </div>
                </div>
                <div className="relative">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Añadir Productos</label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Escanee código o busque nombre..." 
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 shadow-sm outline-none font-bold text-slate-700 transition-all uppercase"
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setShowSearchResults(true);
                            }}
                            onFocus={() => setShowSearchResults(true)}
                        />
                    </div>
                    {showSearchResults && searchTerm && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-3xl shadow-2xl mt-2 max-h-64 overflow-y-auto z-50 animate-fade-in p-2">
                            <p className="p-4 text-[10px] font-black text-gray-400 uppercase border-b mb-2">Resultados de búsqueda</p>
                            <button onClick={() => addToCart(createMockProduct('1', 'DEMO', 'PRODUCTO DEMO', 1500, 10, 'GRAL'))} className="w-full text-left p-4 hover:bg-indigo-50 rounded-2xl transition-colors flex justify-between items-center group">
                                <div>
                                    <p className="font-black text-slate-800 uppercase tracking-tight">Producto Demo</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">SKU: DEMO-001</p>
                                </div>
                                <Plus size={20} className="text-indigo-300 group-hover:text-indigo-600"/>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Identificación</th>
                                <th className="px-8 py-5">Descripción</th>
                                <th className="px-8 py-5 text-center">Cantidad</th>
                                <th className="px-8 py-5 text-right">Unitario</th>
                                <th className="px-8 py-5 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cart.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-6 font-mono text-xs font-bold text-slate-400 uppercase">{item.product.internalCode}</td>
                                    <td className="px-8 py-6">
                                        <div className="font-black text-slate-800 uppercase tracking-tight">{item.product.name}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{item.product.category}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-4 bg-slate-50 rounded-2xl p-2 w-fit mx-auto border border-slate-100">
                                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-2 hover:text-red-500 transition-colors"><Minus size={14}/></button>
                                            <span className="font-black text-lg w-8 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-2 hover:text-green-500 transition-colors"><Plus size={14}/></button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-slate-900">${item.historicalPrice.toLocaleString('es-AR')}</td>
                                    <td className="px-8 py-6 text-center">
                                        <button onClick={() => removeItem(item.product.id)} className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20}/></button>
                                    </td>
                                </tr>
                            ))}
                            {cart.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center">
                                        <ClipboardList size={80} strokeWidth={1} className="mx-auto text-gray-200 mb-4 opacity-30"/>
                                        <p className="text-xl font-black text-slate-300 uppercase tracking-tighter">Sin artículos en el remito</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-8 border-t border-gray-100 bg-white flex items-center justify-between">
                <div className="bg-indigo-50 px-6 py-4 rounded-[1.5rem] border border-indigo-100 flex items-center gap-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600"><AlertCircle size={20}/></div>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Total a Devengar</p>
                        <p className="text-2xl font-black text-indigo-700 tracking-tighter">${getCartTotal().toLocaleString('es-AR')}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleCreateRemito}
                        disabled={!selectedClient || cart.length === 0}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-12 py-5 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl disabled:opacity-20 transition-all flex items-center gap-3">
                        <Printer size={20}/> EMITIR REMITO R
                    </button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="flex gap-8 h-full animate-fade-in overflow-hidden">
           {/* SIDEBAR: BUSCADOR DE CLIENTES Y DEUDORES */}
           <div className="w-[350px] bg-white rounded-[2.5rem] shadow-sm border border-gray-200 p-8 flex flex-col gap-8 shrink-0 overflow-hidden">
                <div className="space-y-4">
                    <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        <UserSearch size={22} className="text-indigo-600"/> Buscar Cliente
                    </h3>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600" size={18}/>
                        <input 
                            type="text"
                            placeholder="Nombre o CUIT..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700 text-sm transition-all"
                            value={historyClientSearch}
                            onChange={e => { setHistoryClientSearch(e.target.value); setShowHistoryClientResults(true); }}
                            onFocus={() => setShowHistoryClientResults(true)}
                        />
                        {historySelectedClient && (
                            <button onClick={() => { setHistorySelectedClient(null); setHistoryClientSearch(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 hover:bg-red-50 p-1 rounded-full"><X size={14}/></button>
                        )}
                    </div>
                    {showHistoryClientResults && historyClientSearch.length > 0 && (
                        <div className="absolute z-[60] left-8 w-[285px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 animate-fade-in">
                            {filteredHistoryClients.map(c => (
                                <button key={c.id} onClick={() => { setHistorySelectedClient(c.name); setShowHistoryClientResults(false); setHistoryClientSearch(c.name); }} className="w-full text-left p-4 hover:bg-indigo-50 rounded-2xl flex items-center gap-3 transition-colors group">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs group-hover:bg-white group-hover:text-indigo-600">{c.name.charAt(0)}</div>
                                    <div className="overflow-hidden">
                                        <p className="font-black text-slate-800 text-xs uppercase truncate leading-none mb-1">{c.name}</p>
                                        <p className="text-[9px] text-gray-400 font-mono">{c.cuit}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp size={14} className="text-red-400"/> Clientes con Mayor Deuda
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {clientsWithDebt.map(client => (
                            <button 
                                key={client.name} 
                                onClick={() => { setHistorySelectedClient(client.name); setHistoryClientSearch(client.name); }}
                                className={`w-full p-5 rounded-3xl border-2 transition-all text-left flex justify-between items-center group ${historySelectedClient === client.name ? 'border-indigo-600 bg-indigo-50 shadow-md ring-4 ring-indigo-50' : 'border-gray-50 hover:border-gray-200'}`}>
                                <div className="overflow-hidden">
                                    <p className={`font-black uppercase tracking-tight truncate text-sm leading-none mb-2 ${historySelectedClient === client.name ? 'text-indigo-900' : 'text-slate-800'}`}>{client.name}</p>
                                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{client.count} Remitos</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black tracking-tighter ${historySelectedClient === client.name ? 'text-indigo-600' : 'text-slate-400'}`}>${client.total.toLocaleString('es-AR')}</p>
                                    <ChevronRight size={14} className={`mt-1 transition-transform ${historySelectedClient === client.name ? 'translate-x-1 text-indigo-400' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}/>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
           </div>

           {/* MAIN: LISTA DE REMITOS FILTRADA */}
           <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex gap-3">
                    <button onClick={() => { setHistoryFilter('PENDING'); setSelectedRemitoIds([]); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${historyFilter === 'PENDING' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>Pendientes de Pago</button>
                    <button onClick={() => { setHistoryFilter('BILLED'); setSelectedRemitoIds([]); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${historyFilter === 'BILLED' ? 'bg-green-600 text-white shadow-xl shadow-green-100' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>Ya Facturados</button>
                    <button onClick={() => { setHistoryFilter('ALL'); setSelectedRemitoIds([]); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${historyFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xl shadow-slate-100' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>Todo el Historial</button>
                </div>
                {historySelectedClient && (
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm animate-fade-in">
                        <User size={14} className="text-indigo-600"/>
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Filtro: {historySelectedClient}</span>
                        <button onClick={() => { setHistorySelectedClient(null); setHistoryClientSearch(''); }} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                    </div>
                )}
             </div>

             <div className="flex-1 overflow-y-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-white sticky top-0 z-10">
                     <th className="px-8 py-5 text-center w-16">
                         {historyFilter === 'PENDING' && (
                             <button onClick={() => setSelectedRemitoIds(selectedRemitoIds.length === filteredRemitos.length ? [] : filteredRemitos.map(r => r.id))} className="text-gray-300 hover:text-indigo-600 transition-colors">
                                {selectedRemitoIds.length === filteredRemitos.length && filteredRemitos.length > 0 ? <CheckSquare size={20} className="text-indigo-600"/> : <Square size={20}/>}
                             </button>
                         )}
                     </th>
                     <th className="px-8 py-5">Comprobante / Fecha</th>
                     <th className="px-8 py-5">Cliente</th>
                     <th className="px-8 py-5 text-center">Estado</th>
                     <th className="px-8 py-5 text-right">Importe Total</th>
                     <th className="px-8 py-5 text-center">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {filteredRemitos.map(remito => (
                        <tr key={remito.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedRemitoIds.includes(remito.id) ? 'bg-indigo-50/30' : ''}`}>
                          <td className="px-8 py-6 text-center">
                            {remito.status === 'PENDING' && (
                                <button onClick={() => toggleRemitoSelection(remito.id)} className="text-gray-300 hover:text-indigo-600">
                                {selectedRemitoIds.includes(remito.id) ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                                </button>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <p className="font-mono text-xs font-black text-slate-800 leading-none mb-1">{remito.id}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{remito.date}</p>
                          </td>
                          <td className="px-8 py-6 font-black text-slate-600 uppercase text-xs tracking-tight">{remito.clientName}</td>
                          <td className="px-8 py-6 text-center">
                              <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${remito.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                  {remito.status === 'PENDING' ? 'DEUDA' : 'FACTURADO'}
                              </span>
                          </td>
                          <td className="px-8 py-6 text-right font-black text-lg text-slate-900 tracking-tighter">
                            ${remito.items.reduce((a,c) => a + (c.historicalPrice * c.quantity), 0).toLocaleString('es-AR')}
                          </td>
                          <td className="px-8 py-6 text-center">
                              <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditRemito(remito)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar Remito"><Pencil size={18}/></button>
                                <button onClick={() => setShowPrintModal(remito)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Imprimir"><Printer size={18}/></button>
                                <button onClick={() => handleDeleteRemito(remito.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Eliminar"><Trash2 size={18}/></button>
                              </div>
                          </td>
                        </tr>
                   ))}
                   {filteredRemitos.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-32 text-center text-gray-300">
                                <Filter size={48} className="mx-auto mb-4 opacity-20"/>
                                <p className="font-black uppercase tracking-tighter">No se encontraron documentos bajo este filtro</p>
                            </td>
                        </tr>
                   )}
                 </tbody>
               </table>
             </div>

             {historyFilter === 'PENDING' && (
                <div className="p-8 bg-slate-900 text-white rounded-b-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
                    <div className="flex items-center gap-8">
                        <div className="p-4 bg-white/10 rounded-3xl">
                            <CheckSquare size={32} className="text-indigo-400"/>
                        </div>
                        <div>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Seleccionado para Cobro</p>
                            <h4 className="text-4xl font-black tracking-tighter leading-none">${getBillingTotal().toLocaleString('es-AR')}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">{selectedRemitoIds.length} Documentos marcados</p>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button 
                            onClick={() => handleBillHistory('INTERNAL')} 
                            disabled={selectedRemitoIds.length === 0} 
                            className="flex-1 md:flex-none bg-white/5 hover:bg-white/10 border-2 border-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-20 flex items-center justify-center gap-2">
                            <Receipt size={16}/> INGRESO POR CAJA
                        </button>
                        <button 
                            onClick={() => handleBillHistory('ARCA')} 
                            disabled={selectedRemitoIds.length === 0} 
                            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/40 transition-all disabled:opacity-20 flex items-center justify-center gap-2">
                            <FileText size={18} /> PASAR A FACTURA (ARCA)
                        </button>
                    </div>
                </div>
             )}
           </div>
        </div>
      )}

      {/* MODAL: PREVIEW IMPRESIÓN REMITO */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[200] flex items-center justify-center backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-white w-full max-w-2xl shadow-2xl rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
                    <Printer size={20} className="text-indigo-600"/> Vista Previa de Remito
                 </h3>
                 <button onClick={() => setShowPrintModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24}/></button>
              </div>

              <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                 <div className="border border-gray-200 p-10 rounded-[2rem] shadow-sm">
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h1 className="text-3xl font-black text-indigo-600 uppercase tracking-tighter">FerreCloud</h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID Logística: {showPrintModal.id}</p>
                        </div>
                        <div className="text-right">
                            <div className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-block mb-2">Remito de Entrega</div>
                            <p className="text-sm font-bold text-slate-800 uppercase">Fecha: {showPrintModal.date}</p>
                        </div>
                    </div>

                    <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Receptor de Mercadería</p>
                        <p className="text-xl font-black text-slate-800 uppercase tracking-tight">{showPrintModal.clientName}</p>
                    </div>

                    <table className="w-full text-left mb-12">
                        <thead className="bg-slate-50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b">
                            <tr>
                                <th className="py-4 px-2 w-16">Cant</th>
                                <th className="py-4">Descripción del Artículo</th>
                                <th className="py-4 text-right">Ref. Valor</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-50">
                            {showPrintModal.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="py-4 px-2 font-black text-indigo-600 text-lg">{item.quantity}</td>
                                    <td className="py-4">
                                        <p className="font-bold text-slate-800 uppercase">{item.product.name}</p>
                                        <p className="text-[9px] text-gray-400 font-mono">SKU: {item.product.internalCode}</p>
                                    </td>
                                    <td className="py-4 text-right font-medium text-slate-500">${item.historicalPrice.toLocaleString('es-AR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-20 flex flex-col md:flex-row justify-between items-end gap-8 border-t-2 border-dashed border-gray-100 pt-10">
                        <div className="text-center w-full md:w-64">
                            <div className="h-10 border-b border-slate-300"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase mt-4">Firma de Entrega (FerreCloud)</p>
                        </div>
                        <div className="text-center w-full md:w-64">
                            <div className="h-10 border-b border-slate-300"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase mt-4">Conformidad de Recepción</p>
                        </div>
                    </div>
                 </div>
              </div>
              
              <div className="p-8 border-t border-gray-100 bg-gray-50 flex gap-4">
                 <button onClick={() => setShowPrintModal(null)} className="flex-1 py-4 bg-white border border-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">Cerrar</button>
                 <button className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
                    <Printer size={18} /> Imprimir Comprobante
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Remitos;
