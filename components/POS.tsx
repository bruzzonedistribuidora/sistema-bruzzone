
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

    // LOGICA DE ESCANEO AUTOMATICO (SIN ENTER)
    useEffect(() => {
        const term = productSearch.trim().toUpperCase();
        if (term.length >= 3) {
            const exactMatch = products.find(p => 
                p.internalCodes.some(c => c.toUpperCase() === term) || 
                (p.barcodes && p.barcodes.some(b => b.toUpperCase() === term))
            );
            if (exactMatch) {
                addToCart(exactMatch);
                setProductSearch('');
                setShowProductResults(false);
            }
        }
    }, [productSearch, products]);

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

    const handlePedir = (e: React.MouseEvent, p: Product) => {
        e.stopPropagation();
        if (addToReplenishmentQueue(p)) {
            alert(`✅ ${p.name} agregado a la lista de faltantes.`);
        }
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
                                <div className="flex items-center bg-white border-2 border-slate-300 rounded-2xl px-5 py-3 shadow-md focus-within:border-indigo-600 focus-within:ring-8 focus-within:ring-indigo-100 transition-all">
                                    <Search className="text-slate-400 mr-4" size={22} />
                                    <input type="text" placeholder="Escanear Código (Auto-Carga) o Escribir Nombre..." className="flex-1 bg-transparent outline-none font-black text-slate-950 uppercase text-sm tracking-tight placeholder:text-slate-300" value={productSearch} onFocus={() => setShowProductResults(true)} onChange={(e) => setProductSearch(e.target.value)} />
                                </div>
                                {showProductResults && productSearch.length > 2 && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-[2rem] shadow-2xl border border-slate-300 z-[100] overflow-hidden animate-fade-in max-h-[450px] overflow-y-auto custom-scrollbar p-2">
                                        {filteredProducts.map(p => (
                                            <div key={p.id} onClick={() => addToCart(p)} className="p-4 hover:bg-indigo-50 border-b last:border-0 flex justify-between items-center cursor-pointer transition-colors rounded-xl group">
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-900 uppercase text-xs truncate group-hover:text-indigo-700 transition-colors">{p.name}</p>
                                                    <div className="flex gap-4 text-[10px] text-slate-400 font-black uppercase">
                                                        <span>Ref: {p.internalCodes[0]}</span>
                                                        <span className={p.stock > 0 ? 'text-emerald-600' : 'text-red-500'}>Stock: {p.stock}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={(e) => handlePedir(e, p)}
                                                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 uppercase text-[9px] font-black tracking-widest flex items-center gap-2">
                                                        <Truck size={14}/> Pedir
                                                    </button>
                                                    <p className="font-black text-indigo-700 text-lg whitespace-nowrap ml-4">${p.priceFinal.toLocaleString()}</p>
                                                </div>
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
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1), subtotal: Math.max(1, i.quantity - 1) * i.appliedPrice} : i))} className="p-1 text-slate-400 hover:text-red-600"><Minus size={14}/></button>
                                                        <span className="font-black text-sm w-6 text-center text-slate-950">{item.quantity}</span>
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i))} className="p-1 text-slate-400 hover:text-indigo-600"><Plus size={14}/></button>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center justify-end gap-2 group">
                                                        <DollarSign size={14} className="text-slate-300 group-focus-within:text-indigo-600"/>
                                                        <input 
                                                            type="number"
                                                            className="w-28 p-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-right font-black text-slate-950 text-base focus:bg-white focus:border-indigo-600 outline-none transition-all"
                                                            value={item.appliedPrice}
                                                            onChange={(e) => updatePrice(item.product.id, parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-right font-black text-slate-950 text-base font-mono">${item.subtotal.toLocaleString()}</td>
                                                <td className="px-8 py-4 text-center">
                                                    <button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {cart.length === 0 && (
                                            <tr><td colSpan={5} className="py-32 text-center text-slate-300 uppercase font-black text-xs tracking-widest">Esperando ingreso de artículos...</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="w-[400px] flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
                        <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col relative overflow-hidden shrink-0 border-t-4 border-indigo-600">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none rotate-12"><Receipt size={180}/></div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 border-b border-white/10 pb-4">Liquidación Final</h3>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="grid grid-cols-2 gap-3">
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
                                            className={`py-4 px-2 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 flex flex-col items-center gap-2 transition-all active:scale-95 ${paymentMethod === m.id ? 'border-indigo-500 bg-indigo-600 text-white shadow-xl' : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                                            <m.icon size={20}/> {m.id}
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

                        <div className="flex flex-col gap-3 shrink-0">
                            <button onClick={() => handleCheckout(true)} disabled={cart.length === 0 || isFiscalInvoicing} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30">
                                {isFiscalInvoicing ? <RefreshCw className="animate-spin" size={20}/> : <><ShieldCheck size={20}/> FACTURACIÓN ARCA</>}
                            </button>
                            <button onClick={() => handleCheckout(false)} disabled={cart.length === 0 || isProcessing} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl bg-white border-2 border-slate-300 text-slate-950 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30">
                                {isProcessing ? <RefreshCw className="animate-spin" size={20}/> : <><CheckCircle size={20}/> TICKET INTERNO</>}
                            </button>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <button onClick={() => onTransformToRemito?.(cart)} disabled={cart.length === 0} className="py-3 bg-slate-300 border border-slate-400 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-400">Remito R</button>
                                <button onClick={() => onTransformToBudget?.(cart)} disabled={cart.length === 0} className="py-3 bg-slate-300 border border-slate-400 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-400">Presupuesto</button>
                            </div>
                        </div>
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
                                    <th className="px-8 py-5">Modo Pago</th>
                                    <th className="px-8 py-5 text-right">Monto Neto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs font-black uppercase">
                                {salesHistory.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-5 text-indigo-700 font-mono">{sale.id}</td>
                                        <td className="px-8 py-5 text-slate-950">{sale.client}</td>
                                        <td className="px-8 py-5 text-slate-500">{sale.method}</td>
                                        <td className="px-8 py-5 text-right text-slate-950 text-base font-black">${sale.total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showSuccessModal && lastSale && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-sm overflow-hidden flex flex-col border border-slate-400">
                        <div className="p-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto border-4 border-green-50 shadow-lg">
                                <CheckCircle size={40}/>
                            </div>
                            <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">Venta Éxitosa</h3>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 text-center shadow-inner">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comprobante ID</p>
                                <p className="text-2xl font-black text-indigo-600 font-mono">{lastSale.id}</p>
                            </div>
                            <button onClick={() => setShowSuccessModal(false)} className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">Siguiente Operación</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
