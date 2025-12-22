
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ShoppingCart, User, CreditCard, Printer, Trash2, Search, CheckCircle, 
    Plus, Minus, Banknote, FileText, X, AlertCircle, RefreshCw, Barcode, 
    DollarSign, History, Filter, Eye, Package, UserPlus, Zap, Landmark, Smartphone,
    PackagePlus, Loader2, CloudLightning, Globe, Percent, Tag, ClipboardList, CheckSquare, Square
} from 'lucide-react';
import { InvoiceItem, Product, TaxCondition, Client, PriceList, Remito } from '../types';
import { searchVirtualInventory } from '../services/geminiService';

const DEFAULT_CLIENT: Client = {
    id: 'cf-default',
    name: 'Consumidor Final',
    cuit: '00-00000000-0',
    phone: '',
    address: '',
    balance: 0,
    limit: 0
};

const POS: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'SALES' | 'HISTORY'>('SALES');
    const searchRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<HTMLDivElement>(null);

    // --- ESTADO INICIAL ---
    const [products] = useState<Product[]>(() => {
        const saved = localStorage.getItem('ferrecloud_products');
        return saved ? JSON.parse(saved) : [];
    });

    const [clients] = useState<Client[]>(() => {
        const saved = localStorage.getItem('ferrecloud_clients');
        return saved ? JSON.parse(saved) : [];
    });

    const [salesHistory, setSalesHistory] = useState<any[]>(() => {
        return JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]');
    });

    // --- ESTADO DEL CARRITO ---
    const [cart, setCart] = useState<InvoiceItem[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client>(DEFAULT_CLIENT);
    const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'MERCADO_PAGO' | 'TRANSFERENCIA' | 'CTACTE'>('EFECTIVO');
    const [discountPerc, setDiscountPerc] = useState<number>(0);
    
    // --- REMITOS PENDIENTES ---
    const [pendingRemitos, setPendingRemitos] = useState<Remito[]>([]);
    const [isRemitoModalOpen, setIsRemitoModalOpen] = useState(false);
    const [selectedRemitoIds, setSelectedRemitoIds] = useState<string[]>([]);

    useEffect(() => {
        if (selectedClient.id === 'cf-default') {
            setPendingRemitos([]);
            return;
        }
        // Buscar remitos del cliente
        const savedRemitos = localStorage.getItem('ferrecloud_remitos');
        if (savedRemitos) {
            const allRemitos: Remito[] = JSON.parse(savedRemitos);
            const clientRemitos = allRemitos.filter(r => 
                (r.clientId === selectedClient.id || r.clientName === selectedClient.name) && 
                r.status === 'PENDING'
            );
            setPendingRemitos(clientRemitos);
        }
    }, [selectedClient]);

    // --- BÚSQUEDA ---
    const [productSearch, setProductSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [showProductResults, setShowProductResults] = useState(false);
    const [showClientResults, setShowClientResults] = useState(false);
    
    // IA Cloud Search State
    const [cloudResults, setCloudResults] = useState<Product[]>([]);
    const [isCloudSearching, setIsCloudSearching] = useState(false);

    // --- LISTAS DE PRECIOS ---
    const [priceLists] = useState<PriceList[]>([
        { id: '1', name: 'Lista Base (Público)', type: 'BASE', active: true },
        { id: '2', name: 'Gremio / Instalador', type: 'CUSTOM', fixedMargin: 25, active: true },
        { id: '3', name: 'Mayorista', type: 'CUSTOM', fixedMargin: 15, active: true },
    ]);
    const [selectedPriceList, setSelectedPriceList] = useState<PriceList>(priceLists[0]);

    // --- MODALES ---
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutStatus, setCheckoutStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

    // --- CIERRE DE DROPDOWNS ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowProductResults(false);
            if (clientRef.current && !clientRef.current.contains(event.target as Node)) setShowClientResults(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const localResults = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) return [];
        return products.filter(p => 
            (p.name || '').toLowerCase().includes(term) || 
            (p.internalCode || '').toLowerCase().includes(term) ||
            (p.brand || '').toLowerCase().includes(term)
        ).slice(0, 5);
    }, [productSearch, products]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (productSearch.trim().length > 2 && localResults.length === 0) {
                setIsCloudSearching(true);
                const results = await searchVirtualInventory(productSearch);
                const mappedResults = results.map(r => ({
                    ...r,
                    priceFinal: (r as any).price || 0,
                    internalCode: (r as any).sku || 'CLOUD',
                    brand: 'Catálogo Nube',
                    stock: 0,
                    provider: 'Proveedor Nube',
                    vatRate: 21,
                    discounts: [0,0,0,0],
                    costAfterDiscounts: ((r as any).price || 0) * 0.7,
                    listCost: ((r as any).price || 0) * 0.7,
                    stockDetails: []
                } as unknown as Product));
                setCloudResults(mappedResults);
                setIsCloudSearching(false);
            } else {
                setCloudResults([]);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [productSearch, localResults]);

    const filteredClients = useMemo(() => {
        const term = clientSearch.trim().toLowerCase();
        if (!term) return [];
        return clients.filter(c => 
            (c.name || '').toLowerCase().includes(term) || 
            (c.cuit || '').includes(term)
        ).slice(0, 5);
    }, [clientSearch, clients]);

    const addToCart = (product: Product) => {
        const price = calculatePriceWithList(product, selectedPriceList);
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id ? 
                    { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * price } : item
                );
            }
            return [...prev, { product, quantity: 1, appliedPrice: price, subtotal: price, priceListId: selectedPriceList.id }];
        });
        setProductSearch('');
        setShowProductResults(false);
    };

    const calculatePriceWithList = (product: Product, list: PriceList) => {
        if (list.type === 'BASE') return product.priceFinal;
        const margin = (list.fixedMargin || 0) / 100;
        const netPrice = (product.costAfterDiscounts || product.listCost) * (1 + margin);
        const finalPrice = netPrice * (1 + (product.vatRate || 21) / 100);
        return Math.round(finalPrice * 100) / 100;
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty, subtotal: newQty * item.appliedPrice };
            }
            return item;
        }));
    };

    const removeFromCartLocal = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id));

    const totals = useMemo(() => {
        const grossTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
        const discountAmount = grossTotal * (discountPerc / 100);
        const finalTotal = grossTotal - discountAmount;
        const subtotal = finalTotal / 1.21;
        const iva = finalTotal - subtotal;
        return { subtotal, iva, total: finalTotal, discountAmount, grossTotal };
    }, [cart, discountPerc]);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setCheckoutStatus('PROCESSING');
        setIsCheckoutOpen(true);
        setTimeout(() => {
            const cae = Math.random().toString().slice(2, 16);
            const newSale = {
                id: `FC-${Date.now().toString().slice(-8)}`,
                date: new Date().toLocaleString(),
                client: selectedClient.name,
                total: totals.total,
                items: cart.length,
                payment: paymentMethod,
                cae,
                discount: discountPerc
            };
            
            const updatedHistory = [newSale, ...salesHistory];
            setSalesHistory(updatedHistory);
            localStorage.setItem('ferrecloud_sales_history', JSON.stringify(updatedHistory));

            // Si se importaron remitos, marcarlos como facturados
            if (selectedRemitoIds.length > 0) {
                const savedRemitos = localStorage.getItem('ferrecloud_remitos');
                if (savedRemitos) {
                    const allRemitos: Remito[] = JSON.parse(savedRemitos);
                    const updatedRemitos = allRemitos.map(r => 
                        selectedRemitoIds.includes(r.id) ? { ...r, status: 'BILLED' as const, relatedInvoice: newSale.id } : r
                    );
                    localStorage.setItem('ferrecloud_remitos', JSON.stringify(updatedRemitos));
                }
            }

            setCheckoutStatus('SUCCESS');
        }, 1500);
    };

    const handleDeleteSale = (id: string) => {
        if (window.confirm('¿Desea anular esta venta? El registro será eliminado del historial.')) {
            const updated = salesHistory.filter(s => s.id !== id);
            setSalesHistory(updated);
            localStorage.setItem('ferrecloud_sales_history', JSON.stringify(updated));
        }
    };

    const resetPOS = () => {
        setCart([]);
        setSelectedClient(DEFAULT_CLIENT);
        setClientSearch('');
        setIsCheckoutOpen(false);
        setCheckoutStatus('IDLE');
        setPaymentMethod('EFECTIVO');
        setDiscountPerc(0);
        setSelectedRemitoIds([]);
    };

    const importRemitoItems = () => {
        const savedRemitos = localStorage.getItem('ferrecloud_remitos');
        if (!savedRemitos) return;
        const allRemitos: Remito[] = JSON.parse(savedRemitos);
        const selectedRemitos = allRemitos.filter(r => selectedRemitoIds.includes(r.id));
        const newItems: InvoiceItem[] = [];
        
        selectedRemitos.forEach(remito => {
            remito.items.forEach(rItem => {
                const existing = newItems.find(i => i.product.id === rItem.product.id);
                if (existing) {
                    existing.quantity += rItem.quantity;
                    existing.subtotal = existing.quantity * existing.appliedPrice;
                } else {
                    newItems.push({
                        product: rItem.product,
                        quantity: rItem.quantity,
                        appliedPrice: rItem.historicalPrice,
                        subtotal: rItem.quantity * rItem.historicalPrice
                    });
                }
            });
        });

        setCart(prev => {
            const updated = [...prev];
            newItems.forEach(item => {
                const index = updated.findIndex(u => u.product.id === item.product.id);
                if (index >= 0) {
                    updated[index].quantity += item.quantity;
                    updated[index].subtotal = updated[index].quantity * updated[index].appliedPrice;
                } else {
                    updated.push(item);
                }
            });
            return updated;
        });
        setIsRemitoModalOpen(false);
    };

    return (
        <div className="flex h-full bg-slate-100 overflow-hidden flex-col">
            <div className="bg-white border-b border-gray-200 px-8 pt-4 flex justify-between items-end shrink-0">
                <div className="flex gap-8">
                    <button onClick={() => setActiveTab('SALES')} className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-4 transition-all ${activeTab === 'SALES' ? 'border-ferre-orange text-ferre-orange' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                        Venta Mostrador
                    </button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`pb-4 px-2 font-black text-sm uppercase tracking-widest border-b-4 transition-all ${activeTab === 'HISTORY' ? 'border-ferre-orange text-ferre-orange' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                        Historial del Día
                    </button>
                </div>
                <div className="pb-4 flex gap-4">
                    <select 
                        value={selectedPriceList.id}
                        onChange={(e) => setSelectedPriceList(priceLists.find(l => l.id === e.target.value) || priceLists[0])}
                        className="bg-slate-100 border-none rounded-xl px-4 py-2 text-xs font-black uppercase text-slate-600 outline-none focus:ring-2 focus:ring-ferre-orange"
                    >
                        {priceLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            {activeTab === 'SALES' && (
                <div className="flex flex-1 overflow-hidden p-6 gap-6">
                    <div className="flex-[3] flex flex-col gap-6 overflow-hidden">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                            <div className="relative" ref={searchRef}>
                                <div className="flex items-center bg-white border-2 border-transparent focus-within:border-ferre-orange rounded-3xl px-6 py-4 shadow-sm transition-all group">
                                    <Barcode className="text-gray-300 group-focus-within:text-ferre-orange mr-4" size={24} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar entre 140,000 artículos..." 
                                        className="flex-1 bg-transparent outline-none text-lg font-bold text-gray-700" 
                                        value={productSearch}
                                        onFocus={() => setShowProductResults(true)}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && localResults.length > 0) addToCart(localResults[0]);
                                        }}
                                    />
                                    {isCloudSearching && <Loader2 className="animate-spin text-indigo-500" size={20}/>}
                                    {productSearch && !isCloudSearching && (
                                        <button onClick={() => setProductSearch('')} className="p-1 hover:bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
                                    )}
                                </div>
                                
                                {showProductResults && productSearch.trim().length > 0 && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-fade-in max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {localResults.length > 0 && (
                                            <div className="bg-slate-50 px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Stock Local</div>
                                        )}
                                        {localResults.map(p => (
                                            <div key={p.id} className="w-full text-left p-4 hover:bg-orange-50 border-b last:border-0 flex justify-between items-center group transition-colors">
                                                <div className="flex gap-4 flex-1 cursor-pointer" onClick={() => addToCart(p)}>
                                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-white group-hover:text-ferre-orange transition-colors"><Package size={20}/></div>
                                                    <div>
                                                        <p className="font-black text-slate-800 uppercase tracking-tight">{p.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.internalCode} • {p.brand}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-4">
                                                    <div>
                                                        <p className="font-black text-ferre-orange text-lg">${calculatePriceWithList(p, selectedPriceList).toLocaleString('es-AR')}</p>
                                                        <p className={`text-[10px] font-black uppercase ${p.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>Stock: {p.stock}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={clientRef}>
                                <div className="flex items-center bg-white border-2 border-transparent focus-within:border-blue-500 rounded-3xl px-6 py-4 shadow-sm transition-all group">
                                    <User className="text-gray-300 group-focus-within:text-blue-500 mr-4" size={24} />
                                    <input 
                                        type="text" 
                                        placeholder="Cliente (Nombre o CUIT)..." 
                                        className="flex-1 bg-transparent outline-none text-lg font-bold text-gray-700" 
                                        value={selectedClient.id === 'cf-default' && !showClientResults ? 'Consumidor Final' : clientSearch}
                                        onFocus={() => { setShowClientResults(true); if(selectedClient.id === 'cf-default') setClientSearch(''); }}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                    />
                                    {pendingRemitos.length > 0 && selectedClient.id !== 'cf-default' && (
                                        <button 
                                            onClick={() => setIsRemitoModalOpen(true)}
                                            className="mr-2 px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 hover:bg-orange-200 transition-colors animate-pulse">
                                            <ClipboardList size={14}/> {pendingRemitos.length} Remitos
                                        </button>
                                    )}
                                    {selectedClient.id !== 'cf-default' && (
                                        <button onClick={() => setSelectedClient(DEFAULT_CLIENT)} className="p-1 hover:bg-red-50 text-red-500 rounded-full"><X size={20}/></button>
                                    )}
                                </div>
                                {showClientResults && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-fade-in max-h-[300px] overflow-y-auto custom-scrollbar">
                                        <button 
                                            onClick={() => { setSelectedClient(DEFAULT_CLIENT); setClientSearch(''); setShowClientResults(false); }}
                                            className="w-full text-left p-4 hover:bg-blue-50 border-b flex justify-between items-center group transition-colors">
                                            <div>
                                                <p className="font-black text-blue-600 uppercase tracking-tight">Consumidor Final (Predeterminado)</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Facturación General</p>
                                            </div>
                                            <CheckCircle size={18} className="text-blue-500"/>
                                        </button>
                                        {filteredClients.map(c => (
                                            <button key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(''); setShowClientResults(false); }} className="w-full text-left p-4 hover:bg-blue-50 border-b last:border-0 flex justify-between items-center group transition-colors">
                                                <div>
                                                    <p className="font-black text-slate-800 uppercase tracking-tight">{c.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{c.cuit}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-[10px] font-black uppercase ${c.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>Saldo: ${c.balance.toLocaleString('es-AR')}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900 text-white sticky top-0 z-10">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest rounded-tl-[2.5rem]">Producto / SKU</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Cantidad</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Unitario</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Subtotal</th>
                                            <th className="px-8 py-5 text-center rounded-tr-[2.5rem]">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cart.map(item => (
                                            <tr key={item.product.id} className="hover:bg-slate-50 transition-colors animate-fade-in group">
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-slate-800 uppercase tracking-tight">{item.product.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono font-bold">{item.product.internalCode}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button onClick={() => updateQty(item.product.id, -1)} className="p-2 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-xl transition-all shadow-sm"><Minus size={14}/></button>
                                                        <span className="font-black text-xl w-8 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQty(item.product.id, 1)} className="p-2 bg-slate-100 hover:bg-green-100 hover:text-green-600 rounded-xl transition-all shadow-sm"><Plus size={14}/></button>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right font-bold text-gray-500">${item.appliedPrice.toLocaleString('es-AR')}</td>
                                                <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">${item.subtotal.toLocaleString('es-AR')}</td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => removeFromCartLocal(item.product.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {cart.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-32 text-center text-gray-300">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <ShoppingCart size={80} strokeWidth={1} className="opacity-20"/>
                                                        <p className="text-xl font-black uppercase tracking-tighter">El carrito está vacío</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="w-[400px] flex flex-col gap-6 shrink-0">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-200 space-y-8 flex-1">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <CreditCard size={14} className="text-ferre-orange"/> Forma de Pago
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'EFECTIVO', icon: Banknote, label: 'Efectivo' },
                                        { id: 'MERCADO_PAGO', icon: Smartphone, label: 'MP / QR' },
                                        { id: 'TRANSFERENCIA', icon: Landmark, label: 'Transferencia' },
                                        { id: 'CTACTE', icon: History, label: 'Cta. Corriente' }
                                    ].map(method => (
                                        <button 
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === method.id ? 'border-ferre-orange bg-orange-50 text-ferre-orange shadow-md ring-4 ring-orange-50' : 'border-gray-50 text-gray-400 hover:bg-slate-50'}`}
                                        >
                                            <method.icon size={20}/>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-dashed border-gray-200">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Tag size={12} className="text-ferre-orange"/> Descuento Global
                                    </label>
                                    <div className="relative group">
                                        <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-ferre-orange" size={16}/>
                                        <input 
                                            type="number" 
                                            min="0" max="100"
                                            placeholder="0%"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-ferre-orange rounded-2xl outline-none font-bold text-slate-700 transition-all"
                                            value={discountPerc || ''}
                                            onChange={(e) => setDiscountPerc(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <div className="flex justify-between items-center text-slate-500">
                                        <span className="text-xs font-bold uppercase tracking-wider">Subtotal Bruto</span>
                                        <span className="font-mono font-bold">${totals.grossTotal.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                                    </div>
                                    {totals.discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-red-500">
                                            <span className="text-xs font-bold uppercase tracking-wider italic">Descuento ({discountPerc}%)</span>
                                            <span className="font-mono font-bold">-$ {totals.discountAmount.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="text-xs font-bold uppercase tracking-wider">IVA (21%)</span>
                                        <span className="font-mono font-bold">${totals.iva.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-4">
                                        <span className="text-lg font-black text-slate-800 uppercase tracking-tighter">Total a Pagar</span>
                                        <div className="text-right">
                                            <p className="text-5xl font-black text-ferre-orange tracking-tighter leading-none">${totals.total.toLocaleString('es-AR')}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Pesos Argentinos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-20 disabled:scale-100"
                            >
                                <Zap size={24}/> COBRAR VENTA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: SELECCIÓN DE REMITOS PENDIENTES */}
            {isRemitoModalOpen && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                                    <ClipboardList size={28}/>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Remitos Pendientes</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedClient.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsRemitoModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar mb-8 p-1">
                            {pendingRemitos.map(remito => (
                                <div 
                                    key={remito.id}
                                    onClick={() => setSelectedRemitoIds(prev => prev.includes(remito.id) ? prev.filter(id => id !== remito.id) : [...prev, remito.id])}
                                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedRemitoIds.includes(remito.id) ? 'border-ferre-orange bg-orange-50 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <div className="flex items-center gap-4">
                                        {selectedRemitoIds.includes(remito.id) ? <CheckSquare className="text-ferre-orange" /> : <Square className="text-gray-300" />}
                                        <div>
                                            <p className="font-black text-slate-800 uppercase tracking-tight">{remito.id}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{remito.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900">${remito.items.reduce((a,c) => a + (c.historicalPrice * c.quantity), 0).toLocaleString('es-AR')}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{remito.items.length} Ítems</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={importRemitoItems}
                            disabled={selectedRemitoIds.length === 0}
                            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 disabled:opacity-20 transition-all flex items-center justify-center gap-3">
                            <Plus size={20}/> IMPORTAR AL CARRITO
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'HISTORY' && (
                <div className="flex-1 p-8 overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-10 py-5">Comprobante / Fecha</th>
                                    <th className="px-10 py-5">Cliente</th>
                                    <th className="px-10 py-5">Medio de Pago</th>
                                    <th className="px-10 py-5 text-right">Total</th>
                                    <th className="px-10 py-5 text-center">CAE</th>
                                    <th className="px-10 py-5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {salesHistory.map((sale: any) => (
                                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-slate-800 text-sm">{sale.id}</p>
                                                {sale.discount > 0 && <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">-{sale.discount}%</span>}
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{sale.date}</p>
                                        </td>
                                        <td className="px-10 py-6 font-bold text-gray-600">{sale.client}</td>
                                        <td className="px-10 py-6">
                                            <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded uppercase">{sale.payment.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-10 py-6 text-right font-black text-xl tracking-tighter text-slate-900">${sale.total.toLocaleString('es-AR')}</td>
                                        <td className="px-10 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <CheckCircle size={14} className="text-green-500 mb-1"/>
                                                <span className="text-[9px] font-mono font-bold text-gray-400">{sale.cae}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all" title="Ver Detalle"><Eye size={20}/></button>
                                                <button onClick={() => handleDeleteSale(sale.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Anular Venta"><Trash2 size={20}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isCheckoutOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-12 text-center">
                        {checkoutStatus === 'PROCESSING' ? (
                            <div className="space-y-8 py-10">
                                <div className="w-24 h-24 border-8 border-ferre-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Emitiendo Comprobante...</h3>
                                <p className="text-slate-400 font-medium italic">Conectando con servidores de ARCA...</p>
                            </div>
                        ) : (
                            <div className="space-y-8 py-10 animate-fade-in">
                                <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <CheckCircle size={64}/>
                                </div>
                                <div>
                                    <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">¡Venta Exitosa!</h3>
                                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">La factura ha sido autorizada</p>
                                </div>
                                <div className="flex gap-4">
                                    <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"><Printer size={16}/> Ticket</button>
                                    <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"><FileText size={16}/> Factura A4</button>
                                </div>
                                <button onClick={resetPOS} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl">CONTINUAR AL SIGUIENTE CLIENTE</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
