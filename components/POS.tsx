
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShoppingCart, Printer, Trash2, Search, CheckCircle, 
    Plus, Minus, X, RefreshCw, Landmark,
    PlusCircle, Receipt, Truck, FileSpreadsheet,
    CreditCard as CardIcon, Info, ChevronDown, PackagePlus, Save, DollarSign,
    ShieldCheck, FileText, ArrowRight, ClipboardList, Sparkles, Zap,
    ArrowLeftRight, Banknote, Smartphone as ECheqIcon,
    History, PackageCheck, Wallet, Edit3
} from 'lucide-react';
import { InvoiceItem, Product, Client, CompanyConfig, PaymentSystem, TreasuryMovement, CashRegister } from '../types';
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
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [showProductResults, setShowProductResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isFiscalInvoicing, setIsFiscalInvoicing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);

    const [clients] = useState<Client[]>(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));
    const [salesHistory, setSalesHistory] = useState<any[]>(() => JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]'));

    const [cart, setCart] = useState<InvoiceItem[]>(initialCart || []);
    const [selectedClient, setSelectedClient] = useState<Client>(DEFAULT_CLIENT);
    const [paymentMethod, setPaymentMethod] = useState<string>('EFECTIVO');
    const [selectedSystemId, setSelectedSystemId] = useState<string>('');
    const [cardMode, setCardMode] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
    const [selectedCuotaId, setSelectedCuotaId] = useState<string>('');

    // Búsqueda reactiva optimizada para 140k artículos
    useEffect(() => {
        const performSearch = async () => {
            const term = productSearch.trim().toUpperCase();
            if (term.length > 2) {
                setIsSearching(true);
                try {
                    const results = await productDB.search(term);
                    setSearchResults(results);
                    
                    // Si es un código exacto (EAN o SKU), agregar automáticamente
                    const exactMatch = results.find(p => 
                        p.internalCodes.some(c => c.toUpperCase() === term) || 
                        (p.barcodes && p.barcodes.some(b => b.toUpperCase() === term))
                    );
                    if (exactMatch && term.length > 5) {
                        addToCart(exactMatch);
                        setProductSearch('');
                        setShowProductResults(false);
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        };
        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [productSearch]);

    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { paymentMethods: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'], paymentSystems: [] };
    }, []);

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
                const newQty = existing.quantity + 1;
                return prev.map(item => item.product.id === product.id ? 
                    { ...item, quantity: newQty, subtotal: newQty * item.appliedPrice } : item
                );
            }
            return [...prev, { product, quantity: 1, appliedPrice: product.priceFinal, subtotal: product.priceFinal }];
        });
        setProductSearch('');
        setShowProductResults(false);
    };

    const updatePrice = (productId: string, newPrice: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                return {
                    ...item,
                    appliedPrice: newPrice,
                    subtotal: item.quantity * newPrice
                };
            }
            return item;
        }));
    };

    const updateQuantity = (productId: string, newQty: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                return {
                    ...item,
                    quantity: newQty,
                    subtotal: newQty * item.appliedPrice
                };
            }
            return item;
        }));
    };

    const handleCheckout = async (isFiscal: boolean = false) => {
        if (cart.length === 0) return;
        const savedRegisters: CashRegister[] = JSON.parse(localStorage.getItem('ferrecloud_registers') || '[]');
        const activeRegister = savedRegisters.find(r => r.isOpen);
        if (!activeRegister && !['CTACTE', 'CHEQUE', 'E-CHEQ'].includes(paymentMethod)) {
            alert("⚠️ No hay ninguna CAJA ABIERTA.");
            return;
        }

        isFiscal ? setIsFiscalInvoicing(true) : setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, isFiscal ? 1200 : 500));

        const saleId = `VEN-${Date.now().toString().slice(-6)}`;
        const timestamp = new Date().toLocaleString();

        const sale = { 
            id: saleId, isFiscal, date: timestamp, client: selectedClient.name, total: totals.total, method: paymentMethod, 
            items: cart.map(i => ({ sku: i.product.internalCodes[0], name: i.product.name, qty: i.quantity, price: i.appliedPrice })) 
        };
        
        const newHistory = [sale, ...salesHistory];
        setSalesHistory(newHistory);
        localStorage.setItem('ferrecloud_sales_history', JSON.stringify(newHistory));

        const productsToUpdate: Product[] = [];
        for (const item of cart) {
            const prod = await productDB.getAll(); // fallback o busqueda puntual
            const p = prod.find(x => x.id === item.product.id);
            if (p) {
                const updatedProd = { ...p, stockPrincipal: Math.max(0, (p.stockPrincipal || 0) - item.quantity), stock: Math.max(0, (p.stock || 0) - item.quantity) };
                productsToUpdate.push(updatedProd);
            }
        }
        await productDB.saveBulk(productsToUpdate);

        window.dispatchEvent(new CustomEvent('ferrecloud_sync_request', { 
            detail: { type: 'SALE', data: { sale, stockUpdates: productsToUpdate } } 
        }));

        setLastSale(sale);
        setIsFiscalInvoicing(false);
        setIsProcessing(false);
        setShowSuccessModal(true);
        setCart([]);
        setSelectedClient(DEFAULT_CLIENT);
    };

    return (
        <div className="flex h-full bg-slate-200 overflow-hidden flex-1 flex-col font-sans animate-fade-in">
            <div className="bg-slate-900 px-6 h-14 flex justify-between items-center shrink-0 shadow-lg">
                <div className="flex gap-6 h-full">
                    {['SALES', 'HISTORY'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`h-full px-2 font-black text-[11px] uppercase tracking-widest border-b-4 transition-all ${activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
                            {tab === 'SALES' ? 'Frente de Caja' : 'Historial de Turno'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-lg">Caja: <span className="text-green-400">Activa</span></span>
                </div>
            </div>

            {activeTab === 'SALES' ? (
                <div className="flex flex-1 overflow-hidden p-4 gap-4">
                    <div className="flex-[3] flex flex-col gap-4 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
                            <div className="md:col-span-8 relative">
                                <div className="flex items-center bg-white border-2 border-slate-300 rounded-2xl px-5 py-3 shadow-md focus-within:border-indigo-600 transition-all">
                                    {isSearching ? <RefreshCw className="text-indigo-500 animate-spin mr-4" size={22}/> : <Search className="text-slate-400 mr-4" size={22} />}
                                    <input type="text" placeholder="Escanear Código o Buscar Articulo (140k)..." className="flex-1 bg-transparent outline-none font-black text-slate-950 uppercase text-sm tracking-tight" value={productSearch} onFocus={() => setShowProductResults(true)} onChange={(e) => setProductSearch(e.target.value)} />
                                </div>
                                {showProductResults && productSearch.length > 2 && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-[2rem] shadow-2xl border border-slate-300 z-[100] overflow-hidden animate-fade-in max-h-[450px] overflow-y-auto custom-scrollbar p-2">
                                        {searchResults.map(p => (
                                            <div key={p.id} onClick={() => addToCart(p)} className="p-4 hover:bg-indigo-50 border-b last:border-0 flex justify-between items-center cursor-pointer transition-colors rounded-xl group">
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-900 uppercase text-xs truncate">{p.name}</p>
                                                    <div className="flex gap-4 text-[10px] text-slate-400 font-black uppercase">
                                                        <span>Ref: {p.internalCodes[0]}</span>
                                                        <span className={p.stock > 0 ? 'text-emerald-600' : 'text-red-500'}>Stock: {p.stock}</span>
                                                    </div>
                                                </div>
                                                <p className="font-black text-indigo-700 text-lg whitespace-nowrap ml-4">${p.priceFinal.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-4">
                                <select className="w-full h-full px-4 py-3 bg-white border-2 border-slate-300 rounded-2xl font-black text-xs text-slate-950 uppercase shadow-md outline-none focus:border-indigo-600" value={selectedClient.id} onChange={e => setSelectedClient(clients.find(cl => cl.id === e.target.value) || DEFAULT_CLIENT)}>
                                    <option value="cf-default">CONSUMIDOR FINAL</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-300 overflow-hidden flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <tr>
                                            <th className="px-8 py-5">Descripción de Mercadería</th>
                                            <th className="px-8 py-5 text-center">Cant.</th>
                                            <th className="px-8 py-5 text-right">Precio Unit.</th>
                                            <th className="px-8 py-5 text-right">Subtotal</th>
                                            <th className="px-8 py-5 text-center w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {cart.map(item => (
                                            <tr key={item.product.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-4">
                                                    <p className="font-black text-slate-950 text-xs uppercase leading-tight">{item.product.name}</p>
                                                    <p className="text-[10px] text-indigo-600 font-mono font-bold uppercase mt-0.5">{item.product.internalCodes[0]}</p>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center justify-center gap-3 bg-slate-100 border border-slate-200 rounded-xl p-1.5 w-fit mx-auto shadow-inner">
                                                        <button onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 0.1))} className="p-1 text-slate-400 hover:text-red-600"><Minus size={14}/></button>
                                                        <input 
                                                            type="number" 
                                                            step="0.001"
                                                            className="font-black text-sm w-16 text-center text-slate-950 bg-transparent outline-none" 
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.product.id, parseFloat(e.target.value.replace(',', '.')) || 0)}
                                                        />
                                                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 text-slate-400 hover:text-indigo-600"><Plus size={14}/></button>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center justify-end gap-2 group">
                                                        <DollarSign size={14} className="text-slate-300"/>
                                                        <input 
                                                            type="number"
                                                            className="w-28 p-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-right font-black text-slate-950 text-base outline-none"
                                                            value={item.appliedPrice}
                                                            onChange={(e) => updatePrice(item.product.id, parseFloat(e.target.value.replace(',', '.')) || 0)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-right font-black text-slate-950 text-base font-mono">${item.subtotal.toLocaleString()}</td>
                                                <td className="px-8 py-4 text-center">
                                                    <button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="w-[400px] flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar">
                        <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col relative overflow-hidden shrink-0 border-t-4 border-indigo-600">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 border-b border-white/10 pb-4">Liquidación Final</h3>
                            <div className="space-y-6 relative z-10">
                                <div className="grid grid-cols-2 gap-3">
                                    {['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CTACTE'].map(m => (
                                        <button 
                                            key={m} 
                                            onClick={() => setPaymentMethod(m)} 
                                            className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${paymentMethod === m ? 'border-indigo-500 bg-indigo-600 text-white shadow-xl' : 'border-white/5 bg-white/5 text-slate-400'}`}>
                                            {m}
                                        </button>
                                    ))}
                                </div>
                                <div className="pt-6 border-t border-white/10">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total a Pagar</span>
                                        <p className="text-slate-500 font-black text-xs line-through">${totals.gross.toLocaleString()}</p>
                                    </div>
                                    <p className="text-6xl font-black tracking-tighter text-white leading-none">${totals.total.toLocaleString('es-AR')}</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => handleCheckout(true)} disabled={cart.length === 0 || isFiscalInvoicing} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl bg-indigo-600 text-white flex items-center justify-center gap-3">
                            {isFiscalInvoicing ? <RefreshCw className="animate-spin" size={20}/> : <><ShieldCheck size={20}/> FACTURACIÓN ARCA</>}
                        </button>
                        <button onClick={() => handleCheckout(false)} disabled={cart.length === 0 || isProcessing} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl bg-white border-2 border-slate-300 text-slate-950 flex items-center justify-center gap-3">
                            {isProcessing ? <RefreshCw className="animate-spin" size={20}/> : <><CheckCircle size={20}/> TICKET INTERNO</>}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] border border-slate-300 shadow-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest sticky top-0">
                                <tr>
                                    <th className="px-8 py-5">Identificador de Venta</th>
                                    <th className="px-8 py-5">Entidad / Cliente</th>
                                    <th className="px-8 py-5 text-right">Monto Neto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs font-black uppercase">
                                {salesHistory.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-5 text-indigo-700 font-mono">{sale.id}</td>
                                        <td className="px-8 py-5 text-slate-950">{sale.client}</td>
                                        <td className="px-8 py-5 text-right text-slate-950 text-base font-black">${sale.total.toLocaleString()}</td>
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
