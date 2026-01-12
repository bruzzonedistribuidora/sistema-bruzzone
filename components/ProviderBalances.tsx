
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Search, DollarSign, History, Filter, 
    Download, AlertCircle, TrendingUp, Users, CheckCircle, 
    ChevronRight, Phone, ArrowUpRight, LayoutList, 
    Truck, Building2, UserSearch, Mail, MessageCircle,
    X, ArrowLeft, Printer, Landmark, Receipt, Calendar,
    CreditCard, Save, Trash2, Banknote, Smartphone as ECheqIcon, FileText
} from 'lucide-react';
import { Provider, CurrentAccountMovement, Check } from '../types';

const ProviderBalances: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    const [providers, setProviders] = useState<Provider[]>(() => {
        const saved = localStorage.getItem('ferrecloud_providers');
        return saved ? JSON.parse(saved) : [];
    });

    const [allMovements, setAllMovements] = useState<CurrentAccountMovement[]>(() => {
        const saved = localStorage.getItem('ferrecloud_movements');
        return saved ? JSON.parse(saved) : [];
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        method: 'TRANSFERENCIA',
        notes: '',
        checkId: '' // Para pagos con cheques de cartera
    });

    const [availableChecks] = useState<Check[]>(() => {
        const saved = localStorage.getItem('ferrecloud_checks');
        return saved ? JSON.parse(saved) : [];
    });

    const [filterType, setFilterType] = useState<'ALL_DEBT' | 'HIGH_DEBT'>('ALL_DEBT');

    useEffect(() => {
        localStorage.setItem('ferrecloud_providers', JSON.stringify(providers));
    }, [providers]);

    const providersWithDebt = useMemo(() => providers.filter(p => p.balance > 0), [providers]);
    
    const filteredProviders = useMemo(() => {
        return providersWithDebt.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.cuit && p.cuit.includes(searchTerm));
            if (filterType === 'HIGH_DEBT') return matchesSearch && p.balance > 250000;
            return matchesSearch;
        }).sort((a, b) => b.balance - a.balance);
    }, [providersWithDebt, searchTerm, filterType]);

    const totalDebt = useMemo(() => providersWithDebt.reduce((acc, curr) => acc + curr.balance, 0), [providersWithDebt]);

    const handleRegisterPayment = () => {
        if (!selectedProvider || !paymentForm.amount) return;
        const amountNum = parseFloat(paymentForm.amount);

        const newBalance = selectedProvider.balance - amountNum;
        const newMovement: CurrentAccountMovement = {
            id: `OP-${Date.now().toString().slice(-6)}`,
            providerId: selectedProvider.id,
            date: new Date().toLocaleDateString(),
            voucherType: 'ORDEN DE PAGO',
            description: `Pago con ${paymentForm.method}. ${paymentForm.notes}`,
            debit: 0,
            credit: amountNum,
            balance: newBalance
        };

        const updatedMovements = [newMovement, ...allMovements];
        localStorage.setItem('ferrecloud_movements', JSON.stringify(updatedMovements));
        setAllMovements(updatedMovements);

        const updatedProviders = providers.map(p => p.id === selectedProvider.id ? { ...p, balance: newBalance } : p);
        setProviders(updatedProviders);
        localStorage.setItem('ferrecloud_providers', JSON.stringify(updatedProviders));
        
        // Si pagó con cheque de cartera, marcar como entregado
        if (paymentForm.method === 'CHEQUE' && paymentForm.checkId) {
            const checks: Check[] = JSON.parse(localStorage.getItem('ferrecloud_checks') || '[]');
            const updatedChecks = checks.map(c => c.id === paymentForm.checkId ? { ...c, status: 'DEPOSITED' } : c);
            localStorage.setItem('ferrecloud_checks', JSON.stringify(updatedChecks));
        }

        setIsPaymentModalOpen(false);
        setSelectedProvider(prev => prev ? { ...prev, balance: newBalance } : null);
        alert("✅ Pago registrado y deuda actualizada.");
    };

    if (selectedProvider) {
        return (
            <div className="flex flex-col h-full bg-slate-50 animate-fade-in overflow-hidden">
                <div className="bg-white p-6 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <button onClick={() => setSelectedProvider(null)} className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">
                        <ArrowLeft size={16}/> Volver
                    </button>
                    <div className="text-center">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">{selectedProvider.name}</h2>
                    </div>
                    <button onClick={() => setIsPaymentModalOpen(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
                        <DollarSign size={18}/> Registrar Pago
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Adeudado</p>
                                <h4 className="text-4xl font-black text-red-600 tracking-tighter">${selectedProvider.balance.toLocaleString('es-AR')}</h4>
                            </div>
                            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-center">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Último Comprobante</p>
                                <h4 className="text-xl font-black tracking-tight">
                                    {allMovements.find(m => m.providerId === selectedProvider.id)?.date || 'N/A'}
                                </h4>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 bg-gray-50/50 border-b border-gray-100">
                                <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm flex items-center gap-2">
                                    <Receipt size={16} className="text-indigo-600"/> Libro de Deuda del Proveedor
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em]">
                                        <tr>
                                            <th className="px-8 py-4">Fecha</th>
                                            <th className="px-8 py-4">Concepto</th>
                                            <th className="px-8 py-4 text-right">Monto</th>
                                            <th className="px-8 py-4 text-right">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[11px]">
                                        {allMovements.filter(m => m.providerId === selectedProvider.id).map(m => (
                                            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-4 font-bold text-slate-400">{m.date}</td>
                                                <td className="px-8 py-4">
                                                    <p className="font-black text-slate-800 uppercase leading-none mb-1">{m.voucherType}</p>
                                                    <p className="text-[9px] text-slate-400 truncate max-w-[300px]">{m.description}</p>
                                                </td>
                                                <td className={`px-8 py-4 text-right font-black ${m.debit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    ${(m.debit || m.credit).toLocaleString('es-AR')}
                                                </td>
                                                <td className="px-8 py-4 text-right font-black text-slate-900">${(m.balance || 0).toLocaleString('es-AR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {isPaymentModalOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                                <h3 className="font-black uppercase tracking-widest text-sm">Registrar Pago a Proveedor</h3>
                                <button onClick={() => setIsPaymentModalOpen(false)}><X size={24}/></button>
                            </div>
                            <div className="p-10 space-y-6 bg-slate-50/50">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Importe a Cancelar ($)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-5 bg-white border-2 border-slate-200 rounded-[2rem] focus:border-indigo-600 outline-none font-black text-4xl text-slate-800 text-center shadow-inner" 
                                        value={paymentForm.amount} 
                                        onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                                        autoFocus 
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    {['TRANSFERENCIA', 'CHEQUE', 'E-CHEQ', 'EFECTIVO'].map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => setPaymentForm({...paymentForm, method: m})}
                                            className={`py-3 rounded-xl font-black text-[9px] uppercase border-2 transition-all flex items-center justify-center gap-2 ${paymentForm.method === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-200 bg-white text-slate-400'}`}>
                                            {m === 'EFECTIVO' && <Banknote size={14}/>}
                                            {m === 'TRANSFERENCIA' && <Landmark size={14}/>}
                                            {m === 'CHEQUE' && <FileText size={14}/>}
                                            {m.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>

                                {paymentForm.method === 'CHEQUE' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-indigo-600 uppercase ml-2">Seleccionar de Cartera</label>
                                        <select 
                                            className="w-full p-3 bg-white border rounded-xl font-black text-[10px] uppercase shadow-sm"
                                            value={paymentForm.checkId}
                                            onChange={e => setPaymentForm({...paymentForm, checkId: e.target.value})}
                                        >
                                            <option value="">-- ELEGIR CHEQUE --</option>
                                            {availableChecks.filter(c => c.status === 'PENDING').map(c => (
                                                <option key={c.id} value={c.id}>#{c.number} - {c.bank} (${c.amount.toLocaleString()})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <textarea 
                                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-xs uppercase h-20 resize-none shadow-sm" 
                                    placeholder="Notas adicionales..." 
                                    value={paymentForm.notes}
                                    onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                                />
                                
                                <button onClick={handleRegisterPayment} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all">
                                    <Save size={20}/> Registrar Orden de Pago
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex h-full bg-slate-50 animate-fade-in overflow-hidden">
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="p-6 border-b border-gray-100 bg-slate-900 text-white">
                    <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <Truck className="text-indigo-400"/> Saldos Prov.
                    </h2>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Deuda a Pagar</p>
                            <h3 className="text-2xl font-black text-orange-600 tracking-tighter">${totalDebt.toLocaleString('es-AR')}</h3>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Buscar Proveedor</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                            <input 
                                type="text" 
                                placeholder="Nombre o CUIT..." 
                                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-white">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Cuentas Corrientes Proveedores</h1>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Saldo Acreedor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProviders.map(prov => (
                                <tr key={prov.id} className="hover:bg-slate-50 transition-all">
                                    <td className="px-8 py-5">
                                        <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1.5">{prov.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">{prov.cuit}</p>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-lg tracking-tighter text-slate-800">
                                        ${prov.balance.toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button 
                                            onClick={() => setSelectedProvider(prov)}
                                            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mx-auto">
                                            Historial y Pagos <ChevronRight size={14}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default ProviderBalances;
