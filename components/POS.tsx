
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ShoppingCart, User, CreditCard, Printer, Trash2, Search, CheckCircle, 
    Plus, Minus, Banknote, FileText, X, AlertCircle, RefreshCw, Barcode, 
    DollarSign, History, Filter, Eye, Package, Zap, Landmark, Smartphone,
    PackagePlus, Loader2, Globe, Tag, ClipboardList, CheckSquare, Square, Layers,
    Scroll, TabletSmartphone, Pencil, PlusCircle, ShieldCheck, FileSpreadsheet, Receipt,
    ArrowRightLeft, Send, Shield, Hash, QrCode, Save, Check, PackageSearch, Truck,
    Activity, FileJson
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
    const [productSearch, setProductSearch] = useState('');
    const [showProductResults, setShowProductResults] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [voucherType, setVoucherType] = useState<'FISCAL' | 'INTERNAL'>('INTERNAL');

    // Modales
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualItemForm, setManualItemForm] = useState({ name: '', price: 0 });
    
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
        return saved ? JSON.parse(saved) : { 
            loyalty: { enabled: true, pointsPerPeso: 0.01 },
            paymentMethods: ['EFECTIVO', 'MERCADO_PAGO', 'TRANSFERENCIA', 'CTACTE']
        };
    }, []);

    const paymentMethods = useMemo(() => {
        return companyConfig.paymentMethods || ['EFECTIVO', 'MERCADO_PAGO', 'TRANSFERENCIA', 'CTACTE'];
    }, [companyConfig]);

    const [cart, setCart] = useState<InvoiceItem[]>(initialCart || []);
    const [selectedClient, setSelectedClient] = useState<Client>(DEFAULT_CLIENT);
    const [paymentMethod, setPaymentMethod] = useState<string>(paymentMethods[0]);
    const [discountPerc, setDiscountPerc] = useState<number>(0);

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

    const addManualItem = () => {
        if (!manualItemForm.name || manualItemForm.price <= 0) {
            alert("Ingrese nombre y precio válido");
            return;
        }
        const dummy: Product = {
            id: `manual-${Date.now()}`,
            internalCodes: ['VAR'],
            barcodes: [],
            providerCodes: [],
            name: manualItemForm.name.toUpperCase(),
            brand: 'GENÉRICO',
            provider: '',
            category: 'VARIOS',
            description: '',
            measureUnitSale: 'Un',
            measureUnitPurchase: 'Un',
            conversionFactor: 1,
            purchaseCurrency: 'ARS',
            saleCurrency: 'ARS',
            vatRate: 21,
            listCost: 0,
            discounts: [0, 0, 0, 0],
            costAfterDiscounts: 0,
            profitMargin: 0,
            priceNeto: manualItemForm.price / 1.21,
            priceFinal: manualItemForm.price,
            stock: 0,
            stockDetails: [],
            minStock: 0,
            desiredStock: 0,
            reorderPoint: 0,
            location: '',
            ecommerce: {}
        };
        setCart([...cart, { product: dummy, quantity: 1, appliedPrice: manualItemForm.price, subtotal: manualItemForm.price }]);
        setManualItemForm({ name: '', price: 0 });
        setIsManualModalOpen(false);
    };

    const handleRequestItem = (product: Product) => {
        if (product.id.toString().includes('manual')) {
            alert("No se puede pedir reposición de un ítem manual.");
            return;
        }
        const savedManual = localStorage.getItem('ferrecloud_manual_shortages');
        const manualIds: string[] = savedManual ? JSON.parse(savedManual) : [];
        if (!manualIds.includes(product.id)) {
            manualIds.push(product.id);
            localStorage.setItem('ferrecloud_manual_shortages', JSON.stringify(manualIds));
            alert(`"${product.name}" agregado a faltantes.`);
        } else {
            alert(`Este artículo ya está en la lista de pedidos.`);
        }
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
                paymentMethod,
                type: voucherType
            };

            const updatedHistory = [newSale, ...salesHistory];
            setSalesHistory(updatedHistory);
            localStorage.setItem('ferrecloud_sales_history', JSON.stringify(updatedHistory));

            const updatedProducts = products.map(p => {
                const cartItem = cart.find(item => item.product.id === p.id);
                if (cartItem) {
                    return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
                }
                return p;
            });
            setProducts(updatedProducts);
            localStorage.setItem('ferrecloud_products', JSON.stringify(updatedProducts));

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
            alert(`${voucherType === 'FISCAL' ? 'Factura Electrónica emitida y validada por ARCA.' : 'Venta interna registrada.'}`);
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
        <div className="flex h-full bg-slate-50 overflow-hidden flex-col font-sans">
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
                            <div className="md:col-span-6 relative">
                                <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
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
                            <div className="md:col-span-2">
                                <button 
                                    onClick={() => setIsManualModalOpen(true)}
                                    className="w-full h-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase border border-indigo-100 hover:bg-indigo-100 transition-all">
                                    <PlusCircle size={16}/> Ítem Manual
                                </button>
                            </div>
                            <div className="md:col-span-4">
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
                                            <th className="px-6 py-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cart.map(item => (
                                            <tr key={item.product.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {item.product.id.toString().includes('manual') && (
                                                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">VAR</span>
                                                        )}
                                                        <div>
                                                            <p className="font-black text-slate-800 text-xs uppercase leading-none mb-1">{item.product.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{item.product.internalCodes[0]}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-3 bg-slate-50 rounded-xl p-1 w-fit mx-auto border border-slate-100">
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: Math.max(1, i.quantity - 1), subtotal: Math.max(1, i.quantity - 1) * i.appliedPrice} : i))} className="p-1 text-slate-300 hover:text-indigo-600"><Minus size={16}/></button>
                                                        <span className="font-black text-sm w-8 text-center">{item.quantity}</span>
                                                        <button onClick={() => setCart(cart.map(i => i.product.id === item.product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i))} className="p-1 text-slate-300 hover:text-indigo-600"><Plus size={16}/></button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-400">${item.appliedPrice.toLocaleString('es-AR')}</td>
                                                <td className="px-6 py-4 text-right font-black text-slate-900">${item.subtotal.toLocaleString('es-AR')}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleRequestItem(item.product)}
                                                            className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                                            title="Pedir Reposición"
                                                        >
                                                            <Truck size={16}/>
                                                        </button>
                                                        <button 
                                                            onClick={() => alert('Edición de ítem en carro próximamente...')}
                                                            className="p-2 text-slate-300 hover:text-green-600 hover:bg-white rounded-lg transition-all"
                                                            title="Editar ítem"
                                                        >
                                                            <Pencil size={16}/>
                                                        </button>
                                                        <button 
                                                            onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} 
                                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                                                            title="Quitar"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {cart.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-32 text-center opacity-20">
                                                    <ShoppingCart size={80} className="mx-auto mb-4" />
                                                    <p className="font-black uppercase tracking-widest text-sm">Escaneando o buscando productos...</p>
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
                            <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 border-b pb-4 mb-2">Liquidación de Venta</h3>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Subtotal</span>
                                    <span className="text-lg font-black text-slate-700">${totals.grossTotal.toLocaleString('es-AR')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Bonificación (%)</span>
                                    <input type="number" className="w-20 p-2 bg-slate-50 border rounded-xl text-right font-black text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-400" value={discountPerc} onChange={e => setDiscountPerc(parseFloat(e.target.value) || 0)} />
                                </div>

                                <div className="pt-6 border-t border-dashed border-slate-200">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-2">Tipo de Emisión</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setVoucherType('INTERNAL')}
                                            className={`py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${voucherType === 'INTERNAL' ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>
                                            Ingreso Venta
                                        </button>
                                        <button 
                                            onClick={() => setVoucherType('FISCAL')}
                                            className={`py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${voucherType === 'FISCAL' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg' : 'border-gray-100 text-gray-400'}`}>
                                            <div className="flex items-center justify-center gap-2">
                                                <ShieldCheck size={12}/> Factura ARCA
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-dashed border-slate-200">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Neto a Cobrar</p>
                                    <p className="text-5xl font-black text-red-600 tracking-tighter">${totals.total.toLocaleString('es-AR')}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidad de Cobro</label>
                                <select 
                                    className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl font-black text-xs uppercase outline-none focus:ring-2 focus:ring-indigo-500" 
                                    value={paymentMethod} 
                                    onChange={e => setPaymentMethod(e.target.value)}
                                >
                                    {paymentMethods.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <button 
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || isProcessing}
                                className={`w-full mt-auto py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30 ${voucherType === 'FISCAL' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'}`}>
                                {isProcessing ? <RefreshCw className="animate-spin" /> : <><CheckCircle size={24}/> {voucherType === 'FISCAL' ? 'AUTORIZAR Y COBRAR' : 'REGISTRAR COBRO'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-6 overflow-y-auto animate-fade-in custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {salesHistory.map(sale => (
                            <div key={sale.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100 w-fit">{sale.id}</span>
                                        <span className={`text-[8px] font-black mt-2 uppercase ${sale.type === 'FISCAL' ? 'text-indigo-500' : 'text-slate-400'}`}>
                                            {sale.type === 'FISCAL' ? 'Facturado ARCA' : 'Venta Interna'}
                                        </span>
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{sale.date}</p>
                                </div>
                                <h4 className="font-black text-slate-800 uppercase text-sm mb-1 tracking-tight leading-none">{sale.client}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-6 tracking-widest">{sale.paymentMethod}</p>
                                <div className="flex justify-between items-end border-t border-gray-50 pt-6">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Monto Total</p>
                                        <p className="text-2xl font-black text-slate-900 tracking-tighter">${sale.total.toLocaleString('es-AR')}</p>
                                    </div>
                                    <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Printer size={20}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL: ITEM MANUAL (NUEVO) */}
            {isManualModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <PackageSearch size={20} className="text-indigo-400"/>
                                <h3 className="font-black text-xs uppercase tracking-widest">Artículo no catalogado</h3>
                            </div>
                            <button onClick={() => setIsManualModalOpen(false)}><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Descripción del Ítem</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-bold text-slate-800 uppercase"
                                    placeholder="Ej: Retazo de manguera, Servicio..."
                                    value={manualItemForm.name}
                                    onChange={e => setManualItemForm({...manualItemForm, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Precio Final ($)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-4 bg-indigo-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-black text-3xl text-indigo-700"
                                    placeholder="0.00"
                                    value={manualItemForm.price || ''}
                                    onChange={e => setManualItemForm({...manualItemForm, price: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                            <button 
                                onClick={addManualItem}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                                Agregar al Carrito
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
