
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Truck, Plus, Search, FileText, User, UserPlus, MoreVertical, 
    CreditCard, Calendar, X, Save, Percent, ArrowLeft, ArrowUpRight, 
    Wallet, CheckCircle, DollarSign, Printer, Download, Eye, Upload, 
    FileSpreadsheet, RefreshCw, Globe, Trash2, ShoppingBag, Package, 
    AlertTriangle, Edit, Box, Tag, Layers, Calculator, Landmark, 
    History, ArrowDownLeft, CheckSquare, Square, ArrowRight, Info, Scroll, Smartphone, Loader2, Zap, ShieldCheck, UserCheck, LayoutTemplate, MapPin,
    Scan, Camera, FileCheck, AlertOctagon, Scale, Pencil, UserSearch, Receipt, Send, Scissors, Ban, Mail, MessageCircle, Minus, PlusCircle,
    Tag as TagIcon, Barcode, Store, Building2, ExternalLink, ShoppingCart
} from 'lucide-react';
import { Purchase, Provider, Product, PurchaseItem, ProductStock, CompanyConfig, ViewState, CurrencyQuote, ProductProviderHistory } from '../types';
import { fetchCompanyByCuit, analyzeInvoice } from '../services/geminiService';

interface ProviderPayment {
    id: string;
    providerId: string;
    date: string;
    amount: number;
    method: string;
    reference: string;
    notes: string;
}

interface PurchasesProps {
    defaultTab?: 'PURCHASES' | 'PROVIDERS';
    onNavigateToPrices?: () => void;
}

const Purchases: React.FC<PurchasesProps> = ({ defaultTab = 'PURCHASES', onNavigateToPrices }) => {
  const [activeTab, setActiveTab] = useState<'PURCHASES' | 'PROVIDERS'>(defaultTab);
  const [searchTerm, setSearchTerm] = useState('');
  
  const companyConfig: CompanyConfig = useMemo(() => {
    const saved = localStorage.getItem('company_config');
    return saved ? JSON.parse(saved) : {};
  }, []);

  const currencies: CurrencyQuote[] = useMemo(() => companyConfig.currencies || [], [companyConfig]);

  const getDefaultProfitMargin = (): number => {
    return companyConfig.defaultProfitMargin ?? 30;
  };

  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [loadMode, setLoadMode] = useState<'SELECT' | 'IA' | 'MANUAL'>('SELECT');
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [shouldUpdateCosts, setShouldUpdateCosts] = useState(true);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [invoiceMetadata, setInvoiceMetadata] = useState<any>({
      providerId: '',
      providerName: '',
      numeroFactura: '',
      fecha: new Date().toISOString().split('T')[0],
      totalFactura: 0,
      cuitProveedor: '',
      descuentoGlobal: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [quickProductTab, setQuickProductTab] = useState<'GENERAL' | 'PRICING' | 'STOCK'>('GENERAL');
  const [quickProductForm, setQuickProductForm] = useState<Partial<Product> & { internalCode?: string }>({
      name: '',
      internalCode: '',
      brand: '',
      category: 'GENERAL',
      vatRate: 21,
      barcodes: [],
      measureUnitSale: 'Unidad',
      measureUnitPurchase: 'Unidad',
      conversionFactor: 1,
      purchaseCurrency: 'ARS',
      saleCurrency: 'ARS',
      listCost: 0,
      profitMargin: getDefaultProfitMargin(),
      stockDetails: [
          { branchId: '1', branchName: 'Casa Central', quantity: 0 }
      ]
  });

  const [manualSearch, setManualSearch] = useState('');
  const [showManualResults, setShowManualResults] = useState(false);

  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [isSearchingCuit, setIsSearchingCuit] = useState(false);
  const [providerForm, setProviderForm] = useState<Partial<Provider>>({
      name: '', cuit: '', contact: '', address: '', balance: 0, defaultDiscounts: [0, 0, 0], orderPhone: '', orderEmail: '', currencyQuoteId: ''
  });

  const [selectedProviderForHistory, setSelectedProviderForHistory] = useState<Provider | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [isPaymentOrderModalOpen, setIsPaymentOrderModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Partial<ProviderPayment>>({
      providerId: '',
      amount: 0,
      method: 'EFECTIVO',
      reference: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
  });

  const [products, setProducts] = useState<Product[]>(() => {
      const saved = localStorage.getItem('ferrecloud_products');
      return saved ? JSON.parse(saved) : [];
  });

  const [providers, setProviders] = useState<Provider[]>(() => {
    const saved = localStorage.getItem('ferrecloud_providers');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
      const saved = localStorage.getItem('ferrecloud_purchases');
      return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState<ProviderPayment[]>(() => {
      const saved = localStorage.getItem('ferrecloud_provider_payments');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
  }, [providers]);

  useEffect(() => {
      localStorage.setItem('ferrecloud_provider_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('ferrecloud_purchases', JSON.stringify(purchases));
  }, [purchases]);

  const handleSearchCuit = async () => {
    if (!providerForm.cuit || providerForm.cuit.length < 8) {
        alert("Por favor ingrese un CUIT válido.");
        return;
    }
    setIsSearchingCuit(true);
    try {
        const data = await fetchCompanyByCuit(providerForm.cuit);
        if (data && data.name) {
            setProviderForm(prev => ({
                ...prev,
                name: data.name,
                address: data.address || '',
                contact: data.phone || ''
            }));
        }
    } catch (err) {
        alert("No se pudo conectar con el servicio de consulta fiscal.");
    } finally {
        setIsSearchingCuit(false);
    }
  };

  const handleSaveProvider = () => {
      if (!providerForm.name || !providerForm.cuit) {
          alert("Nombre y CUIT son obligatorios.");
          return;
      }

      setProviders(prev => {
          if (isEditingProvider && providerForm.id) {
              return prev.map(p => p.id === providerForm.id ? { ...p, ...providerForm } as Provider : p);
          } else {
              const newProv: Provider = {
                  ...providerForm as Provider,
                  id: Date.now().toString(),
                  balance: 0,
                  defaultDiscounts: providerForm.defaultDiscounts || [0,0,0]
              };
              return [newProv, ...prev];
          }
      });
      setIsProviderModalOpen(false);
      setProviderForm({ name: '', cuit: '', contact: '', address: '', balance: 0, defaultDiscounts: [0, 0, 0], orderPhone: '', orderEmail: '', currencyQuoteId: '' });
  };

  const deleteProvider = (id: string) => {
      if (confirm('¿Desea eliminar este proveedor?')) {
          setProviders(prev => prev.filter(p => p.id !== id));
      }
  };

  const handleOpenPaymentOrder = (providerId?: string) => {
      setPaymentForm({
          providerId: providerId || '',
          amount: 0,
          method: 'EFECTIVO',
          reference: '',
          notes: '',
          date: new Date().toISOString().split('T')[0]
      });
      setIsPaymentOrderModalOpen(true);
  };

  const handleSavePaymentOrder = () => {
      if (!paymentForm.providerId || !paymentForm.amount || paymentForm.amount <= 0) {
          alert("Debe seleccionar un proveedor e ingresar un monto válido.");
          return;
      }

      const method = paymentForm.method!;
      const isAdjustment = method === 'DESCUENTO' || method === 'NO_PAGO';

      setProviders(prev => prev.map(p => 
          p.id === paymentForm.providerId 
          ? { ...p, balance: Math.max(0, p.balance - paymentForm.amount!) } 
          : p
      ));

      if (!isAdjustment) {
        const newPayment: ProviderPayment = {
            id: `OP-${Date.now().toString().slice(-6)}`,
            providerId: paymentForm.providerId,
            date: paymentForm.date!,
            amount: paymentForm.amount,
            method: method,
            reference: paymentForm.reference || '',
            notes: paymentForm.notes || ''
        };
        setPayments([newPayment, ...payments]);
      }

      if (selectedProviderForHistory && selectedProviderForHistory.id === paymentForm.providerId) {
          setSelectedProviderForHistory(prev => prev ? { ...prev, balance: Math.max(0, prev.balance - paymentForm.amount!) } : null);
      }

      setIsPaymentOrderModalOpen(false);
  };

  const handleScanClick = () => {
      setLoadMode('IA');
      fileInputRef.current?.click();
  }

  const handleInvoiceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAiScanning(true);
      try {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              const result = await analyzeInvoice(base64, file.type);
              
              const prov = providers.find(p => p.cuit.replace(/[^0-9]/g, '') === result.cuitProveedor.replace(/[^0-9]/g, ''));
              
              const mappedItems = result.items.map((item: any) => {
                  const product = products.find(p => p.name.toLowerCase().includes(item.descripcion.toLowerCase()) || item.descripcion.toLowerCase().includes(p.name.toLowerCase()));
                  return {
                      ...item,
                      bonificacion: 0,
                      productId: product?.id,
                      currentCost: product ? (product.costAfterDiscounts || product.listCost) : 0,
                      matched: !!product
                  };
              });

              setInvoiceMetadata({
                  ...result,
                  providerName: prov?.name || 'PROVEEDOR NO REGISTRADO',
                  providerId: prov?.id || '',
                  descuentoGlobal: 0
              });
              setScannedItems(mappedItems);
              setIsAiScanning(false);
          };
          reader.readAsDataURL(file);
      } catch (error) {
          alert("Error al procesar la factura con IA.");
          setIsAiScanning(false);
      }
  };

  const handleAddManualItem = (p: Product) => {
      const newItem = {
          descripcion: p.name,
          cantidad: 1,
          costoUnitarioNeto: p.listCost,
          bonificacion: 0,
          subtotal: p.listCost,
          productId: p.id,
          currentCost: p.costAfterDiscounts || p.listCost,
          matched: true
      };
      setScannedItems([...scannedItems, newItem]);
      setManualSearch('');
      setShowManualResults(false);
  };

  const handleOpenQuickProductModal = () => {
      setQuickProductForm({
          name: '', internalCode: '', brand: '', category: 'GENERAL', vatRate: 21,
          barcodes: [], measureUnitSale: 'Unidad', measureUnitPurchase: 'Unidad',
          conversionFactor: 1,
          purchaseCurrency: 'ARS',
          saleCurrency: 'ARS',
          listCost: 0,
          profitMargin: getDefaultProfitMargin(),
          stockDetails: [
              { branchId: '1', branchName: 'Casa Central', quantity: 0 }
          ]
      });
      setQuickProductTab('GENERAL');
      setIsQuickProductModalOpen(true);
  };

  const handleQuickAddProduct = () => {
      if (!quickProductForm.name || !quickProductForm.internalCode) {
          alert("Descripción y SKU son obligatorios.");
          return;
      }

      const cost = quickProductForm.listCost || 0;
      const profit = quickProductForm.profitMargin || getDefaultProfitMargin();
      const vat = quickProductForm.vatRate || 21;
      const priceNeto = cost * (1 + profit / 100);
      const priceFinal = priceNeto * (1 + vat / 100);
      const totalStock = quickProductForm.stockDetails?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

      const newProd: Product = {
          ...quickProductForm as Product,
          id: `prod-${Date.now()}`,
          internalCodes: [quickProductForm.internalCode!.toUpperCase()],
          name: quickProductForm.name!.toUpperCase(),
          brand: quickProductForm.brand?.toUpperCase() || 'GENÉRICO',
          category: quickProductForm.category?.toUpperCase() || 'GENERAL',
          provider: invoiceMetadata.providerName || '',
          barcodes: quickProductForm.barcodes || [],
          providerCodes: [],
          description: '',
          measureUnitSale: quickProductForm.measureUnitSale || 'Unidad',
          measureUnitPurchase: quickProductForm.measureUnitPurchase || 'Unidad',
          conversionFactor: quickProductForm.conversionFactor || 1,
          purchaseCurrency: quickProductForm.purchaseCurrency || 'ARS',
          saleCurrency: quickProductForm.saleCurrency || 'ARS',
          vatRate: vat as any,
          listCost: cost,
          discounts: [0, 0, 0, 0],
          costAfterDiscounts: cost,
          profitMargin: profit,
          priceNeto: parseFloat(priceNeto.toFixed(2)),
          priceFinal: parseFloat(priceFinal.toFixed(2)),
          stock: totalStock,
          stockDetails: quickProductForm.stockDetails || [],
          minStock: 0,
          desiredStock: 0,
          reorderPoint: 0,
          location: '',
          ecommerce: {},
          lastProviders: []
      };

      const updatedMaster = [newProd, ...products];
      setProducts(updatedMaster);
      localStorage.setItem('ferrecloud_products', JSON.stringify(updatedMaster));
      handleAddManualItem(newProd);
      setIsQuickProductModalOpen(false);
  };

  const updateManualItem = (idx: number, updates: any) => {
      const items = [...scannedItems];
      const updated = { ...items[idx], ...updates };
      const baseSub = updated.cantidad * updated.costoUnitarioNeto;
      updated.subtotal = baseSub * (1 - (updated.bonificacion || 0) / 100);
      items[idx] = updated;
      setScannedItems(items);
  };

  const subtotalProductos = useMemo(() => {
    return scannedItems.reduce((acc, i) => acc + i.subtotal, 0);
  }, [scannedItems]);

  const totalCalculadoFinal = useMemo(() => {
    return subtotalProductos * (1 - (invoiceMetadata.descuentoGlobal || 0) / 100);
  }, [subtotalProductos, invoiceMetadata.descuentoGlobal]);

  const handleSavePurchase = () => {
      if (!invoiceMetadata.providerId || scannedItems.length === 0) {
          alert("Debe seleccionar un proveedor e ingresar al menos un producto.");
          return;
      }

      const newPurchase: Purchase = {
          id: invoiceMetadata.numeroFactura || `FC-MAN-${Date.now()}`,
          providerId: invoiceMetadata.providerId,
          providerName: invoiceMetadata.providerName,
          date: invoiceMetadata.fecha,
          type: 'FACTURA_A',
          items: scannedItems.length,
          total: totalCalculadoFinal,
          status: 'PENDING'
      };

      // 1. ACTUALIZAR MAESTRO DE PRODUCTOS (COSTOS E HISTORIAL DE PROVEEDORES)
      const currentProducts = JSON.parse(localStorage.getItem('ferrecloud_products') || '[]');
      const updatedProducts = currentProducts.map((p: Product) => {
          const match = scannedItems.find(si => si.productId === p.id);
          if (match) {
              const itemCost = match.costoUnitarioNeto;
              const unitCostAfterItemDiscount = itemCost * (1 - (match.bonificacion || 0) / 100);
              const unitCostFinal = unitCostAfterItemDiscount * (1 - (invoiceMetadata.descuentoGlobal || 0) / 100);

              // Nuevo historial de proveedor
              const historyEntry: ProductProviderHistory = {
                  id: invoiceMetadata.providerId,
                  name: invoiceMetadata.providerName,
                  date: invoiceMetadata.fecha,
                  price: match.costoUnitarioNeto
              };

              // Mantener solo los últimos 2 proveedores (el nuevo va al principio)
              const updatedLastProviders = [historyEntry, ...(p.lastProviders || [])].slice(0, 2);

              if (shouldUpdateCosts) {
                const priceNeto = unitCostFinal * (1 + (p.profitMargin / 100));
                const priceFinal = priceNeto * (1 + (p.vatRate / 100));
                return { 
                    ...p, 
                    listCost: match.costoUnitarioNeto, 
                    costAfterDiscounts: unitCostFinal,
                    priceNeto: parseFloat(priceNeto.toFixed(2)),
                    priceFinal: parseFloat(priceFinal.toFixed(2)),
                    lastProviders: updatedLastProviders
                };
              } else {
                return { ...p, lastProviders: updatedLastProviders };
              }
          }
          return p;
      });
      localStorage.setItem('ferrecloud_products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);

      setProviders(prev => prev.map(p => p.id === invoiceMetadata.providerId ? { ...p, balance: p.balance + totalCalculadoFinal } : p));
      setPurchases([newPurchase, ...purchases]);
      resetCarga();
      alert("Comprobante registrado con éxito. Se actualizó el historial de proveedores de los artículos ingresados.");
  };

  const resetCarga = () => {
      setLoadMode('SELECT');
      setInvoiceMetadata({ providerId: '', providerName: '', numeroFactura: '', fecha: new Date().toISOString().split('T')[0], totalFactura: 0, cuitProveedor: '', descuentoGlobal: 0 });
      setScannedItems([]);
      setIsAiScanning(false);
      setIsNewPurchaseModalOpen(false);
  }

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.cuit.includes(searchTerm)
  );

  const manualSearchResults = useMemo(() => {
      if (!manualSearch.trim()) return [];
      return products.filter(p => 
          p.name.toLowerCase().includes(manualSearch.toLowerCase()) || 
          p.internalCodes.some(c => c.toLowerCase().includes(manualSearch.toLowerCase()))
      ).slice(0, 5);
  }, [manualSearch, products]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 bg-slate-50 overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleInvoiceFile} />

      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <Truck size={28} className="text-indigo-600"/> Compras y Abastecimiento
          </h2>
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-1 italic">Mapeo de Facturas con IA Vision y Gestión Fiscal</p>
        </div>
        
        <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
            <button onClick={() => setActiveTab('PURCHASES')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'PURCHASES' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Libro Compras</button>
            <button onClick={() => setActiveTab('PROVIDERS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'PROVIDERS' ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>Fichero Proveedores</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        {activeTab === 'PURCHASES' ? (
            <div className="animate-fade-in flex flex-col flex-1 space-y-4 overflow-hidden">
                <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-gray-200 shadow-sm">
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input type="text" placeholder="Buscar por proveedor o ID..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 ml-4">
                        <button 
                            onClick={() => onNavigateToPrices?.()}
                            className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-white border border-slate-200 transition-all">
                            <Layers size={16} /> Listas y Precios
                        </button>
                        <button 
                            onClick={() => setIsNewPurchaseModalOpen(true)}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-700">
                            <Plus size={16} /> Cargar Comprobante
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-8 py-5">Comprobante / Proveedor</th>
                                    <th className="px-8 py-5 text-right">Importe Neto</th>
                                    <th className="px-8 py-5 text-center">Estado Pago</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {purchases.filter(p => p.providerName.toLowerCase().includes(searchTerm.toLowerCase())).map(purchase => (
                                    <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">{purchase.providerName}</div>
                                            <div className="text-[10px] text-gray-400 font-mono font-bold">{purchase.id} • {purchase.date}</div>
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-slate-900 text-lg tracking-tighter">${purchase.total.toLocaleString('es-AR')}</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${purchase.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                {purchase.status === 'PAID' ? 'LIQUIDADA' : 'CTACTE PENDIENTE'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-3 bg-slate-50 text-slate-300 hover:text-slate-800 hover:bg-white rounded-xl transition-all shadow-sm group-hover:scale-105"><Eye size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ) : (
            <div className="animate-fade-in flex flex-col flex-1 space-y-4 overflow-hidden">
                <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-gray-200 shadow-sm">
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 group-focus-within:text-ferre-orange transition-colors" size={18} />
                        <input type="text" placeholder="Filtrar por razón social..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 ml-4">
                        <button 
                            onClick={() => handleOpenPaymentOrder()}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/10 active:scale-95 transition-all hover:bg-indigo-700">
                            <DollarSign size={16} /> Orden de Pago
                        </button>
                        <button 
                            onClick={() => { setIsEditingProvider(false); setProviderForm({name: '', cuit: '', contact: '', address: '', balance: 0, defaultDiscounts: [0,0,0], orderPhone: '', orderEmail: '', currencyQuoteId: ''}); setIsProviderModalOpen(true); }}
                            className="bg-ferre-orange text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-900/10 active:scale-95 transition-all hover:bg-orange-600">
                            <UserPlus size={16} /> Nuevo Proveedor
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-8 py-5">Proveedor / CUIT</th>
                                    <th className="px-8 py-5">Moneda</th>
                                    <th className="px-8 py-5 text-right">Saldo Adeudado</th>
                                    <th className="px-8 py-5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProviders.map(prov => (
                                    <tr key={prov.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-lg uppercase">{prov.name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">{prov.name}</p>
                                                    <p className="text-[10px] text-indigo-500 font-mono font-bold italic">{prov.cuit}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                                                    <DollarSign size={14}/>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">
                                                    {currencies.find(c => c.id === prov.currencyQuoteId)?.name || 'Dólar Standard'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={`px-8 py-5 text-right font-black text-xl tracking-tighter ${prov.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            ${prov.balance.toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => handleOpenPaymentOrder(prov.id)}
                                                    className="p-3 bg-green-50 text-green-600 border border-green-100 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                                    title="Registrar Pago"
                                                >
                                                    <DollarSign size={18}/>
                                                </button>
                                                <button onClick={() => { setSelectedProviderForHistory(prov); setIsHistoryOpen(true); }} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 shadow-sm transition-all"><History size={18}/></button>
                                                <button onClick={() => { setIsEditingProvider(true); setProviderForm(prov); setIsProviderModalOpen(true); }} className="p-3 bg-slate-100 text-indigo-600 border border-indigo-100 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><Pencil size={18}/></button>
                                                <button onClick={() => deleteProvider(prov.id)} className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>

      {isNewPurchaseModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
                  <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20"><ShoppingCart size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Ingreso de Mercadería y Facturación</h3>
                              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Carga manual o digitalización con IA</p>
                          </div>
                      </div>
                      <button onClick={resetCarga} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
                      {loadMode === 'SELECT' ? (
                          <div className="flex flex-col items-center justify-center py-20 space-y-10 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                                  <button onClick={handleScanClick} className="group relative bg-white p-12 rounded-[3rem] border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex flex-col items-center text-center">
                                      <div className="p-8 bg-indigo-50 text-indigo-600 rounded-full mb-6 group-hover:scale-110 transition-transform"><Scan size={64}/></div>
                                      <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Procesar con IA Vision</h4>
                                      <p className="text-sm text-slate-400 mt-2 font-medium">Sube un PDF o foto de la factura.<br/>Gemini extraerá ítems y costos automáticamente.</p>
                                      <div className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 group-hover:bg-indigo-700 transition-colors">Digitalizar Ahora</div>
                                  </button>
                                  <button onClick={() => setLoadMode('MANUAL')} className="group relative bg-white p-12 rounded-[3rem] border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex flex-col items-center text-center">
                                      <div className="p-8 bg-slate-100 text-slate-600 rounded-full mb-6 group-hover:scale-110 transition-transform"><Edit size={64}/></div>
                                      <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Ingreso Manual</h4>
                                      <p className="text-sm text-slate-400 mt-2 font-medium">Cargar productos línea por línea.<br/>Ideal para facturas de pocos ítems.</p>
                                      <div className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-100 group-hover:bg-slate-800 transition-colors">Iniciar Carga</div>
                                  </button>
                              </div>
                          </div>
                      ) : isAiScanning ? (
                          <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-pulse">
                              <div className="relative">
                                  <div className="w-32 h-32 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                  <div className="absolute inset-0 flex items-center justify-center text-indigo-600"><Globe size={40}/></div>
                              </div>
                              <div className="text-center">
                                  <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">La IA está digitalizando la factura...</h4>
                                  <p className="text-sm text-gray-400 font-bold uppercase mt-2 tracking-widest">Identificando ítems y comparando con stock activo</p>
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-8 animate-fade-in h-full flex flex-col">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Proveedor</label>
                                      <select 
                                        className="w-full bg-transparent font-black text-slate-800 text-sm outline-none border-b-2 border-slate-100 focus:border-indigo-500 pb-1"
                                        value={invoiceMetadata.providerId}
                                        onChange={e => {
                                            const p = providers.find(p => p.id === e.target.value);
                                            setInvoiceMetadata({...invoiceMetadata, providerId: e.target.value, providerName: p?.name || ''});
                                        }}
                                      >
                                          <option value="">-- SELECCIONAR --</option>
                                          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                      </select>
                                  </div>
                                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nº Comprobante</label>
                                      <input 
                                        type="text" 
                                        placeholder="0001-0000..." 
                                        className="w-full bg-transparent font-black text-slate-800 text-sm outline-none border-b-2 border-slate-100 focus:border-indigo-500 pb-1 uppercase"
                                        value={invoiceMetadata.numeroFactura}
                                        onChange={e => setInvoiceMetadata({...invoiceMetadata, numeroFactura: e.target.value})}
                                      />
                                  </div>
                                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Fecha Emisión</label>
                                      <input 
                                        type="date" 
                                        className="w-full bg-transparent font-black text-slate-800 text-sm outline-none border-b-2 border-slate-100 focus:border-indigo-500 pb-1"
                                        value={invoiceMetadata.fecha}
                                        onChange={e => setInvoiceMetadata({...invoiceMetadata, fecha: e.target.value})}
                                      />
                                  </div>
                                  <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100 flex flex-col justify-center relative overflow-hidden">
                                      <div className="absolute top-0 right-0 p-4 opacity-10"><Calculator size={60}/></div>
                                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Comprobante</p>
                                      <h4 className="font-black text-3xl tracking-tighter leading-none">${totalCalculadoFinal.toLocaleString('es-AR')}</h4>
                                      {invoiceMetadata.descuentoGlobal > 0 && (
                                          <p className="text-[8px] font-black text-green-400 uppercase tracking-widest mt-1">Con Desc. Global: {invoiceMetadata.descuentoGlobal}%</p>
                                      )}
                                  </div>
                              </div>

                              {loadMode === 'MANUAL' && (
                                  <div className="relative shrink-0">
                                      <div className="flex items-center gap-3 bg-white p-4 rounded-[2rem] border border-gray-200 shadow-sm">
                                          <Search className="text-gray-300 ml-2" size={24}/>
                                          <input 
                                            type="text" 
                                            placeholder="Buscar producto para agregar..." 
                                            className="flex-1 bg-transparent font-black text-slate-700 outline-none uppercase text-sm"
                                            value={manualSearch}
                                            onChange={e => {setManualSearch(e.target.value); setShowManualResults(true);}}
                                            onFocus={() => setShowManualResults(true)}
                                          />
                                          <div className="flex gap-2">
                                            <button 
                                              onClick={handleOpenQuickProductModal}
                                              className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100">
                                                <PlusCircle size={14}/> Nuevo Artículo
                                            </button>
                                          </div>
                                      </div>
                                      {showManualResults && manualSearch && (
                                          <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in p-2">
                                              {manualSearchResults.map(p => (
                                                  <button key={p.id} onClick={() => handleAddManualItem(p)} className="w-full flex justify-between items-center p-4 hover:bg-indigo-50 rounded-2xl transition-all group border-b last:border-0 border-gray-50">
                                                      <div className="text-left">
                                                          <p className="font-black text-slate-800 text-xs uppercase">{p.name}</p>
                                                          <p className="text-[10px] text-gray-400 font-mono">SKU: {p.internalCodes[0]}</p>
                                                      </div>
                                                      <div className="flex items-center gap-4">
                                                          <div className="text-right">
                                                              <p className="text-[10px] font-black text-gray-400 uppercase">Stock</p>
                                                              <p className="font-black text-slate-600">{p.stock}</p>
                                                          </div>
                                                          <Plus size={20} className="text-indigo-500 group-hover:scale-125 transition-transform"/>
                                                      </div>
                                                  </button>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              )}

                              <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
                                  <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Layers size={14}/> Desglose de Mercadería</h4>
                                      <div className="flex items-center gap-6">
                                          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1"><TagIcon size={10} className="text-green-500"/> Descuento Global (%)</label>
                                              <input 
                                                type="number" 
                                                className="w-16 bg-slate-50 rounded-lg p-1 text-right font-black text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                                value={invoiceMetadata.descuentoGlobal || ''}
                                                onChange={e => setInvoiceMetadata({...invoiceMetadata, descuentoGlobal: parseFloat(e.target.value) || 0})}
                                              />
                                          </div>
                                          <label className="flex items-center gap-2 cursor-pointer">
                                              <div onClick={() => setShouldUpdateCosts(!shouldUpdateCosts)} className={`w-10 h-5 rounded-full relative transition-all ${shouldUpdateCosts ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${shouldUpdateCosts ? 'right-1' : 'left-1'}`}></div>
                                              </div>
                                              <span className="text-[10px] font-black text-slate-500 uppercase">Actualizar costos en stock</span>
                                          </label>
                                      </div>
                                  </div>
                                  <div className="overflow-x-auto flex-1 custom-scrollbar">
                                      <table className="w-full text-left">
                                          <thead className="bg-slate-900 text-[9px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-800 sticky top-0 z-10">
                                              <tr>
                                                  <th className="px-8 py-5">Descripción del Artículo</th>
                                                  <th className="px-8 py-5 text-center">Cant.</th>
                                                  <th className="px-8 py-5 text-right">Costo Unit. Neto</th>
                                                  <th className="px-8 py-5 text-center">Bonif %</th>
                                                  <th className="px-8 py-5 text-right">Subtotal</th>
                                                  <th className="px-8 py-5 text-center"></th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100 text-[10px]">
                                              {scannedItems.length === 0 ? (
                                                  <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-black uppercase">Agregue productos para procesar la factura</td></tr>
                                              ) : scannedItems.map((item, idx) => (
                                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                      <td className="px-8 py-5">
                                                          <div className="flex items-center gap-3">
                                                              {!item.matched ? <AlertTriangle className="text-orange-500" size={14}/> : <CheckCircle className="text-green-500" size={14}/>}
                                                              <div>
                                                                <p className="font-black text-slate-800 uppercase leading-none mb-1.5 truncate max-w-[300px]">{item.descripcion}</p>
                                                                <p className={`text-[8px] font-black uppercase ${item.matched ? 'text-green-600' : 'text-orange-500'}`}>{item.matched ? 'VINCULADO A STOCK' : 'NUEVO ARTÍCULO'}</p>
                                                              </div>
                                                          </div>
                                                      </td>
                                                      <td className="px-8 py-5">
                                                          <div className="flex items-center justify-center gap-3 bg-slate-100 rounded-xl p-1 w-24 mx-auto">
                                                              <button onClick={() => updateManualItem(idx, {cantidad: Math.max(1, item.cantidad - 1)})} className="p-1 hover:bg-white rounded-lg text-slate-400"><Minus size={12}/></button>
                                                              <span className="font-black text-slate-800">{item.cantidad}</span>
                                                              <button onClick={() => updateManualItem(idx, {cantidad: item.cantidad + 1})} className="p-1 hover:bg-white rounded-lg text-slate-400"><Plus size={12}/></button>
                                                          </div>
                                                      </td>
                                                      <td className="px-8 py-5 text-right">
                                                          <div className="flex items-center justify-end gap-2">
                                                              <span className="text-slate-400">$</span>
                                                              <input 
                                                                type="number" 
                                                                className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-right font-black outline-none focus:border-indigo-500"
                                                                value={item.costoUnitarioNeto}
                                                                onChange={e => updateManualItem(idx, {costoUnitarioNeto: parseFloat(e.target.value) || 0})}
                                                              />
                                                          </div>
                                                      </td>
                                                      <td className="px-8 py-5 text-center">
                                                          <div className="flex items-center justify-center gap-1">
                                                              <input 
                                                                type="number" 
                                                                className="w-14 bg-white border border-gray-200 rounded-lg p-1 text-center font-black text-[9px] outline-none focus:border-green-500"
                                                                value={item.bonificacion || ''}
                                                                placeholder="0"
                                                                onChange={e => updateManualItem(idx, {bonificacion: parseFloat(e.target.value) || 0})}
                                                              />
                                                              <span className="text-slate-400">%</span>
                                                          </div>
                                                      </td>
                                                      <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">${item.subtotal.toLocaleString('es-AR')}</td>
                                                      <td className="px-8 py-5 text-center">
                                                          <button onClick={() => setScannedItems(scannedItems.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                                      </td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>

                              <div className="shrink-0 flex justify-end gap-4 p-8 bg-white border-t border-gray-100 rounded-b-[3rem]">
                                  <div className="mr-auto flex items-baseline gap-2">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal S/ Desc. Global:</span>
                                      <span className="text-lg font-black text-slate-600">${subtotalProductos.toLocaleString('es-AR')}</span>
                                  </div>
                                  <button onClick={resetCarga} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
                                  <button onClick={handleSavePurchase} className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95">
                                      <FileCheck size={18}/> Validar e Ingresar Factura
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {isProviderModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-ferre-orange text-white rounded-2xl shadow-lg"><UserSearch size={24}/></div>
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{isEditingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronización con Base de Datos Fiscal</p>
                          </div>
                      </div>
                      <button onClick={() => setIsProviderModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                  </div>
                  
                  <div className="p-10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                      <div className="space-y-4">
                          <div className="relative">
                              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-2 tracking-widest">CUIT / Identificación Fiscal</label>
                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      className="flex-1 p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-black text-slate-800 tracking-widest" 
                                      placeholder="30-XXXXXXXX-X"
                                      value={providerForm.cuit}
                                      onChange={e => setProviderForm({...providerForm, cuit: e.target.value})}
                                  />
                                  <button 
                                      onClick={handleSearchCuit}
                                      disabled={isSearchingCuit}
                                      className="bg-indigo-600 text-white px-5 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50 shadow-lg shadow-indigo-100 min-w-[64px]">
                                      {isSearchingCuit ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} className="fill-white" />}
                                  </button>
                              </div>
                          </div>

                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-2 tracking-widest">Razón Social</label>
                              <input 
                                  type="text" 
                                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-ferre-orange outline-none font-black text-slate-800 uppercase" 
                                  value={providerForm.name} 
                                  onChange={e => setProviderForm({...providerForm, name: e.target.value.toUpperCase()})}
                              />
                          </div>

                          {/* CAMPO COTIZACIÓN DE MONEDA */}
                          <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-2 tracking-widest">Cotización Predeterminada</label>
                              <select 
                                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-600 outline-none font-bold text-slate-700"
                                value={providerForm.currencyQuoteId}
                                onChange={e => setProviderForm({...providerForm, currencyQuoteId: e.target.value})}
                              >
                                  <option value="">USAR DÓLAR STANDARD</option>
                                  {currencies.map(c => <option key={c.id} value={c.id}>{c.name} (${c.value})</option>)}
                              </select>
                              <p className="text-[8px] text-slate-400 italic mt-1 px-2 uppercase font-bold">Esta cotización se aplicará a todos los productos de este proveedor cargados en USD.</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-2 tracking-widest flex items-center gap-1"><MessageCircle size={10} className="text-green-600"/> WhatsApp Pedidos</label>
                                  <input 
                                      type="text" 
                                      placeholder="+54911..."
                                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-600 outline-none font-bold text-slate-700" 
                                      value={providerForm.orderPhone} 
                                      onChange={e => setProviderForm({...providerForm, orderPhone: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-2 tracking-widest flex items-center gap-1"><Mail size={10} className="text-indigo-600"/> Email Pedidos</label>
                                  <input 
                                      type="email" 
                                      placeholder="pedidos@empresa.com"
                                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-700" 
                                      value={providerForm.orderEmail} 
                                      onChange={e => setProviderForm({...providerForm, orderEmail: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="p-8 bg-slate-50 border-t border-gray-100 flex justify-end gap-4 shrink-0">
                          <button onClick={() => setIsProviderModalOpen(false)} className="px-8 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors">Cancelar</button>
                          <button onClick={handleSaveProvider} className="bg-slate-900 text-white px-12 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95">
                              {isEditingProvider ? <Save size={18}/> : <Plus size={18}/>} 
                              {isEditingProvider ? 'Guardar Cambios' : 'Registrar Proveedor'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Purchases;
