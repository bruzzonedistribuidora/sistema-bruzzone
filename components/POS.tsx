
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ShoppingCart, User, CreditCard, Printer, Trash2, Search, CheckCircle, 
    Plus, Minus, Banknote, FileText, X, AlertCircle, RefreshCw, Barcode, 
    DollarSign, History, Filter, Eye, Package, Zap, Landmark, Smartphone,
    PackagePlus, Loader2, Globe, Tag, ClipboardList, CheckSquare, Square, Layers,
    Scroll, TabletSmartphone, Pencil, PlusCircle, ShieldCheck, FileSpreadsheet, Receipt,
    ArrowRightLeft, Send, Shield, Hash, QrCode, Save, Check
} from 'lucide-react';
import { InvoiceItem, Product, Client, PriceList, Budget, Remito, CompanyConfig } from '../types';

const DEFAULT_CLIENT: Client = {
    id: 'cf-default',
    name: 'Consumidor Final',
    cuit: '00-00000000-0',
    phone: '',
    address: '',
    balance: 0,
    limit: 0,
    points: 0
};

interface POSProps {
    initialCart?: InvoiceItem[];
    onCartUsed?: () => void;
}

const POS: React.FC<POSProps> = ({ initialCart, onCartUsed }) => {
    const [activeTab, setActiveTab] = useState<'SALES' | 'HISTORY'>('SALES');
    const searchRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<HTMLDivElement>(null);

    const [products, setProducts] = useState<Product[]>(() => {
        const saved = localStorage.getItem('ferrecloud_products');
        return saved ? JSON.parse(saved) : [];
    });

    const [clients, setClients] = useState<Client[]>(() => {
        const saved = localStorage.getItem('ferrecloud_clients');
        return saved ? JSON.parse(saved) : [];
    });

    const [salesHistory, setSalesHistory] = useState<any[]>(() => {
        return JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]');
    });

    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { loyalty: { enabled: true, pointsPerPeso: 0.01 } };
    }, []);

    const [cart, setCart] = useState<InvoiceItem[]>(initialCart || []);
    const [selectedClient, setSelectedClient] = useState<Client>(DEFAULT_CLIENT);
    const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'MERCADO_PAGO' | 'TRANSFERENCIA' | 'CTACTE' | 'CHEQUE' | 'MIXTO' | 'RETENCION'>('EFECTIVO');
    
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualItemForm, setManualItemForm] = useState({ name: '', price: 0 });
    const [discountPerc, setDiscountPerc] = useState<number>(0);
    const [productSearch, setProductSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [showProductResults, setShowProductResults] = useState(false);
    const [showClientResults, setShowClientResults] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [priceLists] = useState<PriceList[]>([
        { id: '1', name: 'Lista Base', type: 'BASE', active: true },
        { id: '2', name: 'Gremio', type: 'CUSTOM', fixedMargin: 25, active: true },
        { id: '3', name: 'Mayorista', type: 'CUSTOM', fixedMargin: 15, active: true },
    ]);
    const [selectedPriceList, setSelectedPriceList] = useState<PriceList>(priceLists[0]);

    useEffect(() => {
        if (initialCart && initialCart.length > 0) {
            setCart(initialCart);
            onCartUsed?.();
        }
    }, [initialCart]);

    const totals = useMemo(() => {
        const grossTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
        const discountAmount = grossTotal * (discountPerc / 100);
        return { total: grossTotal - discountAmount, discountAmount, grossTotal };
    }, [cart, discountPerc]);

    const addToCart = (product: Product) => {
        const price = product.priceFinal;
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id ? 
                    { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * price } : item
                );
            }
            return [...prev, { product, quantity: 1, appliedPrice: price, subtotal: price }];
        });
        setProductSearch('');
        setShowProductResults(false);
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setIsProcessing(true);

        setTimeout(() => {
            const saleId = `VEN-${Date.now().toString().slice(-6)}`;
            const newSale = {
                id: saleId,
                date: new Date().toLocaleString(),
                client: selectedClient.name,
                items: cart,
                total: totals.total,
                paymentMethod
            };

            // 1. Guardar en historial
            const updatedHistory = [newSale, ...salesHistory];
            setSalesHistory(updatedHistory);
            localStorage.setItem('ferrecloud_sales_history', JSON.stringify(updatedHistory));

            // 2. Descontar Stock
            const updatedProducts = products.map(p => {
                const cartItem = cart.find(item => item.product.id === p.id);
                if (cartItem) {
                    return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
                }
                return p;
            });
            setProducts(updatedProducts);
            localStorage.setItem('ferrecloud_products', JSON.stringify(updatedProducts));

            // 3. Sumar Puntos si aplica
            if (companyConfig.loyalty?.enabled && selectedClient.id !== 'cf-default') {
                const pointsEarned = Math.floor(totals.total * (companyConfig.loyalty.pointsPerPeso || 0.01));
                const updatedClients = clients.map(c => 
                    c.id === selectedClient.id ? { ...c, points: (c.points || 0) + pointsEarned } : c
                );
                setClients(updatedClients);
                localStorage.setItem('ferrecloud_clients', JSON.stringify(updatedClients));
            }

            setIsProcessing(false);
            setCart([]);
            setSelectedClient(DEFAULT_CLIENT);
            setDiscountPerc(0);
            alert(`Venta ${saleId} procesada con éxito.`);
        }, 1000);
    };

    const localResults = useMemo(() => {
        const term = productSearch.trim().toLowerCase();
        if (!term) return [];
        return products.filter(p => 
            (p.name || '').toLowerCase().includes(term) || 
            p.internalCodes.some(c => c.toLowerCase().includes(term))
        ).slice(0, 8);
    }, [productSearch, products]);

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden flex-col">
            <div className="bg-white border-b border-gray-200 px-6 h-12 flex justify-between items-center shrink-0">
                <div className="flex gap-6 h-full">
                    <button onClick={() => setActiveTab('SALES')} className={`h-full px-2 font-black text-xs uppercase tracking-wider border-b-2 transition-all ${activeTab === 'SALES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>Caja Registradora</button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`h-full px-2 font-black text-xs uppercase tracking-wider border-b-2 transition-all ${activeTab === 'HISTORY' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>Ventas Recientes</button>
                </div>
            </div>

            {activeTab === 'SALES' ? (
                <div className="flex flex-1 overflow-hidden p-4 gap-4">
                    <div className="flex-[3] flex flex-col gap-4 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
                            <div className="md:col-span-8 relative">
                                <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                                    <Search className="text-gray-300 mr-3" size={20} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por descripción o código SKU..." 
                                        className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700 uppercase" 
                                        value={productSearch}
                                        onFocus={() => setShowProductResults(true)}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                    />
                                </div>
                                {showProductResults && productSearch.length > 0 && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden">
                                        {localResults.map(p => (
                                            <div key={p.id} onClick={() => addToCart(p)} className="p-4 hover:bg-indigo-50 border-b last:border-0 flex justify-between items-center cursor-pointer">
                                                <div>
                                                    <p className="font-black text-slate-800 uppercase text-xs mb-1">{p.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{p.internalCodes[0]} • {p.brand}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-indigo-600 text-sm">${p.priceFinal.toLocaleString('es-AR')}</p>
                                                    <p className="text-[9px] text-slate-300 font-bold uppercase">Stock: {p.stock}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-4 relative">
                                <select 
                                    className="w-full h-full p-3 bg-white border border-gray-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={selectedClient.id}
                                    onChange={e => {
                                        const c = clients.find(cl => cl.id === e.target.value) || DEFAULT_CLIENT;
                                        setSelectedClient(c);
                                    }}
                                >
                                    <option value="cf-default">Consumidor Final</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Producto</th>
                                            <th className="px-6 py-4 text-center">Cantidad</th>
                                            <th className="px-6 py-4 text-right">Unitario</th>
                                            <th className="px-6 py-4 text-right">Subtotal</th>
                                            <th className="px-6 py-4 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cart.map(item => (
                                            <tr key={item.product.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-black text-slate-800 text-xs uppercase leading-none mb-1">{item.product.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{item.product.internalCodes[0]}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1), subtotal: Math.max(1, i.quantity - 1) * i.appliedPrice} : i))} className="p-1 text-slate-300 hover:text-indigo-600"><Minus size={16}/></button>
                                                        <span className="font-black text-sm w-8 text-center">{item.quantity}</span>
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i))} className="p-1 text-slate-300 hover:text-indigo-600"><Plus size={16}/></button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-400">${item.appliedPrice.toLocaleString('es-AR')}</td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900">${item.subtotal.toLocaleString('es-AR')}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cart.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-32 text-center opacity-20">
                                                    <ShoppingCart size={80} className="mx-auto mb-4" />
                                                    <p className="font-black uppercase tracking-widest text-sm">Esperando artículos...</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm p-8 space-y-6 flex-1 flex flex-col">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 border-b pb-4 mb-2">Resumen de Venta</h3>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Subtotal Bruto</span>
                                    <span className="text-lg font-black text-slate-700">${totals.grossTotal.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Bonificación (%)</span>
                                    <input type="number" className="w-20 p-2 bg-slate-50 border rounded-xl text-right font-black text-indigo-600" value={discountPerc} onChange={e => setDiscountPerc(parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="pt-4 border-t border-dashed">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Final a Cobrar</p>
                                    <p className="text-5xl font-black text-slate-900 tracking-tighter">${totals.total.toLocaleString('es-AR')}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medio de Pago</label>
                                <select className="w-full p-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase outline-none" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                                    <option value="EFECTIVO">Efectivo Cash</option>
                                    <option value="MERCADO_PAGO">Mercado Pago / QR</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="CTACTE">Cuenta Corriente</option>
                                </select>
                            </div>

                            <button 
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || isProcessing}
                                className="w-full mt-auto bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                                {isProcessing ? <RefreshCw className="animate-spin" /> : <><CheckCircle size={24}/> FINALIZAR VENTA</>}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-6 overflow-y-auto animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {salesHistory.map(sale => (
                            <div key={sale.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase">{sale.id}</span>
                                    <p className="text-[10px] font-bold text-gray-400">{sale.date}</p>
                                </div>
                                <h4 className="font-black text-slate-800 uppercase text-sm mb-1">{sale.client}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">{sale.paymentMethod}</p>
                                <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-300 uppercase">Importe</p>
                                        <p className="text-xl font-black text-slate-900">${sale.total.toLocaleString('es-AR')}</p>
                                    </div>
                                    <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Printer size={18}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
