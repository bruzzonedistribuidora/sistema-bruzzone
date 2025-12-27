import React, { useState } from 'react';
import { Search, Plus, Printer, CheckSquare, Square, RefreshCw, FileText, CreditCard, User, ClipboardList, AlertCircle, X, Send, Mail, Minus, Package, Trash2, History, Link, CheckCircle, Globe } from 'lucide-react';
import { Product, Remito, RemitoItem } from '../types';

// Helper to create valid Product objects compatible with the interface
const createMockProduct = (id: string, internalCode: string, name: string, priceFinal: number, stock: number, category: string, brand: string = 'Genérico'): Product => ({
  id,
  internalCode,
  barcodes: [internalCode],
  providerCodes: [],
  name,
  brand,
  provider: 'Proveedor Demo',
  description: '',
  category,
  measureUnitSale: 'Unidad',
  measureUnitPurchase: 'Unidad',
  conversionFactor: 1,
  purchaseCurrency: 'ARS',
  saleCurrency: 'ARS',
  vatRate: 21.0,
  listCost: priceFinal * 0.6,
  discounts: [0, 0, 0, 0],
  costAfterDiscounts: priceFinal * 0.6,
  profitMargin: 30,
  priceNeto: priceFinal / 1.21,
  priceFinal: priceFinal,
  stock,
  stockDetails: [],
  minStock: 10,
  desiredStock: 20,
  reorderPoint: 5,
  location: '',
  ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
});

const Remitos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [selectedClient, setSelectedClient] = useState('');
  const [cart, setCart] = useState<RemitoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Pending Remitos Management
  const [selectedRemitoIds, setSelectedRemitoIds] = useState<string[]>([]);
  const [updatePrices, setUpdatePrices] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState<Remito | null>(null);
  
  // Billing Modal State (For "Facturar Directamente")
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingStep, setBillingStep] = useState<'SELECTION' | 'PROCESSING' | 'SUCCESS'>('SELECTION');
  const [billingType, setBillingType] = useState<'FISCAL' | 'INTERNAL'>('FISCAL');
  
  // Relations Modal State
  const [relationsModalData, setRelationsModalData] = useState<Remito | null>(null);

  // Filter for history
  const [historyFilter, setHistoryFilter] = useState<'PENDING' | 'BILLED' | 'ALL'>('PENDING');

  // Mock Data
  const sampleProducts: Product[] = [
    createMockProduct('1', 'TOR-001', 'Tornillo Autoperforante 2"', 150, 5000, 'Fijaciones', 'Fischer'),
    createMockProduct('2', 'MAR-055', 'Martillo Galponero', 12500, 45, 'Herramientas', 'Stanley'),
    createMockProduct('3', 'CEM-LOM', 'Cemento Loma Negra 50kg', 9500, 200, 'Construcción', 'Loma Negra'),
    createMockProduct('4', 'AMOL-700', 'Amoladora Angular 700W', 45000, 10, 'Herramientas', 'Bosch'),
    createMockProduct('5', 'DISC-COR', 'Disco Corte Metal 115mm', 850, 100, 'Abrasivos', 'Aliafor'),
  ];
  
  const filteredProducts = sampleProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clients = ['Constructora del Norte', 'Juan Perez (Obras)', 'Estudio Arq. Lopez'];

  // Mock Existing Remitos for "Pending" tab
  // Added relatedInvoice field for traceability
  const [existingRemitos, setExistingRemitos] = useState<(Remito & { relatedInvoice?: string })[]>([
    {
      id: 'R-0001',
      clientId: 'Juan Perez (Obras)',
      clientName: 'Juan Perez (Obras)',
      date: '2023-10-15', // Older date to show price diff
      status: 'PENDING',
      items: [
        { product: sampleProducts[0], quantity: 100, historicalPrice: 120 }, // Was cheaper back then
        { product: sampleProducts[2], quantity: 2, historicalPrice: 8000 }
      ]
    },
    {
      id: 'R-0002',
      clientId: 'Juan Perez (Obras)',
      clientName: 'Juan Perez (Obras)',
      date: '2023-10-20',
      status: 'PENDING',
      items: [
        { product: sampleProducts[1], quantity: 1, historicalPrice: 11000 }
      ]
    },
    {
      id: 'R-0003',
      clientId: 'Constructora del Norte',
      clientName: 'Constructora del Norte',
      date: '2023-10-22',
      status: 'BILLED',
      relatedInvoice: 'FC-A-0005-00000023',
      items: [
        { product: sampleProducts[3], quantity: 1, historicalPrice: 45000 }
      ]
    }
  ]);

  // Actions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, historicalPrice: product.priceFinal }];
    });
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => {
        if (item.product.id === productId) {
            return { ...item, quantity: newQuantity };
        }
        return item;
    }));
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCreateRemito = () => {
    if (!selectedClient || cart.length === 0) return;
    const newRemito: Remito = {
      id: `R-${Math.floor(Math.random() * 10000)}`,
      clientId: selectedClient,
      clientName: selectedClient,
      items: [...cart],
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING'
    };
    setExistingRemitos([...existingRemitos, newRemito]);
    setCart([]);
    setShowPrintModal(newRemito); // Auto show print preview
  };

  const toggleRemitoSelection = (id: string) => {
    setSelectedRemitoIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getBillingTotal = () => {
    let total = 0;
    const selectedRemitos = existingRemitos.filter(r => selectedRemitoIds.includes(r.id));
    
    selectedRemitos.forEach(remito => {
      remito.items.forEach(item => {
        // If updatePrices is true, use the Current Product Price (sampleProducts), else use historical
        const priceToUse = updatePrices 
          ? (sampleProducts.find(p => p.id === item.product.id)?.priceFinal || item.historicalPrice)
          : item.historicalPrice;
        total += priceToUse * item.quantity;
      });
    });
    return total;
  };

  // Direct Billing from "New Remito"
  const getCartTotal = () => {
      return cart.reduce((acc, item) => acc + (item.quantity * item.historicalPrice), 0);
  }

  const handleDirectBilling = (type: 'FISCAL' | 'INTERNAL') => {
      setBillingType(type);
      setBillingStep('PROCESSING');
      // Simulate Processing
      setTimeout(() => {
          setBillingStep('SUCCESS');
          setCart([]);
          // In a real app, this would save to SalesHistory
      }, 1500);
  };

  // Process from History Tab
  const handleBillHistory = (type: 'ARCA' | 'INTERNAL') => {
    const invoiceNumber = type === 'ARCA' ? `FC-A-${Date.now().toString().slice(-8)}` : `INT-${Date.now().toString().slice(-8)}`;
    alert(`Generando ${type === 'ARCA' ? 'Factura Fiscal' : 'Comprobante Interno'} (${invoiceNumber}) por $${getBillingTotal().toLocaleString('es-AR')}.\n\nRemitos cerrados: ${selectedRemitoIds.join(', ')}`);
    
    // Logic to update remito status would go here
    setExistingRemitos(prev => prev.map(r => selectedRemitoIds.includes(r.id) ? { ...r, status: 'BILLED', relatedInvoice: invoiceNumber } : r));
    setSelectedRemitoIds([]);
  };

  const handleShowRelations = (remito: any) => {
      setRelationsModalData(remito);
  };

  const filteredRemitos = existingRemitos.filter(r => 
      historyFilter === 'ALL' || r.status === historyFilter
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Remitos</h2>
          <p className="text-gray-500 text-sm">Entrega de mercadería, cuentas corrientes y facturación diferida.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('NEW')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'NEW' ? 'bg-ferre-orange text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            Nuevo Remito
          </button>
          <button 
             onClick={() => setActiveTab('HISTORY')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'HISTORY' ? 'bg-ferre-orange text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            Historial y Facturación
          </button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col flex-1 overflow-hidden">
            {/* Top Bar: Client & Search */}
            <div className="p-6 bg-slate-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Client Select */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente (Destinatario)</label>
                    <select 
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-ferre-orange outline-none shadow-sm"
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                    >
                      <option value="">Seleccionar Cliente...</option>
                      {clients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Product Search */}
                <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar y Filtrar Producto (Nombre, Marca, Código)</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Ej: Stanley, Tornillo, FIS-001..." 
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
                    {/* Search Dropdown */}
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
                                        <div className="text-xs text-gray-500 font-mono flex items-center gap-1.5">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{p.internalCode}</span>
                                            <span>•</span>
                                            <span className="font-bold text-ferre-orange uppercase">{p.brand}</span>
                                            <span>•</span>
                                            <span>{p.category}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs font-bold ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>Stock: {p.stock}</div>
                                    </div>
                                </button>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="p-4 text-center text-gray-400 text-sm italic">No se encontraron productos coincidentes.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Items Table */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 w-32">Código</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-4 py-3">Marca</th>
                                <th className="px-4 py-3 text-center w-40">Cantidad</th>
                                <th className="px-4 py-3 text-center w-20">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cart.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{item.product.internalCode}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-gray-800 text-sm">{item.product.name}</div>
                                        <div className="text-xs text-gray-400">{item.product.category}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-tighter">
                                            {item.product.brand}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
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
                                    <td className="px-4 py-3 text-center">
                                        <button 
                                            onClick={() => removeItem(item.product.id)}
                                            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {cart.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-300">
                                            <ClipboardList size={48} className="mb-4 opacity-50"/>
                                            <p className="text-lg font-medium text-gray-400">Sin artículos cargados</p>
                                            <p className="text-sm mt-1">Busca productos por nombre, código o marca arriba.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-700 text-xs bg-yellow-50 px-3 py-2 rounded border border-yellow-200">
                    <AlertCircle size={14} />
                    <span>Total Estimado: ${getCartTotal().toLocaleString('es-AR')} (Solo referencia).</span>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => {
                            setBillingStep('SELECTION');
                            setIsBillingModalOpen(true);
                        }}
                        disabled={!selectedClient || cart.length === 0}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm">
                        <FileText size={18} /> Facturar Directamente
                    </button>
                    <button 
                        onClick={handleCreateRemito}
                        disabled={!selectedClient || cart.length === 0}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg">
                        <Printer size={18} /> Generar Remito
                    </button>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="flex gap-6 h-full">
           <div className="w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
             <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><User size={18}/> Clientes con Deuda</h3>
             <ul className="space-y-2">
               {/* Just filtering unique clients for demo */}
               {Array.from(new Set(existingRemitos.filter(r => r.status === 'PENDING').map(r => r.clientId))).map(client => (
                 <li key={client} className="p-3 bg-blue-50 text-blue-800 rounded-lg cursor-pointer font-medium border border-blue-100 flex justify-between items-center hover:bg-blue-100 transition-colors">
                   {client}
                   <span className="bg-blue-200 text-blue-900 text-xs px-2 py-0.5 rounded-full">
                     {existingRemitos.filter(r => r.clientId === client && r.status === 'PENDING').length}
                   </span>
                 </li>
               ))}
             </ul>
           </div>

           <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200">
             <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex gap-2">
                    <button onClick={() => setHistoryFilter('PENDING')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${historyFilter === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-100'}`}>Pendientes de Facturar</button>
                    <button onClick={() => setHistoryFilter('BILLED')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${historyFilter === 'BILLED' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'}`}>Histórico / Facturados</button>
                    <button onClick={() => setHistoryFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${historyFilter === 'ALL' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>Todos</button>
                </div>
                
                {historyFilter === 'PENDING' && (
                    <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                        <span className={`text-xs font-bold ${updatePrices ? 'text-gray-400' : 'text-green-600'}`}>Precios Históricos</span>
                        <button 
                            onClick={() => setUpdatePrices(!updatePrices)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${updatePrices ? 'bg-ferre-orange' : 'bg-gray-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${updatePrices ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-xs font-bold ${updatePrices ? 'text-ferre-orange' : 'text-gray-400'}`}>Actualizar al Hoy</span>
                    </div>
                )}
             </div>

             <div className="flex-1 overflow-y-auto p-4">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                     <th className="py-2 pl-2">Sel.</th>
                     <th className="py-2">Fecha</th>
                     <th className="py-2">Nro Remito</th>
                     <th className="py-2">Estado</th>
                     <th className="py-2">Items</th>
                     <th className="py-2 text-right">Total (Est.)</th>
                     <th className="py-2 text-center">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {filteredRemitos.map(remito => {
                      // Calculate row total based on strategy
                      const rowTotal = remito.items.reduce((acc, item) => {
                        const price = (updatePrices && remito.status === 'PENDING')
                          ? (sampleProducts.find(p => p.id === item.product.id)?.priceFinal || item.historicalPrice)
                          : item.historicalPrice;
                        return acc + (price * item.quantity);
                      }, 0);

                      return (
                        <tr key={remito.id} className="hover:bg-gray-50 group">
                          <td className="py-3 pl-2">
                            {remito.status === 'PENDING' && (
                                <button onClick={() => toggleRemitoSelection(remito.id)} className="text-gray-400 hover:text-ferre-orange">
                                {selectedRemitoIds.includes(remito.id) ? <CheckSquare className="text-ferre-orange" /> : <Square />}
                                </button>
                            )}
                          </td>
                          <td className="py-3 text-sm text-gray-600">{remito.date}</td>
                          <td className="py-3 text-sm font-mono font-medium">{remito.id}</td>
                          <td className="py-3">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded ${remito.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                  {remito.status === 'PENDING' ? 'PENDIENTE' : 'FACTURADO'}
                              </span>
                          </td>
                          <td className="py-3 text-sm text-gray-600">
                             {remito.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                          </td>
                          <td className="py-3 text-sm font-bold text-right text-gray-800">
                            ${rowTotal.toLocaleString('es-AR')}
                          </td>
                          <td className="py-3 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setShowPrintModal(remito)} className="text-gray-400 hover:text-gray-600 p-1" title="Ver Remito">
                                    <Printer size={16}/>
                                </button>
                                {/* Relationship Button */}
                                <button 
                                    onClick={() => handleShowRelations(remito)}
                                    className={`p-1 rounded hover:bg-indigo-50 ${remito.relatedInvoice ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
                                    title="Ver Relaciones (Facturas)"
                                >
                                    <Link size={16} />
                                </button>
                              </div>
                          </td>
                        </tr>
                      )
                   })}
                 </tbody>
               </table>
             </div>

             {historyFilter === 'PENDING' && (
                <div className="p-6 bg-slate-900 text-white rounded-b-xl flex justify-between items-center">
                    <div>
                    <div className="text-gray-400 text-sm">Total a Procesar</div>
                    <div className="text-3xl font-bold">${getBillingTotal().toLocaleString('es-AR')}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {selectedRemitoIds.length} remitos seleccionados
                    </div>
                    </div>
                    <div className="flex gap-3">
                    <button 
                        onClick={() => handleBillHistory('INTERNAL')}
                        disabled={selectedRemitoIds.length === 0}
                        className="px-6 py-3 rounded-lg border border-slate-600 hover:bg-slate-800 text-gray-300 transition-colors disabled:opacity-50">
                        Ingreso Interno
                    </button>
                    <button 
                        onClick={() => handleBillHistory('ARCA')}
                        disabled={selectedRemitoIds.length === 0}
                        className="px-6 py-3 rounded-lg bg-ferre-orange hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                        <FileText size={18} /> Facturar con ARCA
                    </button>
                    </div>
                </div>
             )}
           </div>
        </div>
      )}

      {/* --- MODAL: DIRECT BILLING FROM NEW REMITO --- */}
      {isBillingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                  
                  {billingStep === 'SELECTION' && (
                      <>
                        <div className="p-6 text-center border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Transformar en Venta</h3>
                            <p className="text-gray-500 mt-1">Total: <span className="font-bold text-ferre-orange text-lg">${getCartTotal().toLocaleString('es-AR')}</span></p>
                            <p className="text-sm text-gray-400 mt-2">Seleccione el tipo de comprobante para facturar directamente estos ítems.</p>
                        </div>
                        <div className="p-8 space-y-4">
                            <button 
                                onClick={() => handleDirectBilling('FISCAL')}
                                className="w-full flex items-center p-4 border-2 border-green-100 bg-green-50 hover:bg-green-100 hover:border-green-300 rounded-xl transition-all group">
                                <div className="bg-green-500 text-white p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                                    <Globe size={24}/>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-green-800 text-lg">Factura Fiscal (ARCA)</div>
                                    <div className="text-green-600 text-sm">Se conecta al servidor y genera CAE.</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleDirectBilling('INTERNAL')}
                                className="w-full flex items-center p-4 border-2 border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 rounded-xl transition-all group">
                                <div className="bg-gray-500 text-white p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                                    <FileText size={24}/>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-800 text-lg">Ingreso Interno (Ticket X)</div>
                                    <div className="text-gray-500 text-sm">Comprobante de uso interno. Sin CAE.</div>
                                </div>
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 text-center">
                            <button onClick={() => setIsBillingModalOpen(false)} className="text-gray-500 hover:text-gray-800 text-sm underline">Cancelar</button>
                        </div>
                      </>
                  )}

                  {billingStep === 'PROCESSING' && (
                      <div className="p-12 text-center">
                          <div className="w-16 h-16 border-4 border-ferre-orange border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                          <h3 className="text-lg font-bold text-gray-800">Procesando Facturación...</h3>
                      </div>
                  )}

                  {billingStep === 'SUCCESS' && (
                      <div className="p-8 text-center">
                          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                              <CheckCircle size={40} />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800">¡Venta Generada!</h3>
                          <p className="text-gray-500 mt-1">
                              {billingType === 'FISCAL' ? 'Factura Autorizada por ARCA' : 'Comprobante Interno Generado'}
                          </p>
                          <div className="mt-6">
                              <button onClick={() => setIsBillingModalOpen(false)} className="bg-slate-800 text-white py-2 px-6 rounded-lg font-bold hover:bg-slate-900">Cerrar</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Mock Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
           <div className="bg-white w-[500px] h-[700px] shadow-2xl rounded-sm p-8 flex flex-col relative">
              <button onClick={() => setShowPrintModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
              
              <div className="text-center border-b-2 border-black pb-4 mb-4">
                 <h1 className="text-2xl font-bold uppercase tracking-widest">Remito X</h1>
                 <p className="text-sm">Documento no válido como factura</p>
                 <p className="text-xs mt-2">Fecha: {showPrintModal.date} | Nro: {showPrintModal.id}</p>
              </div>

              <div className="mb-6">
                <p className="font-bold">Cliente: <span className="font-normal">{showPrintModal.clientName}</span></p>
              </div>

              <table className="w-full text-left mb-auto">
                <thead className="border-b border-black">
                  <tr>
                    <th className="py-1">Cant.</th>
                    <th className="py-1">Descripción</th>
                    {/* Explicitly NO PRICE COLUMN */}
                  </tr>
                </thead>
                <tbody>
                  {showPrintModal.items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 font-bold w-16">{item.quantity}</td>
                      <td className="py-2">{item.product.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 pt-8 border-t border-black">
                 <div className="flex justify-between items-end">
                    <div className="text-xs">
                       <p>Recibí conforme:</p>
                       <br/><br/>
                       <p>__________________________</p>
                       <p>Firma / Aclaración</p>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-xl">VALORIZADO: NO</p>
                    </div>
                 </div>
              </div>
              
              <div className="mt-6 flex gap-2 no-print">
                 <button className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 flex items-center justify-center gap-2" onClick={() => alert('Enviando Whatsapp...')}>
                    <Send size={16}/> WhatsApp
                 </button>
                 <button className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2" onClick={() => alert('Enviando Email...')}>
                    <Mail size={16}/> Email
                 </button>
                 <button className="flex-1 bg-slate-800 text-white py-2 rounded hover:bg-slate-700 flex items-center justify-center gap-2" onClick={() => setShowPrintModal(null)}>
                    <Printer size={16}/> Imprimir
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL: SHOW RELATIONS (INVOICES) --- */}
      {relationsModalData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-indigo-600 text-white flex justify-between items-center">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                          <Link size={18}/> Relaciones de Documento
                      </h3>
                      <button onClick={() => setRelationsModalData(null)}><X className="text-indigo-200 hover:text-white"/></button>
                  </div>
                  <div className="p-6">
                      <div className="mb-4">
                          <p className="text-xs text-gray-500 uppercase font-bold">Documento Actual</p>
                          <p className="text-lg font-bold text-gray-800">Remito: {relationsModalData.id}</p>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-2">Facturado En</p>
                          {relationsModalData.relatedInvoice ? (
                              <div className="flex items-center gap-2 bg-green-50 p-3 rounded border border-green-200">
                                  <FileText size={16} className="text-green-600"/>
                                  <span className="font-mono font-medium text-gray-700">{relationsModalData.relatedInvoice}</span>
                                  <CheckCircle size={16} className="text-green-500 ml-auto"/>
                              </div>
                          ) : (
                              <div className="text-center p-4 bg-gray-50 rounded border border-gray-200 text-gray-400 text-sm">
                                  Este remito aún no ha sido facturado.
                              </div>
                          )}
                      </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
                      <button onClick={() => setRelationsModalData(null)} className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-100">Cerrar</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Remitos;