
import React, { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Trash2, Save, FileText, CheckCircle, Clock, Package, Truck, Minus, ArrowRight, ClipboardList, AlertCircle, X, Receipt, Pencil } from 'lucide-react';
import { InvoiceItem, Product, SalesOrder, SalesOrderStatus } from '../types';

// Helper to create mock products for the demonstration
const createMockProduct = (id: string, internalCode: string, name: string, priceFinal: number, stock: number, category: string): Product => ({
  id, internalCode, barcodes: [internalCode], providerCodes: [],
  name, brand: 'Generico', provider: 'Proveedor Demo', category, description: '',
  measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
  vatRate: 21, listCost: priceFinal * 0.6, discounts: [0, 0, 0, 0], costAfterDiscounts: priceFinal * 0.6, profitMargin: 40,
  priceNeto: priceFinal / 1.21, priceFinal: priceFinal, stock, stockDetails: [], minStock: 10, desiredStock: 20, reorderPoint: 5,
  location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
});

// Fixed: Completed the component definition and ensured it returns valid JSX to resolve the '() => void' type error.
const SalesOrders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'MANAGEMENT'>('NEW_ORDER');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENTE'>('NORMAL');
  const [orderNotes, setOrderNotes] = useState('');

  // Initial Mock Orders with persistence
  const [orders, setOrders] = useState<SalesOrder[]>(() => {
      const saved = localStorage.getItem('ferrecloud_sales_orders');
      return saved ? JSON.parse(saved) : [
        {
            id: 'PED-1001',
            clientName: 'Constructora del Norte',
            date: '2023-10-27',
            priority: 'URGENTE',
            status: 'PENDING',
            items: [{ product: createMockProduct('1', 'TOR-001', 'Tornillo Autoperforante', 150, 5000, 'Fijaciones'), quantity: 500, subtotal: 75000, appliedPrice: 150 }],
            notes: 'Entregar antes del mediodía',
            total: 75000
        },
        {
            id: 'PED-1002',
            clientName: 'Juan Perez',
            date: '2023-10-26',
            priority: 'NORMAL',
            status: 'IN_PREPARATION',
            items: [{ product: createMockProduct('4', 'PINT-20L', 'Látex Interior 20L', 45000, 8, 'Pinturería'), quantity: 2, subtotal: 90000, appliedPrice: 45000 }],
            notes: '',
            total: 90000
        }
      ];
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_sales_orders', JSON.stringify(orders));
  }, [orders]);

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
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.priceFinal, appliedPrice: item.product.priceFinal }
          : item
        );
      }
      return [...prev, { product, quantity: 1, subtotal: product.priceFinal, appliedPrice: product.priceFinal }];
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

  const handleSaveOrder = () => {
    if (cart.length === 0 || !clientName) return;

    const newOrder: SalesOrder = {
        id: `PED-${Math.floor(Math.random() * 1000) + 1000}`,
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
    setActiveTab('MANAGEMENT');
  };

  const updateOrderStatus = (id: string, status: SalesOrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const deleteOrder = (id: string) => {
    if (confirm('¿Desea eliminar este pedido?')) {
        setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Órdenes de Pedido</h2>
          <p className="text-gray-500 text-sm">Gestión de pedidos de clientes para preparación y despacho.</p>
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

      {activeTab === 'NEW_ORDER' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col flex-1 overflow-hidden animate-fade-in">
            <div className="p-6 bg-slate-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente</label>
                    <input 
                        type="text" 
                        placeholder="Nombre del cliente..." 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
                    <select 
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm"
                    >
                        <option value="NORMAL">Normal</option>
                        <option value="URGENTE">Urgente</option>
                    </select>
                </div>
                <div className="md:col-span-6 relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Agregar Producto</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por código o nombre..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {searchTerm && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto z-50">
                            {filteredProducts.map(p => (
                                <button 
                                    key={p.id}
                                    onClick={() => { addToCart(p); setSearchTerm(''); }}
                                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-gray-50 flex justify-between items-center group"
                                >
                                    <div>
                                        <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{p.internalCode} • Stock: {p.stock}</div>
                                    </div>
                                    <Plus size={18} className="text-indigo-600"/>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">Producto</th>
                            <th className="px-6 py-3 text-right">Precio</th>
                            <th className="px-6 py-3 text-center">Cantidad</th>
                            <th className="px-6 py-3 text-right">Subtotal</th>
                            <th className="px-6 py-3 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {cart.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3">
                                    <div className="font-bold text-gray-800 text-sm">{item.product.name}</div>
                                    <div className="text-xs text-gray-400">{item.product.internalCode}</div>
                                </td>
                                <td className="px-6 py-3 text-right text-sm text-gray-600">
                                    ${item.product.priceFinal.toLocaleString('es-AR')}
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center justify-center border border-gray-300 rounded-lg w-fit mx-auto bg-white">
                                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-l-lg"><Minus size={14}/></button>
                                        <span className="w-10 text-center font-bold text-gray-700 text-sm">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-r-lg"><Plus size={14}/></button>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                                    ${item.subtotal.toLocaleString('es-AR')}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <button onClick={() => removeFromCart(item.product.id)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Notas del Pedido</label>
                    <textarea 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none h-20 resize-none"
                        placeholder="Indicaciones para el despacho..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                    />
                </div>
                <div className="flex flex-col items-end shrink-0">
                    <p className="text-gray-400 text-xs uppercase font-bold">Total del Pedido</p>
                    <p className="text-4xl font-black text-white">${calculateTotal().toLocaleString('es-AR')}</p>
                    <button 
                        onClick={handleSaveOrder}
                        disabled={cart.length === 0 || !clientName}
                        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-10 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg">
                        <Save size={20} /> Guardar Pedido
                    </button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'MANAGEMENT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {orders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${order.priority === 'URGENTE' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                {order.priority}
                            </span>
                            <h3 className="font-black text-gray-800 text-lg mt-2 uppercase tracking-tight">{order.clientName}</h3>
                            <p className="text-[10px] text-gray-400 font-mono font-bold">{order.id} • {order.date}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-black text-gray-900 text-xl">${order.total.toLocaleString('es-AR')}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">{order.items.length} Ítems</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[80px]">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Notas</p>
                            <p className="text-xs text-gray-600 italic leading-relaxed">{order.notes || 'Sin observaciones.'}</p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Estado del Pedido</label>
                            <div className="flex flex-wrap gap-2">
                                {(['PENDING', 'IN_PREPARATION', 'READY', 'COMPLETED', 'CANCELLED'] as SalesOrderStatus[]).map(status => (
                                    <button 
                                        key={status}
                                        onClick={() => updateOrderStatus(order.id, status)}
                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border transition-all ${
                                            order.status === status 
                                            ? (status === 'COMPLETED' ? 'bg-green-600 text-white border-green-600' : status === 'CANCELLED' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-900 text-white border-slate-900')
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                                        }`}
                                    >
                                        {status.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex gap-2">
                             <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={18}/></button>
                             <button onClick={() => deleteOrder(order.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                        </div>
                        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                            <Receipt size={14}/> Facturar
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

// Fixed: Added default export for SalesOrders component to resolve the module error in App.tsx
export default SalesOrders;
