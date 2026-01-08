
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShoppingCart, Printer, Trash2, Search, CheckCircle, 
    Plus, Minus, X, RefreshCw, Landmark,
    PlusCircle, Receipt, Truck, FileSpreadsheet,
    CreditCard as CardIcon, Info, ChevronDown, PackagePlus, Save, DollarSign,
    ShieldCheck, FileText, ArrowRight, ClipboardList, Sparkles, Zap,
    ArrowLeftRight, Banknote, Smartphone as ECheqIcon,
    // Added History to fix JSX component error
    History
} from 'lucide-react';
import { InvoiceItem, Product, Client, CompanyConfig, PaymentSystem } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';

const DEFAULT_CLIENT: Client = {
    id: 'cf-default', 
    name: 'Consumidor Final', 
    cuit: '00-00000000-0', 
    phone: '', 
    address: '', 
    balance: 0, 
    limit: 0, 
    points: 0,
    isCurrentAccountActive: true,
    isLimitEnabled: false,
    useAdvance: false,
    authorizedContacts: []
};

interface POSProps {
    initialCart?: InvoiceItem[];
    onCartUsed?: () => void;
    onTransformToRemito?: (items: InvoiceItem[]) => void;
    onTransformToBudget?: (items: InvoiceItem[]) => void;
}

const POS: React.FC<POSProps> = ({ initialCart, onCartUsed, onTransformToRemito, onTransformToBudget }) => {
    const [activeTab, setActiveTab] = useState<'SALES' | 'HISTORY'>('SALES');
    const [productSearch, setProductSearch] = useState('');
    const [showProductResults, setShowProductResults] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFiscalInvoicing, setIsFiscalInvoicing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [clients] = useState<Client[]>(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));
    const [salesHistory, setSalesHistory] = useState<any[]>(() => JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]'));

    const [cart, setCart] = useState<InvoiceItem[]>(initialCart || []);
    const [selectedClient, setSelectedClient] = useState<Client>(DEFAULT_CLIENT);
    const [paymentMethod, setPaymentMethod] = useState<string>('EFECTIVO');
    
    // Estados para Tarjeta Avanzada
    const [selectedSystemId, setSelectedSystemId] = useState<string>('');
    const [cardMode, setCardMode] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
    const [selectedCuotaId, setSelectedCuotaId] = useState<string>('');

    const loadProducts = async () => {
        const all = await productDB.getAll();
        setProducts(all);
    };

    useEffect(() => {
        loadProducts();
        window.addEventListener('ferrecloud_products_updated', loadProducts);
        return () => window.removeEventListener('ferrecloud_products_updated', loadProducts);
    }, []);

    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { paymentMethods: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'], paymentSystems: [] };
    }, []);

    const filteredProducts = useMemo(() => {
        const term = productSearch.toLowerCase().trim();
        if (!term) return [];
        return products.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.internalCodes.some(c => c.toLowerCase().includes(term)) ||
            (p.barcodes && p.barcodes.some(c => c.toLowerCase().includes(term)))
        ).slice(0, 50);
    }, [productSearch, products]);

    const totals = useMemo(() => {
        const gross = cart.reduce((acc, item) => acc + item.subtotal, 0);
        let interest = 0;
        
        if (paymentMethod === 'TARJETA' && selectedSystemId) {
            const sys = (companyConfig.paymentSystems || []).find(s => s.id === selectedSystemId);
            if (sys) {
                if (cardMode === 'DEBIT') {
                    interest = gross * (sys.debitSurcharge / 100);
                } else {
                    const plan = sys.creditInstallments.find(p => p.id === selectedCuotaId);
                    interest = gross * ((plan ? plan.surcharge : 0) / 100);
                }
            }
        }
        return { gross, interest, total: gross + interest };
    }, [cart, paymentMethod, selectedSystemId, cardMode, selectedCuotaId, companyConfig]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id ? 
                    { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.appliedPrice } : item
                );
            }
            return [...prev, { product, quantity: 1, appliedPrice: product.priceFinal, subtotal: product.priceFinal }];
        });
        setProductSearch('');
        setShowProductResults(false);
    };

    const handleCheckout = (isFiscal: boolean = false) => {
        if (cart.length === 0) return;
        isFiscal ? setIsFiscalInvoicing(true) : setIsProcessing(true);
        setTimeout(() => {
            const sale = { id: `VEN-${Date.now().toString().slice(-6)}`, isFiscal, date: new Date().toLocaleString(), client: selectedClient.name, total: totals.total, method: paymentMethod, items: [...cart] };
            const newHistory = [sale, ...salesHistory];
            setSalesHistory(newHistory);
            localStorage.setItem('ferrecloud_sales_history', JSON.stringify(newHistory));
            setLastSale(sale);
            setIsFiscalInvoicing(false); setIsProcessing(false); setShowSuccessModal(true); setCart([]);
        }, isFiscal ? 2000 : 800);
    };

    const currentSystem = companyConfig.paymentSystems?.find(s => s.id === selectedSystemId);

    return (
        <div className="flex h-full bg-slate-100 overflow-hidden flex-1 flex-col font-sans animate-fade-in">
            <div className="bg-white border-b border-slate-200 px-6 h-14 flex justify-between items-center shrink-0">
                <div className="flex gap-8 h-full">
                    {['SALES', 'HISTORY'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`h-full px-2 font-black text-[10px] uppercase tracking-[0.2em] border-b-4 transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
                            {tab === 'SALES' ? 'Venta de Mostrador' : 'Últimos Tickets'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Terminal: <span className="text-green-500">Online</span></span>
                </div>
            </div>

            {activeTab === 'SALES' ? (
                <div className="flex flex-1 overflow-hidden p-6 gap-6">
                    <div className="flex-[3] flex flex-col gap-6 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0">
                            <div className="md:col-span-8 relative">
                                <div className="flex items-center bg-white border border-slate-200 rounded-[1.5rem] px-6 py-4 shadow-sm focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                                    <Search className="text-slate-300 mr-4" size={24} />
                                    <input type="text" placeholder="Escanee código o busque artículo..." className="flex-1 bg-transparent outline-none font-black text-slate-800 uppercase text-lg tracking-tight" value={productSearch} onFocus={() => setShowProductResults(true)} onChange={(e) => setProductSearch(e.target.value)} />
                                    <Zap size={20} className="text-indigo-400 animate-pulse ml-2"/>
                                </div>
                                {showProductResults && productSearch.length > 2 && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-fade-in max-h-96 overflow-y-auto custom-scrollbar">
                                        {filteredProducts.map(p => (
                                            <div key={p.id} onClick={() => addToCart(p)} className="p-5 hover:bg-indigo-50 border-b last:border-0 flex justify-between items-center cursor-pointer transition-colors group">
                                                <div>
                                                    <p className="font-black text-slate-800 uppercase text-sm leading-none mb-1.5">{p.name}</p>
                                                    <div className="flex gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <span>SKU: {p.internalCodes[0]}</span>
                                                        <span className="text-indigo-500 font-black">Stock: {p.stock}</span>
                                                    </div>
                                                </div>
                                                <p className="font-black text-indigo-600 text-lg tracking-tighter">${p.priceFinal.toLocaleString('es-AR')}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-4">
                                <select className="w-full h-full p-4 bg-white border border-slate-200 rounded-[1.5rem] font-black text-xs uppercase shadow-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all" value={selectedClient.id} onChange={e => setSelectedClient(clients.find(cl => cl.id === e.target.value) || DEFAULT_CLIENT)}>
                                    <option value="cf-default">CONSUMIDOR FINAL</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[9px] font-black uppercase tracking-[0.2em]">
                                        <tr>
                                            <th className="px-8 py-5">Descripción</th>
                                            <th className="px-8 py-5 text-center">Cantidad</th>
                                            <th className="px-8 py-5 text-right">Subtotal</th>
                                            <th className="px-8 py-5 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {cart.map(item => (
                                            <tr key={item.product.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <p className="font-black text-slate-800 text-sm uppercase leading-none mb-1.5">{item.product.name}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{item.product.internalCodes[0]}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center justify-center gap-4 bg-slate-100 rounded-2xl p-1.5 w-fit mx-auto border border-slate-200">
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1), subtotal: Math.max(1, i.quantity - 1) * i.appliedPrice} : i))} className="p-1.5 text-slate-400 hover:text-indigo-600"><Minus size={18}/></button>
                                                        <span className="font-black text-lg w-8 text-center">{item.quantity}</span>
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i))} className="p-1.5 text-slate-400 hover:text-indigo-600"><Plus size={18}/></button>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right font-black text-slate-900 text-xl tracking-tighter">${item.subtotal.toLocaleString('es-AR')}</td>
                                                <td className="px-8 py-5 text-center">
                                                    <button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="p-3 text-slate-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cart.length === 0 && (
                                            <tr><td colSpan={4} className="py-24 text-center text-slate-300 uppercase font-black tracking-widest">Carrito vacío</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ACCIONES DE CONVERSIÓN */}
                        <div className="grid grid-cols-2 gap-4 shrink-0">
                            <button 
                                onClick={() => onTransformToRemito?.(cart)} 
                                disabled={cart.length === 0}
                                className="bg-white border-2 border-slate-200 p-5 rounded-[2rem] flex items-center justify-center gap-4 group hover:border-indigo-600 transition-all disabled:opacity-30">
                                <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Truck size={24}/></div>
                                <div className="text-left">
                                    <p className="font-black text-xs uppercase tracking-tight text-slate-800">Convertir a Remito</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Para entrega o cuenta corriente</p>
                                </div>
                            </button>
                            <button 
                                onClick={() => onTransformToBudget?.(cart)} 
                                disabled={cart.length === 0}
                                className="bg-white border-2 border-slate-200 p-5 rounded-[2rem] flex items-center justify-center gap-4 group hover:border-teal-600 transition-all disabled:opacity-30">
                                <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-colors"><FileSpreadsheet size={24}/></div>
                                <div className="text-left">
                                    <p className="font-black text-xs uppercase tracking-tight text-slate-800">Generar Presupuesto</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Cotización válida por 15 días</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="w-[450px] flex flex-col gap-6">
                        <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl flex flex-col relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Receipt size={180}/></div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-8 border-b border-white/10 pb-4">Consola de Pago</h3>
                            
                            <div className="space-y-6">
                                <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal Gravado</span>
                                    <span className="text-2xl font-black">${totals.gross.toLocaleString('es-AR')}</span>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Medio de Pago</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'EFECTIVO', icon: Banknote },
                                            { id: 'TARJETA', icon: CardIcon },
                                            { id: 'CHEQUE', icon: FileText },
                                            { id: 'E-CHEQ', icon: ECheqIcon },
                                            { id: 'TRANSFERENCIA', icon: Landmark },
                                            { id: 'CTACTE', icon: History }
                                        ].map(m => (
                                            <button 
                                                key={m.id} 
                                                onClick={() => setPaymentMethod(m.id)} 
                                                className={`py-3 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest border-2 flex items-center gap-3 transition-all ${paymentMethod === m.id ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg' : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                                                <m.icon size={14}/> {m.id}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* CONFIGURACIÓN DE TARJETA DINÁMICA */}
                                {paymentMethod === 'TARJETA' && (
                                    <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-5 animate-fade-in">
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Plataforma / Sistema</label>
                                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                                {(companyConfig.paymentSystems || []).map(sys => (
                                                    <button key={sys.id} onClick={() => setSelectedSystemId(sys.id)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${selectedSystemId === sys.id ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'}`}>{sys.name}</button>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedSystemId && (
                                            <>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button onClick={() => setCardMode('DEBIT')} className={`py-2 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${cardMode === 'DEBIT' ? 'border-indigo-400 text-indigo-400' : 'border-white/5 text-slate-500'}`}>Débito</button>
                                                    <button onClick={() => setCardMode('CREDIT')} className={`py-2 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${cardMode === 'CREDIT' ? 'border-indigo-400 text-indigo-400' : 'border-white/5 text-slate-500'}`}>Crédito</button>
                                                </div>

                                                {cardMode === 'CREDIT' && (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {currentSystem?.creditInstallments.map(plan => (
                                                            <button 
                                                                key={plan.id} 
                                                                onClick={() => setSelectedCuotaId(plan.id)}
                                                                className={`p-2 rounded-lg border flex flex-col items-center transition-all ${selectedCuotaId === plan.id ? 'bg-indigo-600 border-indigo-400' : 'bg-white/5 border-white/10'}`}>
                                                                <span className="text-[11px] font-black">{plan.installments}x</span>
                                                                <span className="text-[7px] font-bold text-slate-400">+{plan.surcharge}%</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Total a Percibir</p>
                                        {totals.interest > 0 && <span className="text-[9px] font-bold text-orange-400 uppercase">+${totals.interest.toLocaleString()} INTERÉS</span>}
                                    </div>
                                    <p className="text-6xl font-black tracking-tighter text-white leading-none">${totals.total.toLocaleString('es-AR')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 shrink-0">
                            <button onClick={() => handleCheckout(true)} disabled={cart.length === 0 || isFiscalInvoicing} className="w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-30">
                                {isFiscalInvoicing ? <RefreshCw className="animate-spin"/> : <><ShieldCheck size={24}/> FACTURAR (ARCA)</>}
                            </button>
                            <button onClick={() => handleCheckout(false)} disabled={cart.length === 0 || isProcessing} className="w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-lg bg-white border-2 border-slate-200 text-slate-900 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-30">
                                {isProcessing ? <RefreshCw className="animate-spin"/> : <><CheckCircle size={24}/> COBRO INTERNO</>}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar animate-fade-in">
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] sticky top-0">
                                <tr>
                                    <th className="px-8 py-5">Ref. Operación</th>
                                    <th className="px-8 py-5">Fecha / Hora</th>
                                    <th className="px-8 py-5">Cliente</th>
                                    <th className="px-8 py-5">Medio</th>
                                    <th className="px-8 py-5 text-right">Importe Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px]">
                                {salesHistory.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-5 font-black text-indigo-600">{sale.id} {sale.isFiscal && <span className="ml-2 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[7px] uppercase border">Fiscal</span>}</td>
                                        <td className="px-8 py-5 font-bold text-slate-400">{sale.date}</td>
                                        <td className="px-8 py-5 font-black text-slate-700 uppercase">{sale.client}</td>
                                        <td className="px-8 py-5 font-bold text-slate-500 uppercase">{sale.method}</td>
                                        <td className="px-8 py-5 text-right font-black text-slate-900 text-lg tracking-tighter">${sale.total.toLocaleString('es-AR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
