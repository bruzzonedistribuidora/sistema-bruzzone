
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Printer, Trash2, Save, Clock, FileText, ArrowRight, X, Calendar, Minus, Calculator, Pencil, PlusCircle, ShoppingBag, Truck, Receipt, Download } from 'lucide-react';
import { InvoiceItem, Product, Budget } from '../types';

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
    ).slice(0, 10);
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
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Presupuestos y Cotizaciones</h2>
          <p className="text-gray-500 text-sm italic">Gestión de propuestas comerciales y conversión directa.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border shadow-sm">
          <button onClick={() => setActiveTab('NEW')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'NEW' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Nuevo</button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'HISTORY' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>Historial</button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="bg-white rounded-xl shadow-lg border flex flex-col flex-1 overflow-hidden print:hidden">
            <div className="p-6 bg-slate-50 border-b grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cliente</label>
                    <input type="text" placeholder="Nombre..." value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-white border rounded-lg px-3 py-2 text-sm outline-none uppercase font-bold" />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Días Val.</label>
                    <input type="number" value={validityDays} onChange={(e) => setValidityDays(parseInt(e.target.value))} className="w-full bg-white border rounded-lg px-3 py-2 text-sm outline-none text-center font-bold" />
                </div>
                <div className="md:col-span-8 relative">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Buscar Producto (SKU/Prov/EAN)</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Código o Nombre..." className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg outline-none uppercase font-bold text-sm" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setShowSearchResults(true); }} onFocus={() => setShowSearchResults(true)} />
                    </div>
                    {showSearchResults && searchTerm && (
                        <div className="absolute top-full left-0 w-full bg-white border rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto z-50 p-1">
                            {filteredProducts.map(p => (
                                <button key={p.id} onClick={() => addToCart(p)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b last:border-0 border-gray-50 flex justify-between items-center group">
                                    <div className="text-sm text-left">
                                        <div className="font-bold text-slate-800 uppercase">{p.name}</div>
                                        <div className="flex gap-2 text-[10px] text-gray-400 font-mono">
                                            <span>INT: {p.internalCodes[0]}</span>
                                            <span>PROV: {p.providerCodes[0] || 'S/D'}</span>
                                        </div>
                                    </div>
                                    <div className="font-bold text-indigo-600">${p.priceFinal.toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <table className="w-full text-left">
                    <thead className="text-[10px] text-gray-500 uppercase border-b bg-gray-50">
                        <tr><th className="px-6 py-3">Descripción</th><th className="px-6 py-3 text-right">Precio</th><th className="px-6 py-3 text-center">Cant.</th><th className="px-6 py-3 text-right">Subtotal</th><th className="px-6 py-3"></th></tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {cart.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 font-bold uppercase">{item.product.name}</td>
                                <td className="px-6 py-3 text-right">${item.appliedPrice.toLocaleString()}</td>
                                <td className="px-6 py-3 text-center">
                                    <div className="flex items-center justify-center gap-3">
                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1), subtotal: Math.max(1, i.quantity - 1) * i.appliedPrice} : i))}><Minus size={14}/></button>
                                        <span className="font-bold">{item.quantity}</span>
                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i))}><Plus size={14}/></button>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-right font-black text-slate-900">${item.subtotal.toLocaleString()}</td>
                                <td className="px-6 py-3 text-center"><button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={18}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <p className="text-4xl font-black tracking-tighter">${cart.reduce((a,c) => a + c.subtotal, 0).toLocaleString('es-AR')}</p>
                <button onClick={handleSaveBudget} disabled={cart.length === 0 || !clientName} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-12 rounded-xl transition-all disabled:opacity-50 flex items-center gap-3 shadow-2xl uppercase tracking-widest text-xs">
                    <Save size={20} /> Guardar Presupuesto
                </button>
            </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-1 animate-fade-in print:hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase border-b">
                    <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Validez</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-center">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-xs">
                    {budgets.map(budget => (
                        <tr key={budget.id} className="hover:bg-gray-50 group">
                            <td className="px-6 py-4 font-bold text-indigo-600">{budget.id}</td>
                            <td className="px-6 py-4 font-black uppercase text-slate-700">{budget.clientName}</td>
                            <td className="px-6 py-4 text-gray-500">{budget.validUntil}</td>
                            <td className="px-6 py-4 text-right font-black text-slate-900">${budget.total.toLocaleString()}</td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => onConvertToSale?.(budget.items)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all" title="Facturar (POS)"><Receipt size={14} /></button>
                                    <button onClick={() => onConvertToRemito?.(budget.items)} className="p-2 text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-900 hover:text-white transition-all" title="Generar Remito"><Truck size={14} /></button>
                                    <button onClick={() => setShowPrintModal(budget)} className="p-2 text-gray-400 bg-slate-50 rounded-lg hover:bg-slate-900 hover:text-white transition-all"><Printer size={14} /></button>
                                    <button onClick={() => setBudgets(budgets.filter(b => b.id !== budget.id))} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
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
                 <button onClick={() => setShowPrintModal(null)}><X size={24}/></button>
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
                 <button onClick={handlePrint} className="flex-1 py-4 text-[10px] font-black uppercase bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3"><Printer size={18}/> Imprimir / PDF</button>
                 <button onClick={() => onConvertToSale?.(showPrintModal.items)} className="flex-1 py-4 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3"><Receipt size={18}/> Facturar Venta</button>
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
