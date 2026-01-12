
import React, { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Truck, Send, Trash2, Mail, FileText, ChevronDown, Check, Package, X, Printer, Download, Building2, Calendar, DollarSign, MessageCircle, RefreshCw, Minus } from 'lucide-react';
import { Product, Provider, ReplenishmentItem, ReplenishmentOrder } from '../types';
import { productDB } from '../services/storageService';

interface ReplenishmentProps {
    initialItems?: ReplenishmentItem[];
    onItemsConsumed?: () => void;
}

const Replenishment: React.FC<ReplenishmentProps> = ({ initialItems, onItemsConsumed }) => {
  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'PENDING_ORDERS'>('NEW_ORDER');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintModal, setShowPrintModal] = useState<ReplenishmentOrder | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const [providers] = useState<Provider[]>(() => {
      const saved = localStorage.getItem('ferrecloud_providers');
      return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<ReplenishmentItem[]>([]);
  const [orders, setOrders] = useState<ReplenishmentOrder[]>([]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    const all = await productDB.getAll();
    setProducts(all);
    setIsLoadingProducts(false);
  };

  const loadFromQueue = () => {
    const savedQueue = localStorage.getItem('ferrecloud_replenishment_queue');
    if (savedQueue) {
        try {
            const queue: ReplenishmentItem[] = JSON.parse(savedQueue);
            setCartItems(prev => {
                const next = [...prev];
                queue.forEach(item => {
                    if (!next.some(i => i.product.id === item.product.id)) {
                        next.push(item);
                    }
                });
                return next;
            });
            localStorage.removeItem('ferrecloud_replenishment_queue');
        } catch (e) { console.error("Error queue:", e); }
    }
  };

  useEffect(() => {
    loadProducts();
    loadFromQueue();
    window.addEventListener('replenishment_queue_updated', loadFromQueue);
    window.addEventListener('ferrecloud_products_updated', loadProducts);
    return () => {
        window.removeEventListener('replenishment_queue_updated', loadFromQueue);
        window.removeEventListener('ferrecloud_products_updated', loadProducts);
    };
  }, []);

  useEffect(() => {
      if (initialItems && initialItems.length > 0) {
          setCartItems(prev => {
              const newItems = [...prev];
              initialItems.forEach(incoming => {
                  const existingIndex = newItems.findIndex(i => i.product.id === incoming.product.id);
                  if (existingIndex >= 0) {
                      newItems[existingIndex] = { ...newItems[existingIndex] };
                  } else {
                      newItems.push(incoming);
                  }
              });
              return newItems;
          });
          onItemsConsumed?.();
      }
  }, [initialItems]);

  const addToCart = (product: Product) => {
      const existing = cartItems.find(i => i.product.id === product.id);
      if (existing) return;
      const defaultProvider = providers.find(p => p.name === product.provider);
      const diff = (product.stockMaximo || 0) - (product.stock || 0);
      const newItem: ReplenishmentItem = {
          product,
          quantity: diff > 0 ? diff : 1,
          selectedProviderId: defaultProvider ? defaultProvider.id : (providers[0]?.id || ''),
          selectedProviderName: product.provider || 'PROVEEDOR NO DEFINIDO'
      };
      setCartItems([...cartItems, newItem]);
  };

  const removeFromCart = (productId: string) => setCartItems(prev => prev.filter(i => i.product.id !== productId));

  const updateCartItem = (productId: string, updates: Partial<ReplenishmentItem>) => {
      setCartItems(prev => prev.map(item => {
          if (item.product.id === productId) {
              const updatedItem = { ...item, ...updates };
              if (updates.selectedProviderId) {
                  const pName = providers.find(p => p.id === updates.selectedProviderId)?.name || '';
                  updatedItem.selectedProviderName = pName;
              }
              return updatedItem;
          }
          return item;
        }));
    };
  
    const calculateOrderCost = (items: ReplenishmentItem[]) => {
        return items.reduce((acc, item) => acc + ((item.product.listCost || 0) * item.quantity), 0);
    };
  
    const generateOrders = () => {
        if (cartItems.length === 0) return;
        const groupedCart: Record<string, ReplenishmentItem[]> = {};
        cartItems.forEach(item => {
            const pid = item.selectedProviderId || 'S/D';
            if (!groupedCart[pid]) groupedCart[pid] = [];
            groupedCart[pid].push(item);
        });
  
        setOrders(prevOrders => {
            const updatedOrders = [...prevOrders];
            const newOrdersToAdd: ReplenishmentOrder[] = [];
            Object.keys(groupedCart).forEach(providerId => {
                const newItems = groupedCart[providerId];
                const existingOrderIndex = updatedOrders.findIndex(o => o.providerId === providerId && o.status === 'DRAFT');
                if (existingOrderIndex >= 0) {
                    const existingOrder = updatedOrders[existingOrderIndex];
                    const mergedItems = [...existingOrder.items];
                    newItems.forEach(newItem => {
                        const existingItemIndex = mergedItems.findIndex(i => i.product.id === newItem.product.id);
                        if (existingItemIndex >= 0) {
                            mergedItems[existingItemIndex].quantity += newItem.quantity;
                        } else {
                            mergedItems.push(newItem);
                        }
                    });
                    updatedOrders[existingOrderIndex] = { 
                        ...existingOrder, 
                        items: mergedItems, 
                        totalItems: mergedItems.length,
                        estimatedCost: calculateOrderCost(mergedItems)
                    };
                } else {
                    const providerName = newItems[0].selectedProviderName;
                    newOrdersToAdd.push({
                        id: `OC-${Math.floor(Math.random()*9000) + 1000}`,
                        date: new Date().toISOString().split('T')[0],
                        providerId, 
                        providerName, 
                        items: newItems, 
                        status: 'DRAFT', 
                        totalItems: newItems.length, 
                        estimatedCost: calculateOrderCost(newItems)
                    });
                }
            });
            return [...updatedOrders, ...newOrdersToAdd];
        });
        setCartItems([]);
        setActiveTab('PENDING_ORDERS');
    };
  
    const filteredProducts = products.filter(p => 
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.internalCodes || []).some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-4">
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                <Truck className="text-indigo-600" size={28}/> Armado de Pedidos
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Generación de órdenes valorizadas</p>
          </div>
          
          <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner border border-slate-200">
              <button 
                  onClick={() => setActiveTab('NEW_ORDER')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'NEW_ORDER' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>
                  Nuevo Pedido
              </button>
              <button 
                  onClick={() => setActiveTab('PENDING_ORDERS')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'PENDING_ORDERS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400'}`}>
                  Bandeja Salida ({orders.filter(o => o.status === 'DRAFT').length})
              </button>
          </div>
        </div>
  
        {activeTab === 'NEW_ORDER' && (
            <div className="flex-1 flex gap-6 overflow-hidden animate-fade-in">
                <div className="flex-[3] bg-white rounded-[2.5rem] shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/30 relative">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Buscador de Artículos (Maestro 140k)</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                            <input 
                                type="text" 
                                placeholder="NOMBRE, SKU O CÓDIGO DE BARRAS..." 
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-500 outline-none uppercase font-black text-sm transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[10px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4">Artículo / Referencia</th>
                                    <th className="px-6 py-4 text-center">Stock / Max</th>
                                    <th className="px-6 py-4 text-right">Costo Lista</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoadingProducts ? (
                                    <tr><td colSpan={4} className="py-20 text-center"><RefreshCw className="animate-spin mx-auto text-indigo-400"/></td></tr>
                                ) : filteredProducts.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-800 text-xs uppercase mb-1 leading-tight">{p.name}</div>
                                            <div className="text-[9px] text-gray-400 font-mono font-bold uppercase tracking-tighter">REF: {p.internalCodes[0]} • MARCA: {p.brand}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-black text-xs ${(p.stock || 0) <= (p.reorderPoint || 0) ? 'text-red-600' : 'text-slate-600'}`}>{p.stock || 0}</span> 
                                            <span className="text-slate-300 font-bold"> / {p.stockMaximo || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">${(p.listCost || 0).toLocaleString('es-AR')}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                              onClick={() => addToCart(p)}
                                              disabled={cartItems.some(i => i.product.id === p.id)}
                                              className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white disabled:opacity-30 transition-all shadow-sm">
                                                <Plus size={18}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
  
                <div className="w-[450px] bg-white rounded-[2.5rem] shadow-xl border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                          <ShoppingCart size={24} className="text-indigo-400"/>
                          <h3 className="font-black uppercase text-xs tracking-widest">Cola de Reposición</h3>
                        </div>
                        <span className="text-[10px] bg-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">{cartItems.length} ITEMS</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 custom-scrollbar">
                        {cartItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-50">
                                <Package size={64} strokeWidth={1} className="mb-4"/>
                                <p className="text-[10px] uppercase font-black tracking-widest">El carrito está vacío</p>
                            </div>
                        ) : (
                            cartItems.map(item => (
                                <div key={item.product.id} className="bg-white p-5 rounded-[1.8rem] border border-gray-200 shadow-sm relative group animate-fade-in">
                                    <button onClick={() => removeFromCart(item.product.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                    <h4 className="font-black text-slate-800 text-xs uppercase pr-8 leading-tight mb-4">{item.product.name}</h4>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Proveedor</label>
                                            <select className="w-full text-[10px] border-2 border-slate-100 rounded-xl p-2.5 bg-slate-50 font-black uppercase outline-none focus:border-indigo-500" value={item.selectedProviderId} onChange={(e) => updateCartItem(item.product.id, { selectedProviderId: e.target.value })}>
                                                {providers.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad Pedida</label>
                                                <input 
                                                    type="number" 
                                                    step="0.001"
                                                    className="w-full text-base border-2 border-slate-100 rounded-xl p-2.5 text-center font-black text-indigo-700 focus:border-indigo-500 outline-none" 
                                                    value={item.quantity} 
                                                    onChange={(e) => updateCartItem(item.product.id, { quantity: parseFloat(e.target.value.replace(',', '.')) || 0 })} 
                                                />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-slate-300 uppercase leading-none mb-1">Subtotal Est.</p>
                                                <p className="text-lg font-black text-slate-900 tracking-tighter">
                                                    ${((item.product.listCost || 0) * item.quantity).toLocaleString('es-AR')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-8 border-t border-gray-100 bg-white shrink-0">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Inversión Estimada Total</span>
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">${(calculateOrderCost(cartItems) || 0).toLocaleString('es-AR')}</span>
                        </div>
                        <button 
                          onClick={generateOrders}
                          disabled={cartItems.length === 0}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl disabled:opacity-30 transition-all active:scale-95 uppercase text-xs tracking-widest">
                            Consolidar Órdenes de Compra
                        </button>
                    </div>
                </div>
            </div>
        )}
  
        {activeTab === 'PENDING_ORDERS' && (
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-fade-in">
                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 custom-scrollbar">
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                            <Truck size={80} strokeWidth={1} className="mb-4 opacity-10"/>
                            <p className="text-[10px] uppercase font-black tracking-widest">No hay órdenes en bandeja de salida</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden animate-fade-in group">
                                <div className={`p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${order.status === 'SENT' ? 'bg-green-50/30' : 'bg-white'}`}>
                                    <div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <h4 className="font-black text-slate-800 text-xl uppercase tracking-tighter">{order.providerName}</h4>
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border ${order.status === 'DRAFT' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                                {order.status === 'DRAFT' ? 'Borrador' : 'Enviado'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                          <p className="text-[10px] text-gray-400 font-mono font-bold uppercase">ID: {order.id} • {order.date}</p>
                                          <p className="text-xs font-black text-indigo-600 uppercase">Total: ${(order.estimatedCost || 0).toLocaleString('es-AR')}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                          onClick={() => setShowPrintModal(order)}
                                          className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                            <Printer size={18}/>
                                        </button>
                                        <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">Enviar por WA / Email</button>
                                        <button onClick={() => setOrders(orders.filter(o => o.id !== order.id))} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                                <div className="p-2 overflow-x-auto">
                                    <table className="w-full text-left text-[11px]">
                                        <thead className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b">
                                            <tr>
                                                <th className="px-6 py-3">Referencia</th>
                                                <th className="px-6 py-3">Descripción Artículo</th>
                                                <th className="px-6 py-3 text-right">Costo Lista</th>
                                                <th className="px-6 py-3 text-center">Cant.</th>
                                                <th className="px-6 py-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {order.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 font-mono font-bold text-slate-400">{item.product.providerCodes?.[0] || item.product.internalCodes[0]}</td>
                                                    <td className="px-6 py-3 font-black text-slate-800 uppercase">{item.product.name}</td>
                                                    <td className="px-6 py-3 text-right text-slate-400 font-bold">${(item.product.listCost || 0).toLocaleString('es-AR')}</td>
                                                    <td className="px-6 py-3 text-center font-black text-slate-900">{item.quantity}</td>
                                                    <td className="px-6 py-3 text-right font-black text-indigo-600">${((item.product.listCost || 0) * item.quantity).toLocaleString('es-AR')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
  
        {showPrintModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 print:p-0">
                <div className="bg-white w-full max-w-4xl h-[90vh] shadow-2xl rounded-[3rem] overflow-hidden flex flex-col print:h-auto print:shadow-none print:rounded-none animate-fade-in print:fixed print:inset-0">
                    <div className="p-6 border-b flex justify-between items-center bg-slate-50 print:hidden shrink-0">
                        <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center gap-2"><FileText size={18}/> Vista de Impresión</h3>
                        <div className="flex gap-3">
                          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-xl"><Printer size={16}/> Imprimir PDF</button>
                          <button onClick={() => setShowPrintModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                    </div>
  
                    <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0 print:overflow-visible">
                        <div className="border border-slate-100 p-10 rounded-[2.5rem] shadow-sm print:border-none print:p-0 print:shadow-none">
                            <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Ferretería Bruzzone</h1>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Av. del Libertador 1200, CABA | CUIT: 30-12345678-9</p>
                                </div>
                                <div className="text-right">
                                    <div className="bg-slate-900 text-white px-5 py-2 rounded-xl inline-block font-mono font-black text-xl mb-2">{showPrintModal.id}</div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha: {showPrintModal.date}</p>
                                </div>
                            </div>
                            <div className="mb-10 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-end">
                                <div>
                                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Proveedor</p>
                                  <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{showPrintModal.providerName}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ítems Totales</p>
                                    <p className="text-2xl font-black">{showPrintModal.items.length}</p>
                                </div>
                            </div>
                            <table className="w-full text-left text-xs mb-10">
                                <thead>
                                    <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                                        <th className="px-4 py-4">Cód. Prov.</th>
                                        <th className="px-4 py-4">Descripción del Artículo</th>
                                        <th className="px-4 py-4 text-right">P. Unitario</th>
                                        <th className="px-4 py-4 text-center">Cant.</th>
                                        <th className="px-4 py-4 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {showPrintModal.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-4 font-mono font-bold text-slate-400">{item.product.providerCodes?.[0] || 'S/C'}</td>
                                            <td className="px-4 py-4 font-black text-slate-800 uppercase text-[11px]">{item.product.name}</td>
                                            <td className="px-4 py-4 text-right font-bold text-slate-400">${(item.product.listCost || 0).toLocaleString('es-AR')}</td>
                                            <td className="px-4 py-4 text-center font-black text-slate-900 text-sm">{item.quantity}</td>
                                            <td className="px-4 py-4 text-right font-black text-slate-900 text-sm">${((item.product.listCost || 0) * item.quantity).toLocaleString('es-AR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-end pt-10 border-t-2 border-dashed border-slate-200">
                                <div className="w-64 text-right">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Total de Orden Estimado</p>
                                    <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">${(showPrintModal.estimatedCost || 0).toLocaleString('es-AR')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  };
  
  export default Replenishment;
