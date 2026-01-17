import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Printer, Trash2, Save, FileText, X, 
    Minus, Truck, RefreshCw
} from 'lucide-react';
import { InvoiceItem, Product, Budget } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';

interface PresupuestosProps {
    initialItems?: InvoiceItem[];
    onItemsConsumed?: () => void;
    onConvertToSale?: (items: InvoiceItem[]) => void;
    onConvertToRemito?: (items: InvoiceItem[]) => void;
}

const Presupuestos: React.FC<PresupuestosProps> = ({ initialItems, onItemsConsumed, onConvertToSale, onConvertToRemito }) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [validityDays, setValidityDays] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [budgets, setBudgets] = useState<Budget[]>(() => JSON.parse(localStorage.getItem('ferrecloud_budgets') || '[]'));
  const [showPrintModal, setShowPrintModal] = useState<Budget | null>(null);

  useEffect(() => {
    const search = async () => {
        if (searchTerm.trim().length > 2) {
            setIsSearching(true);
            const results = await productDB.search(searchTerm);
            setSearchResults(results);
            setIsSearching(false);
        } else {
            setSearchResults([]);
        }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.appliedPrice } : item);
      }
      return [...prev, { product, quantity: 1, subtotal: product.priceFinal, appliedPrice: product.priceFinal }];
    });
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const normalizeQuantity = (val: string): number => {
    const normalized = val.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const updateQuantity = (productId: string, newVal: string | number) => {
    const q = typeof newVal === 'string' ? normalizeQuantity(newVal) : Math.max(0, newVal);
    setCart(prev => prev.map(item => {
        if (item.product.id === productId) {
            return { ...item, quantity: q, subtotal: q * item.appliedPrice };
        }
        return item;
    }));
  };

  const handleSaveBudget = () => {
    if (cart.length === 0 || !clientName) return;
    const today = new Date();
    const validUntil = new Date();
    validUntil.setDate(today.getDate() + validityDays);
    const newBudget: Budget = {
        id: `P-${Math.floor(Math.random() * 10000)}`,
        clientName: clientName,
        date: today.toISOString().split('T')[0],
        validUntil: validUntil.toISOString().split('T')[0],
        items: [...cart],
        total: cart.reduce((acc, item) => acc + item.subtotal, 0),
        status: 'OPEN'
    };
    setBudgets([newBudget, ...budgets]);
    setCart([]);
    setClientName('');
    setShowPrintModal(newBudget);
  };

  useEffect(() => {
    localStorage.setItem('ferrecloud_budgets', JSON.stringify(budgets));
    window.dispatchEvent(new Event('ferrecloud_budgets_updated')); // Disparar evento para sincronización
  }, [budgets]);

  return (
    <div className="p-4 h-full flex flex-col space-y-3 bg-slate-100 overflow-hidden">
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm shrink-0">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <FileText size={18} className="text-indigo-600"/> Presupuestos
        </h2>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button onClick={() => setActiveTab('NEW')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'NEW' ? 'bg-white text-slate-900' : 'text-gray-400'}`}>Nuevo</button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'HISTORY' ? 'bg-white text-slate-900' : 'text-gray-400'}`}>Historial</button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="flex-1 flex overflow-hidden gap-6 p-2">
            <div className="flex-[3] flex flex-col gap-6 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
                    <div className="md:col-span-4 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Cliente</label>
                        <input type="text" placeholder="Nombre..." value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-xs uppercase" />
                    </div>
                    <div className="md:col-span-8 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-1.5 relative">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Buscador Artículos</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                            <input type="text" placeholder="Código o Nombre..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl outline-none font-bold text-xs uppercase" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setShowSearchResults(true); }} onFocus={() => setShowSearchResults(true)} />
                        </div>
                        {showSearchResults && searchTerm.trim().length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white border rounded-2xl shadow-2xl mt-1 max-h-80 overflow-y-auto z-50 p-1">
                                {searchResults.map(p => (
                                    <button key={p.id} onClick={() => addToCart(p)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-lg flex justify-between items-center group">
                                        <div>
                                            <p className="font-black text-slate-800 uppercase text-[10px]">{p.name}</p>
                                            <div className="flex gap-2 text-[8px] font-bold uppercase">
                                                <span className="text-gray-400">SKU: {p.internalCodes[0]}</span>
                                                <span className="text-indigo-600">MARCA: {p.brand || 'GENÉRICO'}</span>
                                            </div>
                                        </div>
                                        <p className="font-black text-indigo-600 text-[11px]">${p.priceFinal.toLocaleString()}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[9px] font-black uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-5">Descripción</th>
                                    <th className="px-6 py-5 text-center">Cant.</th>
                                    <th className="px-6 py-5 text-right">Subtotal</th>
                                    <th className="px-6 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {cart.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-8 py-5"><p className="font-black text-slate-800 uppercase text-xs mb-1">{item.product.name}</p></td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2 bg-slate-50 border rounded-xl p-1 w-fit mx-auto shadow-inner">
                                                <button onClick={() => updateQuantity(item.product.id, item.quantity - 0.1)}><Minus size={14}/></button>
                                                <input 
                                                    type="text" 
                                                    inputMode="decimal"
                                                    className="font-black w-16 text-center bg-transparent outline-none border-none focus:ring-0" 
                                                    value={item.quantity.toString().replace('.', ',')}
                                                    onChange={(e) => updateQuantity(item.product.id, e.target.value)}
                                                />
                                                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}><Plus size={14}/></button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900 text-lg">${item.subtotal.toLocaleString()}</td>
                                        <td className="px-6 py-5 text-center"><button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="text-gray-300 hover:text-red-500 transition-all"><Trash2 size={18}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="w-[350px] flex flex-col gap-4">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex-1 flex flex-col">
                    <h3 className="text-[10px] font-black uppercase text-indigo-400 mb-8 border-b border-white/10 pb-4">Cotización</h3>
                    <div className="mt-auto">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-3">Monto Final</p>
                        <p className="text-5xl font-black tracking-tighter text-white leading-none">${cart.reduce((a,c) => a + c.subtotal, 0).toLocaleString('es-AR')}</p>
                    </div>
                </div>
                <button onClick={handleSaveBudget} disabled={cart.length === 0 || !clientName} className="w-full bg-indigo-600 text-white font-black py-5 rounded-[1.8rem] transition-all disabled:opacity-30 shadow-xl uppercase text-xs">
                    Registrar Presupuesto
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Presupuestos;
