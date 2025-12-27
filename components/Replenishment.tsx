
import React, { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Truck, Send, Trash2, Mail, FileText, ChevronDown, Check, Package, X, Printer, Download, Building2, Calendar, DollarSign, MessageCircle } from 'lucide-react';
import { Product, Provider, ReplenishmentItem, ReplenishmentOrder } from '../types';

interface ReplenishmentProps {
    initialItems?: ReplenishmentItem[];
    onItemsConsumed?: () => void;
}

// Mock Data Factories
// Fix: Updated createMockProduct to include missing isCombo and comboItems properties
const createMockProduct = (id: string, internalCode: string, name: string, providerName: string, providerCode: string, stock: number, cost: number): Product => ({
  id, internalCodes: [internalCode], barcodes: [internalCode], providerCodes: [providerCode], 
  name, brand: 'Generico', provider: providerName, category: 'General', description: '',
  measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
  vatRate: 21, listCost: cost, discounts: [0,0,0,0], costAfterDiscounts: cost, profitMargin: 40,
  priceNeto: cost * 1.4, priceFinal: cost * 1.4 * 1.21, stock, stockDetails: [], minStock: 10, desiredStock: 50, reorderPoint: 20,
  location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false },
  isCombo: false,
  comboItems: []
});

const Replenishment: React.FC<ReplenishmentProps> = ({ initialItems, onItemsConsumed }) => {
  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'PENDING_ORDERS'>('NEW_ORDER');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintModal, setShowPrintModal] = useState<ReplenishmentOrder | null>(null);
  
  // Data
  const [providers] = useState<Provider[]>(() => {
      const saved = localStorage.getItem('ferrecloud_providers');
      return saved ? JSON.parse(saved) : [
        { id: 'P1', name: 'Herramientas Global SA', cuit: '30-11223344-5', contact: 'Roberto', balance: 0, defaultDiscounts: [0,0,0] },
        { id: 'P2', name: 'Pinturas del Centro', cuit: '30-55667788-9', contact: 'Maria', balance: 0, defaultDiscounts: [0,0,0] },
        { id: 'P3', name: 'Bulonera Industrial', cuit: '30-99887766-1', contact: 'Carlos', balance: 0, defaultDiscounts: [0,0,0] },
      ];
  });

  const [products] = useState<Product[]>([
    createMockProduct('1', 'TOR-001', 'Tornillo Autoperforante 2"', 'Herramientas Global SA', 'HG-5502', 5, 120),
    createMockProduct('2', 'MAR-055', 'Martillo Galponero', 'Herramientas Global SA', 'HG-9900', 3, 4500),
    createMockProduct('3', 'PINT-20L', 'Látex Interior 20L', 'Pinturas del Centro', 'SW-2000', 2, 35000),
    createMockProduct('4', 'BUL-HEX', 'Bulon Hexagonal 10mm', 'Bulonera Industrial', 'BU-1010', 500, 85),
    createMockProduct('5', 'LIJ-180', 'Lija al agua 180', 'Pinturas del Centro', 'LIJ-AA', 20, 210),
  ]);

  // Cart State
  const [cartItems, setCartItems] = useState<ReplenishmentItem[]>([]);
  
  // Orders State (Pending)
  const [orders, setOrders] = useState<ReplenishmentOrder[]>([]);

  // --- EFFECT: LOAD ITEMS FROM SHORTAGES ---
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
          if (onItemsConsumed) onItemsConsumed();
      }
  }, [initialItems, onItemsConsumed]);

  const addToCart = (product: Product) => {
      const existing = cartItems.find(i => i.product.id === product.id);
      if (existing) return;
      const defaultProvider = providers.find(p => p.name === product.provider);
      const newItem: ReplenishmentItem = {
          product,
          quantity: product.desiredStock - product.stock > 0 ? product.desiredStock - product.stock : 1,
          selectedProviderId: defaultProvider ? defaultProvider.id : (providers[0]?.id || ''),
          selectedProviderName: product.provider
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
      return items.reduce((acc, item) => acc + (item.product.listCost * item.quantity), 0);
  };

  const generateOrders = () => {
      if (cartItems.length === 0) return;
      const groupedCart: Record<string, ReplenishmentItem[]> = {};
      cartItems.forEach(item => {
          if (!groupedCart[item.selectedProviderId]) groupedCart[item.selectedProviderId] = [];
          groupedCart[item.selectedProviderId].push(item);
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
                          mergedItems[existingItemIndex] = { ...mergedItems[existingItemIndex], quantity: mergedItems[existingItemIndex].quantity + newItem.quantity };
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

  const sendOrder = (orderId: string) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'SENT' } : o));
      alert("Pedido marcado como enviado en el sistema.");
  };

  // --- LOGICA DE ENVIO EXTERNO ---
  const sendViaWhatsApp = (order: ReplenishmentOrder) => {
      const provider = providers.find(p => p.id === order.providerId);
      if (!provider || !provider.orderPhone) {
          alert("Este proveedor no tiene configurado un teléfono de pedidos.");
          return;
      }

      let message = `Hola aca te envio un pedido, muchas gracias.\n\n`;
      message += `*Orden de Compra: ${order.id}*\n`;
      message += `Fecha: ${order.date}\n\n`;
      message += `*Detalle:*\n`;
      order.items.forEach(item => {
          message += `- ${item.quantity} x ${item.product.name} (Ref: ${item.product.providerCodes[0] || 'N/A'})\n`;
      });
      message += `\n*Total Estimado: $${order.estimatedCost.toLocaleString('es-AR')}*`;

      const encodedMsg = encodeURIComponent(message);
      const url = `https://wa.me/${provider.orderPhone.replace(/[^0-9]/g, '')}?text=${encodedMsg}`;
      window.open(url, '_blank');
      sendOrder(order.id);
  };

  const sendViaEmail = (order: ReplenishmentOrder) => {
      const provider = providers.find(p => p.id === order.providerId);
      if (!provider || !provider.orderEmail) {
          alert("Este proveedor no tiene configurado un email de pedidos.");
          return;
      }

      const subject = `PEDIDO DE COMPRA - ${order.id}`;
      let body = `Hola aca te envio un pedido, muchas gracias.\n\n`;
      body += `Orden de Compra: ${order.id}\n`;
      body += `Fecha: ${order.date}\n\n`;
      body += `Detalle del Pedido:\n`;
      order.items.forEach(item => {
          body += `- ${item.quantity} x ${item.product.name} (Cód. Prov: ${item.product.providerCodes[0] || 'S/D'})\n`;
      });
      body += `\nTotal Estimado: $${order.estimatedCost.toLocaleString('es-AR')}\n\nPor favor confirmar recepción.`;

      const mailtoUrl = `mailto:${provider.orderEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
      sendOrder(order.id);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.internalCodes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Armado de Pedidos</h2>
          <p className="text-gray-500 text-sm">Generación y envío de órdenes de compra valorizadas.</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('NEW_ORDER')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'NEW_ORDER' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                Armar Pedido
            </button>
            <button 
                onClick={() => setActiveTab('PENDING_ORDERS')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'PENDING_ORDERS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                Bandeja de Salida ({orders.filter(o => o.status === 'DRAFT').length})
            </button>
        </div>
      </div>

      {activeTab === 'NEW_ORDER' && (
          <div className="flex gap-6 h-full overflow-hidden animate-fade-in">
              <div className="w-3/5 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                              type="text" 
                              placeholder="Buscar producto por nombre o código..." 
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                          />
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left">
                          <thead className="bg-white sticky top-0 z-10 text-xs text-gray-500 uppercase border-b border-gray-200">
                              <tr>
                                  <th className="px-4 py-3">Producto</th>
                                  <th className="px-4 py-3">Stock / Ideal</th>
                                  <th className="px-4 py-3 text-right">Costo Lista</th>
                                  <th className="px-4 py-3 text-center">Acción</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {filteredProducts.map(p => (
                                  <tr key={p.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                          <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                                          <div className="text-xs text-gray-500 font-mono">{p.internalCodes[0]}</div>
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                          <span className={`font-bold ${p.stock <= p.minStock ? 'text-red-600' : 'text-gray-700'}`}>{p.stock}</span> 
                                          <span className="text-gray-400"> / {p.desiredStock}</span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-800">${p.listCost.toLocaleString('es-AR')}</td>
                                      <td className="px-4 py-3 text-center">
                                          <button 
                                            onClick={() => addToCart(p)}
                                            disabled={cartItems.some(i => i.product.id === p.id)}
                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors">
                                              <Plus size={16}/>
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="w-2/5 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                  <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ShoppingCart size={20} className="text-ferre-orange"/>
                        <h3 className="font-bold">Carrito de Reposición</h3>
                      </div>
                      <span className="text-xs bg-ferre-orange px-2 py-0.5 rounded-full font-black">{cartItems.length} ITEMS</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                      {cartItems.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                              <Package size={48} className="mb-2 opacity-50"/>
                              <p className="text-sm">Agrega productos de la lista izquierda.</p>
                          </div>
                      ) : (
                          cartItems.map(item => (
                              <div key={item.product.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group animate-fade-in">
                                  <button onClick={() => removeFromCart(item.product.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                  <h4 className="font-bold text-gray-800 text-sm pr-6">{item.product.name}</h4>
                                  <div className="flex justify-between items-center mb-3">
                                      <p className="text-[10px] text-gray-400 font-mono uppercase">Costo: ${item.product.listCost.toLocaleString('es-AR')}</p>
                                      <p className="text-[10px] font-bold text-indigo-600 uppercase">Sub: ${(item.product.listCost * item.quantity).toLocaleString('es-AR')}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                      <div>
                                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Proveedor</label>
                                          <select className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50" value={item.selectedProviderId} onChange={(e) => updateCartItem(item.product.id, { selectedProviderId: e.target.value })}>
                                              {providers.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cantidad</label>
                                          <input type="number" className="w-full text-xs border border-gray-200 rounded-lg p-2 text-center font-bold" value={item.quantity} onChange={(e) => updateCartItem(item.product.id, { quantity: parseFloat(e.target.value) || 0 })} />
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
                  <div className="p-5 border-t border-gray-200 bg-white">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-500 font-bold text-sm uppercase">Total Pedido</span>
                          <span className="text-2xl font-black text-gray-900">${calculateOrderCost(cartItems).toLocaleString('es-AR')}</span>
                      </div>
                      <button 
                        onClick={generateOrders}
                        disabled={cartItems.length === 0}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95">
                          Generar Órdenes por Proveedor <ChevronDown size={18}/>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'PENDING_ORDERS' && (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-fade-in">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                  {orders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                          <Truck size={48} className="mb-4 opacity-20"/>
                          <p>No hay pedidos en la bandeja de salida.</p>
                      </div>
                  ) : (
                      orders.map(order => (
                          <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in group">
                              <div className={`p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${order.status === 'SENT' ? 'bg-green-50/50' : 'bg-white'}`}>
                                  <div>
                                      <div className="flex items-center gap-3">
                                          <h4 className="font-black text-gray-800 text-lg uppercase tracking-tight">{order.providerName}</h4>
                                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${order.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                              {order.status === 'DRAFT' ? 'Borrador' : 'Enviado'}
                                          </span>
                                      </div>
                                      <div className="flex items-center gap-4 mt-1">
                                        <p className="text-xs text-gray-400 font-mono">ID: {order.id} | Fecha: {order.date}</p>
                                        <p className="text-xs font-bold text-indigo-600">Total: ${order.estimatedCost.toLocaleString('es-AR')}</p>
                                      </div>
                                  </div>
                                  
                                  <div className="flex gap-2 w-full md:w-auto">
                                      <button 
                                        onClick={() => setShowPrintModal(order)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-black uppercase tracking-tighter transition-all shadow-sm">
                                          <Printer size={14}/> PDF
                                      </button>
                                      {order.status === 'DRAFT' && (
                                          <>
                                            <button 
                                                onClick={() => sendViaWhatsApp(order)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md text-xs font-black uppercase tracking-tighter transition-all active:scale-95">
                                                <MessageCircle size={14}/> WhatsApp
                                            </button>
                                            <button 
                                                onClick={() => sendViaEmail(order)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md text-xs font-black uppercase tracking-tighter transition-all active:scale-95">
                                                <Mail size={14}/> Email
                                            </button>
                                          </>
                                      )}
                                  </div>
                              </div>
                              <div className="p-4">
                                  <table className="w-full text-left text-sm">
                                      <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                          <tr>
                                              <th className="py-2 w-32">Cód. Prov.</th>
                                              <th className="py-2">Descripción</th>
                                              <th className="py-2 text-right">Costo Unit.</th>
                                              <th className="py-2 text-center w-24">Cant.</th>
                                              <th className="px-2 text-right w-32">Subtotal</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                          {order.items.map((item, idx) => (
                                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                  <td className="py-2 font-mono text-[10px] text-gray-500">{item.product.providerCodes[0] || item.product.internalCodes[0]}</td>
                                                  <td className="py-2 font-bold text-gray-700">{item.product.name}</td>
                                                  <td className="py-2 text-right text-gray-400">${item.product.listCost.toLocaleString('es-AR')}</td>
                                                  <td className="py-2 text-center font-black text-gray-800">{item.quantity}</td>
                                                  <td className="py-2 text-right font-black text-indigo-600">${(item.product.listCost * item.quantity).toLocaleString('es-AR')}</td>
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

      {/* --- MODAL DE IMPRESIÓN PROFESIONAL --- */}
      {showPrintModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 print:p-0">
              <div className="bg-white w-full max-w-3xl h-[90vh] shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col print:h-auto print:shadow-none print:rounded-none animate-fade-in print:fixed print:inset-0 print:z-[200]">
                  
                  {/* Botones de acción modal (Hidden when printing) */}
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50 print:hidden">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-xl text-white">
                            <FileText size={20}/>
                        </div>
                        <h3 className="font-black text-gray-800 uppercase tracking-tighter">Vista Previa de Orden de Compra</h3>
                      </div>
                      <div className="flex gap-2">
                        <button 
                            onClick={() => window.print()}
                            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-slate-800 shadow-xl transition-all active:scale-95">
                            <Printer size={18}/> Imprimir / Guardar PDF
                        </button>
                        <button onClick={() => setShowPrintModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={24}/>
                        </button>
                      </div>
                  </div>

                  {/* DOCUMENTO REAL (PRINTABLE) */}
                  <div className="flex-1 overflow-y-auto p-12 bg-white print:overflow-visible print:p-0">
                      <div className="border border-gray-100 p-10 shadow-sm print:border-none print:shadow-none">
                          
                          {/* Membrete */}
                          <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-8">
                              <div>
                                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Ferretería Bruzzone</h1>
                                  <div className="text-[10px] text-gray-500 font-black uppercase space-y-1 tracking-widest">
                                      <p className="flex items-center gap-1"><Building2 size={12}/> Av. del Libertador 1200, CABA</p>
                                      <p>CUIT: 30-12345678-9 | IIBB: 901-123456-1</p>
                                      <p>Tel: +54 11 4455-6677 | contacto@ferrebruzzone.com.ar</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl inline-block mb-4">
                                      <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">Orden de Compra</p>
                                      <p className="text-2xl font-mono font-black leading-none">{showPrintModal.id}</p>
                                  </div>
                                  <p className="text-xs font-black text-gray-400 flex items-center justify-end gap-2 uppercase tracking-widest">
                                      <Calendar size={14}/> Fecha de Emisión: {showPrintModal.date}
                                  </p>
                              </div>
                          </div>

                          {/* Info Proveedor */}
                          <div className="mb-10 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex justify-between items-end">
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Proveedor Destinatario</p>
                                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{showPrintModal.providerName}</h4>
                                {providers.find(p => p.id === showPrintModal.providerId)?.cuit && (
                                    <p className="text-sm font-mono font-bold text-slate-500 mt-1">CUIT: {providers.find(p => p.id === showPrintModal.providerId)?.cuit}</p>
                                )}
                              </div>
                              <div className="text-right">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Items Totales</span>
                                  <span className="text-2xl font-black text-slate-800">{showPrintModal.items.length}</span>
                              </div>
                          </div>

                          {/* Tabla de Items */}
                          <table className="w-full text-left mb-12">
                              <thead>
                                  <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                                      <th className="px-5 py-4 rounded-l-2xl">Cód. Ref</th>
                                      <th className="px-5 py-4">Descripción del Artículo</th>
                                      <th className="px-5 py-4 text-right">P. Unitario</th>
                                      <th className="px-5 py-4 text-center">Cantidad</th>
                                      <th className="px-5 py-4 text-right rounded-r-2xl">Subtotal</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {showPrintModal.items.map((item, idx) => (
                                      <tr key={idx} className="group">
                                          <td className="px-5 py-5 font-mono text-xs text-slate-400 font-bold">{item.product.providerCodes[0] || item.product.internalCodes[0]}</td>
                                          <td className="px-5 py-5">
                                              <p className="font-black text-slate-800 uppercase text-sm tracking-tighter">{item.product.name}</p>
                                              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{item.product.brand}</p>
                                          </td>
                                          <td className="px-5 py-5 text-right font-mono text-gray-500">${item.product.listCost.toLocaleString('es-AR')}</td>
                                          <td className="px-5 py-5 text-center font-black text-slate-900 text-lg">{item.quantity}</td>
                                          <td className="px-5 py-5 text-right font-black text-slate-900 text-sm">${(item.product.listCost * item.quantity).toLocaleString('es-AR')}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>

                          {/* Resumen de Precios */}
                          <div className="flex justify-end mb-12">
                                <div className="w-full max-w-xs bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Total Estimado de Orden</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-ferre-orange">$</span>
                                        <span className="text-4xl font-black tracking-tighter leading-none">{showPrintModal.estimatedCost.toLocaleString('es-AR')}</span>
                                    </div>
                                    <p className="text-[9px] mt-4 font-bold uppercase opacity-40 leading-tight">Precios sujetos a variación al momento de facturación.</p>
                                </div>
                          </div>

                          {/* Footer del Documento */}
                          <div className="mt-20 flex flex-col md:flex-row justify-between items-end border-t-2 border-dashed border-gray-200 pt-10 gap-8">
                              <div className="max-w-md">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Notas u Observaciones</p>
                                  <p className="text-xs text-gray-600 leading-relaxed italic font-medium">
                                      {showPrintModal.notes || 'Sin indicaciones adicionales.'}
                                  </p>
                              </div>
                              <div className="text-center w-64">
                                  <div className="h-20 border-b-2 border-slate-900 flex items-center justify-center opacity-10">
                                      <Building2 size={48}/>
                                  </div>
                                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter mt-4">Autorización de Compra</p>
                                  <p className="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-widest">Bruzzone Cloud System</p>
                              </div>
                          </div>

                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Estilos para impresión (Clean Print Mode) */}
      <style>{`
          @media print {
              body * { visibility: hidden; pointer-events: none; }
              #root { display: none !important; }
              .print\\:fixed, .print\\:fixed * { visibility: visible; pointer-events: auto; }
              .print\\:fixed { 
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

export default Replenishment;
