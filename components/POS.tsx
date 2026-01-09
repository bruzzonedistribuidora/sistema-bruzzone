
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShoppingCart, Printer, Trash2, Search, CheckCircle, 
    Plus, Minus, X, RefreshCw, Landmark,
    PlusCircle, Receipt, Truck, FileSpreadsheet,
    CreditCard as CardIcon, Info, ChevronDown, PackagePlus, Save, DollarSign,
    ShieldCheck, FileText, ArrowRight, ClipboardList, Sparkles, Zap,
    ArrowLeftRight, Banknote, Smartphone as ECheqIcon,
    History, PackageCheck, Wallet
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
    // Put all state declarations at the top to avoid TDZ (Temporal Dead Zone) issues
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

    // Moved these up to fix 'used before its declaration' errors in useMemo below
    const [cart, setCart] = useState<InvoiceItem[]>(initialCart || []);
    const [selectedClient, setSelectedClient] = useState<Client>(DEFAULT_CLIENT);
    const [paymentMethod, setPaymentMethod] = useState<string>('EFECTIVO');
    const [selectedSystemId, setSelectedSystemId] = useState<string>('');
    const [cardMode, setCardMode] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
    const [selectedCuotaId, setSelectedCuotaId] = useState<string>('');

    const loadProducts = async () => {
        const all = await productDB.getAll();
        setProducts(all);
    };

    const loadHistory = () => {
        setSalesHistory(JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]'));
    };

    useEffect(() => {
        loadProducts();
        window.addEventListener('ferrecloud_products_updated', loadProducts);
        window.addEventListener('ferrecloud_sales_updated', loadHistory);
        return () => {
            window.removeEventListener('ferrecloud_products_updated', loadProducts);
            window.removeEventListener('ferrecloud_sales_updated', loadHistory);
        };
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

    const handleCheckout = async (isFiscal: boolean = false) => {
        if (cart.length === 0) return;

        const savedRegisters: CashRegister[] = JSON.parse(localStorage.getItem('ferrecloud_registers') || '[]');
        const activeRegister = savedRegisters.find(r => r.isOpen);
        
        if (!activeRegister && !['CTACTE', 'CHEQUE', 'E-CHEQ'].includes(paymentMethod)) {
            alert("⚠️ No hay ninguna CAJA ABIERTA.");
            return;
        }

        isFiscal ? setIsFiscalInvoicing(true) : setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, isFiscal ? 1000 : 500));

        const saleId = `VEN-${Date.now().toString().slice(-6)}`;
        const timestamp = new Date().toLocaleString();

        const sale = { 
            id: saleId, 
            isFiscal, 
            date: timestamp, 
            client: selectedClient.name, 
            total: totals.total, 
            method: paymentMethod, 
            items: cart.map(i => ({ sku: i.product.internalCodes[0], name: i.product.name, qty: i.quantity, price: i.appliedPrice })) 
        };
        
        const newHistory = [sale, ...salesHistory];
        setSalesHistory(newHistory);
        localStorage.setItem('ferrecloud_sales_history', JSON.stringify(newHistory));

        // ACTUALIZAR STOCK LOCAL Y DISPARAR SINCRONIZACIÓN NUBE
        const productsToUpdate: Product[] = [];
        for (const item of cart) {
            const prod = products.find(p => p.id === item.product.id);
            if (prod) {
                const updatedProd = { 
                    ...prod, 
                    stockPrincipal: Math.max(0, (prod.stockPrincipal || 0) - item.quantity), 
                    stock: Math.max(0, (prod.stock || 0) - item.quantity) 
                };
                productsToUpdate.push(updatedProd);
            }
        }
        await productDB.saveBulk(productsToUpdate);

        // DISPARAR PUSH DE VENTA A LA NUBE
        window.dispatchEvent(new CustomEvent('ferrecloud_sync_request', { 
            detail: { type: 'NEW_SALE', data: { sale, stockUpdates: productsToUpdate } } 
        }));

        if (!['CTACTE', 'CHEQUE', 'E-CHEQ'].includes(paymentMethod) && activeRegister) {
            const movement: TreasuryMovement = { id: `MV-${Date.now()}`, date: timestamp, type: 'INCOME', subtype: 'VENTA', paymentMethod: paymentMethod as any, amount: totals.total, description: `VENTA #${saleId} - ${selectedClient.name}`, cashRegisterId: activeRegister.id };
            localStorage.setItem('ferrecloud_registers', JSON.stringify(savedRegisters.map(r => r.id === activeRegister.id ? { ...r, balance: r.balance + totals.total } : r)));
            const savedMovements: TreasuryMovement[] = JSON.parse(localStorage.getItem('ferrecloud_treasury_movements') || '[]');
            localStorage.setItem('ferrecloud_treasury_movements', JSON.stringify([movement, ...savedMovements]));
        }

        if (paymentMethod === 'CTACTE') {
            const savedClients: Client[] = JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]');
            localStorage.setItem('ferrecloud_clients', JSON.stringify(savedClients.map(c => c.id === selectedClient.id ? { ...c, balance: (c.balance || 0) + totals.total } : c)));
            const movements = JSON.parse(localStorage.getItem('ferrecloud_movements') || '[]');
            movements.push({ id: `MOV-${Date.now()}`, clientId: selectedClient.id, date: timestamp, voucherType: `VENTA #${saleId}`, description: `Cta Cte`, debit: totals.total, credit: 0, balance: (selectedClient.balance || 0) + totals.total });
            localStorage.setItem('ferrecloud_movements', JSON.stringify(movements));
        }

        setLastSale(sale);
        setIsFiscalInvoicing(false);
        setIsProcessing(false);
        setShowSuccessModal(true);
        setCart([]);
        setSelectedClient(DEFAULT_CLIENT);
    };

    return (
        <div className="flex h-full bg-slate-100 overflow-hidden flex-1 flex-col font-sans animate-fade-in">
            <div className="bg-white border-b border-slate-200 px-4 h-12 flex justify-between items-center shrink-0">
                <div className="flex gap-4 h-full">
                    {['SALES', 'HISTORY'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`h-full px-2 font-black text-[9px] uppercase tracking-wider border-b-4 transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
                            {tab === 'SALES' ? 'Mostrador' : 'Historial'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Caja: <span className="text-green-500">Activa</span></span>
                </div>
            </div>

            {activeTab === 'SALES' ? (
                <div className="flex flex-1 overflow-hidden p-3 gap-3">
                    <div className="flex-[3] flex flex-col gap-3 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 shrink-0">
                            <div className="md:col-span-8 relative">
                                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                    <Search className="text-slate-300 mr-3" size={16} />
                                    <input type="text" placeholder="Escanear o buscar..." className="flex-1 bg-transparent outline-none font-black text-slate-800 uppercase text-xs tracking-tight" value={productSearch} onFocus={() => setShowProductResults(true)} onChange={(e) => setProductSearch(e.target.value)} />
                                </div>
                                {showProductResults && productSearch.length > 2 && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
                                        {filteredProducts.map(p => (
                                            <div key={p.id} onClick={() => addToCart(p)} className="p-3 hover:bg-indigo-50 border-b last:border-0 flex justify-between items-center cursor-pointer transition-colors">
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-800 uppercase text-[10px] truncate">{p.name}</p>
                                                    <p className="text-[7px] text-gray-400 font-bold uppercase">Stock: {p.stock}</p>
                                                </div>
                                                <p className="font-black text-indigo-600 text-xs whitespace-nowrap ml-2">${p.priceFinal.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-4">
                                <select className="w-full h-full p-2 bg-white border border-slate-200 rounded-xl font-black text-[9px] uppercase shadow-sm outline-none" value={selectedClient.id} onChange={e => setSelectedClient(clients.find(cl => cl.id === e.target.value) || DEFAULT_CLIENT)}>
                                    <option value="cf-default">CONSUMIDOR FINAL</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[8px] font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="px-4 py-2">Artículo</th>
                                            <th className="px-4 py-2 text-center">Cant.</th>
                                            <th className="px-4 py-2 text-right">Subtotal</th>
                                            <th className="px-4 py-2 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {cart.map(item => (
                                            <tr key={item.product.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-1.5">
                                                    <p className="font-black text-slate-800 text-[10px] uppercase leading-tight">{item.product.name}</p>
                                                    <p className="text-[7px] text-gray-400 font-bold uppercase">{item.product.internalCodes[0]}</p>
                                                </td>
                                                <td className="px-4 py-1.5">
                                                    <div className="flex items-center justify-center gap-1.5 bg-slate-100 rounded-lg p-1 w-fit mx-auto">
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1), subtotal: Math.max(1, i.quantity - 1) * i.appliedPrice} : i))} className="p-0.5 text-slate-400 hover:text-indigo-600"><Minus size={10}/></button>
                                                        <span className="font-black text-[10px] w-4 text-center">{item.quantity}</span>
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i))} className="p-0.5 text-slate-400 hover:text-indigo-600"><Plus size={10}/></button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-1.5 text-right font-black text-slate-900 text-xs">${item.subtotal.toLocaleString()}</td>
                                                <td className="px-4 py-1.5 text-center">
                                                    <button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="text-slate-200 hover:text-red-500"><Trash2 size={12}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cart.length === 0 && (
                                            <tr><td colSpan={4} className="py-16 text-center text-slate-300 uppercase font-black text-[9px] tracking-widest">Carrito vacío</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="w-[340px] flex flex-col gap-2 shrink-0 overflow-y-auto custom-scrollbar pr-1">
                        <div className="bg-slate-900 rounded-[1.5rem] p-4 text-white shadow-xl flex flex-col relative overflow-hidden shrink-0">
                            <h3 className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mb-3 border-b border-white/10 pb-1.5">Medios de Pago</h3>
                            
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-1">
                                    {[
                                        { id: 'EFECTIVO', icon: Banknote },
                                        { id: 'TARJETA', icon: CardIcon },
                                        { id: 'TRANSFERENCIA', icon: Landmark },
                                        { id: 'CTACTE', icon: History },
                                        { id: 'CHEQUE', icon: FileText },
                                        { id: 'E-CHEQ', icon: ECheqIcon }
                                    ].map(m => (
                                        <button 
                                            key={m.id} 
                                            onClick={() => setPaymentMethod(m.id)} 
                                            className={`py-2 px-1.5 rounded-lg font-black text-[7px] uppercase tracking-tighter border flex flex-col items-center gap-1 transition-all ${paymentMethod === m.id ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-white/5 bg-white/5 text-slate-400'}`}>
                                            <m.icon size={12}/> {m.id}
                                        </button>
                                    ))}
                                </div>

                                {paymentMethod === 'TARJETA' && (
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/10 space-y-2">
                                        <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                            {(companyConfig.paymentSystems || []).map(sys => (
                                                <button key={sys.id} onClick={() => setSelectedSystemId(sys.id)} className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase whitespace-nowrap transition-all ${selectedSystemId === sys.id ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'}`}>{sys.name}</button>
                                            ))}
                                        </div>
                                        {selectedSystemId && (
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <button onClick={() => setCardMode('DEBIT')} className={`py-1 rounded-lg text-[7px] font-black uppercase border transition-all ${cardMode === 'DEBIT' ? 'border-indigo-400 text-indigo-400 bg-indigo-400/10' : 'border-white/5 text-slate-500'}`}>Débito</button>
                                                <button onClick={() => setCardMode('CREDIT')} className={`py-1 rounded-lg text-[7px] font-black uppercase border transition-all ${cardMode === 'CREDIT' ? 'border-indigo-400 text-indigo-400 bg-indigo-400/10' : 'border-white/5 text-slate-500'}`}>Crédito</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Total a Pagar</span>
                                    <p className="text-3xl font-black tracking-tighter text-white leading-none">${totals.total.toLocaleString('es-AR')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                            <button onClick={() => handleCheckout(true)} disabled={cart.length === 0 || isFiscalInvoicing} className="w-full py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30">
                                {isFiscalInvoicing ? <RefreshCw className="animate-spin" size={14}/> : <><ShieldCheck size={16}/> FACTURAR ARCA</>}
                            </button>
                            <button onClick={() => handleCheckout(false)} disabled={cart.length === 0 || isProcessing} className="w-full py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg bg-white border border-slate-200 text-slate-900 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30">
                                {isProcessing ? <RefreshCw className="animate-spin" size={14}/> : <><CheckCircle size={16}/> INTERNO / SIN VALIDEZ</>}
                            </button>
                            <div className="grid grid-cols-2 gap-1.5 mt-1">
                                <button onClick={() => onTransformToRemito?.(cart)} disabled={cart.length === 0} className="py-2 bg-slate-200 text-slate-600 rounded-lg text-[7px] font-black uppercase hover:bg-slate-300">Remito R</button>
                                <button onClick={() => onTransformToBudget?.(cart)} disabled={cart.length === 0} className="py-2 bg-slate-200 text-slate-600 rounded-lg text-[7px] font-black uppercase hover:bg-slate-300">Presupuesto</button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar animate-fade-in">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest sticky top-0">
                                <tr>
                                    <th className="px-4 py-2.5">ID Operación</th>
                                    <th className="px-4 py-2.5">Cliente</th>
                                    <th className="px-4 py-2.5 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[9px]">
                                {salesHistory.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-2.5 font-black text-indigo-600">{sale.id}</td>
                                        <td className="px-4 py-2.5 font-black text-slate-700 uppercase">{sale.client}</td>
                                        <td className="px-4 py-2.5 text-right font-black text-slate-900">${sale.total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showSuccessModal && lastSale && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xs overflow-hidden flex flex-col">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-100">
                                <CheckCircle size={24}/>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Venta Registrada</h3>
                            <div className="bg-slate-50 p-3 rounded-xl text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ID Comprobante</p>
                                <p className="text-base font-black text-slate-800">{lastSale.id}</p>
                            </div>
                            <button onClick={() => setShowSuccessModal(false)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl">Nueva Operación</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
