
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShoppingCart, Trash2, Search, CheckCircle, 
    Minus, Plus, RefreshCw, PlusCircle, Package, Truck, Landmark, 
    CreditCard, Banknote, FileText, Smartphone as ECheqIcon, X,
    Receipt, FileSpreadsheet, ClipboardList, Printer, Zap
} from 'lucide-react';
import { InvoiceItem, Product, Client, CashRegister } from '../types';
import { productDB, addToReplenishmentQueue } from '../services/storageService';

interface POSProps {
    initialCart?: InvoiceItem[];
    onCartUsed?: () => void;
    onTransformToRemito?: (items: InvoiceItem[]) => void;
    onTransformToBudget?: (items: InvoiceItem[]) => void;
}

const POS: React.FC<POSProps> = ({ initialCart, onCartUsed, onTransformToRemito, onTransformToBudget }) => {
    const [cart, setCart] = useState<InvoiceItem[]>(initialCart || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [clients] = useState<Client[]>(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CTACTE' | 'CHEQUE' | 'ECHEQ'>('EFECTIVO');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Estados Modales
    const [showManualModal, setShowManualModal] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [manualForm, setManualForm] = useState({ name: '', price: '' });

    useEffect(() => {
        if (initialCart) {
            setCart(initialCart);
            onCartUsed?.();
        }
    }, [initialCart]);

    useEffect(() => {
        const performSearch = async () => {
            if (searchTerm.length > 2) {
                const results = await productDB.search(searchTerm);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        };
        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const cartTotal = useMemo(() => cart.reduce((acc, curr) => acc + curr.subtotal, 0), [cart]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const exists = prev.find(i => i.product.id === product.id);
            if (exists) return prev.map(i => i.product.id === product.id ? {...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.appliedPrice} : i);
            return [...prev, { product, quantity: 1, appliedPrice: product.priceFinal, subtotal: product.priceFinal }];
        });
        setSearchTerm('');
        setSearchResults([]);
    };

    const addManualItem = () => {
        if (!manualForm.name || !manualForm.price) return;
        const price = parseFloat(manualForm.price) || 0;
        const mockProduct = {
            id: `MANUAL-${Date.now()}`,
            name: manualForm.name.toUpperCase(),
            priceFinal: price,
            internalCodes: ['NO-LISTADO'],
            stock: 0,
            costAfterDiscounts: price * 0.7
        } as Product;
        setCart(prev => [...prev, { product: mockProduct, quantity: 1, appliedPrice: price, subtotal: price }]);
        setShowManualModal(false);
        setManualForm({ name: '', price: '' });
    };

    const handleFinalizeSaleDirect = async (isInvoice: boolean = false) => {
        if (cart.length === 0) return;
        setIsProcessing(true);

        const saleId = `${isInvoice ? 'FAC' : 'TKT'}-${Date.now().toString().slice(-6)}`;
        const date = new Date().toLocaleDateString();

        for (const item of cart) {
            const p = await productDB.getById(item.product.id);
            if (p) {
                const newStock = Math.max(0, p.stock - item.quantity);
                const newPrincipal = Math.max(0, (p.stockPrincipal || 0) - item.quantity);
                await productDB.save({ ...p, stock: newStock, stockPrincipal: newPrincipal });
            }
        }

        if (paymentMethod === 'CTACTE' && selectedClient) {
            const allClients = JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]');
            const updatedClients = allClients.map((c: Client) => 
                c.id === selectedClient.id ? { ...c, balance: c.balance + cartTotal } : c
            );
            localStorage.setItem('ferrecloud_clients', JSON.stringify(updatedClients));
        }

        const history = JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]');
        history.unshift({ id: saleId, date, client: selectedClient?.name || 'Consumidor Final', total: cartTotal, method: paymentMethod, type: isInvoice ? 'FACTURA' : 'TICKET' });
        localStorage.setItem('ferrecloud_sales_history', JSON.stringify(history));

        window.dispatchEvent(new Event('ferrecloud_request_pulse'));
        setCart([]);
        setSelectedClient(null);
        setIsProcessing(false);
        setShowFinishModal(false);
        alert(`✅ ${isInvoice ? 'Factura' : 'Venta'} #${saleId} generada exitosamente.`);
    };

    return (
        <div className="h-full flex gap-4 p-4 bg-slate-100 overflow-hidden font-sans">
            <div className="flex-[3] flex flex-col gap-4 overflow-hidden">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex gap-4 shrink-0 relative z-[60]">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                        <input 
                            className="w-full pl-12 p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-sm uppercase focus:bg-white focus:border-indigo-500 outline-none"
                            placeholder="ESCANEÉ CÓDIGO O BUSQUE ARTÍCULO..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-[2rem] shadow-2xl border p-2 max-h-80 overflow-y-auto">
                                {searchResults.map(p => (
                                    <button key={p.id} onClick={() => addToCart(p)} className="w-full p-4 hover:bg-indigo-50 rounded-2xl flex justify-between items-center transition-colors border-b last:border-0">
                                        <div className="text-left">
                                            <p className="font-black text-xs uppercase">{p.name}</p>
                                            <p className="text-[8px] font-bold text-indigo-500">SKU: {p.internalCodes[0]} • STOCK: {p.stock}</p>
                                        </div>
                                        <p className="font-black text-indigo-600 text-sm">${p.priceFinal.toLocaleString()}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowManualModal(true)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all flex items-center gap-2 font-black text-xs uppercase">
                        <PlusCircle size={20}/> Ítem Libre
                    </button>
                    <select className="w-64 p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-xs uppercase" value={selectedClient?.id || ''} onChange={e => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}>
                        <option value="">CONSUMIDOR FINAL</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest sticky top-0 z-10">
                                <tr>
                                    <th className="px-8 py-5">Descripción Mercadería</th>
                                    <th className="px-8 py-5 text-center">Cant.</th>
                                    <th className="px-8 py-5 text-right">Precio</th>
                                    <th className="px-8 py-5 text-right">Subtotal</th>
                                    <th className="px-8 py-5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cart.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-4">
                                            <p className="font-black text-slate-800 text-xs uppercase">{item.product.name}</p>
                                            <p className="text-[9px] font-mono text-slate-400">SKU: {item.product.internalCodes[0]}</p>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center justify-center gap-2 bg-slate-50 border rounded-xl p-1 w-fit mx-auto">
                                                <button onClick={() => {
                                                    const q = Math.max(1, item.quantity - 1);
                                                    setCart(prev => prev.map((it, i) => i === idx ? {...it, quantity: q, subtotal: q * it.appliedPrice} : it));
                                                }} className="text-slate-400 hover:text-red-500"><Minus size={14}/></button>
                                                <span className="font-black text-xs w-8 text-center">{item.quantity}</span>
                                                <button onClick={() => {
                                                    const q = item.quantity + 1;
                                                    setCart(prev => prev.map((it, i) => i === idx ? {...it, quantity: q, subtotal: q * it.appliedPrice} : it));
                                                }} className="text-slate-400 hover:text-indigo-600"><Plus size={14}/></button>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-right font-bold text-slate-400">${item.appliedPrice.toLocaleString()}</td>
                                        <td className="px-8 py-4 text-right font-black text-slate-900 text-base">${item.subtotal.toLocaleString()}</td>
                                        <td className="px-8 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button title="Enviar a Reposición" onClick={() => addToReplenishmentQueue(item.product)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><Truck size={16}/></button>
                                                <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="w-96 flex flex-col gap-4">
                <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex-1 border-t-4 border-indigo-600">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-10 border-b border-white/10 pb-6">Resumen y Pago</h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'EFECTIVO', icon: Banknote },
                                { id: 'TARJETA', icon: CreditCard },
                                { id: 'TRANSFERENCIA', icon: Landmark },
                                { id: 'CTACTE', icon: FileText },
                                { id: 'CHEQUE', icon: FileText },
                                { id: 'ECHEQ', icon: ECheqIcon },
                            ].map(m => (
                                <button key={m.id} onClick={() => setPaymentMethod(m.id as any)} className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${paymentMethod === m.id ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                                    <m.icon size={14}/> {m.id}
                                </button>
                            ))}
                        </div>
                        <div className="pt-10 border-t border-white/10">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total a Cobrar</p>
                            <p className="text-6xl font-black tracking-tighter">${cartTotal.toLocaleString('es-AR')}</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setShowFinishModal(true)}
                    disabled={cart.length === 0 || isProcessing}
                    className="w-full bg-indigo-600 hover:bg-indigo-50 text-white py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 transition-all disabled:opacity-30">
                    <CheckCircle size={24}/> FINALIZAR VENTA
                </button>
            </div>

            {/* MODAL ARTÍCULO MANUAL */}
            {showManualModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="font-black uppercase text-sm tracking-widest">Carga Manual</h3>
                            <button onClick={() => setShowManualModal(false)}><X size={24}/></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Descripción del Ítem</label>
                                <input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold uppercase" value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Precio Final ($)</label>
                                <input type="number" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-black text-2xl text-indigo-600" value={manualForm.price} onChange={e => setManualForm({...manualForm, price: e.target.value})} />
                            </div>
                            <button onClick={addManualItem} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Añadir al Carrito</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CONSOLA DE FINALIZACIÓN */}
            {showFinishModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20"><Zap size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Cierre de Operación</h3>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Seleccione el destino de los documentos</p>
                                </div>
                            </div>
                            <button onClick={() => setShowFinishModal(false)}><X size={28}/></button>
                        </div>

                        <div className="p-10 space-y-10 bg-slate-50/50">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Total a Procesar</p>
                                <h2 className="text-6xl font-black text-slate-900 tracking-tighter">${cartTotal.toLocaleString('es-AR')}</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handleFinalizeSaleDirect(true)}
                                    className="p-8 bg-indigo-600 text-white rounded-[2rem] flex flex-col items-center gap-4 hover:bg-indigo-700 transition-all shadow-xl active:scale-95 group">
                                    <div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform"><Printer size={32}/></div>
                                    <div className="text-center">
                                        <p className="font-black uppercase text-sm tracking-widest">Facturar (ARCA)</p>
                                        <p className="text-[9px] font-bold text-indigo-200 mt-1 uppercase">Emite Factura Electrónica A/B</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => handleFinalizeSaleDirect(false)}
                                    className="p-8 bg-slate-900 text-white rounded-[2rem] flex flex-col items-center gap-4 hover:bg-slate-800 transition-all shadow-xl active:scale-95 group">
                                    <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><Receipt size={32}/></div>
                                    <div className="text-center">
                                        <p className="font-black uppercase text-sm tracking-widest">Ticket / Venta</p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Registro directo de salida de stock</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => onTransformToRemito?.(cart)}
                                    className="p-8 bg-white border-2 border-indigo-100 text-indigo-600 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-indigo-50 transition-all active:scale-95 group">
                                    <div className="p-4 bg-indigo-50 rounded-2xl group-hover:scale-110 transition-transform"><ClipboardList size={32}/></div>
                                    <div className="text-center">
                                        <p className="font-black uppercase text-sm tracking-widest">Convertir a Remito</p>
                                        <p className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">Entrega pendiente o Cta Cte</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => onTransformToBudget?.(cart)}
                                    className="p-8 bg-white border-2 border-emerald-100 text-emerald-600 rounded-[2rem] flex flex-col items-center gap-4 hover:bg-emerald-50 transition-all active:scale-95 group">
                                    <div className="p-4 bg-emerald-50 rounded-2xl group-hover:scale-110 transition-transform"><FileSpreadsheet size={32}/></div>
                                    <div className="text-center">
                                        <p className="font-black uppercase text-sm tracking-widest">Guardar Presupuesto</p>
                                        <p className="text-[9px] font-bold text-emerald-400 mt-1 uppercase">Reserva de precios por tiempo limitado</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100 flex justify-center">
                            <button onClick={() => setShowFinishModal(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Volver a la edición del carrito</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
