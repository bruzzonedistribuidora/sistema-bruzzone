
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Printer, CheckSquare, Square, FileText, 
    User, ClipboardList, AlertCircle, X, 
    Minus, Package, Trash2, History, CheckCircle, 
    ChevronRight, DollarSign, UserSearch, Filter,
    TrendingUp, Receipt, Pencil, PlusCircle, ShoppingBag, ShoppingCart, Download,
    PackagePlus, Save, Truck, RefreshCw
} from 'lucide-react';
import { Product, Remito, RemitoItem, Client, InvoiceItem } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';

interface RemitosProps {
    initialItems?: InvoiceItem[];
    onItemsConsumed?: () => void;
    onBillRemitos?: (items: InvoiceItem[]) => void;
}

const Remitos: React.FC<RemitosProps> = ({ initialItems, onItemsConsumed, onBillRemitos }) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [selectedClient, setSelectedClient] = useState('');
  const [cart, setCart] = useState<RemitoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  
  const [historyFilter, setHistoryFilter] = useState<'PENDING' | 'BILLED' | 'ALL'>('PENDING');
  const [selectedRemitoIds, setSelectedRemitoIds] = useState<string[]>([]);
  const [showPrintModal, setShowPrintModal] = useState<Remito | null>(null);
  const [editingRemitoId, setEditingRemitoId] = useState<string | null>(null);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualItemForm, setManualItemForm] = useState({ name: '', price: '' });

  const [allClients] = useState<Client[]>(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));
  const [existingRemitos, setExistingRemitos] = useState<Remito[]>(() => JSON.parse(localStorage.getItem('ferrecloud_remitos') || '[]'));

  // Lógica de búsqueda optimizada para 140k artículos
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

  const handlePedir = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    if (addToReplenishmentQueue(p)) {
        alert(`Articulo ${p.name} enviado a reposición.`);
    }
  };

  const handleAddManualItem = () => {
    if (!manualItemForm.name || !manualItemForm.price) return;
    
    const priceNum = parseFloat(manualItemForm.price);
    const mockProduct: Product = {
        id: `manual-rem-${Date.now()}`,
        internalCodes: ['VARIO'],
        barcodes: [],
        providerCodes: [],
        name: manualItemForm.name.toUpperCase(),
        brand: 'GENERICO',
        provider: '',
        description: 'Ingreso manual desde Remitos',
        category: 'VARIOS',
        measureUnitSale: 'Unidad',
        measureUnitPurchase: 'Unidad',
        conversionFactor: 1,
        purchaseCurrency: 'ARS',
        saleCurrency: 'ARS',
        vatRate: 21.0,
        listCost: priceNum * 0.7,
        purchasePackageQuantity: 1,
        discounts: [0,0,0,0],
        costAfterDiscounts: priceNum * 0.7,
        profitMargin: 30,
        priceNeto: priceNum / 1.21,
        priceFinal: priceNum,
        stock: 0,
        stockPrincipal: 0,
        stockDeposito: 0,
        stockSucursal: 0,
        stockDetails: [],
        stockMinimo: 0,
        stockMaximo: 0,
        reorderPoint: 0,
        location: '',
        ecommerce: {},
        isCombo: false,
        comboItems: []
    };

    setCart(prev => [...prev, { product: mockProduct, quantity: 1, historicalPrice: priceNum }]);
    setIsManualModalOpen(false);
    setManualItemForm({ name: '', price: '' });
  };

  const handleCreateRemito = () => {
    if (!selectedClient || cart.length === 0) return;

    if (editingRemitoId) {
        setExistingRemitos(prev => prev.map(r => r.id === editingRemitoId ? {
            ...r,
            clientName: selectedClient,
            items: [...cart]
        } : r));
        setEditingRemitoId(null);
        alert("Remito actualizado correctamente.");
    } else {
        const newRemito: Remito = {
          id: `R-${Math.floor(Math.random() * 10000)}`,
          clientId: selectedClient,
          clientName: selectedClient,
          items: [...cart],
          date: new Date().toISOString().split('T')[0],
          status: 'PENDING'
        };
        setExistingRemitos([newRemito, ...existingRemitos]);
    }
    
    setCart([]);
    setSelectedClient('');
    setActiveTab('HISTORY');
  };

  const handleEditRemito = (remito: Remito) => {
    setEditingRemitoId(remito.id);
    setSelectedClient(remito.clientName);
    setCart([...remito.items]);
    setActiveTab('NEW');
  };

  const cancelEdit = () => {
    setEditingRemitoId(null);
    setCart([]);
    setSelectedClient('');
  };

  const convertRemitoToSale = (remito: Remito) => {
      const items: InvoiceItem[] = remito.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          appliedPrice: item.historicalPrice,
          subtotal: item.quantity * item.historicalPrice
      }));
      onBillRemitos?.(items);
  };

  const handleBillSelected = () => {
      if (!onBillRemitos || selectedRemitoIds.length === 0) return;
      const selected = existingRemitos.filter(r => selectedRemitoIds.includes(r.id));
      const allItems: InvoiceItem[] = [];
      selected.forEach(remito => {
          remito.items.forEach(item => {
              const existing = allItems.find(ai => ai.product.id === item.product.id);
              if (existing) {
                  existing.quantity += item.quantity;
                  existing.subtotal = existing.quantity * existing.appliedPrice;
              } else {
                  allItems.push({
                      product: item.product,
                      quantity: item.quantity,
                      appliedPrice: item.historicalPrice,
                      subtotal: item.quantity * item.historicalPrice
                  });
              }
          });
      });
      onBillRemitos(allItems);
  };

  const filteredRemitos = useMemo(() => {
    return existingRemitos.filter(r => {
        const matchesStatus = historyFilter === 'ALL' || r.status === historyFilter;
        const matchesSearch = r.clientName.toLowerCase().includes(historySearch.toLowerCase()) || 
                             r.id.toLowerCase().includes(historySearch.toLowerCase());
        return matchesStatus && matchesSearch;
    });
  }, [existingRemitos, historyFilter, historySearch]);

  const toggleSelectAllVisible = () => {
      if (selectedRemitoIds.length === filteredRemitos.length && filteredRemitos.length > 0) {
          setSelectedRemitoIds([]);
      } else {
          setSelectedRemitoIds(filteredRemitos.map(r => r.id));
      }
  };

  return (
    <div className="p-4 h-full flex flex-col space-y-3 bg-slate-100 overflow-hidden">
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm shrink-0 print:hidden">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <ClipboardList size={18} className="text-indigo-600"/> Remitos de Entrega
        </h2>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button onClick={() => setActiveTab('NEW')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${activeTab === 'NEW' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>
            {editingRemitoId ? 'Editando Remito' : 'Nuevo'}
          </button>
          <button onClick={() => { setActiveTab('HISTORY'); setEditingRemitoId(null); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>Historial</button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="flex-1 flex overflow-hidden gap-6 p-2">
          <div className="flex-[3] flex flex-col gap-6 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
                <div className="md:col-span-4 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Cliente Destino</label>
                    <select className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-xs uppercase" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                        <option value="">-- SELECCIONE --</option>
                        {allClients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div className="md:col-span-8 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-1.5 relative">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Añadir Artículos (SKU/Prov/EAN)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            {isSearching ? <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" size={14}/> : <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />}
                            <input type="text" placeholder="Buscar por código o nombre..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-100 rounded-xl font-bold text-xs outline-none focus:bg-white uppercase" value={searchTerm} onFocus={() => setShowSearchResults(true)} onChange={e => { setSearchTerm(e.target.value); setShowSearchResults(true); }} />
                        </div>
                        <button 
                            onClick={() => setIsManualModalOpen(true)}
                            className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-indigo-100 transition-all"
                            title="Agregar artículo no listado">
                            <PackagePlus size={14}/> Manual
                        </button>
                    </div>
                    {showSearchResults && searchTerm.trim().length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border rounded-2xl shadow-2xl mt-1 max-h-80 overflow-y-auto z-50 p-1 custom-scrollbar">
                            {searchResults.length > 0 ? (
                                searchResults.map(p => (
                                    <button key={p.id} onClick={() => addToCart(p)} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg flex justify-between items-center border-b last:border-0 border-gray-50 group">
                                        <div>
                                            <p className="font-black text-slate-800 uppercase text-[10px]">{p.name}</p>
                                            <div className="flex gap-2 text-[7px] font-bold text-gray-400 uppercase">
                                                <span>INT: {p.internalCodes[0]}</span>
                                                <span>PROV: {p.providerCodes[0] || 'S/D'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div onClick={(e) => { e.stopPropagation(); handlePedir(e, p); }} className="p-2 bg-slate-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><Truck size={14}/></div>
                                            <p className="text-[10px] font-black text-indigo-600">${p.priceFinal}</p>
                                        </div>
                                    </button>
                                ))
                            ) : !isSearching && (
                                <div className="p-4 text-center text-slate-400 text-[10px] font-bold">Sin resultados para "{searchTerm}"</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Descripción del Artículo</th>
                                <th className="px-6 py-4 text-center">Cant.</th>
                                <th className="px-6 py-4 text-right">P. Unitario</th>
                                <th className="px-6 py-4 text-center"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item, i) => (
                                <tr key={i} className="border-b last:border-0 text-[11px] hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-black uppercase text-slate-800 leading-none mb-1">{item.product.name}</p>
                                        <div className="flex gap-2">
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{item.product.internalCodes[0]}</p>
                                            {item.product.id.startsWith('manual-rem') && (
                                                <span className="text-[7px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-widest">No Listado</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3 bg-slate-50 border rounded-xl p-1 w-fit mx-auto">
                                            <button onClick={() => setCart(cart.map((it, idx) => i === idx ? {...it, quantity: Math.max(1, it.quantity - 1)} : it))}><Minus size={14}/></button>
                                            <span className="font-black w-6 text-center">{item.quantity}</span>
                                            <button onClick={() => setCart(cart.map((it, idx) => i === idx ? {...it, quantity: it.quantity + 1} : it))}><Plus size={14}/></button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900">${item.historicalPrice.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center"><button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button></td>
                                </tr>
                            ))}
                            {cart.length === 0 && (
                                <tr><td colSpan={4} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest">Remito vacío</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          <div className="w-[350px] flex flex-col gap-4">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex-1 flex flex-col">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><ClipboardList size={140}/></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-8 border-b border-white/10 pb-4">Resumen Despacho</h3>
                  <div className="space-y-6 flex-1">
                      <div className="flex justify-between items-end border-b border-white/5 pb-4">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Items totales</p>
                          <p className="text-xl font-black">{cart.length}</p>
                      </div>
                      <div className="mt-auto">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3">Valor Estimado</p>
                        <p className="text-5xl font-black tracking-tighter text-white leading-none">${cart.reduce((a,c) => a + (c.historicalPrice * c.quantity), 0).toLocaleString('es-AR')}</p>
                      </div>
                  </div>
              </div>
              <div className="space-y-2">
                  <button onClick={handleCreateRemito} disabled={!selectedClient || cart.length === 0} className="w-full py-5 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 transition-all">
                      <Save size={18}/> {editingRemitoId ? 'Confirmar Cambios' : 'Generar Remito'}
                  </button>
                  {editingRemitoId && (
                      <button onClick={cancelEdit} className="w-full py-3 text-[10px] font-black uppercase text-slate-400 hover:text-red-500">Cancelar Edición</button>
                  )}
              </div>
          </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in print:hidden">
             <div className="p-3 border-b border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-gray-50/50">
                <div className="flex flex-wrap gap-2">
                    {['PENDING', 'BILLED', 'ALL'].map(f => (
                        <button key={f} onClick={() => { setHistoryFilter(f as any); setSelectedRemitoIds([]); }} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${historyFilter === f ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                            {f === 'PENDING' ? 'Pendientes' : f === 'BILLED' ? 'Facturados' : 'Todo'}
                        </button>
                    ))}
                </div>

                <div className="flex-1 max-w-md w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Buscar por cliente o remito..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-50 uppercase transition-all"
                        value={historySearch}
                        onChange={e => setHistorySearch(e.target.value)}
                    />
                </div>

                {selectedRemitoIds.length > 0 && (
                    <button onClick={handleBillSelected} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2 active:scale-95 transition-transform">
                        <ShoppingBag size={14}/> Facturar Seleccionados ({selectedRemitoIds.length})
                    </button>
                )}
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 sticky top-0 z-10 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b">
                   <tr>
                     <th className="px-6 py-4 text-center w-10">
                         {historyFilter === 'PENDING' && (
                             <button onClick={toggleSelectAllVisible} className="hover:text-indigo-600 transition-colors">
                                {(selectedRemitoIds.length === filteredRemitos.length && filteredRemitos.length > 0) ? <CheckSquare size={18} className="text-indigo-600"/> : <Square size={18}/>}
                             </button>
                         )}
                     </th>
                     <th className="px-6 py-4">ID / Fecha</th>
                     <th className="px-6 py-4">Cliente</th>
                     <th className="px-6 py-4 text-right">Monto</th>
                     <th className="px-6 py-4 text-center">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y text-[11px]">
                   {filteredRemitos.length === 0 ? (
                       <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">No se encontraron remitos</td></tr>
                   ) : filteredRemitos.map(remito => (
                        <tr key={remito.id} className={`hover:bg-indigo-50/20 transition-colors group ${selectedRemitoIds.includes(remito.id) ? 'bg-indigo-50/50' : ''}`}>
                          <td className="px-6 py-4 text-center">
                            {remito.status === 'PENDING' && (
                                <button onClick={() => setSelectedRemitoIds(prev => prev.includes(remito.id) ? prev.filter(x => x !== remito.id) : [...prev, remito.id])}>
                                    {selectedRemitoIds.includes(remito.id) ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} className="text-gray-300 group-hover:text-indigo-300" />}
                                </button>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{remito.id}</div>
                            <div className="text-[8px] text-gray-400 font-mono uppercase font-bold">{remito.date}</div>
                          </td>
                          <td className="px-6 py-4 font-black text-slate-600 uppercase truncate max-w-[200px]">{remito.clientName}</td>
                          <td className="px-6 py-4 text-right font-black text-slate-900">${remito.items.reduce((a,c) => a + (c.historicalPrice * c.quantity), 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                              <div className="flex justify-center gap-2">
                                {remito.status === 'PENDING' && (
                                    <>
                                        <button onClick={() => handleEditRemito(remito)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Editar"><Pencil size={14}/></button>
                                        <button onClick={() => convertRemitoToSale(remito)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Facturar"><Receipt size={14}/></button>
                                    </>
                                )}
                                <button onClick={() => setShowPrintModal(remito)} className="p-2 text-gray-400 bg-slate-50 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Printer size={14}/></button>
                                <button onClick={() => setExistingRemitos(existingRemitos.filter(x => x.id !== remito.id))} className="p-2 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={14}/></button>
                              </div>
                          </td>
                        </tr>
                   ))}
                 </tbody>
               </table>
             </div>
        </div>
      )}

      {/* MODAL: AGREGAR ÍTEM MANUAL */}
      {isManualModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in print:hidden">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><PackagePlus size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Despacho Libre</h3>
                              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Artículo no listado en catálogo</p>
                          </div>
                      </div>
                      <button onClick={() => setIsManualModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>
                  <div className="p-10 space-y-8 bg-slate-50/50">
                      <div className="space-y-6">
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Descripción del Artículo</label>
                              <input 
                                  type="text" 
                                  className="w-full p-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-800 uppercase shadow-sm" 
                                  placeholder="Ej: Material de obra varios..."
                                  value={manualItemForm.name}
                                  onChange={e => setManualItemForm({...manualItemForm, name: e.target.value})}
                                  autoFocus
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Precio de Referencia ($)</label>
                              <div className="relative group">
                                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600" size={24}/>
                                  <input 
                                      type="number" 
                                      className="w-full pl-12 p-6 bg-white border-2 border-transparent rounded-[2rem] focus:border-indigo-600 outline-none font-black text-5xl text-indigo-700 shadow-sm" 
                                      placeholder="0.00"
                                      value={manualItemForm.price}
                                      onChange={e => setManualItemForm({...manualItemForm, price: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>
                      <button 
                          onClick={handleAddManualItem}
                          className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                          <Save size={24}/> Agregar al Remito
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL PRINT PREVIEW REMITO */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[200] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in print:bg-white print:p-0 print:block">
           <div className="bg-white w-full max-w-2xl shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col print:shadow-none print:rounded-none print:w-full">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 print:hidden">
                 <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><FileText size={16}/> Vista Previa de Remito</h3>
                 <button onClick={() => setShowPrintModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
                 <div className="border border-slate-100 p-10 rounded-[2.5rem] shadow-sm print:border-none print:shadow-none print:p-0">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Ferretería Bruzzone</h1>
                    <div className="flex justify-between border-b pb-6 mb-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">REMITO DE ENTREGA</p>
                            <p className="text-xl font-mono font-black">R - {showPrintModal.id}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
                             <p className="text-sm font-bold text-slate-700">{showPrintModal.date}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destinatario</p>
                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{showPrintModal.clientName}</h4>
                    </div>

                    <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-50 border-b">
                            <tr><th className="py-3 px-2">Descripción del Artículo</th><th className="py-3 px-2 text-center">Cant.</th><th className="py-3 px-2 text-right">Subtotal</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {showPrintModal.items.map((it, i) => (
                                <tr key={i}>
                                    <td className="py-4 px-2">
                                        <p className="font-black text-slate-800 uppercase text-xs">{it.product.name}</p>
                                    </td>
                                    <td className="py-4 px-2 text-center font-black text-slate-700 text-xs">{it.quantity}</td>
                                    <td className="py-4 px-2 text-right font-black text-slate-900 text-xs">${(it.quantity * it.historicalPrice).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="mt-20 grid grid-cols-2 gap-12 text-center">
                        <div className="border-t border-slate-900 pt-2">
                            <p className="text-[8px] font-black uppercase text-slate-400">Firma y Aclaración Recibido</p>
                        </div>
                        <div className="border-t border-slate-900 pt-2">
                            <p className="text-[8px] font-black uppercase text-slate-400">Control de Despacho</p>
                        </div>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t flex gap-3 print:hidden">
                 <button onClick={() => setShowPrintModal(null)} className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Cerrar</button>
                 <button onClick={() => window.print()} className="flex-1 py-4 text-[10px] font-black uppercase bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95"><Printer size={18}/> Imprimir Comprobante</button>
                 <button onClick={() => convertRemitoToSale(showPrintModal)} className="flex-1 py-4 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95"><Receipt size={18}/> Facturar Ahora</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
          @media print {
              body * { visibility: hidden; pointer-events: none; }
              .print\\:block, .print\\:block * { visibility: visible; pointer-events: auto; }
              .print\\:block { 
                  position: absolute; 
                  left: 0; 
                  top: 0; 
                  width: 100%; 
                  height: auto;
                  margin: 0;
                  padding: 0;
                  background: white;
              }
              @page { size: auto; margin: 1cm; }
          }
      `}</style>
    </div>
  );
};

export default Remitos;
