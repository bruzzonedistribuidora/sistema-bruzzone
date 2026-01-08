
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Plus, Printer, Trash2, Save, Clock, FileText, ArrowRight, X, 
    Calendar, Minus, Calculator, Pencil, PlusCircle, ShoppingBag, Truck, 
    Receipt, Download, ChevronRight, PackagePlus
} from 'lucide-react';
import { InvoiceItem, Product, Budget } from '../types';
import { addToReplenishmentQueue } from '../services/storageService';

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
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [budgets, setBudgets] = useState<Budget[]>(() => JSON.parse(localStorage.getItem('ferrecloud_budgets') || '[]'));
  const [showPrintModal, setShowPrintModal] = useState<Budget | null>(null);

  const productsFromStorage: Product[] = useMemo(() => JSON.parse(localStorage.getItem('ferrecloud_products') || '[]'), []);
  
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
        setCart(initialItems);
        setActiveTab('NEW');
        onItemsConsumed?.();
    }
  }, [initialItems]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];
    return productsFromStorage.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.internalCodes.some(c => c.toLowerCase().includes(term)) ||
        p.providerCodes.some(c => c.toLowerCase().includes(term)) ||
        p.barcodes.some(c => c.toLowerCase().includes(term))
    ).slice(0, 50);
  }, [searchTerm, productsFromStorage]);

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

  const handlePedir = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    if (addToReplenishmentQueue(p)) {
        alert(`Articulo ${p.name} enviado a reposición.`);
    }
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

  const handlePrint = () => {
      window.print();
  };

  useEffect(() => {
    localStorage.setItem('ferrecloud_budgets', JSON.stringify(budgets));
  }, [budgets]);

  return (
    <div className="p-4 h-full flex flex-col space-y-3 bg-slate-100 overflow-hidden">
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm shrink-0 print:hidden">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <FileText size={18} className="text-indigo-600"/> Presupuestos y Cotizaciones
        </h2>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button onClick={() => setActiveTab('NEW')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${activeTab === 'NEW' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>Nuevo</button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400'}`}>Historial</button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="flex-1 flex overflow-hidden gap-6 p-2">
            <div className="flex-[3] flex flex-col gap-6 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
                    <div className="md:col-span-4 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-1.5">
                        <div className="flex justify-between">
                            <label className="text-[9px] font-black text-gray-400 uppercase">Cliente / Días Val.</label>
                        </div>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Nombre..." value={clientName} onChange={(e) => setClientName(e.target.value)} className="flex-[3] p-2.5 bg-slate-50 border rounded-xl font-bold text-xs uppercase outline-none focus:bg-white" />
                            <input type="number" value={validityDays} onChange={(e) => setValidityDays(parseInt(e.target.value))} className="flex-1 p-2.5 bg-slate-50 border rounded-xl font-bold text-xs text-center outline-none" />
                        </div>
                    </div>
                    <div className="md:col-span-8 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-1.5 relative">
                        <label className="text-[9px] font-black text-gray-400 uppercase">Búsqueda de Artículos</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                            <input type="text" placeholder="Código o Nombre..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl outline-none uppercase font-bold text-xs focus:bg-white transition-all" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setShowSearchResults(true); }} onFocus={() => setShowSearchResults(true)} />
                        </div>
                        {showSearchResults && searchTerm && (
                            <div className="absolute top-full left-0 w-full bg-white border rounded-2xl shadow-2xl mt-1 max-h-80 overflow-y-auto z-50 p-1 custom-scrollbar">
                                {filteredProducts.map(p => (
                                    <button key={p.id} onClick={() => addToCart(p)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b last:border-0 border-gray-50 flex justify-between items-center group">
                                        <div>
                                            <div className="font-black text-slate-800 uppercase text-[10px]">{p.name}</div>
                                            <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">SKU: {p.internalCodes[0]}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div onClick={(e) => handlePedir(e, p)} className="p-2 bg-slate-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><Truck size={14}/></div>
                                            <div className="font-black text-indigo-600 text-[11px] tracking-tight">${p.priceFinal.toLocaleString()}</div>
                                        </div>
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
                            <tbody className="divide-y divide-slate-50">
                                {cart.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="font-black text-slate-800 uppercase text-xs mb-1">{item.product.name}</p>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{item.product.internalCodes[0]}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-3 bg-slate-50 border rounded-xl p-1 w-fit mx-auto">
                                                <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1), subtotal: Math.max(1, i.quantity - 1) * i.appliedPrice} : i))}><Minus size={14}/></button>
                                                <span className="font-black text-xs w-6 text-center">{item.quantity}</span>
                                                <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i))}><Plus size={14}/></button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900 text-lg tracking-tighter">${item.subtotal.toLocaleString()}</td>
                                        <td className="px-6 py-5 text-center"><button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"><Trash2 size={18}/></button></td>
                                    </tr>
                                ))}
                                {cart.length === 0 && (
                                    <tr><td colSpan={4} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">Sin ítems seleccionados</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="w-[350px] flex flex-col gap-4">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex-1 flex flex-col">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><FileText size={140}/></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-8 border-b border-white/10 pb-4">Cotización</h3>
                    <div className="space-y-6 flex-1">
                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vencimiento</p>
                            <p className="text-sm font-black uppercase text-amber-400">{validityDays} Días</p>
                        </div>
                        <div className="mt-auto">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3">Monto Final</p>
                            <p className="text-5xl font-black tracking-tighter text-white leading-none">${cart.reduce((a,c) => a + c.subtotal, 0).toLocaleString('es-AR')}</p>
                        </div>
                    </div>
                </div>
                <button onClick={handleSaveBudget} disabled={cart.length === 0 || !clientName} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[1.8rem] transition-all disabled:opacity-30 flex items-center justify-center gap-3 shadow-xl uppercase tracking-widest text-xs active:scale-95">
                    <Save size={20} /> Registrar Presupuesto
                </button>
            </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden flex-1 animate-fade-in print:hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-900 text-[10px] text-slate-300 uppercase font-black tracking-widest sticky top-0 z-10">
                    <tr><th className="px-8 py-5">ID</th><th className="px-8 py-5">Cliente</th><th className="px-8 py-5">Validez</th><th className="px-8 py-5 text-right">Total</th><th className="px-8 py-5 text-center">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-xs text-[11px]">
                    {budgets.map(budget => (
                        <tr key={budget.id} className="hover:bg-gray-50 group">
                            <td className="px-8 py-4 font-bold text-indigo-600">{budget.id}</td>
                            <td className="px-8 py-4 font-black uppercase text-slate-700">{budget.clientName}</td>
                            <td className="px-8 py-4 text-gray-500 font-bold">{budget.validUntil}</td>
                            <td className="px-8 py-4 text-right font-black text-slate-900 text-lg tracking-tighter">${budget.total.toLocaleString()}</td>
                            <td className="px-8 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => onConvertToSale?.(budget.items)} className="p-2.5 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Facturar (POS)"><Receipt size={14} /></button>
                                    <button onClick={() => onConvertToRemito?.(budget.items)} className="p-2.5 text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Generar Remito"><Truck size={14} /></button>
                                    <button onClick={() => setShowPrintModal(budget)} className="p-2.5 text-gray-400 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Printer size={14} /></button>
                                    <button onClick={() => setBudgets(budgets.filter(b => b.id !== budget.id))} className="p-2.5 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {budgets.length === 0 && (
                        <tr><td colSpan={5} className="py-24 text-center text-slate-300 font-black uppercase tracking-widest">No hay presupuestos registrados</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      )}

      {/* MODAL PRINT PREVIEW */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[200] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in print:bg-white print:p-0 print:block">
           <div className="bg-white w-full max-w-2xl shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col animate-fade-in print:shadow-none print:rounded-none print:w-full">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 print:hidden">
                 <h3 className="text-xs font-black uppercase flex items-center gap-2"><FileText size={16}/> Presupuesto Comercial</h3>
                 <button onClick={() => setShowPrintModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
                 <div className="border border-slate-100 p-10 rounded-[2.5rem] shadow-sm print:border-none print:shadow-none print:p-0">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Ferretería Bruzzone</h1>
                    <div className="flex justify-between border-b pb-6 mb-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cotización ID</p>
                            <p className="text-xl font-mono font-black">{showPrintModal.id}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Validez hasta</p>
                             <p className="text-sm font-bold text-slate-700">{showPrintModal.validUntil}</p>
                        </div>
                    </div>
                    
                    <div className="mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Presupuesto para</p>
                        <h4 className="text-xl font-black text-slate-800 uppercase">{showPrintModal.clientName}</h4>
                    </div>

                    <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-50 border-b">
                            <tr><th className="py-3 px-2">Descripción</th><th className="py-3 px-2 text-center">Cant.</th><th className="py-3 px-2 text-right">Total</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {showPrintModal.items.map((it, i) => (
                                <tr key={i}><td className="py-4 px-2 font-bold uppercase">{it.product.name}</td><td className="py-4 px-2 text-center font-black">{it.quantity}</td><td className="py-4 px-2 text-right font-black">${it.subtotal.toLocaleString()}</td></tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="mt-12 flex justify-end">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Importe Final</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tighter">${showPrintModal.total.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mt-20 text-center border-t pt-8">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Los precios de este presupuesto están sujetos a variación sin previo aviso.</p>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t flex gap-3 print:hidden">
                 <button onClick={() => setShowPrintModal(null)} className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Cancelar</button>
                 <button onClick={handlePrint} className="flex-1 py-4 text-[10px] font-black uppercase bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95"><Printer size={18}/> Imprimir / PDF</button>
                 <button onClick={() => onConvertToSale?.(showPrintModal.items)} className="flex-1 py-4 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95"><Receipt size={18}/> Facturar Venta</button>
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

export default Presupuestos;
