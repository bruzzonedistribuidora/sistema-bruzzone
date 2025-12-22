
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ShoppingCart, User, CreditCard, Printer, Trash2, Search, CheckCircle, 
    Plus, Minus, Banknote, FileText, X, AlertCircle, RefreshCw, Barcode, 
    DollarSign, History, Filter, Eye, Package, UserPlus, Zap, Landmark, Smartphone,
    PackagePlus, Loader2, Globe, Tag, ClipboardList, CheckSquare, Square, Layers,
    Scroll, TabletSmartphone
} from 'lucide-react';
import { InvoiceItem, Product, Client, PriceList, Remito } from '../types';

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

    const [cart, setCart] = useState<InvoiceItem[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client>(DEFAULT_CLIENT);
    const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'MERCADO_PAGO' | 'TRANSFERENCIA' | 'CTACTE' | 'CHEQUE' | 'ECHEQ' | 'MIXTO'>('EFECTIVO');
    
    // Desglose ampliado para pagos mixtos
    const [mixedAmounts, setMixedAmounts] = useState({ 
        CASH: 0, MP: 0, TRANSF: 0, CTACTE: 0, CHEQUE: 0, ECHEQ: 0 
    });
    
    const [discountPerc, setDiscountPerc] = useState<number>(0);
    const [productSearch, setProductSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [showProductResults, setShowProductResults] = useState(false);
    const [showClientResults, setShowClientResults] = useState(false);

    const [priceLists] = useState<PriceList[]>([
        { id: '1', name: 'Lista Base', type: 'BASE', active: true },
        { id: '2', name: 'Gremio', type: 'CUSTOM', fixedMargin: 25, active: true },
        { id: '3', name: 'Mayorista', type: 'CUSTOM', fixedMargin: 15, active: true },
    ]);
    const [selectedPriceList, setSelectedPriceList] = useState<PriceList>(priceLists[0]);

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutStatus, setCheckoutStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

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
            (p.internalCode || '').toLowerCase().includes(term)
        ).slice(0, 5);
    }, [productSearch, products]);

    const filteredClients = useMemo(() => {
        const term = clientSearch.trim().toLowerCase();
        if (!term) return [];
        return clients.filter(c => 
            (c.name || '').toLowerCase().includes(term) || (c.cuit || '').includes(term)
        ).slice(0, 5);
    }, [clientSearch, clients]);

    const calculatePriceWithList = (product: Product, list: PriceList) => {
        if (list.type === 'BASE') return product.priceFinal;
        const margin = (list.fixedMargin || 0) / 100;
        const netPrice = (product.costAfterDiscounts || product.listCost) * (1 + margin);
        const finalPrice = netPrice * (1 + (product.vatRate || 21) / 100);
        return Math.round(finalPrice * 100) / 100;
    };

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

    const totals = useMemo(() => {
        const grossTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
        const discountAmount = grossTotal * (discountPerc / 100);
        const finalTotal = grossTotal - discountAmount;
        return { total: finalTotal, discountAmount, grossTotal };
    }, [cart, discountPerc]);

    const mixedTotalInput = useMemo(() => {
        return Object.values(mixedAmounts).reduce((a, b) => a + b, 0);
    }, [mixedAmounts]);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        if (paymentMethod === 'MIXTO' && Math.abs(mixedTotalInput - totals.total) > 1) {
            alert(`Error: La suma ($${mixedTotalInput.toLocaleString()}) no coincide con el total ($${totals.total.toLocaleString()}).`);
            return;
        }
        setCheckoutStatus('PROCESSING');
        setIsCheckoutOpen(true);
        setTimeout(() => {
            const newSale = {
                id: `FC-${Date.now().toString().slice(-8)}`,
                date: new Date().toLocaleString(),
                client: selectedClient.name,
                total: totals.total,
                payment: paymentMethod,
                cae: Math.random().toString().slice(2, 16)
            };
            const updatedHistory = [newSale, ...salesHistory];
            setSalesHistory(updatedHistory);
            localStorage.setItem('ferrecloud_sales_history', JSON.stringify(updatedHistory));
            setCheckoutStatus('SUCCESS');
        }, 1200);
    };

    const resetPOS = () => {
        setCart([]);
        setSelectedClient(DEFAULT_CLIENT);
        setIsCheckoutOpen(false);
        setCheckoutStatus('IDLE');
        setPaymentMethod('EFECTIVO');
        setMixedAmounts({ CASH: 0, MP: 0, TRANSF: 0, CTACTE: 0, CHEQUE: 0, ECHEQ: 0 });
        setDiscountPerc(0);
    };

    return (
        <div className="flex h-full bg-slate-100 overflow-hidden flex-col">
            {/* Header Tabs Compacto */}
            <div className="bg-white border-b border-gray-200 px-6 h-12 flex justify-between items-center shrink-0">
                <div className="flex gap-6 h-full">
                    <button onClick={() => setActiveTab('SALES')} className={`h-full px-1 font-bold text-[11px] uppercase tracking-wider border-b-2 transition-all ${activeTab === 'SALES' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-400'}`}>
                        Facturación
                    </button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`h-full px-1 font-bold text-[11px] uppercase tracking-wider border-b-2 transition-all ${activeTab === 'HISTORY' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-400'}`}>
                        Ventas Recientes
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Tarifa:</span>
                    <select 
                        value={selectedPriceList.id}
                        onChange={(e) => setSelectedPriceList(priceLists.find(l => l.id === e.target.value) || priceLists[0])}
                        className="bg-slate-50 border border-gray-200 rounded px-2 py-1 text-[10px] font-black uppercase text-slate-600 outline-none"
                    >
                        {priceLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            {activeTab === 'SALES' && (
                <div className="flex flex-1 overflow-hidden p-3 gap-3">
                    {/* Main Section */}
                    <div className="flex-[3] flex flex-col gap-3 overflow-hidden">
                        {/* Buscadores compactos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0">
                            <div className="relative" ref={searchRef}>
                                <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm focus-within:ring-1 focus-within:ring-slate-900 transition-all">
                                    <Barcode className="text-gray-300 mr-2" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar producto..." 
                                        className="flex-1 bg-transparent outline-none text-xs font-bold text-gray-700" 
                                        value={productSearch}
                                        onFocus={() => setShowProductResults(true)}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                    />
                                </div>
                                {showProductResults && productSearch.trim().length > 0 && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] overflow-hidden max-h-60 overflow-y-auto">
                                        {localResults.map(p => (
                                            <div key={p.id} onClick={() => addToCart(p)} className="p-2.5 hover:bg-slate-50 border-b last:border-0 flex justify-between items-center cursor-pointer">
                                                <div>
                                                    <p className="font-bold text-slate-800 uppercase text-[11px]">{p.name}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">{p.internalCode}</p>
                                                </div>
                                                <p className="font-black text-slate-900 text-xs">${calculatePriceWithList(p, selectedPriceList).toLocaleString('es-AR')}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={clientRef}>
                                <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm focus-within:ring-1 focus-within:ring-slate-900 transition-all">
                                    <User className="text-gray-300 mr-2" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Asignar Cliente..." 
                                        className="flex-1 bg-transparent outline-none text-xs font-bold text-gray-700" 
                                        value={selectedClient.id === 'cf-default' && !showClientResults ? 'CONSUMIDOR FINAL' : clientSearch}
                                        onFocus={() => { setShowClientResults(true); }}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                    />
                                </div>
                                {showClientResults && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] overflow-hidden max-h-60">
                                        <button 
                                            onClick={() => { setSelectedClient(DEFAULT_CLIENT); setShowClientResults(false); }}
                                            className="w-full text-left p-2.5 hover:bg-slate-50 border-b flex justify-between items-center">
                                            <p className="font-bold text-blue-600 uppercase text-[11px]">Consumidor Final</p>
                                            <CheckCircle size={12} className="text-blue-500"/>
                                        </button>
                                        {filteredClients.map(c => (
                                            <button key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(''); setShowClientResults(false); }} className="w-full text-left p-2.5 hover:bg-slate-50 border-b last:border-0 flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-slate-800 text-[11px] uppercase">{c.name}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold">{c.cuit}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabla de Artículos Seria */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[9px] font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-2.5">Descripción del Artículo</th>
                                            <th className="px-4 py-2.5 text-center">Cantidad</th>
                                            <th className="px-4 py-2.5 text-right">P. Unitario</th>
                                            <th className="px-4 py-2.5 text-right">Importe</th>
                                            <th className="px-4 py-2.5 text-center w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cart.map(item => (
                                            <tr key={item.product.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-2">
                                                    <p className="font-bold text-slate-800 text-[11px] uppercase leading-tight">{item.product.name}</p>
                                                    <p className="text-[9px] text-gray-400 font-mono font-bold tracking-tighter">SKU: {item.product.internalCode}</p>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1), subtotal: Math.max(1, i.quantity - 1) * i.appliedPrice} : i))} className="text-gray-400 hover:text-red-500"><Minus size={12}/></button>
                                                        <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                                                        <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i))} className="text-gray-400 hover:text-green-500"><Plus size={12}/></button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-right text-[11px] font-bold text-gray-500">${item.appliedPrice.toLocaleString('es-AR')}</td>
                                                <td className="px-4 py-2 text-right font-black text-slate-800 text-xs">${item.subtotal.toLocaleString('es-AR')}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cart.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center">
                                                    <Package size={40} strokeWidth={1} className="mx-auto text-gray-200 mb-2 opacity-30"/>
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Sin productos cargados</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Panel Compacto */}
                    <div className="w-[320px] flex flex-col gap-3 shrink-0 overflow-hidden h-full">
                        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2">
                                <CreditCard size={12} className="text-slate-800"/> Medios de Pago
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {[
                                    { id: 'EFECTIVO', icon: Banknote, label: 'Efectivo' },
                                    { id: 'MERCADO_PAGO', icon: Smartphone, label: 'M. Pago' },
                                    { id: 'TRANSFERENCIA', icon: Landmark, label: 'Transf.' },
                                    { id: 'CTACTE', icon: History, label: 'Cta. Cte.' },
                                    { id: 'CHEQUE', icon: Scroll, label: 'Cheque' },
                                    { id: 'ECHEQ', icon: TabletSmartphone, label: 'E-Cheq' },
                                    { id: 'MIXTO', icon: Layers, label: 'MIXTO' }
                                ].map(method => (
                                    <button 
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id as any)}
                                        className={`py-2 px-1 rounded-lg border flex items-center gap-2 transition-all ${paymentMethod === method.id ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-sm' : 'border-gray-50 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <method.icon size={14}/>
                                        <span className="text-[9px] font-bold uppercase tracking-tight">{method.label}</span>
                                    </button>
                                ))}
                            </div>

                            {paymentMethod === 'MIXTO' && (
                                <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg mb-4 animate-fade-in border border-slate-100">
                                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2 border-b border-indigo-100 pb-1">Distribución de Pago</p>
                                    {[
                                        { key: 'CASH', label: 'Efectivo', icon: Banknote },
                                        { key: 'MP', label: 'M. Pago', icon: Smartphone },
                                        { key: 'TRANSF', label: 'Transf.', icon: Landmark },
                                        { key: 'CTACTE', label: 'Cta Cte', icon: History },
                                        { key: 'CHEQUE', label: 'Cheque', icon: Scroll },
                                        { key: 'ECHEQ', label: 'E-Cheq', icon: TabletSmartphone }
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center gap-2">
                                            <div className="p-1.5 bg-white rounded border border-gray-100 text-gray-400 shrink-0"><item.icon size={11}/></div>
                                            <input 
                                                type="number" 
                                                placeholder={item.label}
                                                className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-500"
                                                value={(mixedAmounts as any)[item.key] || ''}
                                                onChange={(e) => setMixedAmounts({...mixedAmounts, [item.key]: parseFloat(e.target.value) || 0})}
                                            />
                                        </div>
                                    ))}
                                    <div className={`mt-2 p-1.5 rounded text-center text-[9px] font-bold uppercase ${Math.abs(mixedTotalInput - totals.total) < 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                        Ingresado: ${mixedTotalInput.toLocaleString()} / Total: ${totals.total.toLocaleString()}
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pt-4 border-t border-dashed border-gray-200 space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Descuento (%)</span>
                                    <input 
                                        type="number" 
                                        className="w-12 text-right text-xs font-black p-1 bg-slate-50 border rounded focus:ring-1 focus:ring-slate-900 outline-none"
                                        value={discountPerc || ''}
                                        onChange={(e) => setDiscountPerc(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="flex justify-between items-baseline px-1 py-1">
                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Importe Total</span>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">${totals.total.toLocaleString('es-AR')}</p>
                                </div>
                                
                                <button 
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-lg font-black text-[11px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-[0.15em] disabled:opacity-20 mt-2"
                                >
                                    <Zap size={14}/> PROCESAR COBRO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'HISTORY' && (
                <div className="flex-1 p-4 overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b">
                                <tr>
                                    <th className="px-6 py-3">Nro Operación</th>
                                    <th className="px-6 py-3">Cliente / Entidad</th>
                                    <th className="px-6 py-3">M. Pago</th>
                                    <th className="px-6 py-3 text-right">Importe</th>
                                    <th className="px-6 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[11px]">
                                {salesHistory.map((sale: any) => (
                                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 font-bold text-slate-700 font-mono tracking-tighter">{sale.id}</td>
                                        <td className="px-6 py-3 font-bold text-slate-800 uppercase">{sale.client}</td>
                                        <td className="px-6 py-3 font-bold text-gray-400 uppercase">{sale.payment}</td>
                                        <td className="px-6 py-3 text-right font-black text-xs">${sale.total.toLocaleString('es-AR')}</td>
                                        <td className="px-6 py-3 text-center">
                                            <button className="p-1.5 text-gray-400 hover:text-slate-900 transition-colors"><Eye size={14}/></button>
                                        </td>
                                    </tr>
                                ))}
                                {salesHistory.length === 0 && (
                                    <tr><td colSpan={5} className="py-10 text-center text-gray-400 italic font-medium">No se registran ventas recientes.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de éxito de venta compacto */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col p-6 text-center">
                        {checkoutStatus === 'PROCESSING' ? (
                            <div className="space-y-4 py-4">
                                <div className="w-12 h-12 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Validando...</h3>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-fade-in">
                                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-100">
                                    <CheckCircle size={32}/>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Venta Registrada</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="bg-slate-50 border border-gray-200 py-2.5 rounded-lg font-bold uppercase text-[9px] hover:bg-slate-100"><Printer size={12} className="mx-auto mb-1"/> Ticket</button>
                                    <button className="bg-slate-50 border border-gray-200 py-2.5 rounded-lg font-bold uppercase text-[9px] hover:bg-slate-100"><FileText size={12} className="mx-auto mb-1"/> PDF A4</button>
                                </div>
                                <button onClick={resetPOS} className="w-full bg-slate-900 text-white py-3 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-slate-800">FINALIZAR</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
