
import React, { useState } from 'react';
import { Search, Plus, Printer, Trash2, Save, Clock, FileText, ArrowRight, X, Calendar, Minus, Calculator } from 'lucide-react';
import { InvoiceItem, Product, Budget } from '../types';

const Presupuestos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [validityDays, setValidityDays] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Historial Mock
  const [budgets, setBudgets] = useState<Budget[]>([
    {
        id: 'P-0042',
        clientName: 'Obra Edificio Central',
        date: '2023-10-25',
        validUntil: '2023-11-10',
        items: [],
        total: 154000,
        status: 'OPEN'
    },
    {
        id: 'P-0041',
        clientName: 'Juan Perez',
        date: '2023-10-20',
        validUntil: '2023-11-04',
        items: [],
        total: 25000,
        status: 'EXPIRED'
    }
  ]);

  const [showPrintModal, setShowPrintModal] = useState<Budget | null>(null);

  // Helper to create mock products (Reusable mock logic)
  const createMockProduct = (id: string, internalCode: string, name: string, priceFinal: number, category: string): Product => ({
    id, internalCode, barcodes: [internalCode], providerCodes: [],
    name, brand: 'Generico', provider: 'Proveedor Demo', category, description: '',
    measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
    vatRate: 21, listCost: priceFinal * 0.6, discounts: [0, 0, 0, 0], costAfterDiscounts: priceFinal * 0.6, profitMargin: 40,
    priceNeto: priceFinal / 1.21, priceFinal: priceFinal, stock: 100, stockDetails: [], minStock: 10, desiredStock: 20, reorderPoint: 5,
    location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
  });

  const sampleProducts: Product[] = [
    createMockProduct('1', 'TOR-001', 'Tornillo Autoperforante 2"', 150, 'Fijaciones'),
    createMockProduct('2', 'MAR-055', 'Martillo Galponero', 12500, 'Herramientas'),
    createMockProduct('3', 'TAL-IND', 'Taladro Percutor 750w', 85000, 'Herramientas Eléctricas'),
    createMockProduct('4', 'PINT-20L', 'Látex Interior 20L', 45000, 'Pinturería'),
  ];
  
  const filteredProducts = sampleProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.internalCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
          // Fix: added missing appliedPrice property
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.product.priceFinal, appliedPrice: item.product.priceFinal }
          : item
        );
      }
      // Fix: added missing appliedPrice property
      return [...prev, { product, quantity: 1, subtotal: product.priceFinal, appliedPrice: product.priceFinal }];
    });
    setSearchTerm('');
    setShowSearchResults(false);
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
        total: calculateTotal(),
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
          <p className="text-gray-500 text-sm">Cotizaciones rápidas para clientes sin reservar stock.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('NEW')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'NEW' ? 'bg-ferre-orange text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            Nuevo Presupuesto
          </button>
          <button 
             onClick={() => setActiveTab('HISTORY')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'HISTORY' ? 'bg-ferre-orange text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            Historial
          </button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col flex-1 overflow-hidden">
            
            {/* Header Form */}
            <div className="p-6 bg-slate-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Cliente</label>
                    <input 
                        type="text" 
                        placeholder="Razón Social / Consumidor Final" 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-ferre-orange outline-none shadow-sm"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Validez (Días)</label>
                    <input 
                        type="number" 
                        value={validityDays}
                        onChange={(e) => setValidityDays(parseInt(e.target.value))}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-ferre-orange outline-none shadow-sm"
                    />
                </div>
                <div className="md:col-span-6 relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar y Agregar Producto</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Nombre, código o marca..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-ferre-orange outline-none shadow-sm"
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setShowSearchResults(true);
                            }}
                            onFocus={() => setShowSearchResults(true)}
                            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                        />
                    </div>
                    {/* Results Dropdown */}
                    {showSearchResults && searchTerm && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto z-50">
                            {filteredProducts.map(p => (
                                <button 
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-50 flex justify-between items-center group"
                                >
                                    <div>
                                        <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{p.internalCode} • {p.brand}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-ferre-orange font-bold">${p.priceFinal.toLocaleString('es-AR')}</div>
                                    </div>
                                </button>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="p-4 text-center text-gray-400 text-sm italic">No se encontraron productos.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table Full Width */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 w-32">Código</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3 text-right w-32">Precio Unit.</th>
                                <th className="px-6 py-3 text-center w-40">Cantidad</th>
                                <th className="px-6 py-3 text-right w-40">Subtotal</th>
                                <th className="px-6 py-3 text-center w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cart.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 font-mono text-sm text-gray-600">{item.product.internalCode}</td>
                                    <td className="px-6 py-3">
                                        <div className="font-bold text-gray-800 text-sm">{item.product.name}</div>
                                        <div className="text-xs text-gray-400">{item.product.category}</div>
                                    </td>
                                    <td className="px-6 py-3 text-right text-sm text-gray-600">
                                        ${item.product.priceFinal.toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-center border border-gray-300 rounded-lg w-fit mx-auto bg-white">
                                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-l-lg transition-colors"><Minus size={14}/></button>
                                            <input 
                                                className="w-12 text-center outline-none font-bold text-gray-700 text-sm" 
                                                value={item.quantity} 
                                                onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                                            />
                                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-r-lg transition-colors"><Plus size={14}/></button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                                        ${item.subtotal.toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <button onClick={() => removeFromCart(item.product.id)} className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50">
                                            <Trash2 size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {cart.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-300">
                                            <FileText size={48} className="mb-4 opacity-50"/>
                                            <p className="text-lg font-medium text-gray-400">Presupuesto Vacío</p>
                                            <p className="text-sm mt-1">Busca y agrega productos para cotizar.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div>
                    <p className="text-gray-400 text-sm">Total Estimado</p>
                    <p className="text-3xl font-bold">${calculateTotal().toLocaleString('es-AR')}</p>
                </div>
                <button 
                    onClick={handleSaveBudget}
                    disabled={cart.length === 0 || !clientName}
                    className="bg-ferre-orange hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-orange-900/20">
                    <Save size={18} /> Guardar Presupuesto
                </button>
            </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Fecha Emisión</th>
                            <th className="px-6 py-4">Válido Hasta</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {budgets.map(budget => (
                            <tr key={budget.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono text-sm text-gray-600">{budget.id}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{budget.clientName}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{budget.date}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-1">
                                    <Clock size={14} /> {budget.validUntil}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        budget.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                                        budget.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {budget.status === 'OPEN' ? 'Vigente' : budget.status === 'EXPIRED' ? 'Vencido' : 'Facturado'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-900">${budget.total.toLocaleString('es-AR')}</td>
                                <td className="px-6 py-4 text-center flex justify-center gap-2">
                                    <button 
                                        onClick={() => setShowPrintModal(budget)}
                                        className="p-2 text-gray-500 hover:text-ferre-orange hover:bg-orange-50 rounded-lg" title="Ver / Imprimir">
                                        <Printer size={18} />
                                    </button>
                                    <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Convertir a Venta">
                                        <ArrowRight size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Print Modal (Unchanged essentially, but included for completeness of file) */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-lg shadow-2xl rounded-xl overflow-hidden flex flex-col h-[80vh]">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FileText size={18} /> Vista Previa
                 </h3>
                 <button onClick={() => setShowPrintModal(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={20}/>
                 </button>
              </div>

              <div className="flex-1 p-8 overflow-y-auto bg-white">
                 <div className="border border-gray-200 p-8 shadow-sm">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-ferre-orange">FerreCloud</h1>
                            <p className="text-xs text-gray-500">Av. Construcción 1234</p>
                            <p className="text-xs text-gray-500">Tel: 0800-FERRETERIA</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">Presupuesto</h2>
                            <p className="text-sm font-mono text-gray-600">#{showPrintModal.id}</p>
                            <p className="text-xs text-gray-400 mt-1">Fecha: {showPrintModal.date}</p>
                        </div>
                    </div>

                    <div className="mb-8 border-b border-gray-100 pb-4">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Cliente</p>
                        <p className="text-lg font-medium text-gray-800">{showPrintModal.clientName}</p>
                        <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                            <Calendar size={12}/> Válido hasta: {showPrintModal.validUntil}
                        </p>
                    </div>

                    <table className="w-full text-left mb-8">
                        <thead>
                            <tr className="text-xs text-gray-500 border-b border-gray-200">
                                <th className="py-2">Cant</th>
                                <th className="py-2">Descripción</th>
                                <th className="py-2 text-right">Unitario</th>
                                <th className="py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {showPrintModal.items.map((item, i) => (
                                <tr key={i} className="border-b border-gray-50">
                                    <td className="py-2 font-bold">{item.quantity}</td>
                                    <td className="py-2">{item.product.name}</td>
                                    <td className="py-2 text-right text-gray-500">${item.product.priceFinal.toLocaleString('es-AR')}</td>
                                    <td className="py-2 text-right font-medium">${item.subtotal.toLocaleString('es-AR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Total Presupuestado</p>
                            <p className="text-3xl font-bold text-gray-900">${showPrintModal.total.toLocaleString('es-AR')}</p>
                            <p className="text-[10px] text-gray-400 mt-2">* Precios sujetos a modificación sin previo aviso.</p>
                        </div>
                    </div>
                 </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
                 <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-white" onClick={() => setShowPrintModal(null)}>Cerrar</button>
                 <button className="flex-1 bg-ferre-dark text-white py-2 rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2">
                    <Printer size={18} /> Imprimir
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Presupuestos;