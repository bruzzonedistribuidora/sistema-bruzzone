
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

  const handleCreateRemito = () => {
    if (!selectedClient || cart.length === 0) return;
    if (editingRemitoId) {
        setExistingRemitos(prev => prev.map(r => r.id === editingRemitoId ? { ...r, clientName: selectedClient, items: [...cart] } : r));
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

  const filteredRemitos = useMemo(() => {
    return existingRemitos.filter(r => {
        const matchesStatus = historyFilter === 'ALL' || r.status === historyFilter;
        const matchesSearch = r.clientName.toLowerCase().includes(historySearch.toLowerCase()) || 
                             r.id.toLowerCase().includes(historySearch.toLowerCase());
        return matchesStatus && matchesSearch;
    });
  }, [existingRemitos, historyFilter, historySearch]);

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
          <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>Historial</button>
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
                    <label className="text-[9px] font-black text-gray-400 uppercase">Búsqueda Artículos</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                        <input type="text" placeholder="SKU o Nombre..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-100 rounded-xl font-bold text-xs outline-none focus:bg-white uppercase" value={searchTerm} onFocus={() => setShowSearchResults(true)} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    {showSearchResults && searchTerm.trim().length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border rounded-2xl shadow-2xl mt-1 max-h-80 overflow-y-auto z-50 p-1">
                            {searchResults.map(p => (
                                <button key={p.id} onClick={() => addToCart(p)} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg flex justify-between items-center border-b last:border-0 border-gray-50">
                                    <div>
                                        <p className="font-black text-slate-800 uppercase text-[10px]">{p.name}</p>
                                        <div className="flex gap-2 text-[7px] font-bold uppercase">
                                            <span className="text-gray-400">REF: {p.internalCodes[0]}</span>
                                            <span className="text-indigo-600">MARCA: {p.brand || 'GENÉRICO'}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-indigo-600">${p.priceFinal}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Descripción</th>
                                <th className="px-6 py-4 text-center">Cant.</th>
                                <th className="px-6 py-4 text-right">P. Unit.</th>
                                <th className="px-6 py-4 text-center"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item, i) => (
                                <tr key={i} className="border-b text-[11px] hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-black uppercase text-slate-800 mb-1">{item.product.name}</p>
                                        <p className="text-[8px] text-gray-400 font-bold uppercase">{item.product.internalCodes[0]}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2 bg-slate-50 border rounded-xl p-1 w-fit mx-auto">
                                            <button onClick={() => updateQuantity(i, Math.max(0, item.quantity - 0.1))}><Minus size={14}/></button>
                                            <input 
                                                type="number" 
                                                step="0.001"
                                                className="font-black w-14 text-center bg-transparent outline-none" 
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(i, parseFloat(e.target.value.replace(',', '.')) || 0)}
                                            />
                                            <button onClick={() => updateQuantity(i, item.quantity + 1)}><Plus size={14}/></button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900">${item.historicalPrice.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center"><button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
          <div className="w-[350px] flex flex-col gap-4">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex-1 flex flex-col">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-8 border-b border-white/10 pb-4">Despacho</h3>
                  <div className="mt-auto">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3">Total Estimado</p>
                    <p className="text-5xl font-black tracking-tighter text-white leading-none">${cart.reduce((a,c) => a + (c.historicalPrice * c.quantity), 0).toLocaleString('es-AR')}</p>
                  </div>
              </div>
              <button onClick={handleCreateRemito} disabled={!selectedClient || cart.length === 0} className="w-full py-5 rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-xl bg-indigo-600 text-white active:scale-95 disabled:opacity-30">
                  {editingRemitoId ? 'Confirmar Edición' : 'Generar Remito'}
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Remitos;
