import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, CreditCard, Printer, Trash2, Search, CheckCircle, Send, Mail, Plus, Minus, Banknote, Landmark, FileText, ClipboardList, CheckSquare, Square, X, AlertCircle, RefreshCw, Edit3, Save, Layers, Barcode, Store, AlertTriangle, Globe, DollarSign, Percent, History, Filter, Calendar, Eye, Package, List, MessageCircle, Link, QrCode, Scroll, Smartphone } from 'lucide-react';
import { InvoiceItem, Product, TaxCondition, Client, Remito, PriceList } from '../types';

// --- MOCK DATA GENERATORS ---
const createMockProduct = (id: string, sku: string, name: string, price: number, stock: number): Product => ({
  id, internalCode: sku, barcodes: [sku], providerCodes: [], 
  name, brand: 'Generico', provider: 'Proveedor Demo', category: 'General', description: '', 
  measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad', conversionFactor: 1, purchaseCurrency: 'ARS', saleCurrency: 'ARS',
  vatRate: 21, listCost: price * 0.6, discounts: [0,0,0,0], costAfterDiscounts: price * 0.6, profitMargin: 40,
  priceNeto: price / 1.21, priceFinal: price, stock: stock, stockDetails: [], minStock: 10, desiredStock: 20, reorderPoint: 5,
  location: '', ecommerce: { mercadoLibre: false, tiendaNube: false, webPropia: false }
});

const POS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SALES' | 'HISTORY'>('SALES');

  // --- STATE ---
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  
  // Product Search State (Main Input)
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'MERCADO_PAGO' | 'TRANSFERENCIA' | 'CHEQUE' | 'ECHEQ' | 'CTACTE'>('EFECTIVO');
  
  // Discount State
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);

  // Price List State (NEW)
  const [priceLists] = useState<PriceList[]>([
      { id: '1', name: 'Lista Base (Público)', type: 'BASE', active: true },
      { id: '2', name: 'Gremio / Instalador', type: 'CUSTOM', fixedMargin: 25, active: true }, // 25% margin over cost
      { id: '3', name: 'Mayorista', type: 'CUSTOM', fixedMargin: 15, active: true }, // 15% margin over cost
  ]);
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList>(priceLists[0]);

  // Client Management State
  // LOAD FROM LOCALSTORAGE IF AVAILABLE FOR CONSISTENCY
  const [clients, setClients] = useState<Client[]>(() => {
      const saved = localStorage.getItem('ferrecloud_clients');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Constructora del Norte', cuit: '30123456789', phone: '', address: '', balance: 0, limit: 0 },
        { id: '2', name: 'Juan Perez', cuit: '20112233445', phone: '', address: '', balance: 0, limit: 0 }
      ];
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);
  const [taxCondition, setTaxCondition] = useState<TaxCondition>(TaxCondition.CONSUMIDOR_FINAL);
  const [customerCuit, setCustomerCuit] = useState('00-00000000-0'); // Fallback manual
  const [customerName, setCustomerName] = useState('Consumidor Final'); // Fallback manual

  // Quick Client Modal State
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientCuit, setQuickClientCuit] = useState('');

  // Remito Integration
  const [clientRemitos, setClientRemitos] = useState<Remito[]>([]);
  const [isRemitoModalOpen, setIsRemitoModalOpen] = useState(false);
  const [selectedRemitoIds, setSelectedRemitoIds] = useState<string[]>([]);
  const [updatePricesToCurrent, setUpdatePricesToCurrent] = useState(true); // Default to updating prices

  // Checkout Process
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'TYPE_SELECTION' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('TYPE_SELECTION');
  const [checkoutError, setCheckoutError] = useState('');
  const [finalDocumentType, setFinalDocumentType] = useState<'FISCAL' | 'INTERNAL' | 'REMITO' | 'PRESUPUESTO'>('FISCAL');
  const [caeResult, setCaeResult] = useState<string | null>(null);
  const [caeVto, setCaeVto] = useState<string | null>(null);

  // --- PRODUCTS LOADING (PERSISTENT) ---
  const defaultPosProducts = [
    createMockProduct('1', 'TOR-001', 'Tornillo Autoperforante 2"', 150, 5000), 
    createMockProduct('2', 'MAR-055', 'Martillo Galponero', 12500, 15),
    createMockProduct('3', 'ADH-999', 'Adhesivo Industrial 500ml', 8500, 100),
    createMockProduct('4', 'PINT-20L', 'Látex Interior 20L', 45000, 8), 
    createMockProduct('5', 'TAL-750', 'Taladro Percutor 750w', 89000, 5),
  ];

  // Try to load from the shared "Inventory" storage first
  const [products, setProducts] = useState<Product[]>(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      return saved ? JSON.parse(saved) : defaultPosProducts;
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editModalTab, setEditModalTab] = useState<'GENERAL' | 'PRICING'>('GENERAL');

  // History State
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<any | null>(null);
  
  // Relations Modal State
  const [relationsModalData, setRelationsModalData] = useState<any | null>(null);

  // --- SALES HISTORY PERSISTENCE ---
  const defaultHistory = [
      { 
          id: 'FC-0001-00000001', date: '2023-10-27 10:30', client: 'Consumidor Final', type: 'Ticket Fiscal', total: 15400, items: 3, payment: 'Efectivo',
          relatedRemitos: ['R-0001', 'R-0005'],
          details: [
              { productId: '1', description: 'Tornillo Autoperforante 2"', quantity: 100, price: 150, subtotal: 15000 },
              { productId: '99', description: 'Arandela Goma', quantity: 4, price: 100, subtotal: 400 }
          ]
      }
  ];

  const [salesHistory, setSalesHistory] = useState(() => {
      const saved = localStorage.getItem('ferrecloud_sales_history');
      return saved ? JSON.parse(saved) : defaultHistory;
  });

  // Save history on change
  useEffect(() => {
      localStorage.setItem('ferrecloud_sales_history', JSON.stringify(salesHistory));
  }, [salesHistory]);

  const mockRemitos: Remito[] = [
      { 
          id: 'R-0001', clientId: '1', clientName: 'Constructora del Norte', date: '2023-10-15', status: 'PENDING',
          items: [
              // Historical price was 120, Current is 150
              { product: { ...products[0], priceFinal: 120 }, quantity: 100, historicalPrice: 120 }, 
              { product: products[2], quantity: 2, historicalPrice: 8000 }
          ]
      }
  ];

  // --- HELPER: CALCULATE PRICE WITH LIST ---
  const calculatePriceWithList = (product: Product, list: PriceList) => {
      if (list.type === 'BASE') {
          return product.priceFinal;
      }
      const margin = (list.fixedMargin || 0) / 100;
      const netPrice = product.costAfterDiscounts * (1 + margin);
      const finalPrice = netPrice * (1 + product.vatRate / 100);
      return Math.round(finalPrice * 100) / 100;
  };

  // --- EFFECT: RECALCULATE CART WHEN LIST CHANGES ---
  useEffect(() => {
      if (cart.length > 0) {
          setCart(prev => prev.map(item => {
              const newPrice = calculatePriceWithList(item.product, selectedPriceList);
              return {
                  ...item,
                  appliedPrice: newPrice,
                  subtotal: item.quantity * newPrice,
                  priceListId: selectedPriceList.id
              };
          }));
      }
  }, [selectedPriceList]);

  // --- FILTERING ---
  const productSearchResults = products.filter(p => 
      p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
      p.internalCode.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.barcodes.some(b => b.includes(productSearchTerm))
  );

  const filteredClients = clients.filter(c => 
      c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) || 
      c.cuit.includes(clientSearchTerm)
  );

  // --- ACTIONS ---

  // 1. Cart Management
  const addToCart = (product: Product, quantity: number = 1) => {
    const priceToApply = calculatePriceWithList(product, selectedPriceList);

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
          ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * priceToApply }
          : item
        );
      }
      return [...prev, { product, quantity, subtotal: priceToApply * quantity, appliedPrice: priceToApply, priceListId: selectedPriceList.id }];
    });
  };

  const handleProductSelect = (p: Product) => {
      addToCart(p);
      setProductSearchTerm('');
      setShowProductResults(false);
  };

  const handleProductKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && productSearchTerm) {
          const exactMatch = products.find(p => p.barcodes.includes(productSearchTerm) || p.internalCode === productSearchTerm);
          if (exactMatch) {
              addToCart(exactMatch);
              setProductSearchTerm('');
              setShowProductResults(false);
          } else if (productSearchResults.length > 0) {
              addToCart(productSearchResults[0]);
              setProductSearchTerm('');
              setShowProductResults(false);
          }
      }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
      if (newQuantity < 1) return;
      setCart(prev => prev.map(item => {
          if (item.product.id === productId) {
              return { ...item, quantity: newQuantity, subtotal: newQuantity * item.appliedPrice };
          }
          return item;
      }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const getTotals = () => {
      const rawTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
      const discountAmount = rawTotal * (globalDiscount / 100);
      const finalTotal = Math.max(0, rawTotal - discountAmount);
      const netTotal = finalTotal / 1.21;
      const vatTotal = finalTotal - netTotal;
      return { rawTotal, discountAmount, finalTotal, netTotal, vatTotal };
  };

  const { rawTotal, discountAmount, finalTotal, netTotal, vatTotal } = getTotals();

  // 2. Client Selection
  const selectClient = (client: Client) => {
      setSelectedClient(client);
      setCustomerName(client.name);
      setCustomerCuit(client.cuit);
      setTaxCondition(TaxCondition.RESPONSABLE_INSCRIPTO);
      setClientSearchTerm('');
      setShowClientResults(false);
      
      const pending = mockRemitos.filter(r => r.clientId === client.id && r.status === 'PENDING');
      setClientRemitos(pending);
  };

  const clearClient = () => {
      setSelectedClient(null);
      setCustomerName('Consumidor Final');
      setCustomerCuit('00-00000000-0');
      setTaxCondition(TaxCondition.CONSUMIDOR_FINAL);
      setClientRemitos([]);
  };

  const handleSaveQuickClient = () => {
      if(!quickClientName) return;
      const newClient: Client = {
          id: `QC-${Date.now()}`,
          name: quickClientName,
          cuit: quickClientCuit || '00-00000000-0',
          phone: '',
          address: '',
          balance: 0,
          limit: 0
      };
      // Save locally and update state
      const updatedClients = [...clients, newClient];
      setClients(updatedClients);
      localStorage.setItem('ferrecloud_clients', JSON.stringify(updatedClients));
      
      selectClient(newClient);
      setIsQuickClientOpen(false);
      setQuickClientName('');
      setQuickClientCuit('');
  };

  // 3. Remito Import Logic
  const handleToggleRemito = (id: string) => {
      setSelectedRemitoIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const importSelectedRemitos = () => {
      const selected = clientRemitos.filter(r => selectedRemitoIds.includes(r.id));
      selected.forEach(remito => {
          remito.items.forEach(item => {
              let productToUse = item.product;
              if (updatePricesToCurrent) {
                  const currentVersion = products.find(p => p.id === item.product.id);
                  if (currentVersion) productToUse = currentVersion;
              } else {
                  productToUse = { ...item.product, priceFinal: item.historicalPrice };
              }
              addToCart(productToUse, item.quantity);
          });
      });
      setIsRemitoModalOpen(false);
      setSelectedRemitoIds([]);
  };

  // 4. Product Editing
  const handleSaveProduct = () => {
      if (!editingProduct) return;
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
      setCart(prev => prev.map(item => {
          if (item.product.id === editingProduct.id) {
              const newPrice = calculatePriceWithList(editingProduct, selectedPriceList);
              return { ...item, product: editingProduct, appliedPrice: newPrice, subtotal: item.quantity * newPrice };
          }
          return item;
      }));
      setIsEditModalOpen(false);
      setEditingProduct(null);
  };

  useEffect(() => {
      if (isEditModalOpen && editingProduct) {
          let cost = Number(editingProduct.listCost) || 0;
          editingProduct.discounts.forEach(d => { if (d > 0) cost = cost * (1 - d / 100); });
          const priceNeto = cost * (1 + (Number(editingProduct.profitMargin) || 0) / 100);
          const priceFinal = priceNeto * (1 + (Number(editingProduct.vatRate) || 0) / 100);
          setEditingProduct(prev => prev ? ({ ...prev, costAfterDiscounts: parseFloat(cost.toFixed(2)), priceNeto: parseFloat(priceNeto.toFixed(2)), priceFinal: parseFloat(priceFinal.toFixed(2)) }) : null);
      }
  }, [editingProduct?.listCost, editingProduct?.discounts, editingProduct?.profitMargin, editingProduct?.vatRate, isEditModalOpen]);


  // 5. Checkout Logic (Updated to call Backend)
  const initiateCheckout = () => {
      if (cart.length === 0) return;
      setCheckoutStep('TYPE_SELECTION');
      setCheckoutError('');
      setIsCheckoutModalOpen(true);
  };

  const processSale = async (type: 'FISCAL' | 'INTERNAL' | 'REMITO' | 'PRESUPUESTO') => {
      setFinalDocumentType(type);
      setCheckoutStep('PROCESSING');
      setCheckoutError('');

      if (type === 'FISCAL') {
          // REAL INVOICING VIA BACKEND
          const backendUrl = localStorage.getItem('afip_backend_url') || 'http://localhost:3000';
          const cleanCuit = customerCuit.replace(/-/g, '');
          
          try {
              const response = await fetch(`${backendUrl}/create-invoice`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      amount: finalTotal,
                      cuit: cleanCuit !== '00000000000' && cleanCuit ? parseInt(cleanCuit) : 0,
                      cbteTipo: 6, // Factura B by default for simplicity in this demo, logic should pick A or B
                      concept: 1, // Products
                  })
              });

              if (!response.ok) {
                  const errData = await response.json();
                  throw new Error(errData.error || 'Error en el servidor de facturación');
              }

              const data = await response.json();
              if (data.CAE) {
                  setCaeResult(data.CAE);
                  setCaeVto(data.CAEFchVto);
                  
                  // Record Sale Locally
                  recordSaleInHistory(type, data.CAE);
                  setCheckoutStep('SUCCESS');
              } else {
                  throw new Error("ARCA no devolvió CAE. Verifique los datos.");
              }

          } catch (error: any) {
              console.error(error);
              setCheckoutError(error.message || "No se pudo conectar con el servicio de facturación.");
              setCheckoutStep('ERROR');
          }

      } else {
          // Internal Sale, Remito or Presupuesto (Simulation)
          setTimeout(() => {
              setCaeResult(null);
              recordSaleInHistory(type, null);
              setCheckoutStep('SUCCESS');
          }, 1000);
      }
  };

  const recordSaleInHistory = (type: 'FISCAL' | 'INTERNAL' | 'REMITO' | 'PRESUPUESTO', cae: string | null) => {
        // Update Stock ONLY for Sales and Remitos
        if (type !== 'PRESUPUESTO') {
            const updatedProducts = products.map(p => {
                const itemInCart = cart.find(c => c.product.id === p.id);
                return itemInCart ? { ...p, stock: p.stock - itemInCart.quantity } : p;
            });
            setProducts(updatedProducts);
            // Save updated stock to local storage so other tabs see it
            localStorage.setItem('ferrecloud_products', JSON.stringify(updatedProducts));
        }

        let docTypeLabel = '';
        let docPrefix = '';
        switch(type) {
            case 'FISCAL': docTypeLabel = 'Factura Electronica'; docPrefix = 'FC-'; break;
            case 'INTERNAL': docTypeLabel = 'Interno'; docPrefix = 'INT-'; break;
            case 'REMITO': docTypeLabel = 'Remito'; docPrefix = 'REM-'; break;
            case 'PRESUPUESTO': docTypeLabel = 'Presupuesto'; docPrefix = 'PRE-'; break;
        }

        const newSale = {
            id: `${docPrefix}${Date.now().toString().slice(-8)}`,
            date: new Date().toLocaleString(),
            client: customerName,
            type: docTypeLabel,
            total: finalTotal,
            items: cart.length,
            payment: type === 'PRESUPUESTO' ? 'Pendiente' : paymentMethod.replace('_', ' '),
            relatedRemitos: selectedRemitoIds,
            details: cart.map(i => ({ productId: i.product.id, description: i.product.name, quantity: i.quantity, price: i.appliedPrice, subtotal: i.subtotal })),
            cae: cae
        };
        setSalesHistory(prev => [newSale, ...prev]);
  };

  const resetPOS = () => {
      setCart([]);
      clearClient();
      setGlobalDiscount(0);
      setIsCheckoutModalOpen(false);
      setCaeResult(null);
      setPaymentMethod('EFECTIVO');
  };

  // ... (Existing handlers: Void, WhatsApp, Email, ShowRelations - No changes needed)
  const handleVoidSale = (sale: any) => { /* ... existing logic ... */ };
  const handleWhatsApp = (sale: any) => { /* ... existing logic ... */ };
  const handleEmail = (sale: any) => { /* ... existing logic ... */ };
  const handleShowRelations = (sale: any) => { setRelationsModalData(sale); };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden flex-col">
        {/* TOP POS HEADER with TABS (Unchanged) */}
        <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-0 flex justify-between items-end shrink-0 shadow-sm z-30">
             <div className="flex gap-4 pb-0">
                 <button onClick={() => setActiveTab('SALES')} className={`pb-4 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'SALES' ? 'border-ferre-orange text-ferre-orange' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <ShoppingCart size={18}/> Nueva Venta
                 </button>
                 <button onClick={() => setActiveTab('HISTORY')} className={`pb-4 px-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'HISTORY' ? 'border-ferre-orange text-ferre-orange' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <History size={18}/> Historial de Ventas
                 </button>
             </div>
             {activeTab === 'SALES' && (
                 <div className="mb-2 flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                     <List size={14} className="text-indigo-600"/>
                     <label className="text-xs font-bold text-indigo-800 uppercase">Lista:</label>
                     <select className="text-sm bg-transparent font-bold text-indigo-700 outline-none cursor-pointer" value={selectedPriceList.id} onChange={(e) => {
                            const list = priceLists.find(l => l.id === e.target.value);
                            if (list) setSelectedPriceList(list);
                        }}>
                         {priceLists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                     </select>
                 </div>
             )}
        </div>

        {/* CONTENT SALES TAB */}
        {activeTab === 'SALES' && (
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* ... (Search bar and layout logic remains exactly as before, focusing on the changes in checkout modal) ... */}
                {/* PRODUCT SEARCH & CLIENT */}
                <div className="bg-white p-4 border-b border-gray-200 flex gap-6 shrink-0 z-20">
                    {/* ... (Same search inputs) ... */}
                    <div className="flex-[2] relative">
                        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-ferre-orange focus-within:bg-white transition-all shadow-inner">
                            <Barcode className="text-gray-500 mr-3" />
                            <input type="text" placeholder="Escanear código de barras o buscar producto..." className="flex-1 bg-transparent outline-none text-lg font-medium text-gray-800 placeholder-gray-400" value={productSearchTerm} onChange={(e) => { setProductSearchTerm(e.target.value); setShowProductResults(true); }} onKeyDown={handleProductKeyDown} onBlur={() => setTimeout(() => setShowProductResults(false), 200)} autoFocus />
                            {productSearchTerm && <button onClick={() => setProductSearchTerm('')} className="p-1 hover:bg-gray-200 rounded-full"><X className="text-gray-400 hover:text-gray-600" size={18}/></button>}
                        </div>
                        {showProductResults && productSearchTerm && (
                            <div className="absolute top-full left-0 w-full bg-white shadow-2xl border border-gray-200 rounded-xl mt-2 max-h-[500px] overflow-y-auto z-50">
                                {productSearchResults.map(p => {
                                    const priceToDisplay = calculatePriceWithList(p, selectedPriceList);
                                    return (
                                        <button key={p.id} onClick={() => handleProductSelect(p)} className="w-full text-left px-6 py-4 hover:bg-orange-50 border-b border-gray-100 flex justify-between items-center group transition-colors">
                                            <div>
                                                <div className="font-bold text-gray-800 text-lg">{p.name}</div>
                                                <div className="text-sm text-gray-500 font-mono mt-1 flex items-center gap-2">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{p.internalCode}</span><span>•</span><span>{p.brand}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className={`text-xs font-bold ${p.stock > 10 ? 'text-green-600' : 'text-red-500'}`}>{p.stock} unid.</div>
                                                    <div className="text-[10px] text-gray-400 uppercase">Stock</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-ferre-orange text-2xl group-hover:scale-110 transition-transform">${priceToDisplay.toLocaleString('es-AR')}</div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {/* ... (Client search input - same as before) ... */}
                    <div className="flex-1 relative">
                        {!selectedClient ? (
                            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-4 py-3 h-full hover:border-blue-400 transition-colors">
                                <Search size={20} className="text-blue-500 mr-3"/>
                                <input type="text" placeholder="Buscar Cliente (Nombre / CUIT)" className="w-full outline-none text-sm font-medium" value={clientSearchTerm} onChange={(e) => { setClientSearchTerm(e.target.value); setShowClientResults(true); }} onFocus={() => setShowClientResults(true)}/>
                            </div>
                        ) : (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 h-full flex items-center justify-between shadow-sm">
                                <div><div className="font-bold text-blue-900 text-sm flex items-center gap-2"><User size={14}/> {selectedClient.name}</div><div className="text-xs text-blue-600 font-mono mt-0.5">{selectedClient.cuit}</div></div>
                                <button onClick={clearClient} className="text-blue-400 hover:text-red-500 p-1 hover:bg-blue-100 rounded"><X size={16}/></button>
                            </div>
                        )}
                        {showClientResults && clientSearchTerm && !selectedClient && (
                            <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-gray-200 rounded-xl mt-2 z-50 max-h-60 overflow-y-auto">
                                {filteredClients.map(c => (
                                    <button key={c.id} onClick={() => selectClient(c)} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0">
                                        <div className="font-bold text-gray-800">{c.name}</div><div className="text-xs text-gray-500">{c.cuit}</div>
                                    </button>
                                ))}
                                <button 
                                    onClick={() => {
                                        setQuickClientName(clientSearchTerm);
                                        setIsQuickClientOpen(true);
                                        setShowClientResults(false);
                                    }}
                                    className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 border-t border-blue-200 flex items-center justify-center gap-2"
                                >
                                    <Plus size={16}/> Crear Cliente Rápido "{clientSearchTerm}"
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* MAIN LAYOUT: CART & SIDEBAR */}
                <div className="flex-1 overflow-hidden p-6 flex gap-6">
                    {/* ... (Cart Table - same as before) ... */}
                    <div className="flex-[3] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2"><ShoppingCart size={18}/> Detalle de Venta</h3>
                            <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{cart.length} Ítems</span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white sticky top-0 z-10 text-xs text-gray-500 uppercase font-semibold border-b border-gray-200 shadow-sm">
                                    <tr><th className="px-6 py-4 w-1/2">Producto / Descripción</th><th className="px-6 py-4 text-center">Cantidad</th><th className="px-6 py-4 text-right">Precio Unit.</th><th className="px-6 py-4 text-right">Subtotal</th><th className="px-6 py-4 text-center"></th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {cart.map((item) => (
                                        <tr key={item.product.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800 text-base">{item.product.name}</div>
                                                <div className="text-xs text-gray-500 font-mono mt-1">{item.product.internalCode} • {item.product.brand}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center border border-gray-300 rounded-lg w-fit mx-auto bg-white shadow-sm">
                                                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-2 hover:bg-gray-100 text-gray-500 rounded-l-lg transition-colors"><Minus size={14}/></button>
                                                    <input className="w-12 text-center outline-none font-bold text-gray-700 text-base" value={item.quantity} onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}/>
                                                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-2 hover:bg-gray-100 text-gray-500 rounded-r-lg transition-colors"><Plus size={14}/></button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-gray-600 text-base">${item.appliedPrice.toLocaleString('es-AR')}</td>
                                            <td className="px-6 py-4 text-right"><span className="font-bold text-gray-900 text-lg">${item.subtotal.toLocaleString('es-AR')}</span></td>
                                            <td className="px-6 py-4 text-center"><button onClick={() => removeFromCart(item.product.id)} className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"><Trash2 size={18}/></button></td>
                                        </tr>
                                    ))}
                                    {cart.length === 0 && <tr><td colSpan={5} className="p-20 text-center"><div className="flex flex-col items-center justify-center text-gray-300"><ShoppingCart size={64} strokeWidth={1} className="mb-4"/><p className="text-xl font-medium text-gray-400">El carrito está vacío</p></div></td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT: TOTALS & ACTIONS (With updated Pay Buttons) */}
                    <div className="flex-1 min-w-[350px] max-w-[400px] flex flex-col gap-4">
                        {/* Fiscal Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1"><FileText size={12}/> Datos de Facturación</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Condición IVA</label>
                                    <select value={taxCondition} onChange={(e) => setTaxCondition(e.target.value as TaxCondition)} className="w-full mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm bg-white outline-none" disabled={!!selectedClient}>
                                        {Object.values(TaxCondition).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                {!selectedClient && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-1"><input type="text" placeholder="CUIT" value={customerCuit} onChange={(e) => setCustomerCuit(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-ferre-orange"/></div>
                                        <div className="col-span-2"><input type="text" placeholder="Nombre Consumidor" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-ferre-orange"/></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Totals & Payment */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col flex-1">
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Percent size={12}/> Descuento Global</label>
                                    <div className="flex items-center w-24">
                                        <input type="number" className="w-full p-1 text-sm text-right border border-gray-300 rounded-l focus:ring-1 focus:ring-ferre-orange outline-none" value={globalDiscount} onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} placeholder="0"/>
                                        <div className="bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500 border-y border-r border-gray-300 rounded-r">%</div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-gray-500 text-sm"><span>Subtotal (Bruto)</span><span>${rawTotal.toLocaleString('es-AR', {maximumFractionDigits: 2})}</span></div>
                                {discountAmount > 0 && <div className="flex justify-between text-green-600 text-sm font-bold"><span>Descuento aplicado</span><span>- ${discountAmount.toLocaleString('es-AR', {maximumFractionDigits: 2})}</span></div>}
                                <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between items-end">
                                    <span className="font-bold text-xl text-gray-800">Total</span>
                                    <span className="font-bold text-4xl text-ferre-orange tracking-tight">${finalTotal.toLocaleString('es-AR')}</span>
                                </div>
                            </div>

                            <button onClick={initiateCheckout} disabled={cart.length === 0} className="w-full mt-auto bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all">
                                <CheckCircle size={24}/> Cobrar Venta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ... (History Tab remains same) ... */}
        {activeTab === 'HISTORY' && (
            // ... (Same content as previous file for History)
            <div className="flex-1 bg-white p-6 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    {/* ... */}
                </div>
                <div className="flex-1 overflow-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left">
                        {/* ... */}
                        <tbody className="divide-y divide-gray-100">
                            {salesHistory.map((sale: any) => (
                                <tr key={sale.id} className={`hover:bg-gray-50 group ${sale.type.includes('Anulada') ? 'bg-red-50 hover:bg-red-50 text-gray-400' : ''}`}>
                                    {/* ... */}
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800 text-sm">{sale.id}</div>
                                        <div className="text-xs text-gray-500">{sale.items} Artículos</div>
                                    </td>
                                    {/* ... */}
                                    <td className="px-6 py-4 text-sm text-gray-600">{sale.client}</td>
                                    <td className="px-6 py-4 text-sm text-right font-bold">${sale.total.toLocaleString('es-AR')}</td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{sale.type}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      {/* --- MODAL: CHECKOUT & INVOICE TYPE --- */}
      {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                  
                  {/* STEP 1: SELECT TYPE */}
                  {checkoutStep === 'TYPE_SELECTION' && (
                      <>
                        <div className="p-6 text-center border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Finalizar Venta</h3>
                            <p className="text-gray-500 mt-1">Total a cobrar: <span className="font-bold text-ferre-orange text-lg">${finalTotal.toLocaleString('es-AR')}</span></p>
                            <p className="text-xs text-gray-400 uppercase font-bold mt-2">Medio de Pago: {paymentMethod.replace('_', ' ')}</p>
                        </div>
                        <div className="p-8 space-y-4">
                            {/* Main Billing Options */}
                            <button 
                                onClick={() => processSale('FISCAL')}
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
                                onClick={() => processSale('INTERNAL')}
                                className="w-full flex items-center p-4 border-2 border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 rounded-xl transition-all group">
                                <div className="bg-gray-500 text-white p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                                    <FileText size={24}/>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-gray-800 text-lg">Ingreso Interno (Ticket X)</div>
                                    <div className="text-gray-500 text-sm">Comprobante de uso interno. Sin CAE.</div>
                                </div>
                            </button>

                            {/* Secondary Conversion Options */}
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3 text-center">Otras Operaciones</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => processSale('REMITO')}
                                        className="flex items-center justify-center gap-2 p-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors">
                                        <ClipboardList size={16}/> Generar Remito
                                    </button>
                                    <button 
                                        onClick={() => processSale('PRESUPUESTO')}
                                        className="flex items-center justify-center gap-2 p-3 border border-orange-200 bg-orange-50 text-orange-700 rounded-lg font-bold text-sm hover:bg-orange-100 transition-colors">
                                        <FileText size={16}/> Guardar Presupuesto
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 text-center">
                            <button onClick={() => setIsCheckoutModalOpen(false)} className="text-gray-500 hover:text-gray-800 text-sm underline">Cancelar y volver</button>
                        </div>
                      </>
                  )}

                  {/* STEP 2: PROCESSING */}
                  {checkoutStep === 'PROCESSING' && (
                      <div className="p-12 text-center">
                          <div className="w-16 h-16 border-4 border-ferre-orange border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                          <h3 className="text-lg font-bold text-gray-800">Procesando...</h3>
                          <p className="text-gray-500 text-sm mt-2">
                              {finalDocumentType === 'FISCAL' ? 'Contactando Servidores ARCA...' : 'Guardando documento...'}
                          </p>
                      </div>
                  )}

                  {/* STEP 3: SUCCESS */}
                  {checkoutStep === 'SUCCESS' && (
                      <div className="p-8 text-center">
                          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                              <CheckCircle size={40} />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800">¡Operación Exitosa!</h3>
                          <p className="text-gray-500 mt-1">
                              {finalDocumentType === 'FISCAL' ? 'Factura Autorizada por ARCA' : 
                               finalDocumentType === 'REMITO' ? 'Remito generado correctamente' :
                               finalDocumentType === 'PRESUPUESTO' ? 'Presupuesto guardado' :
                               'Comprobante Interno Generado'}
                          </p>
                          
                          {caeResult && (
                              <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded-lg inline-block">
                                  <p className="text-green-800 font-mono font-bold">CAE: {caeResult}</p>
                                  <p className="text-xs text-green-600">Vto: {caeVto}</p>
                              </div>
                          )}

                          <div className="mt-8 grid grid-cols-2 gap-3">
                              <button onClick={() => alert('Imprimiendo ticket...')} className="bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-900 font-bold flex items-center justify-center gap-2">
                                  <Printer size={18}/> Imprimir
                              </button>
                              <button onClick={() => alert('Enviando por email...')} className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2">
                                  <Mail size={18}/> Enviar
                              </button>
                          </div>
                          <button onClick={resetPOS} className="mt-4 text-ferre-orange font-bold hover:underline text-sm block w-full">Nueva Operación</button>
                      </div>
                  )}

                  {/* STEP 4: ERROR */}
                  {checkoutStep === 'ERROR' && (
                      <div className="p-8 text-center">
                          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <AlertTriangle size={32} />
                          </div>
                          <h3 className="text-xl font-bold text-red-800">Error en Operación</h3>
                          <p className="text-red-600 text-sm mt-2">{checkoutError}</p>
                          <div className="mt-6">
                              <button onClick={() => setCheckoutStep('TYPE_SELECTION')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded font-bold">Intentar de nuevo</button>
                          </div>
                      </div>
                  )}

              </div>
          </div>
      )}

      {/* --- QUICK CLIENT MODAL --- */}
      {isQuickClientOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
                      <h3 className="font-bold text-blue-900 flex items-center gap-2"><User size={18}/> Alta Rápida de Cliente</h3>
                      <button onClick={() => setIsQuickClientOpen(false)}><X className="text-blue-400 hover:text-blue-700" size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Nombre / Razón Social</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" 
                            value={quickClientName}
                            onChange={(e) => setQuickClientName(e.target.value)}
                            autoFocus
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">CUIT (Opcional)</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" 
                            value={quickClientCuit}
                            onChange={(e) => setQuickClientCuit(e.target.value)}
                            placeholder="00-00000000-0"
                          />
                      </div>
                      <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200 flex items-start gap-2">
                          <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                          <p>Este cliente se guardará y seleccionará automáticamente para la venta actual.</p>
                      </div>
                      <button 
                        onClick={handleSaveQuickClient}
                        disabled={!quickClientName}
                        className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          Guardar y Seleccionar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default POS;