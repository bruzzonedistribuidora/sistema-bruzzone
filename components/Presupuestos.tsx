
import React, { useState, useEffect } from 'react';
import { Search, Plus, Printer, Trash2, Save, Clock, FileText, ArrowRight, X, Calendar, Minus, Calculator, Pencil, PlusCircle, ShoppingBag } from 'lucide-react';
import { InvoiceItem, Product, Budget } from '../types';

interface PresupuestosProps {
    onConvertToSale?: (items: InvoiceItem[]) => void;
}

const Presupuestos: React.FC<PresupuestosProps> = ({ onConvertToSale }) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [validityDays, setValidityDays] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', price: 0 });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('ferrecloud_budgets');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ferrecloud_budgets', JSON.stringify(budgets));
  }, [budgets]);

  const [showPrintModal, setShowPrintModal] = useState<Budget | null>(null);

  const productsFromStorage: Product[] = JSON.parse(localStorage.getItem('ferrecloud_products') || '[]');
  
  // Fix: Updated filter to use internalCodes array property
  const filteredProducts = productsFromStorage.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.internalCodes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, 10);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.appliedPrice }
          : item
        );
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

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Presupuestos</h2>
          <p className="text-gray-500 text-sm">Cotizaciones rápidas para clientes.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button onClick={() => setActiveTab('NEW')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'NEW' ? 'bg-ferre-orange text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Nuevo</button>
          <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'HISTORY' ? 'bg-ferre-orange text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>Historial</button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col flex-1 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente</label>
                    <input type="text" placeholder="Nombre..." value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-ferre-orange outline-none shadow-sm" />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Días</label>
                    <input type="number" value={validityDays} onChange={(e) => setValidityDays(parseInt(e.target.value))} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-ferre-orange outline-none shadow-sm" />
                </div>
                <div className="md:col-span-6 relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar Producto</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Escriba..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-ferre-orange outline-none shadow-sm uppercase" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setShowSearchResults(true); }} onFocus={() => setShowSearchResults(true)} />
                    </div>
                    {showSearchResults && searchTerm && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto z-50">
                            {filteredProducts.map(p => (
                                <button key={p.id} onClick={() => addToCart(p)} className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-50 flex justify-between items-center group">
                                    <div>
                                        <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                                        {/* Fix: Updated display to use internalCodes[0] instead of internalCode */}
                                        <div className="text-xs text-gray-500 font-mono">{p.internalCodes[0]}</div>
                                    </div>
                                    <div className="text-ferre-orange font-bold">${p.priceFinal.toLocaleString('es-AR')}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="md:col-span-2">
                    <button onClick={() => setIsManualModalOpen(true)} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-slate-800 flex items-center justify-center gap-2"><PlusCircle size={16}/> Manual</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3 text-right">Precio</th>
                                <th className="px-6 py-3 text-center">Cantidad</th>
                                <th className="px-6 py-3 text-right">Subtotal</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cart.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 font-bold text-gray-800 text-sm uppercase">{item.product.name}</td>
                                    <td className="px-6 py-3 text-right">
                                        <input type="number" className="w-24 text-right border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none" value={item.appliedPrice} onChange={e => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setCart(cart.map(i => i.product.id === item.product.id ? {...i, appliedPrice: val, subtotal: i.quantity * val} : i));
                                        }} />
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1), subtotal: Math.max(1, i.quantity - 1) * i.appliedPrice} : i))}><Minus size={14}/></button>
                                            <span className="font-bold">{item.quantity}</span>
                                            <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i))}><Plus size={14}/></button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">${item.subtotal.toLocaleString('es-AR')}</td>
                                    <td className="px-6 py-3 text-center">
                                        <button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-6 bg-slate-900 text-white flex justify-between items-center rounded-b-xl">
                <p className="text-4xl font-black tracking-tighter">${cart.reduce((a,c) => a + c.subtotal, 0).toLocaleString('es-AR')}</p>
                <button onClick={handleSaveBudget} disabled={cart.length === 0 || !clientName} className="bg-ferre-orange hover:bg-orange-600 text-white font-black py-4 px-12 rounded-xl transition-all disabled:opacity-50 flex items-center gap-3 shadow-2xl uppercase tracking-widest text-sm">
                    <Save size={20} /> Guardar Presupuesto
                </button>
            </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 animate-fade-in">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Válido Hasta</th>
                        <th className="px-6 py-4 text-right">Total</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {budgets.map(budget => (
                        <tr key={budget.id} className="hover:bg-gray-50 group">
                            <td className="px-6 py-4 font-mono text-sm text-gray-600">{budget.id}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{budget.clientName}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{budget.validUntil}</td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">${budget.total.toLocaleString('es-AR')}</td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { if(onConvertToSale) onConvertToSale(budget.items); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Facturar / Cobrar"><ShoppingBag size={18} /></button>
                                    <button onClick={() => setShowPrintModal(budget)} className="p-2 text-gray-400 hover:text-ferre-orange rounded-lg"><Printer size={18} /></button>
                                    <button onClick={() => setBudgets(budgets.filter(b => b.id !== budget.id))} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {/* MODAL MANUAL */}
      {isManualModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8">
                  <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><PlusCircle className="text-ferre-orange"/> Ítem Manual</h3>
                  <div className="space-y-4">
                      <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="Descripción..." value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} />
                      <input type="number" className="w-full p-4 bg-indigo-50 rounded-2xl outline-none font-black text-2xl text-indigo-700" placeholder="Precio..." value={manualForm.price || ''} onChange={e => setManualForm({...manualForm, price: parseFloat(e.target.value) || 0})} />
                      <button onClick={() => {
                          // Fix: Updated dummy product creation to use internalCodes array property instead of internalCode string
                          const dummy: Product = { id: `man-${Date.now()}`, internalCodes: ['VAR'], barcodes: [], providerCodes: [], name: manualForm.name.toUpperCase(), brand: 'VAR', provider: '', category: 'VAR', description: '', measureUnitSale: 'Un', measureUnitPurchase: 'Un', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS', vatRate: 21, listCost: 0, discounts: [0,0,0,0], costAfterDiscounts: 0, profitMargin: 0, priceNeto: 0, priceFinal: manualForm.price, stock: 0, stockDetails: [], minStock: 0, desiredStock: 0, reorderPoint: 0, location: '', ecommerce: {} };
                          setCart([...cart, { product: dummy, quantity: 1, appliedPrice: manualForm.price, subtotal: manualForm.price }]);
                          setIsManualModalOpen(false);
                      }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Cargar Ítem</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Presupuestos;
