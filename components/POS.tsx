
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ShoppingCart, User, CreditCard, Printer, Trash2, Search, CheckCircle, 
    Plus, Minus, Banknote, FileText, X, AlertCircle, RefreshCw, Barcode, 
    DollarSign, History, Filter, Eye, Package, Zap, Landmark, Smartphone,
    PackagePlus, Loader2, Globe, Tag, ClipboardList, CheckSquare, Square, Layers,
    Scroll, TabletSmartphone
} from 'lucide-react';
import { InvoiceItem, Product, Client, PriceList } from '../types';

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
        ).slice(0, 8);
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
        // Fix: Explicitly typed reduce arguments as numbers to resolve 'unknown' type error on line 123
        return Object.values(mixedAmounts).reduce((a: number, b: number) => a + b, 0);
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
        <div className="flex h-full bg-slate-50 overflow-hidden flex-col">
            {/* Nav Superior POS */}
            <div className="bg-white border-b border-gray-200 px-6 h-10 flex justify-between items-center shrink-0">
                <div className="flex gap-6 h-full">
                    <button onClick={() => setActiveTab('SALES')} className={`h-full px-1 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all ${activeTab === 'SALES' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-400'}`}>
                        Facturación
                    </button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`h-full px-1 font-black text-[10px] uppercase tracking-wider border-b-2 transition-all ${activeTab === 'HISTORY' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-400'}`}>
                        Ventas del Día
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Lista Activa:</span>
                    <select 
                        value={selectedPriceList.id}
                        onChange={(e) => setSelectedPriceList(priceLists.find(l => l.id === e.target.value) || priceLists[0])}
                        className="bg-slate-50 border border-gray-200 rounded px-2 py-0.5 text-[9px] font-black uppercase text-slate-700 outline-none"
                    >
                        {priceLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            {activeTab === 'SALES' && (
                <div className="flex flex-1 overflow-hidden p-3 gap-3">
                    {/* Área de carga */}
                    <div className="flex-[3] flex flex-col gap-3 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0">
                            <div className="relative" ref={searchRef}>
                                <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm focus-within:ring-1 focus-within:ring-slate-900 transition-all">
                                    <Barcode className="text-gray-300 mr-2" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por código o nombre del artículo..." 
                                        className="flex-1 bg-transparent outline-none text-xs font-bold text-gray-700" 
                                        value={productSearch}
                                        onFocus={() => setShowProductResults(true)}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                    />
                                </div>
                                {showProductResults && productSearch.trim().length > 0 && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] overflow-hidden max-h-64 overflow-y-auto">
                                        {localResults.map(p => (
                                            <div key={p.id} onClick={() => addToCart(p)} className="p-2 hover:bg-slate-50 border-b last:border-0 flex justify-between items-center cursor-pointer transition-colors">
                                                <div>
                                                    <p className="font-bold text-slate-800 uppercase text-[10px] leading-none mb-1">{p.name}</p>
                                                    <p className="text-[8px] text-gray-400 font-black uppercase">{p.internalCode} • {p.brand}</p>
                                                </div>
                                                <p className="font-black text-slate-900 text-xs bg-slate-50 px-2 py-1 rounded border">${calculatePriceWithList(p, selectedPriceList).toLocaleString('es-AR')}</p>
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
                                        placeholder="Asociar Cliente..." 
                                        className="flex-1 bg-transparent outline-none text-xs font-bold text-gray-700 uppercase" 
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
                                            <p className="font-black text-indigo-600 uppercase text-[10px]">Consumidor Final</p>
                                            <CheckCircle size={12} className="text-indigo-500"/>
                                        </button>
                                        {filteredClients.map(c => (
                                            <button key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(''); setShowClientResults(false); }} className="w-full text-left p-2.5 hover:bg-slate-50 border-b last:border-0 flex justify-between items-center transition-colors">
                                                <div>
                                                    <p className="font-bold text-slate-800 text-[10px] uppercase">{c.name}</p>
                                                    <p className="text-[8px] text-gray-400 font-black">{c.cuit}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Listado del Carrito */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[9px] font-black uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-2.5">Detalle del Producto</th>
                                            <th className="px-4 py-2.5 text-center">Cant.</th>
                                            <th className="px-4 py-2.5 text-right">P. Unitario</th>
                                            <th className="px-4 py-2.5 text-right">Subtotal</th>
                                            <th className="px-4 py-2.5 text-center w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cart.map(item => (
                                            <tr key={item.product.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-2">
                                                    <p className="font-bold text-slate-800 text-[10px] uppercase leading-none mb-1">{item.product.name}</p>
                                                    <p className="text-[8px] text-gray-400 font-black tracking-tight uppercase">{item.product.internalCode}</p>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1), subtotal: Math.max(1, i.quantity - 1) * i.appliedPrice} : i))} className="text-gray-300 hover:text-red-500 transition-colors"><Minus size={10}/></button>
                                                        <span className="font-black text-[11px] w-4 text-center">{item.quantity}</span>
                                                        <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i))} className="text-gray-300 hover:text-green-500 transition-colors"><Plus size={10}/></button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-right text-[10px] font-bold text-gray-500">${item.appliedPrice.toLocaleString('es-AR')}</td>
                                                <td className="px-4 py-2 text-right font-black text-slate-800 text-[11px]">${item.subtotal.toLocaleString('es-AR')}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))} className="text-gray-300 hover:text-red-500 transition-all"><Trash2 size={14}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cart.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-24 text-center">
                                                    <Package size={32} className="mx-auto text-slate-200 mb-3 opacity-30"/>
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Seleccione productos para facturar</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Lateral - Fijo y Serio */}
                    <div className="w-80 flex flex-col gap-3 shrink-0 overflow-hidden h-full">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-slate-50 pb-2">
                                <CreditCard size={12} className="text-slate-900"/> Forma de Cobro
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-1.5 mb-4 shrink-0">
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
                                        className={`py-2 px-2 rounded-lg border-2 flex items-center gap-2 transition-all ${paymentMethod === method.id ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <method.icon size={13}/>
                                        <span className="text-[9px] font-black uppercase tracking-tighter">{method.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Desglose Mixto - Compacto */}
                            {paymentMethod === 'MIXTO' && (
                                <div className="space-y-1 bg-slate-50 p-2 rounded-lg mb-4 animate-fade-in border border-slate-100 overflow-y-auto max-h-[180px] custom-scrollbar">
                                    <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-1 pb-1 border-b border-indigo-100">Distribución de Importes</p>
                                    {[
                                        { key: 'CASH', label: 'Efectivo', icon: Banknote },
                                        { key: 'MP', label: 'M. Pago', icon: Smartphone },
                                        { key: 'TRANSF', label: 'Transf.', icon: Landmark },
                                        { key: 'CTACTE', label: 'Cta Cte', icon: History },
                                        { key: 'CHEQUE', label: 'Cheque', icon: Scroll },
                                        { key: 'ECHEQ', label: 'E-Cheq', icon: TabletSmartphone }
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center gap-1.5">
                                            <div className="p-1 bg-white rounded border border-gray-100 text-gray-300 shrink-0"><item.icon size={10}/></div>
                                            <input 
                                                type="number" 
                                                placeholder={item.label}
                                                className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-[10px] font-bold text-slate-700 outline-none focus:border-indigo-500"
                                                value={(mixedAmounts as any)[item.key] || ''}
                                                onChange={(e) => setMixedAmounts({...mixedAmounts, [item.key]: parseFloat(e.target.value) || 0})}
                                            />
                                        </div>
                                    ))}
                                    <div className={`mt-2 p-1 rounded text-center text-[9px] font-black uppercase ${Math.abs(mixedTotalInput - totals.total) < 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                        ${mixedTotalInput.toLocaleString()} de ${totals.total.toLocaleString()}
                                    </div>
                                </div>
                            )}

                            {/* Totales y Botón de Cobro (Siempre visible al final) */}
                            <div className="mt-auto pt-4 border-t border-dashed border-gray-200 space-y-2 shrink-0">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Descuento (%)</span>
                                    <input 
                                        type="number" 
                                        className="w-10 text-right text-[10px] font-black p-0.5 bg-slate-50 border rounded focus:ring-1 focus:ring-slate-900 outline-none"
                                        value={discountPerc || ''}
                                        onChange={(e) => setDiscountPerc(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="flex justify-between items-baseline px-1 pt-1">
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Total a Cobrar</span>
                                    <p className="text-2xl font-black text-slate-950 tracking-tighter leading-none">${totals.total.toLocaleString('es-AR')}</p>
                                </div>
                                
                                <button 
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-black text-[10px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-[0.15em] disabled:opacity-20"
                                >
                                    <Zap size={14} className="fill-white"/> Procesar Cobranza
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'HISTORY' && (
                <div className="flex-1 p-3 overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-[9px] font-black text-white uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-3">Referencia</th>
                                    <th className="px-6 py-3">Cliente</th>
                                    <th className="px-6 py-3">M. Pago</th>
                                    <th className="px-6 py-3 text-right">Monto</th>
                                    <th className="px-6 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[10px]">
                                {salesHistory.map((sale: any) => (
                                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-2.5 font-bold text-slate-700 font-mono tracking-tighter">{sale.id}</td>
                                        <td className="px-6 py-2.5 font-black text-slate-800 uppercase">{sale.client}</td>
                                        <td className="px-6 py-2.5 font-bold text-gray-400 uppercase tracking-tighter">{sale.payment}</td>
                                        <td className="px-6 py-2.5 text-right font-black text-slate-900">${sale.total.toLocaleString('es-AR')}</td>
                                        <td className="px-6 py-2.5 text-center">
                                            <button className="p-1 text-slate-400 hover:text-slate-900 transition-colors"><Eye size={14}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de éxito de venta */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col p-6 text-center border border-slate-300">
                        {checkoutStatus === 'PROCESSING' ? (
                            <div className="space-y-4 py-4">
                                <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Autorizando ARCA...</h3>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-fade-in">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-100 shadow-inner">
                                    <CheckCircle size={28}/>
                                </div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Comprobante Emitido</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="bg-slate-50 border border-gray-200 py-2 rounded-lg font-black uppercase text-[8px] hover:bg-slate-100 tracking-widest"><Printer size={12} className="mx-auto mb-1"/> Ticket</button>
                                    <button className="bg-slate-50 border border-gray-200 py-2 rounded-lg font-black uppercase text-[8px] hover:bg-slate-100 tracking-widest"><FileText size={12} className="mx-auto mb-1"/> PDF A4</button>
                                </div>
                                <button onClick={resetPOS} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-800 active:scale-95 transition-all">Listar Próxima</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
