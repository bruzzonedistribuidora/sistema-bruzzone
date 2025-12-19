
import React, { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Truck, Send, Trash2, Mail, FileText, ChevronDown, Check, Package, X } from 'lucide-react';
import { Product, Provider, ReplenishmentItem, ReplenishmentOrder } from '../types';

interface ReplenishmentProps {
    initialItems?: ReplenishmentItem[];
    onItemsConsumed?: () => void;
}

// Mock Data Factories
const createMockProduct = (id: string, internalCode: string, name: string, providerName: string, providerCode: string, stock: number): Product => ({
  id, internalCode, barcodes: [internalCode], providerCodes: [providerCode], 
  name, brand: 'Generico', provider: providerName, category: 'General', description: '',
  measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
  vatRate: 21, listCost: 100, discounts: [0,0,0,0], costAfterDiscounts: 100, profitMargin: 40,
  priceNeto: 100, priceFinal: 150, stock, stockDetails: [], minStock: 10, desiredStock: 50, reorderPoint: 20,
  location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
});

const Replenishment: React.FC<ReplenishmentProps> = ({ initialItems, onItemsConsumed }) => {
  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'PENDING_ORDERS'>('NEW_ORDER');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data
  const [providers] = useState<Provider[]>([
    { id: 'P1', name: 'Herramientas Global SA', cuit: '', contact: '', balance: 0, defaultDiscounts: [0,0,0] },
    { id: 'P2', name: 'Pinturas del Centro', cuit: '', contact: '', balance: 0, defaultDiscounts: [0,0,0] },
    { id: 'P3', name: 'Bulonera Industrial', cuit: '', contact: '', balance: 0, defaultDiscounts: [0,0,0] },
  ]);

  const [products] = useState<Product[]>([
    createMockProduct('1', 'TOR-001', 'Tornillo Autoperforante 2"', 'Herramientas Global SA', 'HG-5502', 5),
    createMockProduct('2', 'MAR-055', 'Martillo Galponero', 'Herramientas Global SA', 'HG-9900', 3),
    createMockProduct('3', 'PINT-20L', 'Látex Interior 20L', 'Pinturas del Centro', 'SW-2000', 2),
    createMockProduct('4', 'BUL-HEX', 'Bulon Hexagonal 10mm', 'Bulonera Industrial', 'BU-1010', 500),
    createMockProduct('5', 'LIJ-180', 'Lija al agua 180', 'Pinturas del Centro', 'LIJ-AA', 20),
  ]);

  // Cart State
  const [cartItems, setCartItems] = useState<ReplenishmentItem[]>([]);
  
  // Orders State (Pending)
  const [orders, setOrders] = useState<ReplenishmentOrder[]>([]);

  // --- EFFECT: LOAD ITEMS FROM SHORTAGES ---
  useEffect(() => {
      if (initialItems && initialItems.length > 0) {
          setCartItems(prev => {
              // Merge Logic: Don't duplicate if already in cart
              const newItems = [...prev];
              initialItems.forEach(incoming => {
                  const existingIndex = newItems.findIndex(i => i.product.id === incoming.product.id);
                  if (existingIndex >= 0) {
                      // Update quantity if already exists
                      newItems[existingIndex] = {
                          ...newItems[existingIndex],
                          quantity: newItems[existingIndex].quantity // Keep existing or update? Let's just keep existing or maybe max
                      };
                  } else {
                      newItems.push(incoming);
                  }
              });
              return newItems;
          });
          
          if (onItemsConsumed) {
              onItemsConsumed();
          }
      }
  }, [initialItems, onItemsConsumed]);

  // --- ACTIONS ---

  const addToCart = (product: Product) => {
      // Check if already in cart
      const existing = cartItems.find(i => i.product.id === product.id);
      if (existing) return; // Prevent duplicates for simplicity, or could increment

      // Find Default Provider ID
      const defaultProvider = providers.find(p => p.name === product.provider);
      
      const newItem: ReplenishmentItem = {
          product,
          quantity: product.desiredStock - product.stock > 0 ? product.desiredStock - product.stock : 1, // Suggest quantity based on stock
          selectedProviderId: defaultProvider ? defaultProvider.id : (providers[0]?.id || ''),
          selectedProviderName: product.provider
      };
      setCartItems([...cartItems, newItem]);
  };

  const removeFromCart = (productId: string) => {
      setCartItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateCartItem = (productId: string, updates: Partial<ReplenishmentItem>) => {
      setCartItems(prev => prev.map(item => {
          if (item.product.id === productId) {
              const updatedItem = { ...item, ...updates };
              // Update name if ID changed
              if (updates.selectedProviderId) {
                  const pName = providers.find(p => p.id === updates.selectedProviderId)?.name || '';
                  updatedItem.selectedProviderName = pName;
              }
              return updatedItem;
          }
          return item;
      }));
  };

  const generateOrders = () => {
      if (cartItems.length === 0) return;

      // Group new items by provider
      const groupedCart: Record<string, ReplenishmentItem[]> = {};
      cartItems.forEach(item => {
          if (!groupedCart[item.selectedProviderId]) {
              groupedCart[item.selectedProviderId] = [];
          }
          groupedCart[item.selectedProviderId].push(item);
      });

      setOrders(prevOrders => {
          const updatedOrders = [...prevOrders];
          const newOrdersToAdd: ReplenishmentOrder[] = [];

          Object.keys(groupedCart).forEach(providerId => {
              const newItems = groupedCart[providerId];
              
              // Find existing DRAFT order for this provider to merge into
              const existingOrderIndex = updatedOrders.findIndex(
                  o => o.providerId === providerId && o.status === 'DRAFT'
              );

              if (existingOrderIndex >= 0) {
                  // Merge into existing order
                  const existingOrder = updatedOrders[existingOrderIndex];
                  const mergedItems = [...existingOrder.items];

                  newItems.forEach(newItem => {
                      const existingItemIndex = mergedItems.findIndex(i => i.product.id === newItem.product.id);
                      if (existingItemIndex >= 0) {
                          // Update quantity if product exists in order
                          mergedItems[existingItemIndex] = {
                              ...mergedItems[existingItemIndex],
                              quantity: mergedItems[existingItemIndex].quantity + newItem.quantity
                          };
                      } else {
                          // Add new item
                          mergedItems.push(newItem);
                      }
                  });

                  updatedOrders[existingOrderIndex] = {
                      ...existingOrder,
                      items: mergedItems,
                      totalItems: mergedItems.length
                  };
              } else {
                  // Create new order
                  const providerName = newItems[0].selectedProviderName;
                  newOrdersToAdd.push({
                      id: `PED-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                      date: new Date().toISOString().split('T')[0],
                      providerId,
                      providerName,
                      items: newItems,
                      status: 'DRAFT',
                      totalItems: newItems.length,
                      estimatedCost: 0 // Mock
                  });
              }
          });

          return [...updatedOrders, ...newOrdersToAdd];
      });

      setCartItems([]);
      setActiveTab('PENDING_ORDERS');
      alert(`Se han procesado los pedidos. Si ya existía un borrador para el proveedor, se han agregado los ítems.`);
  };

  const sendOrder = (orderId: string) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'SENT' } : o));
      alert("Pedido enviado correctamente (Simulación)");
  };

  // --- FILTERING ---
  const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.internalCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pedidos de Reposición</h2>
          <p className="text-gray-500 text-sm">Generación y envío de órdenes de compra a proveedores.</p>
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

      {/* --- TAB: NEW ORDER --- */}
      {activeTab === 'NEW_ORDER' && (
          <div className="flex gap-6 h-full overflow-hidden">
              {/* Product Selector */}
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
                                  <th className="px-4 py-3">Proveedor Habitual</th>
                                  <th className="px-4 py-3 text-center">Acción</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {filteredProducts.map(p => (
                                  <tr key={p.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                          <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                                          <div className="text-xs text-gray-500 font-mono">{p.internalCode}</div>
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                          <span className={`font-bold ${p.stock <= p.minStock ? 'text-red-600' : 'text-gray-700'}`}>{p.stock}</span> 
                                          <span className="text-gray-400"> / {p.desiredStock}</span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{p.provider}</td>
                                      <td className="px-4 py-3 text-center">
                                          <button 
                                            onClick={() => addToCart(p)}
                                            disabled={cartItems.some(i => i.product.id === p.id)}
                                            className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                              <Plus size={16}/>
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Cart / Draft */}
              <div className="w-2/5 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
                  <div className="p-5 border-b border-gray-200 bg-slate-900 text-white rounded-t-xl flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2"><ShoppingCart size={20}/> Carrito de Reposición</h3>
                      <span className="text-xs bg-indigo-500 px-2 py-1 rounded">{cartItems.length} Items</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                      {cartItems.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                              <Package size={48} className="mb-2 opacity-50"/>
                              <p className="text-sm">Agrega productos para comenzar el pedido.</p>
                          </div>
                      ) : (
                          cartItems.map(item => (
                              <div key={item.product.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative group">
                                  <button onClick={() => removeFromCart(item.product.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                                      <Trash2 size={14}/>
                                  </button>
                                  
                                  <h4 className="font-bold text-gray-800 text-sm pr-6">{item.product.name}</h4>
                                  <p className="text-xs text-gray-500 font-mono mb-3">{item.product.internalCode}</p>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                      <div>
                                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Proveedor</label>
                                          <select 
                                            className="w-full text-xs border border-gray-300 rounded p-1.5 focus:border-indigo-500 outline-none"
                                            value={item.selectedProviderId}
                                            onChange={(e) => updateCartItem(item.product.id, { selectedProviderId: e.target.value })}
                                          >
                                              {providers.map(prov => (
                                                  <option key={prov.id} value={prov.id}>{prov.name}</option>
                                              ))}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cantidad</label>
                                          <input 
                                            type="number" 
                                            className="w-full text-xs border border-gray-300 rounded p-1.5 focus:border-indigo-500 outline-none text-center font-bold"
                                            value={item.quantity}
                                            onChange={(e) => updateCartItem(item.product.id, { quantity: parseFloat(e.target.value) || 0 })}
                                          />
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-white">
                      <button 
                        onClick={generateOrders}
                        disabled={cartItems.length === 0}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                          Generar / Actualizar Pedidos <ChevronDown size={16}/>
                      </button>
                      <p className="text-[10px] text-gray-400 text-center mt-2">
                          Los ítems se agregarán a pedidos borradores existentes o crearán nuevos.
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* --- TAB: PENDING ORDERS --- */}
      {activeTab === 'PENDING_ORDERS' && (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">Pedidos Generados</h3>
                  <div className="flex gap-2">
                      <span className="text-xs font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded border border-yellow-200">
                          {orders.filter(o => o.status === 'DRAFT').length} Borradores
                      </span>
                      <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded border border-green-200">
                          {orders.filter(o => o.status === 'SENT').length} Enviados
                      </span>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                  {orders.length === 0 ? (
                      <div className="text-center text-gray-400 mt-10">No hay pedidos generados aún.</div>
                  ) : (
                      orders.map(order => (
                          <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                              <div className={`p-4 border-b border-gray-100 flex justify-between items-center ${order.status === 'SENT' ? 'bg-green-50' : 'bg-white'}`}>
                                  <div>
                                      <div className="flex items-center gap-3">
                                          <h4 className="font-bold text-gray-800 text-lg">{order.providerName}</h4>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${order.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                              {order.status === 'DRAFT' ? 'Borrador' : 'Enviado'}
                                          </span>
                                      </div>
                                      <p className="text-xs text-gray-500 font-mono mt-1">ID: {order.id} | Fecha: {order.date}</p>
                                  </div>
                                  
                                  {order.status === 'DRAFT' && (
                                      <div className="flex gap-2">
                                          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 text-xs font-bold" onClick={() => alert('PDF Generado (Simulación)')}>
                                              <FileText size={14}/> Vista Previa PDF
                                          </button>
                                          <button 
                                            onClick={() => sendOrder(order.id)}
                                            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm text-xs font-bold">
                                              <Send size={14}/> Enviar Pedido
                                          </button>
                                      </div>
                                  )}
                                  {order.status === 'SENT' && (
                                      <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                                          <Check size={18}/> Enviado con éxito
                                      </div>
                                  )}
                              </div>

                              <div className="p-4">
                                  <table className="w-full text-left text-sm">
                                      <thead className="text-gray-500 border-b border-gray-100">
                                          <tr>
                                              <th className="py-2 w-32">Cód. Proveedor</th>
                                              <th className="py-2">Descripción</th>
                                              <th className="py-2 text-center w-24">Cant.</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                          {order.items.map((item, idx) => (
                                              <tr key={idx}>
                                                  <td className="py-2 font-mono text-xs text-gray-600">
                                                      {item.product.providerCodes[0] || item.product.internalCode}
                                                  </td>
                                                  <td className="py-2 font-medium text-gray-800">{item.product.name}</td>
                                                  <td className="py-2 text-center font-bold">{item.quantity}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                              
                              <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
                                  <span className="text-xs text-gray-500">Total Artículos: {order.totalItems}</span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default Replenishment;
