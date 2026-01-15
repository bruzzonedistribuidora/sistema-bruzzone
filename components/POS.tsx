import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShoppingCart, Trash2, Search, CheckCircle, 
    Minus, Plus, RefreshCw
} from 'lucide-react';
import { InvoiceItem, Product, Client, CashRegister } from '../types';
import { productDB } from '../services/storageService';

interface POSProps {
    initialCart?: InvoiceItem[];
    onCartUsed?: () => void;
    onTransformToRemito?: (items: InvoiceItem[]) => void;
    onTransformToBudget?: (items: InvoiceItem[]) => void;
}

const POS: React.FC<POSProps> = ({ initialCart, onCartUsed }) => {
    const [cart, setCart] = useState<InvoiceItem[]>(initialCart || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [clients] = useState<Client[]>(() => JSON.parse(localStorage.getItem('ferrecloud_clients') || '[]'));
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CTACTE'>('EFECTIVO');
    const [isProcessing, setIsProcessing] = useState(false);

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

    const handleFinalizeSale = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);

        const saleId = `VEN-${Date.now().toString().slice(-6)}`;
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

            const movements = JSON.parse(localStorage.getItem('ferrecloud_movements') || '[]');
            movements.push({
                id: `MOV-${Date.now()}`,
                clientId: selectedClient.id,
                date,
                voucherType: 'TICKET DE VENTA',
                description: `Venta #${saleId} en Cuenta Corriente`,
                debit: cartTotal,
                credit: 0,
                balance: (selectedClient.balance + cartTotal)
            });
            localStorage.setItem('ferrecloud_movements', JSON.stringify(movements));
        }

        if (paymentMethod !== 'CTACTE') {
            const registers: CashRegister[] = JSON.parse(localStorage.getItem('ferrecloud_registers') || '[]');
            const activeReg = registers.find(r => r.isOpen);
            if (activeReg) {
                activeReg.balance += cartTotal;
                localStorage.setItem('ferrecloud_registers', JSON.stringify(registers));
            }
        }

        const history = JSON.parse(localStorage.getItem('ferrecloud_sales_history') || '[]');
        history.unshift({ id: saleId, date, client: selectedClient?.name || 'Consumidor Final', total: cartTotal, method: paymentMethod });
        localStorage.setItem('ferrecloud_sales_history', JSON.stringify(history));

        // Enviar pulso de sincronización mediante evento
        window.dispatchEvent(new Event('ferrecloud_request_pulse'));

        setCart([]);
        setSelectedClient(null);
        setIsProcessing(false);
        alert(`✅ Venta #${saleId} finalizada con éxito.`);
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
                                            <p className="text-[8px] font-bold text-indigo-500">REF: {p.internalCodes[0]} • STOCK: {p.stock}</p>
                                        </div>
                                        <p className="font-black text-indigo-600 text-sm">${p.priceFinal.toLocaleString()}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
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
                                    <th className="px-8 py-5 text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cart.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
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
                                            <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
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
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-10 border-b border-white/10 pb-6">Resumen de Caja</h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-2">
                            {['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CTACTE'].map(m => (
                                <button key={m} onClick={() => setPaymentMethod(m as any)} className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border-2 transition-all ${paymentMethod === m ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                                    {m}
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
                    onClick={handleFinalizeSale}
                    disabled={cart.length === 0 || isProcessing}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 transition-all disabled:opacity-30">
                    {isProcessing ? <RefreshCw className="animate-spin"/> : <CheckCircle size={24}/>} 
                    {isProcessing ? 'Finalizando...' : 'FINALIZAR COBRO'}
                </button>
            </div>
        </div>
    );
};

export default POS;
