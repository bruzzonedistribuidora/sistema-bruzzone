
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Printer, CheckSquare, Square, FileText, 
    User, ClipboardList, AlertCircle, X, 
    Minus, Package, Trash2, History, CheckCircle, 
    ChevronRight, DollarSign, UserSearch, Filter,
    TrendingUp, Receipt, Pencil, PlusCircle, ShoppingBag, ShoppingCart, Download,
    PackagePlus, Save, Truck, RefreshCw, ArrowLeft, Cloud
} from 'lucide-react';
import { Product, Remito, RemitoItem, Client, InvoiceItem, CompanyConfig } from '../types';
import { productDB } from '../services/storageService';
import { syncService } from '../services/syncService';

interface RemitosProps {
    initialItems?: InvoiceItem[];
    onItemsConsumed?: () => void;
    onBillRemitos?: (items: InvoiceItem[]) => void;
}

// Fix: Changed default export to named export
export const Remitos: React.FC<RemitosProps> = ({ initialItems, onItemsConsumed, onBillRemitos }) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cart, setCart] = useState<RemitoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  
  const [historyFilter, setHistoryFilter] = useState<'PENDING' | 'BILLED' | 'ALL'>('ALL');
  const [showPrintModal, setShowPrintModal] = useState<Remito | null>(null);
  const [editingRemitoId, setEditingRemitoId] = useState<string | null>(null);

  const [allClients, setAllClients] = useState<Client[]>(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));
  const [existingRemitos, setExistingRemitos] = useState<Remito[]>(() => JSON.parse(localStorage.getItem('ferrecloud_remitos') || '[]'));
  const [companyConfig] = useState<CompanyConfig>(() => JSON.parse(localStorage.getItem('company_config') || '{}'));

  const loadDataFromStorage = () => {
    const raw = localStorage.getItem('ferrecloud_remitos');
    if (raw) {
        setExistingRemitos(JSON.parse(raw));
    }
    const rawClients = localStorage.getItem('ferrecloud_clients');
    if (rawClients) {
        setAllClients(JSON.parse(rawClients));
    }
    
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  useEffect(() => {
    window.addEventListener('ferrecloud_sync_pulse', loadDataFromStorage);
    window.addEventListener('storage', loadDataFromStorage); // Escucha cambios genéricos en storage
    window.addEventListener('ferrecloud_remitos_updated', loadDataFromStorage); // Escucha nuestro evento específico
    
    loadDataFromStorage();

    return () => {
      window.removeEventListener('ferrecloud_sync_pulse', loadDataFromStorage);
      window.removeEventListener('storage', loadDataFromStorage);
      window.removeEventListener('ferrecloud_remitos_updated', loadDataFromStorage);
    };
  }, []);

  useEffect(() => {
    const performSearch = async () => {
        if (searchTerm.trim().length > 2) {
            setIsSearching(true);
            try {
                const results = await productDB.search(searchTerm);
                setSearchResults(results);
            } catch (err) {
                console.error("Error buscando en remitos:", err);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
        const mapped = initialItems.map(item => ({
            product: item.product,
            quantity: item.quantity,
            historicalPrice: item.appliedPrice
        }));
        setCart(mapped);
        setActiveTab('NEW');
        onItemsConsumed?.();
    }
  }, [initialItems]);

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

  const normalizeQuantity = (val: string): number => {
    const normalized = val.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const updateQuantity = (idx: number, newVal: string | number) => {
    const q = typeof newVal === 'string' ? normalizeQuantity(newVal) : Math.max(0, newVal);
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: q } : item));
  };

  const handleCreateRemito = async () => {
    if (!selectedClient || cart.length === 0) {
        alert("Por favor seleccione un cliente y agregue artículos.");
        return;
    }

    const newRemito: Remito = {
        id: editingRemitoId || `R-${Date.now().toString().slice(-6)}`,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        items: [...cart],
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0, 5),
        status: 'PENDING'
    };

    const currentOnStorage = JSON.parse(localStorage.getItem('ferrecloud_remitos') || '[]');
    let updatedRemitos;
    
    if (editingRemitoId) {
        updatedRemitos = currentOnStorage.map((r: any) => r.id === editingRemitoId ? newRemito : r);
    } else {
        updatedRemitos = [newRemito, ...currentOnStorage];
    }

    setExistingRemitos(updatedRemitos);
    localStorage.setItem('ferrecloud_remitos', JSON.stringify(updatedRemitos));
    window.dispatchEvent(new Event('ferrecloud_remitos_updated')); // Disparar evento para sincronización

    // The syncService is listening to 'ferrecloud_remitos_updated' and will push the changes.
    // await syncService.pushToCloud(); // REMOVED: Redundant call

    setCart([]);
    setSelectedClient(null);
    setEditingRemitoId(null);
    setShowPrintModal(newRemito);
    alert("✅ Remito registrado y transmitido a toda la red.");
  };

  const deleteRemito = async (id: string) => {
      if (confirm('¿Desea eliminar este remito del historial?')) {
          const current = JSON.parse(localStorage.getItem('ferrecloud_remitos') || '[]');
          const updated = current.filter((r: any) => r.id !== id);
          setExistingRemitos(updated);
          localStorage.setItem('ferrecloud_remitos', JSON.stringify(updated));
          window.dispatchEvent(new Event('ferrecloud_remitos_updated')); // Disparar evento para sincronización
          // The syncService is listening to 'ferrecloud_remitos_updated' and will push the changes.
          // await syncService.pushToCloud(); // REMOVED: Redundant call
      }
  };

  const filteredRemitos = useMemo(() => {
    return existingRemitos.filter(r => {
        const matchesStatus = historyFilter === 'ALL' || r.status === historyFilter;
        const matchesSearch = r.clientName.toLowerCase().includes(historySearch.toLowerCase()) || 
                             r.id.toLowerCase().includes(historySearch.toLowerCase());
        return matchesStatus && matchesSearch;
    });
  }, [existingRemitos, historyFilter, historySearch]);

  return (
    <div className="p-4 h-full flex flex-col space-y-3 bg-slate-100 overflow-hidden font-sans">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm shrink-0 print:hidden">
        <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <ClipboardList size={22} className="text-indigo-600"/> Libro de Remitos
            </h2>
            {isSyncing && <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                <RefreshCw size={10} className="animate-spin text-indigo-600"/>
                <span className="text-[8px] font-black text-indigo-600 uppercase">Red Sincronizada</span>
            </div>}
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button onClick={() => { setActiveTab('NEW'); setEditingRemitoId(null); }} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'NEW' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>
            {editingRemitoId ? 'Editando Remito' : 'Generar Nuevo'}
          </button>
          <button onClick={() => { setActiveTab('HISTORY'); loadDataFromStorage(); }} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>Historial Central</button>
        </div>
      </div>

      {activeTab === 'NEW' ? (
        <div className="flex-1 flex overflow-hidden gap-6 p-2 animate-fade-in">
          <div className="flex-[3] flex flex-col gap-6 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0">
                <div className="md:col-span-4 bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Entidad / Cliente</label>
                    <select 
                        className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl font-black text-xs uppercase outline-none" 
                        value={selectedClient?.id || ''} 
                        onChange={(e) => setSelectedClient(allClients.find(c => c.id === e.target.value) || null)}
                    >
                        <option value="">-- SELECCIONAR CLIENTE --</option>
                        {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="md:col-span-8 bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col gap-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Buscador Maestro de Mercadería</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input type="text" placeholder="ESCANEÉ CÓDIGO O BUSQUE POR NOMBRE..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl font-black text-sm outline-none uppercase shadow-inner" value={searchTerm} onFocus={() => setShowSearchResults(true)} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    {showSearchResults && searchTerm.trim().length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl mt-2 max-h-80 overflow-y-auto z-[100] p-2 animate-fade-in">
                            {searchResults.map(p => (
                                <button key={p.id} onClick={() => addToCart(p)} className="w-full text-left p-4 hover:bg-indigo-50 rounded-2xl flex justify-between items-center border-b last:border-0 border-gray-50 group">
                                    <div>
                                        <p className="font-black text-slate-800 uppercase text-xs group-hover:text-indigo-600 transition-colors">{p.name}</p>
                                        <div className="flex gap-4 text-[9px] font-bold uppercase mt-1">
                                            <span className="text-gray-400">SKU: {p.internalCodes[0]}</span>
                                            <span className="text-indigo-500">MARCA: {p.brand || 'GENÉRICO'}</span>
                                            <span className={p.stock > 0 ? 'text-green-600' : 'text-red-500'}>STOCK: {p.stock}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-indigo-700">${p.priceFinal.toLocaleString()}</p>
                                        <PlusCircle size={20} className="text-indigo-200 group-hover:text-indigo-600 ml-auto mt-1"/>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] sticky top-0 z-10">
                            <tr>
                                <th className="px-8 py-5">Descripción de Artículos</th>
                                <th className="px-8 py-5 text-center">Cantidad</th>
                                <th className="px-8 py-5 text-right">Unitario</th>
                                <th className="px-8 py-5 text-right">Subtotal</th>
                                <th className="px-8 py-5 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {cart.length === 0 ? (
                                <tr><td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest opacity-30"><Package size={64} className="mx-auto mb-4"/> El remito está vacío</td></tr>
                            ) : cart.map((item, i) => (
                                <tr key={i} className="text-[12px] hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-4">
                                        <p className="font-black uppercase text-slate-800 leading-tight">{item.product.name}</p>
                                        <p className="text-[9px] text-indigo-500 font-mono font-bold uppercase mt-1">Ref: {item.product.internalCodes[0]}</p>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center justify-center gap-3 bg-slate-50 border rounded-xl p-1.5 w-fit mx-auto shadow-inner">
                                            <button onClick={() => updateQuantity(i, item.quantity - 1)} className="text-slate-400 hover:text-red-500"><Minus size={14}/></button>
                                            <input 
                                                type="text" 
                                                inputMode="decimal"
                                                className="font-black w-16 text-center bg-transparent outline-none text-slate-800 border-none focus:ring-0" 
                                                value={item.quantity.toString().replace('.', ',')}
                                                onChange={(e) => updateQuantity(i, e.target.value)}
                                            />
                                            <button onClick={() => updateQuantity(i, item.quantity + 1)} className="text-slate-400 hover:text-indigo-600"><Plus size={14}/></button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right font-bold text-slate-400">${item.historicalPrice.toLocaleString()}</td>
                                    <td className="px-8 py-4 text-right font-black text-slate-900 text-sm">${(item.historicalPrice * item.quantity).toLocaleString()}</td>
                                    <td className="px-8 py-4 text-center">
                                        <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="p-2 text-gray-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          <div className="w-[380px] flex flex-col gap-4 shrink-0">
              <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex-1 flex flex-col border-t-4 border-indigo-600">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Receipt size={180}/></div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-10 border-b border-white/10 pb-6">Previsualización de Cargo</h3>
                  <div className="space-y-6 flex-1">
                      <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Destinatario</p>
                          <p className="text-lg font-black uppercase truncate">{selectedClient?.name || '---'}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Items a Despachar</p>
                          <p className="text-lg font-black uppercase">{cart.length} Artículos</p>
                      </div>
                  </div>
                  <div className="pt-8 border-t border-white/10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Total Estimado</p>
                    <p className="text-5xl font-black tracking-tighter text-white leading-none font-mono">
                        ${cart.reduce((a,c) => a + (c.historicalPrice * c.quantity), 0).toLocaleString('es-AR')}
                    </p>
                  </div>
              </div>
              <button 
                onClick={handleCreateRemito} 
                disabled={!selectedClient || cart.length === 0} 
                className="w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3">
                  <Save size={20}/> {editingRemitoId ? 'Guardar Cambios' : 'Confirmar y Transmitir'}
              </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden p-2 animate-fade-in">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por Nº de Remito o Cliente..." 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl font-bold text-xs outline-none uppercase" 
                        value={historySearch} 
                        onChange={e => setHistorySearch(e.target.value)} 
                    />
                </div>
                <div className="flex gap-2">
                    {['ALL', 'PENDING', 'BILLED'].map(f => (
                        <button key={f} onClick={() => setHistoryFilter(f as any)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${historyFilter === f ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>
                            {f === 'ALL' ? 'Todo' : f === 'PENDING' ? 'Pendientes' : 'Facturados'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-8 py-5">Identificador</th>
                                <th className="px-8 py-5">Fecha Emisión</th>
                                <th className="px-8 py-5">Cliente / Entidad</th>
                                <th className="px-8 py-5 text-right">Importe Total</th>
                                <th className="px-8 py-5 text-center">Estado</th>
                                <th className="px-8 py-5 text-center">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[11px]">
                            {filteredRemitos.map(remito => (
                                <tr key={remito.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-5 font-black text-indigo-700 font-mono tracking-tighter">{remito.id}</td>
                                    <td className="px-8 py-5 font-bold text-slate-400">{remito.date}</td>
                                    <td className="px-8 py-5 font-black text-slate-800 uppercase">{remito.clientName}</td>
                                    <td className="px-8 py-5 text-right font-black text-slate-900">
                                        ${remito.items.reduce((a,c) => a + (c.historicalPrice * c.quantity), 0).toLocaleString()}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border tracking-widest ${remito.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                            {remito.status === 'PENDING' ? 'Pendiente' : 'Facturado'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => setShowPrintModal(remito)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"><Printer size={16}/></button>
                                            <button onClick={() => deleteRemito(remito.id)} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
