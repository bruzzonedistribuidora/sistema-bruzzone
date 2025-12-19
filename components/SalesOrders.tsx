import React, { useState } from 'react';
import { Search, Plus, ShoppingCart, Trash2, Save, FileText, CheckCircle, Clock, Package, Truck, Minus, ArrowRight, ClipboardList, AlertCircle, X, Receipt } from 'lucide-react';
import { InvoiceItem, Product, SalesOrder, SalesOrderStatus } from '../types';

// Mock Data Generators
const createMockProduct = (id: string, internalCode: string, name: string, priceFinal: number, stock: number, category: string): Product => ({
  id, internalCode, barcodes: [internalCode], providerCodes: [],
  name, brand: 'Generico', provider: 'Proveedor Demo', category, description: '',
  measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
  vatRate: 21, listCost: priceFinal * 0.6, discounts: [0, 0, 0, 0], costAfterDiscounts: priceFinal * 0.6, profitMargin: 40,
  priceNeto: priceFinal / 1.21, priceFinal: priceFinal, stock, stockDetails: [], minStock: 10, desiredStock: 20, reorderPoint: 5,
  location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
});

const SalesOrders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'MANAGEMENT'>('NEW_ORDER');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENTE'>('NORMAL');
  const [orderNotes, setOrderNotes] = useState('');

  // Initial Mock Orders
  const [orders, setOrders] = useState<SalesOrder[]>([
      {
          id: 'PED-1001',
          clientName: 'Constructora del Norte',
          date: '2023-10-27',
          priority: 'URGENTE',
          status: 'PENDING',
          items: [{ product: createMockProduct('1', 'TOR-001', 'Tornillo Autoperforante', 150, 5000, 'Fijaciones'), quantity: 500, subtotal: 75000 }],
          notes: 'Entregar antes del mediodía',
          total: 75000
      },
      {
          id: 'PED-1002',
          clientName: 'Juan Perez',
          date: '2023-10-26',
          priority: 'NORMAL',
          status: 'IN_PREPARATION',
          items: [{ product: createMockProduct('4', 'PINT-20L', 'Látex Interior 20L', 45000, 8, 'Pinturería'), quantity: 2, subtotal: 90000 }],
          notes: '',
          total: 90000
      },
      {
          id: 'PED-1003',
          clientName: 'Arq. Lopez',
          date: '2023-10-25',
          priority: 'NORMAL',
          status: 'READY',
          items: [{ product: createMockProduct('3', 'TAL-IND', 'Taladro Percutor', 85000, 5, 'Herramientas'), quantity: 1, subtotal: 85000 }],
          notes: 'Retira mañana',
          total: 85000
      }
  ]);

  const sampleProducts: Product[] = [
    createMockProduct('1', 'TOR-001', 'Tornillo Autoperforante 2"', 150, 5000, 'Fijaciones'),
    createMockProduct('2', 'MAR-055', 'Martillo Galponero', 12500, 45, 'Herramientas'),
    createMockProduct('3', 'TAL-IND', 'Taladro Percutor 750w', 85000, 5, 'Herramientas Eléctricas'),
    createMockProduct('4', 'PINT-20L', 'Látex Interior 20L', 45000, 8, 'Pinturería'),
    createMockProduct('5', 'CEM-LOM', 'Cemento Loma Negra 50kg', 9500, 200, 'Construcción'),
  ];

  const filteredProducts = sampleProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.internalCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- ACTIONS ---

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.priceFinal }
          : item
        );
      }
      return [...prev, { product, quantity: 1, subtotal: product.priceFinal }];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => {
        if (item.product.id === productId) {
            return { ...item, quantity: newQuantity, subtotal: newQuantity * item.product.priceFinal };
        }
        return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const calculateTotal = () => cart.reduce((acc, item) => acc + item.subtotal, 0);

  const handleCreateOrder = () => {
      if (!clientName || cart.length === 0) return;

      const newOrder: SalesOrder = {
          id: `PED-${Math.floor(Date.now() / 1000)}`,
          clientName,
          date: new Date().toISOString().split('T')[0],
          priority,
          status: 'PENDING',
          items: [...cart],
          notes: orderNotes,
          total: calculateTotal()
      };

      setOrders([newOrder, ...orders]);
      setCart([]);
      setClientName('');
      setOrderNotes('');
      setPriority('NORMAL');
      setActiveTab('MANAGEMENT');
      alert('Orden de pedido creada correctamente.');
  };

  const updateOrderStatus = (orderId: string, newStatus: SalesOrderStatus) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const handleConvertToSale = (order: SalesOrder) => {
      // In a real app, this would redirect to POS or Remitos with data prefilled
      if (confirm(`¿Desea facturar o generar remito para el pedido ${order.id}?`)) {
          updateOrderStatus(order.id, 'COMPLETED');
          alert('Se ha generado la venta/remito y el pedido se marcó como COMPLETADO.');
      }
  };

  // Status Badge Helper
  const getStatusBadge = (status: SalesOrderStatus) => {
      switch (status) {
          case 'PENDING': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12}/> Pendiente</span>;
          case 'IN_PREPARATION': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Package size={12}/> En Preparación</span>;
          case 'READY': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Listo para Retirar</span>;
          case 'COMPLETED': return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Entregado</span>;
          default: return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">Cancelado</span>;
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Órdenes de Pedido</h2>
          <p className="text-gray-500 text-sm">Gestión de pedidos de clientes para preparación y entrega diferida.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('NEW_ORDER')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'NEW_ORDER' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            Nuevo Pedido
          </button>
          <button 
             onClick={() => setActiveTab('MANAGEMENT')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'MANAGEMENT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            Gestión de Pedidos
          </button>
        </div>
      </div>

      {/* --- NEW ORDER TAB --- */}
      {activeTab === 'NEW_ORDER' && (
          <div className="flex gap-6 h-full overflow-hidden">
              {/* Product Selector */}
              <div className="w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                              type="text" 
                              placeholder="Buscar producto..." 
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                          />
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left">
                          <thead className="bg-white sticky top-0 z-10 text-xs text-gray-500 uppercase border-b border-gray-200">
                              <tr>
                                  <th className="px-4 py-3">Producto</th>
                                  <th className="px-4 py-3">Stock</th>
                                  <th className="px-4 py-3 text-right">Precio</th>
                                  <th className="px-4 py-3 text-center">Acción</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {filteredProducts.map(p => (
                                  <tr key={p.id} className="hover:bg-gray-50 group">
                                      <td className="px-4 py-3">
                                          <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                                          <div className="text-xs text-gray-500">{p.internalCode}</div>
                                      </td>
                                      <td className="px-4 py-3 text-sm">{p.stock}</td>
                                      <td className="px-4 py-3 text-right font-bold text-gray-700">${p.priceFinal.toLocaleString('es-AR')}</td>
                                      <td className="px-4 py-3 text-center">
                                          <button 
                                            onClick={() => addToCart(p)}
                                            className="bg-gray-100 hover:bg-indigo-600 hover:text-white p-1.5 rounded transition-colors">
                                              <Plus size={16}/>
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Order Detail */}
              <div className="w-1/3 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
                  <div className="p-6 bg-slate-900 text-white rounded-t-xl">
                      <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><ClipboardList size={20}/> Datos del Pedido</h3>
                      <div className="space-y-3">
                          <div>
                              <label className="block text-xs font-bold text-gray-400 mb-1">Cliente</label>
                              <input 
                                type="text" 
                                className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 outline-none"
                                placeholder="Nombre del cliente..."
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                              />
                          </div>
                          <div className="flex gap-3">
                              <div className="flex-1">
                                  <label className="block text-xs font-bold text-gray-400 mb-1">Prioridad</label>
                                  <select 
                                    className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-white text-sm"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                  >
                                      <option value="NORMAL">Normal</option>
                                      <option value="URGENTE">Urgente</option>
                                  </select>
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-400 mb-1">Notas Internas</label>
                              <textarea 
                                className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-white text-sm h-16 resize-none"
                                placeholder="Ej: Llamar cuando esté listo..."
                                value={orderNotes}
                                onChange={e => setOrderNotes(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                      {cart.map((item, idx) => (
                          <div key={idx} className="bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                  <span className="font-bold text-gray-800 text-sm">{item.product.name}</span>
                                  <button onClick={() => removeFromCart(item.product.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                              </div>
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center border border-gray-300 rounded bg-white">
                                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 hover:bg-gray-100"><Minus size={12}/></button>
                                      <span className="px-2 text-sm font-bold">{item.quantity}</span>
                                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 hover:bg-gray-100"><Plus size={12}/></button>
                                  </div>
                                  <span className="font-bold text-gray-900">${item.subtotal.toLocaleString('es-AR')}</span>
                              </div>
                          </div>
                      ))}
                      {cart.length === 0 && <div className="text-center text-gray-400 text-sm mt-10">Agrega productos al pedido.</div>}
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-white">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-500 font-bold">Total Estimado</span>
                          <span className="text-2xl font-bold text-gray-800">${calculateTotal().toLocaleString('es-AR')}</span>
                      </div>
                      <button 
                        onClick={handleCreateOrder}
                        disabled={cart.length === 0 || !clientName}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                          <Save size={18}/> Crear Orden de Pedido
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MANAGEMENT TAB --- */}
      {activeTab === 'MANAGEMENT' && (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                  {orders.filter(o => o.status !== 'COMPLETED').length === 0 && (
                      <div className="text-center text-gray-400 mt-10">No hay pedidos pendientes activos.</div>
                  )}
                  
                  {/* Active Orders Grouped */}
                  {orders.filter(o => o.status !== 'COMPLETED').map(order => (
                      <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row gap-6 animate-fade-in">
                          {/* Order Info */}
                          <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-bold text-gray-800">{order.clientName}</h3>
                                  {getStatusBadge(order.status)}
                                  {order.priority === 'URGENTE' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200 flex items-center gap-1"><AlertCircle size={12}/> URGENTE</span>}
                              </div>
                              <p className="text-sm text-gray-500 font-mono mb-4">Orden #{order.id} • Creada el {order.date}</p>
                              
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Detalle de Items</p>
                                  <ul className="space-y-1">
                                      {order.items.map((item, idx) => (
                                          <li key={idx} className="text-sm text-gray-700 flex justify-between">
                                              <span>{item.quantity}x {item.product.name}</span>
                                              <span className="font-medium text-gray-900">${item.subtotal.toLocaleString('es-AR')}</span>
                                          </li>
                                      ))}
                                  </ul>
                                  <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                                      <span className="text-xs text-gray-500 italic">{order.notes}</span>
                                      <span className="font-bold text-gray-900">Total: ${order.total.toLocaleString('es-AR')}</span>
                                  </div>
                              </div>
                          </div>

                          {/* Actions Panel */}
                          <div className="flex flex-col gap-2 justify-center border-l border-gray-100 pl-6 min-w-[200px]">
                              <p className="text-xs font-bold text-center text-gray-400 uppercase mb-1">Acciones</p>
                              
                              {order.status === 'PENDING' && (
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'IN_PREPARATION')}
                                    className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                      <Package size={16}/> Iniciar Preparación
                                  </button>
                              )}

                              {order.status === 'IN_PREPARATION' && (
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'READY')}
                                    className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                      <CheckCircle size={16}/> Marcar Listo
                                  </button>
                              )}

                              {order.status === 'READY' && (
                                  <button 
                                    onClick={() => handleConvertToSale(order)}
                                    className="bg-indigo-600 text-white hover:bg-indigo-700 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md">
                                      <Receipt size={16}/> Facturar / Remitar
                                  </button>
                              )}

                              <button className="text-gray-400 hover:text-red-500 text-xs font-medium mt-2 flex items-center justify-center gap-1">
                                  <Trash2 size={12}/> Cancelar Pedido
                              </button>
                          </div>
                      </div>
                  ))}

                  {/* Completed/History Section */}
                  {orders.some(o => o.status === 'COMPLETED') && (
                      <div className="pt-8 border-t border-gray-200">
                          <h3 className="text-gray-500 font-bold mb-4">Historial de Entregados</h3>
                          <div className="opacity-60 space-y-2">
                              {orders.filter(o => o.status === 'COMPLETED').map(order => (
                                  <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                                      <div>
                                          <span className="font-bold text-gray-800">{order.clientName}</span>
                                          <span className="text-xs text-gray-500 ml-2">#{order.id}</span>
                                      </div>
                                      <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs font-bold border border-green-100">ENTREGADO</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default SalesOrders;