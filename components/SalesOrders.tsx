
import React, { useState, useEffect } from 'react';
import { 
    Search, Plus, ShoppingCart, Trash2, Save, FileText, CheckCircle, 
    Clock, Package, Truck, Minus, ArrowRight, ClipboardList, 
    AlertCircle, X, Receipt, Pencil, User, AlertOctagon, Info,
    ChevronRight, Tag, Layers
} from 'lucide-react';
import { InvoiceItem, Product, SalesOrder, SalesOrderStatus } from '../types';

const createMockProduct = (id: string, internalCode: string, name: string, priceFinal: number, stock: number, category: string, brand: string = 'GENERICO'): Product => ({
  id, internalCodes: [internalCode], barcodes: [internalCode], providerCodes: [],
  name, brand, provider: 'Proveedor Demo', category, description: '',
  measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
  vatRate: 21, listCost: priceFinal * 0.6,
  // Added purchasePackageQuantity to fix property missing error
  purchasePackageQuantity: 1,
  discounts: [0, 0, 0, 0], costAfterDiscounts: priceFinal * 0.6, profitMargin: 40,
  priceNeto: priceFinal / 1.21, priceFinal: priceFinal, 
  stock, 
  // Added missing required stock properties
  stockPrincipal: stock,
  stockDeposito: 0,
  stockSucursal: 0,
  stockDetails: [], 
  stockMinimo: 10, stockMaximo: 20, reorderPoint: 5,
  location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false, isPublished: false },
  isCombo: false,
  comboItems: []
});

const SalesOrders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW_ORDER' | 'MANAGEMENT'>('NEW_ORDER');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENTE'>('NORMAL');
  const [orderNotes, setOrderNotes] = useState('');

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
        }
      ];
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_sales_orders', JSON.stringify(orders));
  }, [orders]);

  const [products] = useState<Product[]>(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      return saved ? JSON.parse(saved) : [
        createMockProduct('1', 'TOR-001', 'Tornillo Autoperforante 2"', 150, 5000, 'Fijaciones'),
        createMockProduct('2', 'MAR-055', 'Martillo Galponero', 12500, 45, 'Herramientas'),
        createMockProduct('3', 'TAL-IND', 'Taladro Percutor 750w', 85000, 5, 'Herramientas Eléctricas'),
        createMockProduct('4', 'PINT-20L', 'Látex Interior 20L', 45000, 8, 'Pinturería'),
        createMockProduct('5', 'CEM-LOM', 'Cemento Loma Negra 50kg', 9500, 200, 'Construcción'),
      ];
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.internalCodes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.priceFinal }
          : item
        );
      }
      return [...prev, { product, quantity: 1, subtotal: product.priceFinal, appliedPrice: product.priceFinal }];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => 
        item.product.id === productId ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.appliedPrice } : item
    ));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.product.id !== id));

  const calculateTotal = () => cart.reduce((acc, item) => acc + item.subtotal, 0);

  const handleSaveOrder = () => {
    if (cart.length === 0 || !clientName) {
        alert("Faltan datos obligatorios (Cliente y al menos 1 producto).");
        return;
    }
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
    alert("Pedido registrado correctamente.");
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
    <div className="p-4 md:p-6 max-full h-full flex flex-col space-y-4 bg-slate-50 overflow-hidden">
      <div className="flex justify-between items-center bg-white p-5 rounded-[2rem] border border-gray-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3 leading-none">
              <ClipboardList size={24} className="text-indigo-600"/> Órdenes de Pedido
          </h2>
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-1">Sincronización de Logística y Ventas</p>
        </div>
        
        <div className="flex bg-slate-100 rounded-2xl p-1">
          <button onClick={() => setActiveTab('NEW_ORDER')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'NEW_ORDER' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Nuevo Pedido</button>
          <button onClick={() => setActiveTab('MANAGEMENT')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'MANAGEMENT' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Bandeja de Gestión</button>
        </div>
      </div>

      {activeTab === 'NEW_ORDER' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 animate-fade-in overflow-hidden">
            <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Search size={14}/> Catálogo Maestro
                    </h3>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar artículos..." 
                            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 shadow-sm transition-all uppercase"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                    <div className="grid grid-cols-1 gap-1.5">
                        {filteredProducts.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3.5 bg-white border border-gray-50 rounded-2xl hover:border-indigo-100 hover:bg-indigo-50/20 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-300 group-hover:bg-white group-hover:text-indigo-500 transition-colors">
                                        <Package size={18}/>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight leading-none mb-1.5">{p.name}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-tighter">{p.internalCodes[0]}</span>
                                            <span className="w-0.5 h-0.5 bg-gray-200 rounded-full"></span>
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{p.brand}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Precio</p>
                                        <p className="font-black text-slate-900 text-xs">${p.priceFinal.toLocaleString('es-AR')}</p>
                                    </div>
                                    <div className="text-right w-16">
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Stock</p>
                                        <p className={`font-black text-xs ${p.stock <= (p.stockMinimo || 0) ? 'text-red-500' : 'text-slate-500'}`}>{p.stock}</p>
                                    </div>
                                    <button 
                                        onClick={() => addToCart(p)}
                                        className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md active:scale-90">
                                        <Plus size={18}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-[580px] flex flex-col gap-4 overflow-hidden">
                <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm p-6 space-y-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <User size={14} className="text-indigo-600"/> Despacho de Pedido
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-8 relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600" size={16}/>
                            <input 
                                type="text" 
                                placeholder="Cliente / Razón Social..." 
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none font-black text-slate-800 uppercase tracking-tight text-xs transition-all"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-4">
                            <select 
                                className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none font-black text-slate-800 uppercase text-[10px] transition-all"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                            >
                                <option value="NORMAL">Normal</option>
                                <option value="URGENTE">Urgente</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center shrink-0">
                        <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <ShoppingCart size={16} className="text-indigo-400"/> Pedido Actual
                        </h3>
                        <span className="text-[9px] font-black bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">{cart.length} ÍTEMS</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3">Artículo</th>
                                    <th className="px-4 py-3 text-center">Cant.</th>
                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                    <th className="px-6 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cart.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-30">
                                                <Layers size={48} strokeWidth={1} className="mb-2"/>
                                                <p className="font-black uppercase tracking-widest text-[10px]">Sin productos seleccionados</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    cart.map(item => (
                                        <tr key={item.product.id} className="bg-white hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-3">
                                                <p className="font-black text-slate-800 text-xs uppercase leading-tight mb-1">{item.product.name}</p>
                                                <p className="text-[9px] text-gray-400 font-mono font-bold">{item.product.internalCodes[0]}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-100">
                                                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 hover:bg-white text-slate-400 hover:text-red-500 rounded-lg transition-all"><Minus size={12}/></button>
                                                    <span className="font-black text-xs w-6 text-center text-slate-800">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 hover:bg-white text-slate-400 hover:text-indigo-600 rounded-lg transition-all"><Plus size={12}/></button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <p className="font-black text-slate-900 tracking-tighter text-sm">${item.subtotal.toLocaleString('es-AR')}</p>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-white border-t border-gray-100 space-y-4 shrink-0">
                        <div className="relative">
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Instrucciones Especiales</label>
                            <textarea 
                                className="w-full p-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none font-bold text-slate-700 h-14 resize-none text-[10px] uppercase"
                                placeholder="Notas de entrega o preparación..."
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex justify-between items-baseline py-2 border-t border-dashed">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Importe Total</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">${calculateTotal().toLocaleString('es-AR')}</p>
                        </div>

                        <button 
                            onClick={handleSaveOrder}
                            disabled={cart.length === 0 || !clientName}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4.5 rounded-[2rem] shadow-2xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                            <Save size={18}/> CONFIRMAR Y GUARDAR PEDIDO
                        </button>
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in overflow-y-auto pb-10">
            {orders.map(order => (
                <div key={order.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 p-8 flex flex-col group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border tracking-widest ${order.priority === 'URGENTE' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                {order.priority}
                            </span>
                            <h3 className="font-black text-slate-800 text-lg mt-3 uppercase tracking-tighter leading-tight">{order.clientName}</h3>
                            <p className="text-[9px] text-gray-400 font-mono font-bold mt-1 uppercase tracking-widest">{order.id} • {order.date}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-black text-slate-900 text-xl tracking-tighter">${order.total.toLocaleString('es-AR')}</p>
                             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{order.items.length} ÍTEMS</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6 mb-8">
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 min-h-[80px]">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Info size={10}/> Observaciones</p>
                            <p className="text-[11px] text-slate-600 italic leading-relaxed font-medium">{order.notes || 'Sin indicaciones.'}</p>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado de Preparación</label>
                            <div className="flex flex-wrap gap-1.5">
                                {(['PENDING', 'IN_PREPARATION', 'READY', 'COMPLETED', 'CANCELLED'] as SalesOrderStatus[]).map(status => (
                                    <button 
                                        key={status}
                                        onClick={() => updateOrderStatus(order.id, status)}
                                        className={`px-2.5 py-1.5 rounded-xl text-[7px] font-black uppercase border transition-all ${
                                            order.status === status 
                                            ? (status === 'COMPLETED' ? 'bg-green-600 text-white border-green-600 shadow-md' : status === 'CANCELLED' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-slate-900 text-white border-slate-900 shadow-md')
                                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-400'
                                        }`}
                                    >
                                        {status.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex gap-2">
                             <button className="p-3 bg-slate-50 text-slate-300 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-2xl transition-all"><Pencil size={16}/></button>
                             <button onClick={() => deleteOrder(order.id)} className="p-3 bg-red-50 text-red-300 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-2xl transition-all"><Trash2 size={16}/></button>
                        </div>
                        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg active:scale-95">
                            <Receipt size={14} className="text-indigo-400"/> Facturar
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default SalesOrders;
