
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Printer, CheckSquare, Square, FileText, 
    User, ClipboardList, AlertCircle, X, 
    Minus, Package, Trash2, History, CheckCircle, 
    ChevronRight, DollarSign, UserSearch, Filter,
    TrendingUp, Receipt, Pencil, PlusCircle, ShoppingBag, ShoppingCart
} from 'lucide-react';
import { Product, Remito, RemitoItem, Client, InvoiceItem } from '../types';

interface RemitosProps {
    onBillRemitos?: (items: InvoiceItem[]) => void;
}

// Fix: Updated createMockProduct to use internalCodes array property instead of internalCode
const createMockProduct = (id: string, internalCode: string, name: string, priceFinal: number, stock: number, category: string, brand: string = 'Genérico'): Product => ({
  id, internalCodes: [internalCode], barcodes: [internalCode], providerCodes: [],
  name, brand, provider: 'Proveedor Demo', description: '',
  category, measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
  vatRate: 21.0, listCost: priceFinal * 0.6, discounts: [0, 0, 0, 0], costAfterDiscounts: priceFinal * 0.6, profitMargin: 30,
  priceNeto: priceFinal / 1.21, priceFinal: priceFinal, stock, stockDetails: [], minStock: 10, desiredStock: 20, reorderPoint: 5,
  location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
});

const Remitos: React.FC<RemitosProps> = ({ onBillRemitos }) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [selectedClient, setSelectedClient] = useState('');
  const [cart, setCart] = useState<RemitoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', price: 0 });

  const [historyClientSearch, setHistoryClientSearch] = useState('');
  const [historySelectedClient, setHistorySelectedClient] = useState<string | null>(null);
  const [showHistoryClientResults, setShowHistoryClientResults] = useState(false);

  const [selectedRemitoIds, setSelectedRemitoIds] = useState<string[]>([]);
  const [showPrintModal, setShowPrintModal] = useState<Remito | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'PENDING' | 'BILLED' | 'ALL'>('PENDING');

  // Carga de maestros
  const [products] = useState<Product[]>(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      return saved ? JSON.parse(saved) : [];
  });

  const [allClients] = useState<Client[]>(() => {
      const saved = localStorage.getItem('ferrecloud_clients');
      return saved ? JSON.parse(saved) : [];
  });

  const [existingRemitos, setExistingRemitos] = useState<(Remito & { relatedInvoice?: string })[]>(() => {
      const saved = localStorage.getItem('ferrecloud_remitos');
      return saved ? JSON.parse(saved) : [];
  });

  // Filtro de productos para búsqueda
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    // Fix: Updated filter to use internalCodes array property
    return products.filter(p => 
        (p.name || '').toLowerCase().includes(term) || 
        p.internalCodes.some(c => c.toLowerCase().includes(term)) ||
        (p.brand || '').toLowerCase().includes(term)
    ).slice(0, 10);
  }, [searchTerm, products]);

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

  const addManualToRemito = () => {
    if (!manualForm.name || manualForm.price <= 0) return;
    const dummy = createMockProduct(`rem-man-${Date.now()}`, 'EXT-001', manualForm.name.toUpperCase(), manualForm.price, 0, 'EXTRA', 'EXTRA');
    setCart([...cart, { product: dummy, quantity: 1, historicalPrice: manualForm.price }]);
    setManualForm({ name: '', price: 0 });
    setIsManualModalOpen(false);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: newQuantity } : item));
  };

  const updatePrice = (productId: string, newPrice: number) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, historicalPrice: newPrice } : item));
  };

  const handleRequestItem = (product: Product) => {
    if (product.id.toString().startsWith('rem-man')) {
        alert("No se puede pedir reposición de un artículo manual no catalogado.");
        return;
    }
    const savedManual = localStorage.getItem('ferrecloud_manual_shortages');
    const manualIds: string[] = savedManual ? JSON.parse(savedManual) : [];
    if (!manualIds.includes(product.id)) {
        manualIds.push(product.id);
        localStorage.setItem('ferrecloud_manual_shortages', JSON.stringify(manualIds));
        alert(`"${product.name}" agregado a la lista de faltantes para reposición.`);
    } else {
        alert(`Este artículo ya se encuentra en el pedido de reposición.`);
    }
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

  const filteredRemitos = existingRemitos.filter(r => {
    const matchStatus = historyFilter === 'ALL' || r.status === historyFilter;
    const matchClient = !historySelectedClient || r.clientName === historySelectedClient;
    return matchStatus && matchClient;
  });

  return (
    <div className="p-4 h-full flex flex-col space-y-3 bg-slate-100 overflow-hidden">
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm shrink-0">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <ClipboardList size={18} className="text-indigo-600"/> Remitos y Cta. Cte.
        </h2>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button onClick={() => setActiveTab('NEW')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${activeTab === 'NEW' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>Nuevo</button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>Cuenta Corriente</button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="flex-1 flex flex-col gap-3 min-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
                <div className="md:col-span-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Cliente</label>
                    <select className="w-full p-1.5 bg-slate-50 border rounded-lg font-bold text-xs" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                        <option value="">-- SELECCIONE --</option>
                        {allClients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div className="md:col-span-5 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-1.5 relative">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Añadir Artículos</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                        <input 
                            type="text" 
                            placeholder="Buscar por código, nombre o marca..." 
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-gray-100 rounded-lg font-bold text-xs outline-none focus:bg-white focus:border-indigo-500 uppercase" 
                            value={searchTerm} 
                            onFocus={() => setShowSearchResults(true)}
                            onChange={e => { setSearchTerm(e.target.value); setShowSearchResults(true); }} 
                        />
                    </div>
                    {showSearchResults && searchTerm.trim().length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto z-50 p-1">
                            {filteredProducts.map(p => (
                                <button key={p.id} onClick={() => addToCart(p)} className="w-full text-left p-2 hover:bg-indigo-50 rounded-lg flex justify-between items-center group border-b last:border-0 border-gray-50">
                                    <div>
                                        <p className="font-black text-slate-800 uppercase text-[10px]">{p.name}</p>
                                        <p className="text-[8px] text-gray-400 font-black tracking-widest uppercase">{p.internalCodes[0]} • {p.brand}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-indigo-600">${p.priceFinal.toLocaleString('es-AR')}</p>
                                        <p className="text-[7px] text-gray-300 font-bold uppercase">Stock: {p.stock}</p>
                                    </div>
                                </button>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="p-4 text-center text-gray-400 text-[10px] font-black uppercase">Sin resultados</div>
                            )}
                        </div>
                    )}
                </div>
                <div className="md:col-span-3 flex items-end gap-2">
                    <button onClick={() => setIsManualModalOpen(true)} className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all hover:bg-indigo-100 flex items-center justify-center gap-2">
                        <PlusCircle size={14}/> Extra
                    </button>
                    <button onClick={handleCreateRemito} className="flex-[2] py-2.5 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">
                        Emitir Remito
                    </button>
                </div>
            </div>
            
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2.5">Artículo</th>
                                <th className="px-4 py-2.5 text-center">Cant.</th>
                                <th className="px-4 py-2.5 text-right">P. Unitario</th>
                                <th className="px-4 py-2.5 text-right">Subtotal</th>
                                <th className="px-4 py-2.5 text-center w-28">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item, i) => (
                                <tr key={i} className="border-b last:border-0 text-[11px] hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-2 font-black uppercase text-slate-800">
                                        <div className="flex items-center gap-2">
                                            {item.product.id.toString().startsWith('rem-man') && <span className="bg-amber-100 text-amber-700 px-1 py-0.5 rounded text-[7px] font-black uppercase">Extra</span>}
                                            {item.product.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="text-gray-400 hover:text-red-500"><Minus size={12}/></button>
                                            <span className="font-black w-6 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="text-gray-400 hover:text-green-500"><Plus size={12}/></button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <input 
                                            type="number" 
                                            className="w-20 text-right bg-transparent font-black border-b border-transparent focus:border-indigo-500 focus:bg-indigo-50 outline-none"
                                            value={item.historicalPrice}
                                            onChange={e => updatePrice(item.product.id, parseFloat(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-right font-black text-slate-900">${(item.historicalPrice * item.quantity).toLocaleString('es-AR')}</td>
                                    <td className="px-4 py-2 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => handleRequestItem(item.product)}
                                                className="p-1.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Pedir / Agregar a Faltantes"
                                            >
                                                <ShoppingCart size={14}/>
                                            </button>
                                            <button 
                                                onClick={() => setCart(cart.filter((_, idx) => idx !== i))} 
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Quitar"
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {cart.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <Package size={32} className="mx-auto text-slate-200 mb-2 opacity-30"/>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin artículos cargados</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-50 border-t border-gray-100 flex justify-end items-center gap-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total del Movimiento</p>
                    <p className="text-xl font-black text-slate-900 leading-none">${cart.reduce((a,c) => a + (c.historicalPrice * c.quantity), 0).toLocaleString('es-AR')}</p>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="flex gap-3 h-full min-0 overflow-hidden animate-fade-in">
           <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-0">
             <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex gap-2">
                    {['PENDING', 'BILLED', 'ALL'].map(f => (
                        <button key={f} onClick={() => { setHistoryFilter(f as any); setSelectedRemitoIds([]); }} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${historyFilter === f ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}>
                            {f === 'PENDING' ? 'Pendientes' : f === 'BILLED' ? 'Facturados' : 'Todo'}
                        </button>
                    ))}
                </div>
                {selectedRemitoIds.length > 0 && (
                    <button onClick={handleBillSelected} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all">
                        <ShoppingBag size={14}/> Cobrar Seleccionados ({selectedRemitoIds.length})
                    </button>
                )}
             </div>

             <div className="flex-1 overflow-y-auto">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50 sticky top-0 z-10 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b">
                   <tr>
                     <th className="px-6 py-2.5 text-center w-10">
                         {historyFilter === 'PENDING' && (
                             <button onClick={() => setSelectedRemitoIds(selectedRemitoIds.length === filteredRemitos.length ? [] : filteredRemitos.map(r => r.id))}>
                                {selectedRemitoIds.length === filteredRemitos.length && filteredRemitos.length > 0 ? <CheckSquare size={16} className="text-indigo-600"/> : <Square size={16}/>}
                             </button>
                         )}
                     </th>
                     <th className="px-6 py-2.5">ID / Fecha</th>
                     <th className="px-6 py-2.5">Cliente</th>
                     <th className="px-6 py-2.5 text-right">Total</th>
                     <th className="px-6 py-2.5 text-center">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 text-[11px]">
                   {filteredRemitos.map(remito => (
                        <tr key={remito.id} className={`hover:bg-slate-50 transition-colors group ${selectedRemitoIds.includes(remito.id) ? 'bg-indigo-50/50' : ''}`}>
                          <td className="px-6 py-2.5 text-center">
                            {remito.status === 'PENDING' && (
                                <button onClick={() => setSelectedRemitoIds(prev => prev.includes(remito.id) ? prev.filter(x => x !== remito.id) : [...prev, remito.id])}>
                                {selectedRemitoIds.includes(remito.id) ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                                </button>
                            )}
                          </td>
                          <td className="px-6 py-2.5">
                            <p className="font-mono font-black text-slate-800">{remito.id}</p>
                            <p className="text-[8px] text-gray-400 font-bold uppercase">{remito.date}</p>
                          </td>
                          <td className="px-6 py-2.5 font-black text-slate-600 uppercase truncate max-w-[150px]">{remito.clientName}</td>
                          <td className="px-6 py-2.5 text-right font-black text-slate-950">
                            ${remito.items.reduce((a,c) => a + (c.historicalPrice * c.quantity), 0).toLocaleString('es-AR')}
                          </td>
                          <td className="px-6 py-2.5 text-center">
                              <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setShowPrintModal(remito)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"><Printer size={14}/></button>
                                <button onClick={() => { if(confirm('¿Borrar?')) setExistingRemitos(existingRemitos.filter(r => r.id !== remito.id)) }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"><Trash2 size={14}/></button>
                              </div>
                          </td>
                        </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}

      {/* MODAL ARTÍCULO EXTRA */}
      {isManualModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-200">
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <PlusCircle size={20} className="text-indigo-400"/>
                          <h3 className="font-black text-xs uppercase tracking-widest">Artículo no listado</h3>
                      </div>
                      <button onClick={() => setIsManualModalOpen(false)}><X size={20}/></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Descripción de la Mercadería</label>
                          <input 
                              type="text" 
                              className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-800 uppercase"
                              placeholder="Ej: Retazo de caño galvanizado..."
                              value={manualForm.name}
                              onChange={e => setManualForm({...manualForm, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Precio Unitario Ref. ($)</label>
                          <input 
                              type="number" 
                              className="w-full p-4 bg-indigo-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-2xl text-indigo-700"
                              placeholder="0.00"
                              value={manualForm.price || ''}
                              onChange={e => setManualForm({...manualForm, price: parseFloat(e.target.value) || 0})}
                          />
                      </div>
                      <button 
                          onClick={addManualToRemito}
                          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all">
                          Cargar al remito
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: PREVIEW IMPRESIÓN COMPACTO */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[200] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white w-full max-w-lg shadow-2xl rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                 <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                    <Printer size={14} className="text-indigo-600"/> Vista Previa de Remito
                 </h3>
                 <button onClick={() => setShowPrintModal(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
              </div>

              <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 <div className="border p-6 rounded-lg shadow-inner bg-slate-50/30">
                    <div className="flex justify-between items-start mb-6 border-b pb-4">
                        <div>
                            <h1 className="text-xl font-black text-indigo-600 uppercase tracking-tighter leading-none">FerreCloud</h1>
                            <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">LOGÍSTICA: {showPrintModal.id}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-800 uppercase">REMITO R</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{showPrintModal.date}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">ENTREGADO A:</p>
                        <p className="text-sm font-black text-slate-800 uppercase">{showPrintModal.clientName}</p>
                    </div>

                    <table className="w-full text-left text-[10px] mb-8">
                        <thead className="border-b">
                            <tr>
                                <th className="py-2 px-1 w-10">Cant</th>
                                <th className="py-2">Descripción</th>
                                <th className="py-2 text-right">Unitario</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {showPrintModal.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="py-2 px-1 font-black text-indigo-600">{item.quantity}</td>
                                    <td className="py-2 font-bold text-slate-700 uppercase">{item.product.name}</td>
                                    <td className="py-2 text-right font-medium text-gray-400">${item.historicalPrice.toLocaleString('es-AR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end pt-4 border-t border-dashed border-gray-300">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-gray-400 uppercase">Total de Mercadería</p>
                            <p className="text-xl font-black text-slate-900">${showPrintModal.items.reduce((a,c) => a + (c.historicalPrice * c.quantity), 0).toLocaleString('es-AR')}</p>
                        </div>
                    </div>
                 </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                 <button onClick={() => setShowPrintModal(null)} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-lg font-black text-[9px] uppercase hover:bg-slate-50 transition-colors">Cerrar</button>
                 <button className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
                    <Printer size={14} /> Imprimir Comprobante
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Remitos;
