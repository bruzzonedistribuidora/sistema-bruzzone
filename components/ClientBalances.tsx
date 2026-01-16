
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, DollarSign, MessageCircle, Mail, History, Filter, 
    Download, AlertCircle, TrendingUp, Users, CheckCircle, 
    ChevronRight, Phone, Link2, ArrowUpRight, LayoutList, 
    PieChart, UserCheck, UserX, X, Save, Banknote, Smartphone as ECheqIcon,
    Landmark, CreditCard, FileText, RefreshCw
} from 'lucide-react';
import { Client, CurrentAccountMovement, Check, CompanyConfig } from '../types';

interface ClientBalancesProps {
    onNavigateToHistory?: (client: Client) => void;
}

const ClientBalances: React.FC<ClientBalancesProps> = ({ onNavigateToHistory }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);

    const companyConfig: CompanyConfig = useMemo(() => {
        const saved = localStorage.getItem('company_config');
        return saved ? JSON.parse(saved) : { fantasyName: 'Ferretería' };
    }, []);

    const loadClients = () => {
        const saved = localStorage.getItem('ferrecloud_clients');
        setClients(saved ? JSON.parse(saved) : []);
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 1000);
    };

    useEffect(() => {
        loadClients();
        window.addEventListener('storage', loadClients);
        window.addEventListener('ferrecloud_sync_pulse', loadClients);
        return () => {
            window.removeEventListener('storage', loadClients);
            window.removeEventListener('ferrecloud_sync_pulse', loadClients);
        };
    }, []);

    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedClientForReceipt, setSelectedClientForReceipt] = useState<Client | null>(null);
    const [receiptForm, setReceiptForm] = useState({
        amount: '',
        method: 'EFECTIVO',
        notes: '',
        checkNumber: '',
        checkBank: '',
        checkDueDate: new Date().toISOString().split('T')[0]
    });

    const [filterType, setFilterType] = useState<'ALL_DEBT' | 'HIGH_DEBT'>('ALL_DEBT');

    const filteredClients = useMemo(() => {
        return clients.filter(c => {
            const matchesSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (c.cuit || '').includes(searchTerm) ||
                                 (c.dni || '').includes(searchTerm);
            
            if (searchTerm.trim() === '') {
                if (filterType === 'HIGH_DEBT') return c.balance > 100000;
                return c.balance > 0;
            }
            
            return matchesSearch;
        }).sort((a, b) => (b.balance || 0) - (a.balance || 0));
    }, [clients, searchTerm, filterType]);

    const totalDebt = useMemo(() => 
        clients.reduce((acc, curr) => acc + (curr.balance || 0), 0), 
    [clients]);

    const handleWhatsAppReminder = (client: Client) => {
        if (!client.phone) {
            alert("El cliente no tiene un número de teléfono registrado.");
            return;
        }

        const cleanPhone = client.phone.replace(/\D/g, '');
        const businessName = companyConfig.fantasyName || 'la ferretería';
        const amount = client.balance.toLocaleString('es-AR', { minimumFractionDigits: 2 });
        
        const message = `Hola ${client.name}, te contactamos de ${businessName} referente a tu cuenta corriente. Tu saldo pendiente actual es de $${amount}. ¿Podrías confirmarnos cuándo podrías regularizarlo? ¡Muchas gracias!`;
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    };

    const handleSaveReceipt = () => {
        if (!selectedClientForReceipt || !receiptForm.amount) return;
        const amountNum = parseFloat(receiptForm.amount);
        
        const newBalance = (selectedClientForReceipt.balance || 0) - amountNum;
        const receiptId = `REC-${Date.now().toString().slice(-6)}`;
        
        const updatedClients = clients.map(c => c.id === selectedClientForReceipt.id ? { ...c, balance: newBalance } : c);
        setClients(updatedClients);
        localStorage.setItem('ferrecloud_clients', JSON.stringify(updatedClients));

        const movements: CurrentAccountMovement[] = JSON.parse(localStorage.getItem('ferrecloud_movements') || '[]');
        movements.push({
            id: receiptId,
            clientId: selectedClientForReceipt.id,
            date: new Date().toLocaleDateString(),
            voucherType: 'RECIBO DE PAGO',
            description: `Cobro en ${receiptForm.method}. ${receiptForm.notes}`,
            debit: 0,
            credit: amountNum,
            balance: newBalance
        });
        localStorage.setItem('ferrecloud_movements', JSON.stringify(movements));

        if (receiptForm.method === 'CHEQUE' || receiptForm.method === 'E-CHEQ') {
            const checks: Check[] = JSON.parse(localStorage.getItem('ferrecloud_checks') || '[]');
            const newCheck: Check = {
                id: `C-${Date.now()}`,
                number: receiptForm.checkNumber || 'S/N',
                bank: receiptForm.checkBank || 'S/D',
                issuer: selectedClientForReceipt.name,
                amount: amountNum,
                dueDate: receiptForm.checkDueDate,
                status: 'PENDING',
                type: receiptForm.method === 'E-CHEQ' ? 'ECHEQ' : 'FISICO'
            };
            localStorage.setItem('ferrecloud_checks', JSON.stringify([newCheck, ...checks]));
        }

        setIsReceiptModalOpen(false);
        setSelectedClientForReceipt(null);
        setReceiptForm({ amount: '', method: 'EFECTIVO', notes: '', checkNumber: '', checkBank: '', checkDueDate: new Date().toISOString().split('T')[0] });
        
        window.dispatchEvent(new Event('ferrecloud_request_pulse'));
        alert("✅ Recibo emitido y saldo actualizado correctamente.");
    };

    return (
        <div className="flex h-full bg-slate-50 animate-fade-in overflow-hidden font-sans">
            {/* BARRA LATERAL DE RESUMEN */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 shadow-xl z-10">
                <div className="p-6 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <DollarSign className="text-green-400" size={20}/> Saldos Clientes
                    </h2>
                    {isSyncing && <RefreshCw size={14} className="animate-spin text-indigo-400"/>}
                </div>

                <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 shadow-inner">
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1.5 ml-1">Total Deuda de Clientes</p>
                            <h3 className="text-3xl font-black text-red-600 tracking-tighter">${totalDebt.toLocaleString('es-AR')}</h3>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Buscador Inteligente</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18}/>
                            <input 
                                type="text" 
                                placeholder="NOMBRE, CUIT O DNI..." 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none text-sm font-black text-slate-800 transition-all shadow-sm uppercase"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Segmentación</p>
                        <button onClick={() => setFilterType('ALL_DEBT')} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${filterType === 'ALL_DEBT' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-50 bg-white text-slate-400'}`}>
                            <span className="text-[10px] font-black uppercase">Todos con Deuda</span>
                            <ChevronRight size={14}/>
                        </button>
                        <button onClick={() => setFilterType('HIGH_DEBT')} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${filterType === 'HIGH_DEBT' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md' : 'border-slate-50 bg-white text-slate-400'}`}>
                            <span className="text-[10px] font-black uppercase">Deudas &gt; $100.000</span>
                            <ChevronRight size={14}/>
                        </button>
                    </div>
                </div>
            </aside>

            {/* LISTADO PRINCIPAL */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Cuentas Corrientes</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Monitoreo de créditos y aplicaciones de pagos</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={loadClients} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"><RefreshCw size={18}/></button>
                        <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2"><Download size={16}/> Exportar Listado</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0 z-10 border-b">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Entidad / Cliente</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Saldo en Cuenta</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredClients.map(client => (
                                <tr key={client.id} className="hover:bg-slate-50 transition-all group">
                                    <td className="px-10 py-6">
                                        <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none mb-1.5 group-hover:text-indigo-600 transition-colors">{client.name}</p>
                                        <div className="flex gap-4">
                                            <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter uppercase">ID: {client.id.slice(-6)}</p>
                                            {client.phone && <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter uppercase flex items-center gap-1"><Phone size={10}/> {client.phone}</p>}
                                        </div>
                                    </td>
                                    <td className={`px-10 py-6 text-right font-black text-2xl tracking-tighter ${client.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        ${(client.balance || 0).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => { setSelectedClientForReceipt(client); setIsReceiptModalOpen(true); }}
                                                className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                                                <CheckCircle size={16}/> Cobrar
                                            </button>
                                            {client.balance > 0 && (
                                                <button 
                                                    onClick={() => handleWhatsAppReminder(client)}
                                                    title="Reclamar deuda por WhatsApp"
                                                    className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all border border-green-100 shadow-sm">
                                                    <MessageCircle size={18}/>
                                                </button>
                                            )}
                                            <button onClick={() => onNavigateToHistory?.(client)} className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                                <History size={18}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* MODAL RECIBO PROFESIONAL */}
            {isReceiptModalOpen && selectedClientForReceipt && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg"><DollarSign size={24}/></div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-widest leading-none">Generar Recibo de Pago</h3>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Cliente: {selectedClientForReceipt.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsReceiptModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
                        </div>
                        <div className="p-10 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Importe a Acreditar ($)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className="w-full p-6 bg-white border-2 border-slate-200 rounded-[2.5rem] focus:border-emerald-600 outline-none font-black text-5xl text-slate-800 text-center shadow-inner transition-all" 
                                    value={receiptForm.amount} 
                                    onChange={e => setReceiptForm({...receiptForm, amount: e.target.value})} 
                                    autoFocus 
                                    placeholder="0.00"
                                />
                                <div className="flex justify-between items-center px-4 mt-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Saldo Adeudado Actual</p>
                                    <p className="text-sm font-black text-red-600">${selectedClientForReceipt.balance.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'E-CHEQ', 'TARJETA'].map(m => (
                                    <button 
                                        key={m}
                                        onClick={() => setReceiptForm({...receiptForm, method: m})}
                                        className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${receiptForm.method === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}>
                                        {m === 'EFECTIVO' && <Banknote size={16}/>}
                                        {m === 'TRANSFERENCIA' && <Landmark size={16}/>}
                                        {m === 'CHEQUE' && <FileText size={16}/>}
                                        {m === 'E-CHEQ' && <ECheqIcon size={16}/>}
                                        {m.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            {(receiptForm.method === 'CHEQUE' || receiptForm.method === 'E-CHEQ') && (
                                <div className="space-y-4 p-8 bg-white rounded-[2.5rem] border border-indigo-100 shadow-sm animate-fade-in">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b pb-3 mb-2">
                                        <CreditCard size={14}/> Identificación del Valor
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Entidad Emisora</label>
                                            <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-xs uppercase" placeholder="Ej: Banco Nación" value={receiptForm.checkBank} onChange={e => setReceiptForm({...receiptForm, checkBank: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1 block mb-1">Vencimiento / Fecha Disponibilidad</label>
                                        <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs" value={receiptForm.checkDueDate} onChange={e => setReceiptForm({...receiptForm, checkDueDate: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-2">Referencia de Conciliación</label>
                                <textarea 
                                    className="w-full p-5 bg-white border border-slate-200 rounded-[1.8rem] outline-none font-bold text-xs uppercase h-28 resize-none shadow-sm focus:border-indigo-500 transition-colors" 
                                    placeholder="Ej: Pago total obra San Luis..." 
                                    value={receiptForm.notes}
                                    onChange={e => setReceiptForm({...receiptForm, notes: e.target.value})}
                                />
                            </div>

                            <div className="pt-4">
                                <button onClick={handleSaveReceipt} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-95 text-xs">
                                    <Save size={20}/> Procesar Recibo Pro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientBalances;
