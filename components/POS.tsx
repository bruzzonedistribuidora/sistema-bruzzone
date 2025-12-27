
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ShoppingCart, Printer, Trash2, Search, CheckCircle, 
    Plus, Minus, X, RefreshCw, Landmark,
    PlusCircle, Receipt, Truck, FileSpreadsheet,
    CreditCard as CardIcon, Info, ChevronDown
} from 'lucide-react';
import { InvoiceItem, Product, Client, CompanyConfig, PaymentSystem } from '../types';

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
    onTransformToRemito?: (items: InvoiceItem[]) => void;
    onTransformToBudget?: (items: InvoiceItem[]) => void;
}

const POS: React.FC<POSProps> = ({ initialCart, onCartUsed, onTransformToRemito, onTransformToBudget }) => {
    const [activeTab, setActiveTab] = useState<'SALES' | 'HISTORY'>('SALES');
    const [productSearch, setProductSearch] = useState('');
    const [showProductResults, setShowProductResults] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [syncKey, setSyncKey] = useState(0);
    
    const [lastSale, setLastSale] = useState<any>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('ferrecloud_products') || '[]'));
    const [clients] = useState<Client[]>(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));
    const [salesHistory, setSalesHistory] = useState<any[]>(() => JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]'));

    // Escuchar cambios globales en la configuración para actualizar intereses en tiempo real
    useEffect(() => {
        const handleSync = () => setSyncKey(k => k + 1);
        window.addEventListener('company_config_updated', handleSync);
        window.addEventListener('storage', handleSync);
        return () => {
            window.removeEventListener('company_config_updated', handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, []);

    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { 
            paymentMethods: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CTACTE'],
            paymentSystems: []
        };
    }, [syncKey]);

    const [cart, setCart] = useState<InvoiceItem[]>(initialCart || []);
    const [selectedClient, setSelectedClient] = useState<Client>(DEFAULT_CLIENT);
    const [paymentMethod, setPaymentMethod] = useState<string>('EFECTIVO');
    const [discountPerc, setDiscountPerc] = useState<number>(0);

    const [selectedSystemId, setSelectedSystemId] = useState<string>('');
    const [selectedCuotaId, setSelectedCuotaId] = useState<string>('');

    const currentSystem = useMemo(() => 
        (companyConfig.paymentSystems || []).find(s => s.id === selectedSystemId),
    [selectedSystemId, companyConfig]);

    const cardInterest = useMemo(() => {
        if (paymentMethod !== 'TARJETA' || !currentSystem) return 0;
        if (!selectedCuotaId) return currentSystem.debitSurcharge;
        const plan = currentSystem.creditInstallments.find(p => p.id === selectedCuotaId);
        return plan ? plan.surcharge : 0;
    }, [paymentMethod, currentSystem, selectedCuotaId]);

    const totals = useMemo(() => {
        const grossTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
        const discountAmount = grossTotal * (discountPerc / 100);
        const baseTotal = grossTotal - discountAmount;
        const interestAmount = baseTotal * (cardInterest / 100);
        return { 
            total: baseTotal + interestAmount, 
            discountAmount, 
            grossTotal, 
            interestAmount, 
            baseTotal 
        };
    }, [cart, discountPerc, cardInterest]);

    useEffect(() => {
        if (initialCart && initialCart.length > 0) {
            setCart(initialCart);
            onCartUsed?.();
        }
    }, [initialCart]);

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

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setIsProcessing(true);
        setTimeout(() => {
            const newSale = {
                id: `VEN-${Date.now().toString().slice(-6)}`,
                date: new Date().toLocaleString(),
                client: selectedClient.name,
                items: [...cart],
                total: totals.total,
                paymentMethod,
                system: currentSystem?.name,
                interest: totals.interestAmount
            };
            const updatedHistory = [newSale, ...salesHistory];
            setSalesHistory(updatedHistory);
            localStorage.setItem('ferrecloud_sales_history', JSON.stringify(updatedHistory));
            setLastSale(newSale);
            setIsProcessing(false);
            setShowSuccessModal(true);
            setCart([]);
            setPaymentMethod('EFECTIVO');
            setSelectedSystemId('');
            setSelectedCuotaId('');
        }, 800);
    };

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden flex-col font-sans">
            <div className="bg-white border-b border-gray-200 px-6 h-12 flex justify-between items-center shrink-0 print:hidden">
                <div className="flex gap-6 h-full">
                    <button onClick={() => setActiveTab('SALES')} className={`h-full px-2 font-black text-xs uppercase tracking-wider border-b-2 transition-all ${activeTab === 'SALES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>Caja Registradora</button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`h-full px-2 font-black text-xs uppercase tracking-wider border-b-2 transition-all ${activeTab === 'HISTORY' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>Ventas Recientes</button>
                </div>
            </div>

            {activeTab === 'SALES' ? (
                <div className="flex flex-1 overflow-hidden p-4 gap-4 print:p-0">
                    <div className="flex-[3] flex flex-col gap-4 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
                            <div className="md:col-span-8 relative">
                                <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
                                    <Search className="text-gray-300 mr-3" size={20} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar descripción o SKU..." 
                                        className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700 uppercase" 
                                        value={productSearch}
                                        onFocus={() => setShowProductResults(true)}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                    />
                                </div>
                                {showProductResults && productSearch.length > 0 && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden">
                                        {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0,8).map(p => (
                                            <div key={p.id} onClick={() => addToCart(p)} className="p-4 hover:bg-indigo-50 border-b last:border-0 flex justify-between items-center cursor-pointer">
                                                <div><p className="font-black text-slate-800 uppercase text-xs">{p.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{p.internalCodes[0]}</p></div>
                                                <p className="font-black text-indigo-600 text-sm">${p.priceFinal.toLocaleString('es-AR')}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-4">
                                <select 
                                    className="w-full h-full p-3 bg-white border border-gray-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                    value={selectedClient.id}
                                    onChange={e => setSelectedClient(clients.find(cl => cl.id === e.target.value) || DEFAULT_CLIENT)}
                                >
                                    <option value="cf-default">Consumidor Final</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900 text-white sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Producto</th>
                                            <th className="px-6 py-4 text-center">Cantidad</th>
                                            <th className="px-6 py-4 text-right">Subtotal</th>
                                            <th className="px-6 py-4 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cart.map(item => (
                                            <tr key={item.product.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-black text-slate-800 text-xs uppercase leading-none mb-1">{item.product.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{item.product.internalCodes[0]}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-3 bg-slate-50 rounded-xl p-1 w-fit mx-auto border border-slate-100">
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1), subtotal: Math.max(1, i.quantity - 1) * i.appliedPrice} : i))} className="p-1 text-slate-300 hover:text-indigo-600"><Minus size={16}/></button>
                                                        <span className="font-black text-sm w-8 text-center">{item.quantity}</span>
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i))} className="p-1 text-slate-300 hover:text-indigo-600"><Plus size={16}/></button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900">${item.subtotal.toLocaleString('es-AR')}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                        <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm p-6 space-y-4 flex flex-col">
                            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 border-b pb-4 mb-2">Checkout Inteligente</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Subtotal Neto</span>
                                    <span className="text-lg font-black text-slate-700">${totals.baseTotal.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="pt-4 border-t border-dashed border-slate-200">
                                    <label className="text-[9px] font-black text-gray-400 uppercase mb-3 block tracking-widest">Modalidad</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {companyConfig.paymentMethods?.map(m => (
                                            <button 
                                                key={m} 
                                                onClick={() => setPaymentMethod(m)} 
                                                className={`py-3 rounded-xl font-black text-[9px] uppercase border-2 transition-all ${paymentMethod === m ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {paymentMethod === 'TARJETA' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100 space-y-3">
                                            <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block">Canal de Cobro</label>
                                            <select 
                                                className="w-full p-3 bg-white border border-indigo-100 rounded-xl font-black text-[10px] uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={selectedSystemId}
                                                onChange={e => { setSelectedSystemId(e.target.value); setSelectedCuotaId(''); }}
                                            >
                                                <option value="">-- SELECCIONE PLATAFORMA --</option>
                                                {(companyConfig.paymentSystems || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>

                                        {currentSystem && (
                                            <div className="grid grid-cols-1 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Plan Seleccionado (CFT Inc.)</label>
                                                <button 
                                                    onClick={() => setSelectedCuotaId('')}
                                                    className={`w-full p-3 rounded-xl border flex justify-between items-center transition-all ${!selectedCuotaId ? 'bg-green-600 border-green-700 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600'}`}>
                                                    <span className="text-[10px] font-black uppercase">Débito</span>
                                                    <span className="text-[9px] font-bold">+{currentSystem.debitSurcharge}%</span>
                                                </button>
                                                {currentSystem.creditInstallments.map(plan => (
                                                    <button 
                                                        key={plan.id}
                                                        onClick={() => setSelectedCuotaId(plan.id)}
                                                        className={`w-full p-3 rounded-xl border flex justify-between items-center transition-all ${selectedCuotaId === plan.id ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600'}`}>
                                                        <span className="text-[10px] font-black uppercase">{plan.label}</span>
                                                        <span className="text-[9px] font-bold">+{plan.surcharge}%</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-200">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Final a Cobrar</p>
                                    <p className={`text-4xl font-black tracking-tighter ${totals.interestAmount > 0 ? 'text-indigo-600 animate-pulse' : 'text-slate-900'}`}>${totals.total.toLocaleString('es-AR')}</p>
                                    {totals.interestAmount > 0 && <p className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">Incluye Financiamiento Final: ${totals.interestAmount.toLocaleString('es-AR')}</p>}
                                </div>
                            </div>
                            <button onClick={handleCheckout} disabled={cart.length === 0 || isProcessing} className="w-full py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-xs shadow-2xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-3 active:scale-95 transition-all">
                                {isProcessing ? <RefreshCw className="animate-spin" /> : <><CheckCircle size={18}/> FINALIZAR COBRO</>}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest sticky top-0">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Medio / Plataforma</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[11px]">
                                {salesHistory.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-indigo-600">{sale.id}</td>
                                        <td className="px-6 py-4 text-slate-400">{sale.date}</td>
                                        <td className="px-6 py-4 font-black uppercase text-slate-700">{sale.client}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-200">{sale.paymentMethod} {sale.system ? `• ${sale.system}` : ''}</span></td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">${sale.total.toLocaleString('es-AR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showSuccessModal && lastSale && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in print:bg-white print:p-0 print:block">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col print:shadow-none print:rounded-none print:max-h-none print:w-full">
                        <div className="p-8 bg-green-600 text-white flex justify-between items-center shrink-0 print:hidden">
                            <div className="flex items-center gap-4">
                                <CheckCircle size={32}/>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Venta Confirmada</h3>
                            </div>
                            <button onClick={() => setShowSuccessModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={32}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 bg-white print:p-0">
                            <div className="border border-slate-100 p-8 rounded-[2rem] shadow-sm print:border-none print:p-0">
                                <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
                                    <div>
                                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">{companyConfig.fantasyName}</h1>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">CUIT: {companyConfig.cuit}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-mono font-black">{lastSale.id}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{lastSale.date}</p>
                                    </div>
                                </div>
                                <div className="mb-8 space-y-1">
                                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{lastSale.client}</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Pago: {lastSale.paymentMethod} {lastSale.system ? `(${lastSale.system})` : ''}</p>
                                </div>
                                <table className="w-full text-left mb-10">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
                                        <tr><th className="py-3 px-2">Descripción</th><th className="py-3 px-2 text-center">Cant.</th><th className="py-3 px-2 text-right">Subtotal</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {lastSale.items.map((item: any, i: number) => (
                                            <tr key={i}>
                                                <td className="py-4 px-2 uppercase text-xs font-black">{item.product.name}</td>
                                                <td className="py-4 px-2 text-center font-black text-slate-700 text-xs">{item.quantity}</td>
                                                <td className="py-4 px-2 text-right font-black text-slate-900 text-xs">${item.subtotal.toLocaleString('es-AR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {lastSale.interest > 0 && (
                                    <div className="flex justify-end pt-4 mb-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Recargo por Financiación: ${lastSale.interest.toLocaleString('es-AR')}</p>
                                    </div>
                                )}
                                <div className="flex justify-end pt-6 border-t-2 border-dashed border-slate-200">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Abonado</p>
                                        <p className="text-5xl font-black text-slate-900 tracking-tighter">${lastSale.total.toLocaleString('es-AR')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 border-t flex justify-end gap-3 print:hidden">
                            <button onClick={() => setShowSuccessModal(false)} className="px-8 py-4 text-gray-400 font-black text-[10px] uppercase">Cerrar</button>
                            <button onClick={() => window.print()} className="bg-slate-900 text-white px-12 py-4 rounded-[1.8rem] font-black uppercase text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"><Printer size={20}/> Imprimir Ticket</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
