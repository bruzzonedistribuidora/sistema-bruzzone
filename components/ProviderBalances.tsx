
import React, { useState, useMemo } from 'react';
import { 
    Search, DollarSign, History, Filter, 
    Download, AlertCircle, TrendingUp, Users, CheckCircle, 
    ChevronRight, Phone, ArrowUpRight, LayoutList, 
    Truck, Building2, UserSearch, Mail, MessageCircle,
    X, ArrowLeft, Printer, Landmark, Receipt, Calendar,
    CreditCard, Save
} from 'lucide-react';
import { Provider, CurrentAccountMovement } from '../types';

interface ProviderBalancesProps {
    onNavigateToHistory?: (provider: Provider) => void;
}

const ProviderBalances: React.FC<ProviderBalancesProps> = ({ onNavigateToHistory }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    // Carga de proveedores desde localStorage
    const [providers, setProviders] = useState<Provider[]>(() => {
        const saved = localStorage.getItem('ferrecloud_providers');
        return saved ? JSON.parse(saved) : [];
    });

    // Carga de movimientos generales (Compras y Pagos)
    const [allMovements, setAllMovements] = useState<CurrentAccountMovement[]>(() => {
        const saved = localStorage.getItem('ferrecloud_movements');
        return saved ? JSON.parse(saved) : [];
    });

    const [filterType, setFilterType] = useState<'ALL_DEBT' | 'HIGH_DEBT'>('ALL_DEBT');

    // Filtrar proveedores que tienen deuda (balance > 0)
    const providersWithDebt = useMemo(() => providers.filter(p => p.balance > 0), [providers]);
    
    const filteredProviders = useMemo(() => {
        return providersWithDebt.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.cuit.includes(searchTerm);
            if (filterType === 'HIGH_DEBT') return matchesSearch && p.balance > 250000;
            return matchesSearch;
        }).sort((a, b) => b.balance - a.balance);
    }, [providersWithDebt, searchTerm, filterType]);

    const totalDebt = useMemo(() => providersWithDebt.reduce((acc, curr) => acc + curr.balance, 0), [providersWithDebt]);

    // Filtrar movimientos específicos del proveedor seleccionado
    const providerMovements = useMemo(() => {
        if (!selectedProvider) return [];
        return allMovements
            .filter(m => m.providerId === selectedProvider.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allMovements, selectedProvider]);

    const handleRegisterPayment = (amount: number, method: string, notes: string) => {
        if (!selectedProvider || amount <= 0) return;

        const newBalance = selectedProvider.balance - amount;
        const newMovement: CurrentAccountMovement = {
            id: `PAG-${Date.now().toString().slice(-6)}`,
            providerId: selectedProvider.id,
            date: new Date().toLocaleDateString(),
            voucherType: 'ORDEN DE PAGO',
            description: `Pago a cuenta vía ${method}. ${notes}`,
            debit: 0,
            credit: amount,
            balance: newBalance
        };

        const updatedMovements = [newMovement, ...allMovements];
        const updatedProviders = providers.map(p => p.id === selectedProvider.id ? { ...p, balance: newBalance } : p);

        setAllMovements(updatedMovements);
        setProviders(updatedProviders);
        setSelectedProvider({ ...selectedProvider, balance: newBalance });
        
        localStorage.setItem('ferrecloud_movements', JSON.stringify(updatedMovements));
        localStorage.setItem('ferrecloud_providers', JSON.stringify(updatedProviders));
        
        setIsPaymentModalOpen(false);
        alert("Pago registrado y saldo actualizado correctamente.");
    };

    if (selectedProvider) {
        return (
            <div className="flex flex-col h-full bg-slate-50 animate-fade-in overflow-hidden">
                <div className="bg-white p-6 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <button onClick={() => setSelectedProvider(null)} className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">
                        <ArrowLeft size={16}/> Volver al Listado
                    </button>
                    <div className="text-center">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">{selectedProvider.name}</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">CUIT: {selectedProvider.cuit}</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all"><Printer size={18}/></button>
                        <button onClick={() => setIsPaymentModalOpen(true)} className="bg-green-600 text-white px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all flex items-center gap-2">
                            <DollarSign size={16}/> Registrar Pago
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Adeudado</p>
                                <h4 className="text-3xl font-black text-red-600 tracking-tighter">${selectedProvider.balance.toLocaleString('es-AR')}</h4>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Último Pago</p>
                                <h4 className="text-xl font-black text-slate-700 tracking-tight">
                                    {providerMovements.find(m => m.credit > 0)?.date || 'N/A'}
                                </h4>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Días Promedio Pago</p>
                                <h4 className="text-2xl font-black tracking-tight">15 Días</h4>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm flex items-center gap-2">
                                    <Receipt size={16} className="text-indigo-600"/> Libro Mayor del Proveedor
                                </h3>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em]">
                                    <tr>
                                        <th className="px-8 py-4">Fecha</th>
                                        <th className="px-8 py-4">Comprobante / Detalle</th>
                                        <th className="px-8 py-4 text-right">Debe (+)</th>
                                        <th className="px-8 py-4 text-right">Haber (-)</th>
                                        <th className="px-8 py-4 text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[11px]">
                                    {providerMovements.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-4 font-bold text-slate-400">{m.date}</td>
                                            <td className="px-8 py-4">
                                                <p className="font-black text-slate-800 uppercase leading-none mb-1">{m.voucherType}</p>
                                                <p className="text-[9px] text-slate-400 font-medium uppercase truncate max-w-[200px]">{m.description}</p>
                                            </td>
                                            <td className="px-8 py-4 text-right font-black text-red-600">{m.debit > 0 ? `$${m.debit.toLocaleString('es-AR')}` : '-'}</td>
                                            <td className="px-8 py-4 text-right font-black text-green-600">{m.credit > 0 ? `$${m.credit.toLocaleString('es-AR')}` : '-'}</td>
                                            <td className="px-8 py-4 text-right font-black text-slate-900">${m.balance.toLocaleString('es-AR')}</td>
                                        </tr>
                                    ))}
                                    {providerMovements.length === 0 && (
                                        <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">Sin movimientos registrados</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {isPaymentModalOpen && (
                    <PaymentModal 
                        onClose={() => setIsPaymentModalOpen(false)} 
                        onConfirm={handleRegisterPayment}
                        providerName={selectedProvider.name}
                    />
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cuentas Corrientes Acreedoras</p>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Deuda a Pagar</p>
                            <h3 className="text-2xl font-black text-orange-600 tracking-tighter">${totalDebt.toLocaleString('es-AR')}</h3>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proveedores con Saldo</p>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{providersWithDebt.length} <span className="text-sm font-normal text-slate-400">Proveedores</span></h3>
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

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Filtrar por Nivel</label>
                        <div className="grid grid-cols-1 gap-2">
                            <button 
                                onClick={() => setFilterType('ALL_DEBT')}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all font-bold text-xs uppercase ${filterType === 'ALL_DEBT' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-50 text-gray-400 hover:bg-gray-50'}`}>
                                <LayoutList size={16}/> Todas las Deudas
                            </button>
                            <button 
                                onClick={() => setFilterType('HIGH_DEBT')}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all font-bold text-xs uppercase ${filterType === 'HIGH_DEBT' ? 'border-red-600 bg-red-50 text-red-700 shadow-sm' : 'border-gray-50 text-gray-400 hover:bg-gray-50'}`}>
                                <AlertCircle size={16}/> Críticos (+ $250k)
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 bg-slate-50 border-t border-gray-100">
                    <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                        <CheckCircle size={16}/> Programar Pagos
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-white">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Cuentas Corrientes Proveedores</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Mostrando {filteredProviders.length} de {providersWithDebt.length} cuentas con deuda activa</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr className="border-b border-gray-100">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identificación Proveedor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado Fiscal</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Saldo Acreedor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Gestión</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProviders.map(prov => (
                                <tr key={prov.id} className="hover:bg-indigo-50/20 transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-sm group-hover:scale-110 transition-transform">
                                                {prov.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1">{prov.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">{prov.cuit}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border">{prov.taxCondition || 'RI'}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <p className="text-xl font-black tracking-tighter leading-none mb-1 text-slate-800">
                                                ${prov.balance.toLocaleString('es-AR')}
                                            </p>
                                            {prov.balance > 500000 && (
                                                <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-widest border border-red-200">
                                                    Deuda Elevada
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all border border-indigo-100" title="Ver Contacto">
                                                <UserSearch size={16}/>
                                            </button>
                                            <button onClick={() => { setSelectedProvider(prov); setIsPaymentModalOpen(true); }} className="p-2.5 text-green-600 bg-green-50 hover:bg-green-600 hover:text-white rounded-xl transition-all border border-green-100" title="Informar Pago">
                                                <DollarSign size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button 
                                            onClick={() => setSelectedProvider(prov)}
                                            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                            Historial <ChevronRight size={14}/>
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

// Modal de Pago Local para el componente
const PaymentModal: React.FC<{ onClose: () => void, onConfirm: (a: number, m: string, n: string) => void, providerName: string }> = ({ onClose, onConfirm, providerName }) => {
    const [form, setForm] = useState({ amount: '', method: 'TRANSFERENCIA', notes: '' });
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                    <h3 className="font-black uppercase tracking-widest text-sm">Pago a {providerName}</h3>
                    <button onClick={onClose}><X size={24}/></button>
                </div>
                <div className="p-10 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Importe a Pagar ($)</label>
                        <input type="number" className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-green-600 outline-none font-black text-4xl text-slate-800 text-center" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} autoFocus />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-2">Medio de Pago</label>
                        <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-black text-xs uppercase" value={form.method} onChange={e => setForm({...form, method: e.target.value})}>
                            <option value="TRANSFERENCIA">Transferencia</option>
                            <option value="CHEQUE">Cheque de Terceros</option>
                            <option value="E-CHEQ">E-Cheq Propio</option>
                            <option value="EFECTIVO">Efectivo Caja</option>
                        </select>
                    </div>
                    <button onClick={() => onConfirm(parseFloat(form.amount) || 0, form.method, form.notes)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                        <Save size={20}/> Confirmar Pago
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProviderBalances;
