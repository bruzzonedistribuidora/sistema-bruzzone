
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Printer, CheckSquare, Square, FileText, 
    User, ClipboardList, AlertCircle, X, 
    Minus, Package, Trash2, History, CheckCircle, 
    ChevronRight, DollarSign, UserSearch, Filter,
    TrendingUp, Receipt, Pencil, PlusCircle, ShoppingBag, ShoppingCart, Download,
    PackagePlus, Save, Truck, RefreshCw, ArrowLeft
} from 'lucide-react';
import { Product, Remito, RemitoItem, Client, InvoiceItem, CompanyConfig } from '../types';
import { productDB } from '../services/storageService';
import { syncService } from '../services/syncService';

interface RemitosProps {
    initialItems?: InvoiceItem[];
    onItemsConsumed?: () => void;
    onBillRemitos?: (items: InvoiceItem[]) => void;
}

const Remitos: React.FC<RemitosProps> = ({ initialItems, onItemsConsumed, onBillRemitos }) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cart, setCart] = useState<RemitoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  
  const [historyFilter, setHistoryFilter] = useState<'PENDING' | 'BILLED' | 'ALL'>('ALL');
  const [showPrintModal, setShowPrintModal] = useState<Remito | null>(null);
  const [editingRemitoId, setEditingRemitoId] = useState<string | null>(null);

  const [allClients] = useState<Client[]>(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));
  const [existingRemitos, setExistingRemitos] = useState<Remito[]>(() => JSON.parse(localStorage.getItem('ferrecloud_remitos') || '[]'));
  const [companyConfig] = useState<CompanyConfig>(() => JSON.parse(localStorage.getItem('company_config') || '{}'));

  // ESCUCHAR PULSO DE SINCRONIZACIÓN PARA ACTUALIZAR HISTORIAL
  useEffect(() => {
    const handleSync = () => {
        const updated = JSON.parse(localStorage.getItem('ferrecloud_remitos') || '[]');
        setExistingRemitos(updated);
    };
    window.addEventListener('ferrecloud_sync_pulse', handleSync);
    return () => window.removeEventListener('ferrecloud_sync_pulse', handleSync);
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

  useEffect(() => {
      localStorage.setItem('ferrecloud_remitos', JSON.stringify(existingRemitos));
  }, [existingRemitos]);

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

  const updateQuantity = (idx: number, newQty: number) => {
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: newQty } : item));
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
        date: new Date().toLocaleDateString(),
        status: 'PENDING'
    };

    let updatedRemitos;
    if (editingRemitoId) {
        updatedRemitos = existingRemitos.map(r => r.id === editingRemitoId ? newRemito : r);
        setEditingRemitoId(null);
    } else {
        updatedRemitos = [newRemito, ...existingRemitos];
    }

    setExistingRemitos(updatedRemitos);
    localStorage.setItem('ferrecloud_remitos', JSON.stringify(updatedRemitos));

    // DISPARAR SINCRONIZACION INMEDIATA
    await syncService.pushToCloud();
    
    setCart([]);
    setSelectedClient(null);
    setShowPrintModal(newRemito);
    alert("✅ Remito registrado y sincronizado en todas las terminales.");
  };

  const deleteRemito = async (id: string) => {
      if (confirm('¿Desea eliminar este remito del historial?')) {
          const updated = existingRemitos.filter(r => r.id !== id);
          setExistingRemitos(updated);
          localStorage.setItem('ferrecloud_remitos', JSON.stringify(updated));
          await syncService.pushToCloud();
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
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
          <ClipboardList size={22} className="text-indigo-600"/> Remitos de Entrega
        </h2>
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button onClick={() => { setActiveTab('NEW'); setEditingRemitoId(null); }} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'NEW' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>
            {editingRemitoId ? 'Editando Remito' : 'Generar Nuevo'}
          </button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>Historial Registros</button>
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
                            {searchResults.length === 0 && !isSearching && <p className="p-10 text-center text-slate-300 font-black uppercase tracking-widest text-xs">No se encontraron artículos</p>}
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
                                            <button onClick={() => updateQuantity(i, Math.max(0, item.quantity - 1))} className="text-slate-400 hover:text-red-500"><Minus size={14}/></button>
                                            <input 
                                                type="number" 
                                                step="0.001"
                                                className="font-black w-16 text-center bg-transparent outline-none text-slate-800" 
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(i, parseFloat(e.target.value.replace(',', '.')) || 0)}
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
                  <Save size={20}/> {editingRemitoId ? 'Guardar Cambios' : 'Confirmar y Generar Remito'}
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
                <div className="flex-1 overflow-y-auto">
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
                            {filteredRemitos.length === 0 && (
                                <tr><td colSpan={6} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest opacity-20"><History size={48} className="mx-auto mb-4"/> No hay registros en este filtro</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* MODAL DE IMPRESIÓN */}
      {showPrintModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in print:p-0">
              <div className="bg-white w-full max-w-4xl h-[92vh] shadow-2xl rounded-[3rem] overflow-hidden flex flex-col animate-scale-up print:h-auto print:shadow-none print:rounded-none print:fixed print:inset-0">
                  <div className="p-6 border-b flex justify-between items-center bg-slate-50 print:hidden shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><Printer size={20}/></div>
                          <div>
                              <h3 className="font-black text-gray-800 uppercase tracking-widest leading-none">Impresión de Remito</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">ID: {showPrintModal.id}</p>
                          </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-2">
                            <Printer size={16}/> Mandar a Impresora
                        </button>
                        <button onClick={() => setShowPrintModal(null)} className="p-3 bg-white text-slate-400 hover:text-red-500 border border-slate-200 rounded-2xl transition-colors"><X size={24}/></button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0 print:overflow-visible">
                      <div className="border border-slate-100 p-10 rounded-[2.5rem] shadow-sm print:border-none print:p-0 print:shadow-none bg-white">
                          <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
                              <div>
                                  <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">{companyConfig.fantasyName || 'FERRETERIA BRUZZONE'}</h1>
                                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{companyConfig.address || 'Av. del Libertador 1200'} | CUIT: {companyConfig.cuit || '30-12345678-9'}</p>
                                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{companyConfig.phone || '011-4455-6677'}</p>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                  <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl flex flex-col items-center mb-2">
                                      <span className="text-[10px] font-black tracking-[0.4em] mb-1">REMITO</span>
                                      <span className="text-3xl font-mono font-black">{showPrintModal.id}</span>
                                  </div>
                                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Emisión: {showPrintModal.date}</p>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-10 mb-12">
                              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4">Destinatario de Mercadería</p>
                                  <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">{showPrintModal.clientName}</h4>
                                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Condición: Cuenta Corriente</p>
                              </div>
                              <div className="flex flex-col justify-center text-right p-8 border-r-4 border-slate-900 pr-8">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lugar de Entrega</p>
                                  <p className="text-sm font-black text-slate-800 uppercase">A convenir en domicilio fiscal</p>
                              </div>
                          </div>

                          <table className="w-full text-left mb-12">
                              <thead>
                                  <tr className="bg-slate-900 text-white">
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-tl-2xl">Descripción Artículo</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Cant.</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">P. Unitario</th>
                                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right rounded-tr-2xl">Subtotal</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 border-x border-b border-slate-100">
                                  {showPrintModal.items.map((item, idx) => (
                                      <tr key={idx} className="text-slate-800">
                                          <td className="px-6 py-4">
                                              <p className="font-black uppercase text-xs">{item.product.name}</p>
                                              <p className="text-[9px] font-mono font-bold text-slate-400 uppercase mt-0.5">SKU: {item.product.internalCodes[0]}</p>
                                          </td>
                                          <td className="px-6 py-4 text-center font-black text-sm">{item.quantity}</td>
                                          <td className="px-6 py-4 text-right font-bold text-slate-400">${item.historicalPrice.toLocaleString()}</td>
                                          <td className="px-6 py-4 text-right font-black text-sm">${(item.historicalPrice * item.quantity).toLocaleString()}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>

                          <div className="flex justify-between items-end gap-10">
                              <div className="flex-1">
                                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 border-dashed mb-6">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Firma y Aclaración Receptor</p>
                                      <div className="h-20 border-b border-slate-300 w-full mb-2"></div>
                                      <p className="text-[8px] text-center text-slate-300 font-bold uppercase">Mercadería recibida de conformidad</p>
                                  </div>
                              </div>
                              <div className="w-80 space-y-4">
                                  <div className="flex justify-between items-baseline pt-4 border-t-2 border-slate-900">
                                      <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Total Remitado</p>
                                      <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none font-mono">
                                          ${showPrintModal.items.reduce((a,c) => a + (c.historicalPrice * c.quantity), 0).toLocaleString('es-AR')}
                                      </p>
                                  </div>
                              </div>
                          </div>

                          <div className="mt-20 text-center border-t border-slate-100 pt-8 opacity-40">
                              <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.4em]">Documento No Válido como Factura • Sistema de Gestión FerreCloud</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        @keyframes scale-up {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-up {
            animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media print {
            body * { visibility: hidden; }
            .print\\:hidden { display: none !important; }
            .animate-scale-up, .animate-scale-up * { visibility: visible; }
            .animate-scale-up {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: auto;
                background: white !important;
                box-shadow: none !important;
                padding: 0 !important;
            }
            @page { 
                margin: 1cm; 
                size: portrait;
            }
        }
      `}</style>
    </div>
  );
};

export default Remitos;
